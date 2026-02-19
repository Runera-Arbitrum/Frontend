// ============================================
// API Client
// Integrated with Runera Backend API
// ============================================

import { generateDeviceHash } from './utils/device';
import type {
  UserProfile,
  Run,
  RunSubmitPayload,
  TierLevel,
} from './types';
import { getProfileData, getProfileTokenId, getProfileTier } from './contracts/profile';

// Use Next.js rewrite proxy to bypass CORS
// Browser requests go to /api/backend/... → Next.js forwards to Railway backend
const API_PROXY_BASE = '/api/backend';

// --- Helpers ---

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_PROXY_BASE}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body.error?.message || body.message || body.error || `API error: ${res.status}`;
    throw new Error(errorMsg);
  }
  return res.json();
}

// --- Auth ---
// Optional: Most endpoints don't require auth for MVP

export async function requestAuthNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
  return apiFetch('/auth/nonce', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
}

export async function connectWallet(
  walletAddress: string,
  signature: string,
  nonce: string,
): Promise<{ token: string }> {
  return apiFetch('/auth/connect', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });
}

// --- Profile ---

export async function getProfile(walletAddress: string): Promise<UserProfile | null> {
  // Try backend first
  try {
    const res = await apiFetch<any>(`/profile/${walletAddress}/metadata`);
    return res.profile || res;
  } catch {
    // Backend failed (404 or error) — fall through to SC fallback
  }

  // Fallback: read directly from smart contract
  try {
    const address = walletAddress as `0x${string}`;
    const [profileData, tokenId, tier] = await Promise.all([
      getProfileData(address),
      getProfileTokenId(address),
      getProfileTier(address),
    ]);

    // If profile doesn't exist on-chain either, return null
    if (!profileData || !profileData.exists) return null;

    return {
      id: walletAddress,
      walletAddress,
      exp: Number(profileData.xp) || 0,
      level: profileData.level || 1,
      tier: (tier || 1) as TierLevel,
      runCount: profileData.runCount || 0,
      verifiedRunCount: profileData.runCount || 0,
      totalDistanceMeters: Number(profileData.totalDistanceMeters) || 0,
      longestStreakDays: profileData.longestStreakDays || 0,
      profileTokenId: Number(tokenId) ?? null,
      onchainNonce: 0,
    };
  } catch {
    // SC also failed (wallet not registered) — return null silently
    return null;
  }
}

// --- Runs ---

export async function submitRun(
  payload: RunSubmitPayload,
  token?: string
): Promise<{
  success: boolean;
  runId: string;
  status: 'VERIFIED' | 'REJECTED';
  xpEarned?: number;
  reasonCode?: string;
  message?: string;
}> {
  // Add device fingerprint to payload
  const deviceHash = generateDeviceHash();
  const enrichedPayload = {
    ...payload,
    deviceHash,
  };

  return apiFetch('/run/submit', {
    method: 'POST',
    body: JSON.stringify(enrichedPayload),
    token,
  });
}

export async function getRuns(
  walletAddress: string,
  limit = 20,
  offset = 0
): Promise<{
  success: boolean;
  runs: Run[];
  total: number;
  limit: number;
  offset: number;
}> {
  return apiFetch(`/runs?walletAddress=${walletAddress}&limit=${limit}&offset=${offset}`);
}

export async function syncProgress(
  walletAddress: string,
  token?: string
): Promise<{
  success: boolean;
  signature: string;
  data: {
    level: number;
    xp: number;
    totalDistance: number;
    nonce: number;
  };
}> {
  return apiFetch('/run/sync', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
    token,
  });
}

// --- Events ---

export async function getEvents(
  walletAddress?: string
): Promise<{
  success: boolean;
  events: Array<{
    eventId: string;
    name: string;
    targetDistanceMeters: number;
    expReward: number;
    startTime: string;
    endTime: string;
    active: boolean;
    userProgress?: {
      distanceCovered: number;
      isEligible: boolean;
      hasJoined: boolean;
      hasClaimed: boolean;
    };
  }>;
}> {
  return apiFetch(`/events${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);
}

export async function joinEvent(
  eventId: string,
  walletAddress: string,
  token?: string
): Promise<{ success: boolean; status: string }> {
  return apiFetch(`/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
    token,
  });
}

export async function claimAchievement(
  walletAddress: string,
  eventId: string,
  token?: string
): Promise<{
  success: boolean;
  signature: string;
  achievementData: {
    eventId: string;
    tokenId: number;
    nonce: number;
  };
}> {
  return apiFetch('/events/genesis/claim', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, eventId }),
    token,
  });
}

// --- Faucet ---

export async function requestFaucet(
  walletAddress: string
): Promise<{
  success: boolean;
  txHash?: string;
  amount?: string;
  amountWei?: string;
  error?: string;
}> {
  return apiFetch('/faucet/request', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
}

// Re-export for convenience
export { apiFetch };
