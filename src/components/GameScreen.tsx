import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Pause,
  RotateCcw,
  Undo2,
  Lightbulb,
  Award,
  Info,
  Target,
  Coins,
} from 'lucide-react';
import { BoardTile, HexCoord, LevelConfig, MoveStep, TileTier, TrayBlock, UserProgress } from '../types/game';
import { getLevelConfig } from '../data/levels';
import { HexagonGrid, SparkleParticle, renderEmbossedSymbol } from './HexagonGrid';
import { BlockTray } from './BlockTray';
import { PauseModal } from './PauseModal';
import { VictoryModal } from './VictoryModal';
import { GameOverModal } from './GameOverModal';
import { SettingsModal } from './SettingsModal';
import { SimulatedAdModal } from './SimulatedAdModal';
import { findConnectedGroup, generateGridCoords, getNeighbors, hexKey, areCoordsEqual, hexToPixel, pixelToHex } from '../utils/hexMath';
import { audioManager } from '../utils/audioManager';
import { findBestMoveHint, HintSuggestion } from '../utils/solver';
import { updateLevelCompletion, saveUserProgress } from '../utils/storage';
import { adManager, AdModalState, AdReward } from '../utils/adManager';
import { getTierInfo } from '../data/tiers';

interface GameScreenProps {
  levelId: number;
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  onExitToLevelSelect: () => void;
  onExitToHome: () => void;
  onSelectLevel: (nextLevelId: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  levelId,
  progress,
  onUpdateProgress,
  onExitToLevelSelect,
  onExitToHome,
  onSelectLevel,
}) => {
  const levelConfig: LevelConfig = useMemo(() => getLevelConfig(levelId), [levelId]);

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

  // Modals
  const [isPaused, setIsPaused] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Ad Simulation Modal
  const [adState, setAdState] = useState<AdModalState>({
    isOpen: false,
    type: 'rewarded',
    status: 'ready',
  });

  useEffect(() => {
    return adManager.subscribe((state: AdModalState) => {
      setAdState(state);
    });
  }, []);

  // Helper to generate 3 balanced tray blocks for the level
  const generateTrayForLevel = useCallback(
    (level: LevelConfig, currentTiles: BoardTile[], dealIdx: number): TrayBlock[] => {
      let maxPossibleTier = 3;
      if (level.difficulty === 'Normal' || level.difficulty === 'Tutorial') {
        maxPossibleTier = 3;
      } else if (level.difficulty === 'Hard') {
        maxPossibleTier = 4;
      } else if (level.difficulty === 'Hard+') {
        maxPossibleTier = 5;
      } else {
        maxPossibleTier = 5; // Tier 6 is formed through merging
      }

      const boardTiers = currentTiles.map(t => t.tier);
      const distinctBoardTiers = Array.from(new Set(boardTiers));

      const result: TrayBlock[] = [];
      for (let i = 0; i < 3; i++) {
        let chosenTier: TileTier = 1;
        // 75% chance to provide a tier that matches existing board tiles to facilitate merges
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

  // Initialize Level
  const initLevel = useCallback(() => {
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
  }, [levelConfig, levelId, generateTrayForLevel]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

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

      const coinsBonus = 25 + stars * 10 + finalMovesLeft * 5;
      setStarsEarned(stars);
      setCoinsEarned(coinsBonus);
      setIsVictory(true);

      const updated = updateLevelCompletion(levelId, stars, finalScore, coinsBonus);
      onUpdateProgress(updated);
    },
    [levelConfig, levelId, onUpdateProgress]
  );

  // Trigger gentle shake for invalid moves
  const triggerInvalidFeedback = () => {
    audioManager.playInvalidMove();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 320);
  };

  // Generate sparkle burst around pixel center
  const emitSparkles = (coord: HexCoord, color: string) => {
    const hexSize = levelConfig.radius === 2 ? 46 : 38;
    const center = { x: 200, y: 208 };
    const pos = hexToPixel(coord, hexSize, center);

    const newParticles: SparkleParticle[] = Array.from({ length: 12 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.4;
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
    setTimeout(() => setSparkles([]), 650);
  };

  // Tile Selection Handler (for sliding moves on the board)
  const handleTileSelect = (coord: HexCoord) => {
    if (isMerging || isVictory || isGameOver) return;
    audioManager.playSelect();

    // Deselect tray block if any was selected
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
        // Map pointer pixel to SVG internal 400x425 viewBox
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
    } else {
      // If dropped over board area but on an invalid/occupied cell, shake
      if (svgRef.current) {
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
      // All empty valid cells become available drop targets
      const emptyCells = validCoords.filter(c => !tilesMap.has(hexKey(c.q, c.r)));
      setValidTargets(emptyCells);
    }
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

    // Save snapshot for Undo
    const step: MoveStep = {
      type: 'placement',
      to: { ...destCoord },
      tileTier: block.tier,
      boardSnapshot: tiles.map(t => ({ q: t.q, r: t.r, tier: t.tier, id: t.id })),
      traySnapshot: trayBlocks.map(b => ({ ...b })),
      scoreSnapshot: score,
      movesSnapshot: movesLeft,
    };
    setUndoStack(prev => [...prev, step]);

    // Place tile
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

    // Mark block as used in tray
    const updatedTray = trayBlocks.map(b => (b.id === blockId ? { ...b, isUsed: true } : b));
    setTrayBlocks(updatedTray);
    setSelectedTrayBlockId(null);
    setValidTargets([]);
    setActiveHint(null);

    // Auto-replenish tray if all 3 blocks have been placed
    const allUsed = updatedTray.every(b => b.isUsed);
    if (allUsed) {
      const nextDeal = dealCount + 1;
      setDealCount(nextDeal);
      setTimeout(() => {
        audioManager.playSuccess();
        setTrayBlocks(generateTrayForLevel(levelConfig, updatedTilesList, nextDeal));
      }, 350);
    }

    // Process potential 3+ merges at destination
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
    }, 340);
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

    // Sound and visual effects
    audioManager.playMerge(groupTier, combo);
    emitSparkles(startCoord, getTierInfo(nextTier).color);

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

    // Check for cascade
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

  // Cell Click (Move destination, Tray placement destination, or tile selection)
  const handleCellClick = (destCoord: HexCoord) => {
    if (isMerging || isVictory || isGameOver) return;

    // Case 1: Tray block is currently selected via tap
    if (selectedTrayBlockId) {
      const destKey = hexKey(destCoord.q, destCoord.r);
      const isOccupied = tilesMap.has(destKey);
      if (isOccupied) {
        // If player tapped on an existing tile while tray block was selected, switch to selecting that tile
        handleTileSelect(destCoord);
      } else {
        handlePlaceTrayBlock(selectedTrayBlockId, destCoord);
      }
      return;
    }

    // Case 2: Board tile is currently selected for sliding
    if (selectedCoord) {
      const isTarget = validTargets.some(t => areCoordsEqual(t, destCoord));
      if (!isTarget) {
        if (tilesMap.has(hexKey(destCoord.q, destCoord.r))) {
          handleTileSelect(destCoord);
        } else {
          // Invalid slide destination
          triggerInvalidFeedback();
          setSelectedCoord(null);
          setValidTargets([]);
        }
        return;
      }

      const movingTile = tiles.find(t => areCoordsEqual({ q: t.q, r: t.r }, selectedCoord));
      if (!movingTile) return;

      // Snapshot for Undo
      const step: MoveStep = {
        type: 'slide',
        from: { ...selectedCoord },
        to: { ...destCoord },
        tileTier: movingTile.tier,
        boardSnapshot: tiles.map(t => ({ q: t.q, r: t.r, tier: t.tier, id: t.id })),
        traySnapshot: trayBlocks.map(b => ({ ...b })),
        scoreSnapshot: score,
        movesSnapshot: movesLeft,
      };
      setUndoStack(prev => [...prev, step]);

      // Slide tile
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

      // Process merges
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
      }, 340);
      return;
    }

    // Case 3: Nothing selected yet
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

    setTiles(
      lastStep.boardSnapshot.map(s => ({
        id: s.id,
        q: s.q,
        r: s.r,
        tier: s.tier,
      }))
    );
    if (lastStep.traySnapshot) {
      setTrayBlocks(lastStep.traySnapshot);
    }
    setScore(lastStep.scoreSnapshot);
    setMovesLeft(lastStep.movesSnapshot);
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

    if (progress.hintsRemaining > 0) {
      executeHint();
      const updated = {
        ...progress,
        hintsRemaining: progress.hintsRemaining - 1,
      };
      saveUserProgress(updated);
      onUpdateProgress(updated);
    } else {
      adManager.showRewardedAd({ type: 'hint', amount: 1 }, () => {
        const updated = {
          ...progress,
          hintsRemaining: progress.hintsRemaining + 1,
        };
        saveUserProgress(updated);
        onUpdateProgress(updated);
        executeHint();
      });
    }
  };

  const handleAdExtraMoves = () => {
    adManager.showRewardedAd({ type: 'extra_moves', amount: 3 }, () => {
      setMovesLeft(prev => prev + 3);
      setIsGameOver(false);
    });
  };

  const handleNextLevel = () => {
    setIsVictory(false);
    const nextId = levelId + 1;
    if (nextId <= 100) {
      adManager.notifyLevelCompleted(levelId, () => {
        onSelectLevel(nextId);
      });
    } else {
      onExitToLevelSelect();
    }
  };

  const obj = levelConfig.objective;
  let objectiveProgressText = '';
  if (obj.type === 'reach_tier') {
    const targetInfo = getTierInfo(obj.targetTier || 3);
    objectiveProgressText = `Current: T${highestTier} / Goal: T${obj.targetTier} (${targetInfo.name})`;
  } else if (obj.type === 'merge_count') {
    objectiveProgressText = `Merges: ${mergesCount} / ${obj.count}`;
  } else if (obj.type === 'target_score') {
    objectiveProgressText = `Score: ${score} / ${obj.targetScore}`;
  }

  // Difficulty badge styling
  const diffBadgeColor: Record<string, string> = {
    Tutorial: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    Normal: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    Hard: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    'Hard+': 'bg-orange-950/80 border-orange-500/40 text-orange-300',
    'Very Hard': 'bg-rose-950/80 border-rose-500/40 text-rose-300',
    Expert: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
    Master: 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-400/50 text-amber-200',
  };

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/assets/aistudio/94dcd7311cb7c003dc8c2c8f30a006a9_24f28502.jpg')`,
      }}
    >
      {/* Ambient sky sunburst & tranquil water reflection overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-sky-950/30 pointer-events-none" />

      {/* TOP HUD BAR */}
      <div className="w-full flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between">
          {/* Pause Button */}
          <button
            onClick={() => {
              audioManager.playClick();
              setIsPaused(true);
            }}
            className="p-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/25 text-white hover:bg-slate-800/80 active:scale-95 transition-all shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>

          {/* Level Title & Difficulty Pill */}
          <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-md border border-white/25 px-3 py-1 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight drop-shadow">Level {levelId}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${diffBadgeColor[levelConfig.difficulty] || 'bg-slate-900 border-slate-700 text-slate-300'} uppercase tracking-wider`}>
                {levelConfig.difficulty}
              </span>
            </div>
            <span className="text-[10px] text-sky-200 font-medium">{levelConfig.name}</span>
          </div>

          {/* Restart Button */}
          <button
            onClick={() => {
              audioManager.playClick();
              initLevel();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/25 text-white hover:bg-slate-800/80 active:scale-95 transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Moves Left & Score Strip */}
        <div className="grid grid-cols-2 gap-2">
          {/* Moves Left Counter */}
          <div
            className={`flex items-center justify-between px-3.5 py-2 rounded-2xl border transition-all ${
              movesLeft <= 3
                ? 'bg-rose-950/85 border-rose-400 text-rose-200 shadow-lg shadow-rose-950/50 animate-pulse'
                : 'bg-slate-900/60 backdrop-blur-md border border-white/20 text-white shadow-lg'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Moves Left</span>
            <span className="text-lg font-black tabular-nums drop-shadow">{movesLeft}</span>
          </div>

          {/* Score Counter */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/20 text-white shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Score</span>
            <span className="text-lg font-black text-amber-300 tabular-nums drop-shadow">{score}</span>
          </div>
        </div>

        {/* Objective Card */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/25 text-white shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 shadow">
              <Target className="w-4 h-4 shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight drop-shadow">{obj.description}</span>
              <span className="text-[10px] text-cyan-200 font-mono mt-0.5">{objectiveProgressText}</span>
            </div>
          </div>

          {/* Star Threshold Preview */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(starNum => {
              const req = starNum === 3 ? levelConfig.starThresholds.threeStars : (starNum === 2 ? levelConfig.starThresholds.twoStars : 0);
              const isActive = movesLeft >= req;
              return (
                <Award
                  key={starNum}
                  className={`w-4 h-4 ${isActive ? 'text-amber-300 fill-amber-300 drop-shadow' : 'text-slate-600'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Tutorial Guidance Tip */}
        {levelConfig.tutorialTip && !tipDismissed && (
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 backdrop-blur-md border border-cyan-400/50 rounded-2xl text-[11px] text-cyan-100 shadow-xl">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>{levelConfig.tutorialTip}</span>
            </div>
            <button
              onClick={() => setTipDismissed(true)}
              className="text-cyan-300 font-bold text-xs hover:text-white px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* CENTER 2.5D HEXAGON PLAYING FIELD */}
      <div className="my-auto w-full flex items-center justify-center py-1">
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
            (selectedTrayBlockId ? trayBlocks.find(b => b.id === selectedTrayBlockId)?.tier ?? null : null)
          }
          svgRef={svgRef}
        />
      </div>

      {/* BOTTOM COLOR BLOCK TRAY */}
      <div className="w-full my-1 z-10">
        <BlockTray
          blocks={trayBlocks}
          selectedBlockId={selectedTrayBlockId}
          onSelectBlock={handleSelectTrayBlock}
          onDragStart={handleTrayDragStart}
          onDragMove={handleTrayDragMove}
          onDragEnd={handleTrayDragEnd}
          disabled={isMerging || isVictory || isGameOver}
        />
      </div>

      {/* BOTTOM ACTION TOOLBAR */}
      <div className="w-full flex items-center justify-between gap-2.5 z-10 pt-1">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0 || isMerging}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all shadow-md ${
            undoStack.length > 0 && !isMerging
              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 active:scale-95'
              : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
        </button>

        {/* Hint Button */}
        <button
          onClick={handleRequestHint}
          disabled={isMerging}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
        >
          <Lightbulb className="w-4 h-4 fill-slate-950" />
          <span>Hint</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px] font-mono">
            {progress.hintsRemaining > 0 ? progress.hintsRemaining : 'Ad'}
          </span>
        </button>

        {/* Restart Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            initLevel();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      {/* MODALS */}
      <PauseModal
        isOpen={isPaused}
        levelNumber={levelId}
        soundEnabled={progress.soundEnabled}
        musicEnabled={progress.musicEnabled}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          setIsPaused(false);
          initLevel();
        }}
        onLevelSelect={() => {
          setIsPaused(false);
          onExitToLevelSelect();
        }}
        onGoHome={() => {
          setIsPaused(false);
          onExitToHome();
        }}
        onOpenShop={() => {
          setIsPaused(false);
          onExitToHome();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => {
          const updated = { ...progress, soundEnabled: !progress.soundEnabled };
          saveUserProgress(updated);
          audioManager.setSoundEnabled(updated.soundEnabled);
          onUpdateProgress(updated);
        }}
        onToggleMusic={() => {
          const updated = { ...progress, musicEnabled: !progress.musicEnabled };
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
        isLastLevel={levelId >= 100}
        onNextLevel={handleNextLevel}
        onReplay={initLevel}
        onLevelSelect={onExitToLevelSelect}
        onOpenShop={() => {
          setIsVictory(false);
          onExitToHome();
        }}
      />

      <GameOverModal
        isOpen={isGameOver}
        levelNumber={levelId}
        canUndo={undoStack.length > 0}
        onRetry={initLevel}
        onUndo={handleUndo}
        onWatchAdExtraMoves={handleAdExtraMoves}
        onLevelSelect={onExitToLevelSelect}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        progress={progress}
        onClose={() => setIsSettingsOpen(false)}
        onToggleSound={() => {
          const updated = { ...progress, soundEnabled: !progress.soundEnabled };
          saveUserProgress(updated);
          audioManager.setSoundEnabled(updated.soundEnabled);
          onUpdateProgress(updated);
        }}
        onToggleMusic={() => {
          const updated = { ...progress, musicEnabled: !progress.musicEnabled };
          saveUserProgress(updated);
          audioManager.setMusicEnabled(updated.musicEnabled);
          onUpdateProgress(updated);
        }}
        onToggleHaptics={() => {
          const updated = { ...progress, hapticsEnabled: !progress.hapticsEnabled };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }}
        onChangeSoundVolume={vol => {
          const updated = { ...progress, soundVolume: vol };
          saveUserProgress(updated);
          audioManager.setSoundVolume(vol);
          onUpdateProgress(updated);
        }}
        onChangeMusicVolume={vol => {
          const updated = { ...progress, musicVolume: vol };
          saveUserProgress(updated);
          audioManager.setMusicVolume(vol);
          onUpdateProgress(updated);
        }}
        onChangeGraphicsQuality={quality => {
          const updated = { ...progress, graphicsQuality: quality };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }}
        onSelectBackground={bgId => {
          const updated = { ...progress, selectedBackground: bgId };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }}
        onSelectTileSkin={skinId => {
          const updated = { ...progress, selectedTileSkin: skinId };
          saveUserProgress(updated);
          onUpdateProgress(updated);
        }}
        onOpenShopCategory={() => {
          setIsSettingsOpen(false);
          onExitToHome();
        }}
        onResetProgress={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />

      <SimulatedAdModal
        adState={adState}
        onComplete={() => adManager.completeReward()}
        onDismiss={() => adManager.dismissAd()}
      />

      {/* FLOATING DRAG-AND-DROP PROXY */}
      {isDraggingFromTray && draggedBlock && dragPointerPos && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${dragPointerPos.x}px`, top: `${dragPointerPos.y}px` }}
        >
          <div className="w-16 h-16 drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] scale-110">
            <svg viewBox="0 0 100 115" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="dragProxyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getTierInfo(draggedBlock.tier).lightColor} />
                  <stop offset="25%" stopColor={getTierInfo(draggedBlock.tier).color} />
                  <stop offset="85%" stopColor={getTierInfo(draggedBlock.tier).shadowColor} />
                  <stop offset="100%" stopColor="#04060c" />
                </linearGradient>
              </defs>

              {/* Layer 3: Bottom Ridge */}
              <polygon
                points="50,15 93,40 93,90 50,115 7,90 7,40"
                fill={getTierInfo(draggedBlock.tier).ridgeColor}
                stroke="#020617"
                strokeWidth="1.2"
              />

              {/* Layer 2: Mid Ridge */}
              <polygon
                points="50,11 93,36 93,86 50,111 7,86 7,36"
                fill={getTierInfo(draggedBlock.tier).shadowColor}
                stroke={getTierInfo(draggedBlock.tier).ridgeColor}
                strokeWidth="0.8"
              />
              <polygon
                points="50,10 93,35 93,85 50,110 7,85 7,35"
                fill="none"
                stroke={getTierInfo(draggedBlock.tier).ridgeHighlight}
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Layer 1: Top Ridge */}
              <polygon
                points="50,7 93,32 93,82 50,107 7,82 7,32"
                fill={getTierInfo(draggedBlock.tier).color}
                stroke={getTierInfo(draggedBlock.tier).shadowColor}
                strokeWidth="0.8"
              />

              {/* Top Glossy Hex Face */}
              <polygon
                points="50,3 93,28 93,78 50,103 7,78 7,28"
                fill="url(#dragProxyGrad)"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="2.2"
              />

              {/* Top Specular Arc */}
              <polygon
                points="50,8 88,30 88,73 50,96 12,73 12,30"
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                strokeWidth="1.6"
                strokeDasharray="26 36"
              />

              {/* Embossed Symbol */}
              {renderEmbossedSymbol(
                getTierInfo(draggedBlock.tier).symbolType,
                50,
                52,
                38,
                getTierInfo(draggedBlock.tier).ridgeColor
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
