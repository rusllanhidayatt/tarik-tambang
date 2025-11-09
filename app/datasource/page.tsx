'use client'

import { useEffect, useState, useRef } from 'react'
import { loadData, saveData } from '../../utils/storage'
import AlertModal from '../../components/AlertModal'

export default function DataSource() {
  const [rows, setRows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void; onCancel?: () => void }>({ isOpen: false, message: '', type: 'alert' })
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null)

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

  const customConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setAlertState({
        isOpen: true,
        message,
        type: 'confirm',
        onConfirm: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          if (confirmResolveRef.current) {
            confirmResolveRef.current(true)
            confirmResolveRef.current = null
          }
        },
        onCancel: () => {
          setAlertState({ isOpen: false, message: '', type: 'alert' })
          if (confirmResolveRef.current) {
            confirmResolveRef.current(false)
            confirmResolveRef.current = null
          }
        }
      })
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await loadData()
        setRows(data)
      } catch (error) {
        console.error('Error loading data:', error)
        customAlert('Error loading questions')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  function addRow() {
    setRows(prev => [
      ...prev,
      {
        id: String(Date.now()),
        no: prev.length + 1,
        category: '',
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

  async function saveAll() {
    setIsSaving(true)
    try {
      await saveData(rows)
      await customAlert('✅ Disimpan ke Supabase & localStorage')
    } catch (error) {
      console.error('Error saving data:', error)
      customAlert('Error saving questions. Check console.')
    } finally {
      setIsSaving(false)
    }
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
        customAlert('✅ Import sukses')
      } catch (err) {
        customAlert('❌ JSON tidak valid')
      }
    }
    r.readAsText(f)
  }

  async function setAllTimeTo30() {
    const confirmed = await customConfirm('Set waktu SEMUA pertanyaan menjadi 30 detik?')
    if (!confirmed) return

    const updated = rows.map(r => ({
      ...r,
      timeSec: 30
    }))
    setRows(updated)
    await customAlert('✅ Semua waktu pertanyaan diset ke 30 detik. Jangan lupa klik "Simpan"!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card fade-in text-center max-w-md w-full">
          <div className="text-6xl mb-4">📚</div>
          <div className="text-2xl font-bold text-white mb-2">Loading...</div>
          <div className="text-slate-400">Fetching questions from database...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 fade-in">
      <div className="card max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">📚 Daftar Pertanyaan</h2>
            <div className="text-sm text-slate-400">
              Manage soal untuk Tim Ikhwan & Akhwat
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 font-semibold">
              {rows.length} soal
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="button bg-emerald-600 hover:bg-emerald-700" onClick={addRow}>
            ➕ Tambah Soal
          </button>
          <button className="button bg-sky-600 hover:bg-sky-700" onClick={saveAll} disabled={isSaving}>
            {isSaving ? '💾 Menyimpan...' : '💾 Simpan'}
          </button>
          <button className="button bg-amber-600 hover:bg-amber-700" onClick={setAllTimeTo30}>
            ⏱️ Set All to 30s
          </button>
          <button className="button bg-slate-600 hover:bg-slate-700" onClick={exportJSON}>
            ⬇️ Export JSON
          </button>
          <label className="button bg-slate-600 hover:bg-slate-700 cursor-pointer">
            ⬆️ Import JSON
            <input type="file" accept="application/json" onChange={importJSON} hidden />
          </label>
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto custom-scrollbar">
          {rows.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-slate-600">📝</div>
              <div className="text-slate-400 mb-2">Belum ada soal</div>
              <div className="text-sm text-slate-500">
                Klik <span className="font-semibold text-emerald-400">"Tambah Soal"</span> untuk membuat pertanyaan baru
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300 bg-slate-800/50 sticky top-0">
                <tr>
                  <th className="py-3 px-3 w-[60px] rounded-tl-lg">No</th>
                  <th className="py-3 px-3 w-[15%]">Kategori</th>
                  <th className="py-3 px-3 w-[30%]">Pertanyaan</th>
                  <th className="py-3 px-3 w-[25%]">Jawaban</th>
                  <th className="py-3 px-3 w-[100px] text-center">⏱️ Waktu (s)</th>
                  <th className="py-3 px-3 w-[80px] text-center rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <input
                        className="input text-center w-full"
                        type="number"
                        value={r.no}
                        onChange={e => update(i, 'no', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        className="input w-full text-sm"
                        value={r.category || ''}
                        placeholder="Kalkulus, Fisika..."
                        onChange={e => update(i, 'category', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        className="input w-full"
                        value={r.question}
                        placeholder="Tulis pertanyaan..."
                        onChange={e => update(i, 'question', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        className="input w-full"
                        value={r.answer}
                        placeholder="Tulis jawaban..."
                        onChange={e => update(i, 'answer', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        className="input text-center w-full"
                        type="number"
                        value={r.timeSec}
                        onChange={e => update(i, 'timeSec', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        className="button bg-rose-600 hover:bg-rose-700 px-3 py-2"
                        onClick={() => remove(i)}
                        title="Hapus soal"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        confirmText={alertState.type === 'confirm' ? 'Ya' : 'OK'}
        cancelText="Batal"
      />
    </div>
  )
}
