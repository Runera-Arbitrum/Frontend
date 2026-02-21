"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CosmeticRarity } from "@/lib/types";

export interface MarketBanner {
  id: number;
  name: string;
  description: string;
  priceEth: number;
  rarity: CosmeticRarity;
  gradientFrom: string;
  gradientTo: string;
}

interface BannerInventoryState {
  ownedBannerIds: number[];
  equippedBannerId: number | null;
}

const STORAGE_KEY = "runera_market_banner_inventory_v1";

const DEFAULT_STATE: BannerInventoryState = {
  ownedBannerIds: [],
  equippedBannerId: null,
};

const DUMMY_BANNER_LISTINGS: MarketBanner[] = [
  {
    id: 1001,
    name: "Sky Pulse",
    description: "Calm blue energy for daily runs",
    priceEth: 0.002,
    rarity: "COMMON",
    gradientFrom: "#0072F4",
    gradientTo: "#6EC1FF",
  },
  {
    id: 1002,
    name: "Sunset Sprint",
    description: "Warm dusk tones for finish-line vibes",
    priceEth: 0.0035,
    rarity: "RARE",
    gradientFrom: "#F97316",
    gradientTo: "#FACC15",
  },
  {
    id: 1003,
    name: "Volt Horizon",
    description: "Electric contrast for high-intensity sessions",
    priceEth: 0.005,
    rarity: "EPIC",
    gradientFrom: "#8B5CF6",
    gradientTo: "#22D3EE",
  },
  {
    id: 1004,
    name: "Aurora Charge",
    description: "Neon flow inspired by night races",
    priceEth: 0.0075,
    rarity: "LEGENDARY",
    gradientFrom: "#10B981",
    gradientTo: "#6366F1",
  },
  {
    id: 1005,
    name: "Crimson Velocity",
    description: "Bold red streaks for peak performance",
    priceEth: 0.01,
    rarity: "MYTHIC",
    gradientFrom: "#EF4444",
    gradientTo: "#F59E0B",
  },
];

function parseState(raw: string | null): BannerInventoryState {
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<BannerInventoryState>;
    const ownedBannerIds = Array.isArray(parsed.ownedBannerIds)
      ? parsed.ownedBannerIds.filter(
          (id): id is number =>
            typeof id === "number" &&
            DUMMY_BANNER_LISTINGS.some((banner) => banner.id === id),
        )
      : [];

    const equippedBannerId =
      typeof parsed.equippedBannerId === "number" &&
      ownedBannerIds.includes(parsed.equippedBannerId)
        ? parsed.equippedBannerId
        : null;

    return {
      ownedBannerIds,
      equippedBannerId,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useMarketBanners() {
  const [state, setState] = useState<BannerInventoryState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  });
  const isReady = typeof window !== "undefined";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setState(parseState(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateState = useCallback(
    (updater: (prev: BannerInventoryState) => BannerInventoryState) => {
      setState((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const buyBanner = useCallback(
    (bannerId: number) => {
      const bannerExists = DUMMY_BANNER_LISTINGS.some((b) => b.id === bannerId);
      if (!bannerExists) return false;

      let purchased = false;
      updateState((prev) => {
        if (prev.ownedBannerIds.includes(bannerId)) {
          return prev;
        }
        purchased = true;
        return {
          ...prev,
          ownedBannerIds: [...prev.ownedBannerIds, bannerId],
        };
      });
      return purchased;
    },
    [updateState],
  );

  const equipBanner = useCallback(
    (bannerId: number) => {
      let equipped = false;
      updateState((prev) => {
        if (!prev.ownedBannerIds.includes(bannerId)) {
          return prev;
        }
        if (prev.equippedBannerId === bannerId) {
          return prev;
        }
        equipped = true;
        return {
          ...prev,
          equippedBannerId: bannerId,
        };
      });
      return equipped;
    },
    [updateState],
  );

  const unequipBanner = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      equippedBannerId: null,
    }));
  }, [updateState]);

  const ownedBanners = useMemo(
    () =>
      DUMMY_BANNER_LISTINGS.filter((banner) =>
        state.ownedBannerIds.includes(banner.id),
      ),
    [state.ownedBannerIds],
  );

  const equippedBanner = useMemo(
    () =>
      DUMMY_BANNER_LISTINGS.find((banner) => banner.id === state.equippedBannerId) ??
      null,
    [state.equippedBannerId],
  );

  return {
    isReady,
    listings: DUMMY_BANNER_LISTINGS,
    ownedBannerIds: state.ownedBannerIds,
    ownedBanners,
    equippedBannerId: state.equippedBannerId,
    equippedBanner,
    isOwned: (bannerId: number) => state.ownedBannerIds.includes(bannerId),
    buyBanner,
    equipBanner,
    unequipBanner,
  };
}
