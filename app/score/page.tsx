'use client'

import React, { useEffect, useState } from 'react'
import { useLeaderboard, useMyGameData } from '../../smartcontracthooks'
import { useAccount } from 'wagmi'
import {
  formatRewardAmount,
  getNextScoreRewardCycle,
  getScoreRewardForRank,
  SCORE_REWARD_CYCLE_DURATION_MS,
  SCORE_REWARD_TABLE,
  SCORE_REWARD_TOKEN,
  SCORE_REWARD_TOP_LIMIT,
  SCORE_REWARD_TOTAL,
} from '@/lib/scoreRewards'

const getWeeklyCountdownSegments = () => {
  const { msUntilReset } = getNextScoreRewardCycle()
  const countdownMs = msUntilReset > 0 ? msUntilReset : SCORE_REWARD_CYCLE_DURATION_MS
  const totalSeconds = Math.floor(countdownMs / 1000)
  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

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
  const myPotentialReward = myRank ? getScoreRewardForRank(myRank) : null
  const topRankReward = getScoreRewardForRank(1)
  const cutoffReward = getScoreRewardForRank(SCORE_REWARD_TOP_LIMIT)

  useEffect(() => {
    setIsClient(true)

    const hasSeenLeaderboardRewardInfo = localStorage.getItem('flapbitrum_leaderboard_reward_info_seen')
    if (!hasSeenLeaderboardRewardInfo) {
      setTimeout(() => {
        setShowRewardInfo(true)
      }, 1000)
    }
  }, [])

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(getWeeklyCountdownSegments())
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-200 font-semibold mb-1">
                  Weekly leaderboard rewards
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                    {SCORE_REWARD_TOTAL} {SCORE_REWARD_TOKEN} reward pool
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
                <p className="text-sm md:text-base text-yellow-100 mt-2">
                  Top {SCORE_REWARD_TOP_LIMIT} scorers split the ARB pot every 7 days. 🥇 Rank #1 is on track for{' '}
                  <span className="font-semibold">
                    {formatRewardAmount(topRankReward.amount, 2)} {SCORE_REWARD_TOKEN}
                  </span>{' '}
                  while the final qualifying spot still banks{' '}
                  <span className="font-semibold">
                    {formatRewardAmount(cutoffReward.amount, 2)} {SCORE_REWARD_TOKEN}
                  </span>. Countdown resets automatically when a cycle ends.
                </p>
              </div>
              <div className="self-start md:self-auto">
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-yellow-100 font-semibold text-center">
                  Live season
                </div>
              </div>
            </div>
            
            {/* Countdown Timer */}
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-yellow-300 mb-3 font-semibold">⏰ Next Reset In:</p>
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
            {myPotentialReward && myPotentialReward.amount > 0 ? (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-100">🎯 Potential Reward</p>
                <p className="text-2xl font-bold text-yellow-200">
                  {formatRewardAmount(myPotentialReward.amount, 2)} {SCORE_REWARD_TOKEN}
                </p>
                <p className="text-xs text-yellow-100">
                  Hold your rank or climb higher before payouts trigger at the next weekly reset.
                </p>
              </div>
            ) : (
              <div className="mt-4 text-center text-sm text-gray-300">
                Reach the top {SCORE_REWARD_TOP_LIMIT} to lock in a share of the {SCORE_REWARD_TOTAL} {SCORE_REWARD_TOKEN} pool.
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Score Leaderboard</h2>
              <p className="text-sm text-gray-300">
                💰 Top {SCORE_REWARD_TOP_LIMIT} split {SCORE_REWARD_TOTAL} {SCORE_REWARD_TOKEN} every week
              </p>
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
                const rank = index + 1
                const score = Number(entry.score)
                const rewardInfo = getScoreRewardForRank(rank)
                const isInRewardPool = rewardInfo.amount > 0

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
                        {entry.pfp ? (
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                              <img
                                src={entry.pfp}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
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
                            {isInRewardPool && <span className="ml-2 text-yellow-400 text-sm">💰</span>}
                          </div>
                          <div className="text-sm text-gray-400 flex flex-wrap gap-2 items-center">
                            <span>Rank #{rank}</span>
                            {isInRewardPool ? (
                              <span className="text-yellow-300">
                                Potential: {formatRewardAmount(rewardInfo.amount, 2)} {SCORE_REWARD_TOKEN}
                              </span>
                            ) : (
                              <span className="text-orange-300">Score more to enter the {SCORE_REWARD_TOP_LIMIT}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                      {isInRewardPool && (
                        <div className="text-[11px] text-yellow-200 bg-yellow-500/10 border border-yellow-400/30 rounded-full px-2 py-0.5 mt-1 font-semibold">
                          {formatRewardAmount(rewardInfo.amount, 2)} {SCORE_REWARD_TOKEN}
                        </div>
                      )}
                    </div>
                  </div>
                )
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
              localStorage.setItem('flapbitrum_leaderboard_reward_info_seen', 'true')
            }}
          >
            <div
              className="bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <h2 className="text-xl font-bold text-white">ARB Reward Breakdown</h2>
                </div>
                <button
                  onClick={() => {
                    setShowRewardInfo(false)
                    localStorage.setItem('flapbitrum_leaderboard_reward_info_seen', 'true')
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-yellow-300 mb-2">
                    🏆 {SCORE_REWARD_TOTAL} {SCORE_REWARD_TOKEN} Weekly Pool
                  </h3>
                  <p className="text-sm text-gray-200">
                    Rewards follow a power-curve distribution so that the grind for the crown is worth it, while every
                    player inside the top {SCORE_REWARD_TOP_LIMIT} still gets a meaningful ARB payout.
                  </p>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📊 Distribution Map</span>
                    <span className="text-xs text-gray-300">(live per-rank share)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SCORE_REWARD_TABLE.map(({ rank, amount, percentage }) => (
                      <div key={rank} className="bg-white/10 rounded-xl p-3 border border-white/15 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">#{rank}</span>
                          <span className="text-lg">
                            {rank <= 3 ? getRankIcon(rank) : rank <= 10 ? '🏅' : '🎯'}
                          </span>
                        </div>
                        <div className="text-yellow-200 font-bold text-lg">
                          {formatRewardAmount(amount, 3)} {SCORE_REWARD_TOKEN}
                        </div>
                        <div className="text-xs text-gray-300">{percentage.toFixed(2)}% of pool</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-md font-semibold text-white mb-2">📋 Important Notes:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Rewards settle in {SCORE_REWARD_TOKEN} on Arbitrum One</li>
                    <li>• Connect your wallet before the season closes</li>
                    <li>• Distribution runs at the end of every weekly cycle</li>
                    <li>• Ties are broken by earliest score submission</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-white/20">
                <button
                  onClick={() => {
                    setShowRewardInfo(false)
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