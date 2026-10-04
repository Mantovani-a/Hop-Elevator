import HopLogo from './HopLogo';
import ProfileAvatar from './ProfileAvatar';

const navigationIcons = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.9L8.7 10.7a16 16 0 0 0 4.6 4.6l1.3-1.3a2 2 0 0 1 1.9-.6l2.8.5a2 2 0 0 1 1.7 2Z',
  check: 'm6 12 4 4 8-8',
  target: 'M12 2v4m0 12v4M2 12h4m12 0h4M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  alert: 'M12 3 2 21h20L12 3Zm0 6v5m0 3v1',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.75',
  elevator: 'M4 3h16v18H4V3Zm8 0v18M7 10l2-2 2 2m2 4 2 2 2-2',
  chart: 'M4 3v18h17M8 16v-5m5 5V7m5 9v-7',
  parts: 'm12 2 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V7M12 12v10',
  plus: 'M12 5v14M5 12h14',
  calls: 'M6 3h12v18H6V3Zm3 5h6m-6 4h6m-6 4h4',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',
  history: 'M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7m2-4v5l3 2',
  location: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2',
  building: 'M4 22V3h12v19M8 7h4M8 11h4M8 15h4m4-6h4v13M2 22h20',
  hospital: 'M12 7v6m-3-3h6M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
  shopping: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0',
  hotel: 'M3 7h18M3 21h18M4 11h16M7 11V7m10 4V7M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14',
  residential: 'M3 10 12 3l9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Zm6 12v-7h6v7',
  school: 'm4 6 8-4 8 4-8 4-8-4Zm14 4.5v5.5m-12-3.5v5.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5.5',
  tool: 'M14.7 6.3a4 4 0 0 1-5 5L4 17l3 3 5.7-5.7a4 4 0 0 1 5-5l-3 3-3-3 3-3Z',
  document: 'M6 3h9l3 3v15H6V3Zm9 0v4h4M9 12h6m-6 4h6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-10v.01',
};

export function ModuleIcon({ name, size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={navigationIcons[name]} /></svg>;
}

export default function ModuleSidebar({
  module,
  homeHref,
  navigationItems,
  route,
  profile,
  open,
  onClose,
  isRouteActive = (currentRoute, itemRoute) => currentRoute === itemRoute,
}) {
  return (
    <>
      <button
        className={`module-backdrop${open ? ' is-open' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside className={`module-sidebar${open ? ' is-open' : ''}`} aria-label={`Navegação principal do HOP ${module}`}>
        <a className="module-sidebar__brand" href={homeHref} aria-label={`Ir para o início do HOP ${module}`} onClick={onClose}>
          <HopLogo variant={module.toLowerCase()} size="sidebar" />
        </a>
        <nav className="module-sidebar__links">
          {navigationItems.map((item) => {
            const active = isRouteActive(route, item.route);
            return (
              <a
                key={item.route}
                href={item.href}
                className={`module-sidebar__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
              >
                <ModuleIcon name={item.icon} /><span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="module-sidebar__user">
          <ProfileAvatar name={profile.name} src={profile.avatar} category={profile.category} size="md" className="module-sidebar__avatar" decorative />
          <div><strong>{profile.name}</strong><small>{profile.detail}</small></div>
        </div>
      </aside>
    </>
  );
}
