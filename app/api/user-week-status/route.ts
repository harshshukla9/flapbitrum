import { NextRequest, NextResponse } from 'next/server'
import { 
  hasUserParticipatedThisWeek, 
  getUserCurrentWeekStats,
  getCurrentActiveWeek 
} from '../../../lib/weeklyEventManager'

// GET /api/user-week-status?eventId=week-3&userAddress=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const userAddress = searchParams.get('userAddress')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      )
    }
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress parameter is required' },
        { status: 400 }
      )
    }

    // Get current active week
    const currentWeek = getCurrentActiveWeek()
    
    // Check if user has participated in this week
    const hasParticipated = await hasUserParticipatedThisWeek(eventId, userAddress)
    
    // Get user's current week stats
    const userStats = await getUserCurrentWeekStats(eventId, userAddress)
    
    return NextResponse.json({
      success: true,
      eventId,
      userAddress,
      currentWeek,
      hasParticipated,
      userStats,
      message: hasParticipated 
        ? `User has participated in ${eventId}` 
        : `User has not participated in ${eventId} yet`
    })
  } catch (error) {
    console.error('Error getting user week status:', error)
    return NextResponse.json(
      { error: 'Failed to get user week status' },
      { status: 500 }
    )
  }
}
