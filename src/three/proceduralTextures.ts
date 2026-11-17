import * as THREE from 'three';

export interface ProceduralTextureSet {
  asphalt: THREE.CanvasTexture;
  permeablePaver: THREE.CanvasTexture;
  facadeWarm: THREE.CanvasTexture;
  facadeGlass: THREE.CanvasTexture;
  waterGauge: THREE.CanvasTexture;
  terrainBump: THREE.CanvasTexture;
  waterNormal: THREE.DataTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Urban Asphalt Texture with Center Dashed Line
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 256;
  asphaltCanvas.height = 256;
  const actx = asphaltCanvas.getContext('2d')!;
  actx.fillStyle = '#2d333d';
  actx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 38 + Math.floor(Math.random() * 28);
    actx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    actx.fillRect(x, y, 2, 2);
  }
  actx.fillStyle = '#d1d5db';
  actx.fillRect(10, 0, 5, 256);
  actx.fillRect(241, 0, 5, 256);
  actx.fillStyle = '#facc15';
  for (let y = 12; y < 256; y += 64) {
    actx.fillRect(125, y, 6, 34);
  }
  const asphalt = new THREE.CanvasTexture(asphaltCanvas);
  asphalt.colorSpace = THREE.SRGBColorSpace;
  asphalt.wrapS = THREE.RepeatWrapping;
  asphalt.wrapT = THREE.RepeatWrapping;
  asphalt.repeat.set(1, 6);
  asphalt.anisotropy = maxAnisotropy;

  // 2. Permeable Paver Texture (Porous eco-grid with grass joints)
  const paverCanvas = document.createElement('canvas');
  paverCanvas.width = 256;
  paverCanvas.height = 256;
  const pctx = paverCanvas.getContext('2d')!;
  pctx.fillStyle = '#3c6e47';
  pctx.fillRect(0, 0, 256, 256);
  const cols = 8;
  const rows = 8;
  const cw = 256 / cols;
  const ch = 256 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 148 + ((r + c) % 3) * 12;
      pctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 8})`;
      pctx.fillRect(c * cw + 3, r * ch + 3, cw - 6, ch - 6);
      pctx.fillStyle = '#3f7a4b';
      pctx.fillRect(c * cw + cw * 0.35, r * ch + ch * 0.35, cw * 0.3, ch * 0.3);
    }
  }
  const permeablePaver = new THREE.CanvasTexture(paverCanvas);
  permeablePaver.colorSpace = THREE.SRGBColorSpace;
  permeablePaver.wrapS = THREE.RepeatWrapping;
  permeablePaver.wrapT = THREE.RepeatWrapping;
  permeablePaver.repeat.set(3, 10);
  permeablePaver.anisotropy = maxAnisotropy;

  // 3. Residential/Commercial Warm Facade Texture
  const fwCanvas = document.createElement('canvas');
  fwCanvas.width = 256;
  fwCanvas.height = 256;
  const fctx = fwCanvas.getContext('2d')!;
  fctx.fillStyle = '#e5dfd5';
  fctx.fillRect(0, 0, 256, 256);
  for (let y = 20; y < 236; y += 56) {
    for (let x = 22; x < 234; x += 56) {
      fctx.fillStyle = '#334155';
      fctx.fillRect(x, y, 34, 36);
      fctx.fillStyle = '#93c5fd';
      fctx.fillRect(x + 3, y + 3, 28, 30);
      fctx.fillStyle = 'rgba(255,255,255,0.28)';
      fctx.fillRect(x + 5, y + 5, 10, 26);
    }
  }
  const facadeWarm = new THREE.CanvasTexture(fwCanvas);
  facadeWarm.colorSpace = THREE.SRGBColorSpace;
  facadeWarm.wrapS = THREE.RepeatWrapping;
  facadeWarm.wrapT = THREE.RepeatWrapping;
  facadeWarm.anisotropy = maxAnisotropy;

  // 4. Modern Glass Tower Curtain-Wall Texture
  const fgCanvas = document.createElement('canvas');
  fgCanvas.width = 256;
  fgCanvas.height = 256;
  const gctx = fgCanvas.getContext('2d')!;
  gctx.fillStyle = '#1e293b';
  gctx.fillRect(0, 0, 256, 256);
  for (let y = 8; y < 252; y += 32) {
    for (let x = 8; x < 252; x += 32) {
      const lit = Math.random() > 0.68;
      gctx.fillStyle = lit ? '#bae6fd' : '#38bdf8';
      gctx.globalAlpha = lit ? 0.85 : 0.45;
      gctx.fillRect(x, y, 24, 24);
    }
  }
  gctx.globalAlpha = 1;
  const facadeGlass = new THREE.CanvasTexture(fgCanvas);
  facadeGlass.colorSpace = THREE.SRGBColorSpace;
  facadeGlass.wrapS = THREE.RepeatWrapping;
  facadeGlass.wrapT = THREE.RepeatWrapping;
  facadeGlass.anisotropy = maxAnisotropy;

  // 5. Hydrological Water-Level Gauge Pole Texture (1m to 5m with 3.5m Danger Line)
  const wgCanvas = document.createElement('canvas');
  wgCanvas.width = 128;
  wgCanvas.height = 512;
  const wctx = wgCanvas.getContext('2d')!;
  wctx.fillStyle = '#f8fafc';
  wctx.fillRect(0, 0, 128, 512);
  // Danger zone top (3.5m - 5m)
  wctx.fillStyle = '#dc2626';
  wctx.fillRect(0, 0, 28, 192);
  // Caution zone (2.5m - 3.5m)
  wctx.fillStyle = '#f59e0b';
  wctx.fillRect(0, 192, 28, 128);
  // Normal zone (0m - 2.5m)
  wctx.fillStyle = '#059669';
  wctx.fillRect(0, 320, 28, 192);

  wctx.fillStyle = '#0f172a';
  wctx.font = 'bold 26px monospace';
  const labels = ['5m', '4m', '3.5', '3m', '2m', '1m'];
  const yPos = [34, 134, 192, 244, 344, 444];
  for (let i = 0; i < labels.length; i++) {
    wctx.fillRect(28, yPos[i] - 4, 26, 4);
    wctx.fillText(labels[i], 58, yPos[i] + 6);
  }
  const waterGauge = new THREE.CanvasTexture(wgCanvas);
  waterGauge.colorSpace = THREE.SRGBColorSpace;
  waterGauge.anisotropy = maxAnisotropy;

  // 6. Terrain Organic Bump Map (Linear space)
  const tbCanvas = document.createElement('canvas');
  tbCanvas.width = 256;
  tbCanvas.height = 256;
  const bctx = tbCanvas.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const v = 90 + Math.floor(Math.random() * 80);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const terrainBump = new THREE.CanvasTexture(tbCanvas);
  terrainBump.wrapS = THREE.RepeatWrapping;
  terrainBump.wrapT = THREE.RepeatWrapping;
  terrainBump.repeat.set(16, 16);

  // 7. Procedural Water Ripple Normal Map (Linear space)
  const wnSize = 256;
  const wnData = new Uint8Array(wnSize * wnSize * 4);
  for (let y = 0; y < wnSize; y++) {
    for (let x = 0; x < wnSize; x++) {
      const u = (x / wnSize) * Math.PI * 2;
      const v = (y / wnSize) * Math.PI * 2;
      const dx =
        Math.cos(u * 4 + v * 2) * 0.4 + Math.cos(u * 7 - v * 5) * 0.25;
      const dy =
        Math.sin(v * 5 + u * 3) * 0.4 + Math.sin(v * 8 + u * 4) * 0.25;
      const idx = (y * wnSize + x) * 4;
      wnData[idx] = Math.floor((dx * 0.5 + 0.5) * 255);
      wnData[idx + 1] = Math.floor((dy * 0.5 + 0.5) * 255);
      wnData[idx + 2] = 240;
      wnData[idx + 3] = 255;
    }
  }
  const waterNormal = new THREE.DataTexture(wnData, wnSize, wnSize, THREE.RGBAFormat);
  waterNormal.wrapS = THREE.RepeatWrapping;
  waterNormal.wrapT = THREE.RepeatWrapping;
  waterNormal.repeat.set(6, 14);
  waterNormal.needsUpdate = true;

  return {
    asphalt,
    permeablePaver,
    facadeWarm,
    facadeGlass,
    waterGauge,
    terrainBump,
    waterNormal,
    dispose: () => {
      asphalt.dispose();
      permeablePaver.dispose();
      facadeWarm.dispose();
      facadeGlass.dispose();
      waterGauge.dispose();
      terrainBump.dispose();
      waterNormal.dispose();
    },
  };
}
