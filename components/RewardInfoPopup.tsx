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
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-blue-900/95 via-indigo-800/95 to-blue-700/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-blue-800/50 to-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to Flapbitrum!</h2>
              <p className="text-sm text-blue-200">Your gateway to blockchain gaming</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-400/30 mb-4">
              <h3 className="text-xl font-bold text-yellow-300 mb-2 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                $50 USDC Prize Pool
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Compete with players worldwide and win your share of the $50 USDC reward pool! 
                Show off your skills and climb the leaderboard to claim your rewards.
              </p>
            </div>
          </div>

          {/* Reward Distribution Table */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Reward Distribution
            </h4>
            
            {/* Top 3 Prizes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-400/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🥇</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">1st Place</div>
                    <div className="text-sm text-yellow-300">Champion</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-300 text-lg">$7.50</div>
                  <div className="text-xs text-gray-300">15% of pool</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-2xl border border-gray-400/30 hover:from-gray-400/30 hover:to-gray-500/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🥈</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">2nd Place</div>
                    <div className="text-sm text-gray-300">Runner-up</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-300 text-lg">$6.00</div>
                  <div className="text-xs text-gray-300">12% of pool</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-400/30 hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🥉</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">3rd Place</div>
                    <div className="text-sm text-orange-300">Bronze</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-300 text-lg">$5.00</div>
                  <div className="text-xs text-gray-300">10% of pool</div>
                </div>
              </div>
            </div>

            {/* Places 4-10 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-400/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏅</span>
                </div>
                <div>
                  <div className="font-bold text-white text-lg">4th - 10th Place</div>
                  <div className="text-sm text-blue-300">7 players</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-300 text-lg">$3.50 each</div>
                <div className="text-xs text-gray-300">49% of pool</div>
              </div>
            </div>

            {/* Places 11-15 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <div className="font-bold text-white text-lg">11th - 15th Place</div>
                  <div className="text-sm text-purple-300">5 players</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-300 text-lg">$2.00 each</div>
                <div className="text-xs text-gray-300">10% of pool</div>
              </div>
            </div>
          </div>

          {/* Game Features */}
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl p-5 border border-blue-400/20 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">🎮</span>
              Game Features
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>3 difficulty levels with different rewards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Save scores to blockchain leaderboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Share achievements on Farcaster</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Real-time competition with global players</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-purple-400/20">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span>
              Important Notes
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Rewards are paid in USDC on Arbitrum network</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Connect your wallet to save scores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Contest ends on August 29, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Higher difficulty = more points per pipe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 bg-gradient-to-r from-blue-800/50 to-indigo-800/50">
          <button
            onClick={handleClose}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Let's Play!</span>
            <span className="text-xl">🚀</span>
          </button>
        </div>
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
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
