'use client'

import React, { useState } from 'react';
import { useTokenBalances, type TokenBalance } from '@/smartcontracthooks/useTokenBalances';

interface TokenBalanceDisplayProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({ 
  className = '', 
  showTitle = true,
  compact = false 
}) => {
  const { balances, isLoading, error, totalUsdValue, refetch } = useTokenBalances();

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-red-400 text-sm">⚠️ Failed to load rewards</span>
          </div>
          <button 
            onClick={refetch}
            className="text-red-400 hover:text-red-300 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-3 ${className}`}>
        <div className="flex flex-col justify-center items-center space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400 flex justify-center text-lg">💰</span>
            <span className="flex justify-center text-white text-sm text-center font-bold">
              {isLoading ? 'Loading...' : 'Daily Rewards'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {balances.map((balance) => (
              <div key={balance.token} className="flex items-center justify-center space-x-1 min-w-0">
                <TokenIcon balance={balance} size="sm" />
                <span className="text-xs text-white/80 font-medium truncate">{parseFloat(balance.formattedBalance).toFixed(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Daily Rewards</h3>
              <p className="text-base text-white/80">Available tokens to win</p>
            </div>
          </div>
          <button 
            onClick={refetch}
            className="text-white/60 hover:text-white/80 transition-colors"
            title="Refresh balances"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-white/20 rounded"></div>
                    <div className="w-12 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="w-20 h-4 bg-white/20 rounded"></div>
                  <div className="w-16 h-3 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {balances.map((balance) => (
              <TokenBalanceCard key={balance.token} balance={balance} />
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-4 text-center">
            <p className="text-base text-white/70 font-medium">
              🎮 Play Flapbitrum to win daily rewards! 
            </p>
            <p className="text-sm text-white/50 mt-1">
              Gift boxes contain random amounts from these tokens
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// Token icon component with fallback support
const TokenIcon: React.FC<{ 
  balance: TokenBalance; 
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ balance, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg', 
    lg: 'text-2xl'
  };

  if (imageError || !balance.icon.startsWith('/')) {
    // Show fallback emoji if image fails or doesn't exist
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${textSizeClasses[size]}`}
        style={{ backgroundColor: `${balance.color}20`, color: balance.color }}
      >
        {balance.fallbackIcon}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden`}
      style={{ backgroundColor: `${balance.color}20` }}
    >
      <img 
        src={`${balance.icon}?v=2`}
        alt={balance.name}
        className={`${sizeClasses[size]} object-contain`}
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
};

// Individual token balance card component
const TokenBalanceCard: React.FC<{ balance: TokenBalance }> = ({ balance }) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <TokenIcon balance={balance} size="lg" />
          <div>
            <div className="font-bold text-white text-lg">{balance.symbol}</div>
            <div className="text-sm text-white/70">{balance.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-white text-xl">
            {balance.formattedBalance}
          </div>
          <div className="text-sm text-white/60">
            tokens available
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenBalanceDisplay;
