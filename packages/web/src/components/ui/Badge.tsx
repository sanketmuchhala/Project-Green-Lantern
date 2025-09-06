import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-neutral-800 text-neutral-200 border-neutral-700',
  primary: 'bg-blue-900 text-blue-200 border-blue-700',
  success: 'bg-green-900 text-green-200 border-green-700',
  warning: 'bg-amber-900 text-amber-200 border-amber-700',
  danger: 'bg-red-900 text-red-200 border-red-700'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};