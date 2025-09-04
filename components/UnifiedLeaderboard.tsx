'use client'

import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useLeaderboard } from '../smartcontracthooks'
import { useCurrentActiveWeek } from '../smartcontracthooks/useWeeklyEvents'

const UnifiedLeaderboard: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [isClient, setIsClient] = useState(false)
  const [limit, setLimit] = useState(100)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showPrizeInfo, setShowPrizeInfo] = useState(false)

  const { data: currentWeekData } = useCurrentActiveWeek()
  const currentWeek = currentWeekData?.currentWeek

  const { leaderboard, isLoading, error, refetch, totalUsers } = useLeaderboard(limit)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const calculateCountdown = () => {
      if (!currentWeek) return
      const now = new Date().getTime()
      const endDate = new Date(currentWeek.endDate).getTime()
      const timeLeft = endDate - now
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
        setCountdown({ days, hours, minutes, seconds })
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }
    calculateCountdown()
    const timer = setInterval(calculateCountdown, 1000)
    return () => clearInterval(timer)
  }, [currentWeek])

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    if (score >= 20) return 'text-orange-500'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
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
                onClick={() => window.location.href = '/weekly-tournament'}
                className="bg-emerald-600/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600/30 transition-colors border border-emerald-500/30"
              >
                🏆 Weekly Tournament Week-3
              </button>
            </div>
            <div className="flex-1"></div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">🗄️  Leaderboard</h1>
          <p className="text-lg text-gray-300 mb-6">View leaderboards for all tournament weeks</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-yellow-500/30">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-3xl">💰</span>
              <h2 className="text-3xl md:text-4xl font-bold text-yellow-300">$50 USDC Reward Pool</h2>
              <span className="text-3xl">💰</span>
              <button
                onClick={() => setShowPrizeInfo(!showPrizeInfo)}
                className="ml-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"
                title="Prize Distribution Info"
              >
                <span className="text-white text-xs font-bold">i</span>
              </button>
            </div>
            <p className="text-lg text-yellow-200 mb-6">Top 15 players will share the reward pool!</p>

            {currentWeek && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-red-400">⏰</span>
                  <h3 className="text-lg font-semibold text-white">Contest Ends In:</h3>
                </div>
                <div className="flex justify-center space-x-3">
                  {['Days','Hours','Minutes','Seconds'].map((label, i) => {
                    const values = [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
                    return (
                      <div key={label} className="bg-red-900/50 rounded-lg p-3 text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-white">{values[i].toString().padStart(2,'0')}</div>
                        <div className="text-xs text-gray-300">{label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {showPrizeInfo && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPrizeInfo(false)}
          >
            <div 
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full border border-yellow-500/30 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
                      <div className="flex justify-between"><span>🥇 1st Place:</span><span className="font-bold">$10 USDC</span></div>
                      <div className="flex justify-between"><span>🥈 2nd Place:</span><span className="font-bold">$6 USDC</span></div>
                      <div className="flex justify-between"><span>🥉 3rd Place:</span><span className="font-bold">$4 USDC</span></div>
                      <div className="flex justify-between"><span>4th-10th Place:</span><span className="font-bold">$2.5 USDC each</span></div>
                      <div className="flex justify-between"><span>11th-15th Place:</span><span className="font-bold">$2 USDC each</span></div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold text-yellow-200 mb-2">⏰ Tournament Duration</h4>
                    <p className="text-white">Each tournament runs for 1 week</p>
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

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Current Leaderboard</h2>
              <p className="text-sm text-gray-300">{totalUsers} participants</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLimit(50)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${limit === 50 ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >Top 50</button>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >{isLoading ? 'Refreshing...' : 'Refresh'}</button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
              <p className="text-gray-300 mb-4">No participants yet for this tournament.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard
                .filter((entry: any) => Number(entry.score) !== 0)
                .map((entry: any, index: number) => {
                const rank = index + 1
                const isInRewardPool = rank <= 30
                const isTop15 = rank <= 15
                const score = Number(entry.score)
                return (
                  <div
                    key={`${entry.user}-${index}`}
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
                              <img src={entry.pfp} alt="Profile" className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none' }} />
                            </div>
                            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
                              {rank <= 3 ? getRankIcon(rank) : rank}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center border-2 border-white/20">
                              <span className="text-white text-lg font-bold">{(entry.username || formatAddress(entry.user)).charAt(0).toUpperCase()}</span>
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
                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {isClient && !isConnected && (
          <div className="text-center mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-4">Connect your wallet to participate in tournaments and view your stats!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedLeaderboard


