import { createPublicClient, createWalletClient, http, type WalletClient, type PublicClient, type Address, type Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import ProfileNFTABI from './abis/RuneraProfileNFT.json';

/**
 * Profile stats structure matching smart contract
 */
export interface ProfileStats {
  level: bigint;
  xp: bigint;
  totalDistance: bigint;
  tier: number;
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
 * Check if user has a Profile NFT
 * @param address - User wallet address
 * @returns true if user has minted Profile NFT
 */
export async function hasProfileNFT(address: Address): Promise<boolean> {
  try {
    const client = getPublicClient();
    const balance = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;

    return balance > 0n;
  } catch (error) {
    console.error('Failed to check profile NFT:', error);
    return false;
  }
}

/**
 * Get user's profile stats from blockchain
 * @param address - User wallet address
 * @returns Profile stats or null if no profile exists
 */
export async function getProfileStats(address: Address): Promise<ProfileStats | null> {
  try {
    const client = getPublicClient();
    const stats = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'getStats',
      args: [address],
    }) as any;

    return {
      level: stats.level,
      xp: stats.xp,
      totalDistance: stats.totalDistance,
      tier: stats.tier,
    };
  } catch (error) {
    console.error('Failed to get profile stats:', error);
    return null;
  }
}

/**
 * Get Profile NFT token URI (metadata)
 * @param tokenId - Token ID
 * @returns Token URI or null
 */
export async function getProfileTokenURI(tokenId: bigint): Promise<string | null> {
  try {
    const client = getPublicClient();
    const uri = await client.readContract({
      address: CONTRACT_ADDRESSES.profileNFT as Address,
      abi: ProfileNFTABI,
      functionName: 'tokenURI',
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
 * @param level - User level
 * @returns Tier (1-5)
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
 * @param currentLevel - Current level
 * @returns XP needed to reach next level
 */
export function xpNeededForNextLevel(currentLevel: number): number {
  // XP per level is 100 (from constants)
  return 100;
}

/**
 * Calculate progress percentage to next level
 * @param currentXP - Current XP
 * @param currentLevel - Current level
 * @returns Progress percentage (0-100)
 */
export function calculateLevelProgress(currentXP: number, currentLevel: number): number {
  const xpInCurrentLevel = currentXP % 100;
  return (xpInCurrentLevel / 100) * 100;
}
