# Weekly Tournament System Documentation

This document describes the weekly tournament system that provides fresh starts for all participants, ensuring equal chances for new players to win.

## Overview

The weekly tournament system addresses the problem of new participants having a disadvantage against veterans by:

1. **Fresh Starts**: Each week begins with all scores reset to 0
2. **Equal Opportunities**: New players have the same chance as veterans
3. **Weekly Cycles**: Regular tournaments with clear start/end dates
4. **Fair Competition**: No cumulative advantages from previous weeks

## Key Features

### 🎯 **Fresh Start Every Week**
- All participants start from 0 points
- No carryover from previous weeks
- Equal opportunity for everyone

### 🏆 **Weekly Tournament Structure**
- **Week 1**: First tournament (completed)
- **Week 2**: Second tournament (completed)
- **Week 3**: Current active tournament
- **Future Weeks**: Automatically scheduled

### 💰 **Prize Pool Distribution**
- $50 USDC per week
- Top 15 players share the pool
- Fresh competition each week

## Architecture

### Components

1. **Weekly Event Manager** (`lib/weeklyEventManager.ts`)
2. **Weekly Tournament Component** (`components/WeeklyTournament.tsx`)
3. **Weekly Events API** (`app/api/weekly-events/route.ts`)
4. **Weekly Events Hooks** (`smartcontracthooks/useWeeklyEvents.ts`)

### Data Flow

```
Weekly Event Manager → API Routes → React Hooks → UI Components
```

## Implementation Details

### 1. Weekly Event Manager

**File**: `lib/weeklyEventManager.ts`

```typescript
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
```

**Key Functions**:
- `getCurrentActiveWeek()`: Get currently active tournament
- `startNewWeek()`: Start a new week (reset scores)
- `getEventStats()`: Get tournament statistics
- `resetEventScores()`: Reset all scores for an event

### 2. Weekly Events API

**Endpoints**:

#### GET /api/weekly-events
```bash
# Get all events
curl "http://localhost:3000/api/weekly-events"

# Get current active week
curl "http://localhost:3000/api/weekly-events?action=current"

# Get next week to start
curl "http://localhost:3000/api/weekly-events?action=next"

# Get event statistics
curl "http://localhost:3000/api/weekly-events?action=stats&eventId=week-3"
```

#### POST /api/weekly-events
```bash
# Start a new week
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "eventId": "week-4"}'

# Reset event scores
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "eventId": "week-3"}'

# Create new event
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "eventId": "week-4",
    "name": "Week 4 Tournament",
    "startDate": "2024-02-05T00:00:00Z",
    "endDate": "2024-02-12T00:00:00Z",
    "totalPrizePool": 50,
    "description": "Fourth week of the tournament!"
  }'
```

### 3. React Hooks

**File**: `smartcontracthooks/useWeeklyEvents.ts`

```typescript
// Get current active week
const { data: currentWeekData } = useCurrentActiveWeek()

// Get current week leaderboard
const { data: leaderboardData } = useCurrentWeekLeaderboard(eventId, 100)

// Get user's current week status
const { data: userStatusData } = useUserCurrentWeekStatus(eventId)

// Start a new week
const { mutate: startNewWeek } = useStartNewWeek()

// Reset event scores
const { mutate: resetEventScores } = useResetEventScores()
```

### 4. Weekly Tournament Component

**Features**:
- ✅ **Current Week Display**: Shows active tournament info
- ✅ **Fresh Start Messaging**: Emphasizes equal opportunities
- ✅ **User Stats**: Current week participation status
- ✅ **Real-time Leaderboard**: Live updates for current week
- ✅ **New Week Announcements**: Popup when new week starts

## Usage Examples

### 1. Starting a New Week

```typescript
import { useStartNewWeek } from '../smartcontracthooks/useWeeklyEvents'

const AdminPanel = () => {
  const { mutate: startNewWeek } = useStartNewWeek()
  
  const handleStartNewWeek = () => {
    startNewWeek('week-4', {
      onSuccess: () => {
        console.log('✅ New week started! All participants start from 0.')
      }
    })
  }
  
  return (
    <button onClick={handleStartNewWeek}>
      Start Week 4 Tournament
    </button>
  )
}
```

### 2. Displaying Current Week Info

```typescript
import { useCurrentActiveWeek } from '../smartcontracthooks/useWeeklyEvents'

const CurrentWeekInfo = () => {
  const { data: currentWeekData } = useCurrentActiveWeek()
  const currentWeek = currentWeekData?.currentWeek
  
  if (!currentWeek) {
    return <div>No active tournament</div>
  }
  
  return (
    <div>
      <h2>{currentWeek.name}</h2>
      <p>{currentWeek.description}</p>
      <p>Prize Pool: ${currentWeek.totalPrizePool} USDC</p>
      <p>Participants: {currentWeek.totalParticipants}</p>
    </div>
  )
}
```

