import { useRef, useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import type { GameState } from '../types';

interface GameCanvasProps {
  onStateChange: (state: Partial<GameState>) => void;
  onMoneyEarned: (amount: number) => void;
}

export function GameCanvas({ onStateChange, onMoneyEarned }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lowGravity, setLowGravity] = useState(false);
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setOnStateChange,
    setOnMoneyEarned,
    setGravity,
  } = useGame(canvasRef);

  useEffect(() => {
    setOnStateChange(onStateChange);
  }, [onStateChange, setOnStateChange]);

  useEffect(() => {
    setOnMoneyEarned(onMoneyEarned);
  }, [onMoneyEarned, setOnMoneyEarned]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setLowGravity(p => {
          const next = !p;
          setGravity(next ? 0.4 : 1.5);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setGravity]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        tabIndex={0}
        style={{
          borderRadius: 12,
          cursor: 'crosshair',
          display: 'block',
          outline: 'none',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {lowGravity && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(52,152,219,0.8)', color: '#fff',
          padding: '4px 10px', borderRadius: 6, fontSize: 11,
          fontWeight: 700, letterSpacing: 0.5, pointerEvents: 'none',
        }}>
          LOW GRAVITY
        </div>
      )}
    </div>
  );
}
