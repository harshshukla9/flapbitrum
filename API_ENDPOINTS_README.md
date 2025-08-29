# API Endpoints Documentation

This document provides a complete reference for all API endpoints in the MongoDB-based leaderboard system.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, all endpoints are public and don't require authentication. In production, consider adding authentication middleware.

## Response Format
All endpoints return JSON responses with the following structure:
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

Error responses:
```json
{
  "error": "Error description",
  "status": 400
}
```

---

## 1. Leaderboard Management

### GET /api/leaderboard
Fetches leaderboard data for a specific event.

**URL Parameters:**
- `eventId` (required): Event identifier (e.g., "week-1", "week-2")
- `limit` (optional): Number of entries to return (default: 100, max: 1000)

**Example Request:**
```bash
curl "http://localhost:3000/api/leaderboard?eventId=week-1&limit=50"
```

**Example Response:**
```json
{
  "leaderboard": [
    {
      "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
      "username": "lhutfi",
      "fid": "1052444",
      "pfp": "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/499d16b9-b698-47fa-8da9-74ea93cdec00/original",
      "score": 34345,
      "eventId": "week-1",
      "rank": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalUsers": 25,
  "eventId": "week-1"
}
```

**Error Responses:**
- `400`: Missing eventId parameter
- `500`: Database connection error

---

### POST /api/leaderboard
Creates or updates a leaderboard entry.

**Request Body:**
```json
{
  "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
  "username": "lhutfi",
  "fid": "1052444",
  "pfp": "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/499d16b9-b698-47fa-8da9-74ea93cdec00/original",
  "score": 34345,
  "eventId": "week-1"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/leaderboard" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
    "username": "lhutfi",
    "fid": "1052444",
    "pfp": "https://example.com/pfp.jpg",
    "score": 34345,
    "eventId": "week-1"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Leaderboard entry updated successfully",
  "data": {
    "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
    "username": "lhutfi",
    "fid": "1052444",
    "pfp": "https://example.com/pfp.jpg",
    "score": 34345,
    "eventId": "week-1"
  }
}
```

**Validation Rules:**
- All fields are required
- `score` must be a positive number
- `user` address is automatically converted to lowercase
- `fid` is stored as string

**Error Responses:**
- `400`: Missing required fields or invalid score
- `500`: Database error

---

## 2. Event Management

### GET /api/events
Fetches all available event IDs.

**Example Request:**
```bash
curl "http://localhost:3000/api/events"
```

**Example Response:**
```json
{
  "events": ["week-1", "week-2", "week-3"],
  "totalEvents": 3
}
```

**Error Responses:**
- `500`: Database connection error

---

## 3. Data Synchronization

### POST /api/sync-leaderboard
Syncs leaderboard data from smart contract to MongoDB.

**Request Body:**
```json
{
  "eventId": "week-1",
  "limit": 100
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/sync-leaderboard" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "week-1",
    "limit": 100
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Synced 25 entries for event week-1",
  "results": {
    "total": 25,
    "successful": 25,
    "errors": 0,
    "details": [
      {
        "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
        "score": 34345,
        "status": "success"
      }
    ]
  }
}
```

**Error Responses:**
- `400`: Missing eventId parameter
- `500`: Smart contract or database error

---

### GET /api/sync-leaderboard
Gets sync status and statistics for an event.

**URL Parameters:**
- `eventId` (required): Event identifier

**Example Request:**
```bash
curl "http://localhost:3000/api/sync-leaderboard?eventId=week-1"
```

**Example Response:**
```json
{
  "eventId": "week-1",
  "stats": {
    "totalEntries": 25,
    "highestScore": 34345,
    "averageScore": 15678.5,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "message": "Event week-1 has 25 entries"
}
```

**Error Responses:**
- `400`: Missing eventId parameter
- `500`: Database error

---

## 4. Data Population

### POST /api/populate-data
Populates initial test data or adds new events.

**Request Body Options:**

**Option 1: Populate Initial Data**
```json
{
  "action": "populate"
}
```

**Option 2: Add New Event**
```json
{
  "action": "addEvent",
  "eventId": "week-3",
  "sampleData": [
    {
      "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
      "username": "lhutfi",
      "fid": "1052444",
      "pfp": "https://example.com/pfp.jpg",
      "score": 34345
    }
  ]
}
```

**Example Request (Populate):**
```bash
curl -X POST "http://localhost:3000/api/populate-data" \
  -H "Content-Type: application/json" \
  -d '{"action": "populate"}'
```

**Example Response (Populate):**
```json
{
  "success": true,
  "message": "Initial data populated successfully",
  "result": {
    "success": true,
    "week1Count": 5,
    "week2Count": 3
  }
}
```

