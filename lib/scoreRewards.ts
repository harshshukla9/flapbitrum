export const SCORE_REWARD_TOKEN = 'ARB'
export const SCORE_REWARD_TOTAL = 250
export const SCORE_REWARD_TOP_LIMIT = 30

const SCORE_REWARD_PAYOUTS: number[] = [
  45, // 1
  21, // 2
  18, // 3
  15, // 4
  12, // 5
  10, // 6
  10, // 7
  8, // 8
  8, // 9
  7, // 10
  7, // 11
  7, // 12
  6, // 13
  6, // 14
  6, // 15
  5, // 16
  5, // 17
  5, // 18
  5, // 19
  4, // 20
  4, // 21
  4, // 22
  4, // 23
  4, // 24
  4, // 25
  4, // 26
  4, // 27
  4, // 28
  4, // 29
  4, // 30
]

export const SCORE_REWARD_TABLE = SCORE_REWARD_PAYOUTS.map((amount, idx) => {
  const percentage = (amount / SCORE_REWARD_TOTAL) * 100
  return {
    rank: idx + 1,
    amount,
    percentage,
  }
})

export const SCORE_REWARD_CYCLE_DURATION_MS = 7 * 24 * 60 * 60 * 1000
export const SCORE_REWARD_ANCHOR_TIMESTAMP = Date.UTC(2024, 0, 1)

export const getNextScoreRewardCycle = (now: number = Date.now()) => {
  const elapsed = now - SCORE_REWARD_ANCHOR_TIMESTAMP
  const remainder =
    ((elapsed % SCORE_REWARD_CYCLE_DURATION_MS) + SCORE_REWARD_CYCLE_DURATION_MS) %
    SCORE_REWARD_CYCLE_DURATION_MS
  const msUntilReset = SCORE_REWARD_CYCLE_DURATION_MS - remainder
  const cycleEndTimestamp = now + msUntilReset
  return { msUntilReset, cycleEndTimestamp }
}

export const getScoreRewardForRank = (rank: number) => {
  if (rank < 1 || rank > SCORE_REWARD_TOP_LIMIT) {
    return {
      amount: 0,
      percentage: 0,
    }
  }

  return SCORE_REWARD_TABLE[rank - 1]
}

export const formatRewardAmount = (amount: number, decimals: number = 3) => {
  if (amount === 0) return '0'
  const formatted = Number(amount.toFixed(decimals))
  return formatted % 1 === 0 ? formatted.toString() : formatted.toFixed(decimals)
}

