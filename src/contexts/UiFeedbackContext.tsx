import { createContext, ReactNode, useCallback, useRef, useState } from 'react';
import { AppButton } from '../components/AppButton';
import { Modal } from '../components/Modal';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

interface UiFeedbackValue {
  /** Muestra un dialogo de confirmacion y resuelve true/false segun la eleccion. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Muestra un toast temporal (success | error | info). */
  notify: (message: string, type?: ToastType) => void;
}

export const UiFeedbackContext = createContext<UiFeedbackValue>({} as UiFeedbackValue);

let toastSeq = 0;

export const UiFeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '' });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastSeq;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setConfirmState({ ...options, open: true });
  }), []);

  const close = useCallback((result: boolean) => {
    setConfirmState((current) => ({ ...current, open: false }));
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  return (
    <UiFeedbackContext.Provider value={{ confirm, notify }}>
      {children}
      <Modal open={confirmState.open} title={confirmState.title ?? 'Confirmar'} onClose={() => close(false)}>
        <div className="modal-form">
          <p>{confirmState.message}</p>
          <div className="modal-actions">
            <AppButton variant={confirmState.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {confirmState.confirmLabel ?? 'Confirmar'}
            </AppButton>
            <AppButton variant="outline" onClick={() => close(false)}>
              {confirmState.cancelLabel ?? 'Cancelar'}
            </AppButton>
          </div>
        </div>
      </Modal>
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">{toast.message}</div>
        ))}
      </div>
    </UiFeedbackContext.Provider>
  );
};
