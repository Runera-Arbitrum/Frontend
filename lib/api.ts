// ============================================
// API Client
// Prepared for backend integration
// Currently returns mock data for development
// ============================================

import { API_BASE_URL } from './constants';
import type {
  UserProfile,
  Run,
  RunSubmitPayload,
  RunEvent,
  MarketListing,
  Achievement,
} from './types';
import {
  MOCK_USER,
  MOCK_RUNS,
  MOCK_EVENTS,
  MOCK_LISTINGS,
  MOCK_ACHIEVEMENTS,
} from './mock-data';

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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  return res.json();
}

// --- Auth ---
// TODO: Integrate with POST /auth/nonce and POST /auth/connect

export async function requestAuthNonce(_walletAddress: string): Promise<{ nonce: string; message: string }> {
  // TODO: return apiFetch('/auth/nonce', { method: 'POST', body: JSON.stringify({ walletAddress }) });
  return { nonce: 'mock-nonce', message: 'RUNERA login\nNonce: mock-nonce' };
}

export async function connectWallet(
  _walletAddress: string,
  _signature: string,
  _nonce: string,
): Promise<{ token: string }> {
  // TODO: return apiFetch('/auth/connect', { method: 'POST', body: JSON.stringify({ walletAddress, signature, nonce }) });
  return { token: 'mock-jwt-token' };
}

// --- Profile ---
// TODO: Integrate with GET /profile/:address/metadata and POST /profile/gasless-register

export async function getProfile(_walletAddress: string): Promise<UserProfile> {
  // TODO: return apiFetch(`/profile/${walletAddress}/metadata`);
  return MOCK_USER;
}

export async function registerProfile(_token: string): Promise<{ txHash: string }> {
  // TODO: return apiFetch('/profile/gasless-register', { method: 'POST', token });
  return { txHash: '0xmocktx' };
}

// --- Runs ---
// TODO: Integrate with POST /run/submit and GET /runs

export async function submitRun(_payload: RunSubmitPayload, _token?: string): Promise<Run> {
  // TODO: return apiFetch('/run/submit', { method: 'POST', body: JSON.stringify(payload), token });
  return MOCK_RUNS[0];
}

export async function getRuns(_walletAddress: string, _limit = 20, _offset = 0): Promise<Run[]> {
  // TODO: return apiFetch(`/runs?walletAddress=${walletAddress}&limit=${limit}&offset=${offset}`);
  return MOCK_RUNS;
}

// --- Events ---
// TODO: Integrate with GET /events, POST /events/:id/join, GET /events/:id/status

export async function getEvents(_walletAddress?: string): Promise<RunEvent[]> {
  // TODO: return apiFetch(`/events${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);
  return MOCK_EVENTS;
}

export async function joinEvent(_eventId: string, _token?: string): Promise<{ status: string }> {
  // TODO: return apiFetch(`/events/${eventId}/join`, { method: 'POST', token });
  return { status: 'JOINED' };
}

// --- Market ---
// TODO: Integrate with smart contract calls via Privy wallet

export async function getListings(): Promise<MarketListing[]> {
  // TODO: Call RuneraMarketplace.getListingsByItem() via contract
  return MOCK_LISTINGS;
}

export async function buyListing(_listingId: number, _amount: number): Promise<{ txHash: string }> {
  // TODO: Call RuneraMarketplace.buyItem() via Privy sendTransaction
  return { txHash: '0xmocktx' };
}

export async function createListing(
  _itemId: number,
  _amount: number,
  _pricePerUnit: string,
): Promise<{ listingId: number }> {
  // TODO: Call RuneraMarketplace.createListing() via Privy sendTransaction
  return { listingId: 99 };
}

// --- Achievements ---
// TODO: Integrate with smart contract + backend

export async function getAchievements(_walletAddress: string): Promise<Achievement[]> {
  // TODO: Call RuneraAchievementDynamicNFT.getUserAchievements() + metadata
  return MOCK_ACHIEVEMENTS;
}

// --- Faucet ---
// TODO: Integrate with POST /faucet/request

export async function requestFaucet(_walletAddress: string): Promise<{ txHash: string }> {
  // TODO: return apiFetch('/faucet/request', { method: 'POST', body: JSON.stringify({ walletAddress }) });
  return { txHash: '0xmocktx' };
}

// Re-export for convenience
export { apiFetch };
