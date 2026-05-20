import { useState, useCallback } from 'react';
import type { GameState, Mood } from '../types';
import { DEFAULT_ITEMS } from '../game/items';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const initialState: GameState = {
  money: 0,
  unlockedItems: [...DEFAULT_ITEMS],
  unlockedSkins: ['default'],
  activeItemId: 'fist',
  activeSkinId: 'default',
  mood: 'neutral',
  score: 0,
  trust: 60,
  stress: 18,
  reaction: 'Ready for the first experiment.',
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const addMoney = useCallback((amount: number) => {
    setState(prev => ({ ...prev, money: prev.money + amount }));
  }, []);

  const setMood = useCallback((mood: Mood) => {
    setState(prev => ({ ...prev, mood }));
  }, []);

  const setActiveItem = useCallback((itemId: string) => {
    setState(prev => (
      prev.unlockedItems.includes(itemId) ? { ...prev, activeItemId: itemId } : prev
    ));
  }, []);

  const setActiveSkin = useCallback((skinId: string) => {
    setState(prev => {
      if (prev.unlockedSkins.includes(skinId) || skinId === 'default') {
        return { ...prev, activeSkinId: skinId };
      }
      return prev;
    });
  }, []);

  const unlockItem = useCallback((itemId: string) => {
    setState(prev => {
      if (prev.unlockedItems.includes(itemId)) return prev;
      return { ...prev, unlockedItems: [...prev.unlockedItems, itemId] };
    });
  }, []);

  const unlockSkin = useCallback((skinId: string) => {
    setState(prev => {
      if (prev.unlockedSkins.includes(skinId)) return prev;
      return { ...prev, unlockedSkins: [...prev.unlockedSkins, skinId] };
    });
  }, []);

  const updateFromEngine = useCallback((partial: Partial<GameState>) => {
    setState(prev => ({
      ...prev,
      ...partial,
      trust: partial.trust === undefined ? prev.trust : clamp(partial.trust),
      stress: partial.stress === undefined ? prev.stress : clamp(partial.stress),
    }));
  }, []);

  return {
    state,
    addMoney,
    setMood,
    setActiveItem,
    setActiveSkin,
    unlockItem,
    unlockSkin,
    updateFromEngine,
  };
}
