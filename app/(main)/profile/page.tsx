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
  Shield, Footprints, Flame, Trophy, Award,
  Settings, Droplets, Package,
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
    // TODO: Call requestFaucet() API
    alert('Faucet requested! (mock)');
  };

  return (
    <div className="page-enter">
      {/* Profile Header */}
      <div className="bg-primary px-5 pt-12 pb-6 rounded-b-3xl">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3 ring-4 ring-white/30">
            <User size={36} className="text-white" />
          </div>
          <TierBadge tier={user.tier} className="mb-2" />
          <p className="text-lg font-bold text-white">Level {user.level}</p>

          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 mt-2 bg-white/10 px-3 py-1.5 rounded-full"
          >
            <span className="text-xs text-primary-200 font-mono">
              {walletAddress ? truncateAddress(walletAddress) : '---'}
            </span>
            {copied ? (
              <Check size={12} className="text-green-300" />
            ) : (
              <Copy size={12} className="text-primary-200" />
            )}
          </button>
        </div>

        {/* XP Bar */}
        <div className="mt-4 bg-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-primary-200">XP Progress</span>
            <span className="text-xs text-primary-200">{user.exp % XP_PER_LEVEL}/{XP_PER_LEVEL}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${(user.exp % XP_PER_LEVEL)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4 flex gap-2">
        <Card hoverable className="flex-1 text-center py-3" onClick={handleFaucet}>
          <Droplets size={18} className="text-info mx-auto mb-1" />
          <p className="text-xs font-medium text-text-primary">Faucet</p>
        </Card>
        <Card hoverable className="flex-1 text-center py-3">
          <Shield size={18} className="text-primary mx-auto mb-1" />
          <p className="text-xs font-medium text-text-primary">Mint Profile</p>
        </Card>
        <Card hoverable className="flex-1 text-center py-3">
          <Settings size={18} className="text-text-secondary mx-auto mb-1" />
          <p className="text-xs font-medium text-text-primary">Settings</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="mt-5 flex gap-1 bg-surface-tertiary rounded-xl p-1 mx-4">
        {(['stats', 'achievements', 'equipped'] as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
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
      <div className="px-4 mt-4 pb-4">
        {activeTab === 'stats' && (
          <div className="space-y-2">
            {[
              { icon: <Footprints size={18} />, label: 'Total Distance', value: formatDistance(user.totalDistanceMeters) },
              { icon: <Trophy size={18} />, label: 'Verified Runs', value: String(user.verifiedRunCount) },
              { icon: <Flame size={18} />, label: 'Longest Streak', value: `${user.longestStreakDays} days` },
              { icon: <Award size={18} />, label: 'Total XP', value: `${user.exp} XP` },
            ].map((stat) => (
              <Card key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">{stat.label}</p>
                  <p className="text-sm font-bold text-text-primary">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          achievements.length === 0 ? (
            <EmptyState
              icon={<Award size={40} />}
              title="No achievements yet"
              description="Complete events to earn achievement NFTs"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <Card key={ach.id} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                    <Award size={28} className="text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary truncate">{ach.eventName}</p>
                  <Badge variant="blue" className="mt-1">Tier {ach.tier}</Badge>
                </Card>
              ))}
            </div>
          )
        )}

        {activeTab === 'equipped' && (
          equipped.length === 0 ? (
            <EmptyState
              icon={<Package size={40} />}
              title="Nothing equipped"
              description="Visit the market to get cosmetic items"
            />
          ) : (
            <div className="space-y-2">
              {equipped.map((item) => (
                <Card key={item.itemId} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${RARITY_COLORS[item.rarity]}15` }}
                  >
                    <Package size={20} style={{ color: RARITY_COLORS[item.rarity] }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
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

      {/* Logout */}
      <div className="px-4 pb-6">
        <Button
          variant="ghost"
          size="md"
          className="w-full text-error"
          icon={<LogOut size={16} />}
          onClick={logout}
        >
          Disconnect Wallet
        </Button>
      </div>
    </div>
  );
}
