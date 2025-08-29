import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Leaderboard from '../../../lib/models/Leaderboard'
import { createPublicClient, http } from 'viem'
import { arbitrum } from 'viem/chains'
import contractConfig from '../../../lib/contract'

// Create a public client for reading from the smart contract
const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
})

// POST /api/sync-leaderboard
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { eventId, limit = 100 } = body
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    console.log(`Starting sync for event: ${eventId}`)

    // Read leaderboard data from smart contract
    const leaderboardData = await publicClient.readContract({
      address: contractConfig.contractAddress as `0x${string}`,
      abi: contractConfig.abi,
      functionName: 'getTopScores',
      args: [BigInt(limit)],
    })

    if (!Array.isArray(leaderboardData)) {
      throw new Error('Invalid data format from smart contract')
    }

    console.log(`Found ${leaderboardData.length} entries to sync`)

    // Process and save each entry to MongoDB
    const syncResults = []
    
    for (const entry of leaderboardData) {
      try {
        const leaderboardEntry = {
          user: entry.user.toLowerCase(),
          username: entry.username || 'Anonymous',
          fid: entry.fid ? entry.fid.toString() : '0',
          pfp: entry.pfp || '',
          score: Number(entry.score),
          eventId,
        }

        // Use findOneAndUpdate with upsert to either update existing entry or create new one
        const result = await Leaderboard.findOneAndUpdate(
          { eventId, user: leaderboardEntry.user },
          leaderboardEntry,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        )

        syncResults.push({
          user: result.user,
          score: result.score,
          status: 'success',
        })
      } catch (error) {
        console.error(`Error syncing entry for user ${entry.user}:`, error)
        syncResults.push({
          user: entry.user,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = syncResults.filter(r => r.status === 'success').length
    const errorCount = syncResults.filter(r => r.status === 'error').length

    console.log(`Sync completed: ${successCount} successful, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} entries for event ${eventId}`,
      results: {
        total: leaderboardData.length,
        successful: successCount,
        errors: errorCount,
        details: syncResults,
      },
    })
  } catch (error) {
    console.error('Error syncing leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to sync leaderboard' },
      { status: 500 }
    )
  }
}

// GET /api/sync-leaderboard?eventId=week-1
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      )
    }

    // Get sync status for the event
    const eventStats = await Leaderboard.aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          highestScore: { $max: '$score' },
          averageScore: { $avg: '$score' },
          lastUpdated: { $max: '$updatedAt' },
        },
      },
    ])

    const stats = eventStats[0] || {
      totalEntries: 0,
      highestScore: 0,
      averageScore: 0,
      lastUpdated: null,
    }

    return NextResponse.json({
      eventId,
      stats,
      message: `Event ${eventId} has ${stats.totalEntries} entries`,
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
