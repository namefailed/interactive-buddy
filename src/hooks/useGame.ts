import { useRef, useEffect, useCallback } from 'react';
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

  const setOnStateChange = useCallback((handler: (state: Partial<GameState>) => void) => {
    if (engineRef.current) engineRef.current.onStateChange = handler;
  }, []);

  const setOnMoneyEarned = useCallback((handler: (amount: number) => void) => {
    if (engineRef.current) engineRef.current.onMoneyEarned = handler;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    engineRef.current?.onMouseDown(e);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    engineRef.current?.onMouseMove(e);
  }, []);

  const handleMouseUp = useCallback(() => {
    engineRef.current?.onMouseUp();
  }, []);

  const setActiveItem = useCallback((itemId: string) => {
    engineRef.current?.setActiveItem(itemId);
  }, []);

  const setSkin = useCallback((color: string) => {
    engineRef.current?.setSkin(color);
  }, []);

  const setGravity = useCallback((scale: number) => {
    engineRef.current?.setGravity(scale);
  }, []);

  const syncUnlockedItems = useCallback((itemIds: string[]) => {
    engineRef.current?.syncUnlockedItems(itemIds);
  }, []);

  const syncMoney = useCallback((money: number) => {
    engineRef.current?.syncMoney(money);
  }, []);

  return {
    setOnStateChange,
    setOnMoneyEarned,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setActiveItem,
    setSkin,
    setGravity,
    syncUnlockedItems,
    syncMoney,
  };
}
