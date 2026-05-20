import { useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Toolbar } from './components/Toolbar';
import { useGameState } from './hooks/useGameState';
import type { GameState } from './types';
import { ITEMS, SKINS, getSkin } from './game/items';
import './App.css';

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', neutral: '😐', sad: '😢', angry: '😠', scared: '😨',
};

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


  const activeSkin = getSkin(state.activeSkinId ?? 'default') ?? SKINS[0];

  const handleStateChange = useCallback(
    (partial: Partial<GameState>) => { updateFromEngine(partial); },
    [updateFromEngine]
  );

  const handleMoneyEarned = useCallback(
    (amount: number) => { addMoney(amount); },
    [addMoney]
  );

  const handleBuyItem = useCallback(
    (itemId: string) => {
      const item = ITEMS.find(i => i.id === itemId);
      if (!item || state.money < item.cost) return;
      updateFromEngine({ money: state.money - item.cost, reaction: item.name + ' unlocked!' });
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

  // Health dots: 10 dots
  const healthDots = useMemo(() => {
    const filled = Math.round((state.trust / 100) * 10); // use trust as "bond" proxy
    const hp = state.stress;
    const danger = hp > 60;
    return Array.from({ length: 10 }, (_, i) => ({
      filled: i < filled,
      danger,
    }));
  }, [state.trust, state.stress]);

  const unlockedCount = state.unlockedItems.length + '/' + ITEMS.length;

  return (
    <main className="app-shell">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="status-dot" style={{ background: activeSkin.color, boxShadow: `0 0 8px ${activeSkin.color}` }} />
          <span className="nav-title">Blobby</span>
        </div>

        <nav className="nav-stats">
          <div className="nav-stat money">
            <span className="stat-icon">💰</span>
            <span>${Math.floor(state.money)}</span>
          </div>
          <div className={`mood-pill ${state.mood}`}>
            {MOOD_EMOJI[state.mood] ?? '😐'} {state.mood}
          </div>
          <div className="nav-stat">
            <span className="stat-icon">⭐</span>
            <span>{state.score.toLocaleString()}</span>
          </div>
          <div className="nav-stat">
            <span className="stat-icon">🔧</span>
            <span>{unlockedCount}</span>
          </div>
        </nav>
      </header>

      {/* ── Game Layout ── */}
      <section className="game-layout">
        {/* Canvas + Status */}
        <section className="stage-area" aria-label="Interactive stage">
          <GameCanvas
            activeItemId={state.activeItemId}
            activeSkinColor={activeSkin.color}
            unlockedItems={state.unlockedItems}
            money={state.money}
            onStateChange={handleStateChange}
            onMoneyEarned={handleMoneyEarned}
          />

          {/* Slim status bar */}
          <div className="status-bar">
            <div className="reaction-text">
              <span className="bubble-icon">💬</span>
              <span>{state.reaction}</span>
            </div>

            <div className="trust-bar-wrap">
              <span className="trust-label">Trust</span>
              <div className="mini-bar">
                <div className="mini-bar-fill trust" style={{ width: `${state.trust}%` }} />
              </div>
            </div>

            <div className="trust-bar-wrap">
              <span className="trust-label">Stress</span>
              <div className="mini-bar">
                <div className="mini-bar-fill stress" style={{ width: `${state.stress}%` }} />
              </div>
            </div>

            <div className="health-dots" title={`Bond: ${Math.round(state.trust)}%`}>
              {healthDots.map((d, i) => (
                <span
                  key={i}
                  className={`health-dot ${d.filled ? 'filled' : ''} ${d.filled && d.danger ? 'danger' : ''}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar */}
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
