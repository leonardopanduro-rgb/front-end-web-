import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const EmptyState = ({ title, subtitle, ctaLabel, onCta }: EmptyStateProps) => (
  <div className="state state-empty">
    <strong>{title}</strong>
    {subtitle ? <span>{subtitle}</span> : null}
    {ctaLabel && onCta ? <AppButton onClick={onCta}>{ctaLabel}</AppButton> : null}
  </div>
);
