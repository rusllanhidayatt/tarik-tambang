// components/Confetti.tsx
'use client'
import { useEffect, useState } from 'react'

export default function Confetti() {
  const [pieces] = useState(() => Array.from({ length: 40 }).map((_, i) => i))
  useEffect(() => {
    const t = setTimeout(() => {}, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.7
        const dur = 1.2 + Math.random() * 1.2
        const bg = ['#FFB5E8','#BDE0FE','#B9FBC0','#FFE5B4','#FFD6A5'][Math.floor(Math.random()*5)]
        const size = 6 + Math.random() * 12
        return (
          <div
            key={p}
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: bg,
              transform: `rotate(${Math.random()*360}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
            className="absolute top-0 rounded-sm animate-confetti-fall"
          />
        )
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: linear;
        }
      `}</style>
    </div>
  )
}
