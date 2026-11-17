import * as THREE from 'three';
import { STATIONS } from '../data/curriculumContent';
import { HydrologyMetrics, SimulationParams, StationId } from '../types/simulation';
import {
  createBridgeGroup,
  createCarGroup,
  createCraneGroup,
  createHouseGroup,
  createStationBeacon,
  createStormDrainGroup,
  createTowerGroup,
} from './compositeModels';
import { ProceduralTextureSet } from './proceduralTextures';
import { groundHeightAt, riverCenterX } from './terrainMath';

// Pre-allocated scratch math helpers (Zero GC inside render tick)
const _dummy = new THREE.Object3D();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _clearWaterColor = new THREE.Color(0x0ea5e9);
const _muddyWaterColor = new THREE.Color(0x855836);
const _skyDayColor = new THREE.Color(0xbbe1fa);
const _skyStormColor = new THREE.Color(0x334155);
const _grassColor = new THREE.Color(0x3f7d3c);
const _clearedEarthColor = new THREE.Color(0xa1623b);
const _townConcreteColor = new THREE.Color(0x64748b);
const _riverBedColor = new THREE.Color(0x57534e);

interface TreeInstanceData {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
  isHillside: boolean;
  thresholdUrban: number; // Urbanization % at which this tree gets cleared
  currentGrowth: number;
}

interface RunoffDrop {
  t: number;
  zOffset: number;
  speed: number;
}

export interface WorldController {
  hitProxies: THREE.Mesh[];
  update: (
    dt: number,
    elapsed: number,
    params: SimulationParams,
    metrics: HydrologyMetrics,
    activeStation: StationId | null,
    hoveredStation: StationId | null,
  ) => void;
  getSkyColor: () => THREE.Color;
  dispose: () => void;
}

