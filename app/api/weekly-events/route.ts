import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllEvents, 
  getCurrentActiveWeek, 
  getNextWeekToStart,
  createNewWeeklyEvent,
  startNewWeek,
  getEventStats,
  resetEventScores,
  announceNewWeek
} from '../../../lib/weeklyEventManager'

// GET /api/weekly-events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'current') {
      const currentWeek = getCurrentActiveWeek()
      return NextResponse.json({
        success: true,
        currentWeek,
        message: currentWeek ? `Current active week: ${currentWeek.name}` : 'No active week found'
      })
    }
    
    if (action === 'next') {
      const nextWeek = getNextWeekToStart()
      return NextResponse.json({
        success: true,
        nextWeek,
        message: nextWeek ? `Next week to start: ${nextWeek.name}` : 'No upcoming weeks found'
      })
    }
    
    if (action === 'stats') {
      const eventId = searchParams.get('eventId')
      if (!eventId) {
        return NextResponse.json(
          { error: 'eventId parameter is required for stats action' },
          { status: 400 }
        )
      }
      
      const stats = await getEventStats(eventId)
      return NextResponse.json({
        success: true,
        eventId,
        stats,
        message: `Stats for event ${eventId}`
      })
    }
    
    // Default: get all events
    const allEvents = getAllEvents()
    const currentWeek = getCurrentActiveWeek()
    const nextWeek = getNextWeekToStart()
    
    return NextResponse.json({
      success: true,
      events: allEvents,
      currentWeek,
      nextWeek,
      totalEvents: allEvents.length,
      message: 'All weekly events retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting weekly events:', error)
    return NextResponse.json(
      { error: 'Failed to get weekly events' },
      { status: 500 }
    )
  }
}

// POST /api/weekly-events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventId, ...eventData } = body
    
    if (action === 'create') {
      const { name, startDate, endDate, totalPrizePool, description } = eventData
      
      if (!name || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'name, startDate, and endDate are required for creating events' },
          { status: 400 }
        )
      }
      
      const newEvent = await createNewWeeklyEvent(
        eventId,
        name,
        new Date(startDate),
        new Date(endDate),
        totalPrizePool || 50,
        description || 'New weekly tournament!'
      )
      
      return NextResponse.json({
        success: true,
        event: newEvent,
        message: `Event ${eventId} created successfully`
      })
    }
    
    if (action === 'start') {
      if (!eventId) {
        return NextResponse.json(
          { error: 'eventId is required for starting a week' },
          { status: 400 }
        )
      }
      
      const success = await startNewWeek(eventId)
      
      if (success) {
        const currentWeek = getCurrentActiveWeek()
        if (currentWeek) {
          announceNewWeek(eventId, currentWeek)
        }
        
        return NextResponse.json({
          success: true,
          message: `Week ${eventId} started successfully! All participants start from 0.`,
          currentWeek
        })
      } else {
        return NextResponse.json(
          { error: `Failed to start week ${eventId}` },
          { status: 500 }
        )
      }
    }
    
    if (action === 'reset') {
      if (!eventId) {
        return NextResponse.json(
          { error: 'eventId is required for resetting scores' },
          { status: 400 }
        )
      }
      
      const success = await resetEventScores(eventId)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: `All scores for event ${eventId} have been reset. Everyone starts fresh!`
        })
      } else {
        return NextResponse.json(
          { error: `Failed to reset scores for event ${eventId}` },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "create", "start", or "reset"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing weekly events:', error)
    return NextResponse.json(
      { error: 'Failed to manage weekly events' },
      { status: 500 }
    )
  }
}
