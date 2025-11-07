// components/GameBoard.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function GameBoard({ question, scores }: any) {
  const [shakeKey, setShakeKey] = useState(0)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setShakeKey(k => k + 1)
    const total = (scores.left + scores.right) || 1
    setOffset(((scores.right - scores.left) / total) * 40) // offset % -40..40
  }, [scores])

  if (!question) {
    return (
      <div className="card text-center mt-6 py-24 opacity-70">
        <div className="text-slate-400 text-xl font-semibold">
          Menunggu pertanyaan...
        </div>
      </div>
    )
  }

  const lead = scores.right - scores.left
  const highEnergy = Math.abs(lead) > 6

  return (
    <div className="card text-center mt-6 relative pb-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.h3
          key={question.question}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-bold mb-6 drop-shadow-md"
        >
          {question.question}
        </motion.h3>
      </AnimatePresence>

      <div className="relative h-64 mt-12 flex justify-center items-center">
        {/* center guideline */}
        <div className="absolute w-full h-1 bg-slate-200 top-1/2 -translate-y-1/2" />

        {/* Rope container */}
        <motion.div
          key={shakeKey}
          className="absolute w-[70%] max-w-[900px] h-[20px] rounded-full shadow-2xl overflow-hidden"
          animate={{
            x: `${offset}%`,
            rotate: offset !== 0 ? [0, offset > 0 ? 4 : -4, 0] : 0,
            scale: highEnergy ? 1.02 : 1
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          style={{ border: '4px solid rgba(0,0,0,0.55)', background: '#111' }}
        >
          {/* gradient moving inside rope */}
          <motion.div
            className="w-full h-full"
            animate={{
              background: offset > 6
                ? ["linear-gradient(90deg,#ff8fb1,#ffd36b)","linear-gradient(90deg,#ffd36b,#ff8fb1)"]
                : offset < -6
                ? ["linear-gradient(90deg,#7db7ff,#ffe36b)","linear-gradient(90deg,#ffe36b,#7db7ff)"]
                : ["linear-gradient(90deg,#7db7ff,#ffd36b,#ff8fb1)","linear-gradient(90deg,#ff8fb1,#7db7ff,#ffd36b)"]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{ minWidth: '300%' }}
          />
        </motion.div>

        {/* sparks / fire effect when high energy */}
        <AnimatePresence>
          {highEnergy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9, y: offset > 0 ? -8 : 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`absolute top-1/2 -translate-y-1/2 w-[60%] pointer-events-none`}
              style={{ left: offset > 0 ? '10%' : '30%' }}
            >
              <div className={`w-full h-8 blur-[6px] ${offset > 0 ? 'bg-pink-400/40' : 'bg-blue-400/40'}`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boy avatar */}
        <motion.div
          animate={{ x: offset > 0 ? -offset / 2.2 : 0, rotate: offset > 6 ? -6 : 0 }}
          transition={{ duration: 0.35 }}
          className="absolute left-[6%] bottom-0 flex flex-col items-center"
        >
          <motion.div
            animate={ highEnergy && offset < 0 ? { y: [0, -8, 0] } : { y: 0 } }
            transition={{ repeat: highEnergy ? Infinity : 0, duration: 0.8 }}
          >
            <Image src="/boy.png" alt="Boy" width={120} height={120} priority />
          </motion.div>
          <motion.div
            animate={{ scale: scores.left > scores.right ? [1,1.15,1] : [1,1.05,1] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            className="text-blue-400 font-extrabold mt-2 text-2xl drop-shadow-lg"
          >
            {scores.left} pts
          </motion.div>
        </motion.div>

        {/* Girl avatar */}
        <motion.div
          animate={{ x: offset < 0 ? -offset / 2.2 : 0, rotate: offset < -6 ? 6 : 0 }}
          transition={{ duration: 0.35 }}
          className="absolute right-[6%] bottom-0 flex flex-col items-center"
        >
          <motion.div
            animate={ highEnergy && offset > 0 ? { y: [0, -8, 0] } : { y: 0 } }
            transition={{ repeat: highEnergy ? Infinity : 0, duration: 0.8 }}
          >
            <Image src="/girl.png" alt="Girl" width={120} height={120} priority />
          </motion.div>
          <motion.div
            animate={{ scale: scores.right > scores.left ? [1,1.15,1] : [1,1.05,1] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            className="text-pink-400 font-extrabold mt-2 text-2xl drop-shadow-lg"
          >
            {scores.right} pts
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
