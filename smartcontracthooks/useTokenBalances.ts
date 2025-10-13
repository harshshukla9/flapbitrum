'use client'

import { useState, useEffect, useCallback } from 'react';

// Token configuration with metadata
export const TOKEN_CONFIG = {
  arb: {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    color: '#28A0F0',
    icon: '/images/arb.png',
    fallbackIcon: '🔵'
  },
  pepe: {
    symbol: 'PEPE',
    name: 'Pepe',
    decimals: 18,
    color: '#00FF88',
    icon: '/images/pepe.png',
    fallbackIcon: '🐸'
  },
  boop: {
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

// Custom hook to fetch all token balances from API (optimized - single API call instead of 3 RPC calls)
export function useTokenBalances(): UseTokenBalancesReturn {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  const formatTokenAmount = (balance: string, tokenType: TokenType): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    
    const decimals = TOKEN_CONFIG[tokenType].decimals;
    const formatted = (num / Math.pow(10, decimals)).toFixed(4);
    
    // Remove trailing zeros
    return parseFloat(formatted).toString();
  };

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/token-balances');
      const data = await response.json();
      
      if (data.success) {
        // Format balances with proper formatting
        const formattedBalances: TokenBalance[] = data.balances.map((balance: any) => ({
          ...balance,
          formattedBalance: formatTokenAmount(balance.balance, balance.token),
          usdValue: 0 // Could add USD calculation later
        }));
        
        setBalances(formattedBalances);
        setTotalUsdValue(data.totalUsdValue || 0);
      } else {
        setError(data.error || 'Failed to fetch balances');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    totalUsdValue,
    refetch: fetchBalances
  };
}