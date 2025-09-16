"use client"

import { useCallback } from 'react'
import { useAccount, useContractWrite, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/lib/claimcontract'

export function useClaimRewardContract() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, isError, error } = useContractWrite()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = useCallback(
    async (token: `0x${string}`, amountWei: bigint, nonce: bigint, signature: `0x${string}`) => {
      if (!address) throw new Error('Wallet not connected')
      return writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'claimTokenReward',
        args: [token, amountWei, nonce, signature],
      })
    },
    [address, writeContract]
  )

  return { claim, hash, isPending, isConfirming, isSuccess, isError, error }
}




