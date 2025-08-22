// components/Header.tsx

import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shadow-lg mb-4 rounded-2xl">
            <div className="flex flex-col items-center text-center px-4">
                <span className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg flex items-center gap-2">
                    <span role="img" aria-label="arbitrum">🔵</span> Flapbitrum
                </span>
                <span className="text-sm sm:text-base text-white mt-1 font-semibold tracking-wide drop-shadow">Navigate the L2 blockchain!</span>
            </div>
        </header>
    );
};

export default Header;
