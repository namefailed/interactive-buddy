import type { Skin, ToolItem } from '../../types';

export const ITEMS: ToolItem[] = [
  { id: 'fist', name: 'Fist', cost: 0, description: 'A quick close-range shove.', category: 'hand', damage: 5, moneyMultiplier: 1, tone: 'violent' },
  { id: 'tickle', name: 'Tickle', cost: 0, description: 'A playful reset that calms stress.', category: 'care', damage: 0, moneyMultiplier: 0.5, tone: 'care' },
  { id: 'comfort', name: 'Comfort', cost: 0, description: 'Pet the buddy and rebuild trust.', category: 'care', damage: 0, moneyMultiplier: 0.4, tone: 'care' },
  { id: 'treat', name: 'Treat', cost: 25, description: 'A snack that improves mood and trust.', category: 'care', damage: 0, moneyMultiplier: 0.6, tone: 'care' },
  { id: 'grenade', name: 'Grenade', cost: 0, description: 'A compact cartoon blast.', category: 'explosive', damage: 40, moneyMultiplier: 3, tone: 'violent' },
  { id: 'pistol', name: 'Pistol', cost: 60, description: 'Precise impact with light recoil.', category: 'mayhem', damage: 15, moneyMultiplier: 2, tone: 'violent' },
  { id: 'shotgun', name: 'Shotgun', cost: 100, description: 'Wide knockback and heavy shake.', category: 'mayhem', damage: 25, moneyMultiplier: 3, tone: 'violent' },
  { id: 'machinegun', name: 'Machine Gun', cost: 140, description: 'Hold to stream small impacts.', category: 'mayhem', damage: 8, moneyMultiplier: 1.5, tone: 'violent' },
  { id: 'flamethrower', name: 'Flamethrower', cost: 100, description: 'A noisy burst of heat and lift.', category: 'mayhem', damage: 12, moneyMultiplier: 2.5, tone: 'violent' },
  { id: 'missile', name: 'Missiles', cost: 100, description: 'Large blast, large reward.', category: 'explosive', damage: 60, moneyMultiplier: 5, tone: 'violent' },
  { id: 'bowling', name: 'Bowling Balls', cost: 40, description: 'Heavy physical slapstick.', category: 'utility', damage: 20, moneyMultiplier: 2, tone: 'playful' },
  { id: 'fireball', name: 'Fireballs', cost: 40, description: 'A bright burst of arcade fire.', category: 'explosive', damage: 30, moneyMultiplier: 3.5, tone: 'violent' },
  { id: 'mine', name: 'Mines', cost: 80, description: 'Place a nasty pop underfoot.', category: 'explosive', damage: 50, moneyMultiplier: 4, tone: 'violent' },
  { id: 'stun', name: 'Stun Gun', cost: 85, description: 'Freezes motion with electric feedback.', category: 'mayhem', damage: 10, moneyMultiplier: 1.5, tone: 'violent' },
  { id: 'rubberballs', name: 'Rubber Balls', cost: 20, description: 'A bouncy low-stress toy.', category: 'toy', damage: 3, moneyMultiplier: 0.8, tone: 'playful' },
  { id: 'flail', name: 'Medieval Flail', cost: 40, description: 'A dramatic weighted whack.', category: 'mayhem', damage: 18, moneyMultiplier: 2, tone: 'violent' },
  { id: 'molotov', name: 'Molotov', cost: 60, description: 'Fire splash with particle drama.', category: 'explosive', damage: 35, moneyMultiplier: 3, tone: 'violent' },
  { id: 'gravity', name: 'Gravity Vortex', cost: 30, description: 'Pull bodies and props into orbit.', category: 'utility', damage: 5, moneyMultiplier: 2, tone: 'playful' },
  { id: 'magicorb', name: 'Magical Orb', cost: 160, description: 'A premium physics pulse.', category: 'utility', damage: 20, moneyMultiplier: 3, tone: 'playful' },
  { id: 'radio', name: 'Radio', cost: 320, description: 'Turns the room into a recovery party.', category: 'toy', damage: 0, moneyMultiplier: 0.5, tone: 'care' },
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
