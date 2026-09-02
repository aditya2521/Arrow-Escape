export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  row: number;
  col: number;
}

export interface MultiCellArrow {
  id: string;
  head: Point;          // Grid coordinate of the arrowhead
  tail: Point[];        // Array of coordinates from tail start to neck: [tailStart, ...intermediatePoints, head]
  direction: Direction; // Direction the head is pointing
  color?: string;
  isRemoving?: boolean;
}

export interface MultiCellArrowDefinition {
  id?: string;
  head: Point;
  tail: Point[];
  direction: Direction;
  color?: string;
}

export interface LevelDefinition {
  id: number;
  name: string;
  difficulty: 'Normal' | 'Hard';
  rows: number;
  cols: number;
  shapeName?: string;
  mask?: string[];
  themeColor?: string;
  bgColor?: string;
  borderColor?: string;
  arrows: MultiCellArrowDefinition[];
}

export interface RaycastResult {
  canFly: boolean;
  blocker?: MultiCellArrow;
  distance: number;
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number;
  bestMoves: number;
  bestTimeSeconds: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  vibrationOnBump: boolean;
  darkMode: boolean;
}

export interface LevelMetadata {
  id: number;
  name: string;
  difficulty: 'Normal' | 'Hard';
  isMaster?: boolean;
  themeColor?: string;
  bgColor?: string;
  borderColor?: string;
}

export type RootStackParamList = {
  Home: undefined;
  LevelSelect: undefined;
  Awards: undefined;
  Game: { levelId: number };
  Privacy: undefined;
  Terms: undefined;
};
