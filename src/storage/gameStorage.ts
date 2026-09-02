import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSettings, LevelProgress } from '../types/game';
import { TOTAL_LEVELS } from '../engine/handcraftedMazes';

const KEYS = {
  PROGRESS: '@arrow_puzzle_progress',
  BOOSTERS: '@arrow_puzzle_boosters',
  UNLOCKED_LEVEL: '@arrow_puzzle_unlocked_level',
  WIN_STREAK: '@arrow_puzzle_win_streak',
  LAST_PLAYED_LEVEL: '@arrow_puzzle_last_played_level',
  CLAIMED_AWARDS: '@arrow_puzzle_claimed_awards',
  SETTINGS: '@arrow_puzzle_settings',
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  vibrationOnBump: true,
  darkMode: false,
};

export const STREAK_HINT_REWARD_INTERVAL = 3;
export const AWARD_MILESTONES = [
  { levels: 5, hints: 1 },
  { levels: 10, hints: 1 },
  { levels: 20, hints: 2 },
  { levels: 35, hints: 2 },
  { levels: 50, hints: 3 },
  { levels: 70, hints: 2 },
  { levels: 90, hints: 3 },
  { levels: 110, hints: 3 },
  { levels: 135, hints: 3 },
  { levels: 160, hints: 4 },
  { levels: 190, hints: 4 },
  { levels: 220, hints: 4 },
  { levels: 250, hints: 5 },
  { levels: 280, hints: 4 },
  { levels: 310, hints: 4 },
  { levels: 340, hints: 5 },
  { levels: 370, hints: 5 },
  { levels: 400, hints: 6 },
  { levels: 425, hints: 5 },
  { levels: 450, hints: 6 },
  { levels: 465, hints: 5 },
  { levels: 475, hints: 5 },
  { levels: 485, hints: 6 },
  { levels: 495, hints: 7 },
  { levels: 500, hints: 10 },
] as const;

export interface BoosterInventory {
  hints: number;
  undos: number;
  bombs: number;
}

const DEFAULT_BOOSTERS: BoosterInventory = {
  hints: 5,
  undos: 5,
  bombs: 3,
};

export const GameStorage = {
  async getSettings(): Promise<GameSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(data) } : DEFAULT_GAME_SETTINGS;
    } catch {
      return DEFAULT_GAME_SETTINGS;
    }
  },

  async saveSettings(settings: GameSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  },

  async getAllProgress(): Promise<Record<number, LevelProgress>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async saveLevelProgress(progress: LevelProgress): Promise<void> {
    try {
      const all = await this.getAllProgress();
      const existing = all[progress.levelId];
      // Keep best score
      all[progress.levelId] = {
        levelId: progress.levelId,
        completed: true,
        stars: Math.max(existing?.stars || 0, progress.stars),
        bestMoves: existing?.bestMoves ? Math.min(existing.bestMoves, progress.bestMoves) : progress.bestMoves,
        bestTimeSeconds: existing?.bestTimeSeconds ? Math.min(existing.bestTimeSeconds, progress.bestTimeSeconds) : progress.bestTimeSeconds,
      };
      await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(all));

      // Save last completed/next level
      await AsyncStorage.setItem(KEYS.LAST_PLAYED_LEVEL, String(Math.min(TOTAL_LEVELS, progress.levelId + 1)));

      // Unlock next level sequentially
      await this.saveUnlockedLevel(progress.levelId + 1);
    } catch (e) {
      console.warn('Failed to save level progress', e);
    }
  },

  async getLastPlayedLevel(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_PLAYED_LEVEL);
      const n = data ? parseInt(data, 10) : 1;
      return Number.isFinite(n) && n >= 1 ? Math.min(n, TOTAL_LEVELS) : 1;
    } catch {
      return 1;
    }
  },

  async saveLastPlayedLevel(levelId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_PLAYED_LEVEL, String(Math.min(TOTAL_LEVELS, Math.max(1, levelId))));
    } catch (e) {
      console.warn('Failed to save last played level', e);
    }
  },

  async getUnlockedLevel(): Promise<number> {
    return TOTAL_LEVELS;
  },

  async saveUnlockedLevel(levelId: number): Promise<void> {
    try {
      const current = await this.getUnlockedLevel();
      if (levelId > current) {
        await AsyncStorage.setItem(KEYS.UNLOCKED_LEVEL, String(Math.min(TOTAL_LEVELS, levelId)));
      }
    } catch (e) {
      console.warn('Failed to save unlocked level', e);
    }
  },

  async getBoosters(): Promise<BoosterInventory> {
    try {
      const data = await AsyncStorage.getItem(KEYS.BOOSTERS);
      return data ? { ...DEFAULT_BOOSTERS, ...JSON.parse(data) } : DEFAULT_BOOSTERS;
    } catch {
      return DEFAULT_BOOSTERS;
    }
  },

  async saveBoosters(boosters: BoosterInventory): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.BOOSTERS, JSON.stringify(boosters));
    } catch (e) {
      console.warn('Failed to save boosters', e);
    }
  },

  async getClaimedAwards(): Promise<number[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CLAIMED_AWARDS);
      const values: unknown = data ? JSON.parse(data) : [];
      return Array.isArray(values)
        ? values.filter((value): value is number => Number.isInteger(value) && value > 0)
        : [];
    } catch {
      return [];
    }
  },

  async claimAward(milestone: number): Promise<BoosterInventory | null> {
    try {
      const [progress, claimed, boosters] = await Promise.all([
        this.getAllProgress(),
        this.getClaimedAwards(),
        this.getBoosters(),
      ]);
      const completedCount = Object.values(progress).filter((item) => item.completed).length;
      const award = AWARD_MILESTONES.find((item) => item.levels === milestone);
      if (!award || completedCount < milestone || claimed.includes(milestone)) return null;

      const nextBoosters = { ...boosters, hints: boosters.hints + award.hints };
      await AsyncStorage.multiSet([
        [KEYS.BOOSTERS, JSON.stringify(nextBoosters)],
        [KEYS.CLAIMED_AWARDS, JSON.stringify([...claimed, milestone].sort((a, b) => a - b))],
      ]);
      return nextBoosters;
    } catch (e) {
      console.warn('Failed to claim award', e);
      return null;
    }
  },

  async getWinStreak(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(KEYS.WIN_STREAK);
      const n = data ? parseInt(data, 10) : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  },

  async saveWinStreak(streak: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.WIN_STREAK, String(Math.max(0, streak)));
    } catch (e) {
      console.warn('Failed to save win streak', e);
    }
  },

  async resetAllProgress(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.PROGRESS,
        KEYS.UNLOCKED_LEVEL,
        KEYS.WIN_STREAK,
        KEYS.CLAIMED_AWARDS,
      ]);
      await this.saveBoosters(DEFAULT_BOOSTERS);
    } catch (e) {
      console.warn('Failed to reset progress', e);
    }
  },
};
