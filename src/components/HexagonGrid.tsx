import React, { useMemo } from 'react';
import { BoardTile, GraphicsQuality, HexCoord, TileTier } from '../types/game';
import {
  generateGridCoords,
  getHexCornerPoints,
  hexKey,
  hexToPixel,
} from '../utils/hexMath';
import { getTierInfo } from '../data/tiers';
import {
  DEFAULT_BACKGROUND_ID,
  DEFAULT_TILE_SKIN_ID,
  getBackgroundById,
  getTileSkinById,
} from '../data/shopCatalog';
import { HintSuggestion } from '../utils/solver';

export interface SparkleParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  tx: number;
  ty: number;
  size: number;
}

// Helper to render the embossed symbol (Heart, Star, Clover, Hexa, Moon, Crown)
export const renderEmbossedSymbol = (
  symbolType: string,
  cx: number,
  cy: number,
  size: number,
  shadowColor: string
) => {
  switch (symbolType) {
    case 'heart': {
      const scale = size / 23;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <path
            d="M 0,-3.5 C -2.2,-8.5 -8.5,-8.5 -8.5,-2.5 C -8.5,2.5 -3.5,6.5 0,10 C 3.5,6.5 8.5,2.5 8.5,-2.5 C 8.5,-8.5 2.2,-8.5 0,-3.5 Z"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            transform="translate(0, 0.8)"
          />
          <path
            d="M 0,-3.5 C -2.2,-8.5 -8.5,-8.5 -8.5,-2.5 C -8.5,2.5 -3.5,6.5 0,10 C 3.5,6.5 8.5,2.5 8.5,-2.5 C 8.5,-8.5 2.2,-8.5 0,-3.5 Z"
            fill={shadowColor}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
        </g>
      );
    }
    case 'star5': {
      const scale = size / 23;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <polygon
            points="0,-10.5 3,-3.5 10.5,-3.5 4.5,1.2 7,8.5 0,4 -7,8.5 -4.5,1.2 -10.5,-3.5 -3,-3.5"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            transform="translate(0, 0.8)"
          />
          <polygon
            points="0,-10.5 3,-3.5 10.5,-3.5 4.5,1.2 7,8.5 0,4 -7,8.5 -4.5,1.2 -10.5,-3.5 -3,-3.5"
            fill={shadowColor}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
        </g>
      );
    }
    case 'clover': {
      const scale = size / 24;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <g transform="translate(0, 0.8)">
            <circle cx="-4" cy="-2.5" r="4.2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
            <circle cx="4" cy="-2.5" r="4.2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
            <circle cx="0" cy="-8.5" r="4.2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
            <path d="M -0.5,-1 Q 0,8 3.5,9.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
          </g>
          <circle cx="-4" cy="-2.5" r="4.2" fill={shadowColor} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          <circle cx="4" cy="-2.5" r="4.2" fill={shadowColor} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          <circle cx="0" cy="-8.5" r="4.2" fill={shadowColor} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          <path d="M -0.5,-1 Q 0,8 3.5,9.5" fill="none" stroke={shadowColor} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    }
    case 'star6': {
      const scale = size / 24;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <g transform="translate(0, 0.8)">
            <polygon points="0,-10 8.6,5 -8.6,5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
            <polygon points="0,10 8.6,-5 -8.6,-5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
          </g>
          <polygon points="0,-10 8.6,5 -8.6,5" fill={shadowColor} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
          <polygon points="0,10 8.6,-5 -8.6,-5" fill={shadowColor} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
        </g>
      );
    }
    case 'moon': {
      const scale = size / 23;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <path
            d="M 5.5,-8.5 C 0.5,-8.5 -5.5,-3.5 -5.5,2.5 C -5.5,8.5 0.5,11.5 6.5,10.5 C 2.5,8.5 0.5,5.5 0.5,1.5 C 0.5,-3.5 3.5,-6.5 5.5,-8.5 Z"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            transform="translate(0, 0.8)"
          />
          <path
            d="M 5.5,-8.5 C 0.5,-8.5 -5.5,-3.5 -5.5,2.5 C -5.5,8.5 0.5,11.5 6.5,10.5 C 2.5,8.5 0.5,5.5 0.5,1.5 C 0.5,-3.5 3.5,-6.5 5.5,-8.5 Z"
            fill={shadowColor}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
        </g>
      );
    }
    case 'crown':
    default: {
      const scale = size / 24;
      return (
        <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
          <path
            d="M -8.5,5 L -7.5,-3 L -3,0.5 L 0,-7 L 3,0.5 L 7.5,-3 L 8.5,5 Z"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            transform="translate(0, 0.8)"
          />
          <path
            d="M -8.5,5 L -7.5,-3 L -3,0.5 L 0,-7 L 3,0.5 L 7.5,-3 L 8.5,5 Z"
            fill={shadowColor}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.8"
          />
          <rect x="-8" y="6" width="16" height="2" rx="1" fill={shadowColor} />
        </g>
      );
    }
  }
};

