export interface Chapter {
  id: number;
  title: string;
  emoji: string;
  color: string;      // primary theme color
  bgColor: string;    // pastel background
  startId: number;    // inclusive
  endId: number;      // inclusive
}

export const CHAPTERS: Chapter[] = [
  { id: 1,  title: 'Warm-Up',        emoji: '🌱', color: '#22C55E', bgColor: '#DCFCE7', startId: 1,   endId: 10  },
  { id: 2,  title: 'Nature',         emoji: '🌸', color: '#EC4899', bgColor: '#FCE7F3', startId: 11,  endId: 20  },
  { id: 3,  title: 'Objects',        emoji: '🔑', color: '#F59E0B', bgColor: '#FEF3C7', startId: 21,  endId: 30  },
  { id: 4,  title: 'Creatures',      emoji: '🦁', color: '#F97316', bgColor: '#FFEDD5', startId: 31,  endId: 40  },
  { id: 5,  title: 'Master',         emoji: '👑', color: '#7C3AED', bgColor: '#EDE9FE', startId: 41,  endId: 50  },
  { id: 6,  title: 'Fruits',         emoji: '🍎', color: '#DC2626', bgColor: '#FEE2E2', startId: 51,  endId: 60  },
  { id: 7,  title: 'Yummy Food',     emoji: '🍕', color: '#EA580C', bgColor: '#FED7AA', startId: 61,  endId: 70  },
  { id: 8,  title: 'Sports',         emoji: '⚽', color: '#16A34A', bgColor: '#BBF7D0', startId: 71,  endId: 80  },
  { id: 9,  title: 'Wheels',         emoji: '🚗', color: '#2563EB', bgColor: '#DBEAFE', startId: 81,  endId: 90  },
  { id: 10, title: 'Sea & Sky',      emoji: '🚁', color: '#0891B2', bgColor: '#CFFAFE', startId: 91,  endId: 100 },
  { id: 11, title: 'Music',          emoji: '🎸', color: '#9333EA', bgColor: '#F3E8FF', startId: 101, endId: 110 },
  { id: 12, title: 'Tools',          emoji: '🔨', color: '#64748B', bgColor: '#E2E8F0', startId: 111, endId: 120 },
  { id: 13, title: 'Space',          emoji: '🚀', color: '#4F46E5', bgColor: '#E0E7FF', startId: 121, endId: 130 },
  { id: 14, title: 'Under Sea',      emoji: '🐙', color: '#0284C7', bgColor: '#BAE6FD', startId: 131, endId: 140 },
  { id: 15, title: 'Birds',          emoji: '🦜', color: '#0D9488', bgColor: '#CCFBF1', startId: 141, endId: 150 },
  { id: 16, title: 'Bugs',           emoji: '🐝', color: '#CA8A04', bgColor: '#FEF08A', startId: 151, endId: 160 },
  { id: 17, title: 'Wild Life',      emoji: '🦊', color: '#B45309', bgColor: '#FDE68A', startId: 161, endId: 170 },
  { id: 18, title: 'Farm',           emoji: '🐷', color: '#DB2777', bgColor: '#FBCFE8', startId: 171, endId: 180 },
  { id: 19, title: 'Magic',          emoji: '🧙', color: '#7E22CE', bgColor: '#E9D5FF', startId: 181, endId: 190 },
  { id: 20, title: 'Symbols',        emoji: '☮️', color: '#DC2626', bgColor: '#FECACA', startId: 191, endId: 200 },
  { id: 21, title: 'Style',          emoji: '👕', color: '#0369A1', bgColor: '#BAE6FD', startId: 201, endId: 210 },
  { id: 22, title: 'Buildings',      emoji: '🏰', color: '#78350F', bgColor: '#FED7AA', startId: 211, endId: 220 },
  { id: 23, title: 'Tech',           emoji: '📱', color: '#475569', bgColor: '#CBD5E1', startId: 221, endId: 230 },
  { id: 24, title: 'Fun & Games',    emoji: '🎲', color: '#E11D48', bgColor: '#FECDD3', startId: 231, endId: 240 },
  { id: 25, title: 'Faces',          emoji: '😊', color: '#F59E0B', bgColor: '#FEF3C7', startId: 241, endId: 250 },
];

export function getChapterForLevel(levelId: number): Chapter {
  return CHAPTERS.find((c) => levelId >= c.startId && levelId <= c.endId) ?? CHAPTERS[0];
}

/** Splits a name like "🏐 Beach Ball" into { emoji: '🏐', name: 'Beach Ball' } */
export function splitEmojiName(rawName: string): { emoji: string; name: string } {
  const spaceIdx = rawName.indexOf(' ');
  if (spaceIdx <= 0) return { emoji: '↗️', name: rawName };
  const firstToken = rawName.slice(0, spaceIdx);
  // Matrix level names begin with words such as "Foundations". Only promote
  // the first token to the large emoji slot when it really is pictographic.
  if (!/\p{Extended_Pictographic}/u.test(firstToken)) {
    return { emoji: '↗️', name: rawName };
  }
  return { emoji: firstToken, name: rawName.slice(spaceIdx + 1) };
}
