import { AppError } from '../types/apiError';
import { AppButton } from './AppButton';

export const ErrorMessage = ({ error, onRetry }: { error: AppError | null; onRetry?: () => void }) => (
  <div className="state state-error">
    <strong>No se pudo completar la operacion</strong>
    <span>{error?.message ?? 'Ocurrio un error inesperado.'}</span>
    {onRetry ? <AppButton variant="outline" onClick={onRetry}>Reintentar</AppButton> : null}
  </div>
);
