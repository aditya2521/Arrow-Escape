export interface MatrixLevelSpec {
  id: number;
  name: string;
  rows: number;
  cols: number;
  difficulty: 'Normal' | 'Hard';
  themeColor: string;
  bgColor: string;
  borderColor: string;
  mask: string[];
}

const THEMES = [
  { accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { accent: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { accent: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
];

const STAGE_NAMES = ['Foundations', 'Crossroads', 'Switchback', 'Labyrinth', 'Master Grid'];

function dimensionsForLevel(id: number): { rows: number; cols: number; stage: number } {
  if (id <= 20) return { rows: 32, cols: 32, stage: 0 };
  if (id <= 60) return { rows: 34, cols: 34, stage: 1 };
  if (id <= 120) return { rows: 36, cols: 36, stage: 2 };
  if (id <= 200) return { rows: 39, cols: 39, stage: 3 };
  return { rows: 42, cols: 42, stage: 4 };
}

/** A clean rectangular matrix: layout uniqueness comes from each seeded arrow maze. */
function makeMatrixMask(rows: number, cols: number): string[] {
  return Array.from({ length: rows }, () => '#'.repeat(cols));
}

export const MATRIX_LEVEL_SPECS: MatrixLevelSpec[] = Array.from(
  { length: 250 },
  (_, index) => {
    const id = index + 1;
    const { rows, cols, stage } = dimensionsForLevel(id);
    const theme = THEMES[stage];
    return {
      id,
      name: `${STAGE_NAMES[stage]} ${String(id).padStart(3, '0')}`,
      rows,
      cols,
      difficulty: 'Hard',
      themeColor: theme.accent,
      bgColor: theme.bg,
      borderColor: theme.border,
      mask: makeMatrixMask(rows, cols),
    };
  }
);
