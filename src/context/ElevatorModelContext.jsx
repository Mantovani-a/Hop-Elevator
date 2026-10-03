import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { translateMeshName, buildDisplayNameMap } from '../utils/modelNameTranslator';
import defaultModelUrl from '../assets/models/HOPElevador.glb?url';

const DB_NAME = 'hop-elevator-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const SYNC_STORAGE_KEY = 'hop_elevator_model_sync';
const SYNC_EVENT_NAME = 'hop:elevator-model-changed';
export const MAX_MODEL_SIZE_MB = 150;

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB indisponível neste ambiente.'));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Falha ao abrir IndexedDB.'));
    } catch (err) {
      reject(err);
    }
  });
}

async function saveModelToDB(elevatorId, data) {
  if (!elevatorId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(
      {
        ...data,
        elevatorId: String(elevatorId),
        savedAt: Date.now(),
        revision: (data.revision || 0) + 1,
      },
      String(elevatorId)
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadModelFromDB(elevatorId) {
  if (!elevatorId) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(String(elevatorId));
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearModelFromDB(elevatorId) {
  if (!elevatorId) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(String(elevatorId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function detectFormat(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (ext === 'glb' || ext === 'gltf') return 'glb';
  if (ext === 'fbx') return 'fbx';
  if (ext === 'obj') return 'obj';
  return null;
}

function isCylindricalMesh(mesh) {
  if (!mesh.geometry) return false;
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  if (!bb) return false;
  const sx = bb.max.x - bb.min.x;
  const sy = bb.max.y - bb.min.y;
  const sz = bb.max.z - bb.min.z;
  const dims = [sx, sy, sz].sort((a, b) => a - b);
  if (dims[0] < 0.001) return false;
  const ratio = dims[1] / dims[0];
  if (ratio > 0.6 && ratio < 1.67) {
    const posAttr = mesh.geometry.getAttribute('position');
    if (posAttr && posAttr.count > 8) {
      return true;
    }
  }
  return false;
}

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

const ElevatorModelContext = createContext(null);

const fallbackContext = {
  elevatorId: null,
  modelUrl: null,
  modelFormat: null,
  modelFileName: null,
  parts: [],
  displayNameMap: {},
  dynamicRegions: [],
  isProcessing: false,
  error: null,
  restoredFromDB: true,
  uploadModel: async () => {},
  loadDefaultModel: () => {},
  removeModel: async () => {},
  registerParts: () => {},
};

export function useElevatorModel() {
  const ctx = useContext(ElevatorModelContext);
  return ctx || fallbackContext;
}

export function ElevatorModelScope({ elevatorId, children }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [modelFormat, setModelFormat] = useState(null);
  const [modelFileName, setModelFileName] = useState(null);
  const [parts, setParts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [restoredFromDB, setRestoredFromDB] = useState(false);

  const modelUrlRef = useRef(null);
  modelUrlRef.current = modelUrl;

  const currentRecordRef = useRef(null);

  const cleanupUrl = useCallback(() => {
    if (modelUrlRef.current && modelUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(modelUrlRef.current);
    }
    modelUrlRef.current = null;
  }, []);

  const notifyChange = useCallback((id) => {
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { elevatorId: id } }));
      localStorage.setItem(SYNC_STORAGE_KEY, `${id}:${Date.now()}`);
    } catch {
      // Local storage or event dispatch fallback
    }
  }, []);

  const loadFromDB = useCallback(async (targetId) => {
    if (!targetId) {
      setRestoredFromDB(true);
      return;
    }
    setRestoredFromDB(false);
    try {
      const saved = await loadModelFromDB(targetId);
      cleanupUrl();
      if (saved && saved.blob) {
        const url = URL.createObjectURL(saved.blob);
        modelUrlRef.current = url;
        currentRecordRef.current = saved;
        setModelUrl(url);
        setModelFormat(saved.format || detectFormat(saved.fileName));
        setModelFileName(saved.fileName);
        setParts(Array.isArray(saved.parts) ? saved.parts : []);
      } else {
        currentRecordRef.current = null;
        setModelUrl(null);
        setModelFormat(null);
        setModelFileName(null);
        setParts([]);
      }
    } catch (err) {
      console.warn('Erro ao carregar modelo do elevador:', err);
    } finally {
      setRestoredFromDB(true);
    }
  }, [cleanupUrl]);

  useEffect(() => {
    loadFromDB(elevatorId);

    const handleCustomSync = (event) => {
      const changedId = event?.detail?.elevatorId;
      if (String(changedId) === String(elevatorId)) {
        loadFromDB(elevatorId);
      }
    };

    const handleStorageSync = (event) => {
      if (event.key === SYNC_STORAGE_KEY && event.newValue) {
        const [changedId] = event.newValue.split(':');
        if (String(changedId) === String(elevatorId)) {
          loadFromDB(elevatorId);
        }
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleCustomSync);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleCustomSync);
      window.removeEventListener('storage', handleStorageSync);
      cleanupUrl();
    };
  }, [elevatorId, loadFromDB, cleanupUrl]);

  const uploadModel = useCallback(async (file) => {
    if (!elevatorId) {
      setError('Nenhum elevador especificado para vincular o modelo.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const format = detectFormat(file.name);
      if (!format) {
        throw new Error('Formato não suportado. Utilize arquivos .glb, .gltf, .fbx ou .obj.');
      }
      if (file.size > MAX_MODEL_SIZE_MB * 1024 * 1024) {
        throw new Error(`O arquivo excede o limite de ${MAX_MODEL_SIZE_MB}MB.`);
      }

      cleanupUrl();
      const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      modelUrlRef.current = url;

      const recordData = {
        blob,
        fileName: file.name,
        format,
        parts: [],
      };
      await saveModelToDB(elevatorId, recordData);
      currentRecordRef.current = recordData;

      setModelUrl(url);
      setModelFormat(format);
      setModelFileName(file.name);
      setParts([]);
      notifyChange(elevatorId);
    } catch (err) {
      setError(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessing(false);
    }
  }, [elevatorId, cleanupUrl, notifyChange]);

  const removeModel = useCallback(async () => {
    if (!elevatorId) return;
    cleanupUrl();
    setModelUrl(null);
    setModelFormat(null);
    setModelFileName(null);
    setParts([]);
    setError(null);
    currentRecordRef.current = null;
    await clearModelFromDB(elevatorId).catch(() => {});
    notifyChange(elevatorId);
  }, [elevatorId, cleanupUrl, notifyChange]);

  const loadDefaultModel = useCallback(async () => {
    if (!elevatorId) return;
    cleanupUrl();
    setModelUrl(defaultModelUrl);
    setModelFormat('glb');
    setModelFileName('HOPElevador.glb (Padrão)');
    setParts([]);
    setError(null);
  }, [elevatorId, cleanupUrl]);

  const registerParts = useCallback((scene) => {
    const extracted = extractParts(scene);
    setParts(extracted);
    if (elevatorId && currentRecordRef.current?.blob) {
      saveModelToDB(elevatorId, {
        ...currentRecordRef.current,
        parts: extracted,
      }).catch(() => {});
    }
  }, [elevatorId]);

  const displayNameMap = useMemo(() => buildDisplayNameMap(parts.map((p) => p.originalName)), [parts]);
  const dynamicRegions = useMemo(() => buildDynamicRegions(parts), [parts]);

  const value = useMemo(() => ({
    elevatorId,
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
    loadDefaultModel,
    removeModel,
    registerParts,
  }), [
    elevatorId,
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
    loadDefaultModel,
    removeModel,
    registerParts,
  ]);

  return (
    <ElevatorModelContext.Provider value={value}>
      {children}
    </ElevatorModelContext.Provider>
  );
}
