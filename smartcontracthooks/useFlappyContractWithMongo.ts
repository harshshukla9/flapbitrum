import React from 'react'
import { useContractRead, useContractWrite, useAccount, useWatchContractEvent, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import contractConfig from '../lib/contract'
import { useUpdateLeaderboardEntry } from './useMongoLeaderboard'
import { useQueryClient } from '@tanstack/react-query'

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

// Enhanced setScore hook that automatically syncs to MongoDB
export const useSetScoreWithMongo = (eventId: string = 'week-1') => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const updateLeaderboardEntry = useUpdateLeaderboardEntry()

  // Store the score data that needs to be synced after confirmation
  const [pendingScoreData, setPendingScoreData] = React.useState<{
    score: number
    username: string
    fid: number
    pfp: string
  } | null>(null)

  const { data: hash, writeContract, isPending: isWritePending, error: writeError } = useContractWrite()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  const setScore = async (score: number, username: string, fid: number, pfp: string) => {
    console.log("🔍 Attempting to save score:", score);
    console.log("🔍 Username:", username);
    console.log("🔍 FID:", fid);
    console.log("🔍 PFP:", pfp);
    console.log("🔍 Contract address:", contractConfig.contractAddress);

    try {
      // Store the score data for later use
      setPendingScoreData({ score, username, fid, pfp });

      // Step 1: Send the transaction
      const txHash = await writeContract({
        address: contractConfig.contractAddress as `0x${string}`,
        abi: contractConfig.abi,
        functionName: 'setScore',
        args: [BigInt(score), username, BigInt(fid), pfp],
      })

      console.log("🔍 Transaction sent successfully, hash:", txHash);
      console.log("⏳ Waiting for transaction confirmation...");

      return { txHash, score, username, fid, pfp, eventId };

    } catch (err) {
      console.error("🔍 Error calling writeContract:", err);
      // Clear pending data on error
      setPendingScoreData(null);
      throw err;
    }
  }

  // Effect to handle MongoDB update after transaction confirmation
  React.useEffect(() => {
    const updateMongoAfterConfirmation = async () => {
      if (isConfirmed && hash && address && pendingScoreData) {
        console.log("✅ Transaction confirmed! Updating MongoDB...");

        try {
          console.log("🔄 Attempting to sync score to MongoDB for event:", eventId);

          const result = await updateLeaderboardEntry.mutateAsync({
            user: address,
            username: pendingScoreData.username,
            fid: pendingScoreData.fid.toString(),
            pfp: pendingScoreData.pfp,
            score: pendingScoreData.score,
            eventId,
          })

          console.log("✅ MongoDB updated successfully for event:", eventId);
          console.log("📊 Cumulative scoring result:", {
            operation: result.data?.operation,
            previousScore: result.data?.previousScore,
            newScoreAdded: result.data?.newScoreAdded,
            totalScore: result.data?.totalScore,
            message: result.message
          });

          // Invalidate and refetch leaderboard data
          queryClient.invalidateQueries({
            queryKey: ['mongo-leaderboard', eventId],
          })

          console.log("🔄 Leaderboard cache invalidated for event:", eventId);

        } catch (mongoError) {
          console.error("❌ Error updating MongoDB:", mongoError);
          console.error("❌ MongoDB sync failed even though blockchain transaction was successful");
          console.error("❌ User address:", address);
          console.error("❌ Event ID:", eventId);
          console.error("❌ Score data:", pendingScoreData);
          // Still clear pending data even on MongoDB error
        }

        // Clear pending data after processing
        setPendingScoreData(null);
      }
    };

    updateMongoAfterConfirmation();
  }, [isConfirmed, hash, address, pendingScoreData, eventId, updateLeaderboardEntry, queryClient]);

  // Effect to handle transaction failure
  React.useEffect(() => {
    if (confirmError && pendingScoreData) {
      console.error("❌ Transaction failed! Not updating MongoDB.");
      console.error("❌ Transaction error:", confirmError);
      console.error("❌ Pending score data will be discarded:", pendingScoreData);
      setPendingScoreData(null);
    }
  }, [confirmError, pendingScoreData]);

  return {
    setScore,
    isPending: isWritePending,
    isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    hash,
    isMongoUpdating: updateLeaderboardEntry.isPending,
  }
}

