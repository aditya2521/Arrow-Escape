import { LevelDefinition, LevelMetadata } from '../types/game';
import { PRECOMPUTED_LEVELS } from './precomputedLevels';

export const TOTAL_LEVELS = PRECOMPUTED_LEVELS.length;

/**
 * Builds metadata for all unique matrix levels instantaneously.
 */
export function getAllLevelMetadata(): LevelMetadata[] {
  return PRECOMPUTED_LEVELS.map((level) => ({
    id: level.id,
    name: level.name,
    difficulty: level.difficulty,
    isMaster: false,
    themeColor: level.themeColor,
    bgColor: level.bgColor,
    borderColor: level.borderColor,
  }));
}

export const ALL_LEVEL_METADATA = getAllLevelMetadata();

/**
 * Retrieves a specific pre-computed level by ID (0ms — no runtime generation).
 * All 250 levels are baked at build time via scripts/precomputeLevels.ts.
 */
export function getEasybrainLevelById(id: number): LevelDefinition {
  const levelId = Math.max(1, Math.min(TOTAL_LEVELS, id));
  return PRECOMPUTED_LEVELS[levelId - 1];
}

export const ALL_EASYBRAIN_LEVELS: LevelDefinition[] = PRECOMPUTED_LEVELS;
