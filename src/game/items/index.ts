import type { Skin, ToolItem } from '../../types';

export const ITEMS: ToolItem[] = [
  { id: 'fist', name: 'Fist', cost: 0, description: 'A quick close-range shove.', category: 'hand', damage: 5, moneyMultiplier: 1, tone: 'violent' },
  { id: 'tickle', name: 'Tickle', cost: 0, description: 'A playful reset that calms stress.', category: 'care', damage: 0, moneyMultiplier: 0.5, tone: 'care' },
  { id: 'comfort', name: 'Comfort', cost: 0, description: 'Pet the buddy and rebuild trust.', category: 'care', damage: 0, moneyMultiplier: 0.4, tone: 'care' },
  { id: 'treat', name: 'Treat', cost: 25, description: 'Drop a snack to improve mood and trust.', category: 'care', damage: 0, moneyMultiplier: 0.6, tone: 'care' },
  { id: 'grenade', name: 'Grenade', cost: 0, description: 'Drops a physical grenade with a fuse.', category: 'explosive', damage: 40, moneyMultiplier: 3, tone: 'violent' },
  { id: 'mine', name: 'Mine', cost: 80, description: 'Place a physical mine on the floor.', category: 'explosive', damage: 50, moneyMultiplier: 4, tone: 'violent' },
  { id: 'bowling', name: 'Bowling Ball', cost: 40, description: 'Heavy physical slapstick.', category: 'utility', damage: 20, moneyMultiplier: 2, tone: 'playful' },
  { id: 'rubberballs', name: 'Rubber Balls', cost: 20, description: 'Bouncy low-stress toys.', category: 'toy', damage: 3, moneyMultiplier: 0.8, tone: 'playful' },
  { id: 'gravity', name: 'Gravity Vortex', cost: 30, description: 'Pull bodies and props into orbit.', category: 'utility', damage: 5, moneyMultiplier: 2, tone: 'playful' },
];

export const SKINS: Skin[] = [
  { id: 'default', name: 'Buddy', cost: 0, color: '#ff6b6b' },
  { id: 'blue', name: 'Aqua Buddy', cost: 60, color: '#4ecdc4' },
  { id: 'gold', name: 'Gold Buddy', cost: 60, color: '#ffd166' },
  { id: 'purple', name: 'Violet Buddy', cost: 60, color: '#a78bfa' },
  { id: 'green', name: 'Mint Buddy', cost: 60, color: '#2dd4bf' },
  { id: 'dark', name: 'Noir Buddy', cost: 60, color: '#475569' },
];

export function getItem(id: string): ToolItem | undefined {
  return ITEMS.find(i => i.id === id);
}

export function getSkin(id: string): Skin | undefined {
  return SKINS.find(s => s.id === id);
}

export const DEFAULT_ITEMS = ['fist', 'tickle', 'comfort', 'grenade'];

