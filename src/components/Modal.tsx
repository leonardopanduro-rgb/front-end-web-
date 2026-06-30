import { ReactNode } from 'react';
import { AppButton } from './AppButton';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export const Modal = ({ open, title, children, onClose }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <AppButton variant="ghost" className="icon-button" onClick={onClose} aria-label="Cerrar">x</AppButton>
        </div>
        {children}
      </section>
    </div>
  );
};
