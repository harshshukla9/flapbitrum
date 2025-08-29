import dbConnect from './mongodb'
import Leaderboard from './models/Leaderboard'

// Sample data for testing
const sampleLeaderboardData = [
  {
    user: '0xA4687CEa9B2B0D8F593ad405c2B86c23e241dC96',
    username: 'lhutfi',
    fid: '1052444',
    pfp: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/499d16b9-b698-47fa-8da9-74ea93cdec00/original',
    score: 34345,
    eventId: 'week-1',
  },
  {
    user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    username: 'crypto_gamer',
    fid: '1234567',
    pfp: 'https://example.com/pfp1.jpg',
    score: 28976,
    eventId: 'week-1',
  },
  {
    user: '0x8ba1f109551bD432803012645Hac136c772c3c3',
    username: 'flappy_master',
    fid: '2345678',
    pfp: 'https://example.com/pfp2.jpg',
    score: 25678,
    eventId: 'week-1',
  },
  {
    user: '0x1234567890123456789012345678901234567890',
    username: 'bird_lover',
    fid: '3456789',
    pfp: 'https://example.com/pfp3.jpg',
    score: 19876,
    eventId: 'week-1',
  },
  {
    user: '0xabcdef1234567890abcdef1234567890abcdef12',
    username: 'game_champion',
    fid: '4567890',
    pfp: 'https://example.com/pfp4.jpg',
    score: 15678,
    eventId: 'week-1',
  },
]

// Sample data for week-2
const week2Data = [
  {
    user: '0xA4687CEa9B2B0D8F593ad405c2B86c23e241dC96',
    username: 'lhutfi',
    fid: '1052444',
    pfp: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/499d16b9-b698-47fa-8da9-74ea93cdec00/original',
    score: 45678,
    eventId: 'week-2',
  },
  {
    user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    username: 'crypto_gamer',
    fid: '1234567',
    pfp: 'https://example.com/pfp1.jpg',
    score: 39876,
    eventId: 'week-2',
  },
  {
    user: '0x8ba1f109551bD432803012645Hac136c772c3c3',
    username: 'flappy_master',
    fid: '2345678',
    pfp: 'https://example.com/pfp2.jpg',
    score: 34567,
    eventId: 'week-2',
  },
]

export async function populateInitialData() {
  try {
    await dbConnect()
    
    console.log('Starting to populate initial data...')
    
    // Clear existing data (optional - remove this if you want to keep existing data)
    // await Leaderboard.deleteMany({})
    
    // Insert week-1 data
    for (const entry of sampleLeaderboardData) {
      await Leaderboard.findOneAndUpdate(
        { eventId: entry.eventId, user: entry.user.toLowerCase() },
        entry,
        { upsert: true, new: true }
      )
    }
    
    // Insert week-2 data
    for (const entry of week2Data) {
      await Leaderboard.findOneAndUpdate(
        { eventId: entry.eventId, user: entry.user.toLowerCase() },
        entry,
        { upsert: true, new: true }
      )
    }
    
    console.log('Initial data populated successfully!')
    
    // Get stats
    const week1Count = await Leaderboard.countDocuments({ eventId: 'week-1' })
    const week2Count = await Leaderboard.countDocuments({ eventId: 'week-2' })
    
    console.log(`Week-1 entries: ${week1Count}`)
    console.log(`Week-2 entries: ${week2Count}`)
    
    return { success: true, week1Count, week2Count }
  } catch (error) {
    console.error('Error populating initial data:', error)
    throw error
  }
}

// Function to add a new event
export async function addNewEvent(eventId: string, sampleData: any[] = []) {
  try {
    await dbConnect()
    
    console.log(`Adding new event: ${eventId}`)
    
    for (const entry of sampleData) {
      await Leaderboard.findOneAndUpdate(
        { eventId, user: entry.user.toLowerCase() },
        { ...entry, eventId },
        { upsert: true, new: true }
      )
    }
    
    const count = await Leaderboard.countDocuments({ eventId })
    console.log(`Event ${eventId} created with ${count} entries`)
    
    return { success: true, eventId, count }
  } catch (error) {
    console.error(`Error adding event ${eventId}:`, error)
    throw error
  }
}

// If this file is run directly, populate the data
if (require.main === module) {
  populateInitialData()
    .then(() => {
      console.log('Data population completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Data population failed:', error)
      process.exit(1)
    })
}
