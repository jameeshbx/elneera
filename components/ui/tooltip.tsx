'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

interface TooltipContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export const TooltipContent = ({
  children,
  className = '',
  side = 'top',
  align = 'center',
  sideOffset = 5,
}: TooltipContentProps) => {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={`z-50 rounded px-3 py-1.5 text-sm bg-black text-white shadow-md ${className}`}
      >
        {children}
        <RadixTooltip.Arrow className="fill-black" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
};
