'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { GeoPosition } from '@/lib/types';

interface UseGeolocationReturn {
  position: GeoPosition | null;
  path: GeoPosition[];
  error: string | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  resetPath: () => void;
  totalDistanceMeters: number;
}

/** Calculate distance between two GPS coordinates using Haversine formula */
function haversineDistance(a: GeoPosition, b: GeoPosition): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [path, setPath] = useState<GeoPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const totalDistanceMeters = useMemo(() => {
    return path.reduce((total, point, i) => {
      if (i === 0) return 0;
      return total + haversineDistance(path[i - 1], point);
    }, 0);
  }, [path]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);
    setIsTracking(true);
    setPath([]);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: GeoPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        setPosition(newPos);
        setPath((prev) => [...prev, newPos]);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  const resetPath = useCallback(() => {
    setPath([]);
    setPosition(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    position,
    path,
    error,
    isTracking,
    startTracking,
    stopTracking,
    resetPath,
    totalDistanceMeters,
  };
}
