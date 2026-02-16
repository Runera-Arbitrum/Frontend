import { createPublicClient, http, type Address, type Hex, keccak256, toBytes } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import EventRegistryABI from './abis/RuneraEventRegistry.json';

/**
 * Event data structure matching smart contract
 */
export interface EventData {
  name: string;
  description: string;
  targetDistanceMeters: bigint;
  minTier: number;
  startTimestamp: bigint;
  endTimestamp: bigint;
  achievementTokenId: bigint;
  active: boolean;
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
 * Get event data from blockchain
 * @param eventId - Event ID (bytes32)
 * @returns Event data or null
 */
export async function getEvent(eventId: Hex): Promise<EventData | null> {
  try {
    const client = getPublicClient();
    const eventData = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getEvent',
      args: [eventId],
    }) as any;

    return {
      name: eventData.name,
      description: eventData.description,
      targetDistanceMeters: eventData.targetDistanceMeters,
      minTier: eventData.minTier,
      startTimestamp: eventData.startTimestamp,
      endTimestamp: eventData.endTimestamp,
      achievementTokenId: eventData.achievementTokenId,
      active: eventData.active,
    };
  } catch (error) {
    console.error('Failed to get event data:', error);
    return null;
  }
}

/**
 * Get all active event IDs
 * @returns Array of active event IDs (bytes32[])
 */
export async function getAllActiveEvents(): Promise<Hex[]> {
  try {
    const client = getPublicClient();
    const eventIds = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getAllActiveEvents',
    }) as Hex[];

    return eventIds;
  } catch (error) {
    console.error('Failed to get active events:', error);
    return [];
  }
}

/**
 * Check if user has joined an event
 * @param address - User wallet address
 * @param eventId - Event ID (bytes32)
 * @returns true if user has joined
 */
export async function hasJoinedEvent(address: Address, eventId: Hex): Promise<boolean> {
  try {
    const client = getPublicClient();
    const joined = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'hasJoined',
      args: [address, eventId],
    }) as boolean;

    return joined;
  } catch (error) {
    console.error('Failed to check event join status:', error);
    return false;
  }
}

/**
 * Get user's progress for an event
 * @param address - User wallet address
 * @param eventId - Event ID (bytes32)
 * @returns Progress in meters
 */
export async function getUserEventProgress(
  address: Address,
  eventId: Hex
): Promise<bigint> {
  try {
    const client = getPublicClient();
    const progress = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getUserProgress',
      args: [address, eventId],
    }) as bigint;

    return progress;
  } catch (error) {
    console.error('Failed to get user event progress:', error);
    return 0n;
  }
}

/**
 * Check if user is eligible to claim achievement for event
 * @param address - User wallet address
 * @param eventId - Event ID (bytes32)
 * @returns true if eligible
 */
export async function isEligibleForAchievement(
  address: Address,
  eventId: Hex
): Promise<boolean> {
  try {
    const client = getPublicClient();
    const eligible = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'isEligible',
      args: [address, eventId],
    }) as boolean;

    return eligible;
  } catch (error) {
    console.error('Failed to check eligibility:', error);
    return false;
  }
}

/**
 * Convert event ID string to bytes32
 * @param eventIdString - Event ID as string (e.g., "genesis10k")
 * @returns bytes32 formatted event ID
 */
export function eventIdToBytes32(eventIdString: string): Hex {
  return keccak256(toBytes(eventIdString));
}

/**
 * Check if event is currently active (based on timestamps)
 * @param eventData - Event data from contract
 * @returns true if event is currently active
 */
export function isEventActive(eventData: EventData): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return (
    eventData.active &&
    now >= eventData.startTimestamp &&
    now <= eventData.endTimestamp
  );
}

/**
 * Calculate progress percentage for an event
 * @param userProgress - User's progress in meters
 * @param targetDistance - Target distance in meters
 * @returns Progress percentage (0-100)
 */
export function calculateEventProgress(
  userProgress: bigint,
  targetDistance: bigint
): number {
  if (targetDistance === 0n) return 0;
  const percentage = (Number(userProgress) / Number(targetDistance)) * 100;
  return Math.min(percentage, 100);
}
