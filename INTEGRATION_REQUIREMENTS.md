# 🔌 RUNERA FRONTEND INTEGRATION REQUIREMENTS

**Untuk:** Tim Smart Contract & Backend
**Dari:** Tim Frontend
**Deadline:** ASAP (untuk Week 1 development)
**Project:** Runera MVP - Arbitrum Buildathon

---

## 📋 OVERVIEW

Frontend membutuhkan informasi berikut untuk mengintegrasikan dengan Smart Contracts dan Backend API. Mohon isi document ini dan kirim kembali dalam format yang sama.

---

## 🔗 PART 1: SMART CONTRACT INFORMATION

### 1.1 Contract Addresses (Arbitrum Sepolia)

**Status:** [ ] Belum Deploy | [ ] Sudah Deploy

Jika sudah deploy, isi addresses berikut:

```typescript
// Contract Addresses on Arbitrum Sepolia (Chain ID: 421614)
export const CONTRACT_ADDRESSES = {
  accessControl: "0x...",      // RuneraAccessControl
  profileNFT: "0x...",         // RuneraProfileDynamicNFT
  achievementNFT: "0x...",     // RuneraAchievementDynamicNFT
  eventRegistry: "0x...",      // RuneraEventRegistry
  cosmeticNFT: "0x...",        // RuneraCosmeticNFT
  marketplace: "0x...",        // RuneraMarketplace
};
```

**Verification Status:**
- [ ] Contracts verified on Arbiscan
- [ ] Source code visible
- Arbiscan Links:
  - ProfileNFT: `https://sepolia.arbiscan.io/address/0x...`
  - AchievementNFT: `https://sepolia.arbiscan.io/address/0x...`
  - EventRegistry: `https://sepolia.arbiscan.io/address/0x...`

---

### 1.2 Contract ABIs

**Cara Mendapatkan:**
1. Dari Hardhat/Foundry: `artifacts/contracts/[ContractName].sol/[ContractName].json`
2. Dari Arbiscan (jika verified): Tab "Contract" → "Code" → Section "Contract ABI"

**Yang Dibutuhkan:**
Kirim file JSON untuk setiap contract berikut:

```
📁 ABIs/
  ├── RuneraAccessControl.json
  ├── RuneraProfileDynamicNFT.json
  ├── RuneraAchievementDynamicNFT.json
  ├── RuneraEventRegistry.json
  ├── RuneraCosmeticNFT.json
  └── RuneraMarketplace.json
```

**Format ABI:**
```json
[
  {
    "inputs": [...],
    "name": "functionName",
    "outputs": [...],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [...],
    "name": "EventName",
    "type": "event"
  }
]
```

**Cara Kirim:**
- [ ] Upload ke Google Drive / Dropbox (share link)
- [ ] Attach ke email
- [ ] Push ke GitHub repo (share link)
- [ ] Copy-paste langsung (jika kecil)

---

### 1.3 EIP-712 Signature Specification

**Context:** Backend akan sign message untuk gasless transactions dan validasi. Frontend perlu tahu exact structure untuk verify signatures.

**Yang Dibutuhkan:**

#### A. Domain Separator
```typescript
const EIP712_DOMAIN = {
  name: "Runera",           // Confirm exact name
  version: "1",             // Confirm version
  chainId: 421614,          // Arbitrum Sepolia
  verifyingContract: "0x..." // ProfileNFT contract address
};
```

#### B. Profile Update Types
```typescript
// Untuk fungsi: RuneraProfileDynamicNFT.updateProgress(signature, ...)
const PROFILE_UPDATE_TYPES = {
  ProfileUpdate: [
    { name: "user", type: "address" },
    { name: "level", type: "uint256" },
    { name: "xp", type: "uint256" },
    { name: "totalDistance", type: "uint256" }, // Confirm field names
    { name: "nonce", type: "uint256" }
  ]
};
```

#### C. Achievement Claim Types
```typescript
// Untuk fungsi: RuneraAchievementNFT.claimAchievement(signature, ...)
const ACHIEVEMENT_CLAIM_TYPES = {
  AchievementClaim: [
    { name: "user", type: "address" },
    { name: "eventId", type: "bytes32" },
    { name: "tokenId", type: "uint256" }, // Confirm field names
    { name: "nonce", type: "uint256" }
  ]
};
```

**Dimana Lihat:**
- Di contract code: Function `verify()` atau `_hashTypedDataV4()`
- Atau di backend code yang implement signing

