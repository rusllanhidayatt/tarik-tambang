'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { players } from '../utils/players'
import { getCurrentSession } from '../lib/supabase-helpers'
import AlertModal from '../components/AlertModal'

export default function Page() {
  const [name, setName] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void }>({ isOpen: false, message: '', type: 'alert' })

  const customAlert = (message: string) => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        message,
        type: 'alert',
        onConfirm: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          resolve()
        }
      })
    })
  }

  async function join() {
    setIsChecking(true)
    try {
      const trimmed = name.trim().toLowerCase()
      if (!trimmed) {
        await customAlert('Masukkan nama kamu!')
        return
      }

      const playerData = players.find(p =>
        p.name.toLowerCase() === trimmed ||
        (p.aliases || []).some(a => a.toLowerCase() === trimmed)
      )

      if (!playerData) {
        await customAlert('Nama tidak valid. Pastikan nama sesuai.')
        return
      }

      // Check if there's an active game session
      const gameSession = await getCurrentSession()
      if (!gameSession) {
        await customAlert('Belum ada sesi game aktif. Tunggu admin memulai game terlebih dahulu.')
        return
      }

      const session = {
        name: playerData.name, // tetap pakai nama utama
        team: playerData.team,
        lastActivity: Date.now()
      }

      sessionStorage.setItem('tt_session', JSON.stringify(session))
      window.location.href = '/play'
    } catch (error) {
      console.error('Error joining game:', error)
      customAlert('Error connecting to game. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce-glow">🪢</div>
      <div className="absolute bottom-20 right-10 text-5xl opacity-20 animate-bounce-glow" style={{ animationDelay: '0.5s' }}>⚡</div>
      <div className="absolute top-1/2 right-20 text-4xl opacity-15 animate-bounce-glow" style={{ animationDelay: '1s' }}>🎯</div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="card max-w-lg w-full relative z-10"
      >
        {/* Header with gradient text */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="text-7xl mb-4 inline-block"
          >
            🪢
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-electric-blue via-magenta to-vibrant-orange bg-clip-text text-transparent">
            TARIK TAMBANG
          </h1>
          <div className="text-slate-300 text-lg font-semibold flex items-center justify-center gap-2">
            Selepas Kerja Studio
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <input
              className="input text-lg"
              placeholder="Masukkan nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isChecking) join()
              }}
              disabled={isChecking}
              autoFocus
            />
          </div>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-electric-blue/10 via-magenta/10 to-vibrant-orange/10 rounded-2xl p-4 border-2 border-electric-blue/20 backdrop-blur-sm"
        >
          <div className="text-sm text-slate-300 text-center flex items-center justify-center gap-2">
            <span>Namanya yang lengkap yaa, bukan nama samaran</span>
          </div>
        </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="button w-full text-xl py-5 font-black relative overflow-hidden group"
            onClick={join}
            disabled={isChecking}
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
                <span>Checking...</span>
              </span>
            ) : (
              <>
                <span className="relative z-10 flex items-center gap-3">
                  <span>Siap Narik</span>
                </span>
              </>
            )}
          </motion.button>
        </div>

        {/* Info card with fun styling */}


        {/* Team preview */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-electric-blue/20 border border-electric-blue/30">
            <span className="text-lg">👦</span>
            <span className="font-semibold text-electric-blue-light">Ikhwan</span>
          </div>
          <span className="text-slate-500 font-bold">VS</span>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-magenta/20 border border-magenta/30">
            <span className="text-lg">👧</span>
            <span className="font-semibold text-magenta-light">Akhwat</span>
          </div>
        </div>
      </motion.div>

      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
        confirmText="OK"
      />
    </div>
  )
}