### 3. User Participation Status

```typescript
import { useUserCurrentWeekStatus } from '../smartcontracthooks/useWeeklyEvents'

const UserStatus = ({ eventId }) => {
  const { data: userStatusData } = useUserCurrentWeekStatus(eventId)
  
  if (!userStatusData?.hasParticipated) {
    return (
      <div className="fresh-start-encouragement">
        <p>🎯 Perfect opportunity for new players!</p>
        <p>Everyone starts from 0 - no advantage for veterans!</p>
        <button>Start Playing Now!</button>
      </div>
    )
  }
  
  return (
    <div>
      <p>Current Score: {userStatusData.userStats.currentScore}</p>
      <p>Current Rank: {userStatusData.userStats.rank}</p>
    </div>
  )
}
```

## Weekly Tournament Flow

### 1. **Week Start**
```
Admin starts new week → All scores reset to 0 → 
New week announcement → Fresh competition begins
```

### 2. **During the Week**
```
Players compete → Scores saved to current week → 
Real-time leaderboard updates → Fair competition
```

### 3. **Week End**
```
Tournament ends → Winners determined → 
Prize distribution → Next week preparation
```

## Benefits

### 1. **Equal Opportunities**
- New players have the same chance as veterans
- No cumulative advantages
- Fresh start every week

### 2. **Increased Engagement**
- Regular tournaments maintain interest
- Clear start/end dates create urgency
- Fair competition encourages participation

### 3. **Scalable System**
- Easy to add new weeks
- Automated week management
- Flexible prize pool configuration

### 4. **User Experience**
- Clear tournament information
- Real-time updates
- Encouraging messaging for new players

## Admin Functions

### 1. **Start New Week**
```bash
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "eventId": "week-4"}'
```

### 2. **Reset Scores**
```bash
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "eventId": "week-3"}'
```

### 3. **Create New Event**
```bash
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "eventId": "week-5",
    "name": "Week 5 Tournament",
    "startDate": "2024-02-12T00:00:00Z",
    "endDate": "2024-02-19T00:00:00Z",
    "totalPrizePool": 50,
    "description": "Fifth week - another fresh start!"
  }'
```

## User Experience Features

### 1. **New Week Announcement**
- Popup when new week starts
- Emphasizes fresh start opportunity
- Encourages immediate participation

### 2. **Fresh Start Messaging**
- Clear communication about equal opportunities
- Encouragement for new players
- Highlighting the fair competition

### 3. **Current Week Stats**
- User's current week score
- Current week rank
- Participation status
- Total participants

### 4. **Real-time Updates**
- Live leaderboard updates
- Current week focus
- Immediate feedback

## Testing

### 1. **Test New Week Start**
```bash
# Start a new week
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "eventId": "week-4"}'

# Verify current week
curl "http://localhost:3000/api/weekly-events?action=current"
```

### 2. **Test Score Reset**
```bash
# Reset scores for current week
curl -X POST "http://localhost:3000/api/weekly-events" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "eventId": "week-3"}'

# Verify leaderboard is empty
curl "http://localhost:3000/api/leaderboard?eventId=week-3"
```

### 3. **Test User Participation**
```bash
# Check user status
curl "http://localhost:3000/api/user-week-status?eventId=week-3&userAddress=0x..."
```

## Future Enhancements

### 1. **Automated Week Management**
- Automatic week transitions
- Scheduled announcements
- Email notifications

### 2. **Advanced Statistics**
- Weekly performance trends
- Player progression tracking
- Historical tournament data

### 3. **Tournament Variants**
- Different game modes per week
- Special event tournaments
- Seasonal championships

### 4. **Social Features**
- Tournament brackets
- Player matchups
- Community challenges

## Troubleshooting

### Common Issues

1. **Week Not Starting**
   - Check event configuration
   - Verify API endpoint
   - Check console logs

2. **Scores Not Resetting**
   - Verify reset API call
   - Check database permissions
   - Confirm event ID

3. **UI Not Updating**
   - Check React Query cache
   - Verify query invalidation
   - Check network requests

### Debug Commands

```bash
# Check current week
curl "http://localhost:3000/api/weekly-events?action=current"

# Check event stats
curl "http://localhost:3000/api/weekly-events?action=stats&eventId=week-3"

# Check user status
curl "http://localhost:3000/api/user-week-status?eventId=week-3&userAddress=0x..."
```

## Conclusion

The weekly tournament system successfully addresses the problem of new participants having disadvantages by providing fresh starts every week. This ensures:

- **Equal opportunities** for all players
- **Increased engagement** through regular tournaments
- **Fair competition** without cumulative advantages
- **Scalable system** for future growth

The system is production-ready and provides a complete solution for managing weekly tournaments with fresh starts.
