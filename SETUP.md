# Runera Frontend Setup Guide

## Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 9.x (recommended) or npm

## Quick Start

```bash
# 1. Install all dependencies
pnpm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local and add your Privy App ID

# 3. Run development server
pnpm dev

# 4. Open in browser
# http://localhost:3000
```

## Dependencies

All dependencies will be installed with `pnpm install`. Here's what's included:

### Core

| Package     | Version | Purpose                         |
| ----------- | ------- | ------------------------------- |
| `next`      | 16.x    | React framework with App Router |
| `react`     | 19.x    | UI library                      |
| `react-dom` | 19.x    | React DOM renderer              |

### Authentication & Web3

| Package                | Version | Purpose                               |
| ---------------------- | ------- | ------------------------------------- |
| `@privy-io/react-auth` | latest  | Wallet auth (email, Google, MetaMask) |
| `viem`                 | latest  | Chain definitions (Arbitrum Sepolia)  |

### Map

| Package          | Version | Purpose                      |
| ---------------- | ------- | ---------------------------- |
| `leaflet`        | latest  | Map rendering library        |
| `react-leaflet`  | latest  | React bindings for Leaflet   |
| `@types/leaflet` | latest  | TypeScript types for Leaflet |

### UI

| Package        | Version | Purpose                     |
| -------------- | ------- | --------------------------- |
| `lucide-react` | latest  | Icon library                |
| `clsx`         | latest  | Conditional CSS class names |

### Dev Dependencies

| Package                | Version | Purpose                     |
| ---------------------- | ------- | --------------------------- |
| `tailwindcss`          | 4.x     | Utility-first CSS           |
| `@tailwindcss/postcss` | 4.x     | PostCSS plugin for Tailwind |
| `typescript`           | 5.x     | Type safety                 |
| `eslint`               | 9.x     | Code linting                |
| `eslint-config-next`   | latest  | ESLint config for Next.js   |

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable                      | Required | Description                                                         |
| ----------------------------- | -------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_PRIVY_APP_ID`    | Yes      | Get from [Privy Dashboard](https://dashboard.privy.io)              |
| `PRIVY_APP_SECRET`            | Yes      | Privy App Secret from [Privy Dashboard](https://dashboard.privy.io) |
| `NEXT_PUBLIC_API_URL`         | No       | Backend API URL (default: https://api.runera.xyz)                   |
| `NEXT_PUBLIC_RPC_URL`         | No       | Arbitrum Sepolia RPC endpoint                                       |
| `NEXT_PUBLIC_PROFILE_NFT`     | No       | ProfileDynamicNFT contract address                                  |
| `NEXT_PUBLIC_ACHIEVEMENT_NFT` | No       | AchievementDynamicNFT contract address                              |
| `NEXT_PUBLIC_COSMETIC_NFT`    | No       | CosmeticNFT contract address                                        |
| `NEXT_PUBLIC_MARKETPLACE`     | No       | Marketplace contract address                                        |
| `NEXT_PUBLIC_EVENT_REGISTRY`  | No       | EventRegistry contract address                                      |
| `NEXT_PUBLIC_ACCESS_CONTROL`  | No       | AccessControl contract address                                      |

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Redirect to /home
│   ├── providers.tsx             # Client-side providers (Privy)
│   ├── globals.css               # Global styles & design system
│   ├── login/
│   │   └── page.tsx              # Login page (Privy auth)
│   └── (main)/                   # Authenticated layout group
│       ├── layout.tsx            # Main layout (BottomNav + AuthGuard)
│       ├── home/page.tsx         # Dashboard / Home
│       ├── events/page.tsx       # Events list & detail
│       ├── record/page.tsx       # Record run (GPS + Map)
│       ├── market/page.tsx       # Marketplace (buy/sell cosmetics)
│       └── profile/page.tsx      # User profile & settings
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Modal.tsx
│   │   └── EmptyState.tsx
│   ├── layout/                   # Layout components
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   └── AuthGuard.tsx
│   └── record/
│       └── RunMap.tsx            # Leaflet map component
├── hooks/
│   ├── useAuth.ts                # Privy auth wrapper hook
│   └── useGeolocation.ts         # GPS tracking hook
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   ├── constants.ts              # App constants
│   ├── utils.ts                  # Utility functions
│   ├── api.ts                    # API client (prepared for BE)
│   └── mock-data.ts              # Mock data for development
├── public/
│   └── runera-logo.svg           # App logo
├── .env.example                  # Environment variables template
├── SETUP.md                      # This file
└── package.json
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Integration Points (TODO)

These files/functions need to be updated when connecting to the real backend and smart contracts:

### Backend API (`lib/api.ts`)

- `requestAuthNonce()` → `POST /auth/nonce`
- `connectWallet()` → `POST /auth/connect`
- `getProfile()` → `GET /profile/:address/metadata`
- `registerProfile()` → `POST /profile/gasless-register`
- `submitRun()` → `POST /run/submit`
- `getRuns()` → `GET /runs`
- `getEvents()` → `GET /events`
- `joinEvent()` → `POST /events/:id/join`
- `requestFaucet()` → `POST /faucet/request`

### Smart Contract Calls (via Privy `useSendTransaction`)

- `buyListing()` → `RuneraMarketplace.buyItem()`
- `createListing()` → `RuneraMarketplace.createListing()`
- `getListings()` → `RuneraMarketplace.getListingsByItem()`
- `getAchievements()` → `RuneraAchievementDynamicNFT.getUserAchievements()`
- Profile stats sync → `RuneraProfileDynamicNFT.updateStats()`

### Auth Flow

Currently using Privy's built-in auth. For full integration:

1. User connects via Privy (email/Google/wallet)
2. Get wallet address from Privy
3. Call `POST /auth/nonce` with wallet address
4. Sign the nonce message using Privy's `useSignMessage`
5. Send signature to `POST /auth/connect` for JWT

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Auth**: Privy (email, Google, wallet)
- **Map**: Leaflet + react-leaflet
- **Icons**: Lucide React
- **Chain**: Arbitrum Sepolia (Chain ID: 421614)
