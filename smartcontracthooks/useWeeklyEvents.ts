import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

// Hook to get all weekly events
export const useWeeklyEvents = () => {
  return useQuery({
    queryKey: ['weekly-events'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-events')
      if (!response.ok) {
        throw new Error('Failed to fetch weekly events')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

// Hook to get current active week
export const useCurrentActiveWeek = () => {
  return useQuery({
    queryKey: ['weekly-events', 'current'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-events?action=current')
      if (!response.ok) {
        throw new Error('Failed to fetch current week')
      }
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })
}

// Hook to get next week to start
export const useNextWeekToStart = () => {
  return useQuery({
    queryKey: ['weekly-events', 'next'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-events?action=next')
      if (!response.ok) {
        throw new Error('Failed to fetch next week')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

// Hook to get event statistics
export const useEventStats = (eventId: string) => {
  return useQuery({
    queryKey: ['weekly-events', 'stats', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/weekly-events?action=stats&eventId=${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event stats')
      }
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 30000, // 30 seconds
  })
}

// Hook to start a new week
export const useStartNewWeek = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch('/api/weekly-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          eventId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start new week')
      }
      
      return response.json()
    },
    onSuccess: (data, eventId) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['weekly-events'] })
      queryClient.invalidateQueries({ queryKey: ['mongo-leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-events', 'current'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-events', 'next'] })
      
      console.log(`✅ Week ${eventId} started successfully!`)
    },
  })
}

// Hook to reset event scores
export const useResetEventScores = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch('/api/weekly-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          eventId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset event scores')
      }
      
      return response.json()
    },
    onSuccess: (data, eventId) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['mongo-leaderboard', eventId] })
      queryClient.invalidateQueries({ queryKey: ['weekly-events', 'stats', eventId] })
      
      console.log(`✅ Scores for event ${eventId} have been reset!`)
    },
  })
}

// Hook to create a new weekly event
export const useCreateWeeklyEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (eventData: {
      eventId: string
      name: string
      startDate: string
      endDate: string
      totalPrizePool?: number
      description?: string
    }) => {
      const response = await fetch('/api/weekly-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...eventData,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create weekly event')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch weekly events
      queryClient.invalidateQueries({ queryKey: ['weekly-events'] })
    },
  })
}

// Hook to get user's current week participation status
export const useUserCurrentWeekStatus = (eventId: string) => {
  const { address } = useAccount()
  
  return useQuery({
    queryKey: ['user-week-status', eventId, address],
    queryFn: async () => {
      if (!address || !eventId) return null
      
      const response = await fetch(`/api/user-week-status?eventId=${eventId}&userAddress=${address}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user week status')
      }
      return response.json()
    },
    enabled: !!address && !!eventId,
    staleTime: 30000, // 30 seconds
  })
}

// Hook to get current week leaderboard (fresh start)
export const useCurrentWeekLeaderboard = (eventId: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['current-week-leaderboard', eventId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?eventId=${eventId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch current week leaderboard')
      }
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 15000, // 15 seconds - more frequent updates for current week
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
