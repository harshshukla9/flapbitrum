import mongoose, { Schema, Document } from 'mongoose'

export interface ILeaderboard extends Document {
  user: string
  username: string
  fid: string
  pfp: string
  score: number
  eventId: string
  createdAt: Date
  updatedAt: Date
}

const LeaderboardSchema = new Schema<ILeaderboard>(
  {
    user: {
      type: String,
      required: true,
      lowercase: true, // Store addresses in lowercase for consistency
    },
    username: {
      type: String,
      required: true,
    },
    fid: {
      type: String,
      required: true,
    },
    pfp: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    eventId: {
      type: String,
      required: true,
      index: true, // Index for faster queries by eventId
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
)

// Compound index for efficient leaderboard queries
// This allows fast queries by eventId sorted by score descending
LeaderboardSchema.index({ eventId: 1, score: -1 })

// Compound index for user lookup within an event
LeaderboardSchema.index({ eventId: 1, user: 1 }, { unique: true })

// Index for user queries across all events
LeaderboardSchema.index({ user: 1 })

export default mongoose.models.Leaderboard || mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema)
