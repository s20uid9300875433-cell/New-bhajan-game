import React, { useState } from 'react';
import { X, Gift, Coins, Gem, CheckCircle2, Film } from 'lucide-react';
import { UserProgress } from '../types/game';
import { DAILY_REWARD_SCHEDULE } from '../data/shopCatalog';
import { getDailyLoginStatus } from '../utils/storage';
import { audioManager } from '../utils/audioManager';

interface DailyRewardsModalProps {
  isOpen: boolean;
  progress: UserProgress;
  onClose: () => void;
  onClaimDaily: () => { success: boolean; coinsAdded: number; gemsAdded: number; dayClaimed: number };
  onWatchBonusAd: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  progress,
  onClose,
  onClaimDaily,
  onWatchBonusAd,
}) => {
  const [justClaimedMessage, setJustClaimedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const status = getDailyLoginStatus(progress);

  const handleClaim = () => {
    const res = onClaimDaily();
    if (res.success) {
      audioManager.playPurchase();
      const gemText = res.gemsAdded > 0 ? ` and +${res.gemsAdded} Gems` : '';
      setJustClaimedMessage(`Claimed Day ${res.dayClaimed}: +${res.coinsAdded} Coins${gemText}!`);
    } else {
      audioManager.playClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/90 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none">
                Daily Login Rewards
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Streak Day {status.nextStreakDay} of 7
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioManager.playClick();
              setJustClaimedMessage(null);
              onClose();
            }}
            aria-label="Close Daily Rewards"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {DAILY_REWARD_SCHEDULE.slice(0, 6).map(tier => {
            const isPastClaimed = status.claimedToday
              ? tier.day <= status.nextStreakDay
              : tier.day < status.nextStreakDay;
            const isTodayTarget = !status.claimedToday && tier.day === status.nextStreakDay;

            return (
              <div
                key={tier.day}
                className={`rounded-2xl p-2.5 border flex flex-col items-center justify-between text-center transition-all ${
                  isTodayTarget
                    ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/15'
                    : isPastClaimed
                    ? 'bg-emerald-950/40 border-emerald-500/35 opacity-85'
                    : 'bg-slate-950/75 border-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-300">{tier.label}</span>
                <div className="my-1.5 flex flex-col items-center gap-0.5">
                  <span className="text-xs font-black text-amber-300 tabular-nums flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />+{tier.coins}
                  </span>
                  {tier.gems > 0 && (
                    <span className="text-[11px] font-bold text-cyan-300 tabular-nums flex items-center gap-1">
                      <Gem className="w-3 h-3" />+{tier.gems}
                    </span>
                  )}
                </div>
                {isPastClaimed ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Claimed
                  </span>
                ) : isTodayTarget ? (
                  <span className="text-[10px] font-black text-amber-300">Ready</span>
                ) : (
                  <span className="text-[10px] text-slate-500">Upcoming</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Day 7 Grand Chest Card */}
        {(() => {
          const day7 = DAILY_REWARD_SCHEDULE[6];
          const isClaimed = status.claimedToday && status.nextStreakDay === 7;
          const isReady = !status.claimedToday && status.nextStreakDay === 7;
          return (
            <div
              className={`w-full rounded-2xl p-3 border mb-4 flex items-center justify-between ${
                isReady
                  ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-cyan-500/20 border-amber-400'
                  : isClaimed
                  ? 'bg-emerald-950/40 border-emerald-500/35'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div>
                <span className="text-xs font-black text-white">Day 7 · Grand Streak Chest</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-black text-amber-300 tabular-nums flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />+{day7.coins} Coins
                  </span>
                  <span className="text-xs font-black text-cyan-300 tabular-nums flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5" />+{day7.gems} Gems
                  </span>
                </div>
              </div>
              {isClaimed ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Claimed
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-300">
                  {isReady ? 'Ready!' : 'Day 7'}
                </span>
              )}
            </div>
          );
        })()}

        {justClaimedMessage && (
          <div className="w-full rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300 text-center mb-3">
            {justClaimedMessage}
          </div>
        )}

        {/* Primary Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!status.canClaim}
          className={`min-h-[46px] w-full py-3 px-4 rounded-2xl font-black text-sm transition-all mb-2.5 flex items-center justify-center gap-2 whitespace-nowrap ${
            status.canClaim
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95'
              : 'bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {status.canClaim ? (
            <>
              <Gift className="w-4 h-4" />
              <span>Claim Day {status.nextStreakDay} Reward</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Today&apos;s Reward Claimed</span>
            </>
          )}
        </button>

        {/* Optional Rewarded Ad Bonus Coins */}
        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
            onWatchBonusAd();
          }}
          className="min-h-[44px] w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Film className="w-4 h-4 text-cyan-400" />
          <span>Watch Test Ad for +150 Bonus Coins</span>
        </button>
      </div>
    </div>
  );
};
