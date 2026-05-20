export type Mood = 'happy' | 'neutral' | 'sad' | 'angry' | 'scared';

export type ItemCategory = 'mayhem' | 'explosive' | 'utility' | 'toy' | 'care' | 'hand';
export type ItemTone = 'violent' | 'playful' | 'care';

export interface ToolItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: ItemCategory;
  damage: number;
  moneyMultiplier: number;
  tone: ItemTone;
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
  trust: number;
  stress: number;
  reaction: string;
}

export interface BuddyState {
  health: number;
  mood: Mood;
  trust: number;
  stress: number;
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
