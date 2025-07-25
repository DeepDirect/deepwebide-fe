import { useState, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

interface UseResizerProps {
  initialWidth: number; // 초기 너비 (비율, 0-100)
  minWidth: number; // 최소 너비 (비율, 0-100)
  maxWidth: number; // 최대 너비 (비율, 0-100)
  containerRef: RefObject<HTMLElement | null>;
}

export const useResizer = ({ initialWidth, minWidth, maxWidth, containerRef }: UseResizerProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - containerRect.left;
      const newWidthPercent = (newWidthPx / containerRect.width) * 100;

      // 최소/최대 너비 제한
      const clampedWidth = Math.min(Math.max(newWidthPercent, minWidth), maxWidth);
      setWidth(clampedWidth);
    },
    [isResizing, minWidth, maxWidth, containerRef]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, resize, stopResize]);

  return {
    width,
    isResizing,
    startResize,
  };
};
