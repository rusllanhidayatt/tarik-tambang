// app/admin/page.tsx  (or pages/admin.tsx depending structure)
'use client'

import { useEffect, useState, useRef } from 'react'
import { loadData } from '../../utils/storage'
import GameBoard from '../../components/GameBoard'
import Confetti from '../../components/Confetti'
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
import { pollPlayerAnswers, pollTeamScores } from '../../lib/supabase-polling'

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
  const sfxRef = useRef({ point: null as HTMLAudioElement | null, wrong: null as HTMLAudioElement | null, win: null as HTMLAudioElement | null })
  const isRestoringRef = useRef(false) // Track if we're restoring from saved state

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
        alert('Error connecting to database. Check console for details.')
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

  function start() {
    if (rows.length === 0) return alert('Datasource kosong')
    setIndex(0)
  }

  async function next() {
    if (index + 1 >= rows.length) {
      try {
        await broadcastEvent(sessionId, 'end_game', {
          finalScores: scores,
          totalQuestions: rows.length,
        })

        setShowConfetti(true)
        alert('🎉 Semua soal sudah selesai!\nGame berakhir ✅')
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

  // Subscribe to player answers (using polling - Realtime not available)
  useEffect(() => {
    if (!sessionId) return

    console.log('🔌 Using polling for player answers (Realtime not available)')

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
        ts: new Date(answer.created_at).getTime()
      }

      setRecentAnswers(prev => [rec, ...prev].slice(0, 12))

      // Add sparkle effect
      const sparkle = { id: Date.now(), side, text: `${delta >= 0 ? '+' : ''}${delta}` }
      setSparkles(prev => [...prev, sparkle])
      setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== sparkle.id)), 1300)
    }

    // Use polling instead of Realtime
    const cleanup = pollPlayerAnswers(sessionId, handleAnswer, 1000)

    return cleanup
  }, [sessionId])

  // Subscribe to team scores (using polling)
  useEffect(() => {
    if (!sessionId) return

    console.log('🔌 Using polling for team scores (Realtime not available)')

    const handleScores = (newScores: { boy: number; girl: number }) => {
      setScores({ left: newScores.boy, right: newScores.girl })
    }

    // Use polling instead of Realtime
    const cleanup = pollTeamScores(sessionId, handleScores, 2000)

    return cleanup
  }, [sessionId])

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
    <div className="relative p-6 fade-in min-h-screen">
      {showConfetti && <Confetti />}

      {/* Session Info */}
      <div className="absolute top-2 right-4 text-xs text-slate-500">
        Session: {sessionId.slice(-8)}
      </div>

      {/* SCOREBOARD big */}
      <div className="flex justify-between items-center mb-6 gap-6">
        <div className="flex-1 flex flex-col items-center">
          <div className={`text-6xl font-extrabold drop-shadow-lg transition-all duration-300 ${
            leader === 'boy' ? 'text-blue-500 scale-110' : 'text-blue-300'
          }`}>
            👦 <motion.span key={scores.left} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>{scores.left}</motion.span>
          </div>
          <div className="mt-2 text-slate-400 text-sm">Tim Putra</div>
        </div>

        <div className="w-1/3 text-center">
          <div className="text-3xl font-black text-slate-400">VS</div>
          {index >= 0 && countdownTimer > 0 && (
            <div className={`text-3xl font-extrabold mt-2 transition-colors duration-200 ${
              countdownTimer <= 5 ? 'text-red-500' : 'text-yellow-400'
            }`}>
              ⏱ {countdownTimer}s
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className={`text-6xl font-extrabold drop-shadow-lg transition-all duration-300 ${
            leader === 'girl' ? 'text-pink-500 scale-110' : 'text-pink-300'
          }`}>
            👧 <motion.span key={scores.right} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>{scores.right}</motion.span>
          </div>
          <div className="mt-2 text-slate-400 text-sm">Tim Putri</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className="button bg-red-600 hover:bg-red-700"
          onClick={async () => {
            if (!confirm('Reset semua data game?')) return
            try {
              await clearAllGameData(sessionId)
              // Clear localStorage & sessionStorage
              Object.keys(localStorage).forEach(k => k.startsWith('tt_') && localStorage.removeItem(k))
              Object.keys(sessionStorage).forEach(k => k.startsWith('tt_') && sessionStorage.removeItem(k))
              alert('✅ Reset berhasil!')
              setIndex(-1)
              setScores({ left: 0, right: 0 })
              setShowConfetti(false)
              setRecentAnswers([])
            } catch (error) {
              console.error('Error resetting game:', error)
              alert('Error resetting game. Check console.')
            }
          }}
        >♻ Reset</button>

        {index === -1 ? (
          <button className="button" onClick={start}>🚀 Start</button>
        ) : (
          <button className="button" onClick={next}>⏭ Next</button>
        )}

        <button className="button" onClick={() => { showCorrectAuto() }}>✅ Show Correct</button>
      </div>

      {/* Main area: board + recent answers */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <GameBoard question={rows[index]} scores={scores} />
        </div>

        <div className="col-span-1">
          <div className="card p-4 sticky top-6">
            <h4 className="text-lg font-bold mb-2">Recent Answers</h4>
            <div className="space-y-2 max-h-[52vh] overflow-auto">
              {recentAnswers.length === 0 && <div className="text-slate-400 text-sm">Belum ada jawaban</div>}
              <AnimatePresence mode="popLayout">
                {recentAnswers.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        r.team === 'boy' ? 'bg-blue-500' : 'bg-pink-500'
                      }`}>
                        {r.alias?.[0]?.toUpperCase() || r.name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{r.alias}</div>
                        <div className="text-xs text-slate-400">{r.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        r.correct ? 'text-green-500' : 'text-rose-500'
                      }`}>
                        {r.correct ? `+${r.delta}` : r.delta}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(r.ts).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-4 text-xs text-slate-500">Salah akan mengurangi poin (penalty).</div>
          </div>
        </div>
      </div>

      {/* sparkles */}
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], y: -100, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute text-4xl font-black ${
              s.side === 'left'
                ? 'left-[22%] text-blue-500'
                : 'right-[22%] text-pink-500'
            }`}
          >
            {s.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modal correct */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={()=>setShowModal(false)}>
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} transition={{duration:0.2}} className="bg-white rounded-3xl p-8 max-w-md w-full text-center" onClick={(e)=>e.stopPropagation()}>
              <h3 className="text-2xl font-black mb-3">Jawaban Benar</h3>
              <div className="text-green-600 text-xl font-bold">✅ {correctAnswer}</div>
              <div className="mt-3 text-sm text-slate-500">Tekan ESC / klik luar untuk tutup</div>
              <button className="button w-full mt-6" onClick={next}>⏭ Next Question</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
