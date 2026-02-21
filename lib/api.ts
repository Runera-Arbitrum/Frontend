import { generateDeviceHash } from './utils/device';
import type {
  UserProfile,
  Run,
  RunSubmitPayload,
  TierLevel,
} from './types';
import { getProfileData, getProfileTokenId, getProfileTier } from './contracts/profile';

const API_PROXY_BASE = '/api/backend';

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string; customHeaders?: Record<string, string> },
): Promise<T> {
  const { token, customHeaders, ...fetchOptions } = options || {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
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

const TIER_NAME_MAP: Record<string, TierLevel> = {
  Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5,
};

function getAttr(attributes: Array<{ trait_type: string; value: any }>, name: string): any {
  return attributes?.find((a) => a.trait_type === name)?.value;
}

export async function getProfile(walletAddress: string): Promise<UserProfile | null> {
  try {
    const res = await apiFetch<any>(`/profile/${walletAddress}/metadata`);

    if (res.attributes && Array.isArray(res.attributes)) {
      const tierStr = getAttr(res.attributes, 'Tier') || 'Bronze';
      const distanceKm = Number(getAttr(res.attributes, 'Total Distance (km)')) || 0;

      return {
        id: walletAddress,
        walletAddress,
        exp: Number(getAttr(res.attributes, 'XP')) || 0,
        level: Number(getAttr(res.attributes, 'Level')) || 1,
        tier: (TIER_NAME_MAP[tierStr] || 1) as TierLevel,
        runCount: Number(getAttr(res.attributes, 'Runs')) || 0,
        verifiedRunCount: Number(getAttr(res.attributes, 'Runs')) || 0,
        totalDistanceMeters: Math.round(distanceKm * 1000),
        longestStreakDays: Number(getAttr(res.attributes, 'Longest Streak (days)')) || 0,
        profileTokenId: 1,
        onchainNonce: 0,
      };
    }

    return res.profile || res;
  } catch {
  }

  try {
    const address = walletAddress as `0x${string}`;
    const [profileData, tokenId, tier] = await Promise.all([
      getProfileData(address),
      getProfileTokenId(address),
      getProfileTier(address),
    ]);

    if (!profileData || !profileData.exists) return null;

    return {
      id: walletAddress,
      walletAddress,
      exp: Number(profileData.xp) || 0,
      level: profileData.level || 1,
      tier: (tier >= 1 && tier <= 5 ? tier : 1) as TierLevel,
      runCount: profileData.runCount || 0,
      verifiedRunCount: profileData.runCount || 0,
      totalDistanceMeters: Number(profileData.totalDistanceMeters) || 0,
      longestStreakDays: profileData.longestStreakDays || 0,
      profileTokenId: Number(tokenId) ?? null,
      onchainNonce: 0,
    };
  } catch {
    return null;
  }
}

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
  const deviceHash = generateDeviceHash();
  const enrichedPayload = {
    ...payload,
    deviceHash,
  };

  const res = await apiFetch<any>('/run/submit', {
    method: 'POST',
    body: JSON.stringify(enrichedPayload),
    token,
  });

  return {
    success: res.success ?? (res.status === 'VERIFIED'),
    runId: res.runId,
    status: res.status,
    xpEarned: res.xpEarned ?? res.onchainSync?.stats?.xp ?? 0,
    reasonCode: res.reasonCode,
    message: res.message,
  };
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
  const res = await apiFetch<any>(`/runs?walletAddress=${walletAddress}&limit=${limit}&offset=${offset}`);
  const runs = res.runs || res.data || (Array.isArray(res) ? res : []);
  return {
    success: res.success ?? true,
    runs: runs.map((r: any) => ({ ...r, id: r.id || r.runId })),
    total: res.total ?? runs.length,
    limit: res.limit ?? limit,
    offset: res.offset ?? offset,
  };
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
  const res = await apiFetch<any>(`/events${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);
  const events = res.events || res.data || (Array.isArray(res) ? res : []);
  return { success: res.success ?? true, events };
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

export async function createEvent(payload: {
  eventId: string;
  name: string;
  minTier: number;
  minTotalDistanceMeters: number;
  targetDistanceMeters: number;
  expReward: number;
  startTime: string;
  endTime: string;
  active: boolean;
  chainId: number;
  reward?: {
    achievementTier: number;
    cosmeticItemIds: number[];
    xpBonus: number;
    hasReward: boolean;
    badgeName?: string;
    badgeIcon?: string;
  };
}, token?: string): Promise<{
  success: boolean;
  event?: any;
  message?: string;
}> {
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  if (!adminSecret || adminSecret === 'your-admin-secret-here') {
    throw new Error('Admin secret not configured. Please set NEXT_PUBLIC_ADMIN_SECRET in .env.local');
  }

  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
    customHeaders: {
      'x-admin-secret': adminSecret,
    },
    token,
  });
}

export { apiFetch };
