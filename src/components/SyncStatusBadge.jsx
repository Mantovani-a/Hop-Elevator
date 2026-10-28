import { useState, useEffect } from 'react';
import { subscribeSyncStatus } from '../data/realtimeSync.js';

export default function SyncStatusBadge({ className = '' }) {
  const [status, setStatus] = useState({ connected: true });

  useEffect(() => {
    return subscribeSyncStatus(setStatus);
  }, []);

  return (
    <span
      className={`badge rounded-pill bg-success-subtle text-success border border-success-subtle ${className}`}
      style={{ fontSize: '0.75rem', fontWeight: 500 }}
      title="Sincronização entre abas ativa via BroadcastChannel."
    >
      <span className="me-1" aria-hidden="true">🟢</span>
      Sincronizado em Tempo Real
    </span>
  );
}
