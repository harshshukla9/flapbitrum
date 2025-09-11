"use client"

import { useEffect, useState } from 'react'

// Function to calculate next Tuesday at end of day
function getNextTuesdayEndTime(): number {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  
  // Calculate days until next Tuesday
  let daysUntilTuesday: number
  if (currentDay <= 2) { // If today is Sunday, Monday, or Tuesday
    daysUntilTuesday = 2 - currentDay // Days until this Tuesday
  } else { // If today is Wednesday through Saturday
    daysUntilTuesday = 9 - currentDay // Days until next Tuesday
  }
  
  // If it's already Tuesday and past 11 PM, go to next Tuesday
  if (currentDay === 2 && now.getHours() >= 23) {
    daysUntilTuesday = 7
  }
  
  // Create date for next Tuesday at 11:59 PM
  const nextTuesday = new Date(now.getTime() + daysUntilTuesday * 24 * 60 * 60 * 1000)
  nextTuesday.setHours(23, 59, 59, 999) // Set to end of day
  
  return nextTuesday.getTime()
}

export function useCurrentActiveWeek() {
  const [data, setData] = useState<{ currentWeek: { eventId: string; endDate: string; name?: string; description?: string; startDate?: string; totalPrizePool?: number } } | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    try {
      const STORAGE_KEY_END = 'flap_current_week_end_v2' // Changed key to force reset
      const STORAGE_KEY_START = 'flap_current_week_start_v2'

      let endMs: number
      let startMs: number

      // Force reset by always recalculating to ensure we end on Tuesday
      endMs = getNextTuesdayEndTime()
      startMs = Date.now()
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY_END, String(endMs))
        window.localStorage.setItem(STORAGE_KEY_START, String(startMs))
      }

      const end = new Date(endMs).toISOString()
      const start = new Date(startMs).toISOString()

      setData({ currentWeek: { eventId: 'Week-4', endDate: end, name: 'Weekly Tournament', description: 'Everyone starts from 0 - equal chances!', startDate: start, totalPrizePool: 50 } })
      setIsLoading(false)
    } catch {
      const fallbackEnd = new Date(getNextTuesdayEndTime()).toISOString()
      const start = new Date().toISOString()
      setData({ currentWeek: { eventId: 'Week-4', endDate: fallbackEnd, name: 'Weekly Tournament', description: 'Everyone starts from 0 - equal chances!', startDate: start, totalPrizePool: 50 } })
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