**Example Request (Add Event):**
```bash
curl -X POST "http://localhost:3000/api/populate-data" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addEvent",
    "eventId": "week-3",
    "sampleData": [
      {
        "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
        "username": "lhutfi",
        "fid": "1052444",
        "pfp": "https://example.com/pfp.jpg",
        "score": 34345
      }
    ]
  }'
```

**Example Response (Add Event):**
```json
{
  "success": true,
  "message": "Event week-3 added successfully",
  "result": {
    "success": true,
    "eventId": "week-3",
    "count": 1
  }
}
```

---

### GET /api/populate-data
Gets information about available actions.

**Example Request:**
```bash
curl "http://localhost:3000/api/populate-data"
```

**Example Response:**
```json
{
  "message": "Use POST to populate data",
  "actions": {
    "populate": "Populate initial test data for week-1 and week-2",
    "addEvent": "Add a new event with optional sample data"
  },
  "example": {
    "populate": "POST /api/populate-data with { \"action\": \"populate\" }",
    "addEvent": "POST /api/populate-data with { \"action\": \"addEvent\", \"eventId\": \"week-3\", \"sampleData\": [...] }"
  }
}
```

---

## 5. Webhook Endpoints

### POST /api/webhook
Handles webhook notifications (existing endpoint).

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "score_update",
    "data": {
      "user": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96",
      "score": 34345
    }
  }'
```

---

### POST /api/send-notification
Sends notifications (existing endpoint).

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/send-notification" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "New high score achieved!",
    "recipient": "0xa4687cea9b2b0d8f593ad405c2b86c23e241dc96"
  }'
```

---

## 6. Error Codes Reference

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing parameters, invalid data format |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Internal Server Error | Database error, smart contract error |

## 7. Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting for production use:

```javascript
// Example rate limiting configuration
{
  "windowMs": 15 * 60 * 1000, // 15 minutes
  "max": 100 // limit each IP to 100 requests per windowMs
}
```

## 8. Testing Endpoints

### Health Check
```bash
curl "http://localhost:3000/api/events"
```

### Test Data Population
```bash
curl -X POST "http://localhost:3000/api/populate-data" \
  -H "Content-Type: application/json" \
  -d '{"action": "populate"}'
```

### Test Leaderboard API
```bash
curl "http://localhost:3000/api/leaderboard?eventId=week-1"
```

### Test Sync Status
```bash
curl "http://localhost:3000/api/sync-leaderboard?eventId=week-1"
```

## 9. Environment Variables

Required environment variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/flaapy-leaderboard

# Smart Contract (for sync functionality)
CONTRACT_ADDRESS=0x...
CONTRACT_ABI=...
```

## 10. Database Schema

### Leaderboard Collection
```javascript
{
  _id: ObjectId,
  user: String,           // Wallet address (lowercase)
  username: String,       // Display name
  fid: String,           // Farcaster ID
  pfp: String,           // Profile picture URL
  score: Number,         // Player score
  eventId: String,       // Event identifier
  createdAt: Date,       // Entry creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Indexes
```javascript
// For efficient leaderboard queries
{ eventId: 1, score: -1 }

// Unique constraint per user per event
{ eventId: 1, user: 1 }

// For user queries across events
{ user: 1 }
```

## 11. Performance Considerations

1. **Indexing**: All queries use indexed fields for optimal performance
2. **Pagination**: Use `limit` parameter to control response size
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **Connection Pooling**: MongoDB connection is cached and reused

## 12. Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **SQL Injection**: MongoDB prevents SQL injection by design
3. **Rate Limiting**: Implement rate limiting for production
4. **Authentication**: Add authentication middleware for sensitive operations
5. **CORS**: Configure CORS for cross-origin requests

## 13. Monitoring and Logging

All endpoints include error logging:
```javascript
console.error('Error message:', error)
```

Consider implementing structured logging for production:
```javascript
logger.error('API Error', {
  endpoint: '/api/leaderboard',
  error: error.message,
  timestamp: new Date().toISOString()
})
```

---

## Quick Start Guide

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Populate test data:**
   ```bash
   curl -X POST "http://localhost:3000/api/populate-data" \
     -H "Content-Type: application/json" \
     -d '{"action": "populate"}'
   ```

3. **Test the API:**
   ```bash
   curl "http://localhost:3000/api/leaderboard?eventId=week-1"
   ```

4. **Create a new event:**
   ```bash
   curl -X POST "http://localhost:3000/api/populate-data" \
     -H "Content-Type: application/json" \
     -d '{"action": "addEvent", "eventId": "week-3"}'
   ```

5. **Sync from smart contract:**
   ```bash
   curl -X POST "http://localhost:3000/api/sync-leaderboard" \
     -H "Content-Type: application/json" \
     -d '{"eventId": "week-1", "limit": 100}'
   ```
