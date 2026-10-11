import { useState } from 'react';
import DemoHomeLink from '../DemoHomeLink';
import ModuleSidebar from '../ModuleSidebar';
import ThemeToggle from '../ThemeToggle';
import NotificationCenter from '../NotificationCenter';

const navigationItems = [
  { href: '#/control', route: '/control', icon: 'home', label: 'Visão Geral' },
  { href: '#/control/occurrences', route: '/control/occurrences', icon: 'alert', label: 'Ocorrências' },
  { href: '#/control/technicians', route: '/control/technicians', icon: 'users', label: 'Técnicos' },
  { href: '#/control/elevators', route: '/control/elevators', icon: 'elevator', label: 'Elevadores' },
  { href: '#/control/preventives', route: '/control/preventives', icon: 'history', label: 'Preventivas' },
  { href: '#/control/analytics', route: '/control/analytics', icon: 'chart', label: 'Análises' },
];

export default function ControlShell({ route, user, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="module-shell">
      <ModuleSidebar module="Control" homeHref="#/control" navigationItems={navigationItems} route={route} profile={{ name: user.name, detail: user.role, avatar: user.avatar, category: 'leadership' }} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="module-workspace control-workspace">
        <header className="module-utility-bar control-utility-bar">
          <button className="module-menu-button control-menu-button" type="button" aria-label="Abrir menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>☰</button>
          <div className="module-utility-bar__title"><strong>HOP Control</strong><span>Central de Operações</span></div>
          <span className="control-live-status"><span aria-hidden="true">●</span> Atualizado em tempo real</span>
          <NotificationCenter module="control" />
          <DemoHomeLink />
          <ThemeToggle compact />
        </header>
        <main className="module-main control-main">{children}</main>
      </div>
    </div>
  );
}
