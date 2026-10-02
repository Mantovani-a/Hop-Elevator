import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useModelUpload } from '../../context/ModelUploadContext';

const SEVERITY_COLORS = {
  'crítica': 0xff1744,
  'alta': 0xff6d00,
  'atenção': 0xffc400,
  'baixa': 0x00e676,
};

const SEVERITY_CSS_COLORS = {
  'crítica': '#ff1744',
  'alta': '#ff6d00',
  'atenção': '#ffc400',
  'baixa': '#00e676',
};

/**
 * Heuristic to determine if a mesh is cylindrical.
 * Used to keep cylindrical parts visible in wireframe mode.
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
  if (dims[0] < 0.001) return false;
  const ratio = dims[1] / dims[0];
  if (ratio > 0.6 && ratio < 1.67) {
    const posAttr = mesh.geometry.getAttribute('position');
    if (posAttr && posAttr.count > 8) return true;
  }
  return false;
}

/**
 * Builds the set of problem objects relevant to this occurrence
 * based on the diagnosed suspected regions.
 */
function buildProblemMap(diagnosis, regionTo3DObjects) {
  const suspectedRegions = diagnosis?.suspectedRegions || [];
  if (suspectedRegions.length === 0) return {};

  const problemObjectNames = new Set();
  for (const region of suspectedRegions) {
    const objectNames = regionTo3DObjects[region] || [];
    for (const name of objectNames) {
      problemObjectNames.add(name);
    }
  }

  const problemMap = {};
  for (const regionId of suspectedRegions) {
    const objectNames = regionTo3DObjects[regionId] || [];
    for (const name of objectNames) {
      if (!problemObjectNames.has(name)) continue;
      problemMap[name] = {
        description: `Região relacionada à hipótese inicial: componente do elevador. Necessita verificação técnica no local.`,
        severity: 'atenção',
      };
    }
  }

  return problemMap;
}

/**
 * Optimised wireframe edge threshold — reduce visual clutter while keeping
 * meaningful structural edges and cylindrical part visibility.
 */
function computeEdgeThreshold(mesh) {
  const cylindrical = isCylindricalMesh(mesh);
  // Lower threshold for cylindrical parts to show their curved edges
  return cylindrical ? 5 : 15;
}

/**
 * Applies edge materials to the loaded model based on the current problem map.
 * Cleans up previous edge LineSegments before re-applying.
 *
 * Optimised wireframe rendering:
 *  - Non-problem meshes: hidden fill, subtle wireframe edges
 *  - Problem meshes: coloured fill + bold edges with pulse animation
 *  - Cylindrical parts: always show edges even when not a problem, to avoid
 *    them becoming invisible in wireframe view
 */
function applyProblemMaterials(model, problemMap, problemMeshesRef) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const edgeColor = isDark ? 0x94a3b8 : 0x425c85;
  const problemMeshes = [];

  model.traverse((child) => {
    if (!child.isMesh) return;

    const edgeThreshold = computeEdgeThreshold(child);

    // Cache edges geometry once per mesh (or recompute if threshold changed)
    if (!child.userData.edgesGeometry || child.userData.edgeThresholdUsed !== edgeThreshold) {
      if (child.userData.edgesGeometry) child.userData.edgesGeometry.dispose();
      child.userData.edgesGeometry = new THREE.EdgesGeometry(child.geometry, edgeThreshold);
      child.userData.edgeThresholdUsed = edgeThreshold;
    }
    const edges = child.userData.edgesGeometry;

    // Remove previously added edge children and dispose materials
    const toRemove = [];
    child.children.forEach((c) => {
      if (c.isLineSegments && c.name.endsWith('_edges')) toRemove.push(c);
    });
    toRemove.forEach((c) => {
      c.material.dispose();
      child.remove(c);
    });

    // Dispose old mesh material before reassigning
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }

    // Clear old userData
    delete child.userData.problem;
    delete child.userData.edgeMaterial;

    const isProblem = problemMap[child.name];
    const cylindrical = isCylindricalMesh(child);

    if (isProblem) {
      const severityColor = SEVERITY_COLORS[isProblem.severity] || 0xff1744;

      child.material = new THREE.MeshBasicMaterial({
        color: severityColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const lineMaterial = new THREE.LineBasicMaterial({
        color: severityColor,
        transparent: true,
        opacity: 1,
      });
      const lineSegments = new THREE.LineSegments(edges, lineMaterial);
      lineSegments.name = child.name + '_edges';
      child.add(lineSegments);

      child.userData.problem = isProblem;
      child.userData.edgeMaterial = lineMaterial;
      problemMeshes.push(child);
    } else {
      // Non-problem part: hidden fill
      child.material = new THREE.MeshBasicMaterial({ visible: false });

      // Determine edge opacity — cylindrical parts get stronger visibility
      const edgeOpacity = cylindrical ? 0.65 : 0.4;

      const lineMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: edgeOpacity,
      });
      const lineSegments = new THREE.LineSegments(edges, lineMaterial);
      lineSegments.name = child.name + '_edges';
      child.add(lineSegments);
    }
  });

  problemMeshesRef.current = problemMeshes;
}

