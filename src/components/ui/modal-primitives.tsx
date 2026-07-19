import React from 'react';
import { X } from 'lucide-react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export interface StandardDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const sizeClasses: Record<NonNullable<StandardDialogContentProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export const StandardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  StandardDialogContentProps
>(({ className = '', size = 'lg', children, ...props }, ref) => {
  return (
    <DialogContent
      ref={ref}
      className={`${sizeClasses[size]} w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden ${className}`}
      {...props}
    >
      {children}
    </DialogContent>
  );
});
StandardDialogContent.displayName = 'StandardDialogContent';

export interface ModalHeaderProps {
  title: string;
  icon?: React.ReactNode;
  iconVariant?: 'default' | 'danger' | 'warning';
  onClose?: () => void;
  titleBadge?: React.ReactNode;
  className?: string;
}

const iconVariantClasses = {
  default: 'bg-[#2a78d6]/10 text-[#2a78d6]',
  danger: 'bg-red-500/10 text-red-500',
  warning: 'bg-amber-500/10 text-amber-500',
};

export const ModalHeader = ({
  title,
  icon,
  iconVariant = 'default',
  onClose,
  titleBadge,
  className = '',
}: ModalHeaderProps) => {
  return (
    <DialogHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${iconVariantClasses[iconVariant]} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
          {title}
        </DialogTitle>
        {titleBadge}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700 flex-shrink-0"
          title="Close"
        >
          <X size={18} />
        </button>
      )}
    </DialogHeader>
  );
};

export interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
}

export const FormLabel = ({ children, required, className = '', ...props }: FormLabelProps) => {
  return (
    <Label className={`text-sm font-semibold text-gray-800 dark:text-zinc-200 ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );
};

export interface ModalFooterProps {
  onCancel?: () => void;
  cancelText?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ModalFooter = ({
  onCancel,
  cancelText = 'Cancel',
  children,
  className = '',
}: ModalFooterProps) => {
  return (
    <div className={`pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5 shrink-0 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
        >
          {cancelText}
        </button>
      )}
      {children}
    </div>
  );
};
