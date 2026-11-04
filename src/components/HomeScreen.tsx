import React from 'react';
import { Play, Grid, Settings as SettingsIcon, HelpCircle, Volume2, VolumeX, Music, Award, Coins, Sparkles, ChevronRight } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { UserProgress } from '../types/game';
import { getLevelConfig } from '../data/levels';

interface HomeScreenProps {
  progress: UserProgress;
  onPlay: () => void;
  onLevelSelect: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onPlay,
  onLevelSelect,
  onOpenSettings,
  onOpenTutorial,
  onToggleSound,
  onToggleMusic,
}) => {
  const totalStars = Object.values(progress.stars).reduce((acc, s) => acc + s, 0);
  const currentLevelConfig = getLevelConfig(progress.unlockedLevel);
  const progressPercent = Math.min(100, Math.round(((progress.unlockedLevel - 1) / 100) * 100));

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-between p-5 select-none overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/assets/aistudio/94dcd7311cb7c003dc8c2c8f30a006a9_24f28502.jpg')`,
      }}
    >
      {/* Ambient soft sunlight & rippling water reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-sky-950/25 pointer-events-none" />

      {/* Top Bar Status Strip */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {/* Total Stars Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/25 text-amber-300 text-xs font-black shadow-lg">
            <Award className="w-3.5 h-3.5 fill-current drop-shadow" />
            <span className="tabular-nums">{totalStars}</span>
            <span className="text-[10px] text-slate-300 font-semibold">/300</span>
          </div>

          {/* Coins Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/25 text-amber-300 text-xs font-black shadow-lg">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span className="tabular-nums">{progress.coins}</span>
          </div>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              audioManager.playClick();
              onToggleSound();
            }}
            aria-label="Toggle Sound"
            className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md"
          >
            {progress.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onToggleMusic();
            }}
            aria-label="Toggle Music"
            className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md"
          >
            <Music className={`w-4 h-4 ${progress.musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenSettings();
            }}
            aria-label="Settings"
            className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 2.5D Brand Hero Lockup */}
      <div className="flex flex-col items-center justify-center my-auto z-10 max-w-xs text-center w-full">
        {/* Animated 2.5D Glossy Hexagon Logo Mark */}
        <div className="relative w-36 h-36 mb-3 flex items-center justify-center animate-float">
          <svg viewBox="0 0 100 115" className="w-full h-full drop-shadow-[0_16px_30px_rgba(244,63,94,0.4)]">
            <defs>
              <linearGradient id="logoHexGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDA4AF" />
                <stop offset="35%" stopColor="#F43F5E" />
                <stop offset="85%" stopColor="#881337" />
                <stop offset="100%" stopColor="#4c0519" />
              </linearGradient>
              <linearGradient id="logoBevelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9f1239" />
                <stop offset="100%" stopColor="#1e020a" />
              </linearGradient>
            </defs>

            {/* 2.5D Bottom Extrusion */}
            <polygon
              points="50,11 93,36 93,86 50,111 7,86 7,36"
              fill="url(#logoBevelGrad)"
              stroke="#000000"
              strokeWidth="1"
            />

            {/* Top Glossy Hexagon Face */}
            <polygon
              points="50,5 93,30 93,80 50,105 7,80 7,30"
              fill="url(#logoHexGrad1)"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
            />

            {/* Top Gloss Curve */}
            <polygon
              points="50,10 88,32 88,75 50,98 12,75 12,32"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.6"
              strokeDasharray="40 50"
            />

            {/* Center Crown Glyph */}
            <text
              x="50"
              y="55"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="34"
              fill="#FFFFFF"
              className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            >
              👑
            </text>
          </svg>

          {/* Satellite mini-hexagons */}
          <div className="absolute -top-1 -right-1 w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 shadow-lg shadow-amber-500/30 flex items-center justify-center text-amber-950 text-xs font-black border border-white/50 rotate-12">
            ▲
          </div>
          <div className="absolute -bottom-1 -left-1 w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-200 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-emerald-950 text-xs font-black border border-white/50 -rotate-12">
            ●
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 tracking-tight leading-none mb-1 drop-shadow-sm">
          Hexa Color Quest
        </h1>
        <p className="text-xs font-semibold text-slate-400 tracking-wide mb-3">
          Slide · Connect · Merge 100 Levels
        </p>

        {/* Level Progress Indicator Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Level {progress.unlockedLevel} of 100
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
              {currentLevelConfig.difficulty}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Progress: {progressPercent}%</span>
            <span>{currentLevelConfig.name}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Action Buttons */}
      <div className="w-full max-w-xs flex flex-col gap-2.5 z-10 mb-2">
        {/* Primary Play Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onPlay();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 text-white font-black text-base tracking-wide shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{progress.unlockedLevel > 1 ? `Continue Level ${progress.unlockedLevel}` : 'Start Quest'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* 100 Levels & How to Play */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              audioManager.playClick();
              onLevelSelect();
            }}
            className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            <span>100 Levels Map</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenTutorial();
            }}
            className="py-3 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>How to Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
