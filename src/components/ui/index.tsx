import Link from 'next/link';
import { ReactNode } from 'react';

/** Base button. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isActive = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-rail-600 text-white hover:bg-rail-700 focus:ring-rail-500 shadow-sm',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-400',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };
  const activeStyles = isActive
    ? 'ring-2 ring-rail-400 bg-rail-50'
    : '';

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Render a responsive icon + text button. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  isActive = false,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      isActive={isActive}
      className={className}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  );
}

/** Card container with subtle glassmorphism styling. */
export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  return (
    <div
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

/** Inline text for supporting info. */
export function Text({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-slate-600 dark:text-slate-400 ${className}`}>{children}</p>;
}

/** Page heading. */
export function PageHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`text-2xl font-semibold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h1>
  );
}

/** Small label. */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}>
      {children}
    </span>
  );
}

/** Empty state for when a list is empty. */
export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-slate-400">{icon}</div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
    </div>
  );
}
