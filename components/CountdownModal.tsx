'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CountdownModal({ onFinish }: { onFinish: () => void }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count <= 0) {
      onFinish()
      return
    }
    const timer = setTimeout(() => setCount(count - 1), 1000)
    return () => clearTimeout(timer)
  }, [count])

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key={count}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20
            }}
            className="text-white text-[12rem] font-black"
            style={{
              textShadow: '0 10px 50px rgba(0, 0, 0, 0.5)',
              WebkitTextStroke: '4px rgba(255, 255, 255, 0.3)'
            }}
          >
            {count}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
