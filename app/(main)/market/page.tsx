"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RARITY_COLORS, CATEGORY_LABELS } from "@/lib/constants";
import type { CosmeticItem } from "@/lib/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { RarityBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { ShoppingBag, Package, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useToast } from "@/components/ui/Toast";
import { getProfile } from "@/lib/api";

type MarketTab = "listings" | "collection";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>("listings");
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  const { walletAddress } = useAuth();
  const { balance, isLoading } = useBalance(walletAddress);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Check if user has a profile NFT
  useEffect(() => {
    if (!walletAddress) return;
    getProfile(walletAddress)
      .then((p) => setHasProfile(!!p?.profileTokenId))
      .catch(() => setHasProfile(false));
  }, [walletAddress]);

  // SC integration pending — Marketplace + CosmeticNFT contract reads
  const collection: CosmeticItem[] = [];

  return (
    <div className="page-enter">
      <Header title="Market" subtitle="Customize your runner" />

      {/* Wallet Balance */}
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
              Get Testnet ETH →
            </a>
          </div>
        </Card>
      </div>

      {/* Banner */}
      <div className="mx-5 mb-4 bg-gradient-to-r from-primary/80 to-primary-light/70 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={22} className="text-white/90" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/95">Cosmetic NFTs</p>
          <p className="text-xs text-white/60">Customize your runner avatar</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="px-5 pb-6">
        {activeTab === "listings" ? (
          <EmptyState
            icon={<ShoppingBag size={36} />}
            title="No listings yet"
            description="Marketplace reads from smart contract — coming soon"
          />
        ) : collection.length === 0 ? (
          <EmptyState
            icon={<Package size={36} />}
            title="No items yet"
            description="Earn or buy cosmetics to customize your profile"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collection.map((item) => (
              <CollectionCard
                key={item.itemId}
                item={item}
                onPress={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name}
      >
        {selectedItem && (
          <ItemDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            hasProfile={hasProfile}
          />
        )}
      </Modal>
    </div>
  );
}

function CollectionCard({
  item,
  onPress,
}: {
  item: CosmeticItem;
  onPress: () => void;
}) {
  return (
    <Card hoverable onClick={onPress} className="text-center">
      <div
        className="w-full aspect-square rounded-xl mb-2.5 flex items-center justify-center"
        style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}08` }}
      >
        <Package
          size={32}
          style={{ color: RARITY_COLORS[item.rarity], opacity: 0.6 }}
        />
      </div>
      <p className="text-xs font-medium text-text-primary truncate">
        {item.name}
      </p>
      <RarityBadge rarity={item.rarity} className="mt-1.5" />
    </Card>
  );
}

function ItemDetail({
  item,
  onClose,
  hasProfile,
}: {
  item: CosmeticItem;
  onClose: () => void;
  hasProfile: boolean | null;
}) {
  const { info, warning } = useToast();

  const handleEquip = () => {
    if (hasProfile === false) {
      warning("Set up your profile first to equip items. Go to Profile to get started.");
      onClose();
      return;
    }
    info("Equip feature coming soon!");
  };

  const handleSell = () => {
    if (hasProfile === false) {
      warning("Set up your profile first to sell items. Go to Profile to get started.");
      onClose();
      return;
    }
    info("Sell feature coming soon!");
    onClose();
  };

  return (
    <div className="space-y-5">
      <div
        className="w-full aspect-square max-h-48 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}08` }}
      >
        <Package
          size={56}
          style={{ color: RARITY_COLORS[item.rarity], opacity: 0.5 }}
        />
      </div>

      <div className="text-center">
        <RarityBadge rarity={item.rarity} />
        <p className="text-xs text-text-tertiary mt-2">
          {CATEGORY_LABELS[item.category]} · Max Supply: {item.maxSupply}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 rounded-2xl min-h-[48px]"
          onClick={handleEquip}
        >
          Equip
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 rounded-2xl min-h-[48px]"
          onClick={handleSell}
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
