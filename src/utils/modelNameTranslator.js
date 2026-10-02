/**
 * Translates 3D model mesh/node names into clean, human-readable Portuguese
 * labels. Supports common elevator-related English and Portuguese naming
 * conventions found in CAD / BIM exports.
 *
 * The translation pipeline:
 *  1. Check against a curated dictionary of exact and partial matches.
 *  2. Apply heuristic rules (remove underscores/camelCase, capitalise).
 *  3. Fall back to a cleaned-up version of the original name.
 */

// ---------------------------------------------------------------------------
// Curated dictionary — exact keys are lowercase, trimmed originals
// ---------------------------------------------------------------------------
const EXACT_DICTIONARY = {
  // --- English terms ---
  'traction_system': 'Sistema de Tração',
  'traction_machine': 'Máquina de Tração',
  'traction_motor': 'Motor de Tração',
  'traction_support': 'Apoio de Tração',
  'traction_bridge': 'Ponte de Tração',
  'traction_pulley': 'Polia de Tração',
  'traction_sheave': 'Polia de Tração',
  'counterweight_pulley': 'Polia do Contrapeso',
  'counterweight': 'Contrapeso',
  'counterweight_support': 'Apoio do Contrapeso',
  'counterweight_buffer': 'Amortecedor do Contrapeso',
  'counterweight_guide_rail': 'Guia do Contrapeso',
  'counterweight_guide_rails': 'Guias do Contrapeso',
  'rope': 'Cabo Principal',
  'main_rope': 'Cabo Principal',
  'secondary_rope': 'Cabo Secundário',
  'cable': 'Cabo',
  'main_cable': 'Cabo Principal',
  'counterweight_cable': 'Cabo do Contrapeso',
  'emergency_brake': 'Freio de Emergência',
  'safety_brake': 'Freio de Segurança',
  'governor': 'Limitador de Velocidade',
  'overspeed_governor': 'Limitador de Velocidade',
  'control_system': 'Sistema de Controle',
  'control_panel': 'Painel de Controle',
  'control_board': 'Quadro de Controle',
  'control_machine': 'Módulo de Controle',
  'upper_control_panel': 'Painel de Controle Superior',
  'lower_control_panel': 'Painel de Controle Inferior',
  'guide_rail': 'Guia do Elevador',
  'guide_rails': 'Guias do Elevador',
  'elevator_guard_rails': 'Trilhos Guia do Elevador',
  'elevator_guide_rails': 'Trilhos Guia do Elevador',
  'elevator': 'Cabine do Elevador',
  'cabin': 'Cabine do Elevador',
  'car': 'Cabine do Elevador',
  'elevator_car': 'Cabine do Elevador',
  'door_operator': 'Operador de Portas',
  'door': 'Porta',
  'cabin_door': 'Porta da Cabine',
  'landing_door': 'Porta do Pavimento',
  'hall_door': 'Porta do Pavimento',
  'floor_indicator': 'Indicador de Pavimento',
  'cabin_indicator': 'Indicador de Pavimento (Cabine)',
  'hall_indicator': 'Indicador de Pavimento (Hall)',
  'position_indicator': 'Indicador de Posição',
  'car_buffer': 'Amortecedor da Cabine',
  'elevator_buffer': 'Amortecedor da Cabine',
  'buffer': 'Amortecedor',
  'pit': 'Poço do Elevador',
  'elevator_pit': 'Poço do Elevador',
  'machine_room': 'Casa de Máquinas',
  'shaft': 'Caixa de Corrida',
  'hoistway': 'Caixa de Corrida',
  'sensor': 'Sensor',
  'door_sensor': 'Sensor de Porta',
  'leveling_sensor': 'Sensor de Nivelamento',
  'safety_gear': 'Freio de Segurança da Cabine',
  'frame': 'Estrutura',
  'car_frame': 'Chassi da Cabine',
  'sling': 'Chassi da Cabine',
  'ventilation': 'Ventilação',
  'fan': 'Ventilador',
  'lighting': 'Iluminação',
  'handrail': 'Corrimão',
  'mirror': 'Espelho',
  'panel': 'Painel',
  'button_panel': 'Botoeira',
  'call_button': 'Botão de Chamada',
  'intercom': 'Intercomunicador',
  'alarm': 'Alarme',
  'alarm_bell': 'Campainha de Alarme',
  'weight_sensor': 'Sensor de Peso',
  'load_cell': 'Célula de Carga',

  // --- Portuguese terms found in GLB files ---
  'maquinario_elevador': 'Máquina de Tração',
  'apoio_tração': 'Apoio de Tração',
  'ponte_tração': 'Ponte de Tração',
  'polia_tração': 'Polia de Tração',
  'polia_contrapeso': 'Polia do Contrapeso',
  'corda': 'Cabo Principal',
  'cabo_contrapeso': 'Cabo do Contrapeso',
  'freiodeemergencia': 'Freio de Emergência',
  'sistema_de_controle': 'Sistema de Controle',
  'sistema de controle': 'Sistema de Controle',
  'maquina_controle': 'Módulo de Controle',
  'painel_de_controle_superior': 'Painel de Controle Superior',
  'painel de controle_superior': 'Painel de Controle Superior',
  'painel_de_controle_inferior': 'Painel de Controle Inferior',
  'painel de controle_inferior': 'Painel de Controle Inferior',
  'trilhos_guias': 'Guia do Elevador',
  'trilhos_guia_contrapeso': 'Guia do Contrapeso',
  'contrapeso': 'Contrapeso',
  'apoio_contrapeso': 'Apoio do Contrapeso',
  'elevador': 'Cabine do Elevador',
  'cabine': 'Cabine do Elevador',
  'cabine_de_controle': 'Cabine de Controle',
  'operador_portas': 'Operador de Portas',
  'porta': 'Porta',
  'letreiro': 'Indicador de Pavimento',
  'amortecedor_elevador': 'Amortecedor da Cabine',
  'amortecedor_contrapeso': 'Amortecedor do Contrapeso',
  'poço_pit': 'Poço do Elevador',
  'poço': 'Poço do Elevador',
};

