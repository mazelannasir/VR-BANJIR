import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CAMERA_PRESETS, STATIONS } from '../data/curriculumContent';
import { createProceduralTextures } from '../three/proceduralTextures';
import { groundHeightAt, riverCenterX } from '../three/terrainMath';
import { buildFloodWorld } from '../three/worldBuilder';
import {
  CameraPresetId,
  ExplorationMode,
  HydrologyMetrics,
  SimulationParams,
  StationId,
} from '../types/simulation';
import { audioEngine } from '../utils/proceduralAudio';

interface FloodWorldCanvasProps {
  started: boolean;
  params: SimulationParams;
  metrics: HydrologyMetrics;
  explorationMode: ExplorationMode;
  activeStation: StationId | null;
  cameraCommand: { presetId?: CameraPresetId; stationId?: StationId; seq: number } | null;
  onSelectStation: (stationId: StationId | null) => void;
  onExitWalk?: () => void;
}

// Pre-allocated scratch helpers (Zero GC in render loop)
const _mouse = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3(36, 25, 42);
const _targetLookAt = new THREE.Vector3(0, 2.5, 0);
const _walkForward = new THREE.Vector3();
const _walkRight = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _stereoOffset = new THREE.Vector3();
const _leftCamPos = new THREE.Vector3();
const _rightCamPos = new THREE.Vector3();

