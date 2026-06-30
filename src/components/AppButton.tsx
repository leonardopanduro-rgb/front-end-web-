import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  title?: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export const AppButton = ({
  children,
  title,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}: AppButtonProps) => (
  <button
    type={type}
    className={`btn btn-${variant} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? 'Cargando...' : children ?? title}
  </button>
);