// Hook to watch for contract events and sync to MongoDB
export const useWatchContractEvents = (eventId: string = 'week-1') => {
  const queryClient = useQueryClient()
  const updateLeaderboardEntry = useUpdateLeaderboardEntry()

  // Watch for NewUserAdded events
  useWatchContractEvent({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    eventName: 'NewUserAdded',
    onLogs: async (logs) => {
      console.log('📡 NewUserAdded event detected:', logs);
      
      for (const log of logs) {
        try {
          const { user, username, fid, pfp, score } = (log as any).args;
          
          if (user && username && fid && pfp && score) {
            await updateLeaderboardEntry.mutateAsync({
              user: user.toLowerCase(),
              username,
              fid: fid.toString(),
              pfp,
              score: Number(score),
              eventId,
            });
            
            console.log('✅ MongoDB synced from NewUserAdded event');
          }
        } catch (error) {
          console.error('❌ Error syncing NewUserAdded event to MongoDB:', error);
        }
      }
      
      // Invalidate and refetch leaderboard data
      queryClient.invalidateQueries({
        queryKey: ['mongo-leaderboard', eventId],
      });
    },
  });

  // Watch for ScoreUpdated events
  useWatchContractEvent({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    eventName: 'ScoreUpdated',
    onLogs: async (logs) => {
      console.log('📡 ScoreUpdated event detected:', logs);
      
      for (const log of logs) {
        try {
          const { user, newScore } = (log as any).args;
          
          if (user && newScore) {
            // Get user profile from contract to get full details
            // This would require an additional contract call
            // For now, we'll rely on the setScore hook to handle this
            console.log('📡 ScoreUpdated event for user:', user, 'new score:', newScore);
          }
        } catch (error) {
          console.error('❌ Error processing ScoreUpdated event:', error);
        }
      }
      
      // Invalidate and refetch leaderboard data
      queryClient.invalidateQueries({
        queryKey: ['mongo-leaderboard', eventId],
      });
    },
  });

  // Watch for ProfileUpdated events
  useWatchContractEvent({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    eventName: 'ProfileUpdated',
    onLogs: async (logs) => {
      console.log('📡 ProfileUpdated event detected:', logs);
      
      for (const log of logs) {
        try {
          const { user, username, fid, pfp } = (log as any).args;
          
          if (user && username && fid && pfp) {
            // Get current score from contract
            // This would require an additional contract call
            console.log('📡 ProfileUpdated event for user:', user);
          }
        } catch (error) {
          console.error('❌ Error processing ProfileUpdated event:', error);
        }
      }
      
      // Invalidate and refetch leaderboard data
      queryClient.invalidateQueries({
        queryKey: ['mongo-leaderboard', eventId],
      });
    },
  });
}

// Enhanced hook that combines contract data with MongoDB sync
export const useEnhancedLeaderboard = (eventId: string = 'week-1', limit: number = 10) => {
  const { data: topScores, isLoading, error, refetch } = useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTopScores',
    args: [BigInt(limit)],
  })
  
  const { data: totalUsers } = useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTotalUsers',
  })

  console.log("🔍 Enhanced Leaderboard data:", { topScores, totalUsers, error });

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

// Hook to sync all contract data to MongoDB
export const useSyncContractToMongo = (eventId: string = 'week-1') => {
  const { data: topScores, isLoading } = useContractRead({
    address: contractConfig.contractAddress as `0x${string}`,
    abi: contractConfig.abi,
    functionName: 'getTopScores',
    args: [BigInt(100)], // Get top 100 scores
  })
  
  const updateLeaderboardEntry = useUpdateLeaderboardEntry()
  const queryClient = useQueryClient()

  const syncAllData = async () => {
    if (!Array.isArray(topScores)) {
      console.log('No scores to sync');
      return;
    }

    console.log(`🔄 Syncing ${topScores.length} entries to MongoDB for event: ${eventId}`);

    for (const entry of topScores) {
      try {
        await updateLeaderboardEntry.mutateAsync({
          user: entry.user.toLowerCase(),
          username: entry.username || 'Anonymous',
          fid: entry.fid ? entry.fid.toString() : '0',
          pfp: entry.pfp || '',
          score: Number(entry.score),
          eventId,
        });
      } catch (error) {
        console.error(`Error syncing entry for user ${entry.user}:`, error);
      }
    }

    // Invalidate and refetch leaderboard data
    queryClient.invalidateQueries({
      queryKey: ['mongo-leaderboard', eventId],
    });

    console.log('✅ Sync completed');
  };

  return {
    syncAllData,
    isLoading,
    totalEntries: Array.isArray(topScores) ? topScores.length : 0,
  };
};
