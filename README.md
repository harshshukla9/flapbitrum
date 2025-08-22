# Base Farcaster MiniApp Template

A production-ready template for building mini-apps on Farcaster and Base blockchain, featuring a Flappy Bird game with Arbitrum branding, notification system, and wallet integration.

## 🎮 Features

- **Flappy Bird Game**: Fully functional game with Arbitrum branding
- **Farcaster Integration**: Complete SDK integration with frame support
- **Wallet Connectivity**: Base Sepolia network support with Wagmi
- **Push Notifications**: Webhook-based notification system
- **Responsive Design**: Mobile-first design with safe area handling
- **TypeScript**: Full type safety throughout the application
- **Modern Stack**: Next.js 14, React 18, Tailwind CSS

## 📁 Project Structure

```
base-farcaster/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── send-notification/    # Notification sending endpoint
│   │   │   └── route.ts
│   │   └── webhook/              # Farcaster webhook handler
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── opengraph-image.png
│   ├── page.tsx                  # Home page with frame metadata
│   └── score/                    # Score tracking page
│       └── page.tsx
├── components/                   # React Components
│   ├── farcaster-provider.tsx    # Farcaster SDK provider
│   ├── FlappyBirdGame.tsx        # Main game component (882 lines)
│   ├── Header.tsx                # App header
│   ├── Home/                     # Home page components
│   │   ├── FarcasterActions.tsx  # Farcaster-specific actions
│   │   ├── index.tsx             # Main demo component
│   │   ├── NotificationActions.tsx # Notification controls
│   │   ├── User.tsx              # User profile display
│   │   └── WalletActions.tsx     # Wallet connection actions
│   ├── pages/                    # Page components
│   │   └── app.tsx               # Main app page
│   ├── providers.tsx             # App providers wrapper
│   ├── safe-area-container.tsx   # Safe area handling
│   └── wallet-provider.tsx       # Wagmi wallet provider
├── lib/                          # Utility libraries
│   ├── config.ts                 # Configuration (empty)
│   ├── constants.ts              # App constants
│   ├── kv.ts                     # Redis key-value operations
│   └── notifs.ts                 # Notification utilities
├── public/                       # Static assets
│   └── images/                   # Game and UI images
│       ├── arbitrum-bg.svg       # Arbitrum background
│       ├── arbitrum-bird.svg     # Flapbitrum bird sprite
│       ├── arbitrum-pipe-bottom.svg # Bottom pipe sprite
│       ├── arbitrum-pipe-top.svg # Top pipe sprite
│       ├── base.png              # Base logo
│       ├── bottompipe.png        # Bottom pipe image
│       ├── feed.png              # Feed icon
│       ├── flappy-bird-bg.png    # Game background
│       ├── flappybird.png        # Bird sprite
│       ├── flappybirdbg.png      # Game background
│       ├── icon.png              # App icon
│       ├── splash.png            # Splash screen
│       └── toppipe.png           # Top pipe image
├── smartcontractHooks/           # Smart contract hooks (empty)
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Safe area insets interface
├── biome.json                    # Biome configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies and scripts
├── pnpm-lock.yaml                # Package lock file
├── postcss.config.mjs            # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Farcaster account
- Base Sepolia testnet wallet

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# App URL (required)
NEXT_PUBLIC_URL=https://your-app-domain.com

# Redis (for notifications)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Farcaster (for webhooks)
FARCASTER_APP_KEY=your_farcaster_app_key
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd base-farcaster
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run development server**
   ```bash
   pnpm dev
   ```

4. **Open in Farcaster app**
   - Navigate to the app URL in Farcaster
   - The app will automatically detect the Farcaster SDK

## 🎯 Core Components

### FlappyBirdGame.tsx
The main game component featuring:
- Canvas-based game rendering
- Collision detection
- Score tracking
- Sound effects (coin, crash, oops, whoosh)
- Difficulty progression
- Arbitrum branding with custom sprites

### Farcaster Integration
- **farcaster-provider.tsx**: SDK context provider
- **wallet-provider.tsx**: Wagmi integration for Base Sepolia
- **webhook/route.ts**: Handles frame events and notifications
- **send-notification/route.ts**: Sends push notifications

### Notification System
- Redis-based storage for notification tokens
- Webhook handling for frame events
- Push notification delivery
- Rate limiting support

## 🔧 API Endpoints

### POST /api/webhook
Handles Farcaster webhook events:
- `frame_added`: User adds the frame
- `frame_removed`: User removes the frame  
- `notifications_enabled`: User enables notifications
- `notifications_disabled`: User disables notifications

### POST /api/send-notification
Sends test notifications to users with proper validation and error handling.

## 🎨 Styling

- **Tailwind CSS**: Utility-first styling
- **DaisyUI**: Component library
- **Responsive Design**: Mobile-first approach
- **Safe Areas**: Proper handling of device safe areas
- **Arbitrum Theme**: Custom blue color scheme

## 🛠 Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linting with Biome
```

### Code Quality

- **Biome**: Fast linter and formatter
- **TypeScript**: Full type safety
- **ESLint**: Additional linting rules
- **Prettier**: Code formatting

## 📱 Mobile Optimization

- **Safe Area Handling**: Proper insets for mobile devices
- **Touch Controls**: Optimized for mobile interaction
- **Responsive Layout**: Adapts to different screen sizes
- **Performance**: Optimized for mobile performance

## 🔐 Security

- **Webhook Verification**: Proper signature verification
- **Environment Variables**: Secure configuration management
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error management

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

## 📊 Monitoring

- **Error Tracking**: Console logging for debugging
- **Performance**: Optimized rendering and game loop
- **Analytics**: Ready for integration with analytics services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the Farcaster documentation
- Review the Base network documentation
- Open an issue in the repository

---

**Built with ❤️ for the Farcaster and Base communities**