**Copy Exact Structure:**
```typescript
// Copy dari smart contract code dan paste di sini:



```

---

### 1.4 Backend Signer Wallet

**Context:** Backend perlu address yang di-grant `BACKEND_SIGNER_ROLE` di smart contract.

```
BACKEND_SIGNER_ADDRESS = 0x...
```

**Konfirmasi:**
- [ ] Address sudah di-grant `BACKEND_SIGNER_ROLE` di RuneraProfileDynamicNFT
- [ ] Address sudah di-grant `BACKEND_SIGNER_ROLE` di RuneraAchievementDynamicNFT
- [ ] Address punya saldo ETH testnet untuk gas

**Test Transaction (Optional):**
Share 1 sample tx hash dimana backend signer berhasil call contract:
```
https://sepolia.arbiscan.io/tx/0x...
```

---

### 1.5 Genesis Event Details

**Context:** Untuk UI Event page, perlu tahu exact event parameters.

```typescript
const GENESIS_EVENT = {
  eventId: "0x...",                // Exact bytes32 value
  name: "Arbitrum Genesis 10K",
  description: "...",
  targetDistanceMeters: 10000,
  minTier: 1,
  startTimestamp: 1234567890,      // Unix timestamp
  endTimestamp: 1234567890,        // Unix timestamp
  achievementTokenId: 1,           // Token ID yang akan di-mint
  imageUrl: "/achievements/genesis-10k.png" // Optional
};
```

**Status:**
- [ ] Event sudah di-create via EventRegistry
- [ ] Event active
- [ ] Achievement metadata sudah di-set

---

## 🖥️ PART 2: BACKEND API INFORMATION

### 2.1 API Base URL

**Development:**
```
API_BASE_URL = http://localhost:3001
# atau
API_BASE_URL = http://192.168.x.x:3001
```

**Production/Staging (jika ada):**
```
API_BASE_URL = https://api.runera.xyz
# atau
API_BASE_URL = https://runera-backend.vercel.app
```

---

### 2.2 API Endpoints Specification

**Status:** [ ] Belum Implement | [ ] Sudah Ready

Konfirmasi endpoint berikut sudah ready atau masih dalam development:

#### A. Faucet (Feature A - Gasless Onboarding)

**Endpoint:**
```
POST /faucet/request
```

**Request Body:**
```json
{
  "walletAddress": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.003"
}
```

**Response (Error - Rate Limited):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 24 hours."
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### B. Run Submission (Feature B - Anti-Cheat)

**Endpoint:**
```
POST /run/submit
```

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "distanceMeters": 5230,
  "durationSeconds": 1800,
  "avgPaceSeconds": 344,
  "path": [
    { "lat": -6.2088, "lng": 106.8456, "timestamp": 1234567890 },
    { "lat": -6.2089, "lng": 106.8457, "timestamp": 1234567891 }
  ],
  "deviceHash": "abc123..."
}
```

**Response (Success - Verified):**
```json
{
  "success": true,
  "runId": "run-001",
  "status": "VERIFIED",
  "xpEarned": 100
}
```

**Response (Rejected):**
```json
{
  "success": false,
  "status": "REJECTED",
  "reasonCode": "PACE_TOO_FAST",
  "message": "Average pace exceeds maximum allowed (< 3:00 min/km)"
}
```

**Validation Rules:**
```
MAX_PACE = 180 seconds/km (3:00 min/km)
MIN_DISTANCE = 100 meters
MIN_DURATION = ? (confirm)
MAX_DISTANCE = ? (confirm)
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### C. Profile Registration (Feature C - Soulbound NFT)

**Endpoint:**
```
POST /profile/gasless-register
```

