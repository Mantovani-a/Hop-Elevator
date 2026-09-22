/**
 * Utilitários centralizados de navegação baseada em URL Hash.
 * Elimina manipulações manuais de window.location.hash espalhadas pelos componentes.
 */

/**
 * Retorna a rota atual a partir do fragmento hash da URL.
 * @returns {string} Ex: '/control', '/operator/service/OCC-001', '/client'
 */
export const getCurrentRoute = () => {
  if (typeof window === 'undefined') return '/';
  return window.location.hash.replace(/^#/, '') || '/';
};

/**
 * Navega para uma nova rota hash, com suporte opcional a parâmetros de query.
 *
 * @param {string} path - Caminho da rota (ex: '/client/call/OCC-001')
 * @param {Record<string, string|number|boolean>} [params] - Parâmetros opcionais (ex: { occurrence: 'OCC-001' })
 */
export const navigateTo = (path, params) => {
  if (typeof window === 'undefined' || !path) return;

  const strippedPath = String(path).replace(/^#/, '');
  const normalizedPath = strippedPath.startsWith('/') ? strippedPath : `/${strippedPath}`;

  if (!params || Object.keys(params).length === 0) {
    window.location.hash = normalizedPath;
    return;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  window.location.hash = queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
};

/**
 * Divide uma rota em caminho base e parâmetros de consulta.
 *
 * @param {string} route - Rota completa (ex: '/control?occurrence=OCC-001')
 * @returns {{ baseRoute: string, queryParams: URLSearchParams }}
 */
export const parseRoute = (route = '/') => {
  const [baseRoute = '/', queryString = ''] = String(route).split('?');
  return {
    baseRoute,
    queryParams: new URLSearchParams(queryString),
  };
};
