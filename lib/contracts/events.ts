import { createPublicClient, http, type Address, type Hex, keccak256, toBytes } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES, RPC_URL } from '@/lib/constants';
import type { EventReward } from '@/lib/types';
import EventRegistryABI from './abis/RuneraEventRegistry.json';
import AccessControlABI from './abis/RuneraAccessControl.json';

/**
 * Event config structure matching smart contract (EventConfig)
 */
export interface EventConfig {
  eventId: Hex;
  name: string;
  startTime: bigint;
  endTime: bigint;
  maxParticipants: number;
  currentParticipants: number;
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
 */
export async function getEvent(eventId: Hex): Promise<EventConfig | null> {
  try {
    const client = getPublicClient();
    const data = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getEvent',
      args: [eventId],
    }) as {
      eventId: Hex;
      name: string;
      startTime: bigint;
      endTime: bigint;
      maxParticipants: bigint;
      currentParticipants: bigint;
      active: boolean;
    };

    return {
      eventId: data.eventId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants: Number(data.maxParticipants),
      currentParticipants: Number(data.currentParticipants),
      active: data.active,
    };
  } catch (error) {
    console.error('Failed to get event data:', error);
    return null;
  }
}

/**
 * Get total event count
 */
export async function getEventCount(): Promise<number> {
  try {
    const client = getPublicClient();
    const count = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getEventCount',
    }) as bigint;

    return Number(count);
  } catch (error) {
    console.error('Failed to get event count:', error);
    return 0;
  }
}

/**
 * Get event ID by index
 */
export async function getEventIdByIndex(index: number): Promise<Hex | null> {
  try {
    const client = getPublicClient();
    const eventId = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getEventIdByIndex',
      args: [BigInt(index)],
    }) as Hex;

    return eventId;
  } catch (error) {
    console.error('Failed to get event ID by index:', error);
    return null;
  }
}

/**
 * Check if event exists on-chain
 */
export async function eventExists(eventId: Hex): Promise<boolean> {
  try {
    const client = getPublicClient();
    const exists = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'eventExists',
      args: [eventId],
    }) as boolean;

    return exists;
  } catch (error) {
    console.error('Failed to check event existence:', error);
    return false;
  }
}

/**
 * Check if event is active on-chain
 */
export async function isEventActiveOnChain(eventId: Hex): Promise<boolean> {
  try {
    const client = getPublicClient();
    const active = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'isEventActive',
      args: [eventId],
    }) as boolean;

    return active;
  } catch (error) {
    console.error('Failed to check event active status:', error);
    return false;
  }
}

/**
 * Get all events from blockchain
 */
export async function getAllEvents(): Promise<EventConfig[]> {
  try {
    const count = await getEventCount();
    const events: EventConfig[] = [];

    for (let i = 0; i < count; i++) {
      const eventId = await getEventIdByIndex(i);
      if (eventId) {
        const event = await getEvent(eventId);
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  } catch (error) {
    console.error('Failed to get all events:', error);
    return [];
  }
}

/**
 * Get event reward configuration from blockchain
 */
export async function getEventReward(eventId: Hex): Promise<EventReward | null> {
  try {
    const client = getPublicClient();

    const exists = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'eventExists',
      args: [eventId],
    }) as boolean;

    if (!exists) {
      return null;
    }

    const data = await client.readContract({
      address: CONTRACT_ADDRESSES.eventRegistry as Address,
      abi: EventRegistryABI,
      functionName: 'getEventReward',
      args: [eventId],
    }) as {
      achievementTier: number | bigint;
      cosmeticItemIds: bigint[];
      xpBonus: number | bigint;
      hasReward: boolean;
    };

    return {
      achievementTier: Number(data.achievementTier),
      cosmeticItemIds: (data.cosmeticItemIds || []).map((id: bigint) => Number(id)),
      xpBonus: Number(data.xpBonus),
      hasReward: data.hasReward,
    };
  } catch {
    return null;
  }
}

/**
 * Check if an address has Event Manager role on-chain
 */
export async function isEventManagerOnChain(address: Address): Promise<boolean> {
  try {
    const client = getPublicClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESSES.accessControl as Address,
      abi: AccessControlABI,
      functionName: 'isEventManager',
      args: [address],
    }) as boolean;
    return result;
  } catch (error) {
    console.error('Failed to check event manager role:', error);
    return false;
  }
}

/**
 * Convert event ID string to bytes32
 */
export function eventIdToBytes32(eventIdString: string): Hex {
  return keccak256(toBytes(eventIdString));
}

/**
 * Check if event is currently active (based on timestamps, client-side)
 */
export function isEventActive(event: EventConfig): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return (
    event.active &&
    now >= event.startTime &&
    now <= event.endTime
  );
}

export { EventRegistryABI };
