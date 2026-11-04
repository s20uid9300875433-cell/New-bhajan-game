import React from 'react';
import { X, Sparkles, MoveRight, Layers, HelpCircle } from 'lucide-react';
import { TILE_TIERS } from '../data/tiers';
import { TileTier } from '../types/game';
import { audioManager } from '../utils/audioManager';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm max-h-[90vh] bg-gradient-to-b from-[#110e24] to-[#080b18] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-tight">How to Play</h2>
          </div>
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs text-slate-300">
          {/* Step 1: Slide */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <MoveRight className="w-4 h-4" />
              1. Slide to an Adjacent Socket
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tap any hexagon tile to select it, then tap a glowing neighbor to slide. If you tap an invalid cell, the board gently shakes.
            </p>
          </div>

          {/* Step 2: Merge */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Layers className="w-4 h-4" />
              2. Connect 3+ of the Same Tier
            </div>
            <p className="text-slate-400 leading-relaxed">
              When 3 or more matching tiles connect, they synthesize at the destination into 1 tile of the next tier, accompanied by an audio chime!
            </p>
          </div>

          {/* Step 3: Cascades */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              3. Cascade Combos
            </div>
            <p className="text-slate-400 leading-relaxed">
              Synthesized tiles that touch existing matching pieces trigger instant chain reactions for bonus scores, coins, and stars!
            </p>
          </div>

          {/* 6 Tile Tiers Catalog */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-white text-xs uppercase tracking-wider">Tile Hierarchy (Tiers 1 - 6)</span>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2, 3, 4, 5, 6] as TileTier[]).map(tier => {
                const info = TILE_TIERS[tier];
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-md"
                      style={{ backgroundColor: info.color, color: info.textColor }}
                    >
                      {info.glyph}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-200">T{tier} {info.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono tabular-nums">+{info.scoreValue} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
          }}
          className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          Got It, Start Playing!
        </button>
      </div>
    </div>
  );
};
