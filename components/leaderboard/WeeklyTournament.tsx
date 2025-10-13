'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCurrentActiveWeek, useCurrentWeekLeaderboard, useUserCurrentWeekStatus, useEventStats } from '../../smartcontracthooks/useWeeklyEvents'
import { LeaderboardEntry } from '../../types'

const WeeklyTournament: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [isClient, setIsClient] = useState(false)
  const [showNewWeekAnnouncement, setShowNewWeekAnnouncement] = useState(false)

  // Get current active week
  const { data: currentWeekData, isLoading: currentWeekLoading } = useCurrentActiveWeek()
  const currentWeek = currentWeekData?.currentWeek

  // Get current week leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading, error, refetch } = useCurrentWeekLeaderboard()

  // Get user's current week status
  const { data: userStatusData, isLoading: userStatusLoading } = useUserCurrentWeekStatus()

  // Get event statistics
  const { data: eventStatsData, isLoading: statsLoading } = useEventStats()

  useEffect(() => {
    setIsClient(true)
    
    // Show new week announcement if this is a fresh week
    const totalParticipants = (eventStatsData as any)?.stats?.totalParticipants
    if (currentWeek && typeof totalParticipants === 'number' && totalParticipants === 0) {
      setShowNewWeekAnnouncement(true)
      setTimeout(() => setShowNewWeekAnnouncement(false), 5000)
    }
  }, [currentWeek, eventStatsData])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Tournament</h2>
          <p className="text-gray-300 mb-6">Failed to load tournament data. Please try again.</p>
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
      {/* New Week Announcement */}
      {showNewWeekAnnouncement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl border border-green-500/30 shadow-2xl max-w-md w-full p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-300 mb-4">New Week Started!</h2>
            <p className="text-green-200 mb-4">
              {currentWeek?.name}
            </p>
            <p className="text-sm text-green-300 mb-6">
              Everyone starts from 0 - equal chance to win! 🎯
            </p>
            <button
              onClick={() => setShowNewWeekAnnouncement(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Let's Play! 🚀
            </button>
          </div>
        </div>
      )}

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
                🗄️ All Events
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
          
          {/* Current Week Info */}
          {currentWeekLoading ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded mb-4"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded"></div>
              </div>
            </div>
          ) : currentWeek ? (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-green-500/30">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <span className="text-3xl">🏆</span>
                <h2 className="text-2xl md:text-3xl font-bold text-green-300">
                  {currentWeek.name}
                </h2>
                <span className="text-3xl">🏆</span>
              </div>
              
              <p className="text-lg text-green-200 mb-4">
                {currentWeek.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-sm text-green-300 mb-1">Start Date</div>
                  <div className="text-white font-semibold">{currentWeek?.startDate ? formatDate(currentWeek.startDate.toString()) : '-'}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-sm text-green-300 mb-1">End Date</div>
                  <div className="text-white font-semibold">{currentWeek?.endDate ? formatDate(currentWeek.endDate.toString()) : '-'}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="text-sm text-green-300 mb-1">Prize Pool</div>
                  <div className="text-white font-semibold">${currentWeek?.totalPrizePool ?? 50} USDC</div>
                </div>
              </div>
              
              {/* Fresh Start Message */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-lg font-bold text-yellow-300">Fresh Start!</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-yellow-200 text-sm">
                  Everyone starts from 0 - equal chance for all participants! New players have the same opportunity to win as veterans.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
              <div className="text-4xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Active Tournament</h2>
              <p className="text-gray-300">Check back soon for the next weekly tournament!</p>
            </div>
          )}
        </div>

        {/* User Stats for Current Week */}
        {isClient && isConnected && currentWeek && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-4">
                Your Current Week Stats
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {userStatusLoading ? '...' : (userStatusData as any)?.userStats?.currentScore || 0}
                </div>
                <div className="text-gray-300">Current Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {userStatusLoading ? '...' : (userStatusData as any)?.userStats?.rank || 'N/A'}
                </div>
                <div className="text-gray-300">Current Rank</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {userStatusLoading ? '...' : (userStatusData as any)?.hasParticipated ? '✅' : '❌'}
                </div>
                <div className="text-gray-300">Has Participated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? '...' : (eventStatsData as any)?.stats?.totalParticipants || 0}
                </div>
                <div className="text-gray-300">Total Participants</div>
              </div>
            </div>
            
            {/* Fresh Start Encouragement */}
            {!((userStatusData as any)?.hasParticipated) && (
              <div className="mt-4 text-center">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-200 font-semibold">
                    🎮 Ready to compete? Play now and start your journey to the top!
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Start Playing Now! 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Week Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Current Week Leaderboard</h2>
              <p className="text-sm text-gray-300">
                🎯 Fresh start - everyone begins from 0! Top 15 will share ${currentWeek?.totalPrizePool || 50} USDC
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={leaderboardLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {leaderboardLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {leaderboardLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : !(leaderboardData as any)?.leaderboard || (leaderboardData as any).leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Tournament Just Started!</h3>
              <p className="text-gray-300 mb-4">Be the first to set a score and take the lead!</p>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                <p className="text-green-200 font-semibold mb-3">
                  🎉 Perfect opportunity for new players!
                </p>
                <p className="text-green-300 text-sm">
                  Everyone starts from 0 - no advantage for previous winners. 
                  This is your chance to shine! ✨
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Playing Now! 🚀
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(leaderboardData as any).leaderboard.map((entry: LeaderboardEntry, index: number) => {
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
                              <span className="ml-2 text-orange-300">Keep playing to climb!</span>
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
                Connect your wallet to participate in the weekly tournament!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyTournament
