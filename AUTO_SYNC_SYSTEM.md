# Auto-Sync System Documentation

This document describes the auto-sync system that automatically updates MongoDB whenever a user's score is successfully stored in the smart contract.

## Overview

The auto-sync system ensures that MongoDB is always in sync with the smart contract by:

1. **Automatic MongoDB Updates**: When a user saves a score to the smart contract, it's automatically synced to MongoDB
2. **Event Listening**: Watches for smart contract events and updates MongoDB accordingly
3. **Real-time Updates**: Provides immediate feedback when data is being synced
4. **Fallback Mechanisms**: Manual sync options if automatic sync fails

## Architecture

### Components

1. **Enhanced Smart Contract Hooks** (`useFlappyContractWithMongo.ts`)
2. **Auto-Sync Leaderboard Component** (`AutoSyncLeaderboard.tsx`)
3. **Event Watchers** for smart contract events
4. **MongoDB Integration** via API routes

### Flow Diagram

```
User Plays Game → Score Achieved → Save to Smart Contract → 
Contract Event Emitted → Event Listener Detected → 
Update MongoDB → UI Refreshed → Leaderboard Updated
```

## Implementation Details

### 1. Enhanced Smart Contract Hook

**File**: `smartcontracthooks/useFlappyContractWithMongo.ts`

```typescript
export const useSetScoreWithMongo = (eventId: string = 'week-1') => {
  // Automatically syncs to MongoDB after successful contract call
  const setScore = async (score: number, username: string, fid: number, pfp: string) => {
    // 1. Call smart contract
    const result = await writeContract({...})
    
    // 2. If successful, update MongoDB
    if (result && address) {
      await updateLeaderboardEntry.mutateAsync({
        user: address,
        username,
        fid: fid.toString(),
        pfp,
        score,
        eventId,
      })
    }
  }
}
```

**Features**:
- ✅ Automatic MongoDB sync after contract success
- ✅ Error handling for MongoDB failures
- ✅ UI state management for sync status
- ✅ Query invalidation for real-time updates

### 2. Event Watchers

**Smart Contract Events Monitored**:
- `NewUserAdded`: When a new user is added to the contract
- `ScoreUpdated`: When a user's score is updated
- `ProfileUpdated`: When a user's profile is updated

```typescript
export const useWatchContractEvents = (eventId: string = 'week-1') => {
  // Watch for NewUserAdded events
  useWatchContractEvent({
    eventName: 'NewUserAdded',
    onLogs: async (logs) => {
      // Update MongoDB for each new user
      for (const log of logs) {
        await updateLeaderboardEntry.mutateAsync({...})
      }
    },
  });
}
```

### 3. Auto-Sync Leaderboard Component

**File**: `components/AutoSyncLeaderboard.tsx`

**Features**:
- ✅ Real-time event listening
- ✅ Manual sync capabilities
- ✅ Sync status indicators
- ✅ Event selection dropdown
- ✅ User statistics display

## Usage

### 1. Automatic Sync (Default Behavior)

When a user saves their score in the game:

1. **Game Component** uses `useSetScoreWithMongo` hook
2. **Smart Contract** transaction is executed
3. **MongoDB** is automatically updated
4. **UI** shows sync status and updates

```typescript
// In FlappyBirdGame.tsx
const { setScore: saveScoreToContractWithMongo } = useSetScoreWithMongo('week-1');

const handleSaveToChain = () => {
  // This automatically syncs to MongoDB after contract success
  saveScoreToContractWithMongo(score, username, fid, pfp);
};
```

### 2. Manual Sync

Users can manually sync data from smart contract to MongoDB:

```typescript
// In AutoSyncLeaderboard.tsx
const { syncAllData } = useSyncContractToMongo('week-1');

const handleManualSync = async () => {
  await syncAllData(); // Syncs all contract data to MongoDB
};
```

### 3. Event-Based Sync

The system automatically listens for contract events:

```typescript
// Automatically watches for contract events
useWatchContractEvents('week-1');
```

## API Integration

### 1. MongoDB Update API

**Endpoint**: `POST /api/leaderboard`

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

### 2. Sync Status API

**Endpoint**: `GET /api/sync-leaderboard?eventId=week-1`

```json
{
  "eventId": "week-1",
  "stats": {
    "totalEntries": 25,
    "highestScore": 34345,
    "averageScore": 15678.5,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

## UI Components

### 1. Sync Status Indicators

```typescript
// Shows when MongoDB is being updated
{isMongoUpdating && (
  <div className="text-center text-blue-300 py-2">
    🗄️ Updating MongoDB...
  </div>
)}

// Shows when both contract and MongoDB are updated
{scoreSavedWithMongo && (
  <div className="text-center text-green-300 py-3">
    ✅ Score saved to blockchain!
  </div>
)}
```

### 2. Manual Sync Button

```typescript
<button onClick={handleManualSync} disabled={syncLoading}>
  {syncLoading ? 'Syncing...' : `🔄 Manual Sync (${totalEntries} entries)`}
