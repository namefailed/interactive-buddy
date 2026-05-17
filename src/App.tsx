import { useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Toolbar } from './components/Toolbar';
import { useGameState } from './hooks/useGameState';
import type { GameState } from './types';
import { ITEMS, SKINS } from './game/items';
import './App.css';

export default function App() {
  const {
    state,
    addMoney,
    updateFromEngine,
    setActiveItem,
    setActiveSkin,
    unlockItem,
    unlockSkin,
  } = useGameState();

  const handleStateChange = useCallback(
    (partial: Partial<GameState>) => {
      updateFromEngine(partial);
    },
    [updateFromEngine]
  );

  const handleMoneyEarned = useCallback(
    (amount: number) => {
      addMoney(amount);
    },
    [addMoney]
  );

  const handleBuyItem = useCallback(
    (itemId: string) => {
      const item = ITEMS.find(i => i.id === itemId);
      if (!item) return;
      if (state.money >= item.cost) {
        updateFromEngine({ money: state.money - item.cost });
        unlockItem(itemId);
        setActiveItem(itemId);
      }
    },
    [state.money, updateFromEngine, unlockItem, setActiveItem]
  );

  const handleBuySkin = useCallback(
    (skinId: string) => {
      const skin = SKINS.find(s => s.id === skinId);
      if (!skin) return;
      if (state.money >= skin.cost) {
        updateFromEngine({ money: state.money - skin.cost });
        unlockSkin(skinId);
        setActiveSkin(skinId);
      }
    },
    [state.money, updateFromEngine, unlockSkin, setActiveSkin]
  );

  return (
    <div className="app">
      <div className="title-bar">
        <div className="title-text">
          <span className="title-icon">●</span>
          Interactive Buddy
        </div>
        <div className="title-controls">
          <span className="money-display">${Math.floor(state.money)}</span>
        </div>
      </div>

      <div className="main-area">
        <div className="canvas-wrapper">
          <GameCanvas
            onStateChange={handleStateChange}
            onMoneyEarned={handleMoneyEarned}
          />
          <div className="hint">Click on the buddy to interact!</div>
        </div>

        <Toolbar
          activeItemId={state.activeItemId}
          unlockedItems={state.unlockedItems}
          unlockedSkins={state.unlockedSkins}
          activeSkinId={state.activeSkinId}
          money={state.money}
          onSelectItem={setActiveItem}
          onSelectSkin={setActiveSkin}
          onBuyItem={handleBuyItem}
          onBuySkin={handleBuySkin}
        />
      </div>

      <div className="bottom-bar">
        <span>Score: {state.score}</span>
        <span className="mood-display">Mood: {state.mood}</span>
        <span>Items unlocked: {state.unlockedItems.length}/{ITEMS.length}</span>
      </div>
    </div>
  );
}
