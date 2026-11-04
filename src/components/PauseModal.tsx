import React from 'react';
import { Play, RotateCcw, Grid, Volume2, VolumeX, Music, Settings as SettingsIcon } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface PauseModalProps {
  isOpen: boolean;
  levelNumber: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
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
  onLevelSelect,
  onOpenSettings,
  onToggleSound,
  onToggleMusic,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#110e24] to-[#080b18] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-1">Paused</h2>
        <p className="text-xs font-semibold text-slate-400 mb-5">Level {levelNumber}</p>

        {/* Audio Toggles Strip */}
        <div className="flex items-center justify-center gap-3 w-full mb-5">
          <button
            onClick={() => {
              audioManager.playClick();
              onToggleSound();
            }}
            className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-2xl border transition-all shadow-md ${
              soundEnabled
                ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs font-bold">Sound</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onToggleMusic();
            }}
            className={`flex items-center justify-center gap-2 flex-1 py-2.5 px-3 rounded-2xl border transition-all shadow-md ${
              musicEnabled
                ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            <Music className={`w-4 h-4 ${musicEnabled ? 'text-amber-400' : ''}`} />
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
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all text-sm border border-white/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Quest
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Level
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onLevelSelect();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold active:scale-95 transition-all text-xs shadow-md"
          >
            <Grid className="w-3.5 h-3.5" />
            100 Levels Map
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            Game Settings
          </button>
        </div>
      </div>
    </div>
  );
};
