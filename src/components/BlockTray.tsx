import React, { useRef, useState, useEffect } from 'react';
import { TrayBlock, TileTier } from '../types/game';
import { getTierInfo } from '../data/tiers';
import { audioManager } from '../utils/audioManager';
import { renderEmbossedSymbol } from './HexagonGrid';

interface BlockTrayProps {
  blocks: TrayBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onDragStart: (block: TrayBlock, startX: number, startY: number) => void;
  onDragMove: (currentX: number, currentY: number) => void;
  onDragEnd: (endX: number, endY: number) => void;
  disabled?: boolean;
}

export const BlockTray: React.FC<BlockTrayProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled = false,
}) => {
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  // Global mouse/touch move and up listeners during active drag
  useEffect(() => {
    if (!activeDraggingId) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      onDragMove(clientX, clientY);
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;
      setActiveDraggingId(null);
      dragOriginRef.current = null;
      onDragEnd(clientX, clientY);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [activeDraggingId, onDragMove, onDragEnd]);

  const handleStartDrag = (block: TrayBlock, clientX: number, clientY: number) => {
    if (disabled || block.isUsed) return;
    audioManager.playSelect();
    setActiveDraggingId(block.id);
    dragOriginRef.current = { x: clientX, y: clientY };
    onDragStart(block, clientX, clientY);
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Tray Label */}
      <div className="flex items-center justify-between w-full px-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Color Block Tray
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Drag or tap to place
        </span>
      </div>

      {/* Tray Pedestal Container */}
      <div className="w-full bg-slate-900/65 backdrop-blur-md border border-white/25 rounded-3xl p-2.5 shadow-2xl flex items-center justify-around gap-2.5 relative">
        {blocks.map((block) => {
          const tierInfo = getTierInfo(block.tier);
          const isSelected = selectedBlockId === block.id;
          const isDragging = activeDraggingId === block.id;

          if (block.isUsed) {
            return (
              <div
                key={block.id}
                className="flex-1 max-w-[96px] h-20 rounded-2xl border border-white/10 bg-slate-950/30 flex items-center justify-center opacity-30 transition-all"
              >
                <div className="w-8 h-8 rounded-full border border-dashed border-white/40" />
              </div>
            );
          }

          return (
            <div
              key={block.id}
              onClick={() => {
                if (!disabled) {
                  audioManager.playClick();
                  onSelectBlock(block.id);
                }
              }}
              onMouseDown={e => handleStartDrag(block, e.clientX, e.clientY)}
              onTouchStart={e => {
                const touch = e.touches[0];
                handleStartDrag(block, touch.clientX, touch.clientY);
              }}
              className={`flex-1 max-w-[96px] h-20 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center relative touch-none ${
                isSelected
                  ? 'bg-gradient-to-b from-sky-900/80 to-indigo-950/90 border-cyan-400 shadow-lg shadow-cyan-500/35 -translate-y-1.5 ring-2 ring-cyan-400/60'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/20 hover:border-white/40 active:scale-95 shadow-md'
              } ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
            >
              {/* Active Selection Glow Ring */}
              {isSelected && (
                <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              )}

              {/* Thick 3D Hexagon Block Graphic with Horizontal Layered Ridges */}
              <div className="relative w-12 h-12 flex items-center justify-center transition-transform hover:scale-105">
                <svg viewBox="0 0 100 115" className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]">
                  <defs>
                    <linearGradient id={`trayGrad-${block.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={tierInfo.lightColor} />
                      <stop offset="25%" stopColor={tierInfo.color} />
                      <stop offset="85%" stopColor={tierInfo.shadowColor} />
                      <stop offset="100%" stopColor="#04060c" />
                    </linearGradient>
                  </defs>

                  {/* Layer 3: Bottom Ridge */}
                  <polygon
                    points="50,15 93,40 93,90 50,115 7,90 7,40"
                    fill={tierInfo.ridgeColor}
                    stroke="#020617"
                    strokeWidth="1.2"
                  />

                  {/* Layer 2: Mid Ridge */}
                  <polygon
                    points="50,11 93,36 93,86 50,111 7,86 7,36"
                    fill={tierInfo.shadowColor}
                    stroke={tierInfo.ridgeColor}
                    strokeWidth="0.8"
                  />
                  <polygon
                    points="50,10 93,35 93,85 50,110 7,85 7,35"
                    fill="none"
                    stroke={tierInfo.ridgeHighlight}
                    strokeWidth="1"
                    opacity="0.45"
                  />

                  {/* Layer 1: Top Ridge */}
                  <polygon
                    points="50,7 93,32 93,82 50,107 7,82 7,32"
                    fill={tierInfo.color}
                    stroke={tierInfo.shadowColor}
                    strokeWidth="0.8"
                  />
                  <polygon
                    points="50,6 93,31 93,81 50,106 7,81 7,31"
                    fill="none"
                    stroke={tierInfo.lightColor}
                    strokeWidth="1.2"
                    opacity="0.6"
                  />

                  {/* Top Glossy Hex Face */}
                  <polygon
                    points="50,3 93,28 93,78 50,103 7,78 7,28"
                    fill={`url(#trayGrad-${block.id})`}
                    stroke="rgba(255, 255, 255, 0.75)"
                    strokeWidth="2"
                  />

                  {/* Top Specular Arc */}
                  <polygon
                    points="50,8 88,30 88,73 50,96 12,73 12,30"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.55)"
                    strokeWidth="1.5"
                    strokeDasharray="26 36"
                  />

                  {/* Embossed Symbol (Heart, Star, Clover, Moon, Crown) */}
                  {renderEmbossedSymbol(tierInfo.symbolType, 50, 52, 34, tierInfo.ridgeColor)}
                </svg>
              </div>

              {/* Tier Name Pill */}
              <span className="text-[10px] font-black text-white mt-1 drop-shadow font-sans">
                T{block.tier} {tierInfo.name.split(' ')[1] || tierInfo.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
