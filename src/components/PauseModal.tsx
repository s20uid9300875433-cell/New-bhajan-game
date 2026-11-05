import React from 'react';
import {
  Play,
  RotateCcw,
  Grid,
  Home,
  ShoppingBag,
  Volume2,
  VolumeX,
  Music,
  Settings as SettingsIcon,
} from 'lucide-react';
import { audioManager } from '../utils/audioManager';

export interface PauseModalProps {
  isOpen: boolean;
  levelNumber: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onGoHome?: () => void;
  onLevelSelect: () => void;
  onOpenShop?: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  levelNumber,
  soundEnabled,
  musicEnabled,
  onResume,
  onRestart,
  onGoHome,
  onLevelSelect,
  onOpenShop,
  onOpenSettings,
  onToggleSound,
  onToggleMusic,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#110e24] to-[#080b18] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-0.5">Game Paused</h2>
        <p className="text-xs font-semibold text-slate-400 mb-4">Level {levelNumber} · Progress Auto-Saved</p>

        {/* Audio Toggles Strip */}
        <div className="flex items-center justify-center gap-2.5 w-full mb-4">
          <button
            onClick={() => {
              audioManager.playClick();
              onToggleSound();
            }}
            className={`min-h-[42px] flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-2xl border transition-all shadow-md whitespace-nowrap ${
              soundEnabled
                ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 shrink-0" />
            )}
            <span className="text-xs font-bold">SFX</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onToggleMusic();
            }}
            className={`min-h-[42px] flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-2xl border transition-all shadow-md whitespace-nowrap ${
              musicEnabled
                ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Music className={`w-4 h-4 shrink-0 ${musicEnabled ? 'text-amber-400' : ''}`} />
            <span className="text-xs font-bold">Music</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              audioManager.playClick();
              onResume();
            }}
            className="min-h-[48px] w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all text-sm border border-white/20 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>Resume Quest</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onRestart();
            }}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs shadow-md whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Restart Level</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                if (onGoHome) onGoHome();
                else onLevelSelect();
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs shadow-md whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Save & Home</span>
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onLevelSelect();
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs shadow-md whitespace-nowrap"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Levels Map</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => {
                audioManager.playClick();
                onOpenShop?.();
              }}
              className="min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 text-amber-200 font-bold active:scale-95 transition-all text-xs whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onOpenSettings();
              }}
              className="min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold active:scale-95 transition-all text-xs whitespace-nowrap"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
