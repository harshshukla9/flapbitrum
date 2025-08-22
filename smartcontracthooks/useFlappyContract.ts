import { useContractRead, useContractWrite, useAccount, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import contractConfig from '../lib/contract'

export interface UserScore {
  user: string
  score: bigint
}

export interface LeaderboardEntry {
  user: string
  score: number
  rank?: number
}

// Read Hooks
export const useGetAllScores = () => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getAllScoresDescending',
  })
}

export const useGetMyScore = () => {
  const { address } = useAccount()
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getMyScore',
    query: {
      enabled: !!address,
    },
  })
}

export const useGetScore = (userAddress: string) => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  })
}

export const useGetTopScores = (limit: number) => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTopScores',
    args: [BigInt(limit)],
  })
}

export const useGetTotalUsers = () => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTotalUsers',
  })
}

export const useGetUserRank = (userAddress: string) => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getUserRank',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  })
}

export const useHasScore = (userAddress: string) => {
  return useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'hasScore',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  })
}

// Write Hooks
export const useSetScore = () => {
  const { data, writeContract, isPending, error, isSuccess } = useContractWrite()

  const setScore = (score: number) => {
    console.log("🔍 Attempting to save score:", score);
    console.log("🔍 Contract address:", contractConfig.contractAddress);
    console.log("🔍 Contract ABI:", contractConfig.abi);
    
    try {
      writeContract({
        address: contractConfig.contractAddress as `0x${string}`,
        abi: contractConfig.abi,
        functionName: 'setScore',
        args: [BigInt(score)],
      })
      console.log("🔍 Write contract called successfully");
    } catch (err) {
      console.error("🔍 Error calling writeContract:", err);
    }
  }

  return {
    setScore,
    isPending,
    isConfirming: isPending,
    isSuccess,
    error,
    hash: data,
  }
}

// Utility hook for leaderboard data
export const useLeaderboard = (limit: number = 10) => {
  const { data: topScores, isLoading, error, refetch } = useGetTopScores(limit)
  const { data: totalUsers } = useGetTotalUsers()

  console.log("🔍 Leaderboard data:", { topScores, totalUsers, error });

  const leaderboardData: LeaderboardEntry[] = Array.isArray(topScores) 
    ? topScores.map((entry: UserScore, index: number) => ({
        user: entry.user,
        score: Number(entry.score),
        rank: index + 1,
      }))
    : []

  return {
    leaderboard: leaderboardData,
    isLoading,
    error,
    refetch,
    totalUsers: totalUsers ? Number(totalUsers) : 0,
  }
}

// Hook for current user's game data
export const useMyGameData = () => {
  const { address } = useAccount()
  const { data: myScore, isLoading: scoreLoading } = useGetMyScore()
  const { data: myRank, isLoading: rankLoading } = useGetUserRank(address || '')
  const { data: hasScore } = useHasScore(address || '')

  return {
    myScore: myScore ? Number(myScore) : 0,
    myRank: myRank ? Number(myRank) : 0,
    hasScore: hasScore || false,
    isLoading: scoreLoading || rankLoading,
    address,
  }
}
