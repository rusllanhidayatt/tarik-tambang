'use client'
import { useEffect, useState, useRef } from 'react'
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
import { pollGameBroadcasts } from '../../lib/supabase-polling'

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

  // ====== Handle broadcast via Polling (Realtime fallback) ======
  useEffect(() => {
    if (!sessionId || !session) return

    console.log('🔌 Using polling for game broadcasts (Realtime not available)')

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

    // Use polling instead of Realtime (since Realtime not available)
    const cleanup = pollGameBroadcasts(sessionId, handleBroadcast, 1000)

    return cleanup
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
      <div className="card text-center p-6">
        <div className="text-xl font-semibold mb-2">Loading...</div>
        <div className="small">Connecting to game...</div>
      </div>
    )
  }

  if (expired && !DEV_MODE) {
    return (
      <div className="card text-center p-6">
        <div className="text-xl font-semibold mb-2">Sesi berakhir</div>
        <div className="small mb-4">Sesi kamu telah kedaluwarsa setelah 1 jam tidak aktif.</div>
        <a className="button" href="/">Login ulang</a>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center">
        <div>
          <div className="small"></div>
          <div className="text-lg font-semibold">{session?.name}</div>
          <div className="small">
            Tim: <b>{session?.team}</b>
          </div>
        </div>
        <div className="text-right">
          <div className="small">Waktu tersisa</div>
          <div className={`text-2xl font-bold ${timeLeft < 5 ? 'text-rose-500' : ''}`}>{timeLeft}s</div>
        </div>
      </div>

      <div className="mt-6">
        {current ? (
          <>
            <h3 className="text-xl font-semibold">{current.question}</h3>
            {!hasAnsweredState && !allAnswered ? (
              <div className="mt-3">
                <input
                  className="input"
                  placeholder="Tulis jawaban... (kosong = salah)"
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
                <div className="mt-3">
                  <button
                    className="button"
                    onClick={submit}
                    disabled={!isActive}
                  >
                    Kirim Jawaban
                  </button>
                  {!answer.trim() && isActive && (
                    <div className="mt-2 text-sm text-rose-400 font-semibold">
                      ⚠️ <strong>Warning:</strong> Submit kosong = jawaban salah (dapat penalty!)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-green-400 font-semibold">
                ✅ {allAnswered ? 'Semua pertanyaan sudah dijawab.' : 'Jawaban terkirim! Tunggu pertanyaan berikutnya.'}
              </div>
            )}
          </>
        ) : (
          <div className="small">Menunggu operator memulai soal...</div>
        )}
      </div>
    </div>
  )
}
