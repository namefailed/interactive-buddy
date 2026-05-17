import { useRef, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import type { GameState } from '../types';

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [canvasRef]);

  return {
    setOnStateChange: (handler: (state: Partial<GameState>) => void) => {
      if (engineRef.current) engineRef.current.onStateChange = handler;
    },
    setOnMoneyEarned: (handler: (amount: number) => void) => {
      if (engineRef.current) engineRef.current.onMoneyEarned = handler;
    },
    handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => {
      engineRef.current?.onMouseDown(e);
    },
    handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => {
      engineRef.current?.onMouseMove(e);
    },
    handleMouseUp: () => {
      engineRef.current?.onMouseUp();
    },
    setActiveItem: (itemId: string) => {
      engineRef.current?.setActiveItem(itemId);
    },
    setSkin: (color: string) => {
      engineRef.current?.setSkin(color);
    },
    setGravity: (scale: number) => {
      engineRef.current?.setGravity(scale);
    },
    unlockItemInEngine: (itemId: string): boolean => {
      return engineRef.current?.unlockItem(itemId) ?? false;
    },
  };
}
