import { useRef } from 'react';
import useDialogFocus from '../hooks/useDialogFocus';

export default function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  titleId = 'modal-title',
  ariaLabel,
  className = '',
  layerClassName = 'control-modal-layer',
  showHeader = true,
  children,
}) {
  const modalRef = useRef(null);
  useDialogFocus(isOpen, modalRef, onClose);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className={layerClassName}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? ariaLabel : undefined}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`control-modal ${className}`.trim()}
        tabIndex="-1"
      >
        {showHeader && (
          <header>
            <div>
              {eyebrow && <p className="eyebrow eyebrow--dark mb-1">{eyebrow}</p>}
              {title && <h2 id={titleId}>{title}</h2>}
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar modal">
              ×
            </button>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