// ---------------------------------------------------------------------------
// Partial keyword → translation fragments (applied if exact match fails)
// ---------------------------------------------------------------------------
const KEYWORD_FRAGMENTS = [
  [/traction|tracao|tração/i, 'Tração'],
  [/counterweight|contrapeso/i, 'Contrapeso'],
  [/pulley|polia|sheave/i, 'Polia'],
  [/brake|freio/i, 'Freio'],
  [/emergency|emergencia|emergência/i, 'Emergência'],
  [/control|controle/i, 'Controle'],
  [/panel|painel/i, 'Painel'],
  [/guide|guia/i, 'Guia'],
  [/rail|trilho/i, 'Trilho'],
  [/door|porta/i, 'Porta'],
  [/cabin|cabine|car|elevador/i, 'Cabine'],
  [/rope|cable|cabo|corda/i, 'Cabo'],
  [/buffer|amortecedor/i, 'Amortecedor'],
  [/sensor/i, 'Sensor'],
  [/pit|poço/i, 'Poço'],
  [/motor/i, 'Motor'],
  [/machine|maquina|máquina|maquinario|maquinário/i, 'Máquina'],
  [/governor|limitador/i, 'Limitador de Velocidade'],
  [/indicator|indicador|letreiro/i, 'Indicador'],
  [/support|apoio|suporte/i, 'Apoio'],
  [/bridge|ponte/i, 'Ponte'],
  [/frame|chassi|sling/i, 'Chassi'],
  [/ventilation|ventilador|fan/i, 'Ventilação'],
  [/lighting|iluminação|luz/i, 'Iluminação'],
  [/mirror|espelho/i, 'Espelho'],
  [/handrail|corrimão/i, 'Corrimão'],
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Strip trailing numeric suffixes like "1", "2", "_03", ".001" for dictionary
 * lookup, but preserve them for display as "#N" when needed.
 */
function stripNumericSuffix(name) {
  const match = name.match(/^(.+?)[_.\s-]*(\d+)$/);
  if (match) {
    return { base: match[1], number: match[2] };
  }
  return { base: name, number: null };
}

/**
 * Normalise a raw mesh name (as found in the GLB / FBX / OBJ) into a
 * humanised Portuguese label.
 *
 * @param {string} rawName  The original mesh name from the 3D file.
 * @returns {string}        A clean, translated display name.
 */
export function translateMeshName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Componente';

  const trimmed = rawName.trim();
  const { base, number } = stripNumericSuffix(trimmed);

  // 1) Exact dictionary lookup (case-insensitive, underscore-normalised)
  const normalise = (s) => s.toLowerCase().replace(/[\s_-]+/g, '_').replace(/^_|_$/g, '');
  const keyFull = normalise(trimmed);
  const keyBase = normalise(base);

  if (EXACT_DICTIONARY[keyFull]) {
    return EXACT_DICTIONARY[keyFull];
  }
  if (EXACT_DICTIONARY[keyBase]) {
    const suffix = number ? ` #${number}` : '';
    return EXACT_DICTIONARY[keyBase] + suffix;
  }

  // 2) Keyword-fragment heuristic — combine the first two matching keywords
  const matches = [];
  for (const [regex, label] of KEYWORD_FRAGMENTS) {
    if (regex.test(trimmed) && !matches.includes(label)) {
      matches.push(label);
      if (matches.length >= 2) break;
    }
  }
  if (matches.length > 0) {
    const suffix = number ? ` #${number}` : '';
    return matches.join(' — ') + suffix;
  }

  // 3) Fallback — humanise the raw name
  const humanised = trimmed
    // split camelCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // replace separators
    .replace(/[_-]+/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalise each word
  const capitalised = humanised.replace(/\b\w/g, (c) => c.toUpperCase());
  const suffix = number && !capitalised.includes(number) ? ` #${number}` : '';
  return capitalised + suffix;
}

/**
 * Batch-translate a list of raw mesh names.
 *
 * @param {string[]} names  Array of original mesh/node names.
 * @returns {Object.<string, string>}  Map from original → translated name.
 */
export function buildDisplayNameMap(names) {
  const map = {};
  for (const name of names) {
    map[name] = translateMeshName(name);
  }
  return map;
}
