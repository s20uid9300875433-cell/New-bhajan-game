import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Home,
  Pause,
  Settings as SettingsIcon,
  RotateCcw,
  Undo2,
  Lightbulb,
  Award,
  Info,
  Target,
  Coins,
} from 'lucide-react';
import {
  BoardTile,
  HexCoord,
  LevelConfig,
  LevelRewardBreakdown,
  MoveStep,
  SavedLevelSession,
  ShopCategory,
  TileTier,
  TrayBlock,
  UserProgress,
} from '../types/game';
import { getLevelConfig } from '../data/levels';
import { getBackgroundById } from '../data/shopCatalog';
import { HexagonGrid, SparkleParticle, StackedHexPreview } from './HexagonGrid';
import { BlockTray } from './BlockTray';
import { PauseModal } from './PauseModal';
import { VictoryModal } from './VictoryModal';
import { GameOverModal } from './GameOverModal';
import {
  findConnectedGroup,
  generateGridCoords,
  getNeighbors,
  hexKey,
  areCoordsEqual,
  hexToPixel,
  pixelToHex,
} from '../utils/hexMath';
import { audioManager } from '../utils/audioManager';
import { findBestMoveHint, HintSuggestion } from '../utils/solver';
import {
  claimUniqueBonusReward,
  completeLevelAndSave,
  saveActiveLevelSession,
  saveUserProgress,
} from '../utils/storage';
import { adManager } from '../utils/adManager';
import { getTierInfo } from '../data/tiers';

