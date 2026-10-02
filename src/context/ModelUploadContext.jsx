import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translateMeshName, buildDisplayNameMap } from '../utils/modelNameTranslator';

/**
 * IndexedDB helpers — store uploaded model blobs so they survive page reloads.
 */
const DB_NAME = 'hop-elevator-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const MODEL_KEY = 'current-model';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveModelToDB(blob, fileName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ blob, fileName, savedAt: Date.now() }, MODEL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadModelFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(MODEL_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearModelFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(MODEL_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Detect model format from file extension.
 */
function detectFormat(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return 'glb';
  if (ext === 'fbx') return 'fbx';
  if (ext === 'obj') return 'obj';
  return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ModelUploadContext = createContext(null);

export function useModelUpload() {
  const ctx = useContext(ModelUploadContext);
  if (!ctx) throw new Error('useModelUpload must be used inside ModelUploadProvider');
  return ctx;
}

/**
 * @typedef {Object} ModelPart
 * @property {string} originalName  The raw node/mesh name from the 3D file.
 * @property {string} displayName   Human-readable Portuguese label.
 * @property {boolean} isCylindrical Whether the geometry was detected as cylindrical.
 */

/**
 * Heuristic to detect cylindrical geometry.
 * A mesh is considered cylindrical if:
 *  - Its bounding-box width ≈ depth (aspect ratio < 1.5)
 *  - AND it has more than a threshold of faces that are not axis-aligned.
 *
 * This is an approximation — real cylinder detection would require analysing
 * face normals, but this is fast and works well for typical CAD exports.
 */
function isCylindricalMesh(mesh) {
  if (!mesh.geometry) return false;
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  if (!bb) return false;
  const sx = bb.max.x - bb.min.x;
  const sy = bb.max.y - bb.min.y;
  const sz = bb.max.z - bb.min.z;
  const dims = [sx, sy, sz].sort((a, b) => a - b);
  // Two smallest dimensions should be roughly equal (circular cross-section)
  if (dims[0] < 0.001) return false;
  const ratio = dims[1] / dims[0];
  // Allow some tolerance
  if (ratio > 0.6 && ratio < 1.67) {
    // The mesh has a somewhat equal cross-section — likely cylindrical
    // Additional heuristic: vertex count relative to face count
    const posAttr = mesh.geometry.getAttribute('position');
    if (posAttr && posAttr.count > 8) {
      return true;
    }
  }
  return false;
}

/**
 * Walk a loaded THREE.js scene and extract all mesh parts.
 *
 * @param {THREE.Object3D} scene The loaded 3D model scene.
 * @returns {ModelPart[]}
 */
function extractParts(scene) {
  const parts = [];
  const seenNames = new Set();

  scene.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name || `Componente_${parts.length + 1}`;
    if (seenNames.has(name)) return;
    seenNames.add(name);

    parts.push({
      originalName: name,
      displayName: translateMeshName(name),
      isCylindrical: isCylindricalMesh(child),
    });
  });

  return parts;
}

/**
 * Build dynamic elevator regions from extracted parts.
 * Groups parts heuristically by keyword similarity.
 */
