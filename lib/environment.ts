/**
 * Environment detection utilities
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Check if we're running on a tunnel URL (like ngrok, localtunnel, etc.)
 */
export function isTunnelUrl(url?: string): boolean {
  if (!url && typeof window !== 'undefined') {
    url = window.location.href
  }
  
  if (!url) return false
  
  const tunnelDomains = [
    'ngrok.io',
    'ngrok-free.app',
    'localtunnel.me',
    'loca.lt',
    'tunnelto.dev',
    'serveo.net',
    'localhost.run',
    '127.0.0.1',
    '0.0.0.0'
  ]
  
  try {
    const urlObj = new URL(url)
    return tunnelDomains.some(domain => 
      urlObj.hostname.includes(domain) || 
      urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Get the proper app URL based on environment
 */
export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.origin
    
    // If we're on a tunnel URL in development, use it
    if (isDevelopment && isTunnelUrl(currentUrl)) {
      return currentUrl
    }
    
    // Otherwise use the configured URL
    return process.env.NEXT_PUBLIC_APP_URL || currentUrl
  }
  
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Check if we're in Farcaster environment
 */
export function isFarcasterEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.location.hostname.includes('farcaster') ||
    window.location.hostname.includes('warpcast') ||
    window.location.search.includes('farcaster') ||
    navigator.userAgent.includes('Farcaster')
  )
}
