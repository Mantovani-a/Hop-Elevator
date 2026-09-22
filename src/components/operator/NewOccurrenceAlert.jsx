import { useEffect, useRef } from 'react';
import PriorityIndicator from './PriorityIndicator';

export default function NewOccurrenceAlert({ occurrence, open, onClose, onAccept, onView }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1080, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="app-card p-3 p-sm-4 position-relative w-100 overflow-auto" style={{ maxWidth: '560px', maxHeight: 'calc(100vh - 2rem)', borderLeft: '3px solid var(--color-severity-critical)' }} role="dialog" aria-modal="true" aria-labelledby="new-occurrence-title">
        <button ref={closeButtonRef} className="position-absolute top-0 end-0 m-3 btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center border-0" style={{ width: '44px', height: '44px', fontSize: '1.5rem' }} type="button" aria-label="Fechar alerta" onClick={onClose}>&times;</button>
        <p className="text-primary fw-bold text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Nova atribuição</p>
        <h2 className="fs-4 mb-4 pe-5" id="new-occurrence-title">Nova ocorrência atribuída a João Carlos</h2>
        <PriorityIndicator priority={occurrence?.priority} />
        <div className="my-4 pt-3 border-top d-grid gap-1">
          <strong className="fs-5">{occurrence?.client?.name || 'Cliente'}</strong>
          <span className="text-secondary" style={{ fontSize: '0.86rem' }}>{occurrence?.elevator?.identification || occurrence?.elevator?.displayName || occurrence?.elevatorId || 'Elevador'}</span>
          <p className="mt-3 mb-0 fs-5 fw-normal">{occurrence?.description || 'Intercorrência reportada'}</p>
        </div>
        <div className="d-grid gap-3 mt-5">
          <button className="btn btn-primary btn-lg" type="button" onClick={onAccept}>ACEITAR OCORRÊNCIA</button>
          <button className="btn btn-outline-primary btn-lg" type="button" onClick={onView}>Visualizar detalhes</button>
        </div>
      </section>
    </div>
  );
}
