// components/Confetti.tsx
'use client'
import { useEffect, useState } from 'react'

export default function Confetti() {
  const [pieces] = useState(() => Array.from({ length: 50 }).map((_, i) => i))

  useEffect(() => {
    const t = setTimeout(() => {}, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const dur = 2.5 + Math.random() * 1.5
        const colors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']
        const bg = colors[Math.floor(Math.random() * colors.length)]
        const size = 10 + Math.random() * 8

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
            }}
            className="absolute top-0 rounded-full animate-confetti-drop opacity-90"
          />
        )
      })}
      <style jsx>{`
        @keyframes confetti-drop {
          0% {
            transform: translateY(-10vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            transform: translateY(110vh) scale(0.4);
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
