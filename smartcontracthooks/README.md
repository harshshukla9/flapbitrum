# Smart Contract Hooks

This directory contains React hooks for interacting with the Flappy Bird game smart contract on Arbitrum.

## Overview

The smart contract hooks provide a complete interface for:
- Reading game data from the blockchain
- Writing scores to the smart contract
- Managing game state with blockchain integration
- Displaying leaderboards and user statistics

## Contract Details

- **Contract Address**: `0xf21de389278EAf3aC631e1327712F70949BAb150`
- **Network**: Arbitrum
- **Functions**: Score management, leaderboard queries, user ranking

## Available Hooks

### `useFlappyContract.ts`

Core hooks for smart contract interactions:

#### Read Hooks

- `useGetAllScores()` - Get all scores in descending order
- `useGetMyScore()` - Get current user's score
- `useGetScore(userAddress)` - Get score for specific user
- `useGetTopScores(limit)` - Get top N scores
- `useGetTotalUsers()` - Get total number of users
- `useGetUserRank(userAddress)` - Get rank for specific user
- `useHasScore(userAddress)` - Check if user has a score

#### Write Hooks

- `useSetScore()` - Save score to smart contract

#### Utility Hooks

- `useLeaderboard(limit)` - Get formatted leaderboard data
- `useMyGameData()` - Get current user's complete game data

### `useGameState.ts`

Game state management with smart contract integration:

- `useGameState()` - Complete game state management
  - Game state (score, level, difficulty, game over status)
  - Smart contract integration
  - Score saving functionality
  - Personal best tracking

## Usage Examples

### Basic Score Reading

```tsx
import { useGetMyScore, useLeaderboard } from '../smartcontracthooks'

function MyComponent() {
  const { data: myScore, isLoading } = useGetMyScore()
  const { leaderboard, totalUsers } = useLeaderboard(10)
  
  return (
    <div>
      <p>My Score: {myScore || 0}</p>
      <p>Total Players: {totalUsers}</p>
    </div>
  )
}
```

### Saving Scores

```tsx
import { useSetScore } from '../smartcontracthooks'

function GameComponent() {
  const { setScore, isPending, isSuccess } = useSetScore()
  
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore)
  }
  
  return (
    <div>
      {isPending && <p>Saving score...</p>}
      {isSuccess && <p>Score saved!</p>}
    </div>
  )
}
```

### Complete Game State Management

```tsx
import { useGameState } from '../smartcontracthooks'

function GameComponent() {
  const {
    gameState,
    startGame,
    endGame,
    contractScore,
    isNewPersonalBest,
    isConnected
  } = useGameState()
  
  const handleStart = () => {
    startGame('beginner')
  }
  
  const handleGameOver = (score: number) => {
    endGame(score)
  }
  
  return (
    <div>
      <p>Current Score: {gameState.score}</p>
      <p>Best Score: {contractScore}</p>
      {isNewPersonalBest && <p>New Personal Best! 🎉</p>}
    </div>
  )
}
```

## Leaderboard Integration

The leaderboard page (`/score`) automatically fetches and displays:
- Top 20 players by score
- Current user's rank and score
- Real-time updates every 30 seconds
- Wallet connection status
- Smart contract save status

## Error Handling

All hooks include error handling:
- Network connection issues
- Contract interaction failures
- Wallet connection problems
- Invalid data responses

## Performance Optimizations

- Automatic data refetching
- Cached contract reads
- Optimistic updates for better UX
- Background data synchronization

## Requirements

- Connected wallet (MetaMask, WalletConnect, etc.)
- Arbitrum network configured
- Sufficient gas for transactions
- React 18+ with hooks support

## Smart Contract Functions

### Read Functions
- `getAllScoresDescending()` - Returns all scores sorted
- `getMyScore()` - Returns caller's score
- `getScore(address)` - Returns score for address
- `getTopScores(uint256)` - Returns top N scores
- `getTotalUsers()` - Returns total user count
- `getUserRank(address)` - Returns rank for address
- `hasScore(address)` - Returns if user has score

### Write Functions
- `setScore(uint256)` - Saves user's score

### Events
- `NewUserAdded(address, uint256)` - New user with score
- `ScoreUpdated(address, uint256, uint256)` - Score updated
