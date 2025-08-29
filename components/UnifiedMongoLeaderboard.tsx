'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useMongoLeaderboard, useEvents } from '../smartcontracthooks/useMongoLeaderboard'
import { useCurrentActiveWeek } from '../smartcontracthooks/useWeeklyEvents'
import { LeaderboardEntry } from '../types'

const UnifiedMongoLeaderboard: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [isClient, setIsClient] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('week-2')
  const [limit, setLimit] = useState(100)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showPrizeInfo, setShowPrizeInfo] = useState(false)

  // Get current active week
  const { data: currentWeekData } = useCurrentActiveWeek()
  const currentWeek = currentWeekData?.currentWeek

  // Get all available events
  const { data: eventsData, isLoading: eventsLoading } = useEvents()

  // Get leaderboard data for selected event
  const { data: leaderboardData, isLoading: leaderboardLoading, error, refetch } = useMongoLeaderboard(selectedEventId, limit)

  useEffect(() => {
    setIsClient(true)
    
    // Set default to current active week if available
    if (currentWeek && !selectedEventId) {
      setSelectedEventId(currentWeek.eventId)
    }
  }, [currentWeek, selectedEventId])

  // Countdown timer effect
  useEffect(() => {
    const calculateCountdown = () => {
      if (!currentWeek) {
        console.log('🔍 No current week data available')
        return
      }
      
      console.log('🔍 Current week:', currentWeek.eventId, 'End date:', currentWeek.endDate)
      
      const now = new Date().getTime()
      const endDate = new Date(currentWeek.endDate).getTime()
      const timeLeft = endDate - now
      
      console.log('🔍 Time left (ms):', timeLeft)
      
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
        
        console.log('🔍 Countdown:', { days, hours, minutes, seconds })
        setCountdown({ days, hours, minutes, seconds })
      } else {
        console.log('🔍 Contest ended, setting countdown to 0')
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }
    
    calculateCountdown()
    const timer = setInterval(calculateCountdown, 1000)
    
    return () => clearInterval(timer)
  }, [currentWeek])

  // Escape key handler for popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrizeInfo) {
        setShowPrizeInfo(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showPrizeInfo])

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

  const getEventDisplayName = (eventId: string) => {
    switch (eventId) {
      case 'week-1':
        return 'Week 1 - Completed, Rewards Distributed'
      case 'week-2':
        return 'Week 2 - Current Tournament'
      case 'week-3':
        return 'Week 3 - Upcoming'
      default:
        return eventId
    }
  }

  const getEventStatus = (eventId: string) => {
    if (eventId === 'week-1') {
      return {
        status: 'completed',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: '✅'
      }
    } else if (eventId === currentWeek?.eventId) {
      return {
        status: 'active',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        icon: '🏆'
      }
    } else {
      return {
        status: 'upcoming',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        icon: '⏰'
      }
    }
  }

  const getEventDescription = (eventId: string) => {
    if (eventId === 'week-1') {
      return 'Tournament completed. Top 15 players have received their rewards.'
    } else if (eventId === currentWeek?.eventId) {
      return 'Current active tournament. Everyone starts from 0 - equal chances for all!'
    } else {
      return 'Upcoming tournament. Stay tuned for the next competition!'
    }
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
                onClick={() => window.location.href = '/weekly-tournament'}
                className="bg-emerald-600/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
              >
                🏆 Weekly Tournament
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🗄️  Leaderboard
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            View leaderboards for all tournament weeks
          </p>
        </div>

        {/* Reward Pool Section */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-yellow-500/30">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-3xl">💰</span>
              <h2 className="text-3xl md:text-4xl font-bold text-yellow-300">
                $50 USDC Reward Pool
              </h2>
              <span className="text-3xl">💰</span>
              <button
                onClick={() => setShowPrizeInfo(!showPrizeInfo)}
                className="ml-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"
                title="Prize Distribution Info"
              >
                <span className="text-white text-xs font-bold">i</span>
              </button>
            </div>
            
            <p className="text-lg text-yellow-200 mb-6">
              Top 15 players will share the reward pool!
            </p>
            
            {/* Show countdown only for active tournaments */}
            {(() => {
              const shouldShowCountdown = selectedEventId !== 'week-1' && currentWeek?.eventId === selectedEventId
              console.log('🔍 Countdown display check:', {
                selectedEventId,
                currentWeekEventId: currentWeek?.eventId,
                shouldShowCountdown,
                countdown
              })
              return shouldShowCountdown
            })() ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-red-400">⏰</span>
                  <h3 className="text-lg font-semibold text-white">
                    Contest Ends In:
                  </h3>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <div className="bg-red-900/50 rounded-lg p-3 text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-white">
                      {countdown.days.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Days</div>
                  </div>
                  <div className="bg-red-900/50 rounded-lg p-3 text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-white">
                      {countdown.hours.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Hours</div>
                  </div>
                  <div className="bg-red-900/50 rounded-lg p-3 text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-white">
                      {countdown.minutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Minutes</div>
                  </div>
                  <div className="bg-red-900/50 rounded-lg p-3 text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-white">
                      {countdown.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Seconds</div>
                  </div>
                </div>
              </div>
            ) : selectedEventId === 'week-1' ? (
              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-green-400">✅</span>
                  <h3 className="text-lg font-semibold text-green-300">
                    Tournament Completed
                  </h3>
                  <span className="text-green-400">✅</span>
                </div>
                <p className="text-green-200 text-sm">
                  Rewards have been distributed to the top 15 players!
                </p>
              </div>
            ) : (
              <div className="bg-gray-500/20 backdrop-blur-sm rounded-xl p-4 border border-gray-500/30">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-gray-400">⏰</span>
                  <h3 className="text-lg font-semibold text-gray-300">
                    Tournament Not Started
                  </h3>
                  <span className="text-gray-400">⏰</span>
                </div>
                <p className="text-gray-200 text-sm">
                  Stay tuned for the upcoming tournament!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prize Distribution Info Popup */}
        {showPrizeInfo && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPrizeInfo(false)}
          >
            <div 
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full border border-yellow-500/30 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowPrizeInfo(false)}
                className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors z-10 shadow-lg border-2 border-white/20"
                title="Close"
              >
                <span className="text-white text-xl font-bold">×</span>
              </button>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-3xl">🏆</span>
                  <h3 className="text-2xl font-bold text-yellow-300">Prize Distribution</h3>
                  <span className="text-3xl">🏆</span>
                </div>
                
                <div className="space-y-4 text-left">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">💰 Total Prize Pool</h4>
                    <p className="text-white text-lg font-bold">$50 USDC</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">👥 Winners</h4>
                    <p className="text-white">Top 15 players will share the reward pool</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">📊 Distribution</h4>
                    <div className="space-y-2 text-sm text-white">
                      <div className="flex justify-between">
                        <span>🥇 1st Place:</span>
                        <span className="font-bold">$10 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🥈 2nd Place:</span>
                        <span className="font-bold">$7 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🥉 3rd Place:</span>
                        <span className="font-bold">$5 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>4th-10th Place:</span>
                        <span className="font-bold">$2 USDC each</span>
                      </div>
                      <div className="flex justify-between">
                        <span>11th-15th Place:</span>
                        <span className="font-bold">$1 USDC each</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">⏰ Tournament Duration</h4>
                    <p className="text-white">Each tournament runs for 1 week</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">🎯 How to Win</h4>
                    <p className="text-white">Achieve the highest score possible! Connect your wallet to save your scores on the blockchain.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowPrizeInfo(false)}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Got it! 👍
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Selection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Select Tournament Week
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full md:w-80 bg-white/10 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-colors"
              >
                {eventsLoading ? (
                  <option>Loading events...</option>
                ) : (
                  eventsData?.events?.map((eventId: string) => (
                    <option key={eventId} value={eventId}>
                      {getEventDisplayName(eventId)}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setLimit(50)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  limit === 50 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Top 50
              </button>
              <button
                onClick={() => setLimit(100)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  limit === 100 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Top 100
              </button>
            </div>
          </div>
        </div>

        {/* Selected Event Info */}
        <div className={`backdrop-blur-lg rounded-2xl p-6 mb-8 border ${getEventStatus(selectedEventId).borderColor}`}>
          <div className={`${getEventStatus(selectedEventId).bgColor} rounded-xl p-4`}>
            <div className="flex items-center justify-center space-x-3 mb-3">
              <span className="text-3xl">{getEventStatus(selectedEventId).icon}</span>
              <h2 className={`text-2xl md:text-3xl font-bold ${getEventStatus(selectedEventId).color}`}>
                {getEventDisplayName(selectedEventId)}
              </h2>
              <span className="text-3xl">{getEventStatus(selectedEventId).icon}</span>
            </div>
            
            <p className="text-center text-gray-300 mb-4">
              {getEventDescription(selectedEventId)}
            </p>
            
            {selectedEventId === 'week-1' && (
              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <h3 className="text-lg font-bold text-green-300">Rewards Distributed</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-green-200 text-sm text-center">
                  Top 15 players have received their $50 USDC prize pool. Congratulations to all winners!
                </p>
              </div>
            )}
            
            {selectedEventId === currentWeek?.eventId && (
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-lg font-bold text-blue-300">Fresh Start!</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-blue-200 text-sm text-center">
                  Everyone starts from 0 - equal opportunity for all participants!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {getEventDisplayName(selectedEventId)} Leaderboard
              </h2>
              <p className="text-sm text-gray-300">
                {leaderboardData?.totalUsers || 0} participants
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
          ) : !leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
              <p className="text-gray-300 mb-4">
                {selectedEventId === 'week-1' 
                  ? 'Historical data not available for this completed tournament.'
                  : 'No participants yet for this tournament.'
                }
              </p>
              {selectedEventId === currentWeek?.eventId && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Playing Now! 🚀
                </button>
              )}
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
                           
                            {selectedEventId === 'week-1' ? (
                              isTop15 ? (
                                <span className="ml-2 text-green-300">✅ Rewarded</span>
                              ) : (
                                <span className="ml-2 text-gray-400">Tournament Ended</span>
                              )
                            ) : (
                              isTop15 ? (
                                <span className="ml-2 text-yellow-300">Reward Eligible</span>
                              ) : (
                                <span className="ml-2 text-orange-300">Keep playing to climb!</span>
                              )
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
                Connect your wallet to participate in tournaments and view your stats!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedMongoLeaderboard
