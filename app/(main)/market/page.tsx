"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RARITY_COLORS } from "@/lib/constants";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { RarityBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { ShoppingBag, Package, Sparkles, Wallet, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useToast } from "@/components/ui/Toast";
import { getProfile } from "@/lib/api";
import { useMarketBanners, type MarketBanner } from "@/hooks/useMarketBanners";

type MarketTab = "listings" | "collection";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>("listings");

  const { walletAddress } = useAuth();
  const { balance, isLoading } = useBalance(walletAddress);
  const { success, info, warning } = useToast();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const {
    isReady,
    listings,
    ownedBanners,
    equippedBannerId,
    isOwned,
    buyBanner,
    equipBanner,
  } = useMarketBanners();

  useEffect(() => {
    if (!walletAddress) return;
    getProfile(walletAddress)
      .then((p) => setHasProfile(!!p?.profileTokenId))
      .catch(() => setHasProfile(false));
  }, [walletAddress]);

  const handleBuyBanner = (banner: MarketBanner) => {
    const purchased = buyBanner(banner.id);
    if (!purchased) {
      info("Banner already in your collection.");
      return;
    }
    success(`${banner.name} added to My Collection.`);
  };

  const handleEquipBanner = (banner: MarketBanner) => {
    if (hasProfile === false) {
      warning("Set up your profile first to use banners.");
      return;
    }

    const equipped = equipBanner(banner.id);
    if (!equipped) {
      info("This banner is already active.");
      return;
    }
    success(`${banner.name} is now your profile banner.`);
  };

  return (
    <div className="page-enter">
      <Header title="Market" subtitle="Buy and equip profile banners" />

      <div className="mx-5 mt-2 mb-3">
        <Card className="!bg-gradient-to-br from-primary/5 to-primary/10 !border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-tertiary">Wallet Balance</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                {isLoading ? (
                  <p className="text-lg font-semibold text-text-secondary">
                    Loading...
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-text-primary">
                      {balance}
                    </p>
                    <p className="text-xs text-text-tertiary font-medium">
                      ARB ETH
                    </p>
                  </>
                )}
              </div>
            </div>
            <a
              href="https://faucet.arbitrum.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-medium hover:underline"
            >
              Get Testnet ETH {"->"}
            </a>
          </div>
        </Card>
      </div>

      <div className="mx-5 mb-4 bg-gradient-to-r from-primary/80 to-primary-light/70 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={22} className="text-white/90" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/95">Banner Cards</p>
          <p className="text-xs text-white/70">
            Buy in Marketplace, then use in Profile
          </p>
        </div>
      </div>

      <div className="px-5 flex gap-1 bg-surface-tertiary rounded-xl p-1 mx-5 mb-4">
        {(["listings", "collection"] as MarketTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab
                ? "bg-surface text-text-primary shadow-card"
                : "text-text-tertiary",
            )}
          >
            {tab === "listings" ? "Marketplace" : "My Collection"}
          </button>
        ))}
      </div>

      <div className="px-5 pb-6">
        {!isReady ? (
          <EmptyState
            icon={<ShoppingBag size={36} />}
            title="Loading market..."
            description="Preparing your banner inventory"
          />
        ) : activeTab === "listings" ? (
          <div className="space-y-3">
            {listings.map((banner) => (
              <MarketBannerCard
                key={banner.id}
                banner={banner}
                owned={isOwned(banner.id)}
                equipped={equippedBannerId === banner.id}
                onBuy={() => handleBuyBanner(banner)}
                onEquip={() => handleEquipBanner(banner)}
              />
            ))}
          </div>
        ) : ownedBanners.length === 0 ? (
          <EmptyState
            icon={<Package size={36} />}
            title="No banners yet"
            description="Buy banner cards in Marketplace to unlock profile styles"
          />
        ) : (
          <div className="space-y-3">
            {ownedBanners.map((banner) => (
              <CollectionBannerCard
                key={banner.id}
                banner={banner}
                equipped={equippedBannerId === banner.id}
                onEquip={() => handleEquipBanner(banner)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerPreview({
  banner,
  className,
}: {
  banner: MarketBanner;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-24 rounded-xl border border-white/20 shadow-inner flex items-end p-3",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${banner.gradientFrom}, ${banner.gradientTo})`,
      }}
    >
      <p className="text-white text-xs font-semibold tracking-wide">{banner.name}</p>
    </div>
  );
}

function MarketBannerCard({
  banner,
  owned,
  equipped,
  onBuy,
  onEquip,
}: {
  banner: MarketBanner;
  owned: boolean;
  equipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <BannerPreview banner={banner} />
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {banner.name}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {banner.description}
            </p>
          </div>
          <RarityBadge rarity={banner.rarity} />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p
            className="text-xs font-semibold"
            style={{ color: RARITY_COLORS[banner.rarity] }}
          >
            {banner.priceEth} ARB ETH
          </p>
          {owned ? (
            <Button
              variant={equipped ? "secondary" : "outline"}
              size="sm"
              className="min-w-[116px]"
              onClick={onEquip}
            >
              {equipped ? "Equipped" : "Use on Profile"}
            </Button>
          ) : (
            <Button size="sm" className="min-w-[116px]" onClick={onBuy}>
              Buy Banner
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CollectionBannerCard({
  banner,
  equipped,
  onEquip,
}: {
  banner: MarketBanner;
  equipped: boolean;
  onEquip: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <BannerPreview banner={banner} />
      <div className="pt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {banner.name}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Ready to use on your profile
          </p>
        </div>
        {equipped ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1.5 rounded-full">
            <CheckCircle2 size={14} />
            Equipped
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={onEquip}>
            Use on Profile
          </Button>
        )}
      </div>
    </Card>
  );
}
