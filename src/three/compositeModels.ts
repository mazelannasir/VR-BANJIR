import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

/**
 * 1. Composite Residential Terrace / Detached House (7 distinct parts, bottom-center pivot)
 */
export function createHouseGroup(
  textures: ProceduralTextureSet,
  wallColorHex: number,
  roofColorHex: number,
): THREE.Group {
  const group = new THREE.Group();

  // Part 1: Concrete foundation plinth
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.88,
    metalness: 0.05,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 3.1), plinthMat);
  plinth.position.y = 0.125;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Part 2: Main house body with window facade texture
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallColorHex,
    map: textures.facadeWarm,
    roughness: 0.72,
    metalness: 0.05,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 2.7), wallMat);
  body.position.y = 1.25;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Part 3: Pitched triangular prism roof using ExtrudeGeometry with bevel
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.85, 0);
  roofShape.lineTo(1.85, 0);
  roofShape.lineTo(0, 1.05);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 3.0,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  roofGeo.translate(0, 0, -1.5);
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColorHex,
    roughness: 0.58,
    metalness: 0.12,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.25;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Part 4: Porch awning
  const awningMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.45,
  });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.7), awningMat);
  awning.position.set(0, 1.38, 1.65);
  awning.castShadow = true;
  group.add(awning);

  // Part 5 & 6: Two porch support columns (metallic)
  const colMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.6,
  });
  const colGeo = new THREE.CylinderGeometry(0.055, 0.065, 1.15, 10);
  for (const xOff of [-0.62, 0.62]) {
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(xOff, 0.82, 1.88);
    col.castShadow = true;
    group.add(col);
  }

  // Part 7: Front wooden door
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.65,
    metalness: 0.08,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.08), doorMat);
  door.position.set(0, 0.78, 1.36);
  group.add(door);

  // Part 8: Rooftop water tank accent
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.35,
  });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.45, 12), tankMat);
  tank.position.set(-0.8, 2.72, -0.7);
  group.add(tank);

  return group;
}

/**
 * 2. Composite High-Rise Urban Development Tower (6 distinct parts, bottom-center pivot)
 */
export function createTowerGroup(
  textures: ProceduralTextureSet,
  height: number,
  accentColorHex: number,
): THREE.Group {
  const group = new THREE.Group();

  // Part 1: Concrete podium base
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.82,
    metalness: 0.1,
  });
  const podium = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 4.4), podiumMat);
  podium.position.y = 0.6;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group.add(podium);

  // Part 2: Main glass curtain-wall shaft
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd,
    map: textures.facadeGlass,
    roughness: 0.18,
    metalness: 0.55,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  });
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(3.4, height, 3.4), glassMat);
  shaft.position.y = 1.2 + height / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // Part 3: Vertical structural corner mullions
  const mullionMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.32,
    metalness: 0.78,
  });
  const mullionGeo = new THREE.BoxGeometry(0.24, height + 0.15, 0.24);
  const corners: [number, number][] = [
    [-1.68, -1.68],
    [1.68, -1.68],
    [-1.68, 1.68],
    [1.68, 1.68],
  ];
  for (const [cx, cz] of corners) {
    const mullion = new THREE.Mesh(mullionGeo, mullionMat);
    mullion.position.set(cx, 1.2 + height / 2, cz);
    group.add(mullion);
  }

  // Part 4: Rooftop crown fascia
  const crownMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    roughness: 0.38,
    metalness: 0.45,
  });
  const crown = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.45, 3.65), crownMat);
  crown.position.y = 1.2 + height + 0.22;
  crown.castShadow = true;
  group.add(crown);

  // Part 5: Mechanical penthouse
  const pent = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 1.8), podiumMat);
  pent.position.y = 1.2 + height + 0.85;
  group.add(pent);

  // Part 6: Communication spire
  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.88,
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 2.1, 8), spireMat);
  spire.position.y = 1.2 + height + 2.25;
  group.add(spire);

  return group;
}

/**
 * 3. Composite Tower Construction Crane (8 distinct parts, with rotating jib ref)
 */
export function createCraneGroup(): { group: THREE.Group; jibPivot: THREE.Group } {
  const group = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const steelYellowMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.35,
    metalness: 0.65,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.8,
  });

  // Part 1: Concrete ballast footing
  const pad = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 2.2), concreteMat);
  pad.position.y = 0.225;
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);

  // Part 2: Mast vertical tower
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.65, 9.2, 0.65), steelYellowMat);
  mast.position.y = 4.85;
  mast.castShadow = true;
  group.add(mast);

  // Part 3: Slewing collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12), darkMetalMat);
  collar.position.y = 9.55;
  group.add(collar);

  // Jib pivot for smooth rotation animation
  const jibPivot = new THREE.Group();
  jibPivot.position.y = 9.85;
  group.add(jibPivot);

  // Part 4: Operator cab
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.05, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 }),
  );
  cab.position.set(0.65, 0.15, 0.45);
  jibPivot.add(cab);

  // Part 5: Main horizontal jib arm
  const jib = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.42, 0.48), steelYellowMat);
  jib.position.set(2.4, 0.55, 0);
  jib.castShadow = true;
  jibPivot.add(jib);

  // Part 6: Counterweight blocks
  const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.85), concreteMat);
  counterWeight.position.set(-2.3, 0.45, 0);
  jibPivot.add(counterWeight);

  // Part 7: Top cathead apex + tension cables
  const apex = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 4), steelYellowMat);
  apex.position.set(0, 1.45, 0);
  apex.rotation.y = Math.PI / 4;
  jibPivot.add(apex);

  // Part 8: Trolley & suspended cable hook
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), darkMetalMat);
  trolley.position.set(5.2, 0.25, 0);
  jibPivot.add(trolley);

  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6), darkMetalMat);
  cable.position.set(5.2, -1.45, 0);
  jibPivot.add(cable);

  const hookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), steelYellowMat);
  hookBlock.position.set(5.2, -3.1, 0);
  jibPivot.add(hookBlock);

  return { group, jibPivot };
}

/**
 * 4. Composite Sedan Vehicle (6 distinct parts, bottom-center pivot)
 */
export function createCarGroup(bodyColorHex: number): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColorHex,
    roughness: 0.25,
    metalness: 0.45,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.3,
    clearcoat: 1.0,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.88,
    metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Part 1: Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 2.35), bodyMat);
  chassis.position.y = 0.36;
  chassis.castShadow = true;
  group.add(chassis);

  // Part 2: Upper cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.38, 1.25), glassMat);
  cabin.position.set(0, 0.74, -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Part 3: Headlights & taillights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });
  for (const xOff of [-0.38, 0.38]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), headMat);
    hl.position.set(xOff, 0.38, 1.18);
    group.add(hl);
  }

  // Part 4–7: 4 Wheels + alloy rims
  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.17, 10);
  rimGeo.rotateZ(Math.PI / 2);

  const wheelPos: [number, number][] = [
    [-0.58, 0.72],
    [0.58, 0.72],
    [-0.58, -0.72],
    [0.58, -0.72],
  ];
  for (const [wx, wz] of wheelPos) {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(wx, 0.22, wz);
    group.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(wx, 0.22, wz);
    group.add(rim);
  }

  return group;
}

/**
 * 5. Composite River Bridge + Hydrological Water-Level Gauge Pole
 */
export function createBridgeGroup(textures: ProceduralTextureSet): THREE.Group {
  const group = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.8,
    metalness: 0.08,
  });
  const deckMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.85,
    metalness: 0.05,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.72,
  });

  // Part 1: Bridge road deck spanning river (X from -7.5 to +7.5)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.48, 4.4), deckMat);
  deck.position.y = 4.05;
  deck.rotation.y = Math.PI / 2; // Align lane stripes along bridge span
  // Actually let's keep deck unrotated and orient UV or just clean concrete deck + curb
  deck.rotation.y = 0;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Part 2: Structural bridge girder underneath
  const girder = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.55, 3.6), concreteMat);
  girder.position.y = 3.58;
  girder.castShadow = true;
  group.add(girder);

  // Part 3 & 4: Two concrete support piers anchored into riverbed
  for (const xOff of [-4.2, 4.2]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.0, 3.4), concreteMat);
    pier.position.set(xOff, 1.8, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
  }

  // Part 5 & 6: Guardrails along both bridge edges
  for (const zOff of [-2.05, 2.05]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.55, 0.18), railMat);
    rail.position.set(0, 4.55, zOff);
    rail.castShadow = true;
    group.add(rail);
  }

  // Part 7: Streetlamps on bridge
  const lampPostGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 0.8,
  });
  for (const xOff of [-3.5, 3.5]) {
    const post = new THREE.Mesh(lampPostGeo, railMat);
    post.position.set(xOff, 5.6, -2.0);
    group.add(post);

    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.28), bulbMat);
    lampHead.position.set(xOff, 6.9, -1.85);
    group.add(lampHead);
  }

  // Part 8: Hydrological Water-Level Gauge Pole next to bridge pier (y=0m to y=5m)
  const gaugeMat = new THREE.MeshStandardMaterial({
    map: textures.waterGauge,
    roughness: 0.45,
    metalness: 0.1,
  });
  const gaugePole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 5.0, 0.32), gaugeMat);
  gaugePole.position.set(-2.6, 2.5, 2.55);
  gaugePole.castShadow = true;
  group.add(gaugePole);

  return group;
}

