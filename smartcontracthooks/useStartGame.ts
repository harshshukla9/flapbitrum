"use client"

import { useCallback, useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { arbitrum } from 'viem/chains'
import { CONTRACT_ADDRESSES, GAME_TRACKER_ABI } from '@/lib/GameTrackerContract'

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
})

export function useStartGame() {
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contractAddress = CONTRACT_ADDRESSES.GameTracker as `0x${string}`
  const abi = GAME_TRACKER_ABI

  const startGame = useCallback(async () => {
    if (!walletClient || !address) {
      const errorMsg = 'Wallet not connected'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    
    setIsPending(true)
    setIsSuccess(false)
    setError(null)
    
    try {
      console.log('Starting game transaction...', { address, contractAddress })
      
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: 'startGame',
        args: [],
      })

      console.log('Transaction submitted:', hash)
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60_000 // 60 seconds timeout
      })
      
      console.log('Transaction confirmed:', receipt)
      
      if (receipt.status === 'success') {
        setIsSuccess(true)
        return { success: true, hash, receipt }
      } else {
        const errorMsg = 'Transaction failed'
        setError(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.error('StartGame transaction failed:', err)
      const errorMsg = err?.message || 'Failed to start game'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsPending(false)
    }
  }, [walletClient, address, contractAddress, abi])

  const reset = useCallback(() => {
    setIsPending(false)
    setIsSuccess(false)
    setError(null)
  }, [])

  return { 
    startGame, 
    isPending, 
    isSuccess, 
    error, 
    reset 
  }
}

export function useGameTrackerStats() {
  const { address } = useAccount()
  const [playerStats, setPlayerStats] = useState<{
    totalGames: number
    lastPlayed: number
    isRegistered: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const contractAddress = CONTRACT_ADDRESSES.GameTracker as `0x${string}`
  const abi = GAME_TRACKER_ABI

  const fetchPlayerStats = useCallback(async () => {
    if (!address) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const stats = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getPlayerStats',
        args: [address],
      }) as [bigint, bigint, boolean]

      setPlayerStats({
        totalGames: Number(stats[0]),
        lastPlayed: Number(stats[1]),
        isRegistered: stats[2],
      })
    } catch (err: any) {
      console.error('Failed to fetch player stats:', err)
      setError(err?.message || 'Failed to fetch player stats')
    } finally {
      setIsLoading(false)
    }
  }, [address, contractAddress, abi])

  return {
    playerStats,
    isLoading,
    error,
    fetchPlayerStats,
  }
}
