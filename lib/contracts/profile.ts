import { createPublicClient, http, type PublicClient, type Address } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import ProfileNFTABI from './abis/RuneraProfileNFT.json';

/**
 * Profile data structure matching smart contract (ProfileData)
 */
export interface ProfileData {
  xp: bigint;
  level: number;
  runCount: number;
  achievementCount: number;
  totalDistanceMeters: bigint;
  longestStreakDays: number;
  lastUpdated: bigint;
  exists: boolean;
}

/**
 * Get public client for reading from blockchain
 */
export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });
}

/**
 * Check if user has registered a Profile
 */
export async function hasProfileNFT(address: Address): Promise<boolean> {
  try {
    const client = getPublicClient();
    const has = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'hasProfile',
      args: [address],
    }) as boolean;

    return has;
  } catch (error) {
    console.error('Failed to check profile:', error);
    return false;
  }
}

/**
 * Get user's profile data from blockchain
 */
export async function getProfileData(address: Address): Promise<ProfileData | null> {
  try {
    const client = getPublicClient();
    const data = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'getProfile',
      args: [address],
    }) as any;

    return {
      xp: data.xp,
      level: Number(data.level),
      runCount: Number(data.runCount),
      achievementCount: Number(data.achievementCount),
      totalDistanceMeters: data.totalDistanceMeters,
      longestStreakDays: Number(data.longestStreakDays),
      lastUpdated: data.lastUpdated,
      exists: data.exists,
    };
  } catch (error) {
    console.error('Failed to get profile data:', error);
    return null;
  }
}

/**
 * Get user's profile tier from blockchain
 */
export async function getProfileTier(address: Address): Promise<number> {
  try {
    const client = getPublicClient();
    const tier = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'getProfileTier',
      args: [address],
    }) as number;

    return Number(tier);
  } catch (error) {
    console.error('Failed to get profile tier:', error);
    return 0;
  }
}

/**
 * Get user's profile token ID
 */
export async function getProfileTokenId(address: Address): Promise<bigint> {
  try {
    const client = getPublicClient();
    const tokenId = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'getTokenId',
      args: [address],
    }) as bigint;

    return tokenId;
  } catch (error) {
    console.error('Failed to get profile token ID:', error);
    return 0n;
  }
}

/**
 * Get Profile NFT token URI (metadata)
 */
export async function getProfileTokenURI(tokenId: bigint): Promise<string | null> {
  try {
    const client = getPublicClient();
    const uri = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'uri',
      args: [tokenId],
    }) as string;

    return uri;
  } catch (error) {
    console.error('Failed to get token URI:', error);
    return null;
  }
}

/**
 * Calculate tier from level (client-side)
 */
export function calculateTierFromLevel(level: number): number {
  if (level >= 9) return 5; // Diamond
  if (level >= 7) return 4; // Platinum
  if (level >= 5) return 3; // Gold
  if (level >= 3) return 2; // Silver
  return 1; // Bronze
}

/**
 * Calculate XP needed for next level
 */
export function xpNeededForNextLevel(): number {
  return 100;
}

/**
 * Calculate progress percentage to next level
 */
export function calculateLevelProgress(currentXP: number): number {
  const xpInCurrentLevel = currentXP % 100;
  return (xpInCurrentLevel / 100) * 100;
}

export { ProfileNFTABI };
