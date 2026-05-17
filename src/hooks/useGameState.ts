import { useState, useCallback } from 'react';
import type { GameState, Mood } from '../types';
import { DEFAULT_ITEMS } from '../game/items';

const initialState: GameState = {
  money: 0,
  unlockedItems: [...DEFAULT_ITEMS],
  unlockedSkins: ['default'],
  activeItemId: 'fist',
  activeSkinId: 'default',
  mood: 'neutral',
  score: 0,
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
    setState(prev => ({ ...prev, activeItemId: itemId }));
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
    setState(prev => ({ ...prev, ...partial }));
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
