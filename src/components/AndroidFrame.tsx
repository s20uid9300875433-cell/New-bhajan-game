import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Signal,
  BatteryMedium,
  Smartphone,
  Maximize2,
  Minimize2,
  Code2,
  Play,
  RotateCw,
} from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: 'game' | 'code';
  onChangeTab: (tab: 'game' | 'code') => void;
  onResetGame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onChangeTab,
  onResetGame,
}) => {
  const [currentTime, setCurrentTime] = useState('10:45');
  const [isBezelMode, setIsBezelMode] = useState(true);

  // Live system clock for status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center justify-start text-slate-100 overflow-x-hidden font-sans">
      {/* Top Workspace Navigation Bar */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 z-40 backdrop-blur-md sticky top-0">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-cyan-400 flex items-center justify-center font-black text-sm text-white shadow-md">
            ⬡
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white whitespace-nowrap">
            Hexa Color Quest
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Android 14 · Jetpack Compose
          </span>
        </div>

        {/* Center: Tabs Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeTab('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'game'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Game</span>
          </button>

          <button
            onClick={() => onChangeTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Kotlin Project Files</span>
          </button>
        </div>

        {/* Right: Emulator Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'game' && (
            <>
              <button
                onClick={() => setIsBezelMode(!isBezelMode)}
                title={isBezelMode ? 'Fullscreen View' : 'Device Bezel View'}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {isBezelMode ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </button>

              <button
                onClick={onResetGame}
                title="Restart Session"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {activeTab === 'game' ? (
          isBezelMode ? (
            /* Realistic Android Smartphone Frame (Pixel / Galaxy Portrait Flagship) */
            <div className="relative w-full max-w-[412px] h-[840px] max-h-[calc(100vh-80px)] bg-black rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_10px_#1e293b,0_0_0_12px_#334155] flex flex-col items-center justify-between border-4 border-slate-700/80 overflow-hidden ring-1 ring-white/10">
              {/* Android Top Bezel with Speaker Slit */}
              <div className="absolute top-2 w-14 h-1 bg-slate-800 rounded-full z-30" />

              {/* Internal Android Display Surface */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden flex flex-col bg-slate-950">
                {/* Android Status Bar */}
                <div className="w-full h-8 px-6 flex items-center justify-between text-xs text-slate-300 font-medium z-30 bg-slate-950/90 select-none">
                  {/* Left: Clock */}
                  <span className="font-semibold text-xs tracking-tight">{currentTime}</span>

                  {/* Center: Camera Punch-Hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  </div>

                  {/* Right: Icons (5G, Wi-Fi, Battery) */}
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Signal className="w-3.5 h-3.5" />
                    <Wifi className="w-3.5 h-3.5" />
                    <BatteryMedium className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                {/* Android Game Viewport */}
                <div className="w-full flex-1 overflow-hidden relative">
                  {children}
                </div>

                {/* Android Navigation Gesture Pill */}
                <div className="w-full h-5 flex items-center justify-center bg-slate-950 select-none z-30">
                  <div className="w-32 h-1 bg-slate-600/70 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            /* Responsive Fullscreen Mode */
            <div className="w-full max-w-md h-[800px] max-h-[calc(100vh-80px)] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex flex-col">
              <div className="w-full flex-1 overflow-hidden">
                {children}
              </div>
            </div>
          )
        ) : (
          /* Code Explorer Viewport handled by child */
          <div className="w-full max-w-5xl h-[840px] max-h-[calc(100vh-80px)]">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
