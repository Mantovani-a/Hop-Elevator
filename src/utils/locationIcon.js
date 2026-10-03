import { normalizeToken } from './presentation';

/**
 * Maps a client's type or name to an icon key supported by ModuleIcon.
 * Keys: 'hospital' | 'shopping' | 'hotel' | 'residential' | 'school' | 'building'
 */
export function getLocationIconName(client = {}) {
  const type = normalizeToken(client?.type || '');
  const name = normalizeToken(client?.name || '');
  const combined = `${type} ${name}`;

  if (combined.includes('hospital') || combined.includes('saude') || combined.includes('clinica')) {
    return 'hospital';
  }
  if (combined.includes('shopping') || combined.includes('mall') || combined.includes('comercio') || combined.includes('varejo')) {
    return 'shopping';
  }
  if (combined.includes('hotel') || combined.includes('resort') || combined.includes('pousada')) {
    return 'hotel';
  }
  if (
    combined.includes('residencial') ||
    combined.includes('condominio') ||
    combined.includes('apartamento') ||
    combined.includes('edificio-residencial')
  ) {
    return 'residential';
  }
  if (
    combined.includes('escola') ||
    combined.includes('colegio') ||
    combined.includes('universidade') ||
    combined.includes('faculdade') ||
    combined.includes('educacao')
  ) {
    return 'school';
  }
  return 'building';
}

export default getLocationIconName;
