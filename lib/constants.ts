// ============================================
// Runera App Constants
// ============================================

// API - will be replaced with real backend URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.runera.xyz';

// Chain config
export const CHAIN_ID = 421614; // Arbitrum Sepolia
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

// Contract addresses on Arbitrum Sepolia (Chain ID: 421614)
export const CONTRACT_ADDRESSES = {
  accessControl: process.env.NEXT_PUBLIC_ACCESS_CONTROL || '0x3518B6A434F79625011321E348d14895946e3Be9',
  eventRegistry: process.env.NEXT_PUBLIC_EVENT_REGISTRY || '0xc3a995a9756146b59Ec874bde2A326944E6F7B8E',
  profileNFT: process.env.NEXT_PUBLIC_PROFILE_NFT || '0xAcb9b3e8dadA2d25Db5420634Fb0eD96161824A5',
  achievementNFT: process.env.NEXT_PUBLIC_ACHIEVEMENT_NFT || '0xb2935413BAB7ABc75BBf1A91082b0F32cbB6E74F',
  cosmeticNFT: process.env.NEXT_PUBLIC_COSMETIC_NFT || '0x94777E23b8E545eC57BD84DB58e0A800E9Db5aAD',
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE || '0x786b9b1475fFB5FA79af27054C614B53Efb053de',
} as const;

// Backend Signer Address (for verification)
export const BACKEND_SIGNER_ADDRESS = '0x0246fe9B176E0225f9F5d7A2372DAc6865B55c18' as const;

// XP system
export const XP_PER_VERIFIED_RUN = 100;
export const XP_PER_LEVEL = 100;

// Tier thresholds (level -> tier)
export const TIER_THRESHOLDS = [
  { minLevel: 1, tier: 1 as const, name: 'Bronze' },
  { minLevel: 3, tier: 2 as const, name: 'Silver' },
  { minLevel: 5, tier: 3 as const, name: 'Gold' },
  { minLevel: 7, tier: 4 as const, name: 'Platinum' },
  { minLevel: 9, tier: 5 as const, name: 'Diamond' },
];

// Rarity colors — vivid, contrasting
export const RARITY_COLORS: Record<string, string> = {
  COMMON: '#8893A2',
  RARE: '#0072F4',
  EPIC: '#8B5CF6',
  LEGENDARY: '#F59E0B',
  MYTHIC: '#EF4444',
};

// Category icons (Lucide icon names)
export const CATEGORY_LABELS: Record<string, string> = {
  SHOES: 'Shoes',
  OUTFIT: 'Outfit',
  ACCESSORY: 'Accessory',
  FRAME: 'Frame',
};

// Map config
export const DEFAULT_MAP_CENTER = { lat: -6.2088, lng: 106.8456 }; // Jakarta
export const DEFAULT_MAP_ZOOM = 15;

// Privy
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
