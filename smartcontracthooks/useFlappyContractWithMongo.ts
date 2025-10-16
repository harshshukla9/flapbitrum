"use client"

import { useCallback, useState } from 'react'
import { useSetScore } from './useFlappyContract'

export function useSetScoreWithMongo(eventId: string = 'week-2') {
  const { setScore, isPending } = useSetScore()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isMongoUpdating] = useState(false)
  const [localIsSuccess, setLocalIsSuccess] = useState(false)

  const wrappedSetScore = useCallback(
    async (score: number, username: string, fid: number, pfp: string) => {
      setIsConfirming(true)
      setLocalIsSuccess(false)
      try {
        await setScore(score, username, fid, pfp)
        setLocalIsSuccess(true)
      } finally {
        setIsConfirming(false)
      }
    },
    [setScore]
  )

  const resetSuccess = useCallback(() => {
    setLocalIsSuccess(false)
  }, [])

  // Exclusively use local success state so we can reset it between rounds
  const scoreSavedWithMongo = localIsSuccess

  return { 
    setScore: wrappedSetScore, 
    isPending, 
    isConfirming, 
    isSuccess: scoreSavedWithMongo, 
    isMongoUpdating,
    resetSuccess
  }
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


