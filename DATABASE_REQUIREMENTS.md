# Runera Database Requirements - Public Release

> **Dokumentasi lengkap untuk Backend Team**
> Database schema yang diperlukan agar semua fitur Runera dapat berjalan di production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Tables](#database-tables)
   - [Users](#1-users-table)
   - [Runs](#2-runs-table)
   - [Events](#3-events-table)
   - [Event Participations](#4-event_participations-table)
   - [Achievements](#5-achievements-table)
   - [Auth Sessions](#6-auth_sessions-table)
   - [Faucet Requests](#7-faucet_requests-table)
3. [API Endpoints](#api-endpoints)
4. [Smart Contract Integration](#smart-contract-integration)
5. [Validation Rules](#validation-rules)

---

## Overview

Runera adalah Move-to-Earn dApp yang mengintegrasikan:
- **Frontend**: Next.js 16 + TypeScript
- **Backend**: Express + Prisma + PostgreSQL
- **Blockchain**: Arbitrum Sepolia (ProfileNFT, RunVerifier, AchievementNFT, EventRegistry)

Database harus mendukung:
- ✅ User authentication dengan wallet (Privy)
- ✅ Run tracking & verification
- ✅ Event management & participation
- ✅ Achievement & NFT minting
- ✅ XP, leveling, tier system
- ✅ Streak tracking
- ✅ Faucet management

---

## Database Tables

### 1. Users Table

**Purpose**: Menyimpan data user profile dan progress

```prisma
model User {
  id                   String   @id @default(cuid())
  walletAddress        String   @unique
  exp                  Int      @default(0)
  level                Int      @default(1)
  tier                 Int      @default(1)  // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond
  runCount             Int      @default(0)
  verifiedRunCount     Int      @default(0)
  totalDistanceMeters  Int      @default(0)
  longestStreakDays    Int      @default(0)
  currentStreakDays    Int      @default(0)
  lastRunDate          DateTime?
  profileTokenId       Int?
  onchainNonce         Int      @default(0)

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  runs                 Run[]
  participations       EventParticipation[]
  achievements         Achievement[]
  authSessions         AuthSession[]
  faucetRequests       FaucetRequest[]

  @@index([walletAddress])
}
```

**Required Fields**:
- `walletAddress`: Unique identifier dari wallet user
- `exp`: Total XP earned
- `level`: Current level (calculated from XP)
- `tier`: Current tier (1-5, updated from smart contract)
- `runCount`: Total runs submitted
- `verifiedRunCount`: Total runs yang verified
- `totalDistanceMeters`: Total distance dalam meters
- `longestStreakDays`: Longest streak record
- `currentStreakDays`: Current active streak
- `lastRunDate`: Tanggal run terakhir (untuk streak calculation)
- `profileTokenId`: Token ID dari ProfileNFT (nullable jika belum mint)
- `onchainNonce`: Nonce untuk sync dengan smart contract

---

### 2. Runs Table

**Purpose**: Menyimpan semua run records & verification status

```prisma
model Run {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])

  status           String   // SUBMITTED, VALIDATING, VERIFIED, REJECTED, ONCHAIN_COMMITTED
  distanceMeters   Int
  durationSeconds  Int
  avgPaceSeconds   Int      // Calculated: durationSeconds / (distanceMeters / 1000)

  startTime        DateTime
  endTime          DateTime
  deviceHash       String

  submittedAt      DateTime @default(now())
  verifiedAt       DateTime?
  rejectedAt       DateTime?

  reasonCode       String?  // Rejection reason: DISTANCE_TOO_SHORT, SPEED_ANOMALY, etc.
  xpEarned         Int      @default(0)
  onchainTxHash    String?

  @@index([userId])
  @@index([status])
  @@index([submittedAt])
}
```

**Status Flow**:
1. `SUBMITTED` → User submits run
2. `VALIDATING` → Backend validation in progress
3. `VERIFIED` → Run approved, XP earned
4. `REJECTED` → Run rejected (with reasonCode)
5. `ONCHAIN_COMMITTED` → Data synced to smart contract

**Validation Rules**:
- `distanceMeters` ≥ 100m (minimum distance)
- `durationSeconds` > 0
- `avgPaceSeconds` antara 180-900 (3-15 min/km)
- `deviceHash` unique per user per day (prevent multi-device abuse)

---

### 3. Events Table

**Purpose**: Menyimpan event/challenge yang dibuat

```prisma
model Event {
  id                      String   @id @default(cuid())
  eventId                 String   @unique  // Unique event identifier (e.g., "genesis-run")
  name                    String
  minTier                 Int      @default(1)  // Minimum tier required (1-5)
  minTotalDistanceMeters  Int      @default(0)  // Minimum total distance required
  targetDistanceMeters    Int                   // Target distance for completion
  expReward               Int                   // XP reward for completion

  startTime               DateTime
  endTime                 DateTime
  active                  Boolean  @default(true)

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  participations          EventParticipation[]
  achievements            Achievement[]

  @@index([eventId])
  @@index([active])
}
```

**Event Types**:
- **Genesis Run**: First-time event for early adopters
- **Weekly Challenge**: Recurring weekly events
- **Community Event**: Special events created by admins

---

### 4. Event_Participations Table

**Purpose**: Track user participation dalam events

```prisma
model EventParticipation {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id])
  eventId              String
  event                Event    @relation(fields: [eventId], references: [id])

  distanceCovered      Int      @default(0)  // Distance accumulated for this event
  isEligible           Boolean  @default(false)  // Met tier & distance requirements
  hasJoined            Boolean  @default(false)
  hasClaimed           Boolean  @default(false)  // Claimed achievement NFT
  status               String   @default("JOINED")  // JOINED, COMPLETED, REJECTED

  joinedAt             DateTime @default(now())
  completedAt          DateTime?
  claimedAt            DateTime?

  @@unique([userId, eventId])
  @@index([userId])
  @@index([eventId])
}
```

**Participation Flow**:
1. User joins event → `hasJoined = true`
2. User records runs → `distanceCovered` increases
3. User reaches target → `status = COMPLETED`, `completedAt` set
4. User claims NFT → `hasClaimed = true`, `claimedAt` set

---

### 5. Achievements Table

**Purpose**: Menyimpan achievement records & NFT metadata

```prisma
model Achievement {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id])
  eventId                 String
  event                   Event    @relation(fields: [eventId], references: [id])
  participationId         String?

  tokenId                 Int?     // NFT token ID (from AchievementNFT contract)
  tier                    Int      @default(1)  // Achievement tier
  verifiedDistanceMeters  Int

  metadataUri             String?  // IPFS URI for NFT metadata
  metadataHash            String?  // IPFS hash

  mintedAt                DateTime?
  txHash                  String?  // Blockchain transaction hash
  verifiedAt              DateTime @default(now())

  @@index([userId])
  @@index([eventId])
}
```

**Achievement Generation Flow**:
1. User completes event → Achievement created
2. Backend generates metadata → Upload to IPFS
3. User mints NFT → `tokenId`, `txHash`, `mintedAt` updated

---

### 6. Auth_Sessions Table

**Purpose**: Manage authentication sessions

```prisma
model AuthSession {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  nonce         String   @unique  // One-time nonce for signature verification
  message       String              // Message to be signed
  signature     String?             // User's wallet signature
  token         String?  @unique    // JWT token

  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([nonce])
}
```

**Auth Flow**:
1. `POST /auth/nonce` → Generate nonce & message
2. Frontend signs message with wallet
3. `POST /auth/connect` → Verify signature, issue JWT token
4. Subsequent requests use `Authorization: Bearer {token}`

---

### 7. Faucet_Requests Table

**Purpose**: Track faucet requests untuk prevent abuse

```prisma
model FaucetRequest {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  walletAddress String

  amount        String   // Amount in ETH (e.g., "0.01")
  amountWei     String   // Amount in Wei
  txHash        String?  // Transaction hash

  status        String   @default("PENDING")  // PENDING, SENT, FAILED
  errorMessage  String?

  requestedAt   DateTime @default(now())
  sentAt        DateTime?

  @@index([userId])
  @@index([walletAddress])
}
```

**Faucet Rules**:
- Max 1 request per wallet per 24 hours
- Amount: 0.01 ETH (Arbitrum Sepolia)
- Cooldown: 24 hours

---

## API Endpoints

### Authentication
- `POST /auth/nonce` - Generate nonce for wallet signature
- `POST /auth/connect` - Verify signature & issue JWT token

### Profile
- `GET /profile/:walletAddress/metadata` - Get user profile data
- `POST /profile/create` - Create new user profile (called after first login)

### Runs
- `POST /run/submit` - Submit new run for verification
- `GET /runs?walletAddress=:address&limit=20&offset=0` - Get user's run history
- `POST /run/sync` - Sync progress to smart contract (returns signature)

### Events
- `GET /events?walletAddress=:address` - List all events with user progress
- `POST /events` - **[MISSING]** Create new event (Event Manager only)
- `POST /events/:eventId/join` - Join an event
- `POST /events/genesis/claim` - Claim achievement NFT

### Faucet
- `POST /faucet/request` - Request testnet ETH

---

## Smart Contract Integration

### ProfileNFT Contract
**Address**: (Deploy to Arbitrum Sepolia)

**Functions Used**:
- `getProfileData(address)` → (exists, level, xp, totalDistanceMeters, runCount, longestStreakDays)
- `getProfileTokenId(address)` → tokenId
- `getTier(address)` → tier (1-5)
- `updateProfile(address, level, xp, totalDistance, nonce, signature)` → Update on-chain data

**Backend Integration**:
- After run verification → Call `updateProfile` to sync data
- Use backend wallet to sign update transactions
- Store `onchainNonce` to prevent replay attacks

### AchievementNFT Contract
**Address**: (Deploy to Arbitrum Sepolia)

**Functions Used**:
- `mintAchievement(to, eventId, tier, metadataUri, nonce, signature)` → Mint NFT
- `getAchievementsByOwner(address)` → tokenIds[]
- `tokenURI(tokenId)` → IPFS metadata URI

**Backend Integration**:
- User completes event → Generate metadata → Upload to IPFS
- User claims → Backend signs mint permission
- Frontend calls contract with signature

---

## Validation Rules

### Run Validation
```javascript
// Minimum distance
distanceMeters >= 100

// Valid duration
durationSeconds > 0

// Realistic pace (3-15 min/km)
const avgPaceSeconds = durationSeconds / (distanceMeters / 1000)
avgPaceSeconds >= 180 && avgPaceSeconds <= 900

// Realistic speed (4-20 km/h)
const speedKmh = (distanceMeters / 1000) / (durationSeconds / 3600)
speedKmh >= 4 && speedKmh <= 20

// Device hash uniqueness
// One run per device per day (prevent multi-device abuse)
```

### XP Calculation
```javascript
// Base XP: 10 per km
const baseXP = Math.floor(distanceMeters / 1000) * 10

// Bonus multipliers
const tierBonus = {
  1: 1.0,   // Bronze
  2: 1.1,   // Silver
  3: 1.25,  // Gold
  4: 1.5,   // Platinum
  5: 2.0    // Diamond
}

// Streak bonus (5% per day, max 50%)
const streakMultiplier = Math.min(1 + (currentStreakDays * 0.05), 1.5)

// Final XP
const totalXP = Math.floor(baseXP * tierBonus[tier] * streakMultiplier)
```

### Level Calculation
```javascript
// XP required for level N: 100 * N^2
const xpForNextLevel = (level) => 100 * Math.pow(level, 2)

// Example:
// Level 1→2: 100 XP
// Level 2→3: 400 XP
// Level 3→4: 900 XP
```

### Streak Calculation
```javascript
// Check if run continues streak
const lastRun = user.lastRunDate
const today = new Date()

if (isSameDay(lastRun, today)) {
  // Same day - no streak update
  return currentStreakDays
}

if (isYesterday(lastRun)) {
  // Consecutive day - increase streak
  currentStreakDays += 1
  if (currentStreakDays > longestStreakDays) {
    longestStreakDays = currentStreakDays
  }
} else {
  // Streak broken - reset
  currentStreakDays = 1
}

// Update lastRunDate
lastRunDate = today
```

---

## Critical Missing Endpoints

### ⚠️ Priority 1: Event Creation
```
POST /events
Authorization: Bearer {token}
Body: {
  eventId: string
  name: string
  minTier: number (1-5)
  minTotalDistanceMeters: number
  targetDistanceMeters: number
  expReward: number
  startTime: ISO string
  endTime: ISO string
}

Response: {
  success: boolean
  event: Event object
  message?: string
}
```

**Current Status**: Mock implementation in frontend
**Required For**: Event Manager role (wallet 0xD4c7017a00f5b31A567a0C59437D229375745e2e)

### ⚠️ Priority 2: Streak Data in Profile
```
GET /profile/:walletAddress/metadata

Should include:
- currentStreakDays
- longestStreakDays
- lastRunDate
```

**Current Status**: Partially implemented
**Required For**: Home page streak display

---

## Deployment Checklist

### Database Setup
- [ ] Run Prisma migrations
- [ ] Seed initial data (Genesis Event)
- [ ] Set up database indexes
- [ ] Configure connection pooling

### Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
BLOCKCHAIN_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
BACKEND_WALLET_PRIVATE_KEY=...
PROFILE_NFT_ADDRESS=0x...
ACHIEVEMENT_NFT_ADDRESS=0x...
EVENT_REGISTRY_ADDRESS=0x...
FAUCET_PRIVATE_KEY=...
IPFS_API_KEY=...
```

### Smart Contract Deployment
- [ ] Deploy ProfileNFT to Arbitrum Sepolia
- [ ] Deploy AchievementNFT to Arbitrum Sepolia
- [ ] Deploy EventRegistry to Arbitrum Sepolia
- [ ] Verify contracts on Arbiscan
- [ ] Update contract addresses in backend

### API Testing
- [ ] Test authentication flow
- [ ] Test run submission & verification
- [ ] Test event participation flow
- [ ] Test achievement claiming
- [ ] Test faucet requests
- [ ] Load testing (100 concurrent users)

### Monitoring
- [ ] Set up error logging (Sentry/LogRocket)
- [ ] Set up performance monitoring
- [ ] Set up database query monitoring
- [ ] Set up blockchain transaction monitoring

---

## Notes for Backend Team

1. **Run Verification**: Implement anti-cheat detection (GPS anomalies, speed limits, device fingerprinting)
2. **Event System**: Support recurring events (weekly challenges)
3. **Tier Updates**: Sync tier changes from smart contract every hour
4. **IPFS Integration**: Use Pinata/Web3.Storage for achievement metadata
5. **Rate Limiting**: Implement rate limits on all endpoints (100 req/min per IP)
6. **Caching**: Cache event data, user profiles (Redis recommended)
7. **Webhook Support**: Add webhooks for blockchain events (run verified, NFT minted)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-21
**Maintained By**: Frontend Team
**Questions?**: Contact via GitHub Issues
