"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RARITY_COLORS, CATEGORY_LABELS } from "@/lib/constants";
import type { MarketListing, CosmeticItem } from "@/lib/types";
import { getListings } from "@/lib/api";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { RarityBadge, TierBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { ShoppingBag, Package, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBalance } from "@/hooks/useBalance";
import { useToast } from "@/components/ui/Toast";

type MarketTab = "listings" | "collection";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>("listings");
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);

  const { walletAddress } = useAuth();
  const { balance, isLoading } = useBalance(walletAddress);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const data = await getListings();
        setListings(data || []);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Collection: currently empty until contract reads are implemented
  const collection: CosmeticItem[] = [];

  return (
    <div className="page-enter">
      <Header title="Market" subtitle="Trade cosmetic NFTs" />

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

      {/* Banner — soft, premium feel */}
      <div className="mx-5 mb-4 bg-gradient-to-r from-primary/80 to-primary-light/70 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Sparkles size={22} className="text-white/90" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/95">Cosmetic NFTs</p>
          <p className="text-xs text-white/60">Customize your runner avatar</p>
        </div>
      </div>

      {/* Tabs — iOS segmented control style */}
      <div className="px-5 flex gap-1 bg-surface-tertiary rounded-xl p-1 mx-5 mb-4">
        {(["listings", "collection"] as MarketTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-text-tertiary">
                  Loading marketplace...
                </p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={36} />}
              title="No listings yet"
              description="Be the first to list an item"
            />
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.listingId}
                  listing={listing}
                  onPress={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          )
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

      {/* Listing Detail Modal */}
      <Modal
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Listing Details"
      >
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}
      </Modal>

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
          />
        )}
      </Modal>
    </div>
  );
}

function ListingCard({
  listing,
  onPress,
}: {
  listing: MarketListing;
  onPress: () => void;
}) {
  return (
    <Card hoverable onClick={onPress}>
      <div className="flex items-center gap-3">
        <div
          className="w-13 h-13 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${RARITY_COLORS[listing.item.rarity]}10` }}
        >
          <Package
            size={22}
            style={{ color: RARITY_COLORS[listing.item.rarity], opacity: 0.7 }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-text-primary truncate">
              {listing.item.name}
            </p>
            <RarityBadge rarity={listing.item.rarity} />
          </div>
          <p className="text-xs text-text-tertiary">
            {CATEGORY_LABELS[listing.item.category]}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-text-primary">
            {listing.pricePerUnit}
          </p>
          <p className="text-[10px] text-text-tertiary">ETH</p>
        </div>
      </div>
    </Card>
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

function ListingDetail({
  listing,
  onClose,
}: {
  listing: MarketListing;
  onClose: () => void;
}) {
  const { info } = useToast();
  const handleBuy = () => {
    info("Purchase feature coming soon!");
    onClose();
  };

  return (
    <div className="space-y-5">
      <div
        className="w-full aspect-square max-h-48 rounded-2xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: `${RARITY_COLORS[listing.item.rarity]}08` }}
      >
        <Package
          size={56}
          style={{ color: RARITY_COLORS[listing.item.rarity], opacity: 0.5 }}
        />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary">
          {listing.item.name}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <RarityBadge rarity={listing.item.rarity} />
          <Badge>{CATEGORY_LABELS[listing.item.category]}</Badge>
        </div>
      </div>

      <div className="bg-surface-tertiary/60 rounded-2xl p-5 text-center">
        <p className="text-xs text-text-tertiary">Price</p>
        <p className="text-2xl font-semibold text-text-primary mt-0.5">
          {listing.pricePerUnit} ETH
        </p>
        <p className="text-xs text-text-tertiary mt-1.5">
          Seller: {listing.seller}
        </p>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-text-tertiary">Min Tier Required</span>
        <TierBadge tier={listing.item.minTierRequired} />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full rounded-2xl"
        onClick={handleBuy}
      >
        Buy for {listing.pricePerUnit} ETH
      </Button>
    </div>
  );
}

function ItemDetail({
  item,
  onClose,
}: {
  item: CosmeticItem;
  onClose: () => void;
}) {
  const { info } = useToast();
  const handleSell = () => {
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
          {CATEGORY_LABELS[item.category]} · Supply: {item.currentSupply}/
          {item.maxSupply}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1 rounded-2xl">
          Equip
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 rounded-2xl"
          onClick={handleSell}
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
