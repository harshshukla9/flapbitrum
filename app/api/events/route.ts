import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Leaderboard from '../../../lib/models/Leaderboard'

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Get all unique eventIds from the leaderboard collection
    const events = await Leaderboard.distinct('eventId')
    
    // Sort events (assuming they follow a pattern like week-1, week-2, etc.)
    const sortedEvents = events.sort((a, b) => {
      // Extract numbers from eventIds for proper sorting
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0')
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0')
      return aNum - bNum
    })

    return NextResponse.json({
      events: sortedEvents,
      totalEvents: sortedEvents.length,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
