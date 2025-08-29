export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  //interfacee
}

// MongoDB Leaderboard Types
export interface LeaderboardEntry {
  user: string
  username: string
  fid: string
  pfp: string
  score: number
  eventId: string
  rank?: number
  createdAt: Date
  updatedAt: Date
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  totalUsers: number
  eventId: string
}

export interface CreateLeaderboardEntryRequest {
  user: string
  username: string
  fid: string
  pfp: string
  score: number
  eventId: string
}

export interface CreateLeaderboardEntryResponse {
  success: boolean
  message: string
  data: {
    user: string
    username: string
    fid: string
    pfp: string
    score: number
    eventId: string
    previousScore: number
    newScoreAdded: number
    totalScore: number
    operation: 'created' | 'updated'
  }
}

// Event Management Types
export interface EventInfo {
  eventId: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  isActive: boolean
}
