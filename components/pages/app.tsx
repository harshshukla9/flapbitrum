'use client'
import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import FlappyBirdGame from '../FlappyBirdGame'
import Header from '../Header'
import { useEffect, useState } from 'react'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 relative overflow-hidden">
          {/* Dynamic gaming background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(40,160,240,0.1),transparent_50%)]"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2328A0F0' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl">
                <img src="/images/logo.png" alt="Flapbitrum Logo" className="w-16 h-16 object-contain" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg animate-pulse">Loading Flapbitrum...</h1>
            <p className="text-blue-200 text-lg">Connecting to Arbitrum Network</p>
            
            {/* Loading Bar */}
            <div className="w-64 mx-auto">
              <div className="bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full animate-pulse" 
                     style={{
                       animation: 'loadingBar 2s ease-in-out infinite',
                       width: '100%',
                       transform: 'translateX(-100%)'
                     }}>
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-300">Loading...</div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 relative overflow-hidden">
          {/* Dynamic gaming background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(40,160,240,0.1),transparent_50%)]"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2328A0F0' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10 text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Farcaster SDK Required
            </h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Please use this miniapp within the Farcaster app to access all features and compete on the blockchain leaderboard.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-xl">
              <p className="text-sm text-blue-100">
                🔗 Connect your wallet to save scores<br/>
                🏆 Compete on the Arbitrum leaderboard<br/>
                📢 Share achievements on Farcaster
              </p>
            </div>
          </div>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <main className="min-h-screen mobile-fullscreen flex flex-col bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 md:px-4 md:py-2 relative overflow-hidden">
                  {/* Dynamic gaming background with mouse tracking */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2328A0F0' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          
          {/* Radial gradient following mouse */}
          <div 
            className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl transition-all duration-300 ease-out"
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
            }}
          ></div>
          
          {/* Floating particles */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-300/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-40 right-10 w-20 h-20 bg-indigo-300/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
          
          {/* Scanning lines effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/5 to-transparent h-1 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/5 to-transparent w-1 animate-pulse delay-1000"></div>
        </div>

        {/* Gaming UI overlay elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 animate-pulse delay-500"></div>

        {/* Blockchain network indicator */}
        

        {/* Gas fee indicator */}
       

        {/* Gaming stats bar */}
      

        <div className="hidden md:block">
          <Header />
        </div>
        
        <FlappyBirdGame />
      </main>
    </SafeAreaContainer>
  )
}
