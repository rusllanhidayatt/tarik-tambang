const DEV_MODE = false

export function calcScore(
  maxTime: number,
  remaining: number,
  correct: boolean,
  unanswered = false,
  partial = 0
) {
  // Kalau tidak menjawab - penalty terbesar
  if (unanswered) return -40

  // Rasio waktu tersisa (1.0 = jawab instant, 0.0 = waktu habis)
  const ratio = Math.max(0, remaining) / Math.max(1, maxTime)

  // ✅ JAWABAN BENAR - 60 sampai 100 poin
  // Cepat = 100, lambat = 60 (tetap dapat reward lumayan)
  if (correct) {
    const score = Math.round(60 + (40 * ratio))
    if (DEV_MODE) {
      return Math.min(50, score)
    }
    return score
  }

  // ⚡ JAWABAN PARTIAL - 10 sampai 45 poin (tergantung kualitas & waktu)
  if (partial > 0) {
    // Hitung base dari persentase kebenaran
    // partial 100% = 45 poin max, partial 50% = 25 poin, partial 25% = 15 poin
    const partialRatio = partial / 100 // 0.0 - 1.0
    const basePartial = 10 + (35 * partialRatio) // 10-45 poin

    // Dikali faktor waktu (cepat = lebih tinggi)
    // Minimal 60% dari base, maksimal 100% dari base
    const timeFactor = 0.6 + (0.4 * ratio)
    let partialScore = Math.round(basePartial * timeFactor)

    // Batasi partial di akhir waktu: max 15 poin
    // ratio < 0.33 = sisa waktu < 33% dari total
    if (ratio < 0.33) {
      partialScore = Math.min(15, partialScore)
    }

    if (DEV_MODE) {
      return Math.min(50, partialScore)
    }

    return Math.max(10, partialScore) // Minimal 10 poin untuk usaha
  }

  // ❌ JAWABAN SALAH - minus 15 sampai -35 poin
  // Cepat salah = -35 (punishment nebak asal)
  // Lambat salah = -15 (sudah usaha mikir)
  const penalty = Math.round(15 + (20 * ratio))

  if (DEV_MODE) {
    return Math.max(-50, -penalty)
  }

  return -penalty
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