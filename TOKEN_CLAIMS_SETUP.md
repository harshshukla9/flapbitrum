# 🎯 Token Claims Leaderboard Setup Guide

## ✅ **What's Been Implemented**

### 1. **Event Sync API** (`/api/sync-token-rewards`)
- Listens to `TokenRewarded` events from your claim contract
- Fetches user profiles from your leaderboard contract's `getUserProfile` function
- **Smart caching**: Only calls `getUserProfile` once per user address
- Stores all data in MongoDB `tokenRewards` collection

### 2. **Token Claims Leaderboard API** (`/api/token-claims-leaderboard`)
- Aggregates token rewards by user
- Calculates total amounts for ARB, PEPE, BOOP
- Sorts by total claim value
- Returns formatted leaderboard data

### 3. **Beautiful Leaderboard Component** (`/components/leaderboard/TokenClaimsLeaderboard.tsx`)
- Shows "My Position" card at the top
- Displays profile pictures, usernames, FIDs
- Shows token amounts with proper formatting
- Mobile-friendly design with cards

### 4. **New Route** (`/token-claims-leaderboard`)
- Dedicated page for the token claims leaderboard
- Updated main game to link to this new leaderboard

## 🚀 **How to Use**

### **Step 1: Start Your Development Server**
```bash
npm run dev
# or
pnpm dev
```

### **Step 2: Sync Token Rewards (First Time)**
```bash
# Visit this URL to sync events from blockchain
curl -X POST http://localhost:3000/api/sync-token-rewards

# Or use the manual sync endpoint
curl http://localhost:3000/api/sync-now
```

### **Step 3: View the Leaderboard**
Visit: `http://localhost:3000/token-claims-leaderboard`

## 📊 **How It Works**

### **Event Flow:**
1. **User claims tokens** → `TokenRewarded` event emitted
2. **Sync API detects event** → Gets user address, token, amount
3. **Fetches user profile** → Calls `getUserProfile(userAddress)` from leaderboard contract
4. **Stores everything** → MongoDB with profile data + token amount
5. **Leaderboard displays** → Aggregated data with profile pics

### **Smart Caching:**
- Only calls `getUserProfile()` once per user address
- Subsequent events for same user just add to token amounts
- No duplicate API calls = faster sync

### **Data Structure:**
```typescript
// MongoDB Document
{
  userAddress: "0x...",
  tokenAddress: "0x...",
  tokenSymbol: "ARB" | "PEPE" | "BOOP",
  amount: "1000000000000000000", // Raw amount
  transactionHash: "0x...",
  blockNumber: 12345,
  timestamp: 1234567890,
  // Profile data (cached from getUserProfile)
  username: "harshshukla",
  fid: "1108574",
  pfp: "https://imagedelivery.net/...",
  score: "1"
}
```

## 🎨 **Features**

### **Leaderboard Features:**
- ✅ **My Position Card**: Shows your ranking at the top
- ✅ **Profile Pictures**: Farcaster profile pics from `getUserProfile`
- ✅ **Usernames**: Farcaster usernames displayed
- ✅ **FID Display**: Shows Farcaster ID
- ✅ **Token Amounts**: Formatted ARB, PEPE, BOOP amounts
- ✅ **Claim Count**: Shows total number of claims
- ✅ **Mobile Friendly**: Card-based design
- ✅ **Real-time**: Refresh button to get latest data

### **Technical Features:**
- ✅ **Efficient Caching**: No duplicate profile fetches
- ✅ **Error Handling**: Graceful fallbacks
- ✅ **Pagination**: Ready for large datasets
- ✅ **Type Safety**: Full TypeScript support

## 🔧 **Configuration**

### **Contract Addresses** (Update these in `/api/sync-token-rewards/route.ts`):
```typescript
const TOKEN_REWARD_CONTRACT = '0xd7bd7b687eed415749467f0fdcfe9316ce51eef9' // Your claim contract
const LEADERBOARD_CONTRACT = '0xf8d0Cce0' // Your leaderboard contract (from image)
```

### **Token Addresses** (Already configured):
```typescript
const TOKEN_ADDRESSES = {
  '0x912CE59144191C1204E64559FE8253a0e49E6548': 'ARB',
  '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00': 'PEPE', 
  '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3': 'BOOP',
}
```

## 🎯 **Next Steps**

### **Automatic Syncing** (Optional):
Set up a cron job to sync automatically:
```bash
# Add to vercel.json
{
  "crons": [
    {
      "path": "/api/sync-token-rewards",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### **Production Deployment**:
1. Update contract addresses in production
2. Deploy to Vercel
3. Set up automatic syncing
4. Test the leaderboard

## 🎉 **Result**

You now have a **complete token claims leaderboard** that:
- ✅ Tracks all `TokenRewarded` events from now on
- ✅ Shows user profiles with Farcaster data
- ✅ Displays token amounts beautifully
- ✅ Works on mobile and desktop
- ✅ Updates in real-time

**No more previous data - fresh start from today!** 🚀
