'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { answerMatches, calcScore } from '../../utils/scoring'
import { players } from '../../utils/players'
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
  const timerRef = useRef<any>(null)

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
          alert('Nama tidak valid.')
          window.location.href = '/'
          return
        }

        // Get or wait for active session
        const gameSession = await getCurrentSession()
        if (!gameSession) {
          alert('Belum ada sesi game aktif. Tunggu admin memulai game.')
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
        alert('Error connecting to game. Please try again.')
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
      const confirmSubmit = confirm(
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
        alert('Kamu sudah menjawab pertanyaan ini.')
        setHasAnsweredState(true)
        setIsActive(false)
      } else {
        console.error('Error submitting answer:', error)
        alert('Error mengirim jawaban. Coba lagi.')
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

  const teamColor = session?.team === 'boy' ? 'blue' : 'pink'
  const teamBg = session?.team === 'boy' ? 'from-blue-600 to-blue-700' : 'from-pink-600 to-pink-700'
  const teamText = session?.team === 'boy' ? 'text-blue-400' : 'text-pink-400'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        {/* Player Info Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${teamBg} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
              {session?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-white">{session?.name}</div>
              <div className="text-sm text-slate-400">
                Team: <span className={`font-semibold ${teamText}`}>
                  {session?.team === 'boy' ? 'Ikhwan 👦' : 'Akhwat 👧'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Waktu Tersisa</div>
            <div className={`text-4xl font-black tabular-nums transition-colors ${
              timeLeft < 5 ? 'text-rose-500 pulse-glow' : timeLeft < 10 ? 'text-yellow-400' : 'text-emerald-400'
            }`}>
              {timeLeft}s
            </div>
          </div>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-full"
                >
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    📚 {current.category}
                  </span>
                </motion.div>
              )}

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-2xl font-bold text-white leading-relaxed">
                  {current.question}
                </h3>
              </div>

              {!hasAnsweredState && !allAnswered ? (
                <div className="space-y-4">
                  <input
                    className="input text-lg"
                    placeholder="Ketik jawaban kamu di sini..."
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

                  <button
                    className={`button w-full text-lg py-4 ${teamBg} bg-gradient-to-r`}
                    onClick={submit}
                    disabled={!isActive}
                  >
                    {isActive ? '📤 Kirim Jawaban' : '⏸️ Waktu Habis'}
                  </button>

                  {!answer.trim() && isActive && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
                      <div className="text-rose-400 font-semibold">
                        ⚠️ Jawaban kosong akan dianggap SALAH dan mendapat penalty!
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <div className="text-emerald-400 font-bold text-lg">
                    {allAnswered
                      ? 'Semua pertanyaan sudah dijawab!'
                      : 'Jawaban terkirim! Tunggu pertanyaan berikutnya.'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-slate-400 text-lg">
                Menunggu operator memulai soal...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
