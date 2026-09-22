import { useEffect, useState } from 'react';
import HopLogo from '../HopLogo';
import ProfileAvatar from '../ProfileAvatar';
import DemoHomeLink from '../DemoHomeLink';

export default function OperatorShiftClosed({ onStartShift, isStarting = false, technician }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={`operator-shift-closed${isStarting ? ' is-starting' : ''}`}>
      <div className="operator-shift-closed__mesh-bg" aria-hidden="true">
        <span className="operator-shift-closed__mesh-orb operator-shift-closed__mesh-orb--1" />
        <span className="operator-shift-closed__mesh-orb operator-shift-closed__mesh-orb--2" />
        <span className="operator-shift-closed__mesh-orb operator-shift-closed__mesh-orb--3" />
      </div>

      <header className="operator-shift-closed__top-bar">
        <DemoHomeLink />
      </header>

      <section className="operator-shift-closed__content" aria-labelledby="shift-closed-title">
        <div className="operator-shift-closed__card">
          <div className="operator-shift-closed__logo"><HopLogo variant="operator" size="shift" /></div>
          <div className="operator-shift-closed__body">
            <div className="operator-shift-closed__identity">
              <ProfileAvatar name={technician?.name || 'Técnico de campo'} src={technician?.avatar} size="lg" decorative />
              <div><p>HOP Operator</p><h1 id="shift-closed-title">{technician?.name || 'Técnico de campo'}</h1><span>{technician?.role || 'Técnico de campo'}</span><strong><i aria-hidden="true" /> Fora de turno</strong></div>
            </div>
            <div className="operator-shift-closed__date"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg><time dateTime={now.toISOString()}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(now)}</time></div>
            <p className="operator-shift-closed__message">Inicie seu turno para acessar a fila e os atendimentos atribuídos.</p>
            <button className="operator-shift-closed__cta" type="button" disabled={isStarting} onClick={onStartShift}><span aria-hidden="true">▶</span>{isStarting ? 'Iniciando turno…' : 'Iniciar turno'}</button>
            <a href="#/" className="operator-shift-closed__return-link">
              <span aria-hidden="true">←</span> Voltar ao painel demonstrativo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
