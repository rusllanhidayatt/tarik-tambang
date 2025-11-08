'use client'
import { useState } from 'react'
import { players } from '../utils/players'
import { getCurrentSession } from '../lib/supabase-helpers'

export default function Page() {
  const [name, setName] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  async function join() {
    setIsChecking(true)
    try {
      const trimmed = name.trim().toLowerCase()
      if (!trimmed) {
        alert('Masukkan nama kamu!')
        return
      }

      const playerData = players.find(p =>
        p.name.toLowerCase() === trimmed ||
        (p.aliases || []).some(a => a.toLowerCase() === trimmed)
      )

      if (!playerData) {
        alert('Nama tidak valid. Pastikan nama sesuai.')
        return
      }

      // Check if there's an active game session
      const gameSession = await getCurrentSession()
      if (!gameSession) {
        alert('Belum ada sesi game aktif. Tunggu admin memulai game terlebih dahulu.')
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
      alert('Error connecting to game. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🪢</div>
          <h1 className="text-3xl font-black text-white mb-2">Tarik Tambang</h1>
          <div className="text-slate-400">Join the game</div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nama Kamu
            </label>
            <input
              className="input text-lg"
              placeholder="Masukkan nama panggilan atau lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isChecking) join()
              }}
              disabled={isChecking}
              autoFocus
            />
          </div>

          <button
            className="button w-full text-lg py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
            onClick={join}
            disabled={isChecking}
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Checking...
              </span>
            ) : (
              '🎮 Join Game'
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            ℹ️ Nama harus sesuai dengan list yang terdaftar
          </div>
        </div>
      </div>
    </div>
  )
}
