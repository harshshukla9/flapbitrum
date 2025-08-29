import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LeaderboardService } from '../lib/leaderboardService'
import { LeaderboardResponse, LeaderboardEntry } from '../types'

// Hook to fetch leaderboard from MongoDB
export const useMongoLeaderboard = (eventId: string, limit: number = 100) => {
  return useQuery({
    queryKey: ['mongo-leaderboard', eventId, limit],
    queryFn: () => LeaderboardService.getLeaderboard(eventId, limit),
    enabled: !!eventId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Hook to fetch available events
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => LeaderboardService.getEvents(),
    staleTime: 60000, // Consider data fresh for 1 minute
  })
}

// Hook to update leaderboard entry
export const useUpdateLeaderboardEntry = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (entry: {
      user: string
      username: string
      fid: string
      pfp: string
      score: number
      eventId: string
    }) => {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update leaderboard entry')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the leaderboard for the specific event
      queryClient.invalidateQueries({
        queryKey: ['mongo-leaderboard', variables.eventId],
      })
    },
  })
}

// Hook to get user's rank in a specific event
export const useUserRank = (eventId: string, userAddress?: string) => {
  const { data: leaderboardData } = useMongoLeaderboard(eventId)
  
  const userRank = userAddress && leaderboardData?.leaderboard
    ? leaderboardData.leaderboard.find(
        (entry: LeaderboardEntry) => entry.user.toLowerCase() === userAddress.toLowerCase()
      )?.rank
    : undefined

  return {
    userRank,
    isLoading: !leaderboardData,
  }
}

// Hook to get user's score in a specific event
export const useUserScore = (eventId: string, userAddress?: string) => {
  const { data: leaderboardData } = useMongoLeaderboard(eventId)
  
  const userEntry = userAddress && leaderboardData?.leaderboard
    ? leaderboardData.leaderboard.find(
        (entry: LeaderboardEntry) => entry.user.toLowerCase() === userAddress.toLowerCase()
      )
    : undefined

  return {
    userScore: userEntry?.score,
    userRank: userEntry?.rank,
    hasScore: !!userEntry,
    isLoading: !leaderboardData,
  }
}
