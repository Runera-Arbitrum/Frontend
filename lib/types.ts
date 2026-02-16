// ============================================
// Runera Frontend Type Definitions
// ============================================

// --- User & Profile ---
export interface UserProfile {
  id: string;
  walletAddress: string;
  exp: number;
  level: number;
  tier: TierLevel;
  runCount: number;
  verifiedRunCount: number;
  totalDistanceMeters: number;
  longestStreakDays: number;
  profileTokenId: number | null;
  onchainNonce: number;
}

export type TierLevel = 1 | 2 | 3 | 4 | 5;

export const TIER_NAMES: Record<TierLevel, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
  5: 'Diamond',
};

export const TIER_COLORS: Record<TierLevel, string> = {
  1: '#CD7F32',
  2: '#C0C0C0',
  3: '#FFD700',
  4: '#E5E4E2',
  5: '#B9F2FF',
};

// --- Run ---
export type RunStatus =
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ONCHAIN_COMMITTED';

export interface Run {
  id: string;
  userId: string;
  status: RunStatus;
  distanceMeters: number;
  durationSeconds: number;
  startTime: string;
  endTime: string;
  avgPaceSeconds: number;
  deviceHash: string;
  submittedAt: string;
  verifiedAt: string | null;
  rejectedAt: string | null;
  reasonCode: string | null;
  onchainTxHash: string | null;
}

export interface RunSubmitPayload {
  walletAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  startTime: string;
  endTime: string;
  avgPaceSeconds: number;
  deviceHash: string;
  path?: GeoPosition[];
}

// --- Events ---
export interface RunEvent {
  eventId: string;
  name: string;
  minTier: TierLevel;
  minTotalDistanceMeters: number;
  targetDistanceMeters: number;
  expReward: number;
  startTime: string;
  endTime: string;
  active: boolean;
  // per-user fields
  isEligible?: boolean;
  participationStatus?: EventParticipationStatus | null;
}

export type EventParticipationStatus = 'JOINED' | 'COMPLETED' | 'REJECTED';

// --- Cosmetic / Market (SC-only: no DB table, read from CosmeticNFT + Marketplace contracts) ---
export type CosmeticCategory = 'SHOES' | 'OUTFIT' | 'ACCESSORY' | 'FRAME';
export type CosmeticRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface CosmeticItem {
  itemId: number;
  name: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  ipfsHash: string;
  maxSupply: number;
  minTierRequired: TierLevel;
}

export interface MarketListing {
  listingId: number;
  seller: string;
  itemId: number;
  amount: number;
  pricePerUnit: bigint;
  active: boolean;
}

// --- Achievement (DB: Achievement table + SC: AchievementNFT) ---
export interface Achievement {
  id: string;
  userId: string;
  eventId: string;
  participationId: string | null;
  tokenId: number | null;
  tier: number;
  verifiedDistanceMeters: number;
  metadataUri: string | null;
  metadataHash: string | null;
  mintedAt: string | null;
  txHash: string | null;
  verifiedAt: string | null;
}

// --- Geolocation ---
export interface GeoPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

// --- Navigation ---
export type TabRoute = 'home' | 'events' | 'record' | 'market' | 'profile';
