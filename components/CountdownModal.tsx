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
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 8 }}
            className="text-white text-[8rem] font-extrabold drop-shadow-2xl"
          >
            {count}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
