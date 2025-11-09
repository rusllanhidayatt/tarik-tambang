// app/admin/page.tsx  (or pages/admin.tsx depending structure)
'use client'

import { useEffect, useState, useRef } from 'react'
import { loadData } from '../../utils/storage'
import GameBoard from '../../components/GameBoard'
import Confetti from '../../components/Confetti'
import AlertModal from '../../components/AlertModal'
import { motion, AnimatePresence } from 'framer-motion'
import { players } from '../../utils/players'
import {
  getCurrentSession,
  createGameSession,
  broadcastEvent,
  subscribeToPlayerAnswers,
  subscribeToTeamScores,
  getTeamScores,
  clearAllGameData
} from '../../lib/supabase-helpers'

export default function Admin() {
  const [rows, setRows] = useState<any[]>([])
  const [index, setIndex] = useState(-1)
  const [scores, setScores] = useState({ left: 0, right: 0 })
  const [sparkles, setSparkles] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState<string>('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [countdownTimer, setCountdownTimer] = useState<number>(0)
  const [recentAnswers, setRecentAnswers] = useState<any[]>([]) // {id,name,alias,correct,delta,team,ts}
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [motivationMsg, setMotivationMsg] = useState<string>('')
  const [showMotivation, setShowMotivation] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void; onCancel?: () => void }>({ isOpen: false, message: '', type: 'alert' })
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null)
  const sfxRef = useRef({ point: null as HTMLAudioElement | null, wrong: null as HTMLAudioElement | null, win: null as HTMLAudioElement | null })
  const isRestoringRef = useRef(false) // Track if we're restoring from saved state

  // Fun motivational messages
  const motivationalMessages = {
    boy: [
      "💪 Ikhwan lagi on fire!",
      "🔥 Mantap Ikhwan!",
      "⚡ Speed run Ikhwan!",
      "🎯 Fokus Ikhwan!",
      "💯 Perfect Ikhwan!",
      "🚀 Ikhwan unstoppable!",
      "⭐ Brilliant Ikhwan!",
      "🌟 Ikhwan dominating!"
    ],
    girl: [
      "✨ Akhwat luar biasa!",
      "💫 Keren Akhwat!",
      "🌸 Akhwat on point!",
      "🎀 Amazing Akhwat!",
      "💝 Perfect Akhwat!",
      "🦋 Akhwat unstoppable!",
      "⭐ Brilliant Akhwat!",
      "🌺 Akhwat crushing it!"
    ],
    tie: [
      "🤝 Neck and neck!",
      "⚔️ Battle continues!",
      "🔥 It's heating up!",
      "💥 Close competition!",
      "⚡ What a match!",
      "🎯 Still anyone's game!",
      "🌟 Epic showdown!"
    ]
  }

  // Show motivation message
  const showMotivationMessage = (team: 'boy' | 'girl' | 'tie') => {
    const messages = motivationalMessages[team]
    const msg = messages[Math.floor(Math.random() * messages.length)]
    setMotivationMsg(msg)
    setShowMotivation(true)
    setTimeout(() => setShowMotivation(false), 2500)
  }

  // Custom alert function
  const customAlert = (message: string) => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        message,
        type: 'alert',
        onConfirm: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          resolve()
        }
      })
    })
  }

  // Custom confirm function
  const customConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setAlertState({
        isOpen: true,
        message,
        type: 'confirm',
        onConfirm: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          if (confirmResolveRef.current) {
            confirmResolveRef.current(true)
            confirmResolveRef.current = null
          }
        },
        onCancel: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          if (confirmResolveRef.current) {
            confirmResolveRef.current(false)
            confirmResolveRef.current = null
          }
        }
      })
    })
  }

  // Initialize session and load data
  useEffect(() => {
    async function init() {
      try {
        // Load questions
        const data = await loadData()
        setRows(data)

        // Get or create session
        let session = await getCurrentSession()
        if (!session) {
          const newSessionId = await createGameSession()
          setSessionId(newSessionId)
        } else {
          setSessionId(session.session_id)
          // Load existing scores
          const teamScores = await getTeamScores(session.session_id)
          setScores({ left: teamScores.boy, right: teamScores.girl })
        }

        // Restore admin state from sessionStorage (prevent restart on reload)
        try {
          const savedState = sessionStorage.getItem('tt_admin_state')
          if (savedState) {
            const state = JSON.parse(savedState)
            if (state.sessionId === session?.session_id) {
              isRestoringRef.current = true // Mark as restoring
              setIndex(state.index ?? -1)
              console.log('✅ Restored admin state: index =', state.index)
              // Clear flag after a short delay
              setTimeout(() => { isRestoringRef.current = false }, 100)
            }
          }
        } catch (err) {
          console.warn('Could not restore admin state:', err)
        }

        // Preload sfx
        sfxRef.current.point = new Audio('/sfx/point.wav')
        sfxRef.current.wrong = new Audio('/sfx/wrong.wav')
        sfxRef.current.win = new Audio('/sfx/win.mp3')
      } catch (error) {
        console.error('Error initializing admin:', error)
        customAlert('Error connecting to database. Check console for details.')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Save admin state to sessionStorage whenever index changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('tt_admin_state', JSON.stringify({
        index,
        sessionId
      }))
    }
  }, [index, sessionId])

  async function broadcastQuestion(i: number) {
    const q = rows[i]
    if (!q || !sessionId) return

    try {
      await broadcastEvent(sessionId, 'start_question', {
        question: q,
        totalQuestions: rows.length
      })
      setCorrectAnswer('')
      setShowModal(false)
    } catch (error) {
      console.error('Error broadcasting question:', error)
    }
  }

  async function start() {
    if (rows.length === 0) {
      await customAlert('Datasource kosong')
      return
    }
    setIndex(0)
  }

  async function next() {
    if (index + 1 >= rows.length) {
      try {
        await broadcastEvent(sessionId, 'end_game', {
          finalScores: scores,
          totalQuestions: rows.length,
        })

        setGameEnded(true)
        setShowConfetti(true)
        setShowVictoryModal(true)
        sfxRef.current.win?.play().catch(() => {})
      } catch (error) {
        console.error('Error ending game:', error)
      }
      return
    }

    setShowModal(false)
    setIndex(i => i + 1)
  }

  useEffect(() => {
    // Don't auto-broadcast if we're restoring from saved state
    if (isRestoringRef.current) {
      console.log('⏭ Skipping auto-broadcast (restoring session)')
      return
    }

    if (index >= 0 && rows[index]) {
      broadcastQuestion(index)
    }
  }, [index])

  // Subscribe to player answers (using Realtime)
  useEffect(() => {
    if (!sessionId) return

    console.log('🔌 Using Realtime for player answers')

    const handleAnswer = (answer: any) => {
      const side = answer.team === 'boy' ? 'left' : 'right'
      const delta = answer.score

      // Play sound effect
      if (answer.is_correct) {
        sfxRef.current.point?.play().catch(() => {})
      } else {
        sfxRef.current.wrong?.play().catch(() => {})
      }

      // Find player info
      const playerObj = players.find(x => x.name === answer.player_name) || null
      const aliasDisplay = playerObj?.aliases?.[0] || answer.player_name

      // Add to recent answers
      const rec = {
        id: answer.id,
        name: answer.player_name,
        alias: aliasDisplay,
        correct: answer.is_correct,
        delta,
        team: answer.team,
        ts: new Date(answer.created_at).getTime(),
        answerText: answer.answer_text || answer.answer || ''
      }

      setRecentAnswers(prev => [rec, ...prev].slice(0, 12))

      // Add sparkle effect with fun reactions
      const reactions = answer.is_correct
        ? ['🔥', '⚡', '💯', '✨', '🌟', '💪', '🎯', '👏', '🚀', '💥']
        : ['😅', '💔', '😢', '😭']
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]

      const sparkle = {
        id: Date.now(),
        side,
        text: `${randomReaction} ${delta >= 0 ? '+' : ''}${delta}`,
        isCorrect: answer.is_correct
      }
      setSparkles(prev => [...prev, sparkle])
      setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== sparkle.id)), 1800)
    }

    // Use Realtime subscription
    const channel = subscribeToPlayerAnswers(sessionId, handleAnswer)

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  // Subscribe to team scores (using Realtime)
  useEffect(() => {
    if (!sessionId) return

    console.log('🔌 Using Realtime for team scores')

    const handleScoreUpdate = async (payload: any) => {
      // Fetch all team scores to get both teams
      const teamScores = await getTeamScores(sessionId)
      const newScores = { boy: teamScores.boy, girl: teamScores.girl }

      const oldScores = scores
      setScores({ left: newScores.boy, right: newScores.girl })

      // Show motivation message on score change
      if (newScores.boy > oldScores.left || newScores.girl > oldScores.right) {
        if (newScores.boy > newScores.girl) {
          showMotivationMessage('boy')
        } else if (newScores.girl > newScores.boy) {
          showMotivationMessage('girl')
        } else {
          showMotivationMessage('tie')
        }
      }
    }

    // Use Realtime subscription
    const channel = subscribeToTeamScores(sessionId, handleScoreUpdate)

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId, scores])

  async function showCorrectAuto() {
    const q = rows[index]
    if (!q || !sessionId) return

    try {
      await broadcastEvent(sessionId, 'end_question', {
        correctAnswer: q.answer,
        questionId: q.no
      })
      setCorrectAnswer(q.answer)
      setShowModal(true)
    } catch (error) {
      console.error('Error showing correct answer:', error)
    }
  }

  // Timer
  useEffect(() => {
    if (index >= 0 && rows[index]) {
      const duration = rows[index].timeSec || 15
      setCountdownTimer(duration)
      const timer = setTimeout(showCorrectAuto, duration * 1000)
      const interval = setInterval(() => setCountdownTimer(s => Math.max(0, s - 1)), 1000)
      return () => { clearTimeout(timer); clearInterval(interval) }
    }
  }, [index, rows])

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => (e.key === 'Escape' && setShowModal(false))
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const leader = scores.left > scores.right ? 'boy'
               : scores.right > scores.left ? 'girl'
               : 'tie'

  if (isLoading) {
    return (
      <div className="relative p-6 fade-in min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-slate-400">Connecting to database...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 fade-in">
      {showConfetti && <Confetti />}

      {/* Header Bar */}
      {/* <div className="flex items-center justify-between mb-6 px-4">
        <h1 className="text-2xl font-bold text-white">🎮 Admin Panel</h1>
        <div className="px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600 text-xs text-slate-300">
          Session: <span className="font-mono text-sky-400">{sessionId.slice(-8)}</span>
        </div>
      </div> */}

      {/* Motivational Message dengan efek lebih menarik */}
      <AnimatePresence>
        {showMotivation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex justify-center mb-4"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(255, 107, 53, 0.5)',
                  '0 0 40px rgba(255, 107, 53, 0.8)',
                  '0 0 20px rgba(255, 107, 53, 0.5)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="bg-gradient-to-r from-vibrant-orange via-orange-500 to-vibrant-orange text-white px-8 py-5 rounded-3xl shadow-2xl border-2 border-vibrant-orange-light backdrop-blur-sm"
            >
              <div className="text-2xl md:text-3xl font-black text-center flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🎉
                </motion.span>
                <span>{motivationMsg}</span>
                <motion.span
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 0.5, repeat: 2, delay: 0.1 }}
                >
                  🎉
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls dengan gradient glow - Dipindah ke atas */}
      <div className="flex justify-center items-center gap-2 md:gap-3 mb-6 flex-wrap">
        {index === -1 ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="button bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 font-black shadow-2xl"
            onClick={start}
            style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
          >
            <span className="flex items-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl">🚀</span>
              <span>Start Game</span>
            </span>
          </motion.button>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="button bg-gradient-to-r from-electric-blue to-cyan-600 hover:from-electric-blue-dark hover:to-cyan-700 text-sm md:text-base px-4 md:px-6 py-2 md:py-3 font-bold"
              onClick={next}
            >
              <span className="flex items-center gap-2">
                <span>⏭</span>
                <span className="hidden sm:inline">Next Question</span>
                <span className="sm:hidden">Next</span>
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="button bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-sm md:text-base px-4 md:px-6 py-2 md:py-3 font-bold"
              onClick={() => { showCorrectAuto() }}
            >
              <span className="flex items-center gap-2">
                <span>✅</span>
                <span className="hidden sm:inline">Show Answer</span>
                <span className="sm:hidden">Answer</span>
              </span>
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="button bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-sm md:text-base px-4 md:px-6 py-2 md:py-3 font-bold"
          onClick={async () => {
            const confirmed = await customConfirm('Reset semua data game? Ini akan menghapus semua progress!')
            if (!confirmed) return
            try {
              await clearAllGameData(sessionId)
              Object.keys(localStorage).forEach(k => k.startsWith('tt_') && localStorage.removeItem(k))
              Object.keys(sessionStorage).forEach(k => k.startsWith('tt_') && sessionStorage.removeItem(k))
              await customAlert('✅ Reset berhasil!')
              setIndex(-1)
              setScores({ left: 0, right: 0 })
              setShowConfetti(false)
              setRecentAnswers([])
            } catch (error) {
              console.error('Error resetting game:', error)
              customAlert('Error resetting game. Check console.')
            }
          }}
        >
          <span className="flex items-center gap-2">
            <span>🔄</span>
            <span className="hidden sm:inline">Reset Game</span>
            <span className="sm:hidden">Reset</span>
          </span>
        </motion.button>
      </div>

      {/* GameBoard - Visual Tarik Tambang */}
      <div className="mb-6">
        <GameBoard question={rows[index]} scores={scores} />
      </div>

      {/* Score Display */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-center">
          {/* Boy/Ikhwan Score */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center space-y-3"
          >
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">👦</span>
              <span>Ikhwan</span>
            </div>
            <motion.div
              className={`text-5xl md:text-7xl lg:text-8xl font-black transition-all duration-500 relative ${
                leader === 'boy' 
                  ? 'text-electric-blue-light scale-110' 
                  : 'text-electric-blue/60'
              }`}
              style={{
                textShadow: leader === 'boy' 
                  ? '0 0 30px rgba(0, 212, 255, 0.6), 0 0 60px rgba(0, 212, 255, 0.3)' 
                  : 'none'
              }}
            >
              <motion.span
                key={scores.left}
                initial={{ scale: 1.8, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25,
                  duration: 0.6
                }}
                className="count-up inline-block"
              >
                {scores.left}
              </motion.span>
              {leader === 'boy' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2 text-2xl md:text-3xl"
                >
                  👑
                </motion.div>
              )}
            </motion.div>
            <div className="text-xs text-slate-400 font-semibold">Points</div>
          </motion.div>

          {/* VS & Timer */}
          <div className="flex flex-col items-center space-y-3 md:space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-vibrant-orange via-magenta to-electric-blue bg-clip-text text-transparent"
            >
              VS
            </motion.div>
            {index >= 0 && countdownTimer > 0 && (
              <motion.div
                animate={countdownTimer <= 5 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: countdownTimer <= 5 ? Infinity : 0 }}
                className={`text-3xl md:text-4xl lg:text-5xl font-black tabular-nums transition-all duration-300 ${
                  countdownTimer <= 5 
                    ? 'text-rose-500 pulse-glow' 
                    : countdownTimer <= 10
                    ? 'text-yellow-400'
                    : 'text-vibrant-orange'
                }`}
                style={{
                  textShadow: countdownTimer <= 5
                    ? '0 0 20px rgba(239, 68, 68, 0.8)'
                    : countdownTimer <= 10
                    ? '0 0 20px rgba(251, 191, 36, 0.6)'
                    : '0 0 15px rgba(255, 107, 53, 0.4)'
                }}
              >
                {countdownTimer}s
              </motion.div>
            )}
            {index >= 0 && (
              <div className="text-xs text-slate-400 font-semibold bg-slate-800/50 px-3 md:px-4 py-2 rounded-full border border-white/10">
                Question {index + 1} / {rows.length}
              </div>
            )}
          </div>

          {/* Girl/Akhwat Score */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center space-y-3"
          >
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">👧</span>
              <span>Akhwat</span>
            </div>
            <motion.div
              className={`text-5xl md:text-7xl lg:text-8xl font-black transition-all duration-500 relative ${
                leader === 'girl' 
                  ? 'text-magenta-light scale-110' 
                  : 'text-magenta/60'
              }`}
              style={{
                textShadow: leader === 'girl' 
                  ? '0 0 30px rgba(255, 0, 255, 0.6), 0 0 60px rgba(255, 0, 255, 0.3)' 
                  : 'none'
              }}
            >
              <motion.span
                key={scores.right}
                initial={{ scale: 1.8, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25,
                  duration: 0.6
                }}
                className="count-up inline-block"
              >
                {scores.right}
              </motion.span>
              {leader === 'girl' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -left-2 text-2xl md:text-3xl"
                >
                  👑
                </motion.div>
              )}
            </motion.div>
            <div className="text-xs text-slate-400 font-semibold">Points</div>
          </motion.div>
        </div>
      </div>

      {/* Recent Answers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white">📊 Recent Answers</h4>
          <div className="text-xs text-slate-500">{recentAnswers.length} answers</div>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {recentAnswers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-600 text-5xl mb-3">📝</div>
              <div className="text-slate-400 text-sm">Belum ada jawaban</div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {recentAnswers.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25 }}
                className="p-3 rounded-xl bg-slate-800/50 border-l-4 hover:bg-slate-700/50 transition-colors"
                style={{
                  borderLeftColor: r.team === 'boy' ? '#3b82f6' : '#ec4899'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0 ${
                      r.team === 'boy' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-pink-500 to-pink-600'
                    }`}>
                      {r.alias?.[0]?.toUpperCase() || r.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{r.alias}</div>
                      <div className="text-xs text-slate-400 truncate">{r.name}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-black text-lg ${
                      r.correct ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {r.correct ? `+${r.delta}` : r.delta}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {new Date(r.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
                {r.answerText && (
                  <div className="mt-2 pl-13 text-xs">
                    <span className="text-slate-500">Jawaban: </span>
                    <span className={`font-semibold ${
                      r.correct ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {r.answerText}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          ⚠️ Jawaban salah akan mengurangi poin (penalty)
        </div>
      </div>

      {/* sparkles with reactions */}
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 0, scale: 0.5, rotate: -20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -120,
              scale: [0.5, 1.3, 1.2, 1],
              rotate: [- 20, 10, -5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className={`absolute text-5xl font-black drop-shadow-2xl ${
              s.side === 'left'
                ? 'left-[22%]'
                : 'right-[22%]'
            } ${s.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}
            style={{
              textShadow: s.isCorrect
                ? '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4)'
                : '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
            }}
          >
            {s.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dialog Jawaban Benar - Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-emerald-600/95 via-emerald-500/95 to-green-600/95 backdrop-blur-md rounded-3xl p-8 md:p-12 max-w-2xl w-full border-4 border-emerald-400 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                  className="text-6xl md:text-7xl mb-4"
                >
                  ✅
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-6">Jawaban Benar</h3>
                <div className="bg-emerald-500/30 border-4 border-emerald-300/50 rounded-2xl p-6 md:p-8 mb-8">
                  <div className="text-emerald-100 text-2xl md:text-3xl font-bold break-words">{correctAnswer}</div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button 
                    className="button bg-sky-600 hover:bg-sky-700 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 font-bold" 
                    onClick={next}
                  >
                    ⏭ Next Question
                  </button>
                  <button 
                    className="button bg-slate-600 hover:bg-slate-700 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 font-bold" 
                    onClick={() => setShowModal(false)}
                  >
                    ✕ Tutup
                  </button>
                </div>
                <div className="text-xs text-emerald-200 mt-4">
                  Tekan <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">ESC</kbd> untuk tutup
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Modal - Game End */}
      <AnimatePresence>
        {showVictoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-12 max-w-2xl w-full border-4 border-yellow-400 shadow-2xl relative overflow-hidden"
            >
              {/* Sparkles background */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400 text-4xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10 text-center">
                {/* Trophy */}
                <motion.div
                  className="text-9xl mb-6"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  🏆
                </motion.div>

                <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-2xl">
                  GAME OVER!
                </h2>

                {/* Winner Announcement */}
                <div className="mb-8">
                  {scores.left > scores.right ? (
                    <div className="bg-blue-500/20 border-4 border-blue-400 rounded-2xl p-6">
                      <div className="text-6xl mb-2">👦</div>
                      <div className="text-3xl font-black text-blue-400">IKHWAN MENANG!</div>
                      <div className="text-6xl font-black text-white mt-2">{scores.left} pts</div>
                    </div>
                  ) : scores.right > scores.left ? (
                    <div className="bg-pink-500/20 border-4 border-pink-400 rounded-2xl p-6">
                      <div className="text-6xl mb-2">👧</div>
                      <div className="text-3xl font-black text-pink-400">AKHWAT MENANG!</div>
                      <div className="text-6xl font-black text-white mt-2">{scores.right} pts</div>
                    </div>
                  ) : (
                    <div className="bg-purple-500/20 border-4 border-purple-400 rounded-2xl p-6">
                      <div className="text-6xl mb-2">🤝</div>
                      <div className="text-3xl font-black text-purple-400">SERI!</div>
                      <div className="text-4xl font-black text-white mt-2">{scores.left} - {scores.right}</div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {/* <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-blue-400 text-4xl font-black">{scores.left}</div>
                    <div className="text-sm text-slate-300 mt-1">Ikhwan</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-pink-400 text-4xl font-black">{scores.right}</div>
                    <div className="text-sm text-slate-300 mt-1">Akhwat</div>
                  </div>
                </div> */}

                <div className="text-slate-300 text-lg mb-6">
                  Total {rows.length} Pertanyaan Selesai! 🎉
                </div>

                <div className="flex gap-3">
                  <button
                    className="button flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-4"
                    onClick={async () => {
                      const confirmed = await customConfirm('Mulai game baru?')
                      if (!confirmed) return
                      try {
                        await clearAllGameData(sessionId)
                        setIndex(-1)
                        setScores({ left: 0, right: 0 })
                        setShowConfetti(false)
                        setShowVictoryModal(false)
                        setGameEnded(false)
                        setRecentAnswers([])
                      } catch (error) {
                        console.error('Error resetting:', error)
                      }
                    }}
                  >
                    🔄 Main Lagi
                  </button>
                  <button
                    className="button flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-lg py-4"
                    onClick={() => setShowVictoryModal(false)}
                  >
                    ✅ Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
          </AnimatePresence>

      {/* Alert/Confirm Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.type === 'confirm' ? 'Ya' : 'OK'}
        cancelText="Batal"
      />
    </div>
  )
}
