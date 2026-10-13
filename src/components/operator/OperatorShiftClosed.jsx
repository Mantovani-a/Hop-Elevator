import { useEffect, useState } from 'react';
import DemoHomeLink from '../DemoHomeLink';
import ThemeToggle from '../ThemeToggle';
import OperatorShiftLanding from './OperatorShiftLanding';

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
          <span className="operator-shift-closed__brand-name">HOP Operator</span>
          <span className="operator-shift-closed__brand-divider" aria-hidden="true">/</span>
          <span className="operator-shift-closed__brand-context">Estação de Ponto &amp; Prontidão</span>
        </div>
        <div className="operator-shift-closed__meta">
          <OperatorLiveClock />
          <span className="operator-shift-closed__sync">
            <span className="operator-shift-closed__sync-dot" aria-hidden="true" />
            Central Conectada
          </span>
          <ThemeToggle compact />
          <DemoHomeLink />
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

