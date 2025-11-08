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
    // Offset berdasarkan selisih score saja: 2% per poin
    // Positif = Akhwat (right) unggul, Negatif = Ikhwan (left) unggul
    setOffset((scores.right - scores.left) * 2) // 2% per point difference
  }, [scores])

  if (!question) {
    return (
      <div className="card text-center py-32">
        <div className="text-slate-600 text-6xl mb-4">🎯</div>
        <div className="text-slate-400 text-xl font-semibold">
          Menunggu pertanyaan...
        </div>
        <div className="text-slate-500 text-sm mt-2">
          Klik "Start Game" untuk memulai
        </div>
      </div>
    )
  }

  const lead = scores.right - scores.left
  const highEnergy = Math.abs(lead) > 6

  return (
    <div className="card relative overflow-hidden">
      {/* Question Header */}
      <div className="text-center mb-8">
        {/* Category Badge */}
        {question.category && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-full mb-4"
          >
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              📚 {question.category}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.h3
            key={question.question}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="text-3xl font-bold text-white drop-shadow-lg leading-tight"
          >
            {question.question}
          </motion.h3>
        </AnimatePresence>
      </div>

      <div className="relative h-64 mt-12 flex justify-center items-center">
        {/* center guideline with pulsing indicator */}
        <motion.div
          animate={{
            scaleY: highEnergy ? [1, 1.5, 1] : 1,
            backgroundColor: highEnergy
              ? ['rgb(226, 232, 240)', 'rgb(251, 191, 36)', 'rgb(226, 232, 240)']
              : 'rgb(226, 232, 240)'
          }}
          transition={{
            scaleY: { repeat: highEnergy ? Infinity : 0, duration: 0.5 },
            backgroundColor: { repeat: highEnergy ? Infinity : 0, duration: 0.8 }
          }}
          className="absolute w-full h-1 top-1/2 -translate-y-1/2"
        />


        {/* Rope container - Realistic tug of war rope */}
        <motion.div
          key={shakeKey}
          className="absolute w-[70%] max-w-[900px] h-[18px] rounded-sm shadow-2xl overflow-hidden"
          animate={{
            x: `${offset}%`,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            mass: 0.5
          }}
          style={{
            border: '3px solid #8B4513',
            background: 'linear-gradient(180deg, #CD853F 0%, #8B4513 50%, #654321 100%)',
            borderRadius: '2px'
          }}
        >
          {/* Rope texture - stripes pattern */}
          <div className="w-full h-full relative opacity-30">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full bg-black/20"
                style={{
                  left: `${i * 8.33}%`,
                  width: '2px'
                }}
              />
            ))}
          </div>

          {/* Center marker - red ribbon */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #dc2626, transparent)',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}
          />
        </motion.div>


        {/* Boy avatar */}
        <motion.div
          animate={{
            x: offset / 2.3,
            rotate: offset > 10 ? 12 : offset > 5 ? 6 : offset < -10 ? -12 : offset < -5 ? -6 : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 140, damping: 14 },
            rotate: { type: 'spring', stiffness: 110, damping: 12 }
          }}
          className="absolute left-[6%] bottom-0 flex flex-col items-center"
        >
          <motion.div
            animate={
              highEnergy && offset < -4
                ? {
                    y: [0, -6, -3, -8, -2, 0],
                    x: [0, -2, 1, -1, 2, 0],
                    rotate: [0, -3, 2, -2, 3, 0],
                    scale: [1, 1.05, 0.97, 1.03, 0.99, 1]
                  }
                : { y: 0, x: 0, rotate: 0, scale: 1 }
            }
            transition={{
              repeat: highEnergy && offset < -4 ? Infinity : 0,
              duration: 0.6,
              ease: 'easeInOut'
            }}
          >
            <Image src="/boy.png" alt="Boy" width={120} height={120} priority />
          </motion.div>

          <motion.div
            key={scores.left}
            initial={{ scale: 1.5, y: -10, opacity: 0 }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              rotate: scores.left > scores.right ? [0, -5, 5, 0] : 0
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              rotate: { repeat: scores.left > scores.right ? 3 : 0, duration: 0.2 }
            }}
            className="text-blue-400 font-extrabold mt-2 text-2xl drop-shadow-lg"
          >
            {scores.left} pts
          </motion.div>

          {highEnergy && offset < -4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -right-4 top-8 w-4 h-4 rounded-full bg-blue-400/30 blur-sm"
            />
          )}
        </motion.div>

        {/* Girl avatar */}
        <motion.div
          animate={{
            x: offset / 2.3,
            rotate: offset > 10 ? 12 : offset > 5 ? 6 : offset < -10 ? -12 : offset < -5 ? -6 : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 140, damping: 14 },
            rotate: { type: 'spring', stiffness: 110, damping: 12 }
          }}
          className="absolute right-[6%] bottom-0 flex flex-col items-center"
        >
          <motion.div
            animate={
              highEnergy && offset > 4
                ? {
                    y: [0, -6, -3, -8, -2, 0],
                    x: [0, 2, -1, 1, -2, 0],
                    rotate: [0, 3, -2, 2, -3, 0],
                    scale: [1, 1.05, 0.97, 1.03, 0.99, 1]
                  }
                : { y: 0, x: 0, rotate: 0, scale: 1 }
            }
            transition={{
              repeat: highEnergy && offset > 4 ? Infinity : 0,
              duration: 0.6,
              ease: 'easeInOut'
            }}
          >
            <Image src="/girl.png" alt="Girl" width={120} height={120} priority />
          </motion.div>

          <motion.div
            key={scores.right}
            initial={{ scale: 1.5, y: -10, opacity: 0 }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              rotate: scores.right > scores.left ? [0, 5, -5, 0] : 0
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              rotate: { repeat: scores.right > scores.left ? 3 : 0, duration: 0.2 }
            }}
            className="text-pink-400 font-extrabold mt-2 text-2xl drop-shadow-lg"
          >
            {scores.right} pts
          </motion.div>

          {highEnergy && offset > 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -left-4 top-8 w-4 h-4 rounded-full bg-pink-400/30 blur-sm"
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
