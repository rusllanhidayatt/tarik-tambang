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
    <div className="card">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarik Tambang — Join</h1>
        <div className="small"></div>
      </div>

      <div className="mt-6 grid gap-4">
        <input
          className="input"
          placeholder="Nama panggilan atau lengkap kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') join()
          }}
        />

        <button className="button" onClick={join} disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Join Game'}
        </button>
      </div>

      <div className="mt-6 small text-slate-400">
        Nama harus sesuai dengan list sembako jika tidak valid.
      </div>
    </div>
  )
}
