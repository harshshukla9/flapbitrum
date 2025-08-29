'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useMongoLeaderboard, useEvents, useUserScore } from '../smartcontracthooks/useMongoLeaderboard'
import { LeaderboardEntry } from '../types'

interface MongoLeaderboardProps {
  defaultEventId?: string
}

const MongoLeaderboard: React.FC<MongoLeaderboardProps> = ({ defaultEventId = 'week-1' }) => {
  const { address, isConnected } = useAccount()
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId)
  const [isClient, setIsClient] = useState(false)
  const [showRewardInfo, setShowRewardInfo] = useState(false)

  // Fetch available events and leaderboard data
  const { data: eventsData, isLoading: eventsLoading } = useEvents()
  const { data: leaderboardData, isLoading: leaderboardLoading, error, refetch } = useMongoLeaderboard(selectedEventId, 100)
  const { userScore, userRank, hasScore, isLoading: userDataLoading } = useUserScore(selectedEventId, address)

  useEffect(() => {
    setIsClient(true)
    
    // Check if user has seen the reward info before
    const hasSeenLeaderboardRewardInfo = localStorage.getItem('flapbitrum_leaderboard_reward_info_seen')
    if (!hasSeenLeaderboardRewardInfo) {
      setTimeout(() => {
        setShowRewardInfo(true)
      }, 1000)
    }
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    if (score >= 20) return 'text-orange-500'
    return 'text-gray-500'
  }

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Leaderboard</h2>
          <p className="text-gray-300 mb-6">Failed to load leaderboard data. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              ← Back to Home
            </button>
            <div className="flex-1"></div>
          </div>
          
          {/* Event Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              🏆 Leaderboard
            </h2>
            
            {/* Event Dropdown */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
              <label className="text-white font-semibold">Select Event:</label>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={eventsLoading}
              >
                {eventsLoading ? (
                  <option>Loading events...</option>
                ) : (
                  eventsData?.events?.map((eventId: string) => (
                    <option key={eventId} value={eventId}>
                      {eventId.charAt(0).toUpperCase() + eventId.slice(1).replace('-', ' ')}
                    </option>
                  )) || []
                )}
              </select>
              
              <button
                onClick={() => refetch()}
                disabled={leaderboardLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {leaderboardLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Event Info */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="text-xl font-bold text-yellow-300">
                  {selectedEventId.charAt(0).toUpperCase() + selectedEventId.slice(1).replace('-', ' ')} Event
                </h3>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-lg text-yellow-200 mb-3">
                Top 15 players will share the reward pool!
              </p>
              <p className="text-sm text-gray-300">
                {leaderboardData?.totalUsers || 0} players competing for the top spot
              </p>
            </div>
          </div>
        </div>

        {/* User Stats */}
        {isClient && isConnected && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-4">
                Your Stats for {selectedEventId.charAt(0).toUpperCase() + selectedEventId.slice(1).replace('-', ' ')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {userDataLoading ? '...' : userScore || 0}
                </div>
                <div className="text-gray-300">Your Best Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {userDataLoading ? '...' : userRank || 'N/A'}
                </div>
                <div className="text-gray-300">Your Rank</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {hasScore ? '✅' : '❌'}
                </div>
                <div className="text-gray-300">Has Played</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Top Players</h2>
              <p className="text-sm text-gray-300">💰 Top 15 will share reward pool</p>
            </div>
          </div>

          {leaderboardLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : !leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Scores Yet</h3>
              <p className="text-gray-300">Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData.leaderboard.map((entry: LeaderboardEntry, index: number) => {
                const rank = entry.rank || index + 1;
                const isInRewardPool = rank <= 30;
                const isTop15 = rank <= 15;
                
                return (
                  <div
                    key={`${entry.user}-${entry.eventId}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/5 ${
                      address?.toLowerCase() === entry.user.toLowerCase()
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : isInRewardPool 
                          ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {/* Profile Picture with Rank Icon Overlay */}
                        {entry.pfp ? (
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                              <img 
                                src={entry.pfp} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            {/* Rank Icon Overlay */}
                            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
                              {rank <= 3 ? getRankIcon(rank) : rank}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center border-2 border-white/20">
                              <span className="text-white text-lg font-bold">
                                {(entry.username || formatAddress(entry.user)).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Rank Icon Overlay */}
                            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
                              {rank <= 3 ? getRankIcon(rank) : rank}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">
                            {entry.username || formatAddress(entry.user)}
                            {address?.toLowerCase() === entry.user.toLowerCase() && (
                              <span className="ml-2 text-blue-400 text-sm">(You)</span>
                            )}
                            {isInRewardPool && (
                              <span className="ml-2 text-yellow-400 text-sm">💰</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Rank #{rank}
                           
                            {isTop15 ? (
                              <span className="ml-2 text-yellow-300">Reward Eligible</span>
                            ) : (
                              <span className="ml-2 text-orange-300">Play more to climb the leaderboard</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>
                      {entry.score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Call to Action */}
        {isClient && !isConnected && (
          <div className="text-center mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-4">
                Connect your wallet to see your scores and compete on the leaderboard!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MongoLeaderboard