/**
 * Reusable standalone Stacked 3D Hexagon Tile SVG for Shop Previews & Drag Proxy
 */
export const StackedHexPreview: React.FC<{
  tier: TileTier;
  skinId?: string;
  sizePx?: number;
  uid?: string;
}> = React.memo(({ tier, skinId = DEFAULT_TILE_SKIN_ID, sizePx = 48, uid = 'preview' }) => {
  const tierInfo = getTierInfo(tier, skinId);
  const skin = getTileSkinById(skinId);
  const gradId = `hexPrevGrad-${uid}-${skinId}-${tier}`;

  return (
    <svg
      width={sizePx}
      height={Math.round(sizePx * 1.12)}
      viewBox="0 0 100 115"
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
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
        opacity="0.5"
      />

      {/* Layer 1: Upper Ridge */}
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
        opacity="0.62"
      />

      {/* Top Glossy Hex Face */}
      <polygon
        points="50,3 93,28 93,78 50,103 7,78 7,28"
        fill={`url(#${gradId})`}
        stroke={skin.rimStroke}
        strokeWidth="2"
      />

      {/* Top Specular Arc */}
      <polygon
        points="50,8 88,30 88,73 50,96 12,73 12,30"
        fill="none"
        stroke={skin.specularStroke}
        strokeWidth="1.5"
        strokeDasharray="26 36"
      />

      {/* Embossed Symbol */}
      {renderEmbossedSymbol(tierInfo.symbolType, 50, 52, 34, tierInfo.ridgeColor)}
    </svg>
  );
});

interface HexagonGridProps {
  radius: number;
  blockedCoords?: HexCoord[];
  tiles: BoardTile[];
  selectedCoord: HexCoord | null;
  validTargets: HexCoord[];
  hint: HintSuggestion | null;
  onTileSelect: (coord: HexCoord) => void;
  onCellClick: (coord: HexCoord) => void;
  isMerging: boolean;
  isShaking?: boolean;
  sparkles?: SparkleParticle[];
  hoverDropCoord?: HexCoord | null;
  draggingTier?: TileTier | null;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  tileSkinId?: string;
  backgroundId?: string;
  graphicsQuality?: GraphicsQuality;
}

