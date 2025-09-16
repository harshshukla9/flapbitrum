'use client'

import React, { useEffect, useState } from 'react'
import { useLeaderboard, useMyGameData } from '../../smartcontracthooks'
import { useAccount } from 'wagmi'

const ScorePage = () => {
  const { address, isConnected } = useAccount()
  const { leaderboard, isLoading, error, refetch, totalUsers } = useLeaderboard(100)
  const { myScore, myRank, hasScore, isLoading: myDataLoading, username, fid, pfp } = useMyGameData()
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all')
  const [isClient, setIsClient] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [showRewardInfo, setShowRewardInfo] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
            // Check if user has seen the reward info before on leaderboard page
        const hasSeenLeaderboardRewardInfo = localStorage.getItem('flapbitrum_leaderboard_reward_info_seen')
        if (!hasSeenLeaderboardRewardInfo) {
            // Show reward info popup for first-time visitors to leaderboard
            setTimeout(() => {
                setShowRewardInfo(true)
            }, 1000) // Show after 1 second delay
        }
  }, [])

  // Countdown timer using Unix timestamp 1756441969 as end date
  useEffect(() => {
    // Set endDate to 7 days from now
    const endDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
  
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
        // Countdown finished
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer) // stop updating
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
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => window.location.href = '/unified-leaderboard'}
                className="bg-green-600/20 backdrop-blur-sm text-green-300 px-4 py-2 rounded-lg font-semibold hover:bg-green-600/30 transition-colors border border-green-500/30"
              >
                🗄️ Unified Leaderboard
              </button>
              <button
                onClick={() => window.location.href = '/auto-sync'}
                className="bg-purple-600/20 backdrop-blur-sm text-purple-300 px-4 py-2 rounded-lg font-semibold hover:bg-purple-600/30 transition-colors border border-purple-500/30"
              >
                🔄 Auto-Sync Leaderboard
              </button>
              <button
                onClick={() => window.location.href = '/weekly-tournament'}
                className="bg-emerald-600/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
              >
                🏆 Weekly Tournament
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
          
          {/* Reward Pool Announcement */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-yellow-500/30">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-3xl">Week-5 is live 💰</span>
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                $50 USDC Reward Pool
              </h2>
              <span className="text-3xl">💰</span>
              <button
                onClick={() => setShowRewardInfo(true)}
                className="ml-2 w-8 h-8 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-full flex items-center justify-center transition-all duration-200 border border-yellow-400/30 hover:scale-110"
                title="Reward Distribution Info"
              >
                <span className="text-sm font-bold">ℹ️</span>
              </button>
            </div>
            <p className="text-lg text-yellow-200 mb-4">
              Top 15 players will share the reward pool!
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
            <div className="flex items-center justify-center mb-4">
              {/* Profile Picture */}
              {pfp && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mr-4">
                  <img 
                    src={pfp} 
                    alt="Your Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="text-center">
                <div className="text-xl font-bold text-white mb-1">
                  {username || formatAddress(address || '')}
                </div>
                {fid && (
                  <div className="text-sm text-gray-300">FID: {fid}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {myDataLoading ? '...' : myScore}
                </div>
                <div className="text-gray-300">Your Best Score</div>
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
              <h2 className="text-2xl font-bold text-white">Top 15 Players</h2>
              <p className="text-sm text-gray-300">💰 Top 15 will share $50 USDC reward pool</p>
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
                const rank = index + 1;
                const isInRewardPool = rank <= 30;
                const isTop15 = rank <= 15;
                
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
                    <div className={`text-2xl font-bold ${getScoreColor(Number(entry.score))}`}>
                      {Number(entry.score)}
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

        {/* Reward Info Popup */}
        {showRewardInfo && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowRewardInfo(false)
              // Mark that user has seen the reward info on leaderboard page
              localStorage.setItem('flapbitrum_leaderboard_reward_info_seen', 'true')
            }}
          >
                        <div 
              className="bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <h2 className="text-xl font-bold text-white">Reward Distribution</h2>
                </div>
                <button
                  onClick={() => {
                    setShowRewardInfo(false)
                    // Mark that user has seen the reward info on leaderboard page
                    localStorage.setItem('flapbitrum_leaderboard_reward_info_seen', 'true')
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">🏆 $50 USDC Prize Pool</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    The total prize pool of $50 USDC will be distributed among the top 15 players based on their final scores.
                  </p>
                </div>

                {/* Reward Distribution Table */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-md font-semibold text-white mb-3">📊 Distribution Breakdown:</h4>
                  
                  {/* Top 3 Prizes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥇</span>
                        <div>
                          <div className="font-bold text-white">1st Place</div>
                          <div className="text-sm text-yellow-300">Champion</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-300">$7.50</div>
                        <div className="text-xs text-gray-300">15% of pool</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-xl border border-gray-400/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <div>
                          <div className="font-bold text-white">2nd Place</div>
                          <div className="text-sm text-gray-300">Runner-up</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-300">$6.00</div>
                        <div className="text-xs text-gray-300">12% of pool</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-400/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥉</span>
                        <div>
                          <div className="font-bold text-white">3rd Place</div>
                          <div className="text-sm text-orange-300">Bronze</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-300">$5.00</div>
                        <div className="text-xs text-gray-300">10% of pool</div>
                      </div>
                    </div>
                  </div>

                  {/* Places 4-10 */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-400/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏅</span>
                      <div>
                        <div className="font-bold text-white">4th - 10th Place</div>
                        <div className="text-sm text-blue-300">7 players</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-300">$3.50 each</div>
                      <div className="text-xs text-gray-300">49% of pool</div>
                    </div>
                  </div>

                  {/* Places 11-15 */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <div className="font-bold text-white">11th - 15th Place</div>
                        <div className="text-sm text-purple-300">5 players</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-300">$2.00 each</div>
                      <div className="text-xs text-gray-300">10% of pool</div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-md font-semibold text-white mb-2">📋 Important Notes:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Rewards are paid in USDC on Arbitrum network</li>
                    <li>• Minimum payout threshold applies</li>
                    <li>• Winners must have a connected wallet</li>
                    <li>• Contest ends on August 29, 2025</li>
                    <li>• Ties are resolved by earliest submission time</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/20">
                <button
                  onClick={() => {
                    setShowRewardInfo(false)
                    // Mark that user has seen the reward info on leaderboard page
                    localStorage.setItem('flapbitrum_leaderboard_reward_info_seen', 'true')
                  }}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  Got it! 👍
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScorePage