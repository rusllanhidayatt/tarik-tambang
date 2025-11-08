// components/Confetti.tsx
'use client'
import { useEffect, useState } from 'react'

export default function Confetti() {
  const [pieces] = useState(() => Array.from({ length: 100 }).map((_, i) => i)) // More pieces!
  const [emojis] = useState(() => ['🎉', '🎊', '✨', '⭐', '💫', '🌟', '🎈', '🎁'])

  useEffect(() => {
    const t = setTimeout(() => {}, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Confetti pieces */}
      {pieces.map((p) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const dur = 2 + Math.random() * 2
        const colors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#fbbf24', '#f472b6']
        const bg = colors[Math.floor(Math.random() * colors.length)]
        const size = 8 + Math.random() * 12
        const shapes = ['rounded-full', 'rounded-sm', 'rounded-md']
        const shape = shapes[Math.floor(Math.random() * shapes.length)]
        const rotation = Math.random() * 360

        return (
          <div
            key={p}
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: bg,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              transform: `rotate(${rotation}deg)`,
            }}
            className={`absolute top-0 ${shape} animate-confetti-drop opacity-90 shadow-lg`}
          />
        )
      })}

      {/* Fun emoji confetti */}
      {emojis.map((emoji, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const dur = 2.5 + Math.random() * 1.5

        return (
          <div
            key={`emoji-${i}`}
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
            className="absolute top-0 text-4xl animate-confetti-drop"
          >
            {emoji}
          </div>
        )
      })}
      <style jsx>{`
        @keyframes confetti-drop {
          0% {
            transform: translateY(-10vh) scale(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(180deg);
          }
          100% {
            transform: translateY(110vh) scale(0.4) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-drop {
          animation-name: confetti-drop;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  )
}
