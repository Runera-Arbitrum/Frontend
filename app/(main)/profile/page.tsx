'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_USER, MOCK_ACHIEVEMENTS, MOCK_COSMETICS } from '@/lib/mock-data';
import { truncateAddress, formatDistance } from '@/lib/utils';
import { TIER_NAMES, type TierLevel } from '@/lib/types';
import { XP_PER_LEVEL, RARITY_COLORS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { TierBadge, RarityBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  User, LogOut, Copy, Check,
  Footprints, Flame, Trophy, Award,
  Settings, Droplets, Package, Shield,
} from 'lucide-react';

type ProfileTab = 'stats' | 'achievements' | 'equipped';

export default function ProfilePage() {
  const { walletAddress, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [copied, setCopied] = useState(false);

  const user = MOCK_USER;
  const achievements = MOCK_ACHIEVEMENTS;
  const equipped = MOCK_COSMETICS.slice(0, 2);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFaucet = () => {
    alert('Faucet requested! (mock)');
  };

  return (
    <div className="page-enter">
      {/* Profile Header — gentle gradient instead of solid blue */}
      <div className="bg-gentle-gradient px-5 pt-12 pb-6">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-3 ring-2 ring-primary/10">
            <User size={32} className="text-primary/60" />
          </div>
          <TierBadge tier={user.tier} className="mb-2" />
          <p className="text-lg font-semibold text-text-primary">Level {user.level}</p>

          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 mt-2 bg-surface-tertiary/80 px-3 py-1.5 rounded-full"
          >
            <span className="text-xs text-text-tertiary font-mono">
              {walletAddress ? truncateAddress(walletAddress) : '---'}
            </span>
            {copied ? (
              <Check size={12} className="text-success" />
            ) : (
              <Copy size={12} className="text-text-tertiary" />
            )}
          </button>
        </div>

        {/* XP Bar */}
        <div className="mt-5 bg-surface border border-border-light/50 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-tertiary">XP Progress</span>
            <span className="text-xs text-text-tertiary">{user.exp % XP_PER_LEVEL}/{XP_PER_LEVEL}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary-50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
              style={{ width: `${(user.exp % XP_PER_LEVEL)}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            Next: {TIER_NAMES[Math.min(user.tier + 1, 5) as TierLevel]}
          </p>
        </div>
      </div>

      {/* Quick Actions — soft cards */}
      <div className="px-5 mt-5 flex gap-2.5">
        <Card hoverable className="flex-1 text-center py-3.5" onClick={handleFaucet}>
          <Droplets size={17} className="text-info/70 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-text-secondary">Faucet</p>
        </Card>
        <Card hoverable className="flex-1 text-center py-3.5">
          <Shield size={17} className="text-primary/60 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-text-secondary">Mint Profile</p>
        </Card>
        <Card hoverable className="flex-1 text-center py-3.5">
          <Settings size={17} className="text-text-tertiary/70 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-text-secondary">Settings</p>
        </Card>
      </div>

      {/* Tab Navigation — iOS segmented control */}
      <div className="mt-5 flex gap-1 bg-surface-tertiary rounded-xl p-1 mx-5">
        {(['stats', 'achievements', 'equipped'] as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-surface text-text-primary shadow-card'
                : 'text-text-tertiary',
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-4 pb-6">
        {activeTab === 'stats' && (
          <div className="space-y-2.5">
            {[
              { icon: <Footprints size={17} />, label: 'Total Distance', value: formatDistance(user.totalDistanceMeters) },
              { icon: <Trophy size={17} />, label: 'Verified Runs', value: String(user.verifiedRunCount) },
              { icon: <Flame size={17} />, label: 'Longest Streak', value: `${user.longestStreakDays} days` },
              { icon: <Award size={17} />, label: 'Total XP', value: `${user.exp} XP` },
            ].map((stat) => (
              <Card key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50/50 flex items-center justify-center text-primary/60">
                  {stat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">{stat.label}</p>
                  <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          achievements.length === 0 ? (
            <EmptyState
              icon={<Award size={36} />}
              title="No achievements yet"
              description="Complete events to earn achievement NFTs"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <Card key={ach.id} className="text-center py-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50/50 flex items-center justify-center mx-auto mb-2.5">
                    <Award size={24} className="text-primary/60" />
                  </div>
                  <p className="text-xs font-medium text-text-primary truncate px-2">{ach.eventName}</p>
                  <Badge variant="blue" className="mt-1.5">Tier {ach.tier}</Badge>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'equipped' && (
          equipped.length === 0 ? (
            <EmptyState
              icon={<Package size={36} />}
              title="Nothing equipped"
              description="Visit the market to get cosmetic items"
            />
          ) : (
            <div className="space-y-2.5">
              {equipped.map((item) => (
                <Card key={item.itemId} className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}10` }}
                  >
                    <Package size={18} style={{ color: RARITY_COLORS[item.rarity], opacity: 0.6 }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RarityBadge rarity={item.rarity} />
                      <span className="text-xs text-text-tertiary">{item.category}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Logout — subtle */}
      <div className="px-5 pb-8">
        <Button
          variant="ghost"
          size="md"
          className="w-full text-error/70"
          icon={<LogOut size={15} />}
          onClick={logout}
        >
          Disconnect Wallet
        </Button>
      </div>
    </div>
  );
}
