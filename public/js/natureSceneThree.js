// FramerTool — 3D Nature Ambient Diorama (img2threejs methodology)
// Two independent Three.js scenes:
//   1. SkyCloudScene  — atmospheric sky dome + volumetric puffy clouds (behind modules)
//   2. MeadowScene    — rolling grassy hills, macro daisies, wildflowers, pollen (before footer)
// Zero external assets. 100% procedural geometry & PBR materials.

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ═══════════════════════════════════════════════════════════════════════════════
//  1. SKY + CLOUD SCENE
// ═══════════════════════════════════════════════════════════════════════════════

export class SkyCloudScene {
  constructor() {
    this.container = document.getElementById('sky-section');
    this.canvas    = document.getElementById('sky-canvas');
    if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

    this.clouds = [];
    this.mouse  = { x: 0, y: 0 };
    this._init();
  }

  _init() {
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera — wide FOV for a panoramic sky feel
    this.camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    this.camera.position.set(0, 2, 12);
    this.camera.lookAt(0, 3, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, alpha: true, antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(W, H, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xe0f2fe, 1.0));
    const sun = new THREE.DirectionalLight(0xfff7ed, 2.0);
    sun.position.set(-6, 10, 4);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xfef08a, 0.8);
    rim.position.set(5, 3, -6);
    this.scene.add(rim);

    // Sky Dome
    this._buildSkyDome();

    // Clouds
    this._buildClouds();

    // Events
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => this._onResize());

    this.clock = new THREE.Clock();
    this._animate();
  }

  _buildSkyDome() {
    const geo = new THREE.SphereGeometry(80, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const colors = new Float32Array(geo.attributes.position.count * 3);

    const cZenith  = new THREE.Color(0x7dd3fc); // light blue
    const cMid     = new THREE.Color(0xbae6fd);
    const cHorizon = new THREE.Color(0xfef3c7); // warm peach

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ny = clamp(pos.getY(i) / 80, 0, 1);
      const c = new THREE.Color();
      if (ny > 0.35) c.lerpColors(cMid, cZenith, (ny - 0.35) / 0.65);
      else           c.lerpColors(cHorizon, cMid, ny / 0.35);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -5;
    this.scene.add(mesh);
  }

  _buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.6, metalness: 0,
      transparent: true, opacity: 0.92,
    });

    const configs = [
      { x: -10, y: 7.5, z: -18, s: 3.0, sx: 1.6, sy: 0.65, speed: 0.12 },
      { x:   5, y: 8.5, z: -22, s: 4.2, sx: 1.7, sy: 0.55, speed: 0.08 },
      { x:  -2, y: 9.8, z: -30, s: 5.5, sx: 1.8, sy: 0.5, speed: 0.05 },
      { x:  14, y: 7.0, z: -16, s: 2.8, sx: 1.5, sy: 0.6, speed: 0.10 },
      { x: -16, y: 8.0, z: -24, s: 3.5, sx: 1.4, sy: 0.7, speed: 0.07 },
      { x:   8, y: 10,  z: -35, s: 4.0, sx: 1.9, sy: 0.45, speed: 0.04 },
    ];

    configs.forEach(cfg => {
      const group = new THREE.Group();

      // Each cloud = cluster of 5-8 soft spheres
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const r = 0.6 + Math.random() * 0.6;
        const geo = new THREE.SphereGeometry(r, 12, 10);
        const m = new THREE.Mesh(geo, cloudMat);
        m.position.set(
          (Math.random() - 0.5) * 2.4,
          (Math.random() - 0.3) * 0.9,
          (Math.random() - 0.5) * 1.2
        );
        m.scale.set(1, 0.6 + Math.random() * 0.3, 0.8);
        group.add(m);
      }

      group.position.set(cfg.x, cfg.y, cfg.z);
      group.scale.set(cfg.s * cfg.sx, cfg.s * cfg.sy, cfg.s);
      group.userData = { speed: cfg.speed, baseX: cfg.x };
      this.clouds.push(group);
      this.scene.add(group);
    });
  }

  _onResize() {
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H, false);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const t = this.clock.getElapsedTime();

    // Gentle camera parallax
    this.camera.position.x = this.mouse.x * 0.8;
    this.camera.position.y = 2 + this.mouse.y * 0.4;
    this.camera.lookAt(this.mouse.x * 0.3, 3.5, -5);

    // Cloud drift
    this.clouds.forEach(c => {
      c.position.x += c.userData.speed * 0.016;
      if (c.position.x > 28) c.position.x = -28;
      c.position.y += Math.sin(t * 0.5 + c.userData.baseX) * 0.002;
    });

    this.renderer.render(this.scene, this.camera);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
