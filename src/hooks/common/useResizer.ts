import { useState, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

interface UseResizerProps {
  initialWidth: string; // 초기 너비/높이 (예: '300px', '25%')
  minWidth: string; // 최소 너비/높이 (예: '200px', '15%')
  maxWidth: string; // 최대 너비/높이 (예: '500px', '50%')
  containerRef: RefObject<HTMLElement | null>;
  direction?: 'horizontal' | 'vertical'; // 리사이징 방향
}

const parseValue = (value: string): { value: number; unit: 'px' | '%' } => {
  if (value.endsWith('px')) {
    return { value: parseFloat(value), unit: 'px' };
  } else if (value.endsWith('%')) {
    return { value: parseFloat(value), unit: '%' };
  }
  // 단위가 없으면 px로 가정
  return { value: parseFloat(value), unit: 'px' };
};

const convertToPx = (value: string, containerSize: number): number => {
  const parsed = parseValue(value);
  if (parsed.unit === '%') {
    return (parsed.value / 100) * containerSize;
  }
  return parsed.value;
};

const convertFromPx = (pxValue: number, containerSize: number, originalValue: string): string => {
  const parsed = parseValue(originalValue);
  if (parsed.unit === '%') {
    const percent = (pxValue / containerSize) * 100;
    return `${Math.round(percent * 100) / 100}%`;
  }
  return `${Math.round(pxValue)}px`;
};

export const useResizer = ({
  initialWidth,
  minWidth,
  maxWidth,
  containerRef,
  direction = 'horizontal',
}: UseResizerProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      let newWidthPx: number;
      let containerSize: number;

      if (direction === 'horizontal') {
        newWidthPx = e.clientX - containerRect.left;
        containerSize = containerRect.width;
      } else {
        newWidthPx = e.clientY - containerRect.top;
        containerSize = containerRect.height;
      }

      const minWidthPx = convertToPx(minWidth, containerSize);
      const maxWidthPx = convertToPx(maxWidth, containerSize);

      const clampedWidthPx = Math.min(Math.max(newWidthPx, minWidthPx), maxWidthPx);

      const newWidth = convertFromPx(clampedWidthPx, containerSize, width);
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, containerRef, direction, width]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, resize, stopResize, direction]);

  return {
    width,
    isResizing,
    startResize,
  };
};
