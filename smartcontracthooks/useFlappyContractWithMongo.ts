"use client"

import { useCallback, useState } from 'react'
import { useSetScore } from './useFlappyContract'

export function useSetScoreWithMongo(eventId: string = 'week-2') {
  const { setScore, isPending, isSuccess } = useSetScore()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isMongoUpdating] = useState(false)

  const wrappedSetScore = useCallback(
    async (score: number, username: string, fid: number, pfp: string) => {
      setIsConfirming(true)
      try {
        await setScore(score, username, fid, pfp)
      } finally {
        setIsConfirming(false)
      }
    },
    [setScore]
  )

  return { setScore: wrappedSetScore, isPending, isConfirming, isSuccess, isMongoUpdating }
}

export function useWatchContractEvents(_eventId: string) {
  // no-op in contract-only mode
}

export function useSyncContractToMongo(_eventId: string) {
  const [isLoading] = useState(false)
  const totalEntries = 0
  const syncAllData = async () => ({ ok: true })
  return { syncAllData, isLoading, totalEntries }
}


