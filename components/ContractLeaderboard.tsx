'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { arbitrum } from 'viem/chains'
import contractConfig from '@/lib/contract'

interface LeaderboardEntry {
  user: string
  username: string
  fid: bigint
  pfp: string
  score: bigint
}

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
})

const ContractLeaderboard: React.FC<{ limit?: number }> = ({ limit = 100 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const contractAddress = contractConfig.contractAddress as `0x${string}`
  const abi = contractConfig.abi

  const load = useMemo(
    () => async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = (await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: 'getTopScores',
          args: [BigInt(limit)],
        })) as any[]

        const normalized: LeaderboardEntry[] = (data || []).map((d: any) => ({
          user: d.user as string,
          username: (d.username as string) || '',
          fid: BigInt(d.fid ?? 0),
          pfp: (d.pfp as string) || '',
          score: BigInt(d.score ?? 0),
        }))

        setEntries(normalized)
      } catch (e: any) {
        setError(e?.message || 'Failed to load leaderboard')
      } finally {
        setIsLoading(false)
      }
    },
    [contractAddress, abi, limit]
  )

  useEffect(() => {
    load()
  }, [load])

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

  const getScoreColor = (scoreNumber: number) => {
    if (scoreNumber >= 100) return 'text-green-500'
    if (scoreNumber >= 50) return 'text-yellow-500'
    if (scoreNumber >= 20) return 'text-orange-500'
    return 'text-gray-500'
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Leaderboard</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={load}
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
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={load}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="flex-1"></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">🏆 Leaderboard</h2>
          <p className="text-sm text-gray-300">Reading directly from the smart contract</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Scores Yet</h3>
              <p className="text-gray-300">Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries
                .filter((entry) => Number(entry.score) !== 0)
                .map((entry, index) => {
                const rank = index + 1
                const scoreNumber = Number(entry.score)
                const isInRewardPool = rank <= 30
                const isTop15 = rank <= 15

                return (
                  <div
                    key={`${entry.user}-${index}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/5 ${
                      isInRewardPool ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'
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
                    <div className={`text-2xl font-bold ${getScoreColor(scoreNumber)}`}>{scoreNumber}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractLeaderboard


