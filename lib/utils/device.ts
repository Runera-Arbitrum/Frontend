import { keccak256, toBytes } from 'viem';

/**
 * Device fingerprint components
 */
interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  touchSupport: boolean;
  vendor: string;
  hardwareConcurrency: number;
}

/**
 * Collect device fingerprint data
 * Used for anti-cheat: detect if multiple accounts from same device
 */
function collectDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    // Server-side: return dummy data
    return {
      userAgent: 'server',
      language: 'en',
      platform: 'server',
      screenResolution: '0x0',
      timezone: 'UTC',
      touchSupport: false,
      vendor: 'server',
      hardwareConcurrency: 0,
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    vendor: navigator.vendor,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
  };
}

/**
 * Generate device hash from fingerprint
 * Returns a deterministic hash that identifies the device
 *
 * @returns Device hash (keccak256 of fingerprint)
 */
export function generateDeviceHash(): string {
  const fingerprint = collectDeviceFingerprint();

  // Create deterministic string from fingerprint
  const fingerprintString = [
    fingerprint.userAgent,
    fingerprint.language,
    fingerprint.platform,
    fingerprint.screenResolution,
    fingerprint.timezone,
    fingerprint.touchSupport ? '1' : '0',
    fingerprint.vendor,
    fingerprint.hardwareConcurrency.toString(),
  ].join('|');

  // Hash the fingerprint using keccak256
  const hash = keccak256(toBytes(fingerprintString));

  return hash;
}

/**
 * Get device info (for debugging/support)
 * Returns human-readable device information
 */
export function getDeviceInfo(): DeviceFingerprint {
  return collectDeviceFingerprint();
}

/**
 * Check if device supports geolocation
 */
export function supportsGeolocation(): boolean {
  if (typeof window === 'undefined') return false;
  return 'geolocation' in navigator;
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];

  return mobileKeywords.some((keyword) => userAgent.includes(keyword));
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * Get device performance tier (for adaptive features)
 * Returns: 'low' | 'medium' | 'high'
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4; // GB, if available

  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
}
