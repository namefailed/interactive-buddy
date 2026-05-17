import { useRef, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import type { GameState } from '../types';

interface GameCanvasProps {
  onStateChange: (state: Partial<GameState>) => void;
  onMoneyEarned: (amount: number) => void;
}

export function GameCanvas({ onStateChange, onMoneyEarned }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setOnStateChange,
    setOnMoneyEarned,
  } = useGame(canvasRef);

  useEffect(() => {
    setOnStateChange(onStateChange);
  }, [onStateChange, setOnStateChange]);

  useEffect(() => {
    setOnMoneyEarned(onMoneyEarned);
  }, [onMoneyEarned, setOnMoneyEarned]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      style={{
        borderRadius: 12,
        cursor: 'crosshair',
        display: 'block',
        boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
