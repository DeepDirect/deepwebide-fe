import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import styles from './Tooltip.module.scss';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export const Tooltip = ({ label, children }: TooltipProps) => (
  <TooltipPrimitive.Provider delayDuration={350}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side="top" sideOffset={10} className={styles.tooltip}>
          {label}
          <TooltipPrimitive.Arrow className={styles.arrow} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
);
