// components/Header.tsx

import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="w-full py-6 bg-gradient-to-r from-blue-800/90 via-indigo-700/90 to-blue-600/90 backdrop-blur-sm shadow-2xl mb-6 rounded-3xl border border-white/20 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                            <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
                            Flapbitrum
                        </h1>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-400/30">
                                L2 Gaming
                            </span>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-400/30">
                                Arbitrum
                            </span>
                        </div>
                    </div>
                </div>
                
                <p className="text-lg sm:text-xl text-blue-100 font-semibold tracking-wide drop-shadow mb-3">
                    Navigate the L2 blockchain!
                </p>
                
                <div className="flex items-center gap-4 text-sm text-blue-200">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span>Live on Arbitrum</span>
                    </div>
                    <div className="w-px h-4 bg-blue-300/30"></div>
                    <div className="flex items-center gap-1">
                        <span>⚡</span>
                        <span>Low Gas Fees</span>
                    </div>
                    <div className="w-px h-4 bg-blue-300/30"></div>
                    <div className="flex items-center gap-1">
                        <span>🏆</span>
                        <span>Leaderboard</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