interface GameScreenProps {
  levelId: number;
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  onExitToLevelSelect: () => void;
  onExitToHome: () => void;
  onOpenShop: (category?: ShopCategory) => void;
  onOpenSettings: () => void;
  onSelectLevel: (nextLevelId: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  levelId,
  progress,
  onUpdateProgress,
  onExitToLevelSelect,
  onExitToHome,
  onOpenShop,
  onOpenSettings,
  onSelectLevel,
}) => {
  const levelConfig: LevelConfig = useMemo(() => getLevelConfig(levelId), [levelId]);
  const progressRef = useRef<UserProgress>(progress);
  progressRef.current = progress;

  const activeBg = useMemo(
    () => getBackgroundById(progress.selectedBackground),
    [progress.selectedBackground]
  );

  // Board State
  const [tiles, setTiles] = useState<BoardTile[]>([]);
  const [selectedCoord, setSelectedCoord] = useState<HexCoord | null>(null);
  const [validTargets, setValidTargets] = useState<HexCoord[]>([]);
  const [movesLeft, setMovesLeft] = useState(levelConfig.moveLimit);
  const [score, setScore] = useState(0);
  const [mergesCount, setMergesCount] = useState(0);
  const [highestTier, setHighestTier] = useState<TileTier>(1);
  const [undoStack, setUndoStack] = useState<MoveStep[]>([]);
  const [activeHint, setActiveHint] = useState<HintSuggestion | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [tipDismissed, setTipDismissed] = useState(false);

  // Bottom Block Tray State & Drag-and-Drop
  const [trayBlocks, setTrayBlocks] = useState<TrayBlock[]>([]);
  const [selectedTrayBlockId, setSelectedTrayBlockId] = useState<string | null>(null);
  const [dealCount, setDealCount] = useState(0);
  const [isDraggingFromTray, setIsDraggingFromTray] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<TrayBlock | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverDropCoord, setHoverDropCoord] = useState<HexCoord | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Modals & Completion Rewards
  const [isPaused, setIsPaused] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [rewardBreakdown, setRewardBreakdown] = useState<LevelRewardBreakdown | null>(null);
  const [bonusAdClaimed, setBonusAdClaimed] = useState(false);

  // Ensure selected background music track plays during gameplay when music is enabled
  useEffect(() => {
    audioManager.setSelectedTrack(progress.selectedMusicTrack);
    if (progress.musicEnabled) {
      audioManager.startBackgroundMusic();
    }
  }, [progress.selectedMusicTrack, progress.musicEnabled]);

  // Helper to generate 3 balanced tray blocks for the level
  const generateTrayForLevel = useCallback(
    (level: LevelConfig, currentTiles: BoardTile[], dealIdx: number): TrayBlock[] => {
      let maxPossibleTier = 3;
      if (level.difficulty === 'Normal' || level.difficulty === 'Tutorial') {
        maxPossibleTier = 3;
      } else if (level.difficulty === 'Hard') {
        maxPossibleTier = 4;
      } else {
        maxPossibleTier = 5;
      }

      const boardTiers = currentTiles.map(t => t.tier);
      const distinctBoardTiers = Array.from(new Set(boardTiers));

      const result: TrayBlock[] = [];
      for (let i = 0; i < 3; i++) {
        let chosenTier: TileTier = 1;
        if (distinctBoardTiers.length > 0 && Math.random() < 0.75) {
          const picked = distinctBoardTiers[Math.floor(Math.random() * distinctBoardTiers.length)];
          chosenTier = Math.min(picked, maxPossibleTier) as TileTier;
        } else {
          chosenTier = (Math.floor(Math.random() * maxPossibleTier) + 1) as TileTier;
        }

        result.push({
          id: `tray-${level.id}-${dealIdx}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tier: chosenTier,
          isUsed: false,
        });
      }
      return result;
    },
    []
  );

  // Initialize or Restore Saved Level Session
  const initLevel = useCallback(
    (forceFresh: boolean = false) => {
      const saved = progressRef.current.savedActiveLevel;
      if (!forceFresh && saved && saved.levelId === levelId && saved.tiles.length > 0) {
        setTiles(saved.tiles);
        setTrayBlocks(saved.trayBlocks);
        setMovesLeft(saved.movesLeft);
        setScore(saved.score);
        setMergesCount(saved.mergesCount);
        setHighestTier(saved.highestTier);
        setDealCount(saved.dealCount);
        setUndoStack(saved.undoStack || []);
        setSelectedTrayBlockId(null);
        setSelectedCoord(null);
        setValidTargets([]);
        setIsDraggingFromTray(false);
        setDraggedBlock(null);
        setDragPointerPos(null);
        setHoverDropCoord(null);
        setActiveHint(null);
        setIsMerging(false);
        setIsShaking(false);
        setSparkles([]);
        setIsPaused(false);
        setIsVictory(false);
        setIsGameOver(false);
        setRewardBreakdown(null);
        setBonusAdClaimed(false);
        return;
      }

      if (forceFresh && saved && saved.levelId === levelId) {
        const cleared = saveActiveLevelSession(progressRef.current, null);
        onUpdateProgress(cleared);
      }

      const initialBoard: BoardTile[] = levelConfig.initialTiles.map((t, idx) => ({
        id: `tile-${levelId}-${idx}-${Date.now()}-${Math.random()}`,
        q: t.q,
        r: t.r,
        tier: t.tier,
      }));

      let maxTier: TileTier = 1;
      initialBoard.forEach(t => {
        if (t.tier > maxTier) maxTier = t.tier;
      });

      const initialTray = generateTrayForLevel(levelConfig, initialBoard, 0);

      setTiles(initialBoard);
      setTrayBlocks(initialTray);
      setSelectedTrayBlockId(null);
      setSelectedCoord(null);
      setValidTargets([]);
      setIsDraggingFromTray(false);
      setDraggedBlock(null);
      setDragPointerPos(null);
      setHoverDropCoord(null);
      setDealCount(1);
      setMovesLeft(levelConfig.moveLimit);
      setScore(0);
      setMergesCount(0);
      setHighestTier(maxTier);
      setUndoStack([]);
      setActiveHint(null);
      setIsMerging(false);
      setIsShaking(false);
      setSparkles([]);
      setIsPaused(false);
      setIsVictory(false);
      setIsGameOver(false);
      setTipDismissed(false);
      setRewardBreakdown(null);
      setBonusAdClaimed(false);
    },
    [levelConfig, levelId, generateTrayForLevel, onUpdateProgress]
  );

  useEffect(() => {
    initLevel(false);
  }, [initLevel]);

  // Save active level session before navigating to Home, Map, or Shop
  const saveCurrentLevelAndNavigate = useCallback(
    (navigateFn: () => void) => {
      if (!isVictory && !isGameOver && tiles.length > 0 && movesLeft > 0) {
        const session: SavedLevelSession = {
          levelId,
          tiles,
          trayBlocks,
          movesLeft,
          score,
          mergesCount,
          highestTier,
          dealCount,
          undoStack: undoStack.slice(-15),
          savedAt: Date.now(),
        };
        const updated = saveActiveLevelSession(progressRef.current, session);
        onUpdateProgress(updated);
      }
      navigateFn();
    },
    [
      isVictory,
      isGameOver,
      tiles,
      movesLeft,
      levelId,
      trayBlocks,
      score,
      mergesCount,
      highestTier,
      dealCount,
      undoStack,
      onUpdateProgress,
    ]
  );

  const validCoords = useMemo(() => {
    return generateGridCoords(levelConfig.radius, levelConfig.blockedCoords);
  }, [levelConfig.radius, levelConfig.blockedCoords]);

  const tilesMap = useMemo(() => {
    const map = new Map<string, BoardTile>();
    tiles.forEach(t => map.set(hexKey(t.q, t.r), t));
    return map;
  }, [tiles]);

  const checkObjectiveMet = useCallback(
    (currentHighestTier: TileTier, currentScore: number, currentMerges: number): boolean => {
      const obj = levelConfig.objective;
      switch (obj.type) {
        case 'reach_tier':
          return currentHighestTier >= (obj.targetTier || 3);
        case 'merge_count':
          return currentMerges >= (obj.count || 1);
        case 'target_score':
          return currentScore >= (obj.targetScore || 500);
        default:
          return false;
      }
    },
    [levelConfig.objective]
  );

  const handleVictory = useCallback(
    (finalMovesLeft: number, finalScore: number) => {
      let stars = 1;
      if (finalMovesLeft >= levelConfig.starThresholds.threeStars) {
        stars = 3;
      } else if (finalMovesLeft >= levelConfig.starThresholds.twoStars) {
        stars = 2;
      }

      const { updatedProgress, reward } = completeLevelAndSave(
        progressRef.current,
        levelId,
        stars,
        finalScore,
        finalMovesLeft
      );

      setStarsEarned(stars);
      setCoinsEarned(reward.totalCoins);
      setRewardBreakdown(reward);
      setBonusAdClaimed(false);
      setIsVictory(true);
      onUpdateProgress(updatedProgress);
    },
    [levelConfig, levelId, onUpdateProgress]
  );

  const triggerInvalidFeedback = () => {
    audioManager.playInvalidMove();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 260);
  };

  // Respect Graphics Quality (Low = 0, Medium = 6, High = 12 particles) for 60 FPS
  const emitSparkles = (coord: HexCoord, color: string) => {
    const quality = progressRef.current.graphicsQuality;
    if (quality === 'low') return;

    const particleCount = quality === 'medium' ? 6 : 12;
    const hexSize = levelConfig.radius === 2 ? 46 : 38;
    const center = { x: 200, y: 208 };
    const pos = hexToPixel(coord, hexSize, center);

    const newParticles: SparkleParticle[] = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const dist = 30 + Math.random() * 35;
      return {
        id: `sparkle-${Date.now()}-${i}-${Math.random()}`,
        x: pos.x,
        y: pos.y,
        color,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size: 2.5 + Math.random() * 2.5,
      };
    });

    setSparkles(newParticles);
    setTimeout(() => setSparkles([]), 620);
  };

  // Tile Selection Handler (for sliding moves on the board)
  const handleTileSelect = (coord: HexCoord) => {
    if (isMerging || isVictory || isGameOver) return;
    audioManager.playSelect();

    setSelectedTrayBlockId(null);

    if (selectedCoord && areCoordsEqual(selectedCoord, coord)) {
      setSelectedCoord(null);
      setValidTargets([]);
      return;
    }

    setSelectedCoord(coord);
    setActiveHint(null);

    const neighbors = getNeighbors(coord);
    const validSet = new Set(validCoords.map(c => hexKey(c.q, c.r)));
    const openNeighbors = neighbors.filter(nb => {
      const key = hexKey(nb.q, nb.r);
      return validSet.has(key) && !tilesMap.has(key);
    });

    setValidTargets(openNeighbors);
  };

  // Tray Block Drag & Drop Handlers
  const handleTrayDragStart = (block: TrayBlock, startX: number, startY: number) => {
    if (isMerging || isVictory || isGameOver || block.isUsed) return;
    setIsDraggingFromTray(true);
    setDraggedBlock(block);
    setDragPointerPos({ x: startX, y: startY });
    setSelectedCoord(null);
    setSelectedTrayBlockId(block.id);
    setActiveHint(null);
  };

  const handleTrayDragMove = (currentX: number, currentY: number) => {
    if (!isDraggingFromTray) return;
    setDragPointerPos({ x: currentX, y: currentY });

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      if (
        currentX >= rect.left &&
        currentX <= rect.right &&
        currentY >= rect.top &&
        currentY <= rect.bottom
      ) {
        const svgX = ((currentX - rect.left) / rect.width) * 400;
        const svgY = ((currentY - rect.top) / rect.height) * 425;
        const hexSize = levelConfig.radius === 2 ? 46 : 38;
        const center = { x: 200, y: 208.5 };
        const coord = pixelToHex({ x: svgX, y: svgY }, hexSize, center);

        const coordKey = hexKey(coord.q, coord.r);
        const isValidCell = validCoords.some(c => areCoordsEqual(c, coord));
        const isOccupied = tilesMap.has(coordKey);

        if (isValidCell && !isOccupied) {
          setHoverDropCoord(coord);
          return;
        }
      }
    }
    setHoverDropCoord(null);
  };

  const handleTrayDragEnd = (endX: number, endY: number) => {
    if (!isDraggingFromTray || !draggedBlock) {
      setIsDraggingFromTray(false);
      setDraggedBlock(null);
      setDragPointerPos(null);
      setHoverDropCoord(null);
      return;
    }

    const targetCoord = hoverDropCoord;
    const currentBlock = draggedBlock;

    setIsDraggingFromTray(false);
    setDraggedBlock(null);
    setDragPointerPos(null);
    setHoverDropCoord(null);

    if (targetCoord) {
      handlePlaceTrayBlock(currentBlock.id, targetCoord);
    } else if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      if (
        endX >= rect.left &&
        endX <= rect.right &&
        endY >= rect.top &&
        endY <= rect.bottom
      ) {
        triggerInvalidFeedback();
      }
    }
  };

  // Tap-to-Select Tray Block
  const handleSelectTrayBlock = (blockId: string) => {
    if (isMerging || isVictory || isGameOver) return;

    if (selectedTrayBlockId === blockId) {
      setSelectedTrayBlockId(null);
      setValidTargets([]);
    } else {
      setSelectedTrayBlockId(blockId);
      setSelectedCoord(null);
      setActiveHint(null);
      const emptyCells = validCoords.filter(c => !tilesMap.has(hexKey(c.q, c.r)));
      setValidTargets(emptyCells);
    }
  };

  // Recursive merge cascade processor
  const processMerges = (
    startCoord: HexCoord,
    currentTiles: BoardTile[],
    currentScore: number,
    currentMerges: number,
    currentHighestTier: TileTier,
    combo: number
  ): {
    updatedTiles: BoardTile[];
    addedScore: number;
    totalMerges: number;
    newHighestTier: TileTier;
  } => {
    const curMap = new Map<string, BoardTile>();
    currentTiles.forEach(t => curMap.set(hexKey(t.q, t.r), t));

    const group = findConnectedGroup(startCoord, curMap);
    if (group.length < 3) {
      return {
        updatedTiles: currentTiles,
        addedScore: 0,
        totalMerges: currentMerges,
        newHighestTier: currentHighestTier,
      };
    }

    const groupTier = group[0].tier;
    const nextTier = Math.min(groupTier + 1, 6) as TileTier;
    const groupIds = new Set(group.map(g => g.id));

    audioManager.playMerge(groupTier, combo);
    emitSparkles(startCoord, getTierInfo(nextTier, progressRef.current.selectedTileSkin).color);

    const remainingTiles = currentTiles.filter(t => !groupIds.has(t.id));
    const upgradedTile: BoardTile = {
      id: `tile-merged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      q: startCoord.q,
      r: startCoord.r,
      tier: nextTier,
      isMerging: true,
    };
    remainingTiles.push(upgradedTile);

    const tierScoreVal = getTierInfo(groupTier).scoreValue;
    const pointsGained = group.length * tierScoreVal * combo;
    const newHighest = Math.max(currentHighestTier, nextTier) as TileTier;
    const newMerges = currentMerges + 1;

    const cascadeResult = processMerges(
      startCoord,
      remainingTiles,
      currentScore + pointsGained,
      newMerges,
      newHighest,
      combo + 1
    );

    return {
      updatedTiles: cascadeResult.updatedTiles,
      addedScore: pointsGained + cascadeResult.addedScore,
      totalMerges: cascadeResult.totalMerges,
      newHighestTier: cascadeResult.newHighestTier,
    };
  };

  // Place a block from tray onto the board
  const handlePlaceTrayBlock = (blockId: string, destCoord: HexCoord) => {
    if (isMerging || isVictory || isGameOver) return;

    const block = trayBlocks.find(b => b.id === blockId && !b.isUsed);
    if (!block) return;

    const destKey = hexKey(destCoord.q, destCoord.r);
    const isValidCell = validCoords.some(c => areCoordsEqual(c, destCoord));
    const isOccupied = tilesMap.has(destKey);

    if (!isValidCell || isOccupied) {
      triggerInvalidFeedback();
      return;
    }

    const step: MoveStep = {
      type: 'placement',
      to: { ...destCoord },
      tileTier: block.tier,
      boardSnapshot: tiles.map(t => ({ q: t.q, r: t.r, tier: t.tier, id: t.id })),
      traySnapshot: trayBlocks.map(b => ({ ...b })),
      scoreSnapshot: score,
      movesSnapshot: movesLeft,
      mergesSnapshot: mergesCount,
      highestTierSnapshot: highestTier,
    };
    setUndoStack(prev => [...prev, step]);

    audioManager.playMove();
    const newMovesLeft = movesLeft - 1;
    setMovesLeft(newMovesLeft);

    const placedTile: BoardTile = {
      id: `tile-placed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      q: destCoord.q,
      r: destCoord.r,
      tier: block.tier,
      isNew: true,
    };
    const updatedTilesList = [...tiles, placedTile];

    const updatedTray = trayBlocks.map(b => (b.id === blockId ? { ...b, isUsed: true } : b));
    setTrayBlocks(updatedTray);
    setSelectedTrayBlockId(null);
    setValidTargets([]);
    setActiveHint(null);

    const allUsed = updatedTray.every(b => b.isUsed);
    if (allUsed) {
      const nextDeal = dealCount + 1;
      setDealCount(nextDeal);
      setTimeout(() => {
        audioManager.playSuccess();
        setTrayBlocks(generateTrayForLevel(levelConfig, updatedTilesList, nextDeal));
      }, 320);
    }

    setIsMerging(true);
    const { updatedTiles, addedScore, totalMerges, newHighestTier } = processMerges(
      destCoord,
      updatedTilesList,
      score,
      mergesCount,
      highestTier,
      1
    );

    const newScore = score + addedScore;
    setTiles(updatedTiles);
    setScore(newScore);
    setMergesCount(totalMerges);
    setHighestTier(newHighestTier);

    setTimeout(() => {
      setIsMerging(false);
      setTiles(prev => prev.map(t => ({ ...t, isMerging: false, isNew: false })));

      const won = checkObjectiveMet(newHighestTier, newScore, totalMerges);
      if (won) {
        handleVictory(newMovesLeft, newScore);
      } else if (newMovesLeft <= 0) {
        setIsGameOver(true);
      }
    }, 300);
  };

  // Cell Click (Move destination, Tray placement destination, or tile selection)
  const handleCellClick = (destCoord: HexCoord) => {
    if (isMerging || isVictory || isGameOver) return;

    if (selectedTrayBlockId) {
      const destKey = hexKey(destCoord.q, destCoord.r);
      const isOccupied = tilesMap.has(destKey);
      if (isOccupied) {
        handleTileSelect(destCoord);
      } else {
        handlePlaceTrayBlock(selectedTrayBlockId, destCoord);
      }
      return;
    }

    if (selectedCoord) {
      const isTarget = validTargets.some(t => areCoordsEqual(t, destCoord));
      if (!isTarget) {
        if (tilesMap.has(hexKey(destCoord.q, destCoord.r))) {
          handleTileSelect(destCoord);
        } else {
          triggerInvalidFeedback();
          setSelectedCoord(null);
          setValidTargets([]);
        }
        return;
      }

      const movingTile = tiles.find(t => areCoordsEqual({ q: t.q, r: t.r }, selectedCoord));
      if (!movingTile) return;

      const step: MoveStep = {
        type: 'slide',
        from: { ...selectedCoord },
        to: { ...destCoord },
        tileTier: movingTile.tier,
        boardSnapshot: tiles.map(t => ({ q: t.q, r: t.r, tier: t.tier, id: t.id })),
        traySnapshot: trayBlocks.map(b => ({ ...b })),
        scoreSnapshot: score,
        movesSnapshot: movesLeft,
        mergesSnapshot: mergesCount,
        highestTierSnapshot: highestTier,
      };
      setUndoStack(prev => [...prev, step]);

      audioManager.playMove();
      const newMovesLeft = movesLeft - 1;
      setMovesLeft(newMovesLeft);

      const movedTiles = tiles.map(t => {
        if (t.id === movingTile.id) {
          return { ...t, q: destCoord.q, r: destCoord.r, isMerging: false };
        }
        return t;
      });

      setSelectedCoord(null);
      setValidTargets([]);
      setActiveHint(null);

      setIsMerging(true);
      const { updatedTiles, addedScore, totalMerges, newHighestTier } = processMerges(
        destCoord,
        movedTiles,
        score,
        mergesCount,
        highestTier,
        1
      );

      const newScore = score + addedScore;
      setTiles(updatedTiles);
      setScore(newScore);
      setMergesCount(totalMerges);
      setHighestTier(newHighestTier);

      setTimeout(() => {
        setIsMerging(false);
        setTiles(prev => prev.map(t => ({ ...t, isMerging: false })));

        const won = checkObjectiveMet(newHighestTier, newScore, totalMerges);
        if (won) {
          handleVictory(newMovesLeft, newScore);
        } else if (newMovesLeft <= 0) {
          setIsGameOver(true);
        }
      }, 300);
      return;
    }

    if (tilesMap.has(hexKey(destCoord.q, destCoord.r))) {
      handleTileSelect(destCoord);
    } else {
      triggerInvalidFeedback();
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || isMerging) return;
    audioManager.playUndo();

    const lastStep = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    const restoredBoard = lastStep.boardSnapshot.map(s => ({
      id: s.id,
      q: s.q,
      r: s.r,
      tier: s.tier,
    }));

    setTiles(restoredBoard);
    if (lastStep.traySnapshot) {
      setTrayBlocks(lastStep.traySnapshot);
    }
    setScore(lastStep.scoreSnapshot);
    setMovesLeft(lastStep.movesSnapshot);
    if (typeof lastStep.mergesSnapshot === 'number') {
      setMergesCount(lastStep.mergesSnapshot);
    }
    if (lastStep.highestTierSnapshot) {
      setHighestTier(lastStep.highestTierSnapshot);
    }
    setSelectedCoord(null);
    setSelectedTrayBlockId(null);
    setValidTargets([]);
    setActiveHint(null);
    setIsGameOver(false);
  };

  const handleRequestHint = () => {
    if (isMerging || isVictory || isGameOver) return;

    const executeHint = () => {
      const suggestion = findBestMoveHint(validCoords, tiles, trayBlocks);
      if (suggestion) {
        audioManager.playHint();
        setActiveHint(suggestion);
        if (suggestion.sourceType === 'tray' && suggestion.trayBlockId) {
          setSelectedTrayBlockId(suggestion.trayBlockId);
          setSelectedCoord(null);
          setValidTargets([suggestion.to]);
        } else if (suggestion.from) {
          setSelectedCoord(suggestion.from);
          setSelectedTrayBlockId(null);
          setValidTargets([suggestion.to]);
        }
      }
    };

    if (progressRef.current.hintsRemaining > 0) {
      executeHint();
      const updated = {
        ...progressRef.current,
        hintsRemaining: progressRef.current.hintsRemaining - 1,
      };
      saveUserProgress(updated);
      onUpdateProgress(updated);
    } else {
      adManager.showRewardedAd({ type: 'hint', amount: 1 }, claimToken => {
        const res = claimUniqueBonusReward(progressRef.current, claimToken, 0, 0, 1);
        if (res.success) {
          // Consume the granted hint immediately to show the best move
          const afterConsume = {
            ...res.updatedProgress,
            hintsRemaining: Math.max(0, res.updatedProgress.hintsRemaining - 1),
          };
          saveUserProgress(afterConsume);
          onUpdateProgress(afterConsume);
          executeHint();
        }
      });
    }
  };

  const handleAdExtraMoves = () => {
    adManager.showRewardedAd({ type: 'extra_moves', amount: 3 }, claimToken => {
      const res = claimUniqueBonusReward(progressRef.current, claimToken, 0, 0, 0);
      if (res.success) {
        onUpdateProgress(res.updatedProgress);
        setMovesLeft(prev => prev + 3);
        setIsGameOver(false);
      }
    });
  };

  const handleClaimVictoryBonusAd = () => {
    if (bonusAdClaimed) return;
    adManager.showRewardedAd({ type: 'victory_bonus', amount: 75 }, claimToken => {
      const res = claimUniqueBonusReward(progressRef.current, claimToken, 75, 0, 0);
      if (res.success) {
        audioManager.playPurchase();
        setBonusAdClaimed(true);
        setCoinsEarned(prev => prev + 75);
        onUpdateProgress(res.updatedProgress);
      }
    });
  };

  const handleNextLevel = () => {
    setIsVictory(false);
    const nextId = levelId + 1;
    adManager.notifyLevelCompleted(levelId, () => {
      onSelectLevel(nextId);
    });
  };

  const obj = levelConfig.objective;
  let objectiveProgressText = '';
  if (obj.type === 'reach_tier') {
    const targetInfo = getTierInfo(obj.targetTier || 3, progress.selectedTileSkin);
    objectiveProgressText = `Current: T${highestTier} · Goal: T${obj.targetTier} (${targetInfo.name})`;
  } else if (obj.type === 'merge_count') {
    objectiveProgressText = `Merges: ${mergesCount} / ${obj.count}`;
  } else if (obj.type === 'target_score') {
    objectiveProgressText = `Score: ${score} / ${obj.targetScore}`;
  }

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        background: activeBg.fallbackGradient,
        backgroundImage: `url('${activeBg.imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Selected Theme Ambient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: activeBg.overlayGradient }}
      />

      {/* TOP GAMEPLAY HUD BAR (Home, Pause, Level, Coins, Settings, Score & Objective) */}
      <div className="w-full flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between gap-1.5">
          {/* Home & Pause Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                audioManager.playClick();
                saveCurrentLevelAndNavigate(onExitToHome);
              }}
              aria-label="Save and Go Home"
              className="min-h-[40px] min-w-[40px] p-2 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            >
              <Home className="w-4 h-4 text-cyan-300" />
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                setIsPaused(true);
              }}
              aria-label="Pause Game"
              className="min-h-[40px] min-w-[40px] p-2 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Level Number & Name */}
          <div className="flex flex-col items-center bg-slate-900/75 backdrop-blur-md border border-white/20 px-3 py-1 rounded-2xl shadow-lg min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-white whitespace-nowrap">
              <span>Level {levelId}</span>
              <span className="text-slate-400">·</span>
              <span className="text-[11px] font-bold text-amber-300">{levelConfig.difficulty}</span>
            </div>
            <span className="text-[10px] text-sky-200 font-medium truncate max-w-[125px]">
              {levelConfig.name}
            </span>
          </div>

          {/* Coin Balance & Settings Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                audioManager.playClick();
                saveCurrentLevelAndNavigate(() => onOpenShop('backgrounds'));
              }}
              aria-label="Open Shop"
              className="min-h-[40px] flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/75 hover:bg-slate-800 backdrop-blur-md border border-amber-400/35 text-amber-300 text-xs font-black shadow-lg active:scale-95 transition-all whitespace-nowrap"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="tabular-nums">{progress.coins.toLocaleString()}</span>
            </button>

            <button
              onClick={() => {
                audioManager.playClick();
                onOpenSettings();
              }}
              aria-label="Open Settings"
              className="min-h-[40px] min-w-[40px] p-2 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Moves Left & Score Strip */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className={`flex items-center justify-between px-3.5 py-1.5 rounded-2xl border transition-colors ${
              movesLeft <= 3
                ? 'bg-rose-950/85 border-rose-400 text-rose-200 shadow-lg'
                : 'bg-slate-900/70 backdrop-blur-md border-white/20 text-white shadow-lg'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-300">Moves Left</span>
            <span className="text-base font-black tabular-nums">{movesLeft}</span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/20 text-white shadow-lg">
            <span className="text-[11px] font-bold text-slate-300">Score</span>
            <span className="text-base font-black text-amber-300 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Objective Card */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-white shadow-xl gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold leading-tight truncate">{obj.description}</span>
              <span className="text-[10px] text-cyan-200 font-mono tabular-nums truncate">
                {objectiveProgressText}
              </span>
            </div>
          </div>

          {/* Star Threshold Preview */}
          <div className="flex items-center gap-0.5 shrink-0">
            {[1, 2, 3].map(starNum => {
              const req =
                starNum === 3
                  ? levelConfig.starThresholds.threeStars
                  : starNum === 2
                  ? levelConfig.starThresholds.twoStars
                  : 0;
              const isActive = movesLeft >= req;
              return (
                <Award
                  key={starNum}
                  className={`w-4 h-4 ${
                    isActive ? 'text-amber-300 fill-amber-300 drop-shadow' : 'text-slate-600'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Tutorial Guidance Tip */}
        {levelConfig.tutorialTip && !tipDismissed && (
          <div className="flex items-center justify-between p-2 bg-slate-900/85 backdrop-blur-md border border-cyan-400/50 rounded-2xl text-[11px] text-cyan-100 shadow-xl gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>{levelConfig.tutorialTip}</span>
            </div>
            <button
              onClick={() => setTipDismissed(true)}
              className="text-cyan-300 font-bold text-xs hover:text-white px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-400/40 shrink-0"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* CENTER 2.5D HEXAGON PLAYING FIELD */}
      <div className="my-auto w-full flex items-center justify-center py-0.5">
        <HexagonGrid
          radius={levelConfig.radius}
          blockedCoords={levelConfig.blockedCoords}
          tiles={tiles}
          selectedCoord={selectedCoord}
          validTargets={validTargets}
          hint={activeHint}
          onTileSelect={handleTileSelect}
          onCellClick={handleCellClick}
          isMerging={isMerging}
          isShaking={isShaking}
          sparkles={sparkles}
          hoverDropCoord={hoverDropCoord}
          draggingTier={
            draggedBlock?.tier ??
            (selectedTrayBlockId
              ? trayBlocks.find(b => b.id === selectedTrayBlockId)?.tier ?? null
              : null)
          }
          svgRef={svgRef}
          tileSkinId={progress.selectedTileSkin}
          backgroundId={progress.selectedBackground}
          graphicsQuality={progress.graphicsQuality}
        />
      </div>

      {/* BOTTOM COLOR BLOCK TRAY */}
      <div className="w-full my-0.5 z-10">
        <BlockTray
          blocks={trayBlocks}
          selectedBlockId={selectedTrayBlockId}
          onSelectBlock={handleSelectTrayBlock}
          onDragStart={handleTrayDragStart}
          onDragMove={handleTrayDragMove}
          onDragEnd={handleTrayDragEnd}
          disabled={isMerging || isVictory || isGameOver}
          tileSkinId={progress.selectedTileSkin}
          graphicsQuality={progress.graphicsQuality}
        />
      </div>

      {/* BOTTOM ACTION TOOLBAR */}
      <div className="w-full flex items-center justify-between gap-2 z-10 pt-1">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0 || isMerging}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all shadow-md whitespace-nowrap ${
            undoStack.length > 0 && !isMerging
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 active:scale-95'
              : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-4 h-4 shrink-0" />
          <span>Undo</span>
        </button>

        <button
          onClick={handleRequestHint}
          disabled={isMerging}
          className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all whitespace-nowrap"
        >
          <Lightbulb className="w-4 h-4 fill-slate-950 shrink-0" />
          <span>Hint · {progress.hintsRemaining > 0 ? progress.hintsRemaining : 'Ad'}</span>
        </button>

        <button
          onClick={() => {
            audioManager.playClick();
            initLevel(true);
          }}
          className="min-h-[44px] flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all shadow-md whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Restart</span>
        </button>
      </div>

      {/* GAMEPLAY MODALS */}
      <PauseModal
        isOpen={isPaused}
        levelNumber={levelId}
        soundEnabled={progress.soundEnabled}
        musicEnabled={progress.musicEnabled}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          setIsPaused(false);
          initLevel(true);
        }}
        onGoHome={() => {
          setIsPaused(false);
          saveCurrentLevelAndNavigate(onExitToHome);
        }}
        onLevelSelect={() => {
          setIsPaused(false);
          saveCurrentLevelAndNavigate(onExitToLevelSelect);
        }}
        onOpenShop={() => {
          setIsPaused(false);
          saveCurrentLevelAndNavigate(() => onOpenShop('backgrounds'));
        }}
        onOpenSettings={() => {
          onOpenSettings();
        }}
        onToggleSound={() => {
          const updated = { ...progressRef.current, soundEnabled: !progressRef.current.soundEnabled };
          saveUserProgress(updated);
          audioManager.setSoundEnabled(updated.soundEnabled);
          onUpdateProgress(updated);
        }}
        onToggleMusic={() => {
          const updated = { ...progressRef.current, musicEnabled: !progressRef.current.musicEnabled };
          saveUserProgress(updated);
          audioManager.setMusicEnabled(updated.musicEnabled);
          onUpdateProgress(updated);
        }}
      />

      <VictoryModal
        isOpen={isVictory}
        levelNumber={levelId}
        starsEarned={starsEarned}
        score={score}
        movesLeft={movesLeft}
        coinsEarned={coinsEarned}
        rewardBreakdown={rewardBreakdown}
        bonusAdClaimed={bonusAdClaimed}
        onClaimBonusAd={handleClaimVictoryBonusAd}
        onNextLevel={handleNextLevel}
        onReplay={() => initLevel(true)}
        onLevelSelect={onExitToLevelSelect}
        onOpenShop={() => {
          setIsVictory(false);
          onOpenShop('backgrounds');
        }}
      />

      <GameOverModal
        isOpen={isGameOver}
        levelNumber={levelId}
        canUndo={undoStack.length > 0}
        onRetry={() => initLevel(true)}
        onUndo={handleUndo}
        onWatchAdExtraMoves={handleAdExtraMoves}
        onLevelSelect={onExitToLevelSelect}
      />

      {/* FLOATING DRAG-AND-DROP PROXY (Equipped Tile Skin) */}
      {isDraggingFromTray && draggedBlock && dragPointerPos && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${dragPointerPos.x}px`, top: `${dragPointerPos.y}px` }}
        >
          <div className="w-16 h-16 drop-shadow-[0_18px_32px_rgba(0,0,0,0.85)] scale-110">
            <StackedHexPreview
              tier={draggedBlock.tier}
              skinId={progress.selectedTileSkin}
              sizePx={64}
              uid="drag-proxy"
            />
          </div>
        </div>
      )}
    </div>
  );
};
