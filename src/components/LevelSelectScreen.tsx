import React, { useState, useMemo } from 'react';
import { ArrowLeft, Star, Lock, Award, Coins, ShoppingBag } from 'lucide-react';
import { getLevelConfig } from '../data/levels';
import { getBackgroundById } from '../data/shopCatalog';
import { UserProgress } from '../types/game';
import { audioManager } from '../utils/audioManager';

interface LevelSelectScreenProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBackToHome: () => void;
  onOpenShop?: () => void;
}

interface ChapterDescriptor {
  id: number;
  name: string;
  range: string;
  tierInfo: string;
  start: number;
  end: number;
}

const BASE_CHAPTERS: ChapterDescriptor[] = [
  { id: 1, name: 'Spark', range: '1-20', tierInfo: 'Normal & Hard', start: 1, end: 20 },
  { id: 2, name: 'Cascade', range: '21-40', tierInfo: 'Hard+ & Very Hard', start: 21, end: 40 },
  { id: 3, name: 'Prism', range: '41-60', tierInfo: 'Very Hard & Expert', start: 41, end: 60 },
  { id: 4, name: 'Alchemy', range: '61-80', tierInfo: 'Expert & Master', start: 61, end: 80 },
  { id: 5, name: 'Apex', range: '81-100', tierInfo: 'Master Strategy', start: 81, end: 100 },
];

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  onBackToHome,
  onOpenShop,
}) => {
  // Dynamically generate Infinite Chapters (101+) so progression never ends
  const chapters = useMemo<ChapterDescriptor[]>(() => {
    const list = [...BASE_CHAPTERS];
    const maxVisibleChapter = Math.max(6, Math.ceil((progress.unlockedLevel + 1) / 20));
    const infiniteNames = ['Infinity', 'Astral', 'Celestial', 'Eternity', 'Sovereign', 'Zenith'];

    for (let chId = 6; chId <= maxVisibleChapter; chId++) {
      const start = (chId - 1) * 20 + 1;
      const end = chId * 20;
      const label = infiniteNames[(chId - 6) % infiniteNames.length];
      list.push({
        id: chId,
        name: `${label} ${chId - 5}`,
        range: `${start}-${end}`,
        tierInfo: 'Infinite Seeded Puzzles',
        start,
        end,
      });
    }
    return list;
  }, [progress.unlockedLevel]);

  const initialChapter = Math.max(1, Math.ceil(progress.unlockedLevel / 20));
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);

  const currentChapterInfo =
    chapters.find(c => c.id === selectedChapter) || chapters[chapters.length - 1];

  const chapterLevels = useMemo(() => {
    const items = [];
    for (let id = currentChapterInfo.start; id <= currentChapterInfo.end; id++) {
      items.push(getLevelConfig(id));
    }
    return items;
  }, [currentChapterInfo]);

  const totalStars = Object.values(progress.stars).reduce((acc, s) => acc + s, 0);
  const activeBg = getBackgroundById(progress.selectedBackground);

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Normal':
      case 'Tutorial':
        return 'text-emerald-300';
      case 'Hard':
        return 'text-amber-300';
      case 'Hard+':
        return 'text-orange-300';
      case 'Very Hard':
        return 'text-rose-300';
      case 'Expert':
        return 'text-purple-300';
      case 'Grandmaster':
        return 'text-cyan-300';
      case 'Master':
      default:
        return 'text-amber-200';
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col p-4 select-none bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: `url('${activeBg.imageUrl}'), ${activeBg.fallbackGradient}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/55 pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 z-10 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              audioManager.playClick();
              onBackToHome();
            }}
            aria-label="Back to Home"
            className="min-h-[40px] min-w-[40px] p-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white drop-shadow leading-tight truncate">
              Quest Map (100+ Infinite)
            </h2>
            <p className="text-[10px] text-sky-200/90 truncate">
              {currentChapterInfo.name} · {currentChapterInfo.tierInfo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenShop && (
            <button
              onClick={() => {
                audioManager.playClick();
                onOpenShop();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/80 border border-amber-400/35 text-amber-300 text-xs font-black shadow-md active:scale-95 transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">{progress.coins.toLocaleString()}</span>
              <ShoppingBag className="w-3 h-3 ml-0.5 text-amber-200" />
            </button>
          )}

          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/80 border border-white/20 text-amber-300 text-xs font-bold shadow-md">
            <Award className="w-3.5 h-3.5 fill-current" />
            <span className="tabular-nums">{totalStars}</span>
          </div>
        </div>
      </div>

      {/* Chapter Navigation Tabs (Chapters 1-5 + Infinite Chapters 6+) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-2xl mb-3 overflow-x-auto shadow-inner z-10">
        {chapters.map(ch => {
          const isActive = selectedChapter === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => {
                audioManager.playClick();
                setSelectedChapter(ch.id);
              }}
              className={`min-w-[66px] py-2 px-2 rounded-xl text-center transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white font-black shadow-md border border-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[11px] leading-tight font-bold whitespace-nowrap">
                {ch.id <= 5 ? `Ch.${ch.id}` : `∞ Ch.${ch.id}`}
              </div>
              <div
                className={`text-[9px] font-mono leading-none mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-amber-100' : 'text-slate-500'
                }`}
              >
                {ch.range}
              </div>
            </button>
          );
        })}
      </div>

      {/* Levels Grid (4 columns x 5 rows = 20 levels per chapter) */}
      <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-4 gap-2.5 content-start pb-4 z-10">
        {chapterLevels.map(level => {
          const isUnlocked = level.id <= progress.unlockedLevel;
          const starsEarned = progress.stars[level.id] || 0;
          const highScore = progress.highScores[level.id] || 0;
          const isCurrent = level.id === progress.unlockedLevel;

          return (
            <button
              key={level.id}
              disabled={!isUnlocked}
              onClick={() => {
                audioManager.playClick();
                onSelectLevel(level.id);
              }}
              className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all min-h-[78px] ${
                isUnlocked
                  ? isCurrent
                    ? 'bg-slate-900/90 border-cyan-300 shadow-lg shadow-cyan-500/30 active:scale-95 ring-2 ring-cyan-400/60'
                    : 'bg-slate-900/80 border-white/20 hover:border-white/40 active:scale-95 shadow-md'
                  : 'bg-slate-950/65 border-white/10 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-black tabular-nums ${
                    isUnlocked ? (isCurrent ? 'text-cyan-300' : 'text-white') : 'text-slate-600'
                  }`}
                >
                  {level.id}
                </span>
                {isCurrent && (
                  <span className="text-[9px] font-bold text-cyan-300">Next</span>
                )}
              </div>

              <div className="my-1 flex items-center justify-center">
                {isUnlocked ? (
                  <span
                    className={`text-[9px] font-bold ${getDifficultyTextColor(
                      level.difficulty
                    )} truncate max-w-[64px]`}
                  >
                    {level.difficulty}
                  </span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${
                      isUnlocked && s <= starsEarned
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-800'
                    }`}
                  />
                ))}
              </div>

              {isUnlocked && highScore > 0 && (
                <span className="text-[8px] font-mono text-slate-400 tabular-nums mt-0.5">
                  {highScore}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
