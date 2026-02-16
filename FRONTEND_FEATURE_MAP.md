# Runera Frontend — Feature Map vs DB & Smart Contract

> Cross-reference antara Frontend, Backend DB (8 tables), dan Smart Contract (6 contracts).

---

## Database Tables (8)

| # | Table | Deskripsi |
|---|-------|-----------|
| 1 | `_prisma_migrations` | Internal Prisma — tracking migrasi |
| 2 | `User` | walletAddress, profileTokenId, profileMintTxHash, profileMintedAt, exp, tier, totalDistanceMeters, runCount, verifiedRunCount, level, longestStreakDays, onchainNonce, lastOnchainSyncAt |
| 3 | `Run` | userId, status, distanceMeters, durationSeconds, startTime, endTime, deviceHash, avgPaceSeconds, submittedAt, validatedAt, verifiedAt, rejectedAt, onchainCommittedAt, reasonCode, validatorVersion, rulesetHash, onchainTxHash |
| 4 | `Event` | eventId, name, minTier, minTotalDistanceMeters, targetDistanceMeters, expReward, startTime, endTime, active, chainId, rulesetHash |
| 5 | `EventParticipation` | userId, eventId, status (JOINED/COMPLETED/REJECTED), joinedAt, completedAt, completionRunId, completionReasonCode |
| 6 | `Achievement` | userId, eventId, runId, participationId, tokenId, mintedAt, txHash, verifiedDistanceMeters, verifiedAt, rulesetHash, validatorVersion, chainId, metadataUri, metadataHash, tier |
| 7 | `AuthNonce` | userId, walletAddress, nonce, issuedAt, expiresAt, usedAt |
| 8 | `RunStatusHistory` | runId, status, reasonCode, note, txHash, createdAt |

---

## Smart Contracts (6)

| # | Contract | Key Functions |
|---|----------|---------------|
| 1 | `RuneraProfileNFT` | `register()`, `getProfile()`, `hasProfile()`, `updateStats()`, `getProfileTier()`, `getTokenId()` |
| 2 | `RuneraAchievementNFT` | `claim()`, `getAchievement()`, `hasAchievement()`, `getUserAchievements()`, `getUserAchievementCount()` |
| 3 | `RuneraEventRegistry` | `getEvent()`, `getEventCount()`, `getEventIdByIndex()`, `eventExists()`, `isEventActive()`, `createEvent()`, `incrementParticipants()` |
| 4 | `RuneraCosmeticNFT` | `createItem()`, `equipItem()`, `unequipItem()`, `getAllEquipped()`, `getEquipped()`, `getItem()`, `mintItem()` |
| 5 | `RuneraMarketplace` | `createListing()`, `buyItem()`, `cancelListing()`, `getListing()`, `getListingsByItem()`, `getListingsBySeller()`, `getPlatformFee()` |
| 6 | `RuneraAccessControl` | `hasRole()`, `isAdmin()`, `isBackendSigner()`, `isEventManager()` |

---

## LIST 1 — Fitur yang BISA diterapkan di FE (ada di DB + SC, belum diimplementasi)

### 1. Achievement Claim & Display
- **DB**: `Achievement` table (tokenId, mintedAt, txHash, tier, verifiedDistanceMeters, metadataUri)
- **SC**: `AchievementNFT.claim(to, eventId, tier, metadataHash, deadline, signature)`
- **BE API**: `POST /events/genesis/claim` → returns signature + achievementData
- **FE saat ini**: Empty state "No achievements yet"
- **Yang perlu dibuat**:
  - List achievement user (GET dari BE atau SC `getUserAchievements()`)
  - Tombol "Claim" di event detail (setelah event completed)
  - Achievement detail card (tier, distance, mint date)

