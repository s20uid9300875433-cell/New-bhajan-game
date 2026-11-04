import React, { useEffect } from 'react';
import { Star, RotateCcw, ArrowRight, Grid, Award, Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audioManager';

interface VictoryModalProps {
  isOpen: boolean;
  levelNumber: number;
  starsEarned: number;
  score: number;
  movesLeft: number;
  coinsEarned: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  levelNumber,
  starsEarned,
  score,
  movesLeft,
  coinsEarned,
  isLastLevel,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  useEffect(() => {
    if (isOpen) {
      audioManager.playVictory();
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#FBBF24'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#0e1224] to-[#080b18] border border-amber-500/35 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Soft background aura */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Award className="w-3.5 h-3.5 drop-shadow" />
          Level {levelNumber} Completed!
        </div>
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300 tracking-tight mb-4 drop-shadow-sm">
          Quest Victorious!
        </h2>

        {/* 2.5D Animated Stars Container */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(starIndex => {
            const isEarned = starIndex <= starsEarned;
            const isMiddle = starIndex === 2;

            return (
              <div
                key={starIndex}
                className={`transition-all duration-500 ${
                  isMiddle ? '-translate-y-2' : ''
                }`}
              >
                <div
                  className={`relative p-2.5 rounded-2xl border transition-all ${
                    isEarned
                      ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-amber-300 shadow-xl shadow-amber-500/40 text-amber-950 scale-105'
                      : 'bg-slate-900/80 border-slate-800 text-slate-700'
                  }`}
                >
                  <Star className={`w-8 h-8 ${isEarned ? 'fill-amber-200 drop-shadow' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 2.5D Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full p-3 bg-slate-900/90 border border-slate-800 rounded-2xl mb-6 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
            <span className="text-base font-black text-white tabular-nums">{score}</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Moves Left</span>
            <span className="text-base font-black text-emerald-400 tabular-nums">+{movesLeft}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Coins</span>
            <span className="text-base font-black text-amber-400 tabular-nums flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />+{coinsEarned}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {!isLastLevel && (
            <button
              onClick={() => {
                audioManager.playClick();
                onNextLevel();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all text-sm border border-white/20"
            >
              <span>Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                onReplay();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onLevelSelect();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              <Grid className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
