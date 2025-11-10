const DEV_MODE = false

export function calcScore(
  maxTime: number,
  remaining: number,
  correct: boolean,
  unanswered = false,
  partial = 0
) {
  // Kalau tidak menjawab
  if (unanswered) return -10

  // Rasio waktu tersisa
  const ratio = Math.max(0, remaining) / Math.max(1, maxTime)
  let base = Math.round(100 * ratio)

  // Jawaban sebagian benar (parsial)
  if (!correct && partial > 0) {
    // Misal 70% pengali dari hasil parsial
    base = Math.round(partial * ratio * 0.7)
  }

  // Kalau DEV_MODE aktif → batasi range skor biar mudah debug
  if (DEV_MODE) {
    const sign = correct ? 1 : -1
    return Math.max(-50, Math.min(50, sign * base))
  }

  // Normal mode
  const sign = correct ? 1 : -1
  return sign * base
}

export function answerMatches(expected: string, given: string) {
  const exp = expected.trim().toLowerCase()
  const giv = given.trim().toLowerCase()

  // Tidak menjawab
  if (!giv) return { correct: false, partial: 0, unanswered: true }

  // Jika jawaban berupa angka → exact match
  if (/^[0-9]+$/.test(exp)) {
    const correct = exp === giv
    return { correct, partial: correct ? 100 : 0, unanswered: false }
  }

  // Pisah berdasarkan spasi
  const expWords = exp.split(/\s+/)
  const givWords = giv.split(/\s+/)

  // Hitung kata yang cocok
  const matched = givWords.filter(w => expWords.includes(w)).length
  const ratio = expWords.length > 0 ? matched / expWords.length : 0
  const partialScore = Math.floor(ratio * 100)

  const correct = ratio === 1

  return {
    correct,
    partial: partialScore,
    unanswered: false
  }
}
