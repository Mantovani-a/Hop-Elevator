import { useState, useEffect } from 'react';
import { subscribeSyncStatus } from '../data/firebaseSync';

export default function SyncStatusBadge({ className = '' }) {
  const [status, setStatus] = useState({ configured: false, connected: false });

  useEffect(() => {
    return subscribeSyncStatus(setStatus);
  }, []);

  if (!status.configured) {
    return (
      <span
        className={`badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle ${className}`}
        style={{ fontSize: '0.75rem', fontWeight: 500 }}
        title="Ambiente demonstrativo isolado. O estado opera em modo sandbox no seu navegador sem interferir na apresentação oficial."
      >
        <span className="me-1" aria-hidden="true">🔹</span>
        Demonstração: Modo Sandbox
      </span>
    );
  }

  if (status.connected) {
    return (
      <span
        className={`badge rounded-pill bg-success-subtle text-success border border-success-subtle ${className}`}
        style={{ fontSize: '0.75rem', fontWeight: 500 }}
        title="Conectado à nuvem. Todas as alterações refletem no tablet, celular e notebook em tempo real."
      >
        <span className="me-1" aria-hidden="true">🟢</span>
        Multidispositivo Ativo
      </span>
    );
  }

  return (
    <span
      className={`badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle ${className}`}
      style={{ fontSize: '0.75rem', fontWeight: 500 }}
      title="Conectando aos servidores de sincronização..."
    >
      <span className="me-1" aria-hidden="true">🟡</span>
      Conectando à nuvem...
    </span>
  );
}