### 2. On-chain Stats Sync
- **DB**: `User.onchainNonce`, `User.lastOnchainSyncAt`
- **SC**: `ProfileNFT.updateStats(user, stats, deadline, signature)`
- **BE API**: `POST /run/sync` → returns signature + data (level, xp, totalDistance, nonce)
- **FE saat ini**: `syncProgress()` ada di api.ts tapi tidak pernah dipanggil
- **Yang perlu dibuat**:
  - Tombol "Sync to Blockchain" di profile page
  - Call BE untuk dapat signature, lalu call SC `updateStats()` dengan wallet

### 3. Event Completion Status
- **DB**: `EventParticipation.status` (JOINED | COMPLETED | REJECTED), `completedAt`, `completionRunId`
- **FE saat ini**: Hanya tampilkan "Joined" badge
- **Yang perlu dibuat**:
  - Badge "Completed" (hijau) ketika status === COMPLETED
  - Badge "Rejected" (merah) ketika status === REJECTED
  - Tampilkan waktu completedAt

### 4. Run Status Timeline
- **DB**: `RunStatusHistory` table (status, reasonCode, note, txHash, createdAt)
- **FE saat ini**: Hanya tampilkan status akhir run
- **Yang perlu dibuat**:
  - Timeline/stepper di run detail: SUBMITTED → VALIDATING → VERIFIED/REJECTED → ONCHAIN_COMMITTED
  - Tampilkan note dari validator jika rejected

### 5. Run Detail (kolom DB yang belum dipakai)
- **DB**: `Run.validatedAt`, `Run.onchainCommittedAt`, `Run.rulesetHash`
- **FE saat ini**: Tidak ditampilkan
- **Yang perlu dibuat**:
  - Tampilkan waktu validasi (validatedAt)
  - Tampilkan waktu on-chain commit (onchainCommittedAt)
  - Link ke tx explorer jika onchainTxHash ada

### 6. Cosmetic Equip/Unequip (SC-only, no DB)
- **SC**: `CosmeticNFT.equipItem(category, itemId)`, `unequipItem(category)`, `getAllEquipped(user)`
- **FE saat ini**: "Equipped" tab di profile = empty state
- **Yang perlu dibuat**:
  - Baca equipped items dari SC `getAllEquipped(walletAddress)`
  - Tampilkan 4 slot (SHOES, OUTFIT, ACCESSORY, FRAME)
  - Tombol equip/unequip

### 7. Marketplace (SC-only, no DB)
- **SC**: `Marketplace.getListing()`, `getListingsBySeller()`, `buyItem()`, `createListing()`, `cancelListing()`
- **FE saat ini**: Empty state "coming soon"
- **Yang perlu dibuat**:
  - Baca listings dari SC contract
  - Buy item (call SC `buyItem()` via wallet)
  - Create listing (call SC `createListing()` via wallet)

### 8. My Collection (SC-only, no DB)
- **SC**: `CosmeticNFT.balanceOf(address, itemId)`, `getItem(itemId)`
- **FE saat ini**: Empty state
- **Yang perlu dibuat**:
  - Baca balance cosmetic NFTs milik user dari SC
  - Tampilkan grid items yang dimiliki

### 9. User Profile Extra Fields
- **DB**: `User.profileMintTxHash`, `User.profileMintedAt`, `User.lastOnchainSyncAt`
- **FE saat ini**: Tidak ditampilkan
- **Yang perlu dibuat**:
  - Tampilkan status "Profile Minted" dengan link ke tx explorer
  - Tampilkan kapan terakhir sync on-chain

---

## LIST 2 — Yang sudah DIHAPUS/DIUBAH dari FE (tidak sesuai DB/SC)

### API Functions dihapus dari `lib/api.ts`

| # | Fungsi | Alasan dihapus |
|---|--------|----------------|
| 1 | `registerProfile()` | Dead code — FE sudah call SC `register()` langsung via wallet |
| 2 | `getListings()` | Tidak ada tabel DB — harus baca dari SC `Marketplace` contract |
| 3 | `buyListing()` | Tidak ada tabel DB — harus call SC `Marketplace.buyItem()` |
| 4 | `createListing()` | Tidak ada tabel DB — harus call SC `Marketplace.createListing()` |
| 5 | `getAchievements()` | Stub return `[]` — harus baca dari BE `Achievement` table atau SC |