//  2. MEADOW + FLOWER SCENE
// ═══════════════════════════════════════════════════════════════════════════════

export class MeadowScene {
  constructor() {
    this.container = document.getElementById('meadow-section');
    this.canvas    = document.getElementById('meadow-canvas');
    if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

    this.daisies = [];
    this.mouse   = { x: 0, y: 0 };
    this._init();
  }

  _init() {
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd9f99d, 0.022); // Soft green haze

    // Camera — low angle looking across the meadow (macro perspective from reference)
    this.camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 120);
    this.camera.position.set(0, 0.9, 7);
    this.camera.lookAt(0, 0.6, -2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, alpha: true, antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(W, H, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this._buildLighting();
    this._buildTerrain();
    this._buildForegroundDaisies();
    this._buildScatteredFlowers();
    this._buildPollen();

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => this._onResize());

    this.clock = new THREE.Clock();
    this._animate();
  }

  // ── Lighting ──────────────────────────────────────────────────────────────
  _buildLighting() {
    // Sky ambient
    this.scene.add(new THREE.AmbientLight(0xecfccb, 1.1));

    // Warm golden sun from upper-left-back
    const sun = new THREE.DirectionalLight(0xfff7ed, 2.6);
    sun.position.set(-6, 10, 4);
    this.scene.add(sun);

    // Golden-hour rim backlight
    const rim = new THREE.DirectionalLight(0xfef08a, 1.4);
    rim.position.set(4, 4, -6);
    this.scene.add(rim);

    // Ground bounce (grass reflection)
    const bounce = new THREE.PointLight(0xa3e635, 0.8, 20);
    bounce.position.set(0, -2, 3);
    this.scene.add(bounce);
  }

  // ── Rolling Hills Terrain ─────────────────────────────────────────────────
  _buildTerrain() {
    const W = 40, D = 32, segX = 100, segZ = 80;
    const geo = new THREE.PlaneGeometry(W, D, segX, segZ);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cSunny = new THREE.Color(0xa3e635); // Bright lime hilltop
    const cGrass = new THREE.Color(0x4ade80); // Spring green
    const cDeep  = new THREE.Color(0x166534); // Deep valley green

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // depth axis in plane-local

      // Central mound
      const dc = Math.sqrt(x * x + (y + 3) * (y + 3));
      const mound = 3.0 * Math.exp(-(dc * dc) / 18);

      // Flanking hills
      const lHill = 3.5 * Math.exp(-((x + 9) * (x + 9)) / 30) * (0.8 + 0.2 * Math.sin(y * 0.3));
      const rHill = 4.0 * Math.exp(-((x - 9) * (x - 9)) / 35) * (0.8 + 0.2 * Math.cos(y * 0.25));

      // Far background hills
      const far = Math.max(0, (y - 4) / 10) * Math.sin(x * 0.25 + 1) * 1.8;

      // Micro bumps
      const micro = Math.sin(x * 1.8) * Math.cos(y * 1.8) * 0.08;

      const z = mound + lHill + rHill + far + micro;
      pos.setZ(i, z);

      // Vertex color by elevation
      const nz = clamp(z / 4.5, 0, 1);
      const c = new THREE.Color();
      if (nz > 0.5)      c.lerpColors(cGrass, cSunny, (nz - 0.5) / 0.5);
      else if (nz > 0.15) c.lerpColors(cDeep, cGrass, (nz - 0.15) / 0.35);
      else                c.lerpColors(cDeep, cDeep, 1);

      colors[i * 3] = c.r;  colors[i * 3 + 1] = c.g;  colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.7, metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2 + 0.18;
    mesh.position.set(0, -2.8, -5);
    this.scene.add(mesh);
  }

  // ── Foreground Macro Daisies (Hero Close-ups) ─────────────────────────────
  _buildForegroundDaisies() {
    const positions = [
      { x:  2.8, y: -1.3, z: 5.2, s: 0.85, ry: -0.4 },
      { x: -2.5, y: -1.4, z: 5.0, s: 0.80, ry:  0.3 },
      { x:  0.5, y: -1.6, z: 4.5, s: 0.70, ry: -0.15 },
      { x: -1.2, y: -1.5, z: 4.8, s: 0.75, ry:  0.2 },
      { x:  1.8, y: -1.7, z: 4.2, s: 0.65, ry: -0.25 },
      { x: -0.3, y: -1.8, z: 3.8, s: 0.55, ry:  0.1 },
    ];

    positions.forEach((cfg, idx) => {
      const d = this._makeDaisy(cfg.s);
      d.position.set(cfg.x, cfg.y, cfg.z);
      d.rotation.set(-0.2, cfg.ry, 0);
      d.userData.idx = idx;
      d.userData.swaySpeed = 1.0 + Math.random() * 0.8;
      d.userData.swayPhase = Math.random() * Math.PI * 2;
      this.daisies.push(d);
      this.scene.add(d);
    });
  }

  // ── Macro Daisy Model (img2threejs) ───────────────────────────────────────
  _makeDaisy(scale = 1) {
    const g = new THREE.Group();

    // Golden pollen center — hemisphere dome
    const centerGeo = new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    centerGeo.scale(1, 0.6, 1);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.2,
      roughness: 0.5, metalness: 0.05,
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.rotation.x = Math.PI / 2;
    center.position.z = 0.06;
    g.add(center);

    // Seed ring texture detail
    const ringGeo = new THREE.TorusGeometry(0.30, 0.05, 8, 20);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.1;
    g.add(ring);

    // White petals (12-14 teardrop shapes)
    const petalCount = 12 + Math.floor(Math.random() * 3);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.2, metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // Petal shape via ExtrudeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo( 0.22, 0.35,  0.28, 0.85, 0, 1.15);
    shape.bezierCurveTo(-0.28, 0.85, -0.22, 0.35, 0, 0);

    const petalGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025, bevelEnabled: true,
      bevelSize: 0.015, bevelThickness: 0.012, bevelSegments: 2,
    });
    petalGeo.translate(0, 0, -0.012);

    // Curl tip upward
    const pPos = petalGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const py = pPos.getY(i);
      if (py > 0.3) {
        pPos.setZ(i, pPos.getZ(i) + Math.pow(py / 1.15, 2.5) * 0.12);
      }
    }
    petalGeo.computeVertexNormals();

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const r = 0.32;
      petal.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      petal.rotation.z = angle - Math.PI / 2;
      petal.rotation.x = Math.cos(angle) * 0.12 + 0.1;
      petal.position.z += (i % 2) * 0.02;
      g.add(petal);
    }

    // Green calyx cone
    const calyxGeo = new THREE.ConeGeometry(0.35, 0.4, 12);
    calyxGeo.translate(0, -0.2, 0);
    const calyxMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
    const calyx = new THREE.Mesh(calyxGeo, calyxMat);
    calyx.rotation.x = -Math.PI / 2;
    calyx.position.z = -0.04;
    g.add(calyx);

    // Curved stem
    const stemPts = [
      new THREE.Vector3(0, 0, -0.15),
      new THREE.Vector3(0.04, -0.5, -0.6),
      new THREE.Vector3(-0.06, -1.2, -1.2),
      new THREE.Vector3(0.02, -2.2, -1.9),
    ];
    const stemCurve = new THREE.CatmullRomCurve3(stemPts);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.055 * scale, 8, false);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.45 });
    g.add(new THREE.Mesh(stemGeo, stemMat));

    g.scale.setScalar(scale);
    return g;
  }

  // ── Scattered Meadow Flowers ──────────────────────────────────────────────
  _buildScatteredFlowers() {
    const flowerConfigs = [
      // Small white daisies on central mound
      { x: 0, y: -0.4, z: 0.8, s: 0.30 },
      { x: -1, y: -0.5, z: 1.0, s: 0.28 },
      { x: 0.8, y: -0.45, z: 0.9, s: 0.32 },
      { x: -0.5, y: -0.6, z: 1.5, s: 0.25 },
      { x: 1.2, y: -0.55, z: 1.3, s: 0.27 },

      // Left slope
      { x: -3.5, y: 0.3, z: -2, s: 0.22 },
      { x: -4.5, y: 0.7, z: -4, s: 0.20 },

      // Right slope
      { x: 3.5, y: 0.3, z: -2.2, s: 0.22 },
      { x: 5, y: 0.8, z: -4.5, s: 0.18 },
    ];

    flowerConfigs.forEach(cfg => {
      const d = this._makeDaisy(cfg.s);
      d.position.set(cfg.x, cfg.y, cfg.z);
      d.rotation.set(-0.25 + Math.random() * 0.15, (Math.random() - 0.5) * 0.4, 0);
      this.scene.add(d);
    });

    // Colorful wildflowers (magenta, violet, pink)
    const wildColors = [0xec4899, 0xa855f7, 0xf472b6, 0x8b5cf6, 0xd946ef];
    const wildPositions = [
      { x: -0.6, y: -0.55, z: 1.2 },
      { x: 0.5, y: -0.5, z: 1.0 },
      { x: -2, y: -0.3, z: -0.5 },
      { x: 2.2, y: -0.25, z: -0.8 },
      { x: -3.2, y: 0.1, z: -1.5 },
      { x: 3.5, y: 0.15, z: -1.8 },
      { x: -1.5, y: -0.4, z: 0.5 },
      { x: 1.5, y: -0.35, z: 0.4 },
    ];

    wildPositions.forEach((p, i) => {
      const wf = this._makeWildflower(wildColors[i % wildColors.length], 0.2 + Math.random() * 0.15);
      wf.position.set(p.x, p.y, p.z);
      wf.rotation.set(-0.2, Math.random() * 1.5, 0);
      this.scene.add(wf);
    });
  }

  // ── Small Wildflower Model (5-petal round) ────────────────────────────────
  _makeWildflower(color, scale) {
    const g = new THREE.Group();

    // Center
    const cGeo = new THREE.SphereGeometry(0.14, 10, 8);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.25, roughness: 0.35,
    });
    g.add(new THREE.Mesh(cGeo, cMat));

    // 5 round petals
    const pGeo = new THREE.SphereGeometry(0.18, 10, 10);
    pGeo.scale(0.55, 1.2, 0.22);
    pGeo.translate(0, 0.22, 0);

    const pMat = new THREE.MeshStandardMaterial({
      color, roughness: 0.25, metalness: 0.05,
    });

    for (let i = 0; i < 5; i++) {
      const petal = new THREE.Mesh(pGeo, pMat);
      petal.rotation.z = (i / 5) * Math.PI * 2;
      petal.rotation.x = 0.12;
      g.add(petal);
    }

    // Tiny stem
    const sGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
    sGeo.translate(0, -0.3, 0);
    const sMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
    const s = new THREE.Mesh(sGeo, sMat);
    s.rotation.x = Math.PI / 2;
    g.add(s);

    g.scale.setScalar(scale);
    return g;
  }

  // ── Floating Pollen / Dandelion Seeds ─────────────────────────────────────
  _buildPollen() {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const speeds = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 8 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 + 1;
      speeds.push({
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.06 + Math.random() * 0.18,
        vz: (Math.random() - 0.5) * 0.1,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft glow particle texture
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(254,240,138,0.7)');
    grad.addColorStop(0.7, 'rgba(251,191,36,0.2)');
    grad.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.25, map: new THREE.CanvasTexture(c),
      transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    this.pollen = new THREE.Points(geo, mat);
    this.pollen.userData = { speeds, count };
    this.scene.add(this.pollen);
  }

  _onResize() {
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H, false);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const dt = this.clock.getDelta();
    const t  = this.clock.getElapsedTime();

    // Camera parallax
    this.camera.position.x = lerp(this.camera.position.x, this.mouse.x * 0.6, 0.04);
    this.camera.position.y = lerp(this.camera.position.y, 0.9 + this.mouse.y * 0.3, 0.04);
    this.camera.lookAt(this.mouse.x * 0.15, 0.5, -2);

    // Daisy wind sway + cursor influence
    this.daisies.forEach(d => {
      const u = d.userData;
      const sway = Math.sin(t * u.swaySpeed + u.swayPhase) * 0.04;
      const breeze = Math.cos(t * 0.9 + u.idx) * 0.03;
      d.rotation.x = -0.2 + sway + this.mouse.y * -0.08;
      d.rotation.z = breeze + this.mouse.x * 0.06;
    });

    // Pollen drift
    if (this.pollen) {
      const pos = this.pollen.geometry.attributes.position;
      const sp  = this.pollen.userData.speeds;
      for (let i = 0; i < this.pollen.userData.count; i++) {
        let px = pos.getX(i) + sp[i].vx * dt + Math.sin(t + i) * 0.002;
        let py = pos.getY(i) + sp[i].vy * dt;
        let pz = pos.getZ(i) + sp[i].vz * dt;
        if (py > 6) py = -2;
        if (px > 12) px = -12;
        if (px < -12) px = 12;
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function initNatureLandscapeScene() {
  const sky    = new SkyCloudScene();
  const meadow = new MeadowScene();
  return { sky, meadow };
}
