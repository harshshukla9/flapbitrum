'use client'

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/lib/claimcontract';

// Helper function to get token addresses (consistent with existing codebase)
function getTokenAddress(tokenType: 'arb' | 'pepe' | 'boop'): `0x${string}` {
  switch (tokenType) {
    case 'arb':
      return '0x912CE59144191C1204E64559FE8253a0e49E6548';
    case 'pepe':
      return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00';
    case 'boop':
      return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3';
    default:
      throw new Error('Invalid token type');
  }
}

// Token configuration with metadata and actual images
export const TOKEN_CONFIG = {
  arb: {
    address: getTokenAddress('arb'),
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    color: '#28A0F0',
    icon: '/images/arb.png',
    fallbackIcon: '🔵'
  },
  pepe: {
    address: getTokenAddress('pepe'),
    symbol: 'PEPE',
    name: 'Pepe',
    decimals: 18,
    color: '#00FF88',
    icon: '/images/pepe.png',
    fallbackIcon: '🐸'
  },
  boop: {
    address: getTokenAddress('boop'),
    symbol: 'BOOP',
    name: 'Boop',
    decimals: 18,
    color: '#8B5CF6',
    icon: '/images/boop.jpg',
    fallbackIcon: '🚀'
  }
} as const;

export type TokenType = keyof typeof TOKEN_CONFIG;

export interface TokenBalance {
  token: TokenType;
  balance: string;
  formattedBalance: string;
  usdValue?: number;
  symbol: string;
  name: string;
  color: string;
  icon: string;
  fallbackIcon: string;
}

export interface UseTokenBalancesReturn {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  totalUsdValue: number;
  refetch: () => void;
}

// Custom hook to fetch all token balances from the contract
export function useTokenBalances(): UseTokenBalancesReturn {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  // Read ARB balance
  const {
    data: arbBalance,
    isError: arbError,
    isLoading: arbLoading,
    refetch: refetchArb
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
    abi: TOKEN_REWARD_ABI,
    functionName: 'getTokenBalance',
    args: [TOKEN_CONFIG.arb.address],
  });

  // Read PEPE balance
  const {
    data: pepeBalance,
    isError: pepeError,
    isLoading: pepeLoading,
    refetch: refetchPepe
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
    abi: TOKEN_REWARD_ABI,
    functionName: 'getTokenBalance',
    args: [TOKEN_CONFIG.pepe.address],
  });

  // Read BOOP balance
  const {
    data: boopBalance,
    isError: boopError,
    isLoading: boopLoading,
    refetch: refetchBoop
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
    abi: TOKEN_REWARD_ABI,
    functionName: 'getTokenBalance',
    args: [TOKEN_CONFIG.boop.address],
  });

  // Format balance from wei to readable format
  const formatBalance = (balance: bigint | undefined, decimals: number): string => {
    if (!balance) return '0';
    
    const balanceStr = balance.toString();
    const balanceLength = balanceStr.length;
    
    if (balanceLength <= decimals) {
      // Less than 1 token
      const paddedBalance = balanceStr.padStart(decimals, '0');
      const formatted = '0.' + paddedBalance;
      return parseFloat(formatted).toFixed(6);
    } else {
      // More than 1 token
      const integerPart = balanceStr.slice(0, balanceLength - decimals);
      const decimalPart = balanceStr.slice(balanceLength - decimals);
      const formatted = integerPart + '.' + decimalPart;
      const number = parseFloat(formatted);
      
      // Format based on size
      if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
      } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
      } else if (number >= 1) {
        return number.toFixed(2);
      } else {
        return number.toFixed(6);
      }
    }
  };

  // Update balances when contract data changes
  useEffect(() => {
    const anyLoading = arbLoading || pepeLoading || boopLoading;
    const anyError = arbError || pepeError || boopError;

    setIsLoading(anyLoading);

    if (anyError) {
      setError('Failed to fetch token balances');
      setIsLoading(false);
      return;
    }

    if (!anyLoading && (arbBalance !== undefined || pepeBalance !== undefined || boopBalance !== undefined)) {
      const newBalances: TokenBalance[] = [];
      let totalUsd = 0;

      // ARB Balance
      if (arbBalance !== undefined) {
        const formattedArb = formatBalance(arbBalance as bigint, TOKEN_CONFIG.arb.decimals);
        const arbUsd = parseFloat(formattedArb.replace(/[KM]/, '')) * (formattedArb.includes('K') ? 1000 : formattedArb.includes('M') ? 1000000 : 1) * 0.6; // Rough ARB price
        newBalances.push({
          token: 'arb',
          balance: (arbBalance as bigint).toString(),
          formattedBalance: formattedArb,
          usdValue: arbUsd,
          symbol: TOKEN_CONFIG.arb.symbol,
          name: TOKEN_CONFIG.arb.name,
          color: TOKEN_CONFIG.arb.color,
          icon: TOKEN_CONFIG.arb.icon,
          fallbackIcon: TOKEN_CONFIG.arb.fallbackIcon
        });
        totalUsd += arbUsd;
      }

      // PEPE Balance
      if (pepeBalance !== undefined) {
        const formattedPepe = formatBalance(pepeBalance as bigint, TOKEN_CONFIG.pepe.decimals);
        const pepeUsd = parseFloat(formattedPepe.replace(/[KM]/, '')) * (formattedPepe.includes('K') ? 1000 : formattedPepe.includes('M') ? 1000000 : 1) * 0.000001; // Rough PEPE price
        newBalances.push({
          token: 'pepe',
          balance: (pepeBalance as bigint).toString(),
          formattedBalance: formattedPepe,
          usdValue: pepeUsd,
          symbol: TOKEN_CONFIG.pepe.symbol,
          name: TOKEN_CONFIG.pepe.name,
          color: TOKEN_CONFIG.pepe.color,
          icon: TOKEN_CONFIG.pepe.icon,
          fallbackIcon: TOKEN_CONFIG.pepe.fallbackIcon
        });
        totalUsd += pepeUsd;
      }

      // BOOP Balance
      if (boopBalance !== undefined) {
        const formattedBoop = formatBalance(boopBalance as bigint, TOKEN_CONFIG.boop.decimals);
        const boopUsd = parseFloat(formattedBoop.replace(/[KM]/, '')) * (formattedBoop.includes('K') ? 1000 : formattedBoop.includes('M') ? 1000000 : 1) * 0.1; // Rough BOOP price
        newBalances.push({
          token: 'boop',
          balance: (boopBalance as bigint).toString(),
          formattedBalance: formattedBoop,
          usdValue: boopUsd,
          symbol: TOKEN_CONFIG.boop.symbol,
          name: TOKEN_CONFIG.boop.name,
          color: TOKEN_CONFIG.boop.color,
          icon: TOKEN_CONFIG.boop.icon,
          fallbackIcon: TOKEN_CONFIG.boop.fallbackIcon
        });
        totalUsd += boopUsd;
      }

      setBalances(newBalances);
      setTotalUsdValue(totalUsd);
      setError(null);
      setIsLoading(false);
    }
  }, [arbBalance, pepeBalance, boopBalance, arbLoading, pepeLoading, boopLoading, arbError, pepeError, boopError]);

  // Refetch all balances
  const refetch = () => {
    refetchArb();
    refetchPepe();
    refetchBoop();
  };

  return {
    balances,
    isLoading,
    error,
    totalUsdValue,
    refetch
  };
}
