# 🏆💰 Dual Leaderboard System

## 🎯 **What You Now Have**

A **comprehensive dual leaderboard system** with two distinct views:

### **1. 🏆 Score Leaderboard** (Weekly Rewards)
- **Purpose**: Track game scores for weekly reward distribution
- **Data Source**: Direct blockchain calls to your leaderboard contract
- **Rewards**: Weekly distribution based on top scores
- **Features**: 
  - Shows game scores with profile pictures
  - Reward eligibility indicators (top 15, top 30)
  - Real-time blockchain data

### **2. 💰 Token Claims Leaderboard** (Daily Rewards)
- **Purpose**: Track token claims for daily reward tracking
- **Data Source**: `TokenRewarded` events + profile data from blockchain
- **Rewards**: Daily token claiming rewards
- **Features**:
  - Shows ARB, PEPE, BOOP token amounts claimed
  - Profile pictures and usernames from Farcaster
  - Event syncing with blockchain

## 🚀 **How It Works**

### **User Experience:**
1. **Two Tab Buttons** at the top:
   - 🏆 **Score Leaderboard** - "Weekly Rewards"
   - 💰 **Token Claims** - "Daily Rewards"

2. **"My Position" Card** - Shows user's ranking in current tab
3. **Main Leaderboard** - Shows top performers
4. **Sync Events Button** - For token claims (refreshes blockchain data)

### **Technical Flow:**

**Score Leaderboard:**
```
User Plays Game → Score Stored on Chain → Direct Blockchain Call → Display Leaderboard
```

**Token Claims Leaderboard:**
```
User Claims Token → TokenRewarded Event → Sync API → getUserProfile() → Store in DB → Display Leaderboard
```

## 📱 **Features**

### **Both Leaderboards:**
- ✅ **Profile Pictures**: Farcaster profile pics displayed
- ✅ **Usernames**: Farcaster usernames shown
- ✅ **"My Position"**: User's ranking prominently displayed
- ✅ **Mobile Friendly**: Card-based responsive design
- ✅ **Real-time Data**: Fresh data from blockchain

### **Score Leaderboard Specific:**
- ✅ **Game Scores**: Shows actual game performance
- ✅ **Reward Indicators**: Highlights top 30 ARB payout zone
- ✅ **Direct Blockchain**: No database dependency
- ✅ **Weekly Focus**: For weekly reward distribution

### **Token Claims Leaderboard Specific:**
- ✅ **Token Amounts**: ARB, PEPE, BOOP with formatting
- ✅ **Claim Count**: Number of times user claimed
- ✅ **Event Syncing**: Sync blockchain events
- ✅ **Daily Focus**: For daily reward tracking

## 🎮 **User Engagement Strategy**

### **Weekly Rewards (Score-based):**
- Users play to improve their score
- Top 30 players get weekly rewards
- Encourages consistent gameplay

### **Daily Rewards (Token Claims):**
- Users claim tokens daily
- Leaderboard shows who's most active
- Encourages daily engagement

## 🔧 **Setup Instructions**

### **1. Access the Dual Leaderboard:**
```
http://localhost:3000/dual-leaderboard
```

### **2. Sync Token Events (First Time):**
- Click the **"Sync Events"** button in Token Claims tab
- This fetches all `TokenRewarded` events from blockchain

### **3. Switch Between Views:**
- Click **"🏆 Score Leaderboard"** for game scores
- Click **"💰 Token Claims"** for token rewards

## 📊 **Data Sources**

### **Score Leaderboard:**
- **Contract**: `0xf8d0FeEfF7093f353EF897Fb680bC463E03BCce0`
- **Function**: `getTopScores(limit)`
- **Real-time**: Direct blockchain calls

### **Token Claims Leaderboard:**
- **Events**: `TokenRewarded` from `0xD7bd7b687eed415749467f0FDcFe9316ce51Eef9`
- **Profiles**: `getUserProfile()` from leaderboard contract
- **Storage**: MongoDB `tokenRewards` collection

## 🎯 **Benefits**

1. **Dual Engagement**: Users can compete on both scores AND token claims
2. **Weekly + Daily**: Different reward cycles for sustained engagement
3. **Clear Separation**: Easy to understand which leaderboard is which
4. **Profile Integration**: Farcaster profiles make it personal
5. **Mobile Optimized**: Works great on mobile devices

## 🚀 **Next Steps**

1. **Test the dual leaderboard** by visiting `/dual-leaderboard`
2. **Sync token events** to see your claims
3. **Switch between tabs** to see both leaderboards
4. **Deploy to production** when ready

---

**🎉 You now have a complete dual leaderboard system that covers both weekly score-based rewards and daily token claim rewards!**
