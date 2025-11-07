const DEV_MODE = true

export function calcScore(maxTime: number, remaining: number, correct: boolean){
  const sign = correct ? 1 : -1
  const ratio = Math.max(0, remaining) / Math.max(1, maxTime)
  const base = Math.round(100 * ratio)

  if (DEV_MODE) {
    return Math.max(-50, Math.min(50, sign * base))
  }

  return sign * base
}

export function answerMatches(expected: string, given: string){
  if(/^[0-9]+$/.test(expected.trim())){
    return expected.trim() === given.trim()
  }
  return expected.trim().toLowerCase() === given.trim().toLowerCase()
}
