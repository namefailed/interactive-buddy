import type { ToolItem } from '../../types';

export const ITEMS: ToolItem[] = [
  { id: 'fist', name: 'Fist', cost: 0, description: 'Punch the buddy', category: 'hand', damage: 5, moneyMultiplier: 1 },
  { id: 'tickle', name: 'Tickle', cost: 0, description: 'Tickle the buddy', category: 'hand', damage: 0, moneyMultiplier: 0.5 },
  { id: 'grenade', name: 'Grenade', cost: 0, description: 'Explosive fun', category: 'explosive', damage: 40, moneyMultiplier: 3 },
  { id: 'pistol', name: 'Pistol', cost: 60, description: 'Shoot the buddy', category: 'weapon', damage: 15, moneyMultiplier: 2 },
  { id: 'shotgun', name: 'Shotgun', cost: 100, description: 'Spread damage', category: 'weapon', damage: 25, moneyMultiplier: 3 },
  { id: 'machinegun', name: 'Machine Gun', cost: 140, description: 'Rapid fire', category: 'weapon', damage: 8, moneyMultiplier: 1.5 },
  { id: 'flamethrower', name: 'Flamethrower', cost: 100, description: 'Burn baby burn', category: 'weapon', damage: 12, moneyMultiplier: 2.5 },
  { id: 'missile', name: 'Missiles', cost: 100, description: 'Big boom', category: 'explosive', damage: 60, moneyMultiplier: 5 },
  { id: 'bowling', name: 'Bowling Balls', cost: 40, description: 'Heavy impact', category: 'utility', damage: 20, moneyMultiplier: 2 },
  { id: 'fireball', name: 'Fireballs', cost: 40, description: 'Rain fire', category: 'explosive', damage: 30, moneyMultiplier: 3.5 },
  { id: 'mine', name: 'Mines', cost: 80, description: 'Step on it!', category: 'explosive', damage: 50, moneyMultiplier: 4 },
  { id: 'stun', name: 'Stun Gun', cost: 85, description: 'Zap!', category: 'weapon', damage: 10, moneyMultiplier: 1.5 },
  { id: 'rubberballs', name: 'Rubber Balls', cost: 20, description: 'Bouncy fun', category: 'toy', damage: 3, moneyMultiplier: 0.8 },
  { id: 'flail', name: 'Medieval Flail', cost: 40, description: 'Whack!', category: 'weapon', damage: 18, moneyMultiplier: 2 },
  { id: 'molotov', name: 'Molotov', cost: 60, description: 'Fire cocktail', category: 'explosive', damage: 35, moneyMultiplier: 3 },
  { id: 'gravity', name: 'Gravity Vortex', cost: 30, description: 'Suck it in', category: 'utility', damage: 5, moneyMultiplier: 2 },
  { id: 'magicorb', name: 'Magical Orb', cost: 160, description: 'Mystical power', category: 'utility', damage: 20, moneyMultiplier: 3 },
  { id: 'radio', name: 'Radio', cost: 320, description: 'Party time!', category: 'toy', damage: 0, moneyMultiplier: 0.5 },
];

export const SKINS = [
  { id: 'default', name: 'Buddy', cost: 0, color: '#ff6b6b' },
  { id: 'blue', name: 'Blue Buddy', cost: 60, color: '#4ecdc4' },
  { id: 'gold', name: 'Gold Buddy', cost: 60, color: '#ffd700' },
  { id: 'purple', name: 'Purple Buddy', cost: 60, color: '#9b59b6' },
  { id: 'green', name: 'Green Buddy', cost: 60, color: '#2ecc71' },
  { id: 'dark', name: 'Dark Buddy', cost: 60, color: '#2c3e50' },
];

export function getItem(id: string): ToolItem | undefined {
  return ITEMS.find(i => i.id === id);
}

export function getSkin(id: string): (typeof SKINS)[number] | undefined {
  return SKINS.find(s => s.id === id);
}

export const DEFAULT_ITEMS = ['fist', 'tickle', 'grenade'];
