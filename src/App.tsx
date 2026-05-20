import { useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Toolbar } from './components/Toolbar';
import { useGameState } from './hooks/useGameState';
import type { GameState } from './types';
import { ITEMS, SKINS, getItem, getSkin } from './game/items';
import './App.css';

function meterStyle(value: number) {
  return { width: Math.max(0, Math.min(100, value)) + '%' };
}

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

  const activeItem = getItem(state.activeItemId);
  const activeSkin = getSkin(state.activeSkinId ?? 'default') ?? SKINS[0];

  const unlockedCount = useMemo(
    () => state.unlockedItems.length + '/' + ITEMS.length,
    [state.unlockedItems.length]
  );

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
      if (!item || state.money < item.cost) return;
      updateFromEngine({ money: state.money - item.cost, reaction: item.name + ' added to the lab.' });
      unlockItem(itemId);
      setActiveItem(itemId);
    },
    [state.money, updateFromEngine, unlockItem, setActiveItem]
  );

  const handleBuySkin = useCallback(
    (skinId: string) => {
      const skin = SKINS.find(s => s.id === skinId);
      if (!skin || state.money < skin.cost) return;
      updateFromEngine({ money: state.money - skin.cost, reaction: skin.name + ' equipped.' });
      unlockSkin(skinId);
      setActiveSkin(skinId);
    },
    [state.money, updateFromEngine, unlockSkin, setActiveSkin]
  );

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <span className="status-dot" />
          <div>
            <p className="eyebrow">Studio Physics Pet</p>
            <h1>Interactive Buddy</h1>
          </div>
        </div>
        <div className="status-cluster" aria-label="Game status">
          <div className="stat-card money-card">
            <span>Bank</span>
            <strong>{'$'}{Math.floor(state.money)}</strong>
          </div>
          <div className="stat-card">
            <span>Score</span>
            <strong>{state.score}</strong>
          </div>
          <div className="stat-card compact">
            <span>Tools</span>
            <strong>{unlockedCount}</strong>
          </div>
        </div>
      </header>

      <section className="game-layout">
        <section className="stage-column" aria-label="Interactive stage">
          <div className="stage-header">
            <div>
              <p className="eyebrow">Active experiment</p>
              <h2>{activeItem?.name ?? 'Fist'}</h2>
            </div>
            <div className={'mood-pill ' + state.mood}>{state.mood}</div>
          </div>

          <GameCanvas
            activeItemId={state.activeItemId}
            activeSkinColor={activeSkin.color}
            unlockedItems={state.unlockedItems}
            money={state.money}
            onStateChange={handleStateChange}
            onMoneyEarned={handleMoneyEarned}
          />

          <div className="reaction-strip">
            <div className="reaction-copy">
              <span>Buddy signal</span>
              <strong>{state.reaction}</strong>
            </div>
            <div className="meter-grid">
              <label>
                <span>Trust</span>
                <div className="meter"><i className="trust" style={meterStyle(state.trust)} /></div>
              </label>
              <label>
                <span>Stress</span>
                <div className="meter"><i className="stress" style={meterStyle(state.stress)} /></div>
              </label>
            </div>
          </div>
        </section>

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
      </section>
    </main>
  );
}
