# Token Balance Display System

## Overview
This system displays the current token balances available in the smart contract reward pool to fascinate users and show them the potential rewards they can win.

## Components

### 1. useTokenBalances Hook (`smartcontracthooks/useTokenBalances.ts`)
- **Purpose**: Fetches token balances from the smart contract using `getTokenBalance` function
- **Features**:
  - Reads ARB, PEPE, and BOOP token balances
  - Formats balances from wei to readable format (with K/M suffixes)
  - Estimates USD values for each token
  - Provides loading states and error handling
  - Auto-refresh capability

### 2. TokenBalanceDisplay Component (`components/TokenBalanceDisplay.tsx`)
- **Purpose**: Beautiful UI component to display token balances
- **Features**:
  - Full display mode with detailed token cards
  - Compact mode for mobile/smaller spaces
  - Real-time balance updates
  - Error states with retry functionality
  - Responsive design with animations

### 3. Integration
- **Location**: Home page (both mobile and desktop versions)
- **Mobile**: Compact display above game mode buttons
- **Desktop**: Full display with detailed token information

## Token Configuration
```typescript
const TOKEN_CONFIG = {
  arb: { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0', icon: '🔵' },
  pepe: { symbol: 'PEPE', name: 'Pepe', color: '#00FF88', icon: '🐸' },
  boop: { symbol: 'BOOP', name: 'Boop', color: '#8B5CF6', icon: '🚀' }
}
```

## Smart Contract Integration
- **Contract**: TOKEN_REWARD_ABI with `getTokenBalance(tokenAddress)` function
- **Address**: Configured in `CONTRACT_ADDRESSES.TOKEN_REWARD`
- **Tokens**: ARB, PEPE, BOOP with their respective contract addresses

## User Experience Benefits
1. **Fascination Factor**: Shows real money value in the reward pool
2. **Transparency**: Users can see exactly what's available to win
3. **Motivation**: Large token amounts encourage gameplay
4. **Trust**: Real-time data from blockchain builds confidence

## Technical Features
- **Error Handling**: Graceful fallbacks and retry mechanisms
- **Performance**: Efficient caching and minimal re-renders
- **Accessibility**: Clear loading states and error messages
- **Responsive**: Adapts to different screen sizes

## Future Enhancements
- Add more token types
- Implement price feeds for accurate USD values
- Add historical balance tracking
- Create balance alerts/notifications
