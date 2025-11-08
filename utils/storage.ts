import { loadQuestions, saveQuestions } from '../lib/supabase-helpers'

export const STORAGE_KEY = 'tt_datasource_v2'

export type Row = {
  id: string
  no: number
  category?: string
  question: string
  answer: string
  timeSec: number
  keyword?: string
}

// Legacy localStorage functions (kept for backward compatibility)
function loadDataFromLocalStorage(): Row[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

function saveDataToLocalStorage(arr: Row[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

// New Supabase-based functions
export async function loadData(): Promise<Row[]> {
  try {
    const questions = await loadQuestions()
    return questions.map(q => ({
      id: q.id,
      no: q.question_id,
      category: q.category,
      question: q.question,
      answer: q.answer,
      timeSec: q.time_sec,
      keyword: q.keyword
    }))
  } catch (error) {
    console.error('Error loading questions from Supabase:', error)
    // Fallback to localStorage
    return loadDataFromLocalStorage()
  }
}

export async function saveData(arr: Row[]) {
  try {
    const questions = arr.map((q, idx) => ({
      question_id: q.no ?? idx,
      question: q.question,
      answer: q.answer,
      time_sec: q.timeSec,
      category: q.category,
      keyword: q.keyword
    }))
    await saveQuestions(questions)
    // Also save to localStorage as backup
    saveDataToLocalStorage(arr)
  } catch (error) {
    console.error('Error saving questions to Supabase:', error)
    // Fallback to localStorage
    saveDataToLocalStorage(arr)
    throw error
  }
}

// Utility function to migrate from localStorage to Supabase
export async function migrateLocalStorageToSupabase() {
  try {
    const localData = loadDataFromLocalStorage()
    if (localData.length > 0) {
      await saveData(localData)
      console.log('Migration completed: moved', localData.length, 'questions to Supabase')
    }
  } catch (error) {
    console.error('Migration failed:', error)
  }
}