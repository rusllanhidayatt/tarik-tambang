'use client'
import { useEffect, useState, useRef } from 'react'
import { answerMatches, calcScore } from '../../utils/scoring'
import { players } from '../../utils/players'

const DEV_MODE = false

export default function Play() {
  const [session, setSession] = useState<any>(null)
  const [current, setCurrent] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [expired, setExpired] = useState(false)
  const [allAnswered, setAllAnswered] = useState(false)
  const timerRef = useRef<any>(null)

  // ====== Init session ======
  useEffect(() => {
    const s = sessionStorage.getItem('tt_session')
    if (!s) {
      window.location.href = '/'
      return
    }

    const parsed = JSON.parse(s)
    const now = Date.now()

    if (parsed.lastActivity && now - parsed.lastActivity > 3600000 && !DEV_MODE) {
      setExpired(true)
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

    setSession({ ...parsed, team: playerData.team })
  }, [])

  // ====== Handle broadcast ======
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'tt_game_broadcast' && e.newValue) {
        const payload = JSON.parse(e.newValue)

        // update lastActivity
        const fresh = sessionStorage.getItem('tt_session')
        if (fresh) {
          const ps = JSON.parse(fresh)
          ps.lastActivity = Date.now()
          sessionStorage.setItem('tt_session', JSON.stringify(ps))
        }

        if (payload.type === 'start_question') {
          const q = payload.question
          setCurrent(q)
          setAnswer('')
          setTimeLeft(DEV_MODE ? 9999 : q.timeSec) // timer super panjang di dev
          setIsActive(true)

          const answered = localStorage.getItem(`answered_${session?.name}_${q.id}`)
          if (answered) {
            setHasAnswered(true)
            setIsActive(false)
            setTimeLeft(0)
            stopTimer()
          } else {
            setHasAnswered(false)
            if (!DEV_MODE) startTimer(q.timeSec)
          }

          // cek apakah semua sudah dijawab
          const totalQuestions = payload.totalQuestions || 0
          let answeredCount = 0
          for (let i = 0; i < totalQuestions; i++) {
            const check = localStorage.getItem(`answered_${session?.name}_${i}`)
            if (check) answeredCount++
          }
          setAllAnswered(DEV_MODE ? false : answeredCount >= totalQuestions)
        }

        if (payload.type === 'end_question') {
          stopTimer()
          setIsActive(false)
          setTimeLeft(0)
          const cid = payload.questionId
          if (cid) {
            localStorage.setItem(`answered_${session?.name}_${cid}`, '1')
            setHasAnswered(true)
          }
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [session])

  useEffect(() => {
    if (current) {
      const done = localStorage.getItem(`answered_${session?.name}_${current.id}`)
      if (done) {
        setHasAnswered(true)
        setIsActive(false)
        stopTimer()
        setTimeLeft(0)
      }
    }
  }, [current, session])

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

  function submit() {
    if (!current || !session) return
    if (expired && !DEV_MODE) return
    if (!isActive) return

    const already = localStorage.getItem(`answered_${session.name}_${current.id}`)
    if (already || hasAnswered) return

    const ok = answerMatches(current.answer, answer)
    const score = calcScore(current.timeSec, timeLeft, ok)

    const payload = {
      type: 'player_answer',
      player: session.name,
      team: session.team,
      questionId: current.id,
      answer,
      correct: ok,
      score,
      ts: Date.now(),
    }

    localStorage.setItem(`answered_${session.name}_${current.id}`, '1')
    setHasAnswered(true)
    setIsActive(false)
    localStorage.setItem('tt_player_answer_' + Date.now(), JSON.stringify(payload))
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
            {!hasAnswered && !allAnswered ? (
              <div className="mt-3">
                <input
                  className="input"
                  placeholder="Tulis jawaban..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!isActive}
                />
                <div className="mt-3 flex gap-3">
                  <button className="button" onClick={submit} disabled={!isActive}>
                    Kirim Jawaban
                  </button>
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
