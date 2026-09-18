import { useState, useEffect, useCallback, useRef, type MutableRefObject } from 'react';
import { MultiCellArrow, LevelDefinition, LevelProgress, GameSettings } from '../types/game';
import { buildOccupancyGrid, checkRaycast } from '../engine/raycast';
import { getBestHint } from '../engine/solver';
import { BoosterInventory, GameStorage, STREAK_HINT_REWARD_INTERVAL } from '../storage/gameStorage';
import { useSoundHaptics } from './useSoundHaptics';

interface UseEasybrainGameProps {
  level: LevelDefinition;
  settings: GameSettings;
  onVictory?: (progress: LevelProgress) => void;
}

export const MAX_LIVES = 3;

function buildArrowsFromLevel(level: LevelDefinition): MultiCellArrow[] {
  return level.arrows.map((a, idx) => {
    const neck = a.tail.length > 1 ? a.tail[a.tail.length - 2] : null;
    const alignedDirection = neck
      ? a.head.row < neck.row
        ? 'up'
        : a.head.row > neck.row
          ? 'down'
          : a.head.col < neck.col
            ? 'left'
            : 'right'
      : a.direction;
    return {
      id: a.id || `arrow_${idx}`,
      head: a.head,
      tail: a.tail,
      direction: alignedDirection,
      color: a.color,
    };
  });
}

