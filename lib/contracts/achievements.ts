import { createPublicClient, http, type Address, type Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import AchievementNFTABI from './abis/RuneraAchievementNFT.json';

/**
 * Achievement data structure matching smart contract
 */
export interface AchievementData {
  eventId: Hex;
  tier: number;
  unlockedAt: bigint;
  metadataHash: Hex;
  exists: boolean;
}

/**
 * Get public client for reading from blockchain
 */
function getPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });
}

/**
 * Check if user has an achievement for a specific event
 */
export async function hasClaimedAchievement(
  address: Address,
  eventId: Hex
): Promise<boolean> {
  try {
    const client = getPublicClient();
    const has = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'hasAchievement',
      args: [address, eventId],
    }) as boolean;

    return has;
  } catch (error) {
    console.error('Failed to check achievement:', error);
    return false;
  }
}

/**
 * Get achievement data for a user + event
 */
export async function getAchievement(
  address: Address,
  eventId: Hex
): Promise<AchievementData | null> {
  try {
    const client = getPublicClient();
    const data = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'getAchievement',
      args: [address, eventId],
    }) as any;

    return {
      eventId: data.eventId,
      tier: Number(data.tier),
      unlockedAt: data.unlockedAt,
      metadataHash: data.metadataHash,
      exists: data.exists,
    };
  } catch (error) {
    console.error('Failed to get achievement:', error);
    return null;
  }
}

/**
 * Get all achievement event IDs for a user
 */
export async function getUserAchievements(address: Address): Promise<Hex[]> {
  try {
    const client = getPublicClient();
    const eventIds = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'getUserAchievements',
      args: [address],
    }) as Hex[];

    return eventIds;
  } catch (error) {
    console.error('Failed to get user achievements:', error);
    return [];
  }
}

/**
 * Get user's total achievement count
 */
export async function getUserAchievementCount(address: Address): Promise<number> {
  try {
    const client = getPublicClient();
    const count = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'getUserAchievementCount',
      args: [address],
    }) as bigint;

    return Number(count);
  } catch (error) {
    console.error('Failed to get achievement count:', error);
    return 0;
  }
}

/**
 * Get user's balance of a specific achievement NFT
 */
export async function getAchievementBalance(
  address: Address,
  tokenId: bigint
): Promise<bigint> {
  try {
    const client = getPublicClient();
    const balance = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'balanceOf',
      args: [address, tokenId],
    }) as bigint;

    return balance;
  } catch (error) {
    console.error('Failed to get achievement balance:', error);
    return 0n;
  }
}

/**
 * Get achievement NFT metadata URI
 */
export async function getAchievementURI(tokenId: bigint): Promise<string | null> {
  try {
    const client = getPublicClient();
    const uri = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'uri',
      args: [tokenId],
    }) as string;

    return uri;
  } catch (error) {
    console.error('Failed to get achievement URI:', error);
    return null;
  }
}

export { AchievementNFTABI };
