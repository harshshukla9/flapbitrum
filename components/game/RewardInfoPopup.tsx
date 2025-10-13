import React from 'react';

interface RewardInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  localStorageKey: string;
}

const RewardInfoPopup: React.FC<RewardInfoPopupProps> = ({ isOpen, onClose, localStorageKey }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem(localStorageKey, 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-3"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-white/20 bg-gradient-to-r from-blue-800/50 to-indigo-800/50">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
          >
            <span className="text-lg">✕</span>
          </button>
          
          <div className="text-center mb-3">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg mb-3">
              <span className="text-3xl">🎮</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Welcome to PlayFi Arena!</h2>
            <p className="text-sm text-blue-200">Play. Earn. Win Big!</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-5">
          {/* Hero Message */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 mb-5">
            <div className="text-center">
              <div className="text-3xl mb-2">🏆💰</div>
              <h3 className="text-lg font-bold text-white mb-2">
                Dual Earning System!
              </h3>
              <p className="text-sm text-gray-200 leading-relaxed">
                Win rewards through <span className="text-yellow-300 font-bold">Monthly Leaderboard</span> AND <span className="text-green-300 font-bold">Daily Token Claims</span>! 
                The more you play, the more you earn!
              </p>
            </div>
          </div>

          {/* Two Earning Ways */}
          <div className="mb-5">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>💎</span>
              Two Ways to Earn
            </h4>

            {/* Monthly Leaderboard */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Monthly Leaderboard</div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    Compete for top positions! Top 15 winners get reward points distributed at month end.
                  </p>
                  <div className="bg-purple-600/30 rounded-lg px-2 py-1 inline-block">
                    <span className="text-xs text-purple-200 font-semibold">🎯 Top 15 Winners</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Claims */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Daily Token Claims</div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    Higher scores = Higher chances to win daily tokens! Play unlimited times to maximize your wins.
                  </p>
                  <div className="bg-green-600/30 rounded-lg px-2 py-1 inline-block">
                    <span className="text-xs text-green-200 font-semibold">⚡ Live Now!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Prizes Grid */}
          <div className="mb-5">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span>🪙</span>
              Daily Token Pool
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-400/30">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">🔷</span>
                </div>
                <div className="font-bold text-white text-sm">ARB</div>
                <div className="text-xs text-blue-300">Arbitrum</div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-400/30">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">🐸</span>
                </div>
                <div className="font-bold text-white text-sm">PEPE</div>
                <div className="text-xs text-green-300">Meme Power</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-400/30">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">👻</span>
                </div>
                <div className="font-bold text-white text-sm">BOOP</div>
                <div className="text-xs text-purple-300">Farcaster</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-3 border border-orange-400/30">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">⛓️</span>
                </div>
                <div className="font-bold text-white text-sm">OG Chain</div>
                <div className="text-xs text-orange-300">Original</div>
              </div>
            </div>
          </div>

          {/* How Score Works */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-400/20 mb-4">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span>🚀</span>
              Your Score Matters!
            </h4>
            <div className="space-y-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="text-xs">Score 50+ → Enter daily draw</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="text-xs">Score 100+ → 2x win chances</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="text-xs">Score 200+ → 5x win chances</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                <span className="text-xs">Score 500+ → 10x chances + bonus!</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-400/20 mb-4">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span>⚡</span>
              Pro Tips
            </h4>
            <div className="space-y-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                <span className="text-xs">Play regularly to win both rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                <span className="text-xs">Unlimited plays - no restrictions!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                <span className="text-xs">Connect wallet to save scores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                <span className="text-xs">Share on Farcaster for bonuses</span>
              </div>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-400/20">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span>📋</span>
              Quick Facts
            </h4>
            <div className="space-y-1.5 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                <span className="text-xs">All tokens paid on Arbitrum</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                <span className="text-xs">Daily draws reset at midnight UTC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                <span className="text-xs">Monthly winners announced 1st of month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                <span className="text-xs">More you play = More you earn!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 bg-gradient-to-r from-blue-800/50 to-indigo-800/50">
          <button
            onClick={handleClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <span>Let's Play & Earn!</span>
            <span className="text-xl">🚀</span>
          </button>
        </div>
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default RewardInfoPopup;