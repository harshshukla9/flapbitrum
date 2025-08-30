import { useReadContract, useWriteContract, useAccount, useWatchContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import contractConfig from '../lib/contract'

export interface UserScore {
  user: string
  score: bigint
  username?: string
  fid?: bigint
  pfp?: string
}

export interface UserProfile {
  user: string
  score: bigint
  username?: string
  fid?: bigint
  pfp?: string
}

export interface LeaderboardEntry {
  user: string
  score: number
  rank?: number
  username?: string
  fid?: number
  pfp?: string
}

// Read Hooks
export const useGetAllScores = () => {
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getAllScoresDescending',
  })
}

export const useGetMyProfile = () => {
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getMyProfile',
  }) as {
    data: UserProfile | undefined
    isLoading: boolean
    error: any
  }
}

export const useGetMyScore = () => {
  const { address } = useAccount()
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getScore',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  })
}

export const useGetScore = (userAddress: string) => {
  return useReadContract({
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
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTopScores',
    args: [BigInt(limit)],
  })
}

export const useGetTotalUsers = () => {
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTotalUsers',
  })
}

export const useGetUserRank = (userAddress: string) => {
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getUserRank',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  })
}

export const useHasProfile = (userAddress: string) => {
  return useReadContract({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'hasProfile',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  })
}

// Write Hooks
export const useSetScore = () => {
  const { data, writeContract, isPending, error, isSuccess } = useWriteContract()

  const setScore = (score: number, username: string, fid: number, pfp: string) => {
    console.log("🔍 Attempting to save score:", score);
    console.log("🔍 Username:", username);
    console.log("🔍 FID:", fid);
    console.log("🔍 PFP:", pfp);
    console.log("🔍 Contract address:", contractConfig.contractAddress);
    
    try {
      writeContract({
        address: contractConfig.contractAddress as `0x${string}`,
        abi: contractConfig.abi,
        functionName: 'setScore',
        args: [BigInt(score), username, BigInt(fid), pfp],
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
    ? topScores.map((entry: any, index: number) => ({
        user: entry.user,
        score: Number(entry.score),
        rank: index + 1,
        username: entry.username,
        fid: entry.fid ? Number(entry.fid) : undefined,
        pfp: entry.pfp,
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
  const { data: myProfile, isLoading: profileLoading } = useGetMyProfile()
  const { data: myRank, isLoading: rankLoading } = useGetUserRank(address || '')
  const { data: hasProfile } = useHasProfile(address || '')

  return {
    myScore: (myProfile as UserProfile)?.score ? Number((myProfile as UserProfile).score) : 0,
    myRank: myRank ? Number(myRank) : 0,
    hasScore: hasProfile || false,
    isLoading: profileLoading || rankLoading,
    address,
    username: (myProfile as UserProfile)?.username,
    fid: (myProfile as UserProfile)?.fid ? Number((myProfile as UserProfile).fid) : undefined,
    pfp: (myProfile as UserProfile)?.pfp,
  }
}
