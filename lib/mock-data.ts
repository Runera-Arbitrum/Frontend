// ============================================
// Mock Data for Development / Testing
// Will be replaced with real API calls
// ============================================

import type {
  UserProfile,
  Run,
  RunEvent,
  CosmeticItem,
  Achievement,
} from './types';

export const MOCK_USER: UserProfile = {
  id: 'user-001',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  exp: 450,
  level: 5,
  tier: 3,
  runCount: 12,
  verifiedRunCount: 10,
  totalDistanceMeters: 52340,
  longestStreakDays: 7,
  profileTokenId: 1,
  onchainNonce: 3,
};

export const MOCK_RUNS: Run[] = [
  {
    id: 'run-001',
    userId: 'user-001',
    status: 'VERIFIED',
    distanceMeters: 5230,
    durationSeconds: 1800,
    startTime: '2026-02-12T06:00:00Z',
    endTime: '2026-02-12T06:30:00Z',
    avgPaceSeconds: 344,
    deviceHash: 'abc123',
    submittedAt: '2026-02-12T06:31:00Z',
    verifiedAt: '2026-02-12T06:31:30Z',
    rejectedAt: null,
    reasonCode: null,
    onchainTxHash: null,
  },
  {
    id: 'run-002',
    userId: 'user-001',
    status: 'VERIFIED',
    distanceMeters: 10120,
    durationSeconds: 3600,
    startTime: '2026-02-11T06:00:00Z',
    endTime: '2026-02-11T07:00:00Z',
    avgPaceSeconds: 355,
    deviceHash: 'abc123',
    submittedAt: '2026-02-11T07:01:00Z',
    verifiedAt: '2026-02-11T07:01:30Z',
    rejectedAt: null,
    reasonCode: null,
    onchainTxHash: null,
  },
  {
    id: 'run-003',
    userId: 'user-001',
    status: 'SUBMITTED',
    distanceMeters: 3200,
    durationSeconds: 1200,
    startTime: '2026-02-10T07:00:00Z',
    endTime: '2026-02-10T07:20:00Z',
    avgPaceSeconds: 375,
    deviceHash: 'abc123',
    submittedAt: '2026-02-10T07:21:00Z',
    verifiedAt: null,
    rejectedAt: null,
    reasonCode: null,
    onchainTxHash: null,
  },
];

export const MOCK_EVENTS: RunEvent[] = [
  {
    eventId: '0xgenesis10k',
    name: 'Genesis 10K Challenge',
    minTier: 1,
    minTotalDistanceMeters: 0,
    targetDistanceMeters: 10000,
    expReward: 500,
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    active: true,
    isEligible: true,
    participationStatus: 'JOINED',
  },
  {
    eventId: '0xsilversprinter',
    name: 'Silver Sprinter',
    minTier: 2,
    minTotalDistanceMeters: 20000,
    targetDistanceMeters: 5000,
    expReward: 300,
    startTime: '2026-02-01T00:00:00Z',
    endTime: '2026-03-01T00:00:00Z',
    active: true,
    isEligible: true,
    participationStatus: null,
  },
  {
    eventId: '0xgoldmarathon',
    name: 'Gold Marathon',
    minTier: 3,
    minTotalDistanceMeters: 50000,
    targetDistanceMeters: 42195,
    expReward: 1000,
    startTime: '2026-03-01T00:00:00Z',
    endTime: '2026-04-01T00:00:00Z',
    active: true,
    isEligible: true,
    participationStatus: null,
  },
  {
    eventId: '0xdiamondultra',
    name: 'Diamond Ultra',
    minTier: 5,
    minTotalDistanceMeters: 100000,
    targetDistanceMeters: 100000,
    expReward: 5000,
    startTime: '2026-06-01T00:00:00Z',
    endTime: '2026-07-01T00:00:00Z',
    active: false,
    isEligible: false,
    participationStatus: null,
  },
];

export const MOCK_COSMETICS: CosmeticItem[] = [
  {
    itemId: 1,
    name: 'Starter Kicks',
    category: 'SHOES',
    rarity: 'COMMON',
    ipfsHash: '',
    maxSupply: 1000,
    minTierRequired: 1,
  },
  {
    itemId: 2,
    name: 'Neon Runner',
    category: 'SHOES',
    rarity: 'RARE',
    ipfsHash: '',
    maxSupply: 200,
    minTierRequired: 2,
  },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-001',
    userId: 'user-001',
    eventId: '0xgenesis10k',
    participationId: 'ep-001',
    tokenId: 1,
    tier: 3,
    verifiedDistanceMeters: 10500,
    metadataUri: null,
    metadataHash: '0xabcdef',
    mintedAt: '2026-02-08T10:00:00Z',
    txHash: '0x123abc',
    verifiedAt: '2026-02-08T09:55:00Z',
  },
];

// Weekly distance data for chart
export const MOCK_WEEKLY_DISTANCES = [
  { day: 'Mon', meters: 5230 },
  { day: 'Tue', meters: 0 },
  { day: 'Wed', meters: 3200 },
  { day: 'Thu', meters: 10120 },
  { day: 'Fri', meters: 0 },
  { day: 'Sat', meters: 7500 },
  { day: 'Sun', meters: 0 },
];

// Activity Feed — dummy data (no DB table exists)
export interface FeedActivity {
  id: string;
  user: { name: string; initial: string; avatarColor: string };
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSeconds: number;
  timestamp: string;
  location?: string;
}

export const MOCK_ACTIVITY_FEED: FeedActivity[] = [
  { id: 'feed-001', user: { name: 'Alex R.', initial: 'A', avatarColor: 'bg-blue-500' }, distanceMeters: 5230, durationSeconds: 1620, avgPaceSeconds: 310, timestamp: '2026-02-17T07:30:00Z', location: 'Central Park' },
  { id: 'feed-002', user: { name: 'Maya K.', initial: 'M', avatarColor: 'bg-purple-500' }, distanceMeters: 10450, durationSeconds: 3540, avgPaceSeconds: 339, timestamp: '2026-02-17T06:00:00Z', location: 'Riverside Trail' },
  { id: 'feed-003', user: { name: 'Jordan T.', initial: 'J', avatarColor: 'bg-green-500' }, distanceMeters: 3100, durationSeconds: 1080, avgPaceSeconds: 348, timestamp: '2026-02-16T18:45:00Z', location: 'Harbor Loop' },
  { id: 'feed-004', user: { name: 'Sam W.', initial: 'S', avatarColor: 'bg-orange-500' }, distanceMeters: 8200, durationSeconds: 2880, avgPaceSeconds: 351, timestamp: '2026-02-16T06:15:00Z' },
  { id: 'feed-005', user: { name: 'Riley N.', initial: 'R', avatarColor: 'bg-pink-500' }, distanceMeters: 21097, durationSeconds: 7200, avgPaceSeconds: 341, timestamp: '2026-02-15T05:30:00Z', location: 'City Marathon Route' },
];