const HexagonGridInner: React.FC<HexagonGridProps> = ({
  radius,
  blockedCoords = [],
  tiles,
  selectedCoord,
  validTargets,
  hint,
  onTileSelect,
  onCellClick,
  isShaking = false,
  sparkles = [],
  hoverDropCoord = null,
  draggingTier = null,
  svgRef,
  tileSkinId = DEFAULT_TILE_SKIN_ID,
  backgroundId = DEFAULT_BACKGROUND_ID,
  graphicsQuality = 'high',
}) => {
  const gridCoords = useMemo(() => {
    return generateGridCoords(radius, blockedCoords);
  }, [radius, blockedCoords]);

  const tilesMap = useMemo(() => {
    const map = new Map<string, BoardTile>();
    tiles.forEach(t => map.set(hexKey(t.q, t.r), t));
    return map;
  }, [tiles]);

  const validTargetsSet = useMemo(() => {
    return new Set(validTargets.map(c => hexKey(c.q, c.r)));
  }, [validTargets]);

  const skin = useMemo(() => getTileSkinById(tileSkinId), [tileSkinId]);
  const bgTheme = useMemo(() => getBackgroundById(backgroundId), [backgroundId]);

  const hexSize = radius === 2 ? 46 : 38;
  const svgWidth = 400;
  const svgHeight = 425;
  const center = useMemo(() => ({ x: svgWidth / 2, y: svgHeight / 2 - 4 }), []);

  const getPointsStr = (c: { x: number; y: number }, size: number) => {
    return getHexCornerPoints(c, size)
      .map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
      .join(' ');
  };

  // Precompute static base socket polygons for 60 FPS frame budget
  const precomputedSockets = useMemo(() => {
    return gridCoords.map(coord => {
      const key = hexKey(coord.q, coord.r);
      const pos = hexToPixel(coord, hexSize, center);
      return {
        coord,
        key,
        pos,
        shadowPts: getPointsStr({ x: pos.x, y: pos.y + 2 }, hexSize - 3),
        mainPts: getPointsStr(pos, hexSize - 3),
        bevelPts: getPointsStr(pos, hexSize - 5),
      };
    });
  }, [gridCoords, hexSize, center]);

  const useSvgDropShadow = graphicsQuality !== 'low';
  const showSpecularArc = graphicsQuality !== 'low';

  return (
    <div
      className={`relative w-full max-w-[390px] mx-auto aspect-square flex items-center justify-center select-none touch-none ${
        isShaking ? 'animate-shake' : ''
      }`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`w-full h-full overflow-visible ${
          graphicsQuality === 'high' ? 'drop-shadow-[0_18px_36px_rgba(0,0,0,0.65)]' : ''
        }`}
      >
        <defs>
          <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#0284C7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="hintGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {([1, 2, 3, 4, 5, 6] as TileTier[]).map(tier => {
            const info = getTierInfo(tier, tileSkinId);
            return (
              <React.Fragment key={`tier-defs-${tileSkinId}-${tier}`}>
                <linearGradient
                  id={`tierFaceGrad-${tier}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={info.lightColor} />
                  <stop offset="25%" stopColor={info.color} />
                  <stop offset="85%" stopColor={info.shadowColor} />
                  <stop offset="100%" stopColor="#050811" />
                </linearGradient>
              </React.Fragment>
            );
          })}

          {useSvgDropShadow && (
            <>
              <filter id="hex3DShadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow dx="0" dy="6" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.6" />
              </filter>
              <filter id="hexLiftedShadow" x="-40%" y="-40%" width="180%" height="190%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </>
          )}
        </defs>

        {/* 1. Base Grid Slots / Empty Sockets */}
        {precomputedSockets.map(({ coord, key, pos, shadowPts, mainPts, bevelPts }) => {
          const isTarget = validTargetsSet.has(key);
          const isHintTarget = hint && coord.q === hint.to.q && coord.r === hint.to.r;
          const isHoverDrop =
            hoverDropCoord && coord.q === hoverDropCoord.q && coord.r === hoverDropCoord.r;
          const hasTile = tilesMap.has(key);

          return (
            <g
              key={`base-${key}`}
              onClick={() => onCellClick(coord)}
              className="cursor-pointer"
            >
              <polygon points={shadowPts} fill="#050811" opacity="0.82" />

              <polygon
                points={mainPts}
                fill={
                  isHoverDrop
                    ? 'rgba(56, 189, 248, 0.45)'
                    : isTarget
                    ? 'rgba(14, 165, 233, 0.35)'
                    : bgTheme.socketFill
                }
                stroke={
                  isHintTarget
                    ? '#FBBF24'
                    : isHoverDrop
                    ? '#38BDF8'
                    : isTarget
                    ? '#38BDF8'
                    : bgTheme.socketStroke
                }
                strokeWidth={isHintTarget || isHoverDrop ? 2.8 : isTarget ? 2.2 : 1.4}
                strokeDasharray={isTarget ? '5 2.5' : undefined}
              />

              <polygon
                points={bevelPts}
                fill="none"
                stroke="rgba(0, 0, 0, 0.38)"
                strokeWidth="1"
              />

              {isTarget && !hasTile && (
                <g>
                  <circle cx={pos.x} cy={pos.y} r={hexSize * 0.72} fill="url(#targetGlow)" />
                  <circle cx={pos.x} cy={pos.y} r={3.5} fill="#E0F2FE" />
                </g>
              )}

              {isHintTarget && (
                <circle cx={pos.x} cy={pos.y} r={hexSize * 0.78} fill="url(#hintGlow)" />
              )}

              {isHoverDrop && draggingTier && !hasTile && (
                <polygon
                  points={mainPts}
                  fill={`url(#tierFaceGrad-${draggingTier})`}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  opacity="0.68"
                />
              )}
            </g>
          );
        })}

        {/* 2. Thick 3D Hexagonal Tiles Layer with Horizontal Layered Ridges */}
        {tiles.map(tile => {
          const pos = hexToPixel({ q: tile.q, r: tile.r }, hexSize, center);
          const isSelected =
            selectedCoord && selectedCoord.q === tile.q && selectedCoord.r === tile.r;
          const isHintSource =
            hint &&
            hint.sourceType === 'board' &&
            hint.from &&
            tile.q === hint.from.q &&
            tile.r === hint.from.r;
          const tierInfo = getTierInfo(tile.tier, tileSkinId);

          const liftY = isSelected ? -8 : 0;
          const totalExtrusion = isSelected ? 15 : 11;
          const currentSize = isSelected ? hexSize - 1 : hexSize - 3;

          const ridge3Y = liftY + totalExtrusion;
          const ridge2Y = liftY + totalExtrusion * 0.68;
          const ridge1Y = liftY + totalExtrusion * 0.35;

          return (
            <g
              key={tile.id}
              onClick={() => onTileSelect({ q: tile.q, r: tile.r })}
              className={`cursor-pointer ${
                tile.isMerging ? 'animate-pop-merge' : 'animate-tile-bounce'
              }`}
              style={{
                transformOrigin: `${pos.x}px ${pos.y}px`,
                filter: useSvgDropShadow
                  ? isSelected
                    ? 'url(#hexLiftedShadow)'
                    : 'url(#hex3DShadow)'
                  : undefined,
              }}
            >
              {isSelected && (
                <polygon
                  points={getPointsStr({ x: pos.x, y: pos.y + liftY }, currentSize + 4)}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3.2"
                />
              )}

              {isHintSource && !isSelected && (
                <polygon
                  points={getPointsStr(pos, currentSize + 3)}
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Layer 3: Bottom-most Layer Ridge */}
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + ridge3Y }, currentSize)}
                fill={tierInfo.ridgeColor}
                stroke="#020617"
                strokeWidth="1.2"
              />

              {/* Layer 2: Middle Ridge */}
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + ridge2Y }, currentSize)}
                fill={tierInfo.shadowColor}
                stroke={tierInfo.ridgeColor}
                strokeWidth="0.8"
              />
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + ridge2Y - 1 }, currentSize)}
                fill="none"
                stroke={tierInfo.ridgeHighlight}
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Layer 1: Upper Ridge */}
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + ridge1Y }, currentSize)}
                fill={tierInfo.color}
                stroke={tierInfo.shadowColor}
                strokeWidth="0.8"
              />
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + ridge1Y - 1 }, currentSize)}
                fill="none"
                stroke={tierInfo.lightColor}
                strokeWidth="1.2"
                opacity="0.65"
              />

              {/* Main Top Glossy Hexagon Face */}
              <polygon
                points={getPointsStr({ x: pos.x, y: pos.y + liftY }, currentSize)}
                fill={`url(#tierFaceGrad-${tile.tier})`}
                stroke={skin.rimStroke}
                strokeWidth="1.7"
              />

              {/* Top Specular Curved Highlight Arc */}
              {showSpecularArc && (
                <polygon
                  points={getPointsStr({ x: pos.x, y: pos.y + liftY - 1.5 }, currentSize * 0.85)}
                  fill="none"
                  stroke={skin.specularStroke}
                  strokeWidth="1.4"
                  strokeDasharray="24 38"
                />
              )}

              {/* Embossed Symbol Inset */}
              {renderEmbossedSymbol(
                tierInfo.symbolType,
                pos.x,
                pos.y + liftY - (tile.tier === 6 ? 1 : 2),
                hexSize * 0.62,
                tierInfo.ridgeColor
              )}

              {/* Tier Number Label */}
              <text
                x={pos.x}
                y={pos.y + liftY + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255, 255, 255, 0.95)"
                fontSize="10"
                fontWeight="900"
                fontFamily="Outfit, system-ui, sans-serif"
                className="select-none pointer-events-none"
              >
                T{tile.tier}
              </text>
            </g>
          );
        })}

        {/* 3. Dynamic Sparkle Particles Burst (scaled by graphicsQuality) */}
        {graphicsQuality !== 'low' &&
          sparkles.map(sp => (
            <g
              key={sp.id}
              className="animate-sparkle pointer-events-none"
              style={{
                ['--tx' as string]: `${sp.tx}px`,
                ['--ty' as string]: `${sp.ty}px`,
              }}
            >
              <circle cx={sp.x} cy={sp.y} r={sp.size} fill={sp.color} />
            </g>
          ))}
      </svg>
    </div>
  );
};

export const HexagonGrid = React.memo(HexagonGridInner);