function buildDynamicRegions(parts) {
  const regionRules = [
    { id: 'machine', label: 'Máquina de Tração', keywords: [/maquinario|traction.*machine|traction.*motor|motor.*tração|maquina.*traç/i, /apoio.*traç|traction.*support/i, /ponte.*traç|traction.*bridge/i] },
    { id: 'pulleys', label: 'Polias', keywords: [/polia|pulley|sheave/i] },
    { id: 'belts', label: 'Cabos', keywords: [/corda|rope|cable|cabo/i] },
    { id: 'governor', label: 'Freio de Emergência', keywords: [/freio|brake|governor|safety.*gear/i] },
    { id: 'control', label: 'Quadro de Controle', keywords: [/control|controle/i] },
    { id: 'rails', label: 'Guias do Elevador', keywords: [/trilhos?.*guia(?!.*contrapeso)|guide.*rail(?!.*counter)|guia.*elevador/i] },
    { id: 'counterweight', label: 'Contrapeso', keywords: [/contrapeso|counterweight/i] },
    { id: 'cabin', label: 'Cabine', keywords: [/^elevador$|^cabin$|^car$|elevator.*car|cabine(?!.*control)/i] },
    { id: 'doorOperator', label: 'Operador de Portas', keywords: [/operador.*porta|door.*operator/i] },
    { id: 'doors', label: 'Portas', keywords: [/^porta\d*$|^door\d*$|cabin.*door|landing.*door|hall.*door/i] },
    { id: 'sensors', label: 'Sensores', keywords: [/sensor|letreiro|indicator|indicador/i] },
    { id: 'buffers', label: 'Amortecedores', keywords: [/amortecedor|buffer/i] },
    { id: 'base', label: 'Poço', keywords: [/poço|pit/i] },
  ];

  const regions = [];
  const assigned = new Set();

  for (const rule of regionRules) {
    const meshNames = [];
    for (const part of parts) {
      if (assigned.has(part.originalName)) continue;
      const nameNorm = part.originalName.toLowerCase().replace(/[_\s-]+/g, ' ');
      for (const kw of rule.keywords) {
        if (kw.test(nameNorm) || kw.test(part.originalName)) {
          meshNames.push(part.originalName);
          assigned.add(part.originalName);
          break;
        }
      }
    }
    if (meshNames.length > 0) {
      regions.push({ id: rule.id, label: rule.label, meshNames });
    }
  }

  // Unassigned parts get their own individual region
  for (const part of parts) {
    if (assigned.has(part.originalName)) continue;
    regions.push({
      id: `custom_${part.originalName.toLowerCase().replace(/\W+/g, '_')}`,
      label: part.displayName,
      meshNames: [part.originalName],
    });
  }

  return regions;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ModelUploadProvider({ children }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [modelFormat, setModelFormat] = useState(null);
  const [modelFileName, setModelFileName] = useState(null);
  const [parts, setParts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [restoredFromDB, setRestoredFromDB] = useState(false);

  // Display-name map derived from parts
  const displayNameMap = useMemo(() => buildDisplayNameMap(parts.map((p) => p.originalName)), [parts]);

  // Dynamic regions derived from parts
  const dynamicRegions = useMemo(() => buildDynamicRegions(parts), [parts]);

  // Restore persisted model on mount
  useEffect(() => {
    let cancelled = false;
    loadModelFromDB().then((saved) => {
      if (cancelled || !saved) { setRestoredFromDB(true); return; }
      const url = URL.createObjectURL(saved.blob);
      const format = detectFormat(saved.fileName);
      if (!cancelled) {
        setModelUrl(url);
        setModelFormat(format);
        setModelFileName(saved.fileName);
        setRestoredFromDB(true);
      }
    }).catch(() => { if (!cancelled) setRestoredFromDB(true); });
    return () => { cancelled = true; };
  }, []);

  const uploadModel = useCallback(async (file) => {
    setIsProcessing(true);
    setError(null);
    try {
      const format = detectFormat(file.name);
      if (!format) {
        throw new Error('Formato não suportado. Utilize arquivos .glb, .fbx ou .obj.');
      }
      // Revoke previous URL
      if (modelUrl) URL.revokeObjectURL(modelUrl);

      const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      // Persist
      await saveModelToDB(blob, file.name);

      setModelUrl(url);
      setModelFormat(format);
      setModelFileName(file.name);
      setParts([]); // will be populated after loading
    } catch (err) {
      setError(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessing(false);
    }
  }, [modelUrl]);

  const removeModel = useCallback(async () => {
    if (modelUrl) URL.revokeObjectURL(modelUrl);
    setModelUrl(null);
    setModelFormat(null);
    setModelFileName(null);
    setParts([]);
    setError(null);
    await clearModelFromDB().catch(() => {});
  }, [modelUrl]);

  /**
   * Called by the 3D viewer after the model is fully loaded to register
   * the extracted parts list.
   */
  const registerParts = useCallback((scene) => {
    const extracted = extractParts(scene);
    setParts(extracted);
  }, []);

  const value = useMemo(() => ({
    modelUrl,
    modelFormat,
    modelFileName,
    parts,
    displayNameMap,
    dynamicRegions,
    isProcessing,
    error,
    restoredFromDB,
    uploadModel,
    removeModel,
    registerParts,
  }), [modelUrl, modelFormat, modelFileName, parts, displayNameMap, dynamicRegions, isProcessing, error, restoredFromDB, uploadModel, removeModel, registerParts]);

  return (
    <ModelUploadContext.Provider value={value}>
      {children}
    </ModelUploadContext.Provider>
  );
}
