import React, { useState, useCallback } from 'react';

export interface WindowState {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface WindowManagerProps {
  children: React.ReactNode;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ children }) => {
  const [windows, setWindows] = useState<Map<string, WindowState>>(new Map());
  const [maxZIndex, setMaxZIndex] = useState(100);

  const registerWindow = useCallback((id: string, title: string) => {
    setWindows(prev => {
      if (prev.has(id)) return prev;
      const newMap = new Map(prev);
      newMap.set(id, {
        id,
        title,
        isMinimized: false,
        isMaximized: false,
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: 400,
        height: 300,
        zIndex: maxZIndex,
      });
      return newMap;
    });
  }, [maxZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      const window = newMap.get(id);
      if (window) {
        window.isMinimized = !window.isMinimized;
      }
      return newMap;
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
    setMaxZIndex(prev => prev + 1);
    setWindows(prev => {
      const newMap = new Map(prev);
      const window = newMap.get(id);
      if (window) {
        window.zIndex = maxZIndex + 1;
      }
      return newMap;
    });
  }, [maxZIndex]);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      const window = newMap.get(id);
      if (window) {
        window.x = x;
        window.y = y;
      }
      return newMap;
    });
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => {
      const newMap = new Map(prev);
      const window = newMap.get(id);
      if (window) {
        window.width = width;
        window.height = height;
      }
      return newMap;
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black matrix-bg">
      {children}
    </div>
  );
};

export default WindowManager;
