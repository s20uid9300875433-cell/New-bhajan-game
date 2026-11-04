import React, { useState } from 'react';
import { ArrowLeft, Star, Lock, Award } from 'lucide-react';
import { ALL_LEVELS } from '../data/levels';
import { UserProgress } from '../types/game';
import { audioManager } from '../utils/audioManager';

interface LevelSelectScreenProps {
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBackToHome: () => void;
}

const CHAPTERS = [
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
}) => {
  const initialChapter = Math.min(5, Math.max(1, Math.ceil(progress.unlockedLevel / 20)));
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);

  const currentChapterInfo = CHAPTERS.find(c => c.id === selectedChapter) || CHAPTERS[0];
  const chapterLevels = ALL_LEVELS.slice(currentChapterInfo.start - 1, currentChapterInfo.end);

  const totalStars = Object.values(progress.stars).reduce((acc, s) => acc + s, 0);

  const getDifficultyPillStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Normal':
      case 'Tutorial':
        return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
      case 'Hard':
        return 'bg-amber-950/80 border-amber-500/40 text-amber-300';
      case 'Hard+':
        return 'bg-orange-950/80 border-orange-500/40 text-orange-300';
      case 'Very Hard':
        return 'bg-rose-950/80 border-rose-500/40 text-rose-300';
      case 'Expert':
        return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
      case 'Master':
        return 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 border-amber-400/50 text-amber-200';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col p-4 select-none bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('/assets/aistudio/94dcd7311cb7c003dc8c2c8f30a006a9_24f28502.jpg')",
      }}
    >
      {/* Soft translucent wash for readability */}
      <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              audioManager.playClick();
              onBackToHome();
            }}
            className="p-2 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white active:scale-95 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black text-white drop-shadow leading-tight">100 Levels Map</h2>
            <p className="text-[10px] text-sky-200/90">{currentChapterInfo.name} · {currentChapterInfo.tierInfo}</p>
          </div>
        </div>

        {/* Total Stars Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold shadow-md">
          <Award className="w-3.5 h-3.5 fill-current" />
          <span className="tabular-nums">{totalStars}</span>
          <span className="text-sky-200/70 text-[10px]">/ 300</span>
        </div>
      </div>

      {/* Chapter Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/75 backdrop-blur-md border border-white/20 rounded-2xl mb-3 overflow-x-auto no-scrollbar shadow-inner z-10">
        {CHAPTERS.map(ch => {
          const isActive = selectedChapter === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => {
                audioManager.playClick();
                setSelectedChapter(ch.id);
              }}
              className={`flex-1 min-w-[62px] py-2 px-1.5 rounded-xl text-center transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white font-black shadow-md border border-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-[11px] leading-tight font-bold">Ch.{ch.id}</div>
              <div className={`text-[9px] font-mono leading-none ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>
                {ch.range}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2.5D Levels Grid (4 columns x 5 rows = 20 levels per chapter) */}
      <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-4 gap-2.5 content-start pb-4">
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
              className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${
                isUnlocked
                  ? isCurrent
                    ? 'bg-slate-900/85 backdrop-blur-md border-cyan-300 shadow-lg shadow-cyan-500/30 active:scale-95 ring-2 ring-cyan-400/60'
                    : 'bg-slate-900/75 backdrop-blur-md border-white/20 hover:border-white/40 active:scale-95 shadow-md'
                  : 'bg-slate-950/60 backdrop-blur-sm border-white/10 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Level Number & Indicator */}
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`text-xs font-black tabular-nums ${
                    isUnlocked ? (isCurrent ? 'text-cyan-300' : 'text-white') : 'text-slate-600'
                  }`}
                >
                  {level.id}
                </span>

                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>

              {/* Center Lock or Difficulty Pill */}
              <div className="my-1 flex items-center justify-center">
                {isUnlocked ? (
                  <span
                    className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${getDifficultyPillStyle(
                      level.difficulty
                    )} uppercase tracking-tight`}
                  >
                    {level.difficulty}
                  </span>
                ) : (
                  <div className="p-1 rounded-full bg-slate-900/80 border border-slate-800">
                    <Lock className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                )}
              </div>

              {/* Stars Row (0-3 stars) */}
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${
                      isUnlocked && s <= starsEarned
                        ? 'text-amber-400 fill-amber-400 drop-shadow'
                        : 'text-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* High Score Footnote if beaten */}
              {isUnlocked && highScore > 0 && (
                <span className="text-[8px] font-mono text-slate-500 tabular-nums mt-0.5">
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
