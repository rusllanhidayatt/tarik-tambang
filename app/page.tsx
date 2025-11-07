'use client'
import { useState } from 'react'
import { players } from '../utils/players'

export default function Page() {
  const [name, setName] = useState('')

  function join() {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return alert('Masukkan nama kamu!')

    const playerData = players.find(p =>
      p.name.toLowerCase() === trimmed ||
      (p.aliases || []).some(a => a.toLowerCase() === trimmed)
    )

    if (!playerData) {
      return alert('Nama tidak valid. Pastikan nama sesuai.')
    }

    const session = {
      name: playerData.name, // tetap pakai nama utama
      team: playerData.team,
      lastActivity: Date.now()
    }

    sessionStorage.setItem('tt_session', JSON.stringify(session))
    window.location.href = '/play'
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

        <button className="button" onClick={join}>
          Join Game
        </button>
      </div>

      <div className="mt-6 small text-slate-400">
        Nama harus sesuai dengan list sembako jika tidak valid.
      </div>
    </div>
  )
}
