import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flapbitrum - Flappy Bird on Arbitrum',
  description: 'Navigate the L2 blockchain! Play Flapbitrum, the ultimate Flappy Bird game on Arbitrum. Compete on the leaderboard and earn rewards.',
  keywords: 'Flapbitrum, Flappy Bird, Arbitrum, Blockchain Game, L2 Gaming, Farcaster MiniApp',
  authors: [{ name: 'Flapbitrum Team' }],
  openGraph: {
    title: 'Flapbitrum - Flappy Bird on Arbitrum',
    description: 'Navigate the L2 blockchain! Play Flapbitrum, the ultimate Flappy Bird game on Arbitrum. Compete on the leaderboard and earn rewards.',
    type: 'website',
    url: 'https://farcaster.xyz/miniapps/VPD-r40kUKL_/iq-checker',
    siteName: 'Flapbitrum',
    locale: 'en_US',
    images: [
      {
        url: '/images/flappybirdbg.png',
        width: 1200,
        height: 630,
        alt: 'Flapbitrum - Flappy Bird on Arbitrum',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flapbitrum - Flappy Bird on Arbitrum',
    description: 'Navigate the L2 blockchain! Play Flapbitrum, the ultimate Flappy Bird game on Arbitrum.',
    images: ['/images/flappybirdbg.png'],
    creator: '@Flapbitrum',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
