import { useState } from 'react'
import { useSetScore, useMyGameData } from './useFlappyContract'
import { useAccount } from 'wagmi'
import { useFrame } from '../components/farcaster-provider'

export interface GameState {
  score: number
  level: string
  difficulty: number
  isGameOver: boolean
  isGameStarted: boolean
}

export const useGameState = () => {
  const { address, isConnected } = useAccount()
  const { setScore: saveScoreToContract, isPending: isSavingScore, isSuccess: scoreSaved } = useSetScore()
  const { myScore: contractScore, myRank, hasScore, isLoading: contractDataLoading, username, fid, pfp } = useMyGameData()
  const { context } = useFrame()

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: '',
    difficulty: 1,
    isGameOver: false,
    isGameStarted: false,
  })

  const [lastSavedScore, setLastSavedScore] = useState<number | null>(null)

  // Reset game state
  const resetGame = () => {
    setGameState({
      score: 0,
      level: '',
      difficulty: 1,
      isGameOver: false,
      isGameStarted: false,
    })
    setLastSavedScore(null)
  }

  // Start game with level
  const startGame = (level: string) => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      level,
      difficulty: 1,
      isGameOver: false,
      isGameStarted: true,
    }))
    setLastSavedScore(null)
  }

  // Update score during game
  const updateScore = (newScore: number) => {
    setGameState(prev => ({
      ...prev,
      score: newScore,
    }))
  }

  // Update difficulty
  const updateDifficulty = (newDifficulty: number) => {
    setGameState(prev => ({
      ...prev,
      difficulty: newDifficulty,
    }))
  }

  // End game and save score
  const endGame = (finalScore: number) => {
    setGameState(prev => ({
      ...prev,
      score: finalScore,
      isGameOver: true,
      isGameStarted: false,
    }))

    // Save to smart contract if wallet is connected and score is higher than last saved
    if (isConnected && address && finalScore > 0 && finalScore !== lastSavedScore) {
      console.log('Saving score to smart contract:', finalScore)
      
      // Get Farcaster user data from context
      const farcasterUsername = context?.user?.username || username || "Anonymous";
      const farcasterFid = context?.user?.fid || fid || 0;
      const farcasterPfp = context?.user?.pfpUrl || pfp || "";
      
      console.log('Farcaster data - Username:', farcasterUsername, 'FID:', farcasterFid, 'PFP:', farcasterPfp);
      
      saveScoreToContract(finalScore, farcasterUsername, farcasterFid, farcasterPfp)
      setLastSavedScore(finalScore)
    }
  }

  // Check if current score is a new personal best
  const isNewPersonalBest = () => {
    return gameState.score > contractScore
  }

  // Get score improvement
  const getScoreImprovement = () => {
    if (contractScore === 0) return gameState.score
    return Math.max(0, gameState.score - contractScore)
  }

  return {
    // Game state
    gameState,
    
    // Actions
    resetGame,
    startGame,
    updateScore,
    updateDifficulty,
    endGame,
    
    // Smart contract data
    contractScore,
    myRank,
    hasScore,
    contractDataLoading,
    
    // Farcaster user data
    username,
    fid,
    pfp,
    
    // Save status
    isSavingScore,
    scoreSaved,
    lastSavedScore,
    
    // Computed values
    isNewPersonalBest: isNewPersonalBest(),
    scoreImprovement: getScoreImprovement(),
    
    // Wallet status
    isConnected,
    address,
  }
}
