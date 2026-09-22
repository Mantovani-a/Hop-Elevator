import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import elevatorModelUrl from '../../assets/models/sistema_de_elevador.glb?url';
import { elevatorRegions } from '../../data/elevatorRegions';

/**
 * Derives the region→3D-object mapping from the shared `elevatorRegions`
 * definition so that the 2D panel and the 3D viewer stay in sync automatically.
 */
const REGION_TO_3D_OBJECTS = Object.fromEntries(
  elevatorRegions.map((region) => [region.id, region.meshNames]),
);

const SEVERITY_COLORS = {
  'crítica': 0xff1744,
  'alta': 0xff6d00,
  'atenção': 0xffc400,
  'baixa': 0x00e676,
};

/**
 * Human-readable display names for each GLB mesh node.
 * Used in the info panel when the operator clicks on a 3D component.
 */
const MESH_DISPLAY_NAMES = {
  'Maquinario_Elevador': 'Máquina de Tração',
  'Apoio_Tração': 'Apoio de Tração',
  'Ponte_Tração1': 'Ponte de Tração',
  'Polia_Tração': 'Polia de Tração',
  'Polia_Tração2': 'Polia de Tração Secundária',
  'Polia_Contrapeso': 'Polia do Contrapeso',
  'Corda': 'Cabo Principal',
  'Corda2': 'Cabo Secundário',
  'Cabo_Contrapeso': 'Cabo do Contrapeso',
  'FreioDeEmergencia1': 'Freio de Emergência #1',
  'FreioDeEmergencia2': 'Freio de Emergência #2',
  'Sistema de Controle': 'Sistema de Controle',
  'Maquina_Controle': 'Módulo de Controle',
  'Painel de Controle_Superior': 'Painel de Controle Superior',
  'Painel de Controle_Inferior': 'Painel de Controle Inferior',
  'Trilhos_Guias1': 'Guia do Elevador #1',
  'Trilhos_Guias2': 'Guia do Elevador #2',
  'Trilhos_Guias3': 'Guia do Elevador #3',
  'Contrapeso': 'Contrapeso',
  'Apoio_Contrapeso': 'Apoio do Contrapeso',
  'Trilhos_Guia_Contrapeso1': 'Guia do Contrapeso #1',
  'Trilhos_Guia_Contrapeso2': 'Guia do Contrapeso #2',
  'Trilhos_Guia_Contrapeso3': 'Guia do Contrapeso #3',
  'Elevador': 'Cabine do Elevador',
  'Operador_Portas': 'Operador de Portas',
  'Porta1': 'Porta da Cabine',
  'Porta2': 'Porta do Pavimento',
  'Letreiro1': 'Indicador de Pavimento (Cabine)',
  'Letreiro2': 'Indicador de Pavimento (Hall)',
  'Amortecedor_Elevador': 'Amortecedor da Cabine',
  'Amortecedor_Contrapeso': 'Amortecedor do Contrapeso',
  'Poço_Pit': 'Poço do Elevador',
};

const SEVERITY_CSS_COLORS = {
  'crítica': '#ff1744',
  'alta': '#ff6d00',
  'atenção': '#ffc400',
  'baixa': '#00e676',
};

/**
 * Builds the set of problem objects relevant to this occurrence
 * based on the diagnosed suspected regions.
 */
function buildProblemMap(diagnosis) {
  const suspectedRegions = diagnosis?.suspectedRegions || [];
  if (suspectedRegions.length === 0) return {};

  const problemObjectNames = new Set();
  for (const region of suspectedRegions) {
    const objectNames = REGION_TO_3D_OBJECTS[region] || [];
    for (const name of objectNames) {
      problemObjectNames.add(name);
    }
  }

  const problemMap = {};
  for (const regionId of suspectedRegions) {
    const region = elevatorRegions.find((item) => item.id === regionId);
    const objectNames = REGION_TO_3D_OBJECTS[regionId] || [];
    for (const name of objectNames) {
      if (!problemObjectNames.has(name)) continue;
      problemMap[name] = {
        description: `Região relacionada à hipótese inicial: ${region?.label || 'componente do elevador'}. Necessita verificação técnica no local.`,
        severity: 'atenção',
      };
    }
  }

  return problemMap;
}

/**
 * Applies edge materials to the loaded model based on the current problem map.
 * Cleans up previous edge LineSegments before re-applying.
 */
