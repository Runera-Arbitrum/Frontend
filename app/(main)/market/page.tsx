'use client';

import { useState } from 'react';
import { MOCK_LISTINGS, MOCK_COSMETICS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { RARITY_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import type { MarketListing, CosmeticItem } from '@/lib/types';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { RarityBadge, TierBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingBag, Package, Sparkles } from 'lucide-react';

type MarketTab = 'listings' | 'collection';

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>('listings');
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  const listings = MOCK_LISTINGS;
  const collection = MOCK_COSMETICS.slice(0, 2);

  return (
    <div className="page-enter">
      <Header title="Market" subtitle="Trade cosmetic NFTs" />

      {/* Banner */}
      <div className="mx-4 mt-2 mb-4 bg-gradient-to-r from-primary to-primary-light rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Sparkles size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Cosmetic NFTs</p>
          <p className="text-xs text-primary-200">Customize your runner avatar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-3">
        {(['listings', 'collection'] as MarketTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-primary text-text-inverse'
                : 'bg-surface-tertiary text-text-secondary',
            )}
          >
            {tab === 'listings' ? 'Marketplace' : 'My Collection'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {activeTab === 'listings' ? (
          listings.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={40} />}
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
            icon={<Package size={40} />}
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
          <ListingDetail listing={selectedListing} onClose={() => setSelectedListing(null)} />
        )}
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name}
      >
        {selectedItem && (
          <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </Modal>
    </div>
  );
}

function ListingCard({ listing, onPress }: { listing: MarketListing; onPress: () => void }) {
  return (
    <Card hoverable onClick={onPress}>
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${RARITY_COLORS[listing.item.rarity]}15` }}
        >
          <Package size={24} style={{ color: RARITY_COLORS[listing.item.rarity] }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-text-primary truncate">{listing.item.name}</p>
            <RarityBadge rarity={listing.item.rarity} />
          </div>
          <p className="text-xs text-text-tertiary">
            {CATEGORY_LABELS[listing.item.category]} · by {listing.seller}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-text-primary">{listing.pricePerUnit}</p>
          <p className="text-[10px] text-text-tertiary">ETH</p>
        </div>
      </div>
    </Card>
  );
}

function CollectionCard({ item, onPress }: { item: CosmeticItem; onPress: () => void }) {
  return (
    <Card hoverable onClick={onPress} className="text-center">
      <div
        className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center"
        style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}15` }}
      >
        <Package size={36} style={{ color: RARITY_COLORS[item.rarity] }} />
      </div>
      <p className="text-xs font-semibold text-text-primary truncate">{item.name}</p>
      <RarityBadge rarity={item.rarity} className="mt-1" />
    </Card>
  );
}

function ListingDetail({ listing, onClose }: { listing: MarketListing; onClose: () => void }) {
  const handleBuy = () => {
    // TODO: Call buyListing() via Privy sendTransaction
    alert('Purchase successful! (mock)');
    onClose();
  };

  return (
    <div className="space-y-4">
      <div
        className="w-full aspect-square max-h-48 rounded-2xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: `${RARITY_COLORS[listing.item.rarity]}15` }}
      >
        <Package size={64} style={{ color: RARITY_COLORS[listing.item.rarity] }} />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold text-text-primary">{listing.item.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <RarityBadge rarity={listing.item.rarity} />
          <Badge>{CATEGORY_LABELS[listing.item.category]}</Badge>
        </div>
      </div>

      <div className="bg-surface-tertiary rounded-xl p-4 text-center">
        <p className="text-xs text-text-tertiary">Price</p>
        <p className="text-2xl font-bold text-text-primary">{listing.pricePerUnit} ETH</p>
        <p className="text-xs text-text-tertiary mt-1">Seller: {listing.seller}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Min Tier Required</span>
        <TierBadge tier={listing.item.minTierRequired} />
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={handleBuy}>
        Buy for {listing.pricePerUnit} ETH
      </Button>
    </div>
  );
}

function ItemDetail({ item, onClose }: { item: CosmeticItem; onClose: () => void }) {
  const handleSell = () => {
    // TODO: Call createListing() via Privy sendTransaction
    alert('Listed for sale! (mock)');
    onClose();
  };

  return (
    <div className="space-y-4">
      <div
        className="w-full aspect-square max-h-48 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}15` }}
      >
        <Package size={64} style={{ color: RARITY_COLORS[item.rarity] }} />
      </div>

      <div className="text-center">
        <RarityBadge rarity={item.rarity} />
        <p className="text-xs text-text-tertiary mt-2">
          {CATEGORY_LABELS[item.category]} · Supply: {item.currentSupply}/{item.maxSupply}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1">
          Equip
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={handleSell}>
          Sell
        </Button>
      </div>
    </div>
  );
}
