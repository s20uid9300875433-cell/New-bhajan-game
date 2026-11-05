import React, { useEffect } from 'react';
import {
  Star,
  RotateCcw,
  ArrowRight,
  Grid,
  Award,
  Coins,
  Gem,
  Film,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelRewardBreakdown } from '../types/game';
import { audioManager } from '../utils/audioManager';

export interface VictoryModalProps {
  isOpen: boolean;
  levelNumber: number;
  starsEarned: number;
  score: number;
  movesLeft: number;
  coinsEarned: number;
  isLastLevel?: boolean;
  rewardBreakdown?: LevelRewardBreakdown | null;
  bonusAdClaimed?: boolean;
  onClaimBonusAd?: () => void;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
  onOpenShop?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  levelNumber,
  starsEarned,
  score,
  movesLeft,
  coinsEarned,
  rewardBreakdown,
  bonusAdClaimed = false,
  onClaimBonusAd,
  onNextLevel,
  onReplay,
  onLevelSelect,
  onOpenShop,
}) => {
  useEffect(() => {
    if (isOpen) {
      audioManager.playVictory();
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#FBBF24'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const gemsEarned = rewardBreakdown?.gemsEarned ?? 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#0e1224] to-[#080b18] border border-amber-500/35 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Soft background aura */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Complete Kicker & Title */}
        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
          <Award className="w-3.5 h-3.5 shrink-0" />
          <span>Level {levelNumber} Completed</span>
        </div>
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300 tracking-tight mb-4">
          Quest Victorious!
        </h2>

        {/* 2.5D Animated Stars Container */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          {[1, 2, 3].map(starIndex => {
            const isEarned = starIndex <= starsEarned;
            const isMiddle = starIndex === 2;

            return (
              <div
                key={starIndex}
                className={`transition-transform duration-500 ${isMiddle ? '-translate-y-2' : ''}`}
              >
                <div
                  className={`relative p-2.5 rounded-2xl border transition-all ${
                    isEarned
                      ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-amber-300 shadow-xl shadow-amber-500/40 text-amber-950 scale-105'
                      : 'bg-slate-900/80 border-slate-800 text-slate-700'
                  }`}
                >
                  <Star className={`w-7 h-7 ${isEarned ? 'fill-amber-200 drop-shadow' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats & Currency Rewards Summary */}
        <div className="w-full p-3 bg-slate-900/90 border border-slate-800 rounded-2xl mb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400">Score</span>
              <span className="text-sm font-black text-white tabular-nums">{score.toLocaleString()}</span>
            </div>

            <div className="flex flex-col items-center border-x border-slate-800">
              <span className="text-[10px] font-bold text-slate-400">Moves Left</span>
              <span className="text-sm font-black text-emerald-400 tabular-nums">+{movesLeft}</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400">Coins</span>
              <span className="text-sm font-black text-amber-400 tabular-nums flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 shrink-0" />+{coinsEarned}
              </span>
            </div>
          </div>

          {rewardBreakdown && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 flex-wrap text-[10px] text-slate-400 tabular-nums">
              <span>Clear +{rewardBreakdown.baseCoins}</span>
              <span>·</span>
              <span>
                {starsEarned}★ +{rewardBreakdown.starBonusCoins}
              </span>
              <span>·</span>
              <span>Moves +{rewardBreakdown.movesBonusCoins}</span>
              {gemsEarned > 0 && (
                <>
                  <span>·</span>
                  <span className="text-cyan-300 font-bold inline-flex items-center gap-0.5">
                    <Gem className="w-3 h-3" />+{gemsEarned} Gems
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Optional Single-Claim Rewarded Ad Bonus Coins */}
        {onClaimBonusAd && (
          <button
            onClick={() => {
              if (!bonusAdClaimed) {
                audioManager.playClick();
                onClaimBonusAd();
              }
            }}
            disabled={bonusAdClaimed}
            className={`min-h-[42px] w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold mb-2.5 border transition-all whitespace-nowrap ${
              bonusAdClaimed
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 cursor-default'
                : 'bg-indigo-950/70 hover:bg-indigo-900/70 border-indigo-400/35 text-indigo-200 active:scale-95'
            }`}
          >
            {bonusAdClaimed ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Bonus +75 Coins Claimed!</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Bonus +75 Coins (Optional Ad)</span>
              </>
            )}
          </button>
        )}

        {/* Action Buttons — Infinite Progression Enabled (101+) */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => {
              audioManager.playClick();
              onNextLevel();
            }}
            className="min-h-[48px] w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all text-sm border border-white/20 whitespace-nowrap"
          >
            <span>Next Level ({levelNumber + 1})</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                onReplay();
              }}
              className="min-h-[42px] flex items-center justify-center gap-1 py-2 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Replay</span>
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onOpenShop?.();
              }}
              className="min-h-[42px] flex items-center justify-center gap-1 py-2 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-200 text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onLevelSelect();
              }}
              className="min-h-[42px] flex items-center justify-center gap-1 py-2 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
            >
              <Grid className="w-3.5 h-3.5 shrink-0" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