**Request Body:**
```json
{
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "tokenId": 123,
  "profileNFTAddress": "0x..."
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### D. Progress Sync (Feature C - Level Up)

**Endpoint:**
```
POST /run/sync
```

**Request Body:**
```json
{
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x...",
  "data": {
    "level": 5,
    "xp": 500,
    "totalDistance": 52340,
    "nonce": 3
  }
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### E. Achievement Claim (Feature D - Genesis Event)

**Endpoint:**
```
POST /events/genesis/claim
```

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "eventId": "0xgenesis10k"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0x...",
  "achievementData": {
    "eventId": "0x...",
    "tokenId": 1,
    "nonce": 1
  }
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### F. Run History

**Endpoint:**
```
GET /runs?walletAddress=0x...&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "runs": [
    {
      "id": "run-001",
      "status": "VERIFIED",
      "distanceMeters": 5230,
      "durationSeconds": 1800,
      "avgPaceSeconds": 344,
      "startTime": "2026-02-12T06:00:00Z",
      "endTime": "2026-02-12T06:30:00Z",
      "xpEarned": 100,
      "onchainTxHash": "0x..." // nullable
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### G. Events List

**Endpoint:**
```
GET /events?walletAddress=0x...
```

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "eventId": "0xgenesis10k",
      "name": "Arbitrum Genesis 10K",
      "targetDistanceMeters": 10000,
      "expReward": 500,
      "startTime": "2026-01-01T00:00:00Z",
      "endTime": "2026-12-31T23:59:59Z",
      "active": true,
      "userProgress": {
        "distanceCovered": 5230,
        "isEligible": true,
        "hasJoined": true,
        "hasClaimed": false
      }
    }
  ]
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

#### H. Profile Stats

**Endpoint:**
```
GET /profile/:address
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "walletAddress": "0x...",
    "level": 5,
    "tier": 3,
    "xp": 500,
    "totalDistanceMeters": 52340,
    "verifiedRunCount": 10,
    "longestStreakDays": 7,
    "profileTokenId": 123,
    "hasProfileNFT": true
  }
}
```

**Status:** [ ] Ready | [ ] In Progress | [ ] Not Started

---

### 2.3 Authentication (Optional untuk MVP)

**Apakah API perlu Authentication?**
- [ ] Tidak perlu (semua endpoint public)
- [ ] Ya, perlu JWT token

**Jika Ya, flow:**
```
1. POST /auth/nonce
   Request: { "walletAddress": "0x..." }
   Response: { "nonce": "abc123", "message": "Sign this: abc123" }

2. User sign message via wallet

3. POST /auth/connect
   Request: { "walletAddress": "0x...", "signature": "0x...", "nonce": "abc123" }
   Response: { "token": "jwt-token-here" }

4. Subsequent requests:
   Headers: { "Authorization": "Bearer jwt-token-here" }
```

**Status:** [ ] Implemented | [ ] Not Needed for MVP

---

### 2.4 Error Response Format

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional
}
```

**Confirm:** [ ] Yes, this format | [ ] Different format (specify below)

---

### 2.5 CORS Configuration

**Apakah backend sudah enable CORS untuk frontend?**
- [ ] Yes, all origins allowed (development)
- [ ] Yes, specific origins: `_______________`
- [ ] Not yet configured

---

## 📦 DELIVERY METHOD

**Pilih salah satu cara pengiriman:**

### Option 1: GitHub Repository
```
Smart Contract Repo: https://github.com/Runera-Arbitrum/SmartContracts
Backend Repo: https://github.com/Runera-Arbitrum/Backend

Branch: main / develop / feature/integration
```

### Option 2: Google Drive / Dropbox
```
Share link: _______________
```

### Option 3: Direct Message
```
Slack: @username
Discord: username#1234
Telegram: @username
Email: team@runera.xyz
```

### Option 4: Paste in Response
```
Copy-paste semua informasi di message berikutnya
```

---

## ✅ CHECKLIST COMPLETION

**Smart Contract Team:**
- [ ] Contract addresses provided
- [ ] All ABI files shared
- [ ] EIP-712 specification documented
- [ ] Backend signer address shared & role granted
- [ ] Genesis event created & details provided

**Backend Team:**
- [ ] API base URL provided
- [ ] All endpoints implemented (or marked as in-progress)
- [ ] Request/Response format documented
- [ ] Validation rules confirmed
- [ ] CORS enabled

---

## 🚨 URGENT NEEDS (Week 1)

**Minimal requirements untuk frontend bisa start integration:**

1. ✅ Contract Addresses (ProfileNFT, AchievementNFT)
2. ✅ 2 ABIs minimum (ProfileNFT, AchievementNFT)
3. ✅ API Base URL
4. ✅ 2 Endpoints ready:
   - POST /faucet/request
   - POST /run/submit

**Nice to have (bisa menyusul Week 2):**
- EIP-712 spec lengkap
- Semua endpoints lainnya
- Full ABIs

---

## 📞 CONTACT

**Frontend Team Lead:**
- Name: _______________
- Contact: _______________

**Questions?**
Jika ada yang tidak jelas, langsung tanya via channel komunikasi tim.

---

**Terima kasih! 🚀**
Mari kita selesaikan MVP Runera bersama untuk Arbitrum Buildathon!
