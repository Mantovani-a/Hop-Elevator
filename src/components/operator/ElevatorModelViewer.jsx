import { useState, lazy, Suspense } from 'react';
import { useElevatorModel } from '../../context/ElevatorModelContext';
import ModelUploadPanel from './ModelUploadPanel';

const Elevator3DViewer = lazy(() => import('./Elevator3DViewer'));

/**
 * Elevator model viewer that supports client-uploaded 3D models.
 *
 * - When no model is loaded: shows the upload panel
 * - When a model is loaded: shows the 2D region panel (dynamically built from
 *   the model's parts) and the 3D wireframe viewer with tabs to switch
 */
export default function ElevatorModelViewer({ diagnosis, severity }) {
  const { modelUrl = null, dynamicRegions = [], displayNameMap = {} } = useElevatorModel() || {};
  const suspectedRegions = diagnosis?.suspectedRegions || [];
  const initialRegion = suspectedRegions[0] || (dynamicRegions?.[0]?.id ?? '');
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [viewMode, setViewMode] = useState('3d');

  // Use dynamic regions from the uploaded model
  const regions = dynamicRegions || [];

  // Re-export for external consumers (OperatorServicePage)
  // They now get dynamic regions via context

  return (
    <section className={`app-card elevator-model-card elevator-model-card--${severity}`} aria-labelledby="elevator-model-title">
      <div className="elevator-model-card__heading">
        <div>
          <p className="page-header__subtitle">Representação esquemática</p>
          <h2 className="fs-5" id="elevator-model-title">
            {!modelUrl ? 'Importar modelo 3D' : viewMode === '2d' ? 'Modelo 2D do elevador' : 'Modelo 3D Wireframe'}
          </h2>
        </div>
        {modelUrl && (
          <span><i aria-hidden="true" /> Região suspeita pela triagem</span>
        )}
      </div>

      {/* Upload panel — always visible for model management */}
      <ModelUploadPanel />

      {/* Only show tabs and content when a model is loaded */}
      {modelUrl && (
        <>
          <div className="elevator-model-tabs" role="tablist" aria-label="Alternar entre modelo 2D e 3D">
            <button
              className={`elevator-model-tab${viewMode === '2d' ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={viewMode === '2d'}
              onClick={() => setViewMode('2d')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1.2"/></svg>
              Modelo 2D
            </button>
            <button
              className={`elevator-model-tab${viewMode === '3d' ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="2" y1="4.5" x2="14" y2="4.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>
              Modelo 3D Wireframe
            </button>
          </div>

          {viewMode === '2d' ? (
            <>
              <p className="elevator-model-card__intro">Selecione uma região para relacioná-la à hipótese inicial da triagem.</p>

              <div className="elevator-model-stage">
                <div className="elevator-2d-region-list" aria-label="Lista de regiões do modelo importado">
                  {regions.length === 0 ? (
                    <p className="elevator-model-card__intro">Carregando regiões do modelo…</p>
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
          ) : (
            <>
              <p className="elevator-model-card__intro">Interaja com o modelo 3D. Os destaques indicam regiões suspeitas que necessitam de verificação técnica.</p>
              <Suspense fallback={
                <div className="elevator-3d-viewer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="elevator-3d-loader">
                    <div className="elevator-3d-loader__spinner" />
                    <span>Carregando visualizador 3D…</span>
                  </div>
                </div>
              }>
                <Elevator3DViewer diagnosis={diagnosis} severity={severity} />
              </Suspense>
            </>
          )}
        </>
      )}
    </section>
  );
}
