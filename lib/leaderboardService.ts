import { useGetTopScores } from '../smartcontracthooks/useFlappyContract'
import { CreateLeaderboardEntryRequest } from '../types'

// Service to sync leaderboard data from smart contract to MongoDB
export class LeaderboardService {
  private static async syncEntryToMongoDB(entry: any, eventId: string) {
    try {
      const leaderboardEntry: CreateLeaderboardEntryRequest = {
        user: entry.user,
        username: entry.username || 'Anonymous',
        fid: entry.fid ? entry.fid.toString() : '0',
        pfp: entry.pfp || '',
        score: Number(entry.score),
        eventId,
      }

      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaderboardEntry),
      })

      if (!response.ok) {
        throw new Error(`Failed to sync entry: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error syncing entry to MongoDB:', error)
      throw error
    }
  }

  // Sync all leaderboard data from smart contract to MongoDB
  static async syncLeaderboardToMongoDB(eventId: string, limit: number = 100) {
    try {
      // This would typically be called from a server-side function
      // For now, we'll create a helper that can be used in API routes
      console.log(`Syncing leaderboard data for event: ${eventId}`)
      
      // In a real implementation, you would:
      // 1. Fetch data from smart contract (server-side)
      // 2. Transform the data
      // 3. Save to MongoDB
      
      return { success: true, message: 'Leaderboard sync initiated' }
    } catch (error) {
      console.error('Error syncing leaderboard:', error)
      throw error
    }
  }

  // Get leaderboard from MongoDB
  static async getLeaderboard(eventId: string, limit: number = 100) {
    try {
      const response = await fetch(`/api/leaderboard?eventId=${eventId}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }
  }

  // Get available events
  static async getEvents() {
    try {
      const response = await fetch('/api/events')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }
}
