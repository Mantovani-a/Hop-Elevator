import { useCallback, useRef, useState } from 'react';
import { useModelUpload } from '../../context/ModelUploadContext';

const ACCEPTED_EXTENSIONS = ['.glb', '.gltf', '.fbx', '.obj'];
const MAX_SIZE_MB = 150;

/**
 * Premium drag-and-drop upload panel for 3D elevator models.
 * Shown when no model has been loaded yet.
 */
export default function ModelUploadPanel() {
  const { uploadModel, isProcessing, error, modelFileName, removeModel } = useModelUpload();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      alert('Formato não suportado. Utilize arquivos .glb, .fbx ou .obj.');
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
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  // If a model is already loaded, show a compact status bar instead
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
            <span className="model-upload-status__badge">Modelo ativo</span>
          </div>
        </div>
        <div className="model-upload-status__actions">
          <label className="model-upload-status__btn model-upload-status__btn--replace" tabIndex={0}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1V13M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Substituir
            <input
              ref={inputRef}
              type="file"
              accept=".glb,.gltf,.fbx,.obj"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </label>
          <button className="model-upload-status__btn model-upload-status__btn--remove" type="button" onClick={removeModel}>
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

        <h3 className="model-upload-panel__title">Importar modelo 3D</h3>
        <p className="model-upload-panel__description">
          Arraste um arquivo <strong>.glb</strong>, <strong>.fbx</strong> ou <strong>.obj</strong> para esta área ou clique para selecionar do seu computador.
        </p>

        <label className="model-upload-panel__btn" tabIndex={0}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Selecionar arquivo
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </label>

        <p className="model-upload-panel__hint">
          Limite de {MAX_SIZE_MB}MB · O sistema identificará automaticamente as peças do modelo
        </p>

        {isProcessing && (
          <div className="model-upload-panel__processing">
            <div className="elevator-3d-loader__spinner" />
            <span>Processando modelo…</span>
          </div>
        )}

        {error && (
          <p className="model-upload-panel__error">{error}</p>
        )}
      </div>
    </div>
  );
}
