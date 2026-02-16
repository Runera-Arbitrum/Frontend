import { createPublicClient, http, type Address, type Hex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import AchievementNFTABI from './abis/RuneraAchievementNFT.json';

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
 * Check if user has claimed an achievement for a specific event
 * @param address - User wallet address
 * @param eventId - Event ID (bytes32)
 * @returns true if already claimed
 */
export async function hasClaimedAchievement(
  address: Address,
  eventId: Hex
): Promise<boolean> {
  try {
    const client = getPublicClient();
    const claimed = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'hasClaimed',
      args: [address, eventId],
    }) as boolean;

    return claimed;
  } catch (error) {
    console.error('Failed to check achievement claim:', error);
    return false;
  }
}

/**
 * Get user's balance of a specific achievement NFT
 * @param address - User wallet address
 * @param tokenId - Achievement token ID
 * @returns Balance (should be 0 or 1 for achievements)
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
 * Get multiple achievement balances at once
 * @param address - User wallet address
 * @param tokenIds - Array of achievement token IDs
 * @returns Array of balances
 */
export async function getAchievementBalances(
  address: Address,
  tokenIds: bigint[]
): Promise<bigint[]> {
  try {
    const client = getPublicClient();
    const addresses = new Array(tokenIds.length).fill(address);
    const balances = await client.readContract({
      address: CONTRACT_ADDRESSES.achievementNFT as Address,
      abi: AchievementNFTABI,
      functionName: 'balanceOfBatch',
      args: [addresses, tokenIds],
    }) as bigint[];

    return balances;
  } catch (error) {
    console.error('Failed to get achievement balances:', error);
    return new Array(tokenIds.length).fill(0n);
  }
}

/**
 * Get achievement NFT metadata URI
 * @param tokenId - Achievement token ID
 * @returns Token URI or null
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
