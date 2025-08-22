'use client'

import React, { useEffect, useState } from 'react'
import { useLeaderboard, useMyGameData } from '../../smartcontracthooks'
import { useAccount } from 'wagmi'

const ScorePage = () => {
  const { address, isConnected } = useAccount()
  const { leaderboard, isLoading, error, refetch, totalUsers } = useLeaderboard(30)
  const { myScore, myRank, hasScore, isLoading: myDataLoading } = useMyGameData()
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all')
  const [isClient, setIsClient] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Countdown timer for 7 days from now
  useEffect(() => {
    // Get or create the end date from localStorage
    let endDate: Date
    const storedEndDate = localStorage.getItem('flappyContestEndDate')
    
    if (storedEndDate) {
      endDate = new Date(storedEndDate)
    } else {
      // Create new end date (7 days from now) and store it
      endDate = new Date()
      endDate.setDate(endDate.getDate() + 7) // 7 days from now
      localStorage.setItem('flappyContestEndDate', endDate.toISOString())
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = endDate.getTime() - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

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
          
          {/* Reward Pool Announcement */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-yellow-500/30">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-3xl">💰</span>
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                $50 USDC Reward Pool
              </h2>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-lg text-yellow-200 mb-4">
              Top 30 players will share the reward pool!
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-yellow-300 mb-3 font-semibold">⏰ Contest Ends In:</p>
              <div className="flex justify-center space-x-4 md:space-x-6">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white bg-red-500/20 rounded-lg px-3 py-2">
                    {timeLeft.days.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white bg-red-500/20 rounded-lg px-3 py-2">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white bg-red-500/20 rounded-lg px-3 py-2">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white bg-red-500/20 rounded-lg px-3 py-2">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Seconds</div>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🏆 Flappy Bird Leaderboard
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {totalUsers} players competing for the top spot
          </p>
          
          {/* Time Filter */}
          <div className="flex justify-center gap-2 mb-6">
            {['all', 'today', 'week'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User Stats */}
        {isClient && isConnected && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                {/* <div className="text-3xl font-bold text-white mb-2">
                  {myDataLoading ? '...' : myScore}
                </div>
                <div className="text-gray-300">Your Best Score</div> */}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {myDataLoading ? '...' : myRank || 'N/A'}
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
              <h2 className="text-2xl font-bold text-white">Top 30 Players</h2>
              <p className="text-sm text-gray-300">💰 Top 30 will share $50 USDC reward pool</p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Scores Yet</h3>
              <p className="text-gray-300">Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const rank = entry.rank || index + 1;
                const isInRewardPool = rank <= 30;
                
                return (
                  <div
                    key={entry.user}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/5 ${
                      address?.toLowerCase() === entry.user.toLowerCase()
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : isInRewardPool 
                          ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-white min-w-[60px]">
                        {getRankIcon(rank)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {formatAddress(entry.user)}
                          {address?.toLowerCase() === entry.user.toLowerCase() && (
                            <span className="ml-2 text-blue-400 text-sm">(You)</span>
                          )}
                          {isInRewardPool && (
                            <span className="ml-2 text-yellow-400 text-sm">💰</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Rank #{rank}
                          {isInRewardPool && (
                            <span className="ml-2 text-yellow-300">Reward Eligible</span>
                          )}
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

export default ScorePage