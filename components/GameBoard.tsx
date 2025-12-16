// components/GameBoard.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'

export default function GameBoard({ question, scores }: any) {
  const shakeKey = useMemo(() => `${scores?.left ?? 0}-${scores?.right ?? 0}`, [scores?.left, scores?.right])

  // Offset berdasarkan selisih score saja: 2% per poin
  // Positif = Akhwat (right) unggul, Negatif = Ikhwan (left) unggul
  const offset = ((scores?.right ?? 0) - (scores?.left ?? 0)) * 2

  if (!question) {
    return (
      <div className="card text-center py-32 relative overflow-hidden">
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
          className="text-7xl mb-6"
        >
          🎯
        </motion.div>
        <div className="text-slate-300 text-xl sm:text-2xl font-bold mb-3">
          Menunggu pertanyaan...
        </div>
        <div className="text-slate-400 text-sm sm:text-base mt-2">
          Klik &quot;Start Game&quot; untuk memulai
        </div>
      </div>
    )
  }

  const lead = scores.right - scores.left
  const highEnergy = Math.abs(lead) > 6
  
  // Calculate avatar offset: tim yang menang mundur ke belakang
  // Boy (left) menang -> mundur ke kiri (negatif)
  // Girl (right) menang -> mundur ke kanan (positif)
  const maxPullBack = 40 // Max mundur 40%
  const pullBackMultiplier = 3 // 3% per poin selisih
  
  const boyPullBack = scores.left > scores.right 
    ? -Math.min(maxPullBack, (scores.left - scores.right) * pullBackMultiplier)
    : 0
  
  const girlPullBack = scores.right > scores.left
    ? Math.min(maxPullBack, (scores.right - scores.left) * pullBackMultiplier)
    : 0
  
  // Center marker offset: bergeser ke arah tim yang menang
  const centerMarkerOffset = offset // 2% per poin selisih

  return (
    <div className="card relative overflow-x-visible overflow-y-hidden">
      {/* Question Header */}
      <div className="text-center mb-8">
        {/* Category Badge */}
        {question.category && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-vibrant-orange/20 via-magenta/20 to-electric-blue/20 border-2 border-vibrant-orange/40 rounded-full mb-4 backdrop-blur-sm"
          >
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              📚 {question.category}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.h3
            key={question.question}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-2xl leading-tight"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 212, 255, 0.3)'
            }}
          >
            {question.question}
          </motion.h3>
        </AnimatePresence>
      </div>

        <div className="relative h-64 sm:h-80 mt-12 flex justify-center items-center overflow-visible">
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
          className="absolute w-full h-1 top-1/2 -translate-y-1/2 z-0"
        />


        {/* Rope container - Realistic tug of war rope (STATIS di tengah) */}
        <div
          key={shakeKey}
          className="absolute w-[90%] max-w-[1000px] h-[18px] rounded-sm shadow-2xl z-10 left-1/2 -translate-x-1/2"
          style={{
            border: '3px solid #8B4513',
            background: 'linear-gradient(180deg, #CD853F 0%, #8B4513 50%, #654321 100%)',
            borderRadius: '2px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(139, 69, 19, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
            top: '50%',
            transform: 'translate(-50%, -50%)'
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

          {/* Center marker - red ribbon (BERGESER berdasarkan skor) */}
          <motion.div
            className="absolute top-0 w-8 h-full"
            animate={{
              left: `calc(50% + ${centerMarkerOffset * 0.5}%)`, // Bergeser ke arah tim yang menang
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              mass: 0.5
            }}
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, transparent, #dc2626, transparent)',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}
          />
        </div>


        {/* Boy avatar */}
        <motion.div
          animate={{
            x: `${boyPullBack}%`, // Mundur ke kiri saat menang
            rotate: scores.left > scores.right ? -12 : scores.left < scores.right ? 6 : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 140, damping: 14 },
            rotate: { type: 'spring', stiffness: 110, damping: 12 }
          }}
          className="absolute left-[4%] sm:left-[6%] bottom-0 flex flex-col items-center z-20"
          style={{
            maxWidth: '120px'
          }}
        >
          <motion.div
            animate={
              highEnergy && scores.left > scores.right
                ? {
                    y: [-30, -36, -33, -38, -32, -30],
                    x: [0, -2, 1, -1, 2, 0],
                    rotate: [0, -3, 2, -2, 3, 0],
                    scale: [1, 1.05, 0.97, 1.03, 0.99, 1]
                  }
                : { y: -30, x: 0, rotate: 0, scale: 1 }
            }
            transition={{
              repeat: highEnergy && scores.left > scores.right ? Infinity : 0,
              duration: 0.6,
              ease: 'easeInOut'
            }}
          >
            <Image
              src="/boy.png"
              alt="Boy"
              width={120}
              height={120}
              priority
              className="w-20 h-20 sm:w-[120px] sm:h-[120px]"
            />
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
            className="text-electric-blue-light font-black mt-2 text-xl sm:text-3xl drop-shadow-2xl"
            style={{
              textShadow: '0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3)'
            }}
          >
            {scores.left} pts
          </motion.div>

          {highEnergy && scores.left > scores.right && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -right-4 top-8 w-4 h-4 rounded-full bg-electric-blue/50 blur-sm"
            style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' }}
          />
          )}
        </motion.div>

        {/* Girl avatar */}
        <motion.div
          animate={{
            x: `${girlPullBack}%`, // Mundur ke kanan saat menang
            rotate: scores.right > scores.left ? 12 : scores.right < scores.left ? -6 : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 140, damping: 14 },
            rotate: { type: 'spring', stiffness: 110, damping: 12 }
          }}
          className="absolute right-[4%] sm:right-[6%] bottom-0 flex flex-col items-center z-20"
          style={{
            maxWidth: '120px'
          }}
        >
          <motion.div
            animate={
              highEnergy && scores.right > scores.left
                ? {
                    y: [-30, -36, -33, -38, -32, -30],
                    x: [0, 2, -1, 1, -2, 0],
                    rotate: [0, 3, -2, 2, -3, 0],
                    scale: [1, 1.05, 0.97, 1.03, 0.99, 1]
                  }
                : { y: -30, x: 0, rotate: 0, scale: 1 }
            }
            transition={{
              repeat: highEnergy && scores.right > scores.left ? Infinity : 0,
              duration: 0.6,
              ease: 'easeInOut'
            }}
          >
            <Image
              src="/girl.png"
              alt="Girl"
              width={120}
              height={120}
              priority
              className="w-20 h-20 sm:w-[120px] sm:h-[120px]"
            />
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
            className="text-magenta-light font-black mt-2 text-xl sm:text-3xl drop-shadow-2xl"
            style={{
              textShadow: '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.3)'
            }}
          >
            {scores.right} pts
          </motion.div>

          {highEnergy && scores.right > scores.left && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -left-4 top-8 w-4 h-4 rounded-full bg-magenta/50 blur-sm"
            style={{ boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)' }}
          />
          )}
        </motion.div>
      </div>
    </div>
  )
}
