export type Mood = 'happy' | 'neutral' | 'sad' | 'angry' | 'scared';

export type ItemCategory = 'weapon' | 'explosive' | 'utility' | 'toy' | 'hand';

export interface ToolItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: ItemCategory;
  damage: number;
  moneyMultiplier: number;
}

export interface Skin {
  id: string;
  name: string;
  cost: number;
  color: string;
}

export interface GameState {
  money: number;
  unlockedItems: string[];
  unlockedSkins: string[];
  activeItemId: string;
  activeSkinId: string | null;
  mood: Mood;
  score: number;
}

export interface BuddyState {
  health: number;
  mood: Mood;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface InteractionEvent {
  type: string;
  position: { x: number; y: number };
  force?: { x: number; y: number };
  damage?: number;
}