/**
 * 6. Composite Storm Drain / Longkang Monsun Cutaway + Trash Debris Group
 */
export function createStormDrainGroup(): {
  group: THREE.Group;
  debrisGroup: THREE.Group;
  drainWaterMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
    metalness: 0.06,
  });
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.82,
  });

  // Left & right U-channel walls + base slab
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 16.0), concreteMat);
  base.position.y = 0.1;
  base.receiveShadow = true;
  group.add(base);

  for (const xOff of [-0.95, 0.95]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 16.0), concreteMat);
    wall.position.set(xOff, 0.65, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  }

  // Metal trash-screen grating bars across culvert mouth
  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6), grateMat);
    bar.position.set(i * 0.24, 0.65, 6.2);
    group.add(bar);
  }

  // Animated drain water channel inside culvert
  const drainWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  });
  const drainWaterMesh = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.45, 15.8), drainWaterMat);
  drainWaterMesh.position.y = 0.42;
  group.add(drainWaterMesh);

  // Trash / Silt debris pile that clogs the drain when drainClearing = false
  const debrisGroup = new THREE.Group();
  const trashColors = [0xd97706, 0xef4444, 0xf8fafc, 0x78350f, 0x65a30d];
  for (let i = 0; i < 18; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: trashColors[i % trashColors.length],
      roughness: 0.75,
      metalness: 0.05,
    });
    const piece = new THREE.Mesh(
      i % 2 === 0
        ? new THREE.DodecahedronGeometry(0.22 + (i % 3) * 0.06, 0)
        : new THREE.BoxGeometry(0.36, 0.22, 0.28),
      mat,
    );
    piece.position.set(
      ((i % 5) - 2) * 0.28,
      0.32 + (i % 3) * 0.16,
      5.4 - Math.floor(i / 4) * 1.1 + (i % 2) * 0.3,
    );
    piece.rotation.set(i * 0.5, i * 0.8, 0);
    debrisGroup.add(piece);
  }
  group.add(debrisGroup);

  return { group, debrisGroup, drainWaterMesh };
}

/**
 * 7. Interactive 3D Station Beacon (Hover/Click Hotspot Marker)
 */
export function createStationBeacon(numberLabel: string): {
  group: THREE.Group;
  hitProxy: THREE.Mesh;
  diamond: THREE.Mesh;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Vertical slender stem anchored at bottom-center
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.3,
    metalness: 0.75,
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), stemMat);
  stem.position.y = 1.1;
  group.add(stem);

  // Base pad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 16), stemMat);
  pad.position.y = 0.06;
  group.add(pad);

  // Glowing rotating diamond crystal
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.15,
    metalness: 0.2,
    clearcoat: 1.0,
  });
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), diamondMat);
  diamond.position.y = 2.75;
  group.add(diamond);

  // Orbiting halo ring
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.5,
    roughness: 0.25,
    metalness: 0.7,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.055, 8, 28), ringMat);
  ring.position.y = 2.75;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Canvas badge sprite with station number ("01".."05")
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 128;
  badgeCanvas.height = 128;
  const ctx = badgeCanvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numberLabel, 64, 66);

  const spriteTex = new THREE.CanvasTexture(badgeCanvas);
  spriteTex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: spriteTex, depthTest: false, transparent: true }),
  );
  sprite.position.y = 4.0;
  sprite.scale.set(1.35, 1.35, 1);
  sprite.renderOrder = 20;
  group.add(sprite);

  // Simplified invisible collision proxy for crisp raycasting (Layer 1)
  const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 4.8, 10),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitProxy.position.y = 2.4;
  hitProxy.layers.set(1);
  group.add(hitProxy);

  return { group, hitProxy, diamond, ring };
}