function applyProblemMaterials(model, problemMap, problemMeshesRef) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const edgeColor = isDark ? 0x94a3b8 : 0x425c85;
  const edgeThreshold = 15;
  const problemMeshes = [];

  model.traverse((child) => {
    if (!child.isMesh) return;

    // Cache edges geometry once per mesh
    if (!child.userData.edgesGeometry) {
      child.userData.edgesGeometry = new THREE.EdgesGeometry(child.geometry, edgeThreshold);
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
      child.material = new THREE.MeshBasicMaterial({ visible: false });

      const lineMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.4,
      });
      const lineSegments = new THREE.LineSegments(edges, lineMaterial);
      lineSegments.name = child.name + '_edges';
      child.add(lineSegments);
    }
  });

  problemMeshesRef.current = problemMeshes;
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

  // Keep a ref that always holds the latest diagnosis to avoid stale closures
  const diagnosisRef = useRef(diagnosis);
  diagnosisRef.current = diagnosis;

  // Stable key for dependency comparison — only changes when suspectedRegions actually change
  const suspectedRegionsKey = useMemo(
    () => JSON.stringify(diagnosis?.suspectedRegions || []),
    [diagnosis?.suspectedRegions],
  );

  const handleResetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !initialCameraRef.current.position) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const { position, target } = initialCameraRef.current;

    // Smooth animation to initial position
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Detect theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1e293b : 0xf1f5f9);

    // --- Camera ---
    const width = container.clientWidth;
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(6, 5, 8);
    cameraRef.current = camera;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 40;
    controls.target.set(0, 2, 0);
    controls.update();
    controlsRef.current = controls;

    // --- Lighting (subtle, since wireframe doesn't need much) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // --- Grid helper ---
    const gridColor = isDark ? 0x334155 : 0xd3dff0;
    const grid = new THREE.GridHelper(20, 20, gridColor, gridColor);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // --- Load GLB model ---
    const loader = new GLTFLoader();
    loader.load(
      elevatorModelUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Apply initial materials — read from ref to get the LATEST diagnosis
        const currentProblemMap = buildProblemMap(diagnosisRef.current);
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

        // Save initial camera state for reset
        initialCameraRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };

        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.error('Error loading GLB model:', error);
        setLoadError(true);
      },
    );

    // --- Animation loop ---
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // Pulse animation for problem objects (edges + fill)
      const time = performance.now() * 0.001;
      problemMeshesRef.current.forEach((mesh) => {
        const pulse = 0.6 + 0.4 * Math.sin(time * 2.5);
        // Pulse the edge outlines
        if (mesh.userData.edgeMaterial) {
          mesh.userData.edgeMaterial.opacity = pulse;
        }
        // Pulse the fill
        if (mesh.material && mesh.material.transparent) {
          mesh.material.opacity = 0.03 + 0.06 * Math.sin(time * 2.5);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize observer ---
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

    // --- Theme observer ---
    const themeObserver = new MutationObserver(() => {
      const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
      scene.background = new THREE.Color(nowDark ? 0x1e293b : 0xf1f5f9);
      grid.material.color.set(nowDark ? 0x334155 : 0xd3dff0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // --- Cleanup ---
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

  // --- Re-apply materials when suspected regions change (new occurrence) ---
  useEffect(() => {
    if (!modelRef.current) return;
    const currentProblemMap = buildProblemMap(diagnosisRef.current);
    applyProblemMaterials(modelRef.current, currentProblemMap, problemMeshesRef);
    setSelectedProblem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspectedRegionsKey]);

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
      testObjects.push(mesh); // the fill mesh itself
      mesh.children.forEach((child) => {
        testObjects.push(child); // _edges LineSegments
      });
    });

    const intersects = raycasterRef.current.intersectObjects(testObjects, false);

    if (intersects.length > 0) {
      let hitObject = intersects[0].object;
      // If we hit an edge or child, resolve to the parent problem mesh
      if (!hitObject.userData.problem && hitObject.parent?.userData?.problem) {
        hitObject = hitObject.parent;
      }
      const problem = hitObject.userData.problem;
      if (problem) {
        // Position panel near click point
        const panelX = Math.min(x, rect.width - 280);
        const panelY = Math.min(y, rect.height - 120);
        setPanelPosition({ x: Math.max(8, panelX), y: Math.max(8, panelY) });
        setSelectedProblem({ name: hitObject.name, ...problem });
        return;
      }
    }

    // Clicked on nothing — close panel
    setSelectedProblem(null);
  }, []);

  return (
    <div className="elevator-3d-viewer" ref={containerRef} onClick={handleCanvasClick}>
      {!isLoaded && !loadError && (
        <div className="elevator-3d-loader">
          <div className="elevator-3d-loader__spinner" />
          <span>Carregando modelo 3D…</span>
        </div>
      )}
      {loadError && (
        <div className="elevator-3d-loader">
          <span>Não foi possível carregar o modelo 3D.</span>
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
            <strong>{MESH_DISPLAY_NAMES[selectedProblem.name] || selectedProblem.name.replace(/_/g, ' ')}</strong>
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
