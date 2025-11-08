'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentSession } from '../../lib/supabase-helpers'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)
  const [broadcasts, setBroadcasts] = useState<any[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  useEffect(() => {
    async function init() {
      addLog('🔍 Starting debug...')

      // Check current session
      try {
        const currentSession = await getCurrentSession()
        if (currentSession) {
          setSession(currentSession)
          addLog(`✅ Found session: ${currentSession.session_id}`)
        } else {
          addLog('⚠️ No active session found - Admin needs to click Start')
        }
      } catch (err: any) {
        addLog(`❌ Error getting session: ${err.message}`)
      }

      // Load recent broadcasts
      try {
        const { data, error } = await supabase
          .from('game_broadcast')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          addLog(`❌ Error loading broadcasts: ${error.message}`)
        } else {
          setBroadcasts(data || [])
          addLog(`📡 Found ${data?.length || 0} recent broadcasts`)
        }
      } catch (err: any) {
        addLog(`❌ Error: ${err.message}`)
      }
    }

    init()
  }, [])

  // Subscribe to realtime
  useEffect(() => {
    if (!session) return

    addLog(`🔌 Subscribing to realtime for session: ${session.session_id}`)

    const channel = supabase
      .channel(`debug-broadcast:${session.session_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_broadcast',
          filter: `session_id=eq.${session.session_id}`
        },
        (payload) => {
          addLog(`✅ REALTIME EVENT RECEIVED!`)
          addLog(`📦 Payload: ${JSON.stringify(payload.new)}`)
          setBroadcasts(prev => [payload.new as any, ...prev])
        }
      )
      .subscribe((status) => {
        addLog(`🔌 Subscription status: ${status}`)

        if (status === 'SUBSCRIBED') {
          addLog('✅ Successfully subscribed to realtime!')
        } else if (status === 'CHANNEL_ERROR') {
          addLog('❌ Channel error - Realtime might not be enabled!')
        } else if (status === 'TIMED_OUT') {
          addLog('❌ Connection timed out!')
        }
      })

    return () => {
      addLog('🔌 Unsubscribing from realtime')
      channel.unsubscribe()
    }
  }, [session])

  const testBroadcast = async () => {
    if (!session) {
      alert('No active session!')
      return
    }

    addLog('📤 Sending test broadcast...')

    try {
      const { error } = await supabase
        .from('game_broadcast')
        .insert({
          session_id: session.session_id,
          broadcast_type: 'start_question',
          payload: {
            question: {
              id: 'test-' + Date.now(),
              no: 999,
              question: 'Test question - ' + new Date().toLocaleTimeString(),
              answer: 'Test answer',
              timeSec: 30
            },
            totalQuestions: 1
          }
        })

      if (error) {
        addLog(`❌ Error broadcasting: ${error.message}`)
      } else {
        addLog('✅ Test broadcast sent! Check if you receive it above.')
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="card p-6">
          <h1 className="text-3xl font-bold mb-6">🐛 Realtime Debug</h1>

          {/* Session Info */}
          <div className="mb-6 p-4 bg-slate-800 rounded-lg">
            <h2 className="font-bold mb-2">📊 Session Info</h2>
            {session ? (
              <div className="text-sm font-mono">
                <div>Session ID: <span className="text-green-400">{session.session_id}</span></div>
                <div>Status: <span className="text-green-400">{session.status}</span></div>
                <div>Started: {new Date(session.started_at).toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-yellow-400">No active session - Admin needs to click Start</div>
            )}
          </div>

          {/* Actions */}
          <div className="mb-6 flex gap-3">
            <button
              className="button bg-blue-600 hover:bg-blue-700"
              onClick={testBroadcast}
              disabled={!session}
            >
              📤 Send Test Broadcast
            </button>
            <button
              className="button bg-gray-600 hover:bg-gray-700"
              onClick={() => setLogs([])}
            >
              🗑️ Clear Logs
            </button>
            <button
              className="button"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Recent Broadcasts */}
          <div className="mb-6 p-4 bg-slate-800 rounded-lg">
            <h2 className="font-bold mb-2">📡 Recent Broadcasts ({broadcasts.length})</h2>
            <div className="space-y-2 max-h-60 overflow-auto">
              {broadcasts.length === 0 ? (
                <div className="text-slate-400 text-sm">No broadcasts yet</div>
              ) : (
                broadcasts.map((b) => (
                  <div key={b.id} className="text-xs font-mono p-2 bg-slate-900 rounded border border-slate-700">
                    <div className="text-blue-400">Type: {b.broadcast_type}</div>
                    <div className="text-slate-400">Session: {b.session_id}</div>
                    <div className="text-slate-400">Time: {new Date(b.created_at).toLocaleTimeString()}</div>
                    <div className="text-slate-300 mt-1">
                      Payload: {JSON.stringify(b.payload).substring(0, 100)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="p-4 bg-black rounded-lg">
            <h2 className="font-bold mb-2 text-green-400">📝 Live Logs</h2>
            <div className="font-mono text-xs space-y-1 max-h-96 overflow-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500">No logs yet...</div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('❌') ? 'text-red-400' :
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('⚠️') ? 'text-yellow-400' :
                      log.includes('📡') || log.includes('📦') ? 'text-blue-400' :
                      'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <h3 className="font-bold mb-2 text-blue-400">📋 How to Test:</h3>
            <ol className="text-sm space-y-1 text-blue-300">
              <li>1. Make sure Admin clicked "Start" (creates session)</li>
              <li>2. Click "Send Test Broadcast" button above</li>
              <li>3. Check logs - you should see "REALTIME EVENT RECEIVED!"</li>
              <li>4. If subscription status is "SUBSCRIBED" but no event → Realtime not enabled in Supabase</li>
              <li>5. If status is "CHANNEL_ERROR" → Go to Supabase Dashboard and enable Realtime</li>
            </ol>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex gap-3">
            <a href="/admin" className="button">Admin Panel</a>
            <a href="/play" className="button">Play Page</a>
            <a href="/test" className="button">Connection Test</a>
          </div>
        </div>
      </div>
    </div>
  )
}
