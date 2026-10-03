import { useCallback, useRef, useState } from 'react';
import { useElevatorModel, MAX_MODEL_SIZE_MB } from '../../context/ElevatorModelContext';

const ACCEPTED_EXTENSIONS = ['.glb', '.gltf', '.fbx', '.obj'];
const MAX_SIZE_MB = MAX_MODEL_SIZE_MB || 150;

/**
 * Premium drag-and-drop upload panel for 3D elevator models.
 * Scoped to the current elevator.
 */
export default function ModelUploadPanel() {
  const {
    elevatorId,
    uploadModel,
    isProcessing,
    error,
    modelFileName,
    removeModel,
    loadDefaultModel,
    restoredFromDB,
  } = useElevatorModel();

  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      alert('Formato não suportado. Utilize arquivos .glb, .gltf, .fbx ou .obj.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`O arquivo excede o limite de ${MAX_SIZE_MB}MB.`);
      return;
    }
    uploadModel(file);
  }, [uploadModel]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile, isProcessing]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  // Loading state while checking IndexedDB
  if (!restoredFromDB) {
    return (
      <div className="model-upload-status" role="status" aria-live="polite">
        <div className="model-upload-status__info">
          <div className="elevator-3d-loader__spinner" style={{ width: '18px', height: '18px' }} />
          <div>
            <span className="model-upload-status__filename">Buscando modelo vinculado ao elevador...</span>
            {elevatorId && <span className="model-upload-status__badge">{elevatorId}</span>}
          </div>
        </div>
      </div>
    );
  }

  // If a model is loaded for this elevator, show status bar with elevatorId and actionable buttons
  if (modelFileName) {
    return (
      <div className="model-upload-status">
        <div className="model-upload-status__info">
          <svg className="model-upload-status__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 1L17 5.5V14.5L10 19L3 14.5V5.5L10 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
          <div>
            <span className="model-upload-status__filename">{modelFileName}</span>
            <span className="model-upload-status__badge">{elevatorId ? `Elevador ${elevatorId}` : 'Modelo ativo'}</span>
          </div>
        </div>
        <div className="model-upload-status__actions">
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          <button
            className="model-upload-status__btn model-upload-status__btn--replace"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1V13M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Substituir
          </button>
          <button
            className="model-upload-status__btn model-upload-status__btn--remove"
            type="button"
            onClick={removeModel}
            disabled={isProcessing}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Remover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`model-upload-panel${isDragging ? ' is-dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="model-upload-panel__content">
        <div className="model-upload-panel__icon-wrap">
          <svg className="model-upload-panel__icon" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" opacity="0.3"/>
            <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="url(#upload-gradient)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
            <line x1="24" y1="4" x2="24" y2="44" stroke="currentColor" strokeWidth="0.8" opacity="0.15"/>
            <line x1="6" y1="14" x2="42" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.15"/>
            <path d="M24 17V31M18 23l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="upload-gradient" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--color-primary-action)"/>
                <stop offset="1" stopColor="var(--color-accent-violet, #7252ee)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h3 className="model-upload-panel__title">
          {elevatorId ? `Vincular modelo 3D ao elevador ${elevatorId}` : 'Importar modelo 3D'}
        </h3>
        <p className="model-upload-panel__description">
          Nenhum modelo vinculado a este equipamento. Arraste um arquivo <strong>.glb</strong>, <strong>.gltf</strong>, <strong>.fbx</strong> ou <strong>.obj</strong> para esta área ou clique para selecionar do computador.
        </p>

        <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-2">
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          <button
            type="button"
            className="model-upload-panel__btn"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Selecionar arquivo
          </button>
          <button
            type="button"
            className="model-upload-panel__btn model-upload-panel__btn--secondary"
            onClick={loadDefaultModel}
            disabled={isProcessing}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
            </svg>
            Carregar modelo padrão (HOPElevador.glb)
          </button>
        </div>

        <p className="model-upload-panel__hint">
          Limite de {MAX_SIZE_MB}MB · Formatos GLB, GLTF, FBX, OBJ · O sistema identificará automaticamente as peças do modelo
        </p>

        {isProcessing && (
          <div className="model-upload-panel__processing" role="status" aria-live="polite">
            <div className="elevator-3d-loader__spinner" />
            <span>Processando modelo…</span>
          </div>
        )}

        {error && (
          <p className="model-upload-panel__error" role="alert">{error}</p>
        )}
      </div>
    </div>
  );
}