export function useEasybrainGame({ level, settings, onVictory }: UseEasybrainGameProps) {
  // Lazy initializer — arrows are ready on the FIRST render, no empty→full flash
  const [activeArrows, setActiveArrows] = useState<MultiCellArrow[]>(() =>
    buildArrowsFromLevel(level)
  );
  const [removingArrowIds, setRemovingArrowIds] = useState<Set<string>>(new Set());
  const [bumpingArrowIds, setBumpingArrowIds] = useState<Set<string>>(new Set());
  const [hintedArrowId, setHintedArrowId] = useState<string | null>(null);

  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [moves, setMoves] = useState<number>(0);

  const [boosters, setBoosters] = useState<BoosterInventory>({ hints: 3, undos: 3, bombs: 2 });
  const [winStreak, setWinStreak] = useState<number>(0);
  const [streakBonusJustAwarded, setStreakBonusJustAwarded] = useState<boolean>(false);
  const flightFallbacksRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const bumpFallbacksRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const gameOverHandledRef = useRef(false);

  const onVictoryRef = useRef(onVictory);
  onVictoryRef.current = onVictory;

  const { playTap, playBump, playSuccess, playError } = useSoundHaptics(settings);

  const clearFallback = (
    timers: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>,
    arrowId: string
  ) => {
    const timer = timers.current.get(arrowId);
    if (timer) clearTimeout(timer);
    timers.current.delete(arrowId);
  };

  // Arrow ids repeat between levels. Never allow an animation fallback from a
  // previous board to remove or reset an arrow on the next board.
  useEffect(() => {
    const flightFallbacks = flightFallbacksRef.current;
    const bumpFallbacks = bumpFallbacksRef.current;
    return () => {
      flightFallbacks.forEach(clearTimeout);
      bumpFallbacks.forEach(clearTimeout);
      flightFallbacks.clear();
      bumpFallbacks.clear();
    };
  }, [level.id]);

  const initLevel = useCallback(() => {
    setActiveArrows(buildArrowsFromLevel(level));
    setRemovingArrowIds(new Set());
    setBumpingArrowIds(new Set());
    setHintedArrowId(null);
    setLives(MAX_LIVES);
    setIsVictory(false);
    setIsGameOver(false);
    gameOverHandledRef.current = false;
    setMoves(0);
  }, [level]);

  // Keep the game-over transition outside the setLives updater. Scheduling
  // other state updates and native sound/haptics from inside a state updater
  // is unreliable with Android's concurrent renderer and could leave the
  // board locked at zero hearts without ever presenting the modal.
  useEffect(() => {
    if (lives > 0 || gameOverHandledRef.current) return;

    gameOverHandledRef.current = true;
    setIsGameOver(true);
    playError();
    setWinStreak(0);
    void GameStorage.saveWinStreak(0);
  }, [lives, playError]);

  // Re-initialize when the level changes (skipping the initial mount — lazy state already covers it)
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) {
      initLevel();
    } else {
      didMountRef.current = true;
    }
  }, [initLevel]);

  // Load boosters + streak from storage async (non-blocking for first paint)
  useEffect(() => {
    (async () => {
      const [storedBoosters, storedStreak] = await Promise.all([
        GameStorage.getBoosters(),
        GameStorage.getWinStreak(),
      ]);
      setBoosters(storedBoosters);
      setWinStreak(storedStreak);
    })();
  }, []);

  // Bump Complete Handler
  const handleBumpComplete = useCallback((arrowId: string) => {
    clearFallback(bumpFallbacksRef, arrowId);
    setBumpingArrowIds((prev) => {
      if (!prev.has(arrowId)) return prev;
      const next = new Set(prev);
      next.delete(arrowId);
      return next;
    });
  }, []);

  // Flight Complete Handler
  const handleFlightComplete = useCallback(
    (arrowId: string) => {
      clearFallback(flightFallbacksRef, arrowId);
      // Remove the arrow from the board model when its flight finishes.
      setActiveArrows((prev) => {
        const next = prev.filter((a) => a.id !== arrowId);

        if (next.length === 0) {
          setIsVictory((alreadyWon) => {
            if (!alreadyWon) {
              playSuccess();
              const progress: LevelProgress = {
                levelId: level.id,
                completed: true,
                stars: 3,
                bestMoves: moves + 1,
                bestTimeSeconds: 0,
              };
              GameStorage.saveLevelProgress(progress);
              onVictoryRef.current?.(progress);

              // Streak tracking + reward: +1 hint every N consecutive wins
              setWinStreak((prevStreak) => {
                const nextStreak = prevStreak + 1;
                GameStorage.saveWinStreak(nextStreak);
                if (nextStreak > 0 && nextStreak % STREAK_HINT_REWARD_INTERVAL === 0) {
                  setBoosters((prevBoosters) => {
                    const bonus = { ...prevBoosters, hints: prevBoosters.hints + 1 };
                    GameStorage.saveBoosters(bonus);
                    return bonus;
                  });
                  setStreakBonusJustAwarded(true);
                }
                return nextStreak;
              });

              return true;
            }
            return alreadyWon;
          });
        }

        return next;
      });

      // Deliberately retain the removal marker until the level resets. The
      // arrow no longer exists in activeArrows, and retaining this id prevents
      // an idle copy from ever being exposed during a React commit boundary.
    },
    [level.id, moves, playSuccess]
  );

  // Handle Arrow Tap
  const handleArrowPress = useCallback(
    (arrow: MultiCellArrow) => {
      if (
        isVictory ||
        isGameOver ||
        removingArrowIds.has(arrow.id) ||
        bumpingArrowIds.has(arrow.id)
      ) {
        return;
      }

      // Build grid excluding in-flight arrows
      const grid = buildOccupancyGrid(level.rows, level.cols, activeArrows, removingArrowIds);
      const result = checkRaycast(grid, level.rows, level.cols, arrow);

      if (result.canFly) {
        // Clear Exit Path!
        playTap();
        setRemovingArrowIds((prev) => new Set(prev).add(arrow.id));
        setMoves((prev) => prev + 1);

        if (hintedArrowId === arrow.id) {
          setHintedArrowId(null);
        }

        // Safety fallback timer: guarantee removal completes even if frame callback drops
        clearFallback(flightFallbacksRef, arrow.id);
        const flightTimer = setTimeout(() => {
          flightFallbacksRef.current.delete(arrow.id);
          handleFlightComplete(arrow.id);
        }, 2500);
        flightFallbacksRef.current.set(arrow.id, flightTimer);
      } else {
        // Collision / Blocked Path!
        playBump();
        setBumpingArrowIds((prev) => new Set(prev).add(arrow.id));
        setMoves((prev) => prev + 1);

        // Safety fallback timer: guarantee bump state resets even if spring callback drops
        clearFallback(bumpFallbacksRef, arrow.id);
        const bumpTimer = setTimeout(() => {
          bumpFallbacksRef.current.delete(arrow.id);
          handleBumpComplete(arrow.id);
        }, 700);
        bumpFallbacksRef.current.set(arrow.id, bumpTimer);

        setLives((prev) => {
          return Math.max(0, prev - 1);
        });
      }
    },
    [
      isVictory,
      isGameOver,
      removingArrowIds,
      bumpingArrowIds,
      level.rows,
      level.cols,
      activeArrows,
      hintedArrowId,
      playTap,
      playBump,
      playError,
      handleFlightComplete,
      handleBumpComplete,
    ]
  );

  // Booster: Hint
  const handleHint = useCallback(() => {
    if (boosters.hints <= 0) return;

    const best = getBestHint(level.rows, level.cols, activeArrows);
    if (best) {
      setHintedArrowId(best.id);
      const next = { ...boosters, hints: boosters.hints - 1 };
      setBoosters(next);
      GameStorage.saveBoosters(next);
    } else {
      playError();
    }
  }, [boosters, level.rows, level.cols, activeArrows, playError]);

  const acknowledgeStreakBonus = useCallback(() => {
    setStreakBonusJustAwarded(false);
  }, []);

  return {
    activeArrows,
    remainingCount: activeArrows.length,
    removingArrowIds,
    bumpingArrowIds,
    hintedArrowId,
    lives,
    isVictory,
    isGameOver,
    boosters,
    winStreak,
    streakBonusJustAwarded,
    acknowledgeStreakBonus,
    streakInterval: STREAK_HINT_REWARD_INTERVAL,
    handleArrowPress,
    handleFlightComplete,
    handleBumpComplete,
    handleHint,
    playTap,
    restartLevel: initLevel,
  };
}
