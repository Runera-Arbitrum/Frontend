'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import type { GeoPosition } from '@/lib/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';

interface RunMapProps {
  position: GeoPosition | null;
  path: GeoPosition[];
  isTracking: boolean;
}

function MapFollower({ position }: { position: GeoPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
    }
  }, [map, position]);

  return null;
}

export default function RunMap({ position, path, isTracking }: RunMapProps) {
  const center = position
    ? { lat: position.lat, lng: position.lng }
    : DEFAULT_MAP_CENTER;

  const polylinePositions = path.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#2563EB',
            weight: 4,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {position && (
        <>
          <CircleMarker
            center={[position.lat, position.lng]}
            radius={16}
            pathOptions={{
              fillColor: '#2563EB',
              fillOpacity: 0.15,
              stroke: false,
            }}
          />
          <CircleMarker
            center={[position.lat, position.lng]}
            radius={6}
            pathOptions={{
              fillColor: '#2563EB',
              fillOpacity: 1,
              color: '#FFFFFF',
              weight: 3,
              opacity: 1,
            }}
          />
        </>
      )}

      {path.length > 0 && (
        <CircleMarker
          center={[path[0].lat, path[0].lng]}
          radius={5}
          pathOptions={{
            fillColor: '#22C55E',
            fillOpacity: 1,
            color: '#FFFFFF',
            weight: 2,
          }}
        />
      )}

      {isTracking && <MapFollower position={position} />}
    </MapContainer>
  );
}
