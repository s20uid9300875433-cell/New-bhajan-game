import React from 'react';
import {
  Play,
  Grid,
  Settings as SettingsIcon,
  HelpCircle,
  Volume2,
  VolumeX,
  Music,
  Award,
  Coins,
  Gem,
  ShoppingBag,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { ShopCategory, UserProgress } from '../types/game';
import { getLevelConfig } from '../data/levels';
import { getBackgroundById } from '../data/shopCatalog';
import { getDailyLoginStatus } from '../utils/storage';

interface HomeScreenProps {
  progress: UserProgress;
  onPlay: () => void;
  onLevelSelect: () => void;
  onOpenShop: (initialCategory?: ShopCategory) => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onPlay,
  onLevelSelect,
  onOpenShop,
  onOpenDailyRewards,
  onOpenSettings,
  onOpenTutorial,
  onToggleSound,
  onToggleMusic,
}) => {
  const totalStars = Object.values(progress.stars).reduce((acc, s) => acc + s, 0);
  const activePlayLevelId = progress.savedActiveLevel?.levelId ?? progress.unlockedLevel;
  const currentLevelConfig = getLevelConfig(activePlayLevelId);
  const activeBg = getBackgroundById(progress.selectedBackground);
  const dailyStatus = getDailyLoginStatus(progress);

  const isInfiniteUnlocked = progress.unlockedLevel > 100;
  const chapterProgressPercent = isInfiniteUnlocked
    ? Math.min(100, Math.round((((progress.unlockedLevel - 1) % 20) / 20) * 100) || 100)
    : Math.min(100, Math.round(((progress.unlockedLevel - 1) / 100) * 100));

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-between p-4 select-none overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${activeBg.imageUrl}'), ${activeBg.fallbackGradient}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Selected Theme Ambient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: activeBg.overlayGradient }}
      />

      {/* Top Bar Status Strip: Stars, Coins, Gems, Audio & Settings */}
      <div className="w-full flex items-center justify-between gap-1.5 z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Total Stars */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-black shadow-lg">
            <Award className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="tabular-nums">{totalStars}</span>
          </div>

          {/* Coins Balance (tappable to open Shop) */}
          <button
            onClick={() => {
              audioManager.playClick();
              onOpenShop('backgrounds');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/75 hover:bg-slate-900 backdrop-blur-md border border-amber-400/35 text-amber-300 text-xs font-black shadow-lg active:scale-95 transition-all"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="tabular-nums">{progress.coins.toLocaleString()}</span>
          </button>

          {/* Gems Balance (tappable to open Shop) */}
          <button
            onClick={() => {
              audioManager.playClick();
              onOpenShop('tiles');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/75 hover:bg-slate-900 backdrop-blur-md border border-cyan-400/35 text-cyan-300 text-xs font-black shadow-lg active:scale-95 transition-all"
          >
            <Gem className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="tabular-nums">{progress.gems.toLocaleString()}</span>
          </button>
        </div>

        {/* Audio & Settings Quick Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              audioManager.playClick();
              onToggleSound();
            }}
            aria-label="Toggle Sound"
            className="min-h-[38px] min-w-[38px] p-2 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            {progress.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onToggleMusic();
            }}
            aria-label="Toggle Music"
            className="min-h-[38px] min-w-[38px] p-2 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            <Music
              className={`w-4 h-4 ${progress.musicEnabled ? 'text-amber-400' : 'text-slate-500'}`}
            />
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenSettings();
            }}
            aria-label="Settings"
            className="min-h-[38px] min-w-[38px] p-2 rounded-2xl bg-slate-900/85 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 2.5D Brand Hero Lockup */}
      <div className="flex flex-col items-center justify-center my-auto z-10 max-w-xs text-center w-full">
        <div className="relative w-32 h-32 mb-2.5 flex items-center justify-center animate-float">
          <svg
            viewBox="0 0 100 115"
            className="w-full h-full drop-shadow-[0_16px_30px_rgba(244,63,94,0.4)]"
          >
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

            <polygon
              points="50,11 93,36 93,86 50,111 7,86 7,36"
              fill="url(#logoBevelGrad)"
              stroke="#000000"
              strokeWidth="1"
            />

            <polygon
              points="50,5 93,30 93,80 50,105 7,80 7,30"
              fill="url(#logoHexGrad1)"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
            />

            <polygon
              points="50,10 88,32 88,75 50,98 12,75 12,32"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.6"
              strokeDasharray="40 50"
            />

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

          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 shadow-lg shadow-amber-500/30 flex items-center justify-center text-amber-950 text-xs font-black border border-white/50 rotate-12">
            ★
          </div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-teal-200 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-emerald-950 text-xs font-black border border-white/50 -rotate-12">
            ♣
          </div>
        </div>

        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-cyan-200 tracking-tight leading-none mb-1 drop-shadow">
          Hexa Color Quest
        </h1>
        <p className="text-xs font-semibold text-slate-200/90 tracking-wide mb-3 drop-shadow">
          Slide · Merge · Infinite Puzzle Quest
        </p>

        {/* Level Progress Card */}
        <div className="w-full bg-slate-900/85 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">
              {progress.savedActiveLevel
                ? `Saved Level ${progress.savedActiveLevel.levelId}`
                : isInfiniteUnlocked
                ? `Infinite Level ${progress.unlockedLevel}`
                : `Level ${progress.unlockedLevel} of 100+`}
            </span>
            <span className="text-[11px] font-semibold text-cyan-300">
              {currentLevelConfig.difficulty}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(6, chapterProgressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>
              {progress.savedActiveLevel
                ? `${progress.savedActiveLevel.movesLeft} moves remaining`
                : `Scene: ${activeBg.name}`}
            </span>
            <span className="truncate max-w-[140px]">{currentLevelConfig.name}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Action Area */}
      <div className="w-full max-w-xs flex flex-col gap-2 z-10 mb-1">
        {/* Primary Play / Resume Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onPlay();
          }}
          className="min-h-[52px] w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 text-white font-black text-base tracking-wide shadow-xl shadow-rose-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-white/25 whitespace-nowrap"
        >
          <Play className="w-5 h-5 fill-current shrink-0" />
          <span>
            {progress.savedActiveLevel
              ? `Resume Level ${progress.savedActiveLevel.levelId}`
              : progress.unlockedLevel > 1
              ? `Play Level ${progress.unlockedLevel}`
              : 'Start Quest'}
          </span>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>

        {/* Shop & Daily Rewards Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              audioManager.playClick();
              onOpenShop('backgrounds');
            }}
            className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/35 text-amber-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Quest Shop</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenDailyRewards();
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-2xl border font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap ${
              dailyStatus.canClaim
                ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 border-amber-400 text-amber-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <Gift className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{dailyStatus.canClaim ? 'Claim Gift!' : 'Daily Gift'}</span>
          </button>
        </div>

        {/* Levels Map & How to Play Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              audioManager.playClick();
              onLevelSelect();
            }}
            className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap"
          >
            <Grid className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Levels Map</span>
          </button>

          <button
            onClick={() => {
              audioManager.playClick();
              onOpenTutorial();
            }}
            className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>How to Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
