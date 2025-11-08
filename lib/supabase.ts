import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export type Question = {
  id: string
  question_id: number
  question: string
  answer: string
  time_sec: number
  category?: string
  keyword?: string
  created_at: string
  updated_at: string
}

export type PlayerSession = {
  id: string
  player_name: string
  team: 'boy' | 'girl'
  session_id: string
  last_activity: string
  created_at: string
}

export type PlayerAnswer = {
  id: string
  player_name: string
  team: 'boy' | 'girl'
  question_id: number
  answer: string
  is_correct: boolean
  score: number
  time_remaining: number
  session_id: string
  created_at: string
}

export type GameBroadcast = {
  id: string
  session_id: string
  broadcast_type: 'start_question' | 'end_question' | 'end_game'
  payload: any
  created_at: string
}

export type TeamScore = {
  id: string
  session_id: string
  team: 'boy' | 'girl'
  score: number
  updated_at: string
}

export type GameSession = {
  id: string
  session_id: string
  status: 'active' | 'ended'
  started_at: string
  ended_at?: string
  created_at: string
}
