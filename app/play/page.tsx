'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { answerMatches, calcScore } from '../../utils/scoring'
import { players } from '../../utils/players'
import AlertModal from '../../components/AlertModal'
import {
  getCurrentSession,
  createPlayerSession,
  updatePlayerActivity,
  submitAnswer,
  hasAnswered,
  subscribeToGameBroadcasts
} from '../../lib/supabase-helpers'

const DEV_MODE = false

export default function Play() {
  const [session, setSession] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [current, setCurrent] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [hasAnsweredState, setHasAnsweredState] = useState(false)
  const [expired, setExpired] = useState(false)
  const [allAnswered, setAllAnswered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void; onCancel?: () => void }>({ isOpen: false, message: '', type: 'alert' })
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null)
  const timerRef = useRef<any>(null)

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

  // ====== Init session ======
  useEffect(() => {
    async function init() {
      try {
        const s = sessionStorage.getItem('tt_session')
        if (!s) {
          window.location.href = '/'
          return
        }

        const parsed = JSON.parse(s)
        const now = Date.now()

        if (parsed.lastActivity && now - parsed.lastActivity > 3600000 && !DEV_MODE) {
          setExpired(true)
          setIsLoading(false)
          return
        }

        parsed.lastActivity = now
        sessionStorage.setItem('tt_session', JSON.stringify(parsed))

        const playerData = players.find(p => p.name === parsed.name)
        if (!playerData) {
          await customAlert('Nama tidak valid.')
          window.location.href = '/'
          return
        }

        // Get or wait for active session
        const gameSession = await getCurrentSession()
        if (!gameSession) {
          await customAlert('Belum ada sesi game aktif. Tunggu admin memulai game.')
          window.location.href = '/'
          return
        }

        setSessionId(gameSession.session_id)

        // Create or update player session
        try {
          await createPlayerSession(parsed.name, playerData.team, gameSession.session_id)
        } catch (err: any) {
          // Player session might already exist, update activity instead
          await updatePlayerActivity(parsed.name, gameSession.session_id)
        }

        setSession({ ...parsed, team: playerData.team })
      } catch (error) {
        console.error('Error initializing player:', error)
        customAlert('Error connecting to game. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // ====== Handle broadcast via Realtime ======
  useEffect(() => {
    if (!sessionId || !session) return

    console.log('🔌 Using Realtime for game broadcasts')

    const handleBroadcast = async (broadcast: any) => {
      // Update lastActivity
      const fresh = sessionStorage.getItem('tt_session')
      if (fresh) {
        const ps = JSON.parse(fresh)
        ps.lastActivity = Date.now()
        sessionStorage.setItem('tt_session', JSON.stringify(ps))
      }

      if (broadcast.broadcast_type === 'start_question') {
        const q = broadcast.payload.question
        console.log('📥 Received question:', q.question)
        setCurrent(q)
        setAnswer('')
        setTimeLeft(DEV_MODE ? 9999 : q.timeSec)
        setIsActive(true)

        // Check if already answered in Supabase
        const answered = await hasAnswered(session.name, q.no, sessionId)
        if (answered) {
          setHasAnsweredState(true)
          setIsActive(false)
        } else {
          setHasAnsweredState(false)
        }

        if (!DEV_MODE) startTimer(q.timeSec)

        // Check if all questions answered
        const totalQuestions = broadcast.payload.totalQuestions || 0
        let answeredCount = 0
        for (let i = 0; i < totalQuestions; i++) {
          const check = await hasAnswered(session.name, i, sessionId)
          if (check) answeredCount++
        }
        setAllAnswered(DEV_MODE ? false : answeredCount >= totalQuestions)
      }

      if (broadcast.broadcast_type === 'end_question') {
        stopTimer()
        setIsActive(false)
        setTimeLeft(0)
        setHasAnsweredState(true)
      }
    }

    // Use Realtime subscription
    const channel = subscribeToGameBroadcasts(sessionId, handleBroadcast)

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId, session])

  useEffect(() => {
    async function checkAnswered() {
      if (current && session && sessionId) {
        const answered = await hasAnswered(session.name, current.no, sessionId)
        if (answered) {
          setHasAnsweredState(true)
          setIsActive(false)
        }
      }
    }
    checkAnswered()
  }, [current, session, sessionId])

  function startTimer(sec: number) {
    stopTimer()
    setTimeLeft(sec)
    let t = sec
    timerRef.current = setInterval(() => {
      t -= 1
      setTimeLeft(t)
      if (t <= 0) {
        stopTimer()
        setIsActive(false)
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function submit() {
    if (!current || !session || !sessionId) return
    if (expired && !DEV_MODE) return
    if (!isActive) return
    if (hasAnsweredState) return

    const trimmedAnswer = answer.trim()

    // Confirm jika jawaban kosong (akan dapat penalty)
    if (!trimmedAnswer) {
      const confirmSubmit = await customConfirm(
        '⚠️ Jawaban kosong akan dianggap SALAH dan mendapat PENALTY!\n\nYakin ingin submit jawaban kosong?'
      )
      if (!confirmSubmit) return
    }

    try {
      // Jawaban kosong = salah (dapat penalty)
      const ok = trimmedAnswer ? answerMatches(current.answer, trimmedAnswer) : false
      const score = calcScore(current.timeSec, timeLeft, ok)

      await submitAnswer(
        session.name,
        session.team,
        current.no,
        trimmedAnswer || '(kosong)',
        ok,
        score,
        timeLeft,
        sessionId
      )

      setHasAnsweredState(true)
      setIsActive(false)
    } catch (error: any) {
      if (error.message === 'Already answered this question') {
        customAlert('Kamu sudah menjawab pertanyaan ini.')
        setHasAnsweredState(true)
        setIsActive(false)
      } else {
        console.error('Error submitting answer:', error)
        customAlert('Error mengirim jawaban. Coba lagi.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-2xl font-bold text-white mb-2">Loading...</div>
          <div className="text-slate-400">Connecting to game...</div>
        </div>
      </div>
    )
  }

  if (expired && !DEV_MODE) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full">
          <div className="text-6xl mb-4">⏰</div>
          <div className="text-2xl font-bold text-white mb-3">Sesi Berakhir</div>
          <div className="text-slate-400 mb-6">
            Sesi kamu telah kedaluwarsa setelah 1 jam tidak aktif.
          </div>
          <a className="button w-full" href="/">
            🔄 Login Ulang
          </a>
        </div>
      </div>
    )
  }

  const teamColor = session?.team === 'boy' ? 'electric-blue' : 'magenta'
  const teamBg = session?.team === 'boy' ? 'from-electric-blue to-electric-blue-dark' : 'from-magenta to-magenta-dark'
  const teamText = session?.team === 'boy' ? 'text-electric-blue-light' : 'text-magenta-light'
  const teamEmoji = session?.team === 'boy' ? '💪' : '✨'
  const teamBorder = session?.team === 'boy' ? 'border-electric-blue/50' : 'border-magenta/50'
  const teamGlow = session?.team === 'boy' ? 'shadow-electric-blue/30' : 'shadow-magenta/30'
  const teamTimerColor = session?.team === 'boy' ? 'text-electric-blue-light' : 'text-magenta-light'
  const teamCategoryBg = session?.team === 'boy' 
    ? 'from-electric-blue/20 to-cyan-500/20 border-electric-blue/30' 
    : 'from-magenta/20 to-pink-500/20 border-magenta/30'
  const teamCategoryText = session?.team === 'boy' ? 'text-electric-blue-light' : 'text-magenta-light'
  const teamInputBorder = session?.team === 'boy' ? 'focus:border-electric-blue focus:ring-electric-blue/30' : 'focus:border-magenta focus:ring-magenta/30'
  
  // Status messages dengan microinteraction
  const getStatusMessage = () => {
    if (!current) {
      const messages = [
        { emoji: '🎯', text: 'Operator lagi siap-siap narik tali… sabar ya!', delay: 0 },
        { emoji: '⚡', text: 'Tali udah tegang, pertanyaan sebentar lagi dimulai!', delay: 0.2 },
        { emoji: '🔥', text: 'Siap-siap! Game akan segera dimulai!', delay: 0.4 },
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }
    return null
  }
  
  const statusMsg = getStatusMessage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className={`absolute top-10 ${session?.team === 'boy' ? 'left-10' : 'right-10'} text-5xl opacity-10 animate-bounce-glow`}>
        {session?.team === 'boy' ? '👳🏻‍♂️' : '🧕🏻'}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`card max-w-2xl w-full border-2 ${teamBorder} ${teamGlow} shadow-2xl relative z-10`}
      >
        {/* Player Info Header dengan avatar besar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 pb-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${teamBg} flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-2xl border-4 border-white/20`}
            >
              {session?.name?.[0]?.toUpperCase()}
            </motion.div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">{session?.name}</div>
              <div className="text-sm sm:text-base text-slate-300">
                Team: <span className={`font-bold ${teamText} text-lg`}>
                  {session?.team === 'boy' ? 'Ikhwan' : 'Akhwat'} {teamEmoji}
                </span>
              </div>
            </div>
          </div>
          <motion.div
            animate={timeLeft < 5 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft < 5 ? Infinity : 0 }}
            className="text-center sm:text-right"
          >
            <div className="text-xs text-slate-400 mb-1 font-semibold">Waktu Tersisa</div>
            <div className={`text-5xl sm:text-6xl font-black tabular-nums transition-all duration-300 ${
              timeLeft < 5 ? 'text-rose-500 pulse-glow' : timeLeft < 10 ? 'text-yellow-400' : teamTimerColor
            }`} style={{ textShadow: `0 0 20px ${timeLeft < 5 ? 'rgba(239, 68, 68, 0.5)' : timeLeft < 10 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 212, 255, 0.3)'}` }}>
              {timeLeft}s
            </div>
          </motion.div>
        </div>

        {/* Question Area */}
        <div className="space-y-6">
          {current ? (
            <>
              {/* Category Badge */}
              {current.category && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${teamCategoryBg} border rounded-full`}
                >
                  <span className={`text-xs font-semibold ${teamCategoryText} uppercase tracking-wider`}>
                    📚 {current.category}
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl p-6 sm:p-8 border-2 ${teamBorder} backdrop-blur-sm`}
              >
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-relaxed">
                  {current.question}
                </h3>
              </motion.div>

              {!hasAnsweredState && !allAnswered ? (
                <div className="space-y-5">
                  <input
                    className={`input text-lg ${teamInputBorder}`}
                    placeholder="💭 Ketik jawaban kamu di sini..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isActive) {
                        submit()
                      }
                    }}
                    disabled={!isActive}
                    autoFocus
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`button w-full text-lg sm:text-xl py-5 ${teamBg} bg-gradient-to-r font-black`}
                    onClick={submit}
                    disabled={!isActive}
                  >
                    {isActive ? (
                      <span className="flex items-center justify-center gap-3">
                        <span>Kirim Jawaban</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <span>Waktu Habis</span>
                      </span>
                    )}
                  </motion.button>

                  {!answer.trim() && isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-r from-rose-500/20 to-red-500/20 border-2 border-rose-500/40 rounded-2xl p-4 text-center backdrop-blur-sm"
                    >
                      <div className="text-rose-300 font-bold flex items-center justify-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <span>Jawaban kosong akan dianggap SALAH dan mendapat penalty!</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-5xl mb-3"
                  >
                    {allAnswered ? '🎉' : '✅'}
                  </motion.div>
                  <div className="text-emerald-300 font-bold text-lg sm:text-xl">
                    {allAnswered
                      ? '🎊 Semua pertanyaan sudah dijawab! 🎊'
                      : '✨ Jawaban terkirim! Tunggu pertanyaan berikutnya. ✨'}
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 sm:py-16"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="text-7xl sm:text-8xl mb-6"
              >
                {statusMsg?.emoji || '🎯'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-300 text-lg sm:text-xl font-semibold"
              >
                {statusMsg?.text || 'Menunggu operator memulai soal...'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-4 text-sm text-slate-500"
              >
                ⏳ Sabar ya, game akan segera dimulai!
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>

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