### Types diubah di `lib/types.ts`

| # | Type | Perubahan |
|---|------|-----------|
| 1 | `Achievement` | Disesuaikan ke DB schema: hapus `eventName`, `imageUrl`; tambah `userId`, `participationId`, `verifiedDistanceMeters`, `metadataUri`, `txHash`, `verifiedAt` |
| 2 | `CosmeticItem` | Disesuaikan ke SC: hapus `imageUrl`, `currentSupply`; tambah `ipfsHash` |
| 3 | `MarketListing` | Disesuaikan ke SC struct: hapus nested `item: CosmeticItem`, `status`, `createdAt`; ganti ke flat `itemId`, `pricePerUnit: bigint`, `active: boolean` |

### UI dihapus/diubah di pages

| # | Page | Perubahan |
|---|------|-----------|
| 1 | `market/page.tsx` | Hapus `getListings()` BE call + ListingCard/ListingDetail (nested CosmeticItem). Sekarang empty state sampai SC integration |
| 2 | `mock-data.ts` | Hapus `MOCK_LISTINGS` (pakai type lama), update `MOCK_COSMETICS` dan `MOCK_ACHIEVEMENTS` ke schema baru |

---

## API Endpoints yang BENAR (sesuai DB)

| # | Function | Method | Endpoint | DB Table |
|---|----------|--------|----------|----------|
| 1 | `requestAuthNonce()` | POST | `/auth/nonce` | AuthNonce |
| 2 | `connectWallet()` | POST | `/auth/connect` | AuthNonce |
| 3 | `getProfile()` | GET | `/profile/:walletAddress` | User |
| 4 | `submitRun()` | POST | `/run/submit` | Run |
| 5 | `getRuns()` | GET | `/runs?walletAddress=...` | Run |
| 6 | `syncProgress()` | POST | `/run/sync` | User (onchainNonce) |
| 7 | `getEvents()` | GET | `/events` | Event + EventParticipation |
| 8 | `joinEvent()` | POST | `/events/:id/join` | EventParticipation |
| 9 | `claimAchievement()` | POST | `/events/genesis/claim` | Achievement |
| 10 | `requestFaucet()` | POST | `/faucet/request` | — (direct ETH transfer) |

---

## Data Source Map

| Data | Source | Metode |
|------|--------|--------|
| User profile, stats, XP | **Backend DB** (User table) | REST API `GET /profile/:address` |
| Run history | **Backend DB** (Run table) | REST API `GET /runs` |
| Events list | **Backend DB** (Event table) | REST API `GET /events` |
| Event join | **Backend DB** (EventParticipation) | REST API `POST /events/:id/join` |
| Achievement claim signature | **Backend DB** (Achievement) | REST API `POST /events/genesis/claim` |
| Achievement NFT ownership | **Smart Contract** (AchievementNFT) | `getUserAchievements()`, `getAchievement()` |
| Profile NFT register | **Smart Contract** (ProfileNFT) | `register()` via wallet |
| Stats on-chain sync | **Backend** (signature) + **SC** | BE `POST /run/sync` → SC `updateStats()` |
| Cosmetic items | **Smart Contract** (CosmeticNFT) | `getItem()`, `balanceOf()` |
| Cosmetic equip | **Smart Contract** (CosmeticNFT) | `equipItem()`, `getAllEquipped()` |
| Marketplace listings | **Smart Contract** (Marketplace) | `getListing()`, `getListingsBySeller()` |
| Buy/sell cosmetics | **Smart Contract** (Marketplace) | `buyItem()`, `createListing()` |
| Faucet | **Backend** (no DB table) | REST API `POST /faucet/request` |
