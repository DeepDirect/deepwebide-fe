import { useState, useRef } from 'react';
import MainPageType from '@/constants/enums/MainPageType.enum';
import type { Position } from '@/types/main/position.types';

const MODAL_OFFSETS = {
  [MainPageType.PRIVATE_REPO]: -165,
  [MainPageType.SHARED_BY_ME]: -267,
  [MainPageType.SHARED_WITH_ME]: -172,
} as const;

export const useMeatballModal = (pageType: MainPageType) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({});
  const meatballRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (meatballRef.current) {
      const rect = meatballRef.current.getBoundingClientRect();
      const browserHeight = window.innerHeight / 2;
      const offset = MODAL_OFFSETS[pageType];

      const newPosition =
        rect.bottom < browserHeight ? { bottom: offset, right: 0 } : { top: offset, right: 0 };

      setPosition(newPosition);
    }
    setIsOpen(prev => !prev);
  };

  return {
    isOpen,
    setIsOpen,
    position,
    meatballRef,
    handleClick,
  };
};
