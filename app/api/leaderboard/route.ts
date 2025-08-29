import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Leaderboard from '../../../lib/models/Leaderboard'
import { LeaderboardResponse, CreateLeaderboardEntryRequest, LeaderboardEntry } from '../../../types'

// GET /api/leaderboard?eventId=week-1
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      )
    }

    // Get leaderboard entries for the specified event, sorted by score descending
    const leaderboardData = await Leaderboard.find({ eventId })
      .sort({ score: -1 })
      .limit(limit)
      .lean()

    // Add rank to each entry and ensure proper typing
    const leaderboardWithRanks: LeaderboardEntry[] = leaderboardData.map((entry, index) => ({
      user: entry.user,
      username: entry.username,
      fid: entry.fid,
      pfp: entry.pfp,
      score: entry.score,
      eventId: entry.eventId,
      rank: index + 1,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))

    // Get total users for this event
    const totalUsers = await Leaderboard.countDocuments({ eventId })

    const response: LeaderboardResponse = {
      leaderboard: leaderboardWithRanks,
      totalUsers,
      eventId,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

// POST /api/leaderboard
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body: CreateLeaderboardEntryRequest = await request.json()
    
    // Validate required fields
    const { user, username, fid, pfp, score, eventId } = body
    
    if (!user || !username || !fid || !pfp || score === undefined || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: user, username, fid, pfp, score, eventId' },
        { status: 400 }
      )
    }

    // Validate score is a positive number
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Score must be a positive number' },
        { status: 400 }
      )
    }

    // First, check if user already has an entry for this event
    const existingEntry = await Leaderboard.findOne({ 
      eventId, 
      user: user.toLowerCase() 
    })

    let finalScore = score
    let operation = 'created'

    if (existingEntry) {
      // Add new score to existing score (cumulative scoring)
      finalScore = existingEntry.score + score
      operation = 'updated'
      console.log(`📊 Cumulative scoring: ${existingEntry.score} + ${score} = ${finalScore} for user ${user}`)
    } else {
      console.log(`📊 New entry: ${score} points for user ${user}`)
    }

    // Use findOneAndUpdate with upsert to either update existing entry or create new one
    const result = await Leaderboard.findOneAndUpdate(
      { eventId, user: user.toLowerCase() },
      {
        username,
        fid,
        pfp,
        score: finalScore, // Use cumulative score
        eventId,
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return the updated document
        setDefaultsOnInsert: true, // Set default values on insert
      }
    )

    return NextResponse.json({
      success: true,
      message: `Leaderboard entry ${operation} successfully`,
      data: {
        user: result.user,
        username: result.username,
        fid: result.fid,
        pfp: result.pfp,
        score: result.score,
        eventId: result.eventId,
        previousScore: existingEntry ? existingEntry.score : 0,
        newScoreAdded: score,
        totalScore: finalScore,
        operation,
      },
    })
  } catch (error) {
    console.error('Error updating leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to update leaderboard' },
      { status: 500 }
    )
  }
}
