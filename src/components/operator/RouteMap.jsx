import { useMemo, useState } from 'react';
import LeafletMap from '../LeafletMap';
import StatusBadge from '../StatusBadge';
import {
  buildGeoRoute,
  getEstablishmentGeoPoint,
  technicianGeoPositions,
} from '../../data/geoCoordinates';
import { operatorTechnician } from '../../data/operatorData';
import { getTechnicianById } from '../../data/mockData';
import { OPERATION_STATUS } from '../../data/operationStore';
import { normalizeToken } from '../../utils/presentation';

export default function RouteMap({ occurrence }) {
  const [locationState, setLocationState] = useState('demo');
  const [liveOrigin, setLiveOrigin] = useState(null);

  const assignedTechnician = getTechnicianById(occurrence?.technicianId) || operatorTechnician;
  const technicianPosition = technicianGeoPositions[assignedTechnician?.id] || technicianGeoPositions['TEC-010'] || { lat: -23.5280, lng: -46.6350 };
  const defaultOrigin = [
    technicianPosition.lat,
    technicianPosition.lng,
  ];

  const origin = liveOrigin || defaultOrigin;
  const destination = getEstablishmentGeoPoint(occurrence?.clientId) || [-23.5614, -46.6559];
  const pickupPoint = [-23.5489, -46.6388];
  const hasPartMission = Boolean(occurrence?.partRequest);
  const returningToClient = [OPERATION_STATUS.RETURNING_TO_CLIENT, OPERATION_STATUS.MAINTENANCE, OPERATION_STATUS.RESOLVED].includes(occurrence?.workflowStatus);

  const route = useMemo(
    () => hasPartMission && !returningToClient
      ? [...buildGeoRoute(origin, pickupPoint), ...buildGeoRoute(pickupPoint, destination).slice(1)]
      : buildGeoRoute(origin, destination),
    [origin?.[0], origin?.[1], destination?.[0], destination?.[1], hasPartMission, returningToClient]
  );

  const markers = useMemo(
    () => [
      {
        id: `operator-${assignedTechnician.id}`,
        type: 'technician',
        typeLabel: 'Técnico',
        lat: origin[0],
        lng: origin[1],
        symbol: assignedTechnician.name.split(' ').map((part) => part[0]).slice(0, 2).join(''),
        label: assignedTechnician.name,
        shortLabel: assignedTechnician.name,
        status: 'Em deslocamento',
        tone: 'em-deslocamento',
        featured: true,
        avatar: assignedTechnician.avatar,
        avatarName: assignedTechnician.name,
        details: [
          { label: 'Ocorrência', value: occurrence.protocol || occurrence.metadata?.serviceNumber || 'HOP-1040' },
          { label: 'Destino', value: occurrence.client?.name || 'Cliente' },
        ],
      },
      ...(hasPartMission ? [{
        id: `part-pickup-${occurrence.id}`,
        type: 'destination',
        typeLabel: returningToClient ? 'Peça retirada' : 'Parada 1 · Retirada',
        lat: pickupPoint[0],
        lng: pickupPoint[1],
        symbol: '1',
        label: occurrence.partRequest.pickupLocation || 'Central / Estoque OTIS',
        shortLabel: 'Retirada de peça',
        status: returningToClient ? 'Concluída' : 'Próxima parada',
        tone: returningToClient ? 'baixa' : 'atencao',
        featured: true,
        details: [
          { label: 'Peça', value: `${occurrence.partRequest.part} ×${occurrence.partRequest.quantity}` },
          { label: 'Situação', value: occurrence.partRequest.state },
        ],
      }] : []),
      {
        id: `operator-destination-${occurrence.clientId}`,
        type: 'destination',
        typeLabel: hasPartMission ? 'Parada 2 · Cliente' : 'Próximo destino',
        lat: destination[0],
        lng: destination[1],
        symbol: '◆',
        label: occurrence.client?.name || 'Cliente',
        shortLabel: 'Destino',
        status: occurrence.priority?.classification || 'baixa',
        tone: normalizeToken(occurrence.priority?.classification || 'baixa'),
        featured: true,
        details: [
          { label: 'Elevador', value: occurrence.elevator?.identification || 'Elevador' },
          { label: 'Endereço', value: occurrence.address || 'Endereço não informado' },
          { label: 'ETA demonstrativo', value: `${occurrence.metadata?.etaMinutes ?? 10} min` },
        ],
      },
    ],
    [origin[0], origin[1], destination[0], destination[1], occurrence, hasPartMission, returningToClient, assignedTechnician]
  );

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('fallback');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveOrigin([position.coords.latitude, position.coords.longitude]);
        setLocationState('live');
      },
      () => setLocationState('fallback'),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  };

  const locationMessages = {
    demo: 'Rota e ETA estimados para demonstração.',
    requesting: 'Solicitando localização GPS do dispositivo…',
    live: 'Origem atualizada pelo dispositivo; trajeto e ETA continuam demonstrativos.',
    fallback: 'GPS não disponível. A rota demonstrativa continua ativa.',
  };

  const distance = Number(occurrence.metadata?.distanceKm ?? 0).toFixed(1).replace('.', ',');
  const eta = occurrence.metadata?.etaMinutes ?? 0;

  return (
    <section className="app-card hop-route-card h-100" aria-labelledby="route-map-title">
      <div className="hop-route-card__heading">
        <div>
          <p className="page-header__subtitle">Navegação integrada</p>
          <h2 className="fs-5" id="route-map-title">{hasPartMission ? 'Retirada de peça e retorno' : 'Rota até o atendimento'}</h2>
        </div>
        <span className="hop-route-card__demo-label">Grande São Paulo · OpenStreetMap</span>
      </div>

      <div className="operator-route-map-wrap">
        <LeafletMap
          compact
          showFilters={false}
          center={origin}
          zoom={13}
          markers={markers}
          route={route}
          ariaLabel={`Rota demonstrativa de ${assignedTechnician.name} até ${occurrence.client?.name || 'Cliente'}`}
        />

        <article className="operator-route-summary">
          <span>Próximo destino</span>
          <strong>{hasPartMission && !returningToClient ? occurrence.partRequest.pickupLocation || 'Central / Estoque OTIS' : occurrence.client?.name || 'Cliente'}</strong>
          <small>{hasPartMission && !returningToClient ? `${occurrence.partRequest.part} ×${occurrence.partRequest.quantity}` : occurrence.elevator?.identification || 'Elevador'}</small>
          <p>{distance} km · ETA demonstrativo: {eta} min</p>
          <StatusBadge value={occurrence.priority?.classification || 'baixa'} type="severity" />
        </article>
      </div>

      {hasPartMission && <div className="operator-route-stops" aria-label="Etapas da retomada"><article className={returningToClient ? 'is-complete' : 'is-current'}><span>Parada 1</span><strong>Retirada de peça</strong><small>{occurrence.partRequest.pickupLocation || 'Central / Estoque OTIS'} · {occurrence.partRequest.part} ×{occurrence.partRequest.quantity}</small></article><article className={returningToClient ? 'is-current' : ''}><span>Parada 2</span><strong>Retorno ao atendimento</strong><small>{occurrence.client?.name || 'Cliente'} · {occurrence.elevator?.identification || 'Elevador'}</small></article></div>}

      <div className="hop-route-footer">
        <div>
          <strong>{occurrence.client?.name || 'Cliente'}</strong>
          <span>{occurrence.address || 'Endereço não informado'}</span>
          <small>{locationMessages[locationState]}</small>
        </div>
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={requestLocation}
          disabled={locationState === 'requesting'}
        >
          Usar minha localização
        </button>
      </div>
    </section>
  );
}
