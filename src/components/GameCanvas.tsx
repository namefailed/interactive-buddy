import { useRef, useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import type { GameState } from '../types';

interface GameCanvasProps {
  activeItemId: string;
  activeSkinColor: string;
  unlockedItems: string[];
  money: number;
  onStateChange: (state: Partial<GameState>) => void;
  onMoneyEarned: (amount: number) => void;
}

export function GameCanvas({
  activeItemId,
  activeSkinColor,
  unlockedItems,
  money,
  onStateChange,
  onMoneyEarned,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lowGravity, setLowGravity] = useState(false);
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setOnStateChange,
    setOnMoneyEarned,
    setActiveItem,
    setSkin,
    setGravity,
    syncUnlockedItems,
    syncMoney,
  } = useGame(canvasRef);

  useEffect(() => {
    setOnStateChange(onStateChange);
  }, [onStateChange, setOnStateChange]);

  useEffect(() => {
    setOnMoneyEarned(onMoneyEarned);
  }, [onMoneyEarned, setOnMoneyEarned]);

  useEffect(() => {
    syncUnlockedItems(unlockedItems);
  }, [unlockedItems, syncUnlockedItems]);

  useEffect(() => {
    syncMoney(money);
  }, [money, syncMoney]);

  useEffect(() => {
    setActiveItem(activeItemId);
  }, [activeItemId, setActiveItem]);

  useEffect(() => {
    setSkin(activeSkinColor);
  }, [activeSkinColor, setSkin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setLowGravity(previous => {
          const next = !previous;
          setGravity(next ? 0.4 : 1.5);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setGravity]);

  return (
    <div className="stage-frame">
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        tabIndex={0}
        className="game-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="stage-badge">G toggles gravity</div>
      {lowGravity && <div className="gravity-badge">Low gravity</div>}
    </div>
  );
}
