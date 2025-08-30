import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flaapy-leaderboard'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

/**
 * Global connection cache for development and production environments
 * This ensures connection reuse across API calls in serverless environments
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Initialize cache
const globalCache: MongooseCache = {
  conn: null,
  promise: null,
}

// Use globalThis for better compatibility
const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache
}

// Check if we have an existing connection
if (globalWithMongoose._mongooseCache) {
  // Reuse existing connection if available
  const existingCache = globalWithMongoose._mongooseCache
  globalCache.conn = existingCache.conn
  globalCache.promise = existingCache.promise
} else {
  // Store in global for reuse across module reloads
  globalWithMongoose._mongooseCache = globalCache
}

/**
 * Enhanced MongoDB connection function with proper caching and error handling
 * Optimized for serverless environments like Vercel
 */
async function dbConnect(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (globalCache.conn) {
    console.log('🔄 Using existing MongoDB connection')
    return globalCache.conn
  }

  // Return pending connection promise if one exists
  if (globalCache.promise) {
    console.log('⏳ Waiting for existing MongoDB connection...')
    globalCache.conn = await globalCache.promise
    return globalCache.conn
  }

  // Create new connection
  console.log('🔍 Creating new MongoDB connection...')
  console.log('🔍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')) // Hide credentials

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  }

  try {
    // Create connection promise
    globalCache.promise = mongoose.connect(MONGODB_URI, opts)

    // Wait for connection and cache it
    globalCache.conn = await globalCache.promise

    console.log('✅ MongoDB connected successfully!')
    console.log('📊 Connection state:', mongoose.connection.readyState)
    console.log('🏠 Database:', mongoose.connection.db?.databaseName)

    // Set up connection event handlers
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      globalCache.conn = null
      globalCache.promise = null
    })

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected')
      globalCache.conn = null
      globalCache.promise = null
    })

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected')
    })

    return globalCache.conn

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    globalCache.promise = null
    globalCache.conn = null
    throw error
  }
}

/**
 * Gracefully close the MongoDB connection
 * Useful for cleanup in development or when shutting down
 */
export async function dbDisconnect(): Promise<void> {
  try {
    if (globalCache.conn) {
      await mongoose.disconnect()
      globalCache.conn = null
      globalCache.promise = null
      console.log('🔌 MongoDB connection closed gracefully')
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error)
    throw error
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus() {
  const state = mongoose.connection.readyState
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return {
    state: state,
    status: states[state as keyof typeof states] || 'unknown',
    database: mongoose.connection.db?.databaseName || null,
    host: mongoose.connection.host || null,
  }
}

export default dbConnect
