import { supabase, type Question, type PlayerAnswer, type GameBroadcast, type TeamScore } from './supabase'

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createGameSession(): Promise<string> {
  const sessionId = `session-${Date.now()}`

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({ session_id: sessionId, status: 'active' })
    .select()
    .single()

  if (error) throw error

  // Initialize team scores
  await supabase.from('team_scores').insert([
    { session_id: sessionId, team: 'boy', score: 0 },
    { session_id: sessionId, team: 'girl', score: 0 }
  ])

  return sessionId
}

export async function getCurrentSession() {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

export async function endGameSession(sessionId: string) {
  const { error } = await supabase
    .from('game_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  if (error) throw error
}

// ============================================
// PLAYER SESSION MANAGEMENT
// ============================================

export async function createPlayerSession(playerName: string, team: 'boy' | 'girl', sessionId: string) {
  const { data, error } = await supabase
    .from('player_sessions')
    .insert({
      player_name: playerName,
      team,
      session_id: sessionId,
      last_activity: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlayerActivity(playerName: string, sessionId: string) {
  const { error } = await supabase
    .from('player_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('player_name', playerName)
    .eq('session_id', sessionId)

  if (error) throw error
}

// ============================================
// QUESTIONS MANAGEMENT
// ============================================

export async function loadQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('question_id', { ascending: true })

  if (error) throw error
  return data || []
}

export async function saveQuestions(questions: Array<{
  question_id: number
  question: string
  answer: string
  time_sec: number
  keyword?: string
}>) {
  // Clear existing questions
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert new questions
  const { error } = await supabase
    .from('questions')
    .insert(questions.map(q => ({
      ...q,
      updated_at: new Date().toISOString()
    })))

  if (error) throw error
}

// ============================================
// ANSWER MANAGEMENT
// ============================================

export async function submitAnswer(
  playerName: string,
  team: 'boy' | 'girl',
  questionId: number,
  answer: string,
  isCorrect: boolean,
  score: number,
  timeRemaining: number,
  sessionId: string
) {
  const { data, error } = await supabase
    .from('player_answers')
    .insert({
      player_name: playerName,
      team,
      question_id: questionId,
      answer,
      is_correct: isCorrect,
      score,
      time_remaining: timeRemaining,
      session_id: sessionId
    })
    .select()
    .single()

  if (error) {
    // Check if duplicate answer
    if (error.code === '23505') {
      throw new Error('Already answered this question')
    }
    throw error
  }

  return data
}

export async function getPlayerAnswers(playerName: string, sessionId: string): Promise<PlayerAnswer[]> {
  const { data, error } = await supabase
    .from('player_answers')
    .select('*')
    .eq('player_name', playerName)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function hasAnswered(playerName: string, questionId: number, sessionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('player_answers')
    .select('id')
    .eq('player_name', playerName)
    .eq('question_id', questionId)
    .eq('session_id', sessionId)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// ============================================
// BROADCAST MANAGEMENT
// ============================================

export async function broadcastEvent(
  sessionId: string,
  type: 'start_question' | 'end_question' | 'end_game',
  payload: any
) {
  const { error } = await supabase
    .from('game_broadcast')
    .insert({
      session_id: sessionId,
      broadcast_type: type,
      payload
    })

  if (error) throw error
}

// ============================================
// TEAM SCORES
// ============================================

export async function getTeamScores(sessionId: string): Promise<{ boy: number; girl: number }> {
  const { data, error } = await supabase
    .from('team_scores')
    .select('team, score')
    .eq('session_id', sessionId)

  if (error) throw error

  const scores = { boy: 0, girl: 0 }
  data?.forEach(item => {
    if (item.team === 'boy' || item.team === 'girl') {
      scores[item.team] = item.score
    }
  })

  return scores
}

export async function resetTeamScores(sessionId: string) {
  const { error } = await supabase
    .from('team_scores')
    .update({ score: 0, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  if (error) throw error
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToGameBroadcasts(sessionId: string, callback: (payload: GameBroadcast) => void) {
  return supabase
    .channel(`game_broadcast:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_broadcast',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        callback(payload.new as GameBroadcast)
      }
    )
    .subscribe()
}

export function subscribeToPlayerAnswers(sessionId: string, callback: (payload: PlayerAnswer) => void) {
  return supabase
    .channel(`player_answers:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'player_answers',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        callback(payload.new as PlayerAnswer)
      }
    )
    .subscribe()
}

export function subscribeToTeamScores(sessionId: string, callback: (payload: TeamScore) => void) {
  return supabase
    .channel(`team_scores:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'team_scores',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        callback(payload.new as TeamScore)
      }
    )
    .subscribe()
}

// ============================================
// CLEANUP
// ============================================

export async function clearAllGameData(sessionId: string) {
  // Delete all player answers for this session
  await supabase.from('player_answers').delete().eq('session_id', sessionId)

  // Reset team scores
  await resetTeamScores(sessionId)

  // Delete broadcast messages
  await supabase.from('game_broadcast').delete().eq('session_id', sessionId)

  // Delete player sessions
  await supabase.from('player_sessions').delete().eq('session_id', sessionId)
}
