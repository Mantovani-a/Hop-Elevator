import { useEffect, useState, lazy, Suspense } from 'react';
import HomePage from './pages/HomePage';

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

const getCurrentRoute = () => window.location.hash.replace('#', '') || '/';

const RouteLoader = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
    <div className="elevator-3d-loader__spinner" style={{ width: 38, height: 38 }} />
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
    <Suspense fallback={<RouteLoader />}>
      <Page route={route} />
    </Suspense>
  );
}
