import { NextRequest, NextResponse } from 'next/server'
import { populateInitialData, addNewEvent } from '../../../lib/populateInitialData'

// POST /api/populate-data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, eventId, sampleData } = body
    
    if (action === 'populate') {
      const result = await populateInitialData()
      return NextResponse.json({
        success: true,
        message: 'Initial data populated successfully',
        result,
      })
    } else if (action === 'addEvent') {
      if (!eventId) {
        return NextResponse.json(
          { error: 'eventId is required for addEvent action' },
          { status: 400 }
        )
      }
      
      const result = await addNewEvent(eventId, sampleData || [])
      return NextResponse.json({
        success: true,
        message: `Event ${eventId} added successfully`,
        result,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "populate" or "addEvent"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error populating data:', error)
    return NextResponse.json(
      { error: 'Failed to populate data' },
      { status: 500 }
    )
  }
}

// GET /api/populate-data
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to populate data',
    actions: {
      populate: 'Populate initial test data for week-1 and week-2',
      addEvent: 'Add a new event with optional sample data',
    },
    example: {
      populate: 'POST /api/populate-data with { "action": "populate" }',
      addEvent: 'POST /api/populate-data with { "action": "addEvent", "eventId": "week-3", "sampleData": [...] }',
    },
  })
}
