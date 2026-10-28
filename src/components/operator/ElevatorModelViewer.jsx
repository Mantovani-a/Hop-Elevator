import { useState } from 'react';
import { useElevatorModel } from '../../context/ElevatorModelContext';
import ModelUploadPanel from './ModelUploadPanel';
import Elevator2DViewer from './Elevator2DViewer';

/**
 * Visualizador técnico do elevador (Fase 7 - Esquema Vetorial e Regiões).
 */
export default function ElevatorModelViewer({ diagnosis, severity, canManage = false }) {
  const { modelUrl = null, dynamicRegions = [], displayNameMap = {}, restoredFromDB = true } = useElevatorModel() || {};
  const suspectedRegions = diagnosis?.suspectedRegions || [];
  const initialRegion = suspectedRegions[0] || (dynamicRegions?.[0]?.id ?? '');
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [viewMode, setViewMode] = useState('esquema');

  const regions = dynamicRegions || [];

  return (
    <section className={`app-card elevator-model-card elevator-model-card--${severity}`} aria-labelledby="elevator-model-title">
      <div className="elevator-model-card__heading">
        <div>
          <p className="page-header__subtitle">Representação esquemática</p>
          <h2 className="fs-5" id="elevator-model-title">
            Esquema Técnico do Elevador
          </h2>
        </div>
        {modelUrl && (
          <span><i aria-hidden="true" /> Região suspeita pela triagem</span>
        )}
      </div>

      {canManage && <ModelUploadPanel />}

      <div className="elevator-model-tabs" role="tablist" aria-label="Alternar visualização">
        <button
          className={`elevator-model-tab${viewMode === 'esquema' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={viewMode === 'esquema'}
          onClick={() => setViewMode('esquema')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Esquema Técnico
        </button>
        <button
          className={`elevator-model-tab${viewMode === 'regioes' ? ' is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={viewMode === 'regioes'}
          onClick={() => setViewMode('regioes')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Regiões Inspecionadas
        </button>
      </div>

      {viewMode === 'esquema' ? (
        <>
          <p className="elevator-model-card__intro">
            Diagrama vetorial dos subsistemas da cabine, tração, freios safeties e sensores de pavimento.
          </p>
          <Elevator2DViewer status={severity?.toUpperCase() || 'OK'} />
        </>
      ) : (
        <>
          <p className="elevator-model-card__intro">
            Selecione uma região para relacioná-la à hipótese preliminar da triagem.
          </p>
          <div className="elevator-model-stage">
            <div className="elevator-2d-region-list" aria-label="Lista de regiões inspecionadas">
              {regions.length === 0 ? (
                <p className="elevator-model-card__intro">Nenhuma região específica sinalizada.</p>
              ) : (
                regions.map((region) => (
                  <button
                    className={`elevator-2d-region-item${suspectedRegions.includes(region.id) ? ' is-suspected' : ''}${selectedRegion === region.id ? ' is-selected' : ''}`}
                    type="button"
                    key={region.id}
                    aria-pressed={selectedRegion === region.id}
                    onClick={() => setSelectedRegion(region.id)}
                  >
                    <span className="elevator-2d-region-item__label">{region.label}</span>
                    <span className="elevator-2d-region-item__parts">
                      {region.meshNames.map((name) => (
                        <span key={name} className="elevator-2d-region-item__part">{displayNameMap[name] || name}</span>
                      ))}
                    </span>
                    {suspectedRegions.includes(region.id) && <i className="elevator-2d-region-item__badge" aria-label="Relacionado à hipótese preliminar">!</i>}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
