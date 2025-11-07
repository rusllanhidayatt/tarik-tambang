'use client'

import { useEffect, useState } from 'react'
import { loadData, saveData } from '../../utils/storage'

export default function DataSource() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    setRows(loadData())
  }, [])

  function addRow() {
    setRows(prev => [
      ...prev,
      {
        id: String(Date.now()),
        no: prev.length + 1,
        question: '',
        answer: '',
        timeSec: 30
      }
    ])
  }

  function update(i: number, field: string, val: any) {
    const cp = [...rows]
    cp[i][field] = val
    setRows(cp)
  }

  function remove(i: number) {
    const cp = [...rows]
    cp.splice(i, 1)
    setRows(cp)
  }

  function saveAll() {
    saveData(rows)
    alert('✅ Disimpan ke localStorage')
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'datasource.json'
    a.click()
  }

  function importJSON(e: any) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const parsed = JSON.parse(String(ev.target?.result))
        setRows(parsed)
        alert('✅ Import sukses')
      } catch (err) {
        alert('❌ JSON tidak valid')
      }
    }
    r.readAsText(f)
  }

  return (
    <div className="card fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">🎲 Daftar Pertanyaan</h2>
        <div className="small">
          Soal otomatis berlaku untuk <b>Tim Boy & Girl</b>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="button" onClick={addRow}>➕ Tambah Soal</button>
        <button className="button" onClick={saveAll}>💾 Simpan</button>
        <button className="button" onClick={exportJSON}>⬇️ Export</button>
        <label className="button cursor-pointer">
          ⬆️ Import
          <input type="file" accept="application/json" onChange={importJSON} hidden />
        </label>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-300 border-b border-slate-700">
            <tr>
              <th className="py-2 w-[50px]">No</th>
              <th className="py-2 w-[45%]">Pertanyaan</th>
              <th className="py-2 w-[35%]">Jawaban</th>
              <th className="py-2 w-[100px] text-center">⏱ Waktu (s)</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-800">
                <td className="py-2">
                  <input
                    className="input text-center"
                    value={r.no}
                    onChange={e => update(i, 'no', Number(e.target.value))}
                  />
                </td>
                <td className="py-2">
                  <input
                    className="input"
                    value={r.question}
                    placeholder="Tulis pertanyaan..."
                    onChange={e => update(i, 'question', e.target.value)}
                  />
                </td>
                <td className="py-2">
                  <input
                    className="input"
                    value={r.answer}
                    placeholder="Tulis jawaban..."
                    onChange={e => update(i, 'answer', e.target.value)}
                  />
                </td>
                <td className="py-2 text-center">
                  <input
                    className="input text-center"
                    value={r.timeSec}
                    onChange={e => update(i, 'timeSec', Number(e.target.value))}
                  />
                </td>
                <td className="py-2">
                  <button
                    className="button bg-rose-600 hover:bg-rose-700"
                    onClick={() => remove(i)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center text-slate-400 mt-6">
            Belum ada soal. Klik <b>“Tambah Soal”</b> untuk membuat pertanyaan baru.
          </div>
        )}
      </div>
    </div>
  )
}
