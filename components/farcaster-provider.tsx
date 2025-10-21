import type { Context } from '@farcaster/miniapp-sdk'
import sdk from '@farcaster/miniapp-sdk'
import { useQuery } from '@tanstack/react-query'
import { type ReactNode, createContext, useContext } from 'react'
import { isTunnelUrl, isDevelopment } from '@/lib/environment'

interface FrameContextValue {
  context: Context.MiniAppContext | undefined
  isLoading: boolean
  isSDKLoaded: boolean
  isEthProviderAvailable: boolean
  actions: typeof sdk.actions | undefined
  isTunnelUrl: boolean
  environment: 'development' | 'production'
}

const FrameProviderContext = createContext<FrameContextValue | undefined>(
  undefined,
)

export function useFrame() {
  const context = useContext(FrameProviderContext)
  if (context === undefined) {
    throw new Error('useFrame must be used within a FrameProvider')
  }
  return context
}

interface FrameProviderProps {
  children: ReactNode
}

export function FrameProvider({ children }: FrameProviderProps) {
  const farcasterContextQuery = useQuery({
    queryKey: ['farcaster-context'],
    queryFn: async () => {
      try {
        // Get context first
        const context = await sdk.context
        
        // Call ready() to dismiss splash screen
        await sdk.actions.ready()
        
        console.log('✅ Farcaster SDK ready called successfully')
        return { context, isReady: true }
      } catch (err) {
        console.error('❌ Farcaster SDK initialization error:', err)
        // Still try to get context even if ready() fails
        try {
          const context = await sdk.context
          return { context, isReady: false }
        } catch (contextErr) {
          console.error('❌ Failed to get Farcaster context:', contextErr)
          return { context: undefined, isReady: false }
        }
      }
    },
    retry: 3,
    retryDelay: 1000,
  })

  const isReady = farcasterContextQuery.data?.isReady ?? false
  const context = farcasterContextQuery.data?.context

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const tunnelDetected = isTunnelUrl(currentUrl)

  return (
    <FrameProviderContext.Provider
      value={{
        context,
        actions: sdk.actions,
        isLoading: farcasterContextQuery.isPending,
        isSDKLoaded: isReady && Boolean(context),
        isEthProviderAvailable: Boolean(sdk.wallet?.ethProvider),
        isTunnelUrl: tunnelDetected,
        environment: isDevelopment ? 'development' : 'production',
      }}
    >
      {children}
    </FrameProviderContext.Provider>
  )
}