export function buildFloodWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
): WorldController {
  const disposables: Array<{ dispose: () => void }> = [];

  // ---------------------------------------------------------------------------
  // 1. CONTINUOUS WATERSHED TERRAIN (220m x 220m) WITH DYNAMIC VERTEX COLORS
  // ---------------------------------------------------------------------------
  const terrainSize = 220;
  const terrainSegs = 128;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  const vCount = posAttr.count;
  const baseColors = new Float32Array(vCount * 3);
  const vertexIsHill = new Uint8Array(vCount);
  const vertexIsTown = new Uint8Array(vCount);
  const vertexIsRiver = new Uint8Array(vCount);

  for (let i = 0; i < vCount; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = groundHeightAt(x, z);
    posAttr.setY(i, y);

    const rcx = riverCenterX(z);
    const distR = Math.abs(x - rcx);

    if (distR < 5.0) {
      vertexIsRiver[i] = 1;
      _colorA.copy(_riverBedColor);
    } else if (x > rcx + 5.2 && x < 28 && Math.abs(z) < 25) {
      vertexIsTown[i] = 1;
      _colorA.copy(_townConcreteColor);
    } else if (x < rcx - 5.5 && x > -34 && z < 12 && z > -28) {
      vertexIsHill[i] = 1;
      _colorA.copy(_grassColor);
    } else {
      _colorA.copy(_grassColor);
    }

    baseColors[i * 3] = _colorA.r;
    baseColors[i * 3 + 1] = _colorA.g;
    baseColors[i * 3 + 2] = _colorA.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));
  terrainGeo.computeVertexNormals();
  disposables.push(terrainGeo);

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    bumpMap: textures.terrainBump,
    bumpScale: 0.14,
    roughness: 0.88,
    metalness: 0.04,
  });
  disposables.push(terrainMat);

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  let lastSoilMix = -1;
  function updateTerrainColors(deforestationFactor: number): void {
    if (Math.abs(deforestationFactor - lastSoilMix) < 0.015) return;
    lastSoilMix = deforestationFactor;
    const colAttr = terrainGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < vCount; i++) {
      if (vertexIsHill[i] === 1) {
        _colorA.copy(_grassColor).lerp(_clearedEarthColor, deforestationFactor * 0.92);
        colAttr.setXYZ(i, _colorA.r, _colorA.g, _colorA.b);
      }
    }
    colAttr.needsUpdate = true;
  }

  // ---------------------------------------------------------------------------
  // 2. RIVER & FLOODWATER SURFACE (Custom onBeforeCompile PBR Ripple Shader)
  // ---------------------------------------------------------------------------
  const waterUniforms = {
    uTime: { value: 0 },
    uWaveAmp: { value: 0.06 },
  };
  const waterGeo = new THREE.PlaneGeometry(180, 180, 96, 96);
  waterGeo.rotateX(-Math.PI / 2);
  disposables.push(waterGeo);

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: _clearWaterColor.clone(),
    normalMap: textures.waterNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.14,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.84,
  });
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.uniforms.uWaveAmp = waterUniforms.uWaveAmp;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWaveAmp;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float wave1 = sin(position.x * 0.55 + uTime * 2.2) * cos(position.z * 0.42 - uTime * 2.8);
       float wave2 = sin(position.z * 0.9 - uTime * 3.6) * 0.45;
       transformed.y += (wave1 + wave2) * uWaveAmp;`,
    );
  };
  disposables.push(waterMat);

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 1.4;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // ---------------------------------------------------------------------------
  // 3. ROAD NETWORK, SIDEWALKS & PERMEABLE PAVEMENT SWAP
  // ---------------------------------------------------------------------------
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.82,
    metalness: 0.06,
  });
  disposables.push(roadMat);

  // Main urban North-South boulevard (X = 11.5)
  const mainRoadGeo = new THREE.BoxGeometry(5.2, 0.08, 44);
  disposables.push(mainRoadGeo);
  const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
  mainRoad.position.set(11.5, 3.59, 0);
  mainRoad.receiveShadow = true;
  scene.add(mainRoad);

  // Bridge approach road East-West (Z = 6.0, connecting bridge to main boulevard)
  const crossRoadGeo = new THREE.BoxGeometry(10.5, 0.08, 4.2);
  disposables.push(crossRoadGeo);
  const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
  crossRoad.position.set(10.2, 3.60, 6.0);
  crossRoad.receiveShadow = true;
  scene.add(crossRoad);

  // Urban parking plaza (permeable pavement showcase at Station 05)
  const plazaMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.85,
    metalness: 0.04,
  });
  disposables.push(plazaMat);
  const plazaGeo = new THREE.BoxGeometry(7.2, 0.07, 8.2);
  disposables.push(plazaGeo);
  const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.position.set(11.5, 3.59, 13.0);
  plazaMesh.receiveShadow = true;
  scene.add(plazaMesh);

  // Rain Gardens (Bioswale planters) that appear when permeablePavement is active
  const rainGardensGroup = new THREE.Group();
  const planterSoilMat = new THREE.MeshStandardMaterial({ color: 0x4b3621, roughness: 0.9 });
  const planterEdgeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.7 });
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.72 });
  disposables.push(planterSoilMat, planterEdgeMat, shrubMat);

  const planterCoords: [number, number][] = [
    [8.2, -2],
    [8.2, 11],
    [8.2, 16],
    [14.8, 12],
  ];
  for (const [px, pz] of planterCoords) {
    const pg = new THREE.Group();
    const border = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 3.4), planterEdgeMat);
    border.position.y = 0.125;
    pg.add(border);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.28, 3.1), planterSoilMat);
    soil.position.y = 0.15;
    pg.add(soil);
    for (let s = -1; s <= 1; s++) {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), shrubMat);
      bush.position.set(0, 0.48, s * 0.95);
      bush.castShadow = true;
      pg.add(bush);
    }
    pg.position.set(px, 3.55, pz);
    rainGardensGroup.add(pg);
  }
  scene.add(rainGardensGroup);

  // ---------------------------------------------------------------------------
  // 4. BRIDGE, GAUGE POLE & STORM DRAIN (LONGKANG MONSUN)
  // ---------------------------------------------------------------------------
  const bridgeGroup = createBridgeGroup(textures);
  const bridgeX = riverCenterX(6.0);
  bridgeGroup.position.set(bridgeX, 0.0, 6.0);
  scene.add(bridgeGroup);

  const { group: stormDrainGroup, debrisGroup, drainWaterMesh } = createStormDrainGroup();
  stormDrainGroup.position.set(5.8, 2.75, 11.5);
  scene.add(stormDrainGroup);

  // ---------------------------------------------------------------------------
  // 5. HOUSES, DYNAMIC URBAN TOWERS, VEHICLES & CONSTRUCTION CRANE
  // ---------------------------------------------------------------------------
  const houseConfigs: Array<{ x: number; z: number; rotY: number; wall: number; roof: number }> = [
    { x: 17.5, z: -13.0, rotY: -Math.PI / 2, wall: 0xfef3c7, roof: 0xb91c1c },
    { x: 17.5, z: -7.5, rotY: -Math.PI / 2, wall: 0xe0f2fe, roof: 0x991b1b },
    { x: 17.5, z: -2.0, rotY: -Math.PI / 2, wall: 0xfde68a, roof: 0x0f766e },
    { x: 17.5, z: 10.5, rotY: -Math.PI / 2, wall: 0xf1f5f9, roof: 0xb45309 },
    { x: 17.5, z: 16.0, rotY: -Math.PI / 2, wall: 0xdcfce7, roof: 0x9a3412 },
    { x: 7.4, z: -12.0, rotY: Math.PI / 2, wall: 0xfef2f2, roof: 0x334155 },
  ];
  for (const hc of houseConfigs) {
    const house = createHouseGroup(textures, hc.wall, hc.roof);
    house.position.set(hc.x, groundHeightAt(hc.x, hc.z), hc.z);
    house.rotation.y = hc.rotY;
    scene.add(house);
  }

  // Dynamic Urban Towers (grow cleanly as urbanizationPct increases)
  const towerConfigs: Array<{
    x: number;
    z: number;
    height: number;
    accent: number;
    threshold: number;
  }> = [
    { x: 22.8, z: -6.0, height: 11.5, accent: 0x0284c7, threshold: 0.25 },
    { x: 22.8, z: 3.5, height: 14.0, accent: 0x0ea5e9, threshold: 0.45 },
    { x: 16.5, z: 3.0, height: 8.5, accent: 0xf59e0b, threshold: 0.65 },
    { x: 22.5, z: 13.5, height: 10.2, accent: 0x10b981, threshold: 0.80 },
  ];
  const dynamicTowers: Array<{ group: THREE.Group; threshold: number; currentScale: number }> = [];
  for (const tc of towerConfigs) {
    const tower = createTowerGroup(textures, tc.height, tc.accent);
    tower.position.set(tc.x, groundHeightAt(tc.x, tc.z), tc.z);
    scene.add(tower);
    dynamicTowers.push({ group: tower, threshold: tc.threshold, currentScale: 0.01 });
  }

  // Parked & Street Cars
  const carConfigs: Array<{ x: number; z: number; rotY: number; color: number }> = [
    { x: 10.3, z: -5.5, rotY: 0, color: 0xef4444 },
    { x: 12.7, z: 1.5, rotY: Math.PI, color: 0x3b82f6 },
    { x: 10.5, z: 13.2, rotY: Math.PI / 2, color: 0xf59e0b },
    { x: 13.2, z: -11.5, rotY: Math.PI, color: 0xf8fafc },
  ];
  for (const cc of carConfigs) {
    const car = createCarGroup(cc.color);
    car.position.set(cc.x, groundHeightAt(cc.x, cc.z) + 0.04, cc.z);
    car.rotation.y = cc.rotY;
    scene.add(car);
  }

  // Construction Crane on hillside clearing (visible when urbanization >= 30%)
  const { group: craneGroup, jibPivot } = createCraneGroup();
  const craneX = -17.5;
  const craneZ = -5.5;
  craneGroup.position.set(craneX, groundHeightAt(craneX, craneZ) - 0.15, craneZ);
  scene.add(craneGroup);

  // ---------------------------------------------------------------------------
  // 6. FLOOD LEVEE WALL & RETENTION BASIN GATE (BENTENG & KOLAM TAKUNGAN)
  // ---------------------------------------------------------------------------
  const leveeGroup = new THREE.Group();
  const leveeMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.72,
    metalness: 0.15,
  });
  const leveeCapMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.45,
    metalness: 0.35,
  });
  disposables.push(leveeMat, leveeCapMat);

  // Segmented flood wall along town riverbank (north & south of bridge)
  const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.2, 22), leveeMat);
  wallNorth.position.set(4.1, 3.6, -7.8);
  wallNorth.castShadow = true;
  wallNorth.receiveShadow = true;
  leveeGroup.add(wallNorth);

  const wallNorthCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 22.1), leveeCapMat);
  wallNorthCap.position.set(4.1, 4.75, -7.8);
  leveeGroup.add(wallNorthCap);

  const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.2, 16), leveeMat);
  wallSouth.position.set(4.1, 3.6, 17.5);
  wallSouth.castShadow = true;
  wallSouth.receiveShadow = true;
  leveeGroup.add(wallSouth);

  const wallSouthCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 16.1), leveeCapMat);
  wallSouthCap.position.set(4.1, 4.75, 17.5);
  leveeGroup.add(wallSouthCap);

  // Retention Basin Concrete Spillway / Sluice Gate at South-West pond
  const spillway = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 5.2), leveeMat);
  spillway.position.set(-5.6, 2.2, 18.5);
  spillway.castShadow = true;
  leveeGroup.add(spillway);

  const sluiceCap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 5.4), leveeCapMat);
  sluiceCap.position.set(-5.6, 3.45, 18.5);
  leveeGroup.add(sluiceCap);

  scene.add(leveeGroup);

  // ---------------------------------------------------------------------------
  // 7. INSTANCED TROPICAL FOREST TREES & STUMPS (InstancedMesh > 20 items)
  // ---------------------------------------------------------------------------
  const treeList: TreeInstanceData[] = [];
  // Generate hillside trees (cleared with urbanization, restored with reforestation)
  for (let i = 0; i < 115; i++) {
    const rx = -34 + Math.random() * 23; // x in [-34, -11]
    const rz = -28 + Math.random() * 38; // z in [-28, 10]
    // Keep clear of crane pad & station 01 beacon
    if (Math.hypot(rx - craneX, rz - craneZ) < 3.6) continue;
    if (Math.hypot(rx - -20, rz - -4) < 2.8) continue;

    const rcx = riverCenterX(rz);
    if (rx > rcx - 6.0) continue;

    treeList.push({
      x: rx,
      y: groundHeightAt(rx, rz),
      z: rz,
      scale: 0.85 + Math.random() * 0.35, // ±15% natural scale variation
      rotY: Math.random() * Math.PI * 2,
      isHillside: true,
      thresholdUrban: 0.12 + Math.random() * 0.82,
      currentGrowth: 1,
    });
  }
  // Distant ambient background forest around valley perimeter
  for (let i = 0; i < 95; i++) {
    const angle = (i / 95) * Math.PI * 2;
    const dist = 36 + Math.random() * 24;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    const rcx = riverCenterX(rz);
    if (Math.abs(rx - rcx) < 7) continue;

    treeList.push({
      x: rx,
      y: groundHeightAt(rx, rz),
      z: rz,
      scale: 0.95 + Math.random() * 0.4,
      rotY: Math.random() * Math.PI * 2,
      isHillside: false,
      thresholdUrban: 99,
      currentGrowth: 1,
    });
  }

  const treeCount = treeList.length;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.8, 7);
  trunkGeo.translate(0, 0.9, 0);
  const canopyLowGeo = new THREE.DodecahedronGeometry(1.15, 1);
  canopyLowGeo.translate(0, 2.35, 0);
  const canopyTopGeo = new THREE.DodecahedronGeometry(0.82, 1);
  canopyTopGeo.translate(0, 3.35, 0);
  const stumpGeo = new THREE.CylinderGeometry(0.22, 0.32, 0.42, 7);
  stumpGeo.translate(0, 0.21, 0);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });
  const stumpMat = new THREE.MeshStandardMaterial({ color: 0x7c5836, roughness: 0.92 });
  disposables.push(trunkGeo, canopyLowGeo, canopyTopGeo, stumpGeo, trunkMat, canopyMat, stumpMat);

  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const canopyLowMesh = new THREE.InstancedMesh(canopyLowGeo, canopyMat, treeCount);
  const canopyTopMesh = new THREE.InstancedMesh(canopyTopGeo, canopyMat, treeCount);
  const stumpMesh = new THREE.InstancedMesh(stumpGeo, stumpMat, treeCount);

  trunkMesh.castShadow = true;
  canopyLowMesh.castShadow = true;
  canopyTopMesh.castShadow = true;
  trunkMesh.frustumCulled = false;
  canopyLowMesh.frustumCulled = false;
  canopyTopMesh.frustumCulled = false;
  stumpMesh.frustumCulled = false;

  for (let i = 0; i < treeCount; i++) {
    const hue = 0.28 + (Math.random() - 0.5) * 0.06;
    const sat = 0.52 + Math.random() * 0.16;
    const light = 0.28 + Math.random() * 0.12;
    _colorA.setHSL(hue, sat, light);
    canopyLowMesh.setColorAt(i, _colorA);
    _colorB.setHSL(hue + 0.02, sat, light + 0.06);
    canopyTopMesh.setColorAt(i, _colorB);
  }
  if (canopyLowMesh.instanceColor) canopyLowMesh.instanceColor.needsUpdate = true;
  if (canopyTopMesh.instanceColor) canopyTopMesh.instanceColor.needsUpdate = true;

  scene.add(trunkMesh, canopyLowMesh, canopyTopMesh, stumpMesh);

  // ---------------------------------------------------------------------------
  // 8. INSTANCED RAIN PARTICLES & HILLSIDE SURFACE RUNOFF DROPLETS
  // ---------------------------------------------------------------------------
  const rainCount = 850;
  const rainGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.35, 4);
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.58,
  });
  disposables.push(rainGeo, rainMat);
  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rainMesh.frustumCulled = false;
  scene.add(rainMesh);

  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 76;
    rainPositions[i * 3 + 1] = Math.random() * 28 + 2;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 68;
  }

  // Surface runoff droplets flowing down hillside slope into river
  const runoffCount = 120;
  const runoffGeo = new THREE.SphereGeometry(0.18, 6, 6);
  const runoffMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });
  disposables.push(runoffGeo, runoffMat);
  const runoffMesh = new THREE.InstancedMesh(runoffGeo, runoffMat, runoffCount);
  runoffMesh.frustumCulled = false;
  scene.add(runoffMesh);

  const runoffDrops: RunoffDrop[] = [];
  for (let i = 0; i < runoffCount; i++) {
    runoffDrops.push({
      t: Math.random(),
      zOffset: -24 + Math.random() * 34,
      speed: 0.25 + Math.random() * 0.2,
    });
  }

  // ---------------------------------------------------------------------------
  // 9. INTERACTIVE 3D STATION BEACONS (5 CURRICULUM HOTSPOTS)
  // ---------------------------------------------------------------------------
  const hitProxies: THREE.Mesh[] = [];
  const beacons: Array<{
    id: StationId;
    group: THREE.Group;
    diamond: THREE.Mesh;
    ring: THREE.Mesh;
  }> = [];

  for (const st of STATIONS) {
    const [sx, , sz] = st.worldPosition;
    const groundY = Math.max(groundHeightAt(sx, sz), 3.1);
    const beacon = createStationBeacon(st.number);
    beacon.group.position.set(sx, groundY, sz);
    beacon.hitProxy.userData.stationId = st.id;
    scene.add(beacon.group);
    hitProxies.push(beacon.hitProxy);
    beacons.push({
      id: st.id,
      group: beacon.group,
      diamond: beacon.diamond,
      ring: beacon.ring,
    });
  }

  // Runtime damped state
  let currentWaterY = 1.4;
  let currentLeveeY = -2.6;
  let currentSiltMix = 0.1;
  let currentUrbanFactor = 0.5;
  let currentSkyColor = _skyDayColor.clone();

  function update(
    dt: number,
    elapsed: number,
    params: SimulationParams,
    metrics: HydrologyMetrics,
    activeStation: StationId | null,
    hoveredStation: StationId | null,
  ): void {
    const dampFast = 1 - Math.exp(-5.5 * dt);
    const dampSlow = 1 - Math.exp(-2.8 * dt);

    const targetUrban = params.urbanizationPct / 100;
    currentUrbanFactor = THREE.MathUtils.lerp(currentUrbanFactor, targetUrban, dampSlow);

    // 1. Update terrain hillside color (green vs exposed construction red earth)
    const deforestationFactor = params.reforestation
      ? currentUrbanFactor * 0.18
      : currentUrbanFactor;
    updateTerrainColors(deforestationFactor);

    // 2. Update river & floodwater height, color (clear vs kelodak), and wave motion
    currentWaterY = THREE.MathUtils.lerp(currentWaterY, metrics.waterLevelM, dampSlow);
    waterMesh.position.y = currentWaterY;
    waterUniforms.uTime.value = elapsed;
    waterUniforms.uWaveAmp.value = 0.04 + (params.rainfallMmHr / 150) * 0.08;
    textures.waterNormal.offset.y = -(elapsed * (0.08 + (params.rainfallMmHr / 150) * 0.14)) % 1;

    currentSiltMix = THREE.MathUtils.lerp(currentSiltMix, metrics.siltLoadPct / 100, dampSlow);
    waterMat.color.copy(_clearWaterColor).lerp(_muddyWaterColor, currentSiltMix);

    // 3. Update sky color for storm vs sunny day
    const stormFactor = (params.rainfallMmHr / 150) * 0.85;
    _colorA.copy(_skyDayColor).lerp(_skyStormColor, stormFactor);
    currentSkyColor.lerp(_colorA, dampFast);

    // 4. Update permeable pavement texture & rain gardens visibility
    const targetPlazaTex = params.permeablePavement ? textures.permeablePaver : textures.asphalt;
    if (plazaMat.map !== targetPlazaTex) {
      plazaMat.map = targetPlazaTex;
      plazaMat.needsUpdate = true;
    }
    rainGardensGroup.visible = params.permeablePavement;

    // 5. Update storm drain debris & water depth
    debrisGroup.visible = !params.drainClearing;
    const drainWaterScaleY = 0.35 + (params.rainfallMmHr / 150) * 1.15;
    drainWaterMesh.scale.y = THREE.MathUtils.lerp(drainWaterMesh.scale.y, drainWaterScaleY, dampFast);
    (drainWaterMesh.material as THREE.MeshPhysicalMaterial).color.copy(waterMat.color);

    // 6. Update Flood Levee Wall & Retention Gate (slides smoothly out of ground when active)
    const targetLeveeY = params.retentionBasin ? 0.0 : -3.2;
    currentLeveeY = THREE.MathUtils.lerp(currentLeveeY, targetLeveeY, dampFast);
    leveeGroup.position.y = currentLeveeY;
    leveeGroup.visible = currentLeveeY > -2.9;

    // 7. Update Dynamic Urban Towers & Construction Crane
    for (const tw of dynamicTowers) {
      const targetS = currentUrbanFactor >= tw.threshold ? 1.0 : 0.001;
      tw.currentScale = THREE.MathUtils.lerp(tw.currentScale, targetS, dampFast);
      tw.group.scale.set(1, tw.currentScale, 1);
      tw.group.visible = tw.currentScale > 0.02;
    }
    craneGroup.visible = currentUrbanFactor >= 0.2;
    jibPivot.rotation.y = Math.sin(elapsed * 0.35) * 0.65;

    // 8. Update Instanced Tropical Forest Trees vs Cleared Stumps
    for (let i = 0; i < treeCount; i++) {
      const td = treeList[i];
      let targetAlive = 1;
      if (td.isHillside) {
        const clearedByUrban = currentUrbanFactor > td.thresholdUrban;
        if (clearedByUrban && !params.reforestation) {
          targetAlive = 0;
        }
      }
      td.currentGrowth = THREE.MathUtils.lerp(td.currentGrowth, targetAlive, dampSlow);

      const g = td.currentGrowth;
      if (g > 0.08) {
        _dummy.position.set(td.x, td.y - 0.08, td.z);
        _dummy.rotation.set(0, td.rotY, 0);
        _dummy.scale.setScalar(td.scale * g);
        _dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, _dummy.matrix);
        canopyLowMesh.setMatrixAt(i, _dummy.matrix);
        canopyTopMesh.setMatrixAt(i, _dummy.matrix);

        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        stumpMesh.setMatrixAt(i, _dummy.matrix);
      } else {
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, _dummy.matrix);
        canopyLowMesh.setMatrixAt(i, _dummy.matrix);
        canopyTopMesh.setMatrixAt(i, _dummy.matrix);

        _dummy.position.set(td.x, td.y - 0.05, td.z);
        _dummy.rotation.set(0, td.rotY, 0);
        _dummy.scale.setScalar(td.scale);
        _dummy.updateMatrix();
        stumpMesh.setMatrixAt(i, _dummy.matrix);
      }
    }
    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyLowMesh.instanceMatrix.needsUpdate = true;
    canopyTopMesh.instanceMatrix.needsUpdate = true;
    stumpMesh.instanceMatrix.needsUpdate = true;

    // 9. Update 3D Rain Particles
    const activeRainCount = Math.floor((params.rainfallMmHr / 150) * rainCount);
    const fallSpeed = 24 + (params.rainfallMmHr / 150) * 18;
    rainMesh.visible = activeRainCount > 5;
    if (rainMesh.visible) {
      for (let i = 0; i < rainCount; i++) {
        if (i < activeRainCount) {
          let py = rainPositions[i * 3 + 1] - fallSpeed * dt;
          let px = rainPositions[i * 3] + 2.5 * dt;
          if (py < 1.0) {
            py = 28 + Math.random() * 4;
            px = (Math.random() - 0.5) * 76;
          }
          rainPositions[i * 3] = px;
          rainPositions[i * 3 + 1] = py;

          _dummy.position.set(px, py, rainPositions[i * 3 + 2]);
          _dummy.rotation.set(0, 0, -0.09);
          _dummy.scale.setScalar(1);
        } else {
          _dummy.scale.setScalar(0.0001);
        }
        _dummy.updateMatrix();
        rainMesh.setMatrixAt(i, _dummy.matrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }

    // 10. Update Hillside Surface Runoff Flow Droplets
    const runoffActive = params.rainfallMmHr > 12;
    runoffMesh.visible = runoffActive;
    if (runoffActive) {
      const flowSpeedMult = (0.35 + (metrics.runoffPct / 100) * 1.4) * (params.rainfallMmHr / 100);
      const visibleDrops = Math.floor((metrics.runoffPct / 100) * runoffCount);
      runoffMat.color.copy(waterMat.color);
      runoffMat.emissive.copy(waterMat.color);

      for (let i = 0; i < runoffCount; i++) {
        const d = runoffDrops[i];
        d.t += d.speed * flowSpeedMult * dt;
        if (d.t > 1) d.t -= 1;

        if (i < visibleDrops) {
          const rx = THREE.MathUtils.lerp(-30, riverCenterX(d.zOffset) - 1.2, d.t);
          const ry = groundHeightAt(rx, d.zOffset) + 0.16;
          _dummy.position.set(rx, ry, d.zOffset);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.setScalar(0.85 + 0.35 * Math.sin(elapsed * 6 + i));
        } else {
          _dummy.scale.setScalar(0.0001);
        }
        _dummy.updateMatrix();
        runoffMesh.setMatrixAt(i, _dummy.matrix);
      }
      runoffMesh.instanceMatrix.needsUpdate = true;
    }

    // 11. Animate Interactive Station Beacons
    for (const b of beacons) {
      const isSelected = activeStation === b.id;
      const isHover = hoveredStation === b.id;
      b.diamond.rotation.y = elapsed * (isSelected ? 2.4 : 1.1);
      b.diamond.position.y = 2.75 + Math.sin(elapsed * 2.5) * 0.14;
      b.ring.rotation.z = elapsed * 1.5;

      const targetScale = isSelected ? 1.32 : isHover ? 1.18 : 1.0;
      b.group.scale.setScalar(THREE.MathUtils.lerp(b.group.scale.x, targetScale, dampFast));

      const dMat = b.diamond.material as THREE.MeshPhysicalMaterial;
      if (isSelected) {
        dMat.color.setHex(0xfacc15);
        dMat.emissive.setHex(0xd97706);
      } else if (isHover) {
        dMat.color.setHex(0x67e8f9);
        dMat.emissive.setHex(0x0284c7);
      } else {
        dMat.color.setHex(0x38bdf8);
        dMat.emissive.setHex(0x0369a1);
      }
    }
  }

  return {
    hitProxies,
    update,
    getSkyColor: () => currentSkyColor,
    dispose: () => {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}
