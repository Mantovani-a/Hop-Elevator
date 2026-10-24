import { useEffect, useState } from 'react';
import SettingsButton from '../SettingsButton';
import NotificationCenter from '../NotificationCenter';
import HopLogo from '../HopLogo';
import OperatorShiftLanding from './OperatorShiftLanding';
import { subscribeSyncStatus } from '../../data/firebaseSync';

function OperatorConnectionStatus() {
  const [syncStatus, setSyncStatus] = useState({ configured: false, connected: false });

  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  const state = !syncStatus.configured ? 'local' : syncStatus.connected ? 'connected' : 'connecting';
  const label = state === 'local' ? 'Modo Local' : state === 'connected' ? 'Central Conectada' : 'Conectando à central';

  return <span className={`operator-shift-closed__sync is-${state}`} role="status"><span className="operator-shift-closed__sync-dot" aria-hidden="true" />{label}</span>;
}

function OperatorLiveClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(currentTime);

  return (
    <div className="operator-shift-closed__clock">
      <span className="operator-shift-closed__date">{capitalizedDate}</span>
      <span className="operator-shift-closed__time">{timeFormatted}</span>
    </div>
  );
}

export default function OperatorShiftClosed({
  onShiftAction,
  onSaveShiftPlan,
  shiftEvents = [],
  shiftPlan,
  isStarting = false,
  technician,
}) {
  return (
    <div className="operator-shift-closed">
      <header className="operator-shift-closed__top-bar">
        <div className="operator-shift-closed__brand">
          <HopLogo variant="operatorShift" size="shift-header" className="operator-shift-closed__logo" />
          <span className="operator-shift-closed__brand-name">HOP Operator</span>
          <span className="operator-shift-closed__brand-divider" aria-hidden="true">/</span>
          <span className="operator-shift-closed__brand-context">Estação de Ponto &amp; Prontidão</span>
        </div>
        <div className="operator-shift-closed__meta">
          <OperatorLiveClock />
          <OperatorConnectionStatus />
          <NotificationCenter module="operator" recipientId={technician.id} />
          <SettingsButton />
        </div>
      </header>
      <main className="operator-shift-closed__content">
        <OperatorShiftLanding
          technician={technician}
          shiftEvents={shiftEvents}
          shiftPlan={shiftPlan}
          onShiftAction={onShiftAction}
          onSaveShiftPlan={onSaveShiftPlan}
          isStarting={isStarting}
        />
      </main>
    </div>
  );
}

