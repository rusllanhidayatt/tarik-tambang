'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentSession } from '../../lib/supabase-helpers'

export default function TestPage() {
  const [status, setStatus] = useState<any>({
    connection: '🔄 Checking...',
    tables: '🔄 Checking...',
    session: '🔄 Checking...',
    realtime: '🔄 Checking...',
    errors: []
  })

  useEffect(() => {
    async function runTests() {
      const errors: string[] = []
      const newStatus: any = {}

      // Test 1: Supabase Connection
      try {
        const { data, error } = await supabase.from('game_sessions').select('count')
        if (error) {
          newStatus.connection = '❌ Connection Failed: ' + error.message
          errors.push('Connection: ' + error.message)
        } else {
          newStatus.connection = '✅ Connected to Supabase'
        }
      } catch (err: any) {
        newStatus.connection = '❌ Error: ' + err.message
        errors.push('Connection Error: ' + err.message)
      }

      // Test 2: Check Tables Exist
      try {
        const tables = ['game_sessions', 'questions', 'player_sessions', 'player_answers', 'game_broadcast', 'team_scores']
        const tableResults: string[] = []

        for (const table of tables) {
          const { error } = await supabase.from(table).select('count').limit(1)
          if (error) {
            tableResults.push(`❌ ${table}: ${error.message}`)
            errors.push(`Table ${table}: ${error.message}`)
          } else {
            tableResults.push(`✅ ${table}`)
          }
        }

        newStatus.tables = tableResults
      } catch (err: any) {
        newStatus.tables = '❌ Error checking tables: ' + err.message
        errors.push('Tables Error: ' + err.message)
      }

      // Test 3: Check Active Session
      try {
        const session = await getCurrentSession()
        if (session) {
          newStatus.session = `✅ Active session found: ${session.session_id}`
        } else {
          newStatus.session = '⚠️ No active session (Admin needs to click Start)'
          errors.push('No active session - this is normal if game not started')
        }
      } catch (err: any) {
        newStatus.session = '❌ Error: ' + err.message
        errors.push('Session Error: ' + err.message)
      }

      // Test 4: Realtime Test
      try {
        const channel = supabase
          .channel('test-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_broadcast' }, () => {
            console.log('Realtime working!')
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              newStatus.realtime = '✅ Realtime subscribed successfully'
            } else if (status === 'CHANNEL_ERROR') {
              newStatus.realtime = '❌ Realtime channel error'
              errors.push('Realtime: Channel error')
            } else if (status === 'TIMED_OUT') {
              newStatus.realtime = '❌ Realtime connection timed out'
              errors.push('Realtime: Timed out')
            }
          })

        // Cleanup after 5 seconds
        setTimeout(() => {
          channel.unsubscribe()
        }, 5000)
      } catch (err: any) {
        newStatus.realtime = '❌ Error: ' + err.message
        errors.push('Realtime Error: ' + err.message)
      }

      setStatus({
        ...status,
        ...newStatus,
        errors
      })
    }

    runTests()
  }, [])

  return (
    <div className="min-h-screen p-6 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="card p-6">
          <h1 className="text-3xl font-bold mb-6">🧪 Supabase Connection Test</h1>

          <div className="space-y-4">
            {/* Connection Test */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <h2 className="font-bold mb-2">1️⃣ Supabase Connection</h2>
              <p className="text-sm">{status.connection}</p>
            </div>

            {/* Tables Test */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <h2 className="font-bold mb-2">2️⃣ Database Tables</h2>
              {Array.isArray(status.tables) ? (
                <ul className="text-sm space-y-1">
                  {status.tables.map((t: string, i: number) => (
                    <li key={i} className="font-mono">{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{status.tables}</p>
              )}
            </div>

            {/* Session Test */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <h2 className="font-bold mb-2">3️⃣ Active Game Session</h2>
              <p className="text-sm">{status.session}</p>
            </div>

            {/* Realtime Test */}
            <div className="p-4 bg-slate-800 rounded-lg">
              <h2 className="font-bold mb-2">4️⃣ Realtime Connection</h2>
              <p className="text-sm">{status.realtime}</p>
            </div>

            {/* Errors */}
            {status.errors.length > 0 && (
              <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <h2 className="font-bold mb-2 text-red-400">❌ Errors Found</h2>
                <ul className="text-sm space-y-1 text-red-300">
                  {status.errors.map((err: string, i: number) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <h2 className="font-bold mb-2 text-blue-400">📋 Next Steps</h2>
              <ol className="text-sm space-y-2 text-blue-300">
                <li>1. If tables are missing, run the SQL schema in Supabase Dashboard</li>
                <li>2. If realtime fails, enable replication for: player_answers, game_broadcast, team_scores</li>
                <li>3. If no active session, go to /admin and click "Start"</li>
                <li>4. Check browser console (F12) for detailed errors</li>
              </ol>
            </div>

            {/* Quick Links */}
            <div className="flex gap-3 mt-6">
              <a href="/admin" className="button">Go to Admin</a>
              <a href="/play" className="button">Go to Play</a>
              <a href="/datasource" className="button">Go to Datasource</a>
              <button
                className="button bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Test
              </button>
            </div>
          </div>
        </div>

        {/* ENV Info */}
        <div className="card p-6 mt-6">
          <h2 className="font-bold mb-3">🔧 Environment Variables</h2>
          <div className="space-y-2 text-sm font-mono bg-slate-800 p-4 rounded">
            <div>
              <span className="text-slate-400">SUPABASE_URL:</span>{' '}
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">SUPABASE_ANON_KEY:</span>{' '}
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
