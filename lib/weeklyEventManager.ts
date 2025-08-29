import dbConnect from './mongodb'
import Leaderboard from './models/Leaderboard'

export interface WeeklyEvent {
  eventId: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
  totalParticipants: number
  totalPrizePool: number
  description: string
}

// Sample weekly events configuration
const WEEKLY_EVENTS: WeeklyEvent[] = [
  {
    eventId: 'week-1',
    name: 'Week 1 Tournament',
    startDate: new Date('2025-01-13T00:00:00Z'),
    endDate: new Date('2025-01-20T00:00:00Z'),
    isActive: false,
    totalParticipants: 0,
    totalPrizePool: 50,
    description: 'First week of the Flapbitrum tournament!'
  },
  {
    eventId: 'week-2',
    name: 'Week 2 Tournament',
    startDate: new Date('2025-08-25T00:00:00Z'), // Last Monday
    endDate: new Date('2025-09-02T23:59:59Z'), // Next Tuesday at 11:59:59 PM
    isActive: true, // Current active week
    totalParticipants: 0,
    totalPrizePool: 50,
    description: 'Second week - fresh start for everyone!'
  },
  {
    eventId: 'week-3',
    name: 'Week 3 Tournament',
    startDate: new Date('2025-01-27T00:00:00Z'),
    endDate: new Date('2025-02-03T00:00:00Z'),
    isActive: false,
    totalParticipants: 0,
    totalPrizePool: 50,
    description: 'Third week - everyone starts from 0!'
  }
]

// Get current active week
export const getCurrentActiveWeek = (): WeeklyEvent | null => {
  const now = new Date()
  // First try to find an event that is marked as active
  const activeEvent = WEEKLY_EVENTS.find(event => event.isActive)
  if (activeEvent) {
    return activeEvent
  }
  
  // If no event is marked as active, find one based on current date
  return WEEKLY_EVENTS.find(event => 
    now >= event.startDate && now <= event.endDate
  ) || null
}

// Get next week to start
export const getNextWeekToStart = (): WeeklyEvent | null => {
  const now = new Date()
  return WEEKLY_EVENTS.find(event => 
    now < event.startDate
  ) || null
}

// Get all events
export const getAllEvents = (): WeeklyEvent[] => {
  return WEEKLY_EVENTS
}

// Create a new weekly event
export const createNewWeeklyEvent = async (
  eventId: string,
  name: string,
  startDate: Date,
  endDate: Date,
  totalPrizePool: number = 50,
  description: string = 'New weekly tournament!'
): Promise<WeeklyEvent> => {
  const newEvent: WeeklyEvent = {
    eventId,
    name,
    startDate,
    endDate,
    isActive: false,
    totalParticipants: 0,
    totalPrizePool,
    description
  }

  // Add to the events array
  WEEKLY_EVENTS.push(newEvent)
  
  return newEvent
}

// Start a new week (reset all scores)
export const startNewWeek = async (eventId: string): Promise<boolean> => {
  try {
    await dbConnect()
    
    // 1. Deactivate all current events
    WEEKLY_EVENTS.forEach(event => {
      event.isActive = false
    })
    
    // 2. Activate the new event
    const targetEvent = WEEKLY_EVENTS.find(event => event.eventId === eventId)
    if (targetEvent) {
      targetEvent.isActive = true
      targetEvent.totalParticipants = 0
    }
    
    // 3. Clear all existing scores for this event (optional - you might want to keep historical data)
    // await Leaderboard.deleteMany({ eventId })
    
    console.log(`✅ Week ${eventId} started successfully! All participants start from 0.`)
    return true
    
  } catch (error) {
    console.error(`❌ Error starting new week ${eventId}:`, error)
    return false
  }
}

// Get event statistics
export const getEventStats = async (eventId: string) => {
  try {
    await dbConnect()
    
    const stats = await Leaderboard.aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          highestScore: { $max: '$score' },
          averageScore: { $avg: '$score' },
          totalScores: { $sum: '$score' },
          lastUpdated: { $max: '$updatedAt' },
        },
      },
    ])

    return stats[0] || {
      totalParticipants: 0,
      highestScore: 0,
      averageScore: 0,
      totalScores: 0,
      lastUpdated: null,
    }
  } catch (error) {
    console.error(`Error getting stats for event ${eventId}:`, error)
    return null
  }
}

// Check if a user has participated in current week
export const hasUserParticipatedThisWeek = async (eventId: string, userAddress: string): Promise<boolean> => {
  try {
    await dbConnect()
    
    const userEntry = await Leaderboard.findOne({
      eventId,
      user: userAddress.toLowerCase()
    })
    
    return !!userEntry
  } catch (error) {
    console.error(`Error checking user participation for ${eventId}:`, error)
    return false
  }
}

// Get user's current week stats
export const getUserCurrentWeekStats = async (eventId: string, userAddress: string) => {
  try {
    await dbConnect()
    
    const userEntry = await Leaderboard.findOne({
      eventId,
      user: userAddress.toLowerCase()
    }).sort({ score: -1 })
    
    if (!userEntry) {
      return {
        hasParticipated: false,
        currentScore: 0,
        rank: null,
        attempts: 0
      }
    }
    
    // Get user's rank
    const rank = await Leaderboard.countDocuments({
      eventId,
      score: { $gt: userEntry.score }
    }) + 1
    
    return {
      hasParticipated: true,
      currentScore: userEntry.score,
      rank,
      attempts: 1, // You could track attempts if needed
      lastUpdated: userEntry.updatedAt
    }
  } catch (error) {
    console.error(`Error getting user stats for ${eventId}:`, error)
    return null
  }
}

// Reset all scores for a specific event (for admin use)
export const resetEventScores = async (eventId: string): Promise<boolean> => {
  try {
    await dbConnect()
    
    const result = await Leaderboard.deleteMany({ eventId })
    
    console.log(`✅ Reset ${result.deletedCount} scores for event ${eventId}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error resetting scores for event ${eventId}:`, error)
    return false
  }
}

// Get leaderboard for current week only
export const getCurrentWeekLeaderboard = async (eventId: string, limit: number = 100) => {
  try {
    await dbConnect()
    
    const leaderboardData = await Leaderboard.find({ eventId })
      .sort({ score: -1 })
      .limit(limit)
      .lean()

    // Add rank to each entry
    const leaderboardWithRanks = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      _id: undefined,
    }))

    return {
      leaderboard: leaderboardWithRanks,
      totalParticipants: leaderboardData.length,
      eventId,
    }
  } catch (error) {
    console.error(`Error getting current week leaderboard for ${eventId}:`, error)
    return null
  }
}

// Announce new week to users
export const announceNewWeek = (eventId: string, event: WeeklyEvent) => {
  console.log(`
🎉 NEW WEEK STARTED! 🎉

📅 Event: ${event.name}
🆔 Event ID: ${eventId}
💰 Prize Pool: $${event.totalPrizePool} USDC
📝 Description: ${event.description}

🎯 Everyone starts from 0 - equal chance to win!
🏆 Top 15 players will share the prize pool!

Good luck to all participants! 🚀
  `)
}