</button>
```

### 3. Auto-Sync Status

```typescript
<div className="text-sm text-blue-300">
  🔄 Auto-sync enabled
</div>
```

## Error Handling

### 1. Contract Success, MongoDB Failure

```typescript
try {
  await updateLeaderboardEntry.mutateAsync({...})
} catch (mongoError) {
  console.error("❌ Error updating MongoDB:", mongoError);
  // Don't throw - contract transaction was successful
}
```

### 2. Event Processing Errors

```typescript
onLogs: async (logs) => {
  for (const log of logs) {
    try {
      await updateLeaderboardEntry.mutateAsync({...})
    } catch (error) {
      console.error('❌ Error syncing event to MongoDB:', error);
    }
  }
}
```

### 3. Manual Sync Error Recovery

```typescript
const handleManualSync = async () => {
  setSyncStatus('🔄 Syncing data from smart contract...')
  try {
    await syncAllData()
    setSyncStatus('✅ Sync completed successfully!')
  } catch (error) {
    setSyncStatus('❌ Sync failed. Please try again.')
  }
}
```

## Performance Considerations

### 1. Query Invalidation

```typescript
// Invalidate and refetch leaderboard data after sync
queryClient.invalidateQueries({
  queryKey: ['mongo-leaderboard', eventId],
});
```

### 2. Debounced Updates

The system uses React Query's built-in caching and invalidation to prevent unnecessary API calls.

### 3. Event Batching

Multiple events are processed in batches to reduce database load.

## Monitoring and Debugging

### 1. Console Logs

```typescript
console.log('📡 NewUserAdded event detected:', logs);
console.log('✅ MongoDB synced from NewUserAdded event');
console.log('❌ Error syncing NewUserAdded event to MongoDB:', error);
```

### 2. UI Status Indicators

- 🔄 Auto-sync enabled
- 💾 Saving score to blockchain and MongoDB...
- 🗄️ Updating MongoDB...
- ✅ Score saved to blockchain and db!

### 3. Network Tab

Monitor API calls to `/api/leaderboard` for MongoDB updates.

## Testing

### 1. Test Auto-Sync

1. Play the game and achieve a score
2. Save score to blockchain
3. Verify MongoDB is updated automatically
4. Check leaderboard shows updated data

### 2. Test Manual Sync

1. Visit `/auto-sync` page
2. Click "Manual Sync" button
3. Verify all contract data is synced to MongoDB

### 3. Test Event Listening

1. Save a score from another wallet
2. Verify the auto-sync leaderboard updates automatically
3. Check console logs for event detection

## Benefits

### 1. **Automatic Synchronization**
- No manual intervention required
- Real-time updates across systems
- Consistent data between contract and MongoDB

### 2. **Improved User Experience**
- Immediate feedback on sync status
- No need to refresh pages manually
- Clear indication of what's happening

### 3. **Reliability**
- Multiple sync mechanisms (automatic + manual)
- Error handling and recovery
- Event-based updates for missed transactions

### 4. **Scalability**
- Event-driven architecture
- Efficient database operations
- Caching and invalidation strategies

## Future Enhancements

### 1. **WebSocket Integration**
- Real-time updates across multiple clients
- Live leaderboard updates
- Push notifications for new scores

### 2. **Advanced Event Processing**
- Event queuing for high-volume scenarios
- Retry mechanisms for failed syncs
- Event replay capabilities

### 3. **Analytics Dashboard**
- Sync performance metrics
- Error rate monitoring
- Data consistency reports

### 4. **Multi-Chain Support**
- Support for multiple blockchain networks
- Cross-chain data synchronization
- Unified leaderboard across chains

## Troubleshooting

### Common Issues

1. **MongoDB Not Updating**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check console for error messages

2. **Events Not Detected**
   - Ensure wallet is connected
   - Check contract address is correct
   - Verify event signatures match

3. **Sync Status Not Updating**
   - Check React Query cache
   - Verify query invalidation is working
   - Check component re-rendering

### Debug Commands

```bash
# Check MongoDB connection
curl http://localhost:3000/api/events

# Test manual sync
curl -X POST "http://localhost:3000/api/sync-leaderboard" \
  -H "Content-Type: application/json" \
  -d '{"eventId": "week-1", "limit": 100}'

# Check sync status
curl "http://localhost:3000/api/sync-leaderboard?eventId=week-1"
```

## Conclusion

The auto-sync system provides a robust, real-time synchronization between the smart contract and MongoDB, ensuring data consistency and providing an excellent user experience. The combination of automatic and manual sync mechanisms, along with comprehensive error handling, makes the system reliable and maintainable.
