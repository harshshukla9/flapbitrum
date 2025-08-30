import { NextRequest, NextResponse } from 'next/server'
import dbConnect, { getConnectionStatus } from '../../../lib/mongodb'
import Leaderboard from '../../../lib/models/Leaderboard'

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Connection status endpoint
    if (action === 'status') {
      const status = getConnectionStatus()
      return NextResponse.json({
        success: true,
        connection: status,
        message: 'Connection status retrieved successfully',
      })
    }

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
      success: true,
      events: sortedEvents,
      totalEvents: sortedEvents.length,
      message: 'Events retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
