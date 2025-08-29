# MongoDB Leaderboard System

This document describes the new MongoDB-based leaderboard system that allows multiple events/tournaments without contract redeployment.

## Overview

The system has been refactored to store leaderboard data in MongoDB instead of reading directly from the smart contract. This enables:

- Multiple events/tournaments with different `eventId` values
- Historical leaderboard data preservation
- No contract redeployment required for new events
- Better performance and scalability

## Architecture

### Database Schema

**Leaderboard Collection:**
```typescript
{
  user: string,           // Wallet address (lowercase)
  username: string,       // Display name
  fid: string,           // Farcaster ID
  pfp: string,           // Profile picture URL
  score: number,         // Player score
  eventId: string,       // Event identifier (e.g., "week-1", "week-2")
  createdAt: Date,       // Entry creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Indexes
- `{ eventId: 1, score: -1 }` - For efficient leaderboard queries
- `{ eventId: 1, user: 1 }` - Unique constraint per user per event
- `{ user: 1 }` - For user queries across events

## API Endpoints

### 1. GET /api/leaderboard?eventId=week-1
Fetches leaderboard data for a specific event.

**Query Parameters:**
- `eventId` (required): Event identifier
- `limit` (optional): Number of entries to return (default: 100)

**Response:**
```json
{
  "leaderboard": [
    {
      "user": "0x...",
      "username": "player1",
      "fid": "123456",
      "pfp": "https://...",
      "score": 1000,
      "eventId": "week-1",
      "rank": 1
    }
  ],
  "totalUsers": 50,
  "eventId": "week-1"
}
```

### 2. POST /api/leaderboard
Creates or updates a leaderboard entry.

**Request Body:**
```json
{
  "user": "0x...",
  "username": "player1",
  "fid": "123456",
  "pfp": "https://...",
  "score": 1000,
  "eventId": "week-1"
}
```

### 3. GET /api/events
Fetches all available event IDs.

**Response:**
```json
{
  "events": ["week-1", "week-2", "week-3"],
  "totalEvents": 3
}
```

### 4. POST /api/sync-leaderboard
Syncs data from smart contract to MongoDB.

**Request Body:**
```json
{
  "eventId": "week-1",
  "limit": 100
}
```

### 5. GET /api/sync-leaderboard?eventId=week-1
Gets sync status for an event.

### 6. POST /api/populate-data
Populates initial test data.

**Request Body:**
```json
{
  "action": "populate"
}
```

## React Hooks

### useMongoLeaderboard(eventId, limit)
Fetches leaderboard data from MongoDB.

```typescript
const { data, isLoading, error, refetch } = useMongoLeaderboard('week-1', 100)
```

### useEvents()
Fetches available events.

```typescript
const { data: eventsData, isLoading } = useEvents()
```

### useUserScore(eventId, userAddress)
Gets user's score and rank for a specific event.

```typescript
const { userScore, userRank, hasScore } = useUserScore('week-1', address)
```

### useUpdateLeaderboardEntry()
Updates a leaderboard entry.

```typescript
const updateEntry = useUpdateLeaderboardEntry()
updateEntry.mutate({
  user: address,
  username: 'player1',
  fid: '123456',
  pfp: 'https://...',
  score: 1000,
  eventId: 'week-1'
})
```

## Components

### MongoLeaderboard
A complete leaderboard component with event selection.

**Props:**
- `defaultEventId`: Default event to display

**Features:**
- Event dropdown selection
- Real-time data updates
- User stats display
- Reward eligibility indicators

## Usage Examples

### 1. Creating a New Event
```typescript
// Add a new event via API
await fetch('/api/populate-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'addEvent',
    eventId: 'week-3',
    sampleData: [
      {
        user: '0x...',
        username: 'player1',
        fid: '123456',
        pfp: 'https://...',
        score: 1000
      }
    ]
  })
})
```

### 2. Syncing from Smart Contract
```typescript
// Sync current leaderboard to MongoDB
await fetch('/api/sync-leaderboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: 'week-1',
    limit: 100
  })
})
```

### 3. Using the Leaderboard Component
```typescript
import MongoLeaderboard from '../components/MongoLeaderboard'

function App() {
  return <MongoLeaderboard defaultEventId="week-1" />
}
```

## Environment Setup

### 1. MongoDB Connection
Add to your `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/flaapy-leaderboard
```

### 2. Dependencies
The system requires these additional dependencies:
```json
{
  "mongodb": "^6.19.0",
  "mongoose": "^8.18.0"
}
```

## Migration from Smart Contract

### 1. Initial Data Population
```bash
# Populate initial test data
curl -X POST http://localhost:3000/api/populate-data \
  -H "Content-Type: application/json" \
  -d '{"action": "populate"}'
```

### 2. Sync Existing Data
```bash
# Sync current smart contract data
curl -X POST http://localhost:3000/api/sync-leaderboard \
  -H "Content-Type: application/json" \
  -d '{"eventId": "week-1", "limit": 100}'
```

## Benefits

1. **Multiple Events**: Create new events without contract changes
2. **Historical Data**: Preserve all leaderboard history
3. **Better Performance**: Faster queries and updates
4. **Scalability**: Handle more data and concurrent users
5. **Flexibility**: Easy to modify leaderboard logic
6. **Cost Effective**: Reduce blockchain transactions

## Future Enhancements

1. **Event Management UI**: Admin interface for creating events
2. **Advanced Analytics**: Detailed statistics and trends
3. **Real-time Updates**: WebSocket integration for live updates
4. **Caching**: Redis integration for better performance
5. **Backup System**: Automated data backup and recovery

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check `MONGODB_URI` environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Data Not Syncing**
   - Check smart contract address and ABI
   - Verify blockchain network configuration
   - Check API endpoint logs

3. **Performance Issues**
   - Ensure proper indexes are created
   - Consider implementing caching
   - Monitor query performance

### Debug Commands

```bash
# Check MongoDB connection
curl http://localhost:3000/api/events

# Test leaderboard API
curl "http://localhost:3000/api/leaderboard?eventId=week-1"

# Check sync status
curl "http://localhost:3000/api/sync-leaderboard?eventId=week-1"
```
