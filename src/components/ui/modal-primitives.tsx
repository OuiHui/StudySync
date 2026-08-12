import React from 'react';
import { X } from 'lucide-react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      className={`${sizeClasses[size]} w-full bg-popover text-popover-foreground border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden ${className}`}
      {...props}
    >
      {children}
    </DialogContent>
  );
});
StandardDialogContent.displayName = 'StandardDialogContent';

export interface ModalHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconVariant?: 'default' | 'danger' | 'warning';
  onClose?: () => void;
  titleBadge?: React.ReactNode;
  className?: string;
}

const iconVariantClasses = {
  default: 'bg-brand/10 text-brand',
  danger: 'bg-red-500/10 text-red-500',
  warning: 'bg-amber-500/10 text-amber-500',
};

export const ModalHeader = ({
  title,
  description,
  icon,
  iconVariant = 'default',
  onClose,
  titleBadge,
  className = '',
}: ModalHeaderProps) => {
  return (
    <DialogHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border shrink-0 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${iconVariantClasses[iconVariant]} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
        <DialogTitle className="text-2xl font-bold text-foreground tracking-tight truncate">
          {title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {description || `Modal dialog for ${title}`}
        </DialogDescription>
        {titleBadge}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
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
    <Label className={`text-sm font-semibold text-foreground ${className}`} {...props}>
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
    <div className={`pt-3 border-t border-border flex items-center justify-end gap-2.5 shrink-0 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
        >
          {cancelText}
        </button>
      )}
      {children}
    </div>
  );
};
