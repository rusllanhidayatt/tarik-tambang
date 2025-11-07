// app/admin/page.tsx  (or pages/admin.tsx depending structure)
'use client'

import { useEffect, useState, useRef } from 'react'
import { loadData } from '../../utils/storage'
import GameBoard from '../../components/GameBoard'
import Confetti from '../../components/Confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { players } from '../../utils/players'

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
  const sfxRef = useRef({ point: null as HTMLAudioElement | null, wrong: null as HTMLAudioElement | null, win: null as HTMLAudioElement | null })

  useEffect(() => {
    const data = loadData() || []
    setRows(data)
    // preload sfx
    sfxRef.current.point = new Audio('/sfx/point.wav')
    sfxRef.current.wrong = new Audio('/sfx/wrong.wav')
    sfxRef.current.win = new Audio('/sfx/win.mp3')
  }, [])

  function broadcastQuestion(i: number) {
    const q = rows[i]
    if (!q) return
    localStorage.setItem(
      'tt_game_broadcast',
      JSON.stringify({ type: 'start_question', question: q })
    )
    setCorrectAnswer('')
    setShowModal(false)
  }

  function start() {
    if (rows.length === 0) return alert('Datasource kosong')
    setIndex(0)
  }

  function next() {
    if (index + 1 >= rows.length) {
      localStorage.setItem(
        'tt_game_broadcast',
        JSON.stringify({
          type: 'end_game',
          finalScores: scores,
          totalQuestions: rows.length,
        })
      )

      setShowConfetti(true)
      alert('🎉 Semua soal sudah selesai!\nGame berakhir ✅')
      sfxRef.current.win?.play().catch(() => {})
      return
    }

    setShowModal(false)
    setIndex(i => i + 1)
  }

  useEffect(() => {
    if (index >= 0 && rows[index]) {
      broadcastQuestion(index)
    }
  }, [index])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key?.startsWith('tt_player_answer_') && e.newValue) {
        try {
          const p = JSON.parse(e.newValue)
          // p: { player, team, questionId, answer, correct, score, ts }
          const side = p.team === 'boy' ? 'left' : 'right'
          const delta = Number(p.score || 0)
          let appliedDelta = delta

          // if wrong, apply penalty and play wrong sfx
          if (p.correct === false) {
            appliedDelta = -Math.max(1, Math.round(Math.abs(delta) || 1)) // penalty at least -1
            setScores(prev => ({ ...prev, [side]: Math.max(0, prev[side] + appliedDelta) }))
            sfxRef.current.wrong?.play().catch(()=>{})
          } else {
            setScores(prev => ({ ...prev, [side]: prev[side] + appliedDelta }))
            sfxRef.current.point?.play().catch(()=>{})
          }

          const playerName = p.player || 'Unknown'
          const playerObj = players.find(x => x.name === playerName) || players.find(x => (x.aliases||[]).includes(playerName)) || null
          const aliasDisplay = playerObj?.aliases?.[0] || playerName

          const rec = {
            id: Date.now() + Math.random(),
            name: playerObj?.name || playerName,
            alias: aliasDisplay,
            correct: !!p.correct,
            delta: appliedDelta,
            team: p.team,
            ts: Date.now()
          }

          setRecentAnswers(prev => [rec, ...prev].slice(0, 12))
          const sparkle = { id: Date.now(), side, text: `${appliedDelta >= 0 ? '+' : ''}${appliedDelta}` }
          setSparkles(prev => [...prev, sparkle])
          setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== sparkle.id)), 1300)

        } catch (err) {}
      }

      if (e.key === 'tt_game_broadcast' && e.newValue) {
        const data = JSON.parse(e.newValue)
        if (data.type === 'end_question') {
          setCorrectAnswer(data.correctAnswer)
          setShowModal(true)
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function showCorrectAuto() {
    const q = rows[index]
    if (!q) return
    localStorage.setItem(
      'tt_game_broadcast',
      JSON.stringify({ type: 'end_question', correctAnswer: q.answer })
    )
    setCorrectAnswer(q.answer)
    setShowModal(true)
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

  return (
    <div className="relative p-6 fade-in min-h-screen">
      {showConfetti && <Confetti />}

      {/* SCOREBOARD big */}
      <div className="flex justify-between items-center mb-6 gap-6">
        <div className="flex-1 flex flex-col items-center">
          <div className={`text-6xl font-extrabold drop-shadow-lg ${leader === 'boy' ? 'text-blue-500 scale-110' : 'text-blue-300'}`}>
            👦 {scores.left}
          </div>
          <div className="mt-2 text-slate-400">Tim Putra</div>
        </div>

        <div className="w-1/3 text-center">
          <div className="text-3xl font-black text-slate-400">VS</div>
          {index >= 0 && countdownTimer > 0 && (
            <motion.div animate={{ scale: [1,1.15,1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-3xl font-extrabold text-yellow-400 mt-2">
              ⏱ {countdownTimer}s
            </motion.div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className={`text-6xl font-extrabold drop-shadow-lg ${leader === 'girl' ? 'text-pink-500 scale-110' : 'text-pink-300'}`}>
            👧 {scores.right}
          </div>
          <div className="mt-2 text-slate-400">Tim Putri</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className="button bg-red-600 hover:bg-red-700"
          onClick={() => {
            Object.keys(localStorage).forEach(k => k.startsWith('tt_') && localStorage.removeItem(k))
            Object.keys(sessionStorage).forEach(k => k.startsWith('tt_') && sessionStorage.removeItem(k))
            alert('✅ Reset berhasil!')
            setIndex(-1)
            setScores({ left: 0, right: 0 })
            setShowConfetti(false)
            setRecentAnswers([])
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
              {recentAnswers.length === 0 && <div className="text-slate-400">Belum ada jawaban</div>}
              {recentAnswers.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${r.team === 'boy' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                      {r.alias?.[0]?.toUpperCase() || r.name?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{r.alias}</div>
                      <div className="text-xs text-slate-400">{r.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${r.correct ? 'text-green-500' : 'text-rose-500'}`}>{r.correct ? `+${r.delta}` : r.delta}</div>
                    <div className="text-xs text-slate-400">{new Date(r.ts).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
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
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -70, scale: 1 }}
            exit={{ opacity: 0, y: -130 }}
            transition={{ duration: 0.9 }}
            className={`absolute text-4xl font-black drop-shadow-lg ${s.side==='left' ? 'left-[22%] text-blue-400' : 'right-[22%] text-pink-400'}`}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
