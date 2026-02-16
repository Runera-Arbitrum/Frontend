import { keccak256, type Hex } from 'viem';
import { CHAIN_ID, CONTRACT_ADDRESSES } from '@/lib/constants';

/**
 * EIP-712 Domain for Runera ProfileNFT contract
 * Must match the domain used by backend signer
 */
const PROFILE_DOMAIN = {
  name: 'RuneraProfileDynamicNFT',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESSES.profileNFT,
} as const;

/**
 * EIP-712 Domain for Runera AchievementNFT contract
 */
const ACHIEVEMENT_DOMAIN = {
  name: 'RuneraAchievementDynamicNFT',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESSES.achievementNFT,
} as const;

/**
 * EIP-712 Types for Profile Update
 * Used when backend signs profile progress updates
 */
const PROFILE_UPDATE_TYPES = {
  ProfileUpdate: [
    { name: 'user', type: 'address' },
    { name: 'level', type: 'uint256' },
    { name: 'xp', type: 'uint256' },
    { name: 'totalDistance', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * EIP-712 Types for Achievement Claim
 * Used when backend signs achievement claim authorization
 */
const ACHIEVEMENT_CLAIM_TYPES = {
  AchievementClaim: [
    { name: 'user', type: 'address' },
    { name: 'eventId', type: 'bytes32' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Profile update data structure
 */
export interface ProfileUpdateData {
  user: string;
  level: number;
  xp: number;
  totalDistance: number;
  nonce: number;
}

/**
 * Achievement claim data structure
 */
export interface AchievementClaimData {
  user: string;
  eventId: string;
  tokenId: number;
  nonce: number;
}

/**
 * Get EIP-712 domain for profile updates
 */
export function getProfileDomain() {
  return PROFILE_DOMAIN;
}

/**
 * Get EIP-712 domain for achievement claims
 */
export function getAchievementDomain() {
  return ACHIEVEMENT_DOMAIN;
}

/**
 * Get EIP-712 types for profile updates
 */
export function getProfileUpdateTypes() {
  return PROFILE_UPDATE_TYPES;
}

/**
 * Get EIP-712 types for achievement claims
 */
export function getAchievementClaimTypes() {
  return ACHIEVEMENT_CLAIM_TYPES;
}
