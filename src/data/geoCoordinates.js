import { OPERATION_STATUS } from './operationStore.js';

export const SAO_PAULO_CENTER = [-23.5587, -46.6500];
export const DEFAULT_GEO_ZOOM = 12;

export const clientGeoPositions = {
  'CLI-001': { lat: -23.5614, lng: -46.6559, neighborhood: 'Bela Vista' },     // Av. Paulista, 1450
  'CLI-002': { lat: -23.5955, lng: -46.6872, neighborhood: 'Vila Olímpia' },   // R. Funchal, 520
  'CLI-003': { lat: -23.6062, lng: -46.7135, neighborhood: 'Morumbi' },        // R. das Acácias, 88
  'CLI-004': { lat: -23.5670, lng: -46.6521, neighborhood: 'Jardins' },        // Al. Santos, 960
  'CLI-005': { lat: -23.5025, lng: -46.6247, neighborhood: 'Santana' },        // Av. Cruzeiro do Sul, 3100
  'CLI-006': { lat: -23.5855, lng: -46.6378, neighborhood: 'Vila Mariana' },   // R. Vergueiro, 2210
  'CLI-007': { lat: -23.5682, lng: -46.6914, neighborhood: 'Pinheiros' },      // Av. Rebouças, 2850
  'CLI-008': { lat: -23.4560, lng: -46.5410, neighborhood: 'Guarulhos' },      // R. Dona Tecla, 410
  'CLI-009': { lat: -23.5415, lng: -46.6432, neighborhood: 'República' },      // R. dos Timbiras, 540
  'CLI-010': { lat: -23.5785, lng: -46.5165, neighborhood: 'Aricanduva' },     // Av. Aricanduva, 5555
};

export const technicianGeoPositions = {
  'TEC-001': { lat: -23.5450, lng: -46.6380 }, // Centro
  'TEC-002': { lat: -23.5630, lng: -46.6540 }, // Zona Sul (próximo à Paulista)
  'TEC-003': { lat: -23.5550, lng: -46.6850 }, // Zona Oeste
  'TEC-004': { lat: -23.4980, lng: -46.6200 }, // Zona Norte
  'TEC-005': { lat: -23.5390, lng: -46.6480 }, // Centro
  'TEC-006': { lat: -23.5420, lng: -46.5600 }, // Zona Leste
  'TEC-007': { lat: -23.6100, lng: -46.6600 }, // Zona Sul
  'TEC-008': { lat: -23.6550, lng: -46.5300 }, // ABC Paulista
  'TEC-009': { lat: -23.5700, lng: -46.7000 }, // Zona Oeste
  'TEC-010': { lat: -23.5280, lng: -46.6350 }, // João Carlos - em rota
  'TEC-011': { lat: -23.5480, lng: -46.6320 }, // Centro
  'TEC-012': { lat: -23.5650, lng: -46.5350 }, // Zona Leste
};

// Deslocamento radial balanceado para múltiplas ocorrências no mesmo endereço
const occurrenceGeoOffsets = [
  { lat: 0.0032, lng: 0.0036 },
  { lat: -0.0032, lng: -0.0036 },
  { lat: 0.0036, lng: -0.0032 },
  { lat: -0.0036, lng: 0.0032 },
  { lat: 0.0045, lng: 0.0005 },
  { lat: -0.0045, lng: -0.0005 },
];

export const calculateHaversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return 0;
  const lat1 = Array.isArray(pointA) ? pointA[0] : (pointA.lat ?? pointA.latitude);
  const lon1 = Array.isArray(pointA) ? pointA[1] : (pointA.lng ?? pointA.longitude);
  const lat2 = Array.isArray(pointB) ? pointB[0] : (pointB.lat ?? pointB.latitude);
  const lon2 = Array.isArray(pointB) ? pointB[1] : (pointB.lng ?? pointB.longitude);

  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
};

export const getEstablishmentGeoPoint = (clientId) => {
  const pos = clientGeoPositions[clientId];
  return pos ? [pos.lat, pos.lng] : SAO_PAULO_CENTER;
};

export const getOccurrenceGeoPoint = (occurrence, index = 0) => {
  const base = getEstablishmentGeoPoint(occurrence.clientId);
  const offset = occurrenceGeoOffsets[index % occurrenceGeoOffsets.length];
  return [base[0] + offset.lat, base[1] + offset.lng];
};

export const getTechnicianGeoPoint = (technician) => {
  const base = technicianGeoPositions[technician.id]
    ? [technicianGeoPositions[technician.id].lat, technicianGeoPositions[technician.id].lng]
    : SAO_PAULO_CENTER;

  const currentOccurrence = technician.currentOccurrence;
  if (!currentOccurrence) return base;

  const destination = getEstablishmentGeoPoint(currentOccurrence.clientId);

  if (currentOccurrence.operationalStatus === OPERATION_STATUS.TRAVELING) {
    const progress = technician.id === 'TEC-010' ? 0.60 : 0.45;
    return [
      base[0] + (destination[0] - base[0]) * progress,
      base[1] + (destination[1] - base[1]) * progress,
    ];
  }

  if ([OPERATION_STATUS.ON_SITE, OPERATION_STATUS.MAINTENANCE].includes(currentOccurrence.operationalStatus)) {
    return [destination[0] - 0.0008, destination[1] + 0.0008];
  }

  return base;
};

// Gera waypoints realistas ao longo dos eixos viários de SP
export const buildGeoRoute = (start, end) => {
  if (!start || !end) return [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;

  return [
    start,
    [start[0] + (midLat - start[0]) * 0.7, start[1] + (midLng - start[1]) * 0.3],
    [midLat, midLng],
    [midLat + (end[0] - midLat) * 0.4, midLng + (end[1] - midLng) * 0.8],
    end,
  ];
};