export default function FloodWorldCanvas({
  started,
  params,
  metrics,
  explorationMode,
  activeStation,
  cameraCommand,
  onSelectStation,
  onExitWalk,
}: FloodWorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Store reactive props in refs so WebGL lifecycle never tears down
  const startedRef = useRef(started);
  const paramsRef = useRef(params);
  const metricsRef = useRef(metrics);
  const modeRef = useRef(explorationMode);
  const activeStationRef = useRef(activeStation);
  const onSelectStationRef = useRef(onSelectStation);
  const onExitWalkRef = useRef(onExitWalk);

  startedRef.current = started;
  paramsRef.current = params;
  metricsRef.current = metrics;
  modeRef.current = explorationMode;
  activeStationRef.current = activeStation;
  onSelectStationRef.current = onSelectStation;
  onExitWalkRef.current = onExitWalk;

  const transitionRef = useRef<{ active: boolean }>({ active: false });
  const walkInitRef = useRef<boolean>(false);

  // Handle camera preset / station inspection commands smoothly
  useEffect(() => {
    if (!cameraCommand) return;
    if (cameraCommand.stationId) {
      const st = STATIONS.find((s) => s.id === cameraCommand.stationId);
      if (st) {
        _targetCamPos.set(...st.cameraPosition);
        _targetLookAt.set(...st.cameraTarget);
        transitionRef.current.active = true;
      }
    } else if (cameraCommand.presetId) {
      const preset = CAMERA_PRESETS.find((p) => p.id === cameraCommand.presetId);
      if (preset) {
        _targetCamPos.set(...preset.position);
        _targetLookAt.set(...preset.target);
        transitionRef.current.active = true;
      }
    }
  }, [cameraCommand]);

  // Reset walk initial pose when entering walk or stereo mode
  useEffect(() => {
    if (explorationMode === 'walk' || explorationMode === 'stereo') {
      walkInitRef.current = true;
      transitionRef.current.active = false;
    }
  }, [explorationMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Detection (renderer string, never userAgent)
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer Configuration
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // 3. Scene, Camera & PMREM Studio Environment
    const scene = new THREE.Scene();
    const initialBg = new THREE.Color(0xbbe1fa);
    scene.background = initialBg;
    scene.fog = new THREE.FogExp2(0xbbe1fa, 0.0068);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.15,
      260,
    );
    camera.position.set(36, 25, 42);

    const stereoSubCam = new THREE.PerspectiveCamera(
      62,
      (container.clientWidth * 0.5) / Math.max(1, container.clientHeight),
      0.15,
      260,
    );

    // 4. 3-Point Outdoor Daylight Rig (<= 3 shadow casters)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x475569, 0.95);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.05);
    sunLight.position.set(34, 46, 26);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 4;
    sunLight.shadow.camera.far = 130;
    const d = 36;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.55);
    rimLight.position.set(-32, 22, -28);
    scene.add(rimLight);

    // 5. Procedural Textures & World Assembly
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAniso);
    const world = buildFloodWorld(scene, textures);

    // Pre-compile shaders on GPU devices
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 6. OrbitControls + First-Person Walk Look State
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 8;
    controls.maxDistance = 82;
    controls.target.set(0, 2.5, 0);

    controls.addEventListener('start', () => {
      transitionRef.current.active = false;
    });

    // Walk mode state
    const walkPos = new THREE.Vector3(8.5, 5.3, 14.0);
    let walkYaw = Math.PI * 0.3;
    let walkPitch = -0.08;
    let isDraggingLook = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    // Input key state (held keys cleared on window blur)
    const heldKeys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      heldKeys.add(e.code);
      if (e.code === 'Escape' && (modeRef.current === 'walk' || modeRef.current === 'stereo')) {
        onExitWalkRef.current?.();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };
    const onBlur = () => {
      heldKeys.clear();
      isDraggingLook = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // 7. Raycasting for 3D Station Beacons (Layer 1 only, throttled hover)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let hoveredStation: StationId | null = null;
    let lastHoverTime = 0;

    const updateMouseNDC = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      if (modeRef.current === 'walk' || modeRef.current === 'stereo') {
        isDraggingLook = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingLook && (modeRef.current === 'walk' || modeRef.current === 'stereo')) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        walkYaw -= dx * 0.0045;
        walkPitch = THREE.MathUtils.clamp(walkPitch - dy * 0.0038, -0.75, 0.65);
        return;
      }

      const now = performance.now();
      if (now - lastHoverTime < 55) return;
      lastHoverTime = now;

      updateMouseNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(world.hitProxies, false);
      if (hits.length > 0) {
        const stId = hits[0].object.userData.stationId as StationId;
        hoveredStation = stId;
        renderer.domElement.style.cursor = 'pointer';
      } else {
        hoveredStation = null;
        renderer.domElement.style.cursor = modeRef.current === 'orbit' ? 'grab' : 'crosshair';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingLook = false;
      const moveDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (moveDist > 6 || !startedRef.current) return;

      updateMouseNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(world.hitProxies, false);
      if (hits.length > 0) {
        const stId = hits[0].object.userData.stationId as StationId;
        audioEngine.playTone('station');
        onSelectStationRef.current(stId);
        if (modeRef.current === 'orbit') {
          const st = STATIONS.find((s) => s.id === stId);
          if (st) {
            _targetCamPos.set(...st.cameraPosition);
            _targetLookAt.set(...st.cameraTarget);
            transitionRef.current.active = true;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // WebGL Context Loss Safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Responsive Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      stereoSubCam.aspect = (w * 0.5) / h;
      stereoSubCam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation Loop (Clamped dt, Software-WebGL afterDraw pacing)
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      // Update world simulation
      world.update(
        dt,
        elapsed,
        paramsRef.current,
        metricsRef.current,
        activeStationRef.current,
        hoveredStation,
      );

      // Sync sky & fog color dynamically with storm state
      const skyCol = world.getSkyColor();
      (scene.background as THREE.Color).copy(skyCol);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(skyCol);
      }
      sunLight.intensity = THREE.MathUtils.lerp(
        2.05,
        0.95,
        paramsRef.current.rainfallMmHr / 150,
      );

      const mode = modeRef.current;

      if (!startedRef.current) {
        // Gentle atmospheric title-screen showcase pan
        controls.enabled = false;
        const panAngle = elapsed * 0.14;
        camera.position.set(
          Math.cos(panAngle) * 38,
          22 + Math.sin(elapsed * 0.25) * 1.8,
          Math.sin(panAngle) * 38,
        );
        camera.lookAt(0, 3.2, 0);
      } else if (mode === 'walk' || mode === 'stereo') {
        controls.enabled = false;
        if (walkInitRef.current) {
          walkPos.set(9.2, groundHeightAt(9.2, 13.5) + 1.75, 13.5);
          walkYaw = Math.PI * 0.32;
          walkPitch = -0.06;
          walkInitRef.current = false;
        }

        // First-person movement
        _walkForward.set(-Math.sin(walkYaw), 0, -Math.cos(walkYaw)).normalize();
        _walkRight.crossVectors(_walkForward, _upVec).normalize();

        const moveSpeed = 9.0 * dt;
        let moving = false;
        if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) {
          walkPos.addScaledVector(_walkForward, moveSpeed);
          moving = true;
        }
        if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) {
          walkPos.addScaledVector(_walkForward, -moveSpeed);
          moving = true;
        }
        if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) {
          walkPos.addScaledVector(_walkRight, -moveSpeed);
          moving = true;
        }
        if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) {
          walkPos.addScaledVector(_walkRight, moveSpeed);
          moving = true;
        }

        // Clamp within playable valley
        walkPos.x = THREE.MathUtils.clamp(walkPos.x, -33, 28);
        walkPos.z = THREE.MathUtils.clamp(walkPos.z, -26, 26);

        // Follow terrain & bridge deck height smoothly
        const bridgeX = riverCenterX(6.0);
        const onBridge =
          Math.abs(walkPos.z - 6.0) < 2.3 && Math.abs(walkPos.x - bridgeX) < 7.8;
        const surfaceY = onBridge
          ? 4.35
          : Math.max(groundHeightAt(walkPos.x, walkPos.z), metricsRef.current.waterLevelM - 0.35);
        const bob = moving ? Math.sin(elapsed * 9.5) * 0.05 : 0;
        const targetEyeY = surfaceY + 1.75 + bob;
        walkPos.y = THREE.MathUtils.lerp(walkPos.y, targetEyeY, 1 - Math.exp(-10 * dt));

        camera.position.copy(walkPos);
        const lookX = walkPos.x - Math.sin(walkYaw) * Math.cos(walkPitch) * 10;
        const lookY = walkPos.y + Math.sin(walkPitch) * 10;
        const lookZ = walkPos.z - Math.cos(walkYaw) * Math.cos(walkPitch) * 10;
        camera.lookAt(lookX, lookY, lookZ);
      } else {
        // Orbit Mode with smooth exponential damping for camera presets
        controls.enabled = true;
        if (transitionRef.current.active) {
          const k = 1 - Math.exp(-5.2 * dt);
          camera.position.lerp(_targetCamPos, k);
          controls.target.lerp(_targetLookAt, k);
          if (
            camera.position.distanceTo(_targetCamPos) < 0.08 &&
            controls.target.distanceTo(_targetLookAt) < 0.08
          ) {
            transitionRef.current.active = false;
          }
        }
        controls.update();
      }

      // Render standard single-viewport OR stereoscopic VR split-screen!
      if (startedRef.current && mode === 'stereo') {
        const w = container?.clientWidth ?? window.innerWidth;
        const h = container?.clientHeight ?? window.innerHeight;
        const halfW = Math.floor(w / 2);

        renderer.setScissorTest(true);

        // Compute right vector for interpupillary eye separation (~0.18m)
        _stereoOffset.set(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(0.09);

        // Left eye
        _leftCamPos.copy(camera.position).sub(_stereoOffset);
        stereoSubCam.position.copy(_leftCamPos);
        stereoSubCam.quaternion.copy(camera.quaternion);
        stereoSubCam.aspect = halfW / Math.max(1, h);
        stereoSubCam.updateProjectionMatrix();
        renderer.setViewport(0, 0, halfW, h);
        renderer.setScissor(0, 0, halfW, h);
        renderer.render(scene, stereoSubCam);

        // Right eye
        _rightCamPos.copy(camera.position).add(_stereoOffset);
        stereoSubCam.position.copy(_rightCamPos);
        renderer.setViewport(halfW, 0, w - halfW, h);
        renderer.setScissor(halfW, 0, w - halfW, h);
        renderer.render(scene, stereoSubCam);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      controls.dispose();
      world.dispose();
      textures.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (contextLost) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h2 className="font-display text-lg font-semibold">Paparan WebGL Terhenti</h2>
          <p className="mt-2 text-sm text-slate-400">
            Konteks grafik 3D sedang dipulihkan. Sila muat semula halaman jika paparan tidak kembali.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 h-screen w-screen overflow-hidden select-none"
      aria-label="Dunia simulasi 3D Pembangunan dan Banjir"
    />
  );
}
