import { useEffect, useState, lazy, Suspense } from 'react';
import HomePage from './pages/HomePage';
import { ModelUploadProvider } from './context/ModelUploadContext';
import { getCurrentRoute } from './utils/navigation';

const ClientPage = lazy(() => import('./pages/ClientPage'));
const ControlPage = lazy(() => import('./pages/ControlPage'));
const OperatorPage = lazy(() => import('./pages/OperatorPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

const routeMap = {
  '/': HomePage,
  '/control': ControlPage,
  '/operator': OperatorPage,
  '/client': ClientPage,
  '/sobre': AboutPage,
};

const RouteLoader = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--color-background, #0c1017)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div
        style={{
          width: '38px',
          height: '38px',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          borderTopColor: 'var(--color-primary-action, #3b82f6)',
          borderRadius: '50%',
          animation: 'hop-pulse-spin 0.8s linear infinite',
        }}
      />
      <span style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.86rem', fontWeight: 600 }}>
        Carregando tela...
      </span>
    </div>
  </div>
);

export default function App() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const handleRouteChange = () => setRoute(getCurrentRoute());
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  const Page = route.startsWith('/operator')
    ? OperatorPage
    : route.startsWith('/client')
      ? ClientPage
      : route.startsWith('/control')
        ? ControlPage
        : (routeMap[route] || HomePage);

  return (
    <ModelUploadProvider>
      <Suspense fallback={<RouteLoader />}>
        <Page route={route} />
      </Suspense>
    </ModelUploadProvider>
  );
}
