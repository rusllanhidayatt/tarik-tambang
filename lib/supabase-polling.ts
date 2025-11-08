import { supabase } from './supabase'

// Polling-based alternative to Realtime (for when Realtime is not available)

let pollingIntervals: Map<string, NodeJS.Timeout> = new Map()

/**
 * Poll for new broadcasts (alternative to Realtime)
 * Checks database every 1 second for new broadcasts
 */
export function pollGameBroadcasts(
  sessionId: string,
  callback: (broadcast: any) => void,
  intervalMs: number = 1000
) {
  let lastChecked = new Date().toISOString()

  const poll = async () => {
    try {
      const { data, error } = await supabase
        .from('game_broadcast')
        .select('*')
        .eq('session_id', sessionId)
        .gt('created_at', lastChecked)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Polling error:', error)
        return
      }

      if (data && data.length > 0) {
        // Process new broadcasts
        data.forEach(broadcast => {
          callback(broadcast)
        })

        // Update last checked time
        lastChecked = data[data.length - 1].created_at
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  // Start polling
  const intervalId = setInterval(poll, intervalMs)
  pollingIntervals.set(sessionId, intervalId)

  // Return cleanup function
  return () => {
    const id = pollingIntervals.get(sessionId)
    if (id) {
      clearInterval(id)
      pollingIntervals.delete(sessionId)
    }
  }
}

/**
 * Poll for new player answers (alternative to Realtime)
 */
export function pollPlayerAnswers(
  sessionId: string,
  callback: (answer: any) => void,
  intervalMs: number = 1000
) {
  let lastChecked = new Date().toISOString()

  const poll = async () => {
    try {
      const { data, error } = await supabase
        .from('player_answers')
        .select('*')
        .eq('session_id', sessionId)
        .gt('created_at', lastChecked)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Polling error:', error)
        return
      }

      if (data && data.length > 0) {
        data.forEach(answer => {
          callback(answer)
        })
        lastChecked = data[data.length - 1].created_at
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  const intervalId = setInterval(poll, intervalMs)
  pollingIntervals.set(`answers_${sessionId}`, intervalId)

  return () => {
    const id = pollingIntervals.get(`answers_${sessionId}`)
    if (id) {
      clearInterval(id)
      pollingIntervals.delete(`answers_${sessionId}`)
    }
  }
}

/**
 * Poll for team score updates (alternative to Realtime)
 */
export function pollTeamScores(
  sessionId: string,
  callback: (scores: { boy: number; girl: number }) => void,
  intervalMs: number = 2000
) {
  const poll = async () => {
    try {
      const { data, error } = await supabase
        .from('team_scores')
        .select('team, score')
        .eq('session_id', sessionId)

      if (error) {
        console.error('Polling error:', error)
        return
      }

      if (data) {
        const scores = { boy: 0, girl: 0 }
        data.forEach(item => {
          if (item.team === 'boy' || item.team === 'girl') {
            scores[item.team] = item.score
          }
        })
        callback(scores)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  // Initial poll
  poll()

  const intervalId = setInterval(poll, intervalMs)
  pollingIntervals.set(`scores_${sessionId}`, intervalId)

  return () => {
    const id = pollingIntervals.get(`scores_${sessionId}`)
    if (id) {
      clearInterval(id)
      pollingIntervals.delete(`scores_${sessionId}`)
    }
  }
}

/**
 * Stop all polling intervals
 */
export function stopAllPolling() {
  pollingIntervals.forEach(interval => clearInterval(interval))
  pollingIntervals.clear()
}
