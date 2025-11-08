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

      <motion.div
        animate={{
          x: highEnergy && Math.abs(offset) > 10 ? [-1, 1, -1, 1, 0] : 0,
          y: highEnergy && Math.abs(offset) > 10 ? [0, -1, 1, -1, 0] : 0
        }}
        transition={{
          repeat: highEnergy && Math.abs(offset) > 10 ? Infinity : 0,
          duration: 0.15
        }}
        className="relative h-64 mt-12 flex justify-center items-center"
      >
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

        {/* Ground dust particles when highEnergy */}
        <AnimatePresence>
          {highEnergy && (
            <>
              <motion.div
                initial={{ opacity: 0, x: '-50%' }}
                animate={{
                  opacity: [0, 0.4, 0],
                  y: [0, -20, -40],
                  x: ['-50%', '-55%', '-60%'],
                  scale: [0.5, 1, 1.5]
                }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute bottom-0 left-[15%] w-16 h-16 rounded-full bg-slate-400/20 blur-md"
              />
              <motion.div
                initial={{ opacity: 0, x: '50%' }}
                animate={{
                  opacity: [0, 0.4, 0],
                  y: [0, -20, -40],
                  x: ['50%', '55%', '60%'],
                  scale: [0.5, 1, 1.5]
                }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                className="absolute bottom-0 right-[15%] w-16 h-16 rounded-full bg-slate-400/20 blur-md"
              />
            </>
          )}
        </AnimatePresence>

        {/* Rope container with tension waves */}
        <motion.div
          key={shakeKey}
          className="absolute w-[70%] max-w-[900px] h-[20px] rounded-full shadow-2xl overflow-hidden"
          animate={{
            x: `${offset}%`,
            scaleX: highEnergy ? [1, 1.05, 0.98, 1.02, 1] : 1,
            scaleY: highEnergy ? [1, 0.9, 1.1, 0.95, 1] : 1,
            rotateZ: offset !== 0 ? [0, offset > 0 ? 2 : -2, 0] : 0
          }}
          transition={{
            x: { type: 'spring', stiffness: 180, damping: 18, mass: 1 },
            scaleX: { repeat: highEnergy ? Infinity : 0, duration: 0.25, ease: 'easeInOut' },
            scaleY: { repeat: highEnergy ? Infinity : 0, duration: 0.25, ease: 'easeInOut' },
            rotateZ: { repeat: Infinity, duration: 0.4, ease: 'easeInOut' }
          }}
          style={{
            border: '4px solid rgba(0,0,0,0.6)',
            background: '#111',
            filter: highEnergy ? 'drop-shadow(0 0 8px rgba(255,215,0,0.3))' : 'none'
          }}
        >
          {/* gradient moving inside rope with energy pulses */}
          <motion.div
            className="w-full h-full relative"
            animate={{
              background: offset > 6
                ? ["linear-gradient(90deg,#ff8fb1,#ffd36b,#ff6b9d)","linear-gradient(90deg,#ffd36b,#ff6b9d,#ff8fb1)"]
                : offset < -6
                ? ["linear-gradient(90deg,#7db7ff,#ffe36b,#60a5fa)","linear-gradient(90deg,#ffe36b,#60a5fa,#7db7ff)"]
                : ["linear-gradient(90deg,#7db7ff,#ffd36b,#ff8fb1)","linear-gradient(90deg,#ff8fb1,#7db7ff,#ffd36b)"],
              x: ['-100%', '100%']
            }}
            transition={{
              background: { duration: 1.5, repeat: Infinity, ease: 'linear' },
              x: { duration: highEnergy ? 0.8 : 2, repeat: Infinity, ease: 'linear' }
            }}
            style={{ minWidth: '300%' }}
          >
            {/* Energy flash when high energy */}
            {highEnergy && (
              <motion.div
                animate={{
                  opacity: [0, 0.8, 0],
                  scaleX: [0.5, 1.5, 0.5]
                }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="absolute inset-0 bg-white/30"
              />
            )}
          </motion.div>
        </motion.div>

        {/* Enhanced sparks / energy field when high energy */}
        <AnimatePresence>
          {highEnergy && (
            <>
              {/* Main glow aura */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [0.9, 1.1, 0.9],
                  y: offset > 0 ? [-5, 5, -5] : [5, -5, 5]
                }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { repeat: Infinity, duration: 0.8 },
                  scale: { repeat: Infinity, duration: 1.2 },
                  y: { repeat: Infinity, duration: 0.6 }
                }}
                className={`absolute top-1/2 -translate-y-1/2 w-[50%] h-24 pointer-events-none blur-xl ${
                  offset > 0 ? 'bg-pink-400/40' : 'bg-blue-400/40'
                }`}
                style={{ left: offset > 0 ? '15%' : '35%' }}
              />

              {/* Sparkling particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: offset > 0 ? [0, -10, -20] : [0, 10, 20],
                    y: [0, -15, -30]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.3
                  }}
                  className={`absolute top-1/2 w-2 h-2 rounded-full ${
                    offset > 0 ? 'bg-pink-300' : 'bg-blue-300'
                  }`}
                  style={{ left: offset > 0 ? '40%' : '60%' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Boy avatar */}
        <motion.div
          animate={{
            x: offset > 0 ? -offset / 2.3 : 0,
            rotate: offset > 10 ? -12 : offset > 5 ? -6 : offset < -5 ? 4 : 0,
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
            x: offset < 0 ? -offset / 2.3 : 0,
            rotate: offset < -10 ? 12 : offset < -5 ? 6 : offset > 5 ? -4 : 0,
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
      </motion.div>
    </div>
  )
}
