'use client'
import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import FlappyBirdGame from '../FlappyBirdGame'
import Header from '../Header'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Loading...</h1>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">
            No farcaster SDK found, please use this miniapp in the farcaster app
          </h1>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <main className="min-h-screen mobile-fullscreen flex flex-col bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-400 md:px-4 md:py-2">
      <div className="hidden md:block">
        <Header />
      </div>
      <div className="flex-1 flex items-center justify-center md:p-0 h-full">
        <FlappyBirdGame />
      </div>
    </main>
    </SafeAreaContainer>
  )
}
