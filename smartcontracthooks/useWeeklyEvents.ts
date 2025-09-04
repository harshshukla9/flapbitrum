"use client"

import { useEffect, useState } from 'react'

export function useCurrentActiveWeek() {
  const [data, setData] = useState<{ currentWeek: { eventId: string; endDate: string; name?: string; description?: string; startDate?: string; totalPrizePool?: number } } | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    try {
      const STORAGE_KEY_END = 'flap_current_week_end'
      const STORAGE_KEY_START = 'flap_current_week_start'

      let endMs: number
      let startMs: number

      const storedEnd = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY_END) : null
      const storedStart = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY_START) : null

      if (storedEnd && !Number.isNaN(Number(storedEnd))) {
        endMs = Number(storedEnd)
      } else {
        endMs = Date.now() + 7 * 24 * 60 * 60 * 1000
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_END, String(endMs))
      }

      if (storedStart && !Number.isNaN(Number(storedStart))) {
        startMs = Number(storedStart)
      } else {
        startMs = Date.now()
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_START, String(startMs))
      }

      const end = new Date(endMs).toISOString()
      const start = new Date(startMs).toISOString()

      setData({ currentWeek: { eventId: 'week-2', endDate: end, name: 'Weekly Tournament', description: 'Everyone starts from 0 - equal chances!', startDate: start, totalPrizePool: 50 } })
      setIsLoading(false)
    } catch {
      const fallbackEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const start = new Date().toISOString()
      setData({ currentWeek: { eventId: 'week-2', endDate: fallbackEnd, name: 'Weekly Tournament', description: 'Everyone starts from 0 - equal chances!', startDate: start, totalPrizePool: 50 } })
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading }
}

export function useCurrentWeekLeaderboard() {
  return { data: undefined, isLoading: false, error: null, refetch: () => {} }
}

export function useUserCurrentWeekStatus() {
  return { data: undefined, isLoading: false }
}

export function useEventStats() {
  return { data: undefined, isLoading: false }
}

export function useStartNewWeek() {
  return { mutateAsync: async () => ({ ok: true }) }
}


