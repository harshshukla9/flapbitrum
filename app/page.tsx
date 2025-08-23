import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/arb.png`,
  button: {
    title: 'Play Flapbitrum',
    action: {
      type: 'launch_frame',
      name: 'Play Flapbitrum',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/arb.png`,
      splashBackgroundColor: '#f7f7f7',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Flapbitrum',
    openGraph: {
      title: 'Flapbitrum',
      description: 'Flapbitrum is a fun, crypto-native twist on the classic flappy bird game — built on Arbitrum.',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