/**
 * Load a 3D model from a URL using the appropriate loader for the format.
 */
function loadModel(url, format) {
  return new Promise((resolve, reject) => {
    let loader;
    switch (format) {
      case 'fbx':
        loader = new FBXLoader();
        break;
      case 'obj':
        loader = new OBJLoader();
        break;
      case 'glb':
      default:
        loader = new GLTFLoader();
        break;
    }

    loader.load(
      url,
      (result) => {
        // GLTFLoader returns { scene }, FBX/OBJ return the object directly
        const scene = result.scene || result;
        resolve(scene);
      },
      undefined,
      (error) => reject(error),
    );
  });
}

export default function Elevator3DViewer({ diagnosis, severity }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const frameIdRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const problemMeshesRef = useRef([]);
  const modelRef = useRef(null);
  const initialCameraRef = useRef({ position: null, target: null });
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const { modelUrl, modelFormat, dynamicRegions, displayNameMap, registerParts } = useModelUpload();

  // Keep a ref that always holds the latest diagnosis to avoid stale closures
  const diagnosisRef = useRef(diagnosis);
  diagnosisRef.current = diagnosis;

  // Build the region→3D mapping from dynamic regions
  const regionTo3DObjects = useMemo(
    () => Object.fromEntries(dynamicRegions.map((r) => [r.id, r.meshNames])),
    [dynamicRegions],
  );
  const regionTo3DObjectsRef = useRef(regionTo3DObjects);
  regionTo3DObjectsRef.current = regionTo3DObjects;

  // Stable key for dependency comparison
  const suspectedRegionsKey = useMemo(
    () => JSON.stringify(diagnosis?.suspectedRegions || []),
    [diagnosis?.suspectedRegions],
  );

  // Track modelUrl to reload when it changes
  const modelUrlRef = useRef(modelUrl);

  const handleResetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !initialCameraRef.current.position) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const { position, target } = initialCameraRef.current;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 600;
    const startTime = performance.now();

    const animateReset = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      camera.position.lerpVectors(startPos, position, ease);
      controls.target.lerpVectors(startTarget, target, ease);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animateReset);
      }
    };
    requestAnimationFrame(animateReset);
    setSelectedProblem(null);
  }, []);

  // --- Main scene setup (runs once) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1e293b : 0xf1f5f9);

    const width = container.clientWidth;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(6, 5, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 40;
    controls.target.set(0, 2, 0);
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const gridColor = isDark ? 0x334155 : 0xd3dff0;
    const grid = new THREE.GridHelper(20, 20, gridColor, gridColor);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      const time = performance.now() * 0.001;
      problemMeshesRef.current.forEach((mesh) => {
        const pulse = 0.6 + 0.4 * Math.sin(time * 2.5);
        if (mesh.userData.edgeMaterial) {
          mesh.userData.edgeMaterial.opacity = pulse;
        }
        if (mesh.material && mesh.material.transparent) {
          mesh.material.opacity = 0.03 + 0.06 * Math.sin(time * 2.5);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    observer.observe(container);

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
      scene.background = new THREE.Color(nowDark ? 0x1e293b : 0xf1f5f9);
      grid.material.color.set(nowDark ? 0x334155 : 0xd3dff0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      observer.disconnect();
      themeObserver.disconnect();
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.userData?.edgesGeometry) {
            child.userData.edgesGeometry.dispose();
            delete child.userData.edgesGeometry;
          }
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
            else child.material.dispose();
          }
        });
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Load/reload model when modelUrl changes ---
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls || !modelUrl) return;

    // Remove old model
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child.userData?.edgesGeometry) {
          child.userData.edgesGeometry.dispose();
          delete child.userData.edgesGeometry;
        }
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      modelRef.current = null;
    }

    setIsLoaded(false);
    setLoadError(false);
    modelUrlRef.current = modelUrl;

    loadModel(modelUrl, modelFormat)
      .then((model) => {
        // If URL changed while loading, discard
        if (modelUrlRef.current !== modelUrl) return;

        modelRef.current = model;

        // Register parts in context (triggers region & display name computation)
        registerParts(model);

        // Apply materials — use latest diagnosis and region mapping
        const currentProblemMap = buildProblemMap(diagnosisRef.current, regionTo3DObjectsRef.current);
        applyProblemMaterials(model, currentProblemMap, problemMeshesRef);

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += size.y / 2;

        scene.add(model);

        // Set initial camera position based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
        camera.position.set(cameraDistance * 0.8, cameraDistance * 0.6, cameraDistance * 0.8);
        controls.target.set(0, size.y * 0.3, 0);
        controls.update();

        initialCameraRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };

        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading 3D model:', error);
        if (modelUrlRef.current === modelUrl) setLoadError(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, modelFormat]);

  // --- Re-apply materials when diagnosis/regions change ---
  useEffect(() => {
    if (!modelRef.current) return;
    // Recompute regionTo3DObjects from latest dynamicRegions
    const latestMapping = Object.fromEntries(dynamicRegions.map((r) => [r.id, r.meshNames]));
    regionTo3DObjectsRef.current = latestMapping;
    const currentProblemMap = buildProblemMap(diagnosisRef.current, latestMapping);
    applyProblemMaterials(modelRef.current, currentProblemMap, problemMeshesRef);
    setSelectedProblem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspectedRegionsKey, dynamicRegions]);

  // --- Click handler for raycasting ---
  const handleCanvasClick = useCallback((event) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseRef.current.x = (x / rect.width) * 2 - 1;
    mouseRef.current.y = -(y / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // Gather all problem meshes and their children (edges + fill)
    const testObjects = [];
    problemMeshesRef.current.forEach((mesh) => {
      testObjects.push(mesh);
      mesh.children.forEach((child) => {
        testObjects.push(child);
      });
    });

    const intersects = raycasterRef.current.intersectObjects(testObjects, false);

    if (intersects.length > 0) {
      let hitObject = intersects[0].object;
      if (!hitObject.userData.problem && hitObject.parent?.userData?.problem) {
        hitObject = hitObject.parent;
      }
      const problem = hitObject.userData.problem;
      if (problem) {
        const panelX = Math.min(x, rect.width - 280);
        const panelY = Math.min(y, rect.height - 120);
        setPanelPosition({ x: Math.max(8, panelX), y: Math.max(8, panelY) });
        // Use the translated display name
        const translatedName = displayNameMap[hitObject.name] || hitObject.name.replace(/_/g, ' ');
        setSelectedProblem({ name: hitObject.name, translatedName, ...problem });
        return;
      }
    }

    setSelectedProblem(null);
  }, [displayNameMap]);

  return (
    <div className="elevator-3d-viewer" ref={containerRef} onClick={handleCanvasClick}>
      {!modelUrl && (
        <div className="elevator-3d-loader">
          <span>Nenhum modelo carregado. Utilize o painel de upload para importar um modelo 3D.</span>
        </div>
      )}
      {modelUrl && !isLoaded && !loadError && (
        <div className="elevator-3d-loader">
          <div className="elevator-3d-loader__spinner" />
          <span>Carregando modelo 3D…</span>
        </div>
      )}
      {loadError && (
        <div className="elevator-3d-loader">
          <span>Não foi possível carregar o modelo 3D. Verifique se o arquivo é válido.</span>
        </div>
      )}
      {isLoaded && (
        <button
          className="elevator-3d-reset-btn"
          type="button"
          onClick={(e) => { e.stopPropagation(); handleResetView(); }}
          title="Resetar câmera para posição inicial"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 8a6 6 0 0 1 10.472-4H10v-2h5v5h-2V4.528A7.96 7.96 0 0 0 8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5 4.977 4.977 0 0 1 3.5 1.4" fill="currentColor"/>
          </svg>
          Resetar visão
        </button>
      )}
      {selectedProblem && (
        <div
          className="elevator-3d-problem-panel"
          style={{ left: `${panelPosition.x}px`, top: `${panelPosition.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="elevator-3d-problem-panel__header">
            <span
              className="elevator-3d-problem-panel__severity"
              style={{ background: SEVERITY_CSS_COLORS[selectedProblem.severity] || '#ff1744' }}
            />
            <strong>{selectedProblem.translatedName}</strong>
            <button
              className="elevator-3d-problem-panel__close"
              type="button"
              onClick={() => setSelectedProblem(null)}
              aria-label="Fechar painel"
            >
              ✕
            </button>
          </div>
          <p className="elevator-3d-problem-panel__description">
            {selectedProblem.description}
          </p>
          <span className="elevator-3d-problem-panel__badge" style={{ color: SEVERITY_CSS_COLORS[selectedProblem.severity] }}>
            Região suspeita
          </span>
        </div>
      )}
    </div>
  );
}
