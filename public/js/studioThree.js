// FramerTool Media Studio — 3D Nature Ambient & Procedural 3D Icons (img2threejs)
// Enriched with vibrant colors: Golden Yellow, Sunset Red, Royal Purple & Meadow Emerald

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ============================================================================
// 1. STUDIO 3D NATURE AMBIENT BACKGROUND
// Floating golden pollen, colorful flower petals (yellow, red, purple, emerald)
// ============================================================================
export class StudioNatureAmbient {
  constructor() {
    this.canvas = document.getElementById('studio-ambient-canvas');
    if (!this.canvas || typeof THREE === 'undefined') return;

    this.mouse = { x: 0, y: 0 };
    this._init();
  }

  _init() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Warm Sun & Colorful Rim Lighting
    this.scene.add(new THREE.AmbientLight(0xffedd5, 1.4));
    const sun = new THREE.DirectionalLight(0xffedd5, 2.2);
    sun.position.set(5, 8, 5);
    this.scene.add(sun);

    const purpleRim = new THREE.DirectionalLight(0xc084fc, 1.8);
    purpleRim.position.set(-6, -4, -2);
    this.scene.add(purpleRim);

    const goldBounce = new THREE.PointLight(0xf59e0b, 1.5, 25);
    goldBounce.position.set(0, 4, 3);
    this.scene.add(goldBounce);

    // Build background floating pollen & vibrant natural elements
    this._buildPollen();
    this._buildFloatingPetals();

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    this.clock = new THREE.Clock();
    this._animate();
  }

  _buildPollen() {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const speeds = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1;
      speeds.push({
        vx: (Math.random() - 0.5) * 0.18,
        vy: 0.09 + Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.12,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
    grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.2)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      map: new THREE.CanvasTexture(c),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pollen = new THREE.Points(geo, mat);
    this.pollen.userData = { speeds, count };
    this.scene.add(this.pollen);
  }

  _buildFloatingPetals() {
    this.petals = [];
    // Vibrant nature palette: Sun Yellow, Coral Red, Royal Purple, Pink, Lime Emerald, Orange
    const petalColors = [0xfbbf24, 0xef4444, 0xa855f7, 0xec4899, 0x10b981, 0xf97316];

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.2, 0.3, 0.26, 0.6, 0, 0.85);
    shape.bezierCurveTo(-0.26, 0.6, -0.2, 0.3, 0, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });

    for (let i = 0; i < 26; i++) {
      const color = petalColors[i % petalColors.length];
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 8 - 2
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(0.4 + Math.random() * 0.45);
      mesh.userData = {
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        rotSpeedY: (Math.random() - 0.5) * 1.5,
        driftY: 0.08 + Math.random() * 0.12,
        driftX: (Math.random() - 0.5) * 0.1,
      };
      this.petals.push(mesh);
      this.scene.add(mesh);
    }
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const dt = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    // Smooth parallax
    this.camera.position.x = lerp(this.camera.position.x, this.mouse.x * 0.6, 0.03);
    this.camera.position.y = lerp(this.camera.position.y, this.mouse.y * 0.45, 0.03);
    this.camera.lookAt(0, 0, 0);

    // Drift pollen
    if (this.pollen) {
      const pos = this.pollen.geometry.attributes.position;
      const sp = this.pollen.userData.speeds;
      for (let i = 0; i < this.pollen.userData.count; i++) {
        let px = pos.getX(i) + sp[i].vx * dt + Math.sin(t * 0.6 + i) * 0.002;
        let py = pos.getY(i) + sp[i].vy * dt;
        let pz = pos.getZ(i) + sp[i].vz * dt;
        if (py > 11) py = -11;
        if (px > 15) px = -15;
        if (px < -15) px = 15;
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
    }

    // Drift petals
    this.petals.forEach((p) => {
      p.position.y += p.userData.driftY * dt;
      p.position.x += p.userData.driftX * dt + Math.sin(t + p.position.y) * 0.003;
      p.rotation.x += p.userData.rotSpeedX * dt;
      p.rotation.y += p.userData.rotSpeedY * dt;
      if (p.position.y > 12) p.position.y = -12;
      if (p.position.x > 14) p.position.x = -14;
      if (p.position.x < -14) p.position.x = 14;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// 2. PROCEDURAL 3D MINI ICONS & BADGES (img2threejs)
// ============================================================================

class MicroScene {
  constructor(canvas, buildFn, options = {}) {
    if (!canvas || typeof THREE === 'undefined') return;
    this.canvas = canvas;
    this.options = Object.assign({
      fov: 35,
      cameraZ: 3.5,
      autoRotate: true,
      rotateSpeed: 1.5,
      interactive: true,
    }, options);

    const width = canvas.clientWidth || canvas.width || 36;
    const height = canvas.clientHeight || canvas.height || 36;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.options.fov, width / height, 0.1, 50);
    this.camera.position.set(0, 0, this.options.cameraZ);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffedd5, 2.8);
    key.position.set(4, 5, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc084fc, 1.8);
    rim.position.set(-4, -2, -2);
    this.scene.add(rim);

    // Build model
    this.model = buildFn(this);
    if (this.model) this.scene.add(this.model);

    this.isHovered = false;
    this.targetScale = 1.0;
    this.currentScale = 1.0;

    if (this.options.interactive) {
      const parent = canvas.closest('button, a, .group, .card-3d-tilt') || canvas;
      parent.addEventListener('mouseenter', () => {
        this.isHovered = true;
        this.targetScale = 1.25;
      });
      parent.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.targetScale = 1.0;
      });
    }

    this.clock = new THREE.Clock();
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    this.currentScale = lerp(this.currentScale, this.targetScale, 0.12);
    if (this.model) {
      this.model.scale.setScalar(this.currentScale * (this.model.userData.baseScale || 1.0));

      if (this.options.autoRotate) {
        const speed = this.isHovered ? this.options.rotateSpeed * 2.5 : this.options.rotateSpeed;
        this.model.rotation.y += speed * dt;
        this.model.rotation.x = Math.sin(t * 1.5) * 0.12;
      }

      if (this.model.userData.update) {
        this.model.userData.update(t, dt, this.isHovered);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ----------------------------------------------------------------------------
// Model 1: 3D Mini Clapperboard (Amber & Sunset Orange with Red Accents)
// ----------------------------------------------------------------------------
export function createMiniClapperboard() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.95;

  const baseGeo = new THREE.BoxGeometry(1.4, 1.0, 0.2);
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    emissive: 0x451a03,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.8,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.2;
  g.add(base);

  const barGeo = new THREE.BoxGeometry(1.3, 0.24, 0.22);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, -0.05, 0.01);
  g.add(bar);

  const armGroup = new THREE.Group();
  armGroup.position.set(-0.7, 0.3, 0);

  const armGeo = new THREE.BoxGeometry(1.4, 0.24, 0.2);
  armGeo.translate(0.7, 0, 0);
  const armMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    clearcoat: 0.9,
  });
  const arm = new THREE.Mesh(armGeo, armMat);
  armGroup.add(arm);

  for (let i = 0; i < 4; i++) {
    const sGeo = new THREE.BoxGeometry(0.18, 0.25, 0.22);
    const sMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2 });
    const s = new THREE.Mesh(sGeo, sMat);
    s.position.set(0.25 + i * 0.3, 0, 0);
    armGroup.add(s);
  }

  g.add(armGroup);

  const pinGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.26, 12);
  pinGeo.rotateX(Math.PI / 2);
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.set(-0.65, 0.3, 0);
  g.add(pin);

  g.userData.update = (t, dt, isHovered) => {
    if (isHovered) {
      armGroup.rotation.z = Math.abs(Math.sin(t * 8)) * 0.45;
    } else {
      armGroup.rotation.z = 0.15 + Math.sin(t * 2) * 0.06;
    }
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 2: 3D Mini Holographic AI Scissors (Royal Purple, Fuchsia & Rose)
// ----------------------------------------------------------------------------
export function createMiniScissors() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.9;

  const bladeMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdf4ff,
    metalness: 0.95,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const handleMat = new THREE.MeshPhysicalMaterial({
    color: 0x9333ea,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    clearcoat: 1.0,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xf472b6),
  });

  const leftGroup = new THREE.Group();
  const b1Geo = new THREE.ConeGeometry(0.18, 1.4, 4);
  b1Geo.scale(0.3, 1, 0.15);
  b1Geo.translate(0, 0.7, 0);
  const b1 = new THREE.Mesh(b1Geo, bladeMat);
  leftGroup.add(b1);

  const r1Geo = new THREE.TorusGeometry(0.24, 0.08, 12, 20);
  r1Geo.translate(0, -0.4, 0);
  const r1 = new THREE.Mesh(r1Geo, handleMat);
  leftGroup.add(r1);

  const rightGroup = new THREE.Group();
  const b2Geo = b1Geo.clone();
  const b2 = new THREE.Mesh(b2Geo, bladeMat);
  rightGroup.add(b2);

  const r2Geo = r1Geo.clone();
  const r2 = new THREE.Mesh(r2Geo, handleMat);
  rightGroup.add(r2);

  g.add(leftGroup);
  g.add(rightGroup);

  const rivetGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12);
  rivetGeo.rotateX(Math.PI / 2);
  const rivetMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.8, roughness: 0.2 });
  g.add(new THREE.Mesh(rivetGeo, rivetMat));

  const sparkGeo = new THREE.OctahedronGeometry(0.2, 0);
  const sparkMat = new THREE.MeshPhysicalMaterial({
    color: 0xec4899,
    emissive: 0xdb2777,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    transmission: 0.5,
    clearcoat: 1.0,
  });
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.position.set(0.6, 0.6, 0.2);
  g.add(spark);

  g.userData.update = (t, dt, isHovered) => {
    const angle = isHovered ? Math.sin(t * 10) * 0.45 : 0.25 + Math.sin(t * 2) * 0.08;
    leftGroup.rotation.z = angle;
    rightGroup.rotation.z = -angle;
    spark.rotation.y += 2.5 * dt;
    spark.position.y = 0.6 + Math.sin(t * 3) * 0.12;
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 3: 3D Mini Curled PDF Sheet (Vibrant Emerald & Golden Ribbon)
// ----------------------------------------------------------------------------
export function createMiniCurledDoc() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.95;

  const geo = new THREE.PlaneGeometry(1.2, 1.6, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x > 0.1 && y > 0.2) {
      const factor = (x - 0.1) * (y - 0.2);
      pos.setZ(i, Math.pow(factor, 1.8) * 1.6);
    }
  }
  geo.computeVertexNormals();

  const paperMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.02,
    clearcoat: 0.6,
    side: THREE.DoubleSide,
  });
  const paper = new THREE.Mesh(geo, paperMat);
  g.add(paper);

  const headerGeo = new THREE.BoxGeometry(0.9, 0.2, 0.03);
  const headerMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  const header = new THREE.Mesh(headerGeo, headerMat);
  header.position.set(-0.05, 0.5, 0.02);
  g.add(header);

  for (let i = 0; i < 4; i++) {
    const lineGeo = new THREE.BoxGeometry(0.8 - i * 0.1, 0.06, 0.02);
    const lineMat = new THREE.MeshStandardMaterial({
      color: i === 0 ? 0xf59e0b : 0x64748b,
      roughness: 0.4,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(-0.1, 0.2 - i * 0.18, 0.02);
    g.add(line);
  }

  const ribbonGeo = new THREE.BoxGeometry(0.18, 0.65, 0.04);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0.35, -0.65, 0.03);
  g.add(ribbon);

  g.userData.update = (t, dt, isHovered) => {
    paper.rotation.y = Math.sin(t * 1.5) * 0.12;
    if (isHovered) {
      g.rotation.z = Math.sin(t * 4) * 0.1;
    } else {
      g.rotation.z = 0;
    }
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 4: 3D Golden Macro Daisy (Flower Badge)
// ----------------------------------------------------------------------------
export function createMiniDaisyBadge() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.95;

  const centerGeo = new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  centerGeo.scale(1, 0.55, 1);
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.rotation.x = Math.PI / 2;
  g.add(center);

  const petalCount = 10;
  const pShape = new THREE.Shape();
  pShape.moveTo(0, 0);
  pShape.bezierCurveTo(0.18, 0.25, 0.22, 0.65, 0, 0.9);
  pShape.bezierCurveTo(-0.22, 0.65, -0.18, 0.25, 0, 0);

  const pGeo = new THREE.ExtrudeGeometry(pShape, { depth: 0.025, bevelEnabled: false });
  const pMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.15,
    clearcoat: 0.8,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(pGeo, pMat);
    petal.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
    petal.rotation.z = angle - Math.PI / 2;
    petal.rotation.x = 0.12;
    g.add(petal);
  }

  g.userData.update = (t, dt, isHovered) => {
    g.rotation.z += (isHovered ? 3.0 : 1.0) * dt;
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 5: 3D Glowing Energy Crystal / Lightning Gem (Amber / Red)
// ----------------------------------------------------------------------------
export function createMiniZapGem() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.9;

  const geo = new THREE.OctahedronGeometry(0.7, 0);
  geo.scale(0.8, 1.4, 0.8);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    emissive: 0xea580c,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.4,
    clearcoat: 1.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  g.add(mesh);

  const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  g.add(ring);

  g.userData.update = (t, dt) => {
    ring.rotation.z += 1.8 * dt;
    mesh.rotation.y += 1.4 * dt;
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 6: 3D Magic Prism / Diamond (Vivid Royal Purple & Magenta)
// ----------------------------------------------------------------------------
export function createMiniPrism() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.9;

  const geo = new THREE.IcosahedronGeometry(0.65, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 0.5,
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.55,
    clearcoat: 1.0,
    ior: 1.7,
  });
  const mesh = new THREE.Mesh(geo, mat);
  g.add(mesh);

  g.userData.update = (t, dt) => {
    mesh.rotation.x += 1.2 * dt;
    mesh.rotation.y += 1.6 * dt;
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 7: 3D Magnifying Lens (Emerald & Gold)
// ----------------------------------------------------------------------------
export function createMiniLens() {
  const g = new THREE.Group();
  g.userData.baseScale = 0.85;

  const rimGeo = new THREE.TorusGeometry(0.52, 0.09, 12, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.15 });
  g.add(new THREE.Mesh(rimGeo, rimMat));

  const glassGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24);
  glassGeo.rotateX(Math.PI / 2);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    transmission: 0.75,
    roughness: 0.05,
    ior: 1.55,
  });
  g.add(new THREE.Mesh(glassGeo, glassMat));

  const handleGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.65, 12);
  handleGeo.translate(0, -0.65, 0);
  handleGeo.rotateZ(-Math.PI / 4);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3 });
  g.add(new THREE.Mesh(handleGeo, handleMat));

  g.userData.update = (t, dt) => {
    g.rotation.y = Math.sin(t * 2) * 0.35;
  };

  return g;
}

// ----------------------------------------------------------------------------
// Model 8: 3D Paperclip Pin (Vibrant Glossy Paperclip)
// ----------------------------------------------------------------------------
export function createPaperclipMesh(colorHex = 0xf59e0b) {
  const group = new THREE.Group();
  const curvePath = new THREE.CurvePath();

  const p0 = new THREE.Vector3(-0.45, -1.0, 0);
  const p1 = new THREE.Vector3(-0.45, 0.9, 0);
  curvePath.add(new THREE.LineCurve3(p0, p1));

  const topCenter = new THREE.Vector3(0, 0.9, 0);
  const topPoints = [];
  for (let i = 0; i <= 16; i++) {
    const theta = Math.PI - (i / 16) * Math.PI;
    topPoints.push(new THREE.Vector3(
      topCenter.x + Math.cos(theta) * 0.45,
      topCenter.y + Math.sin(theta) * 0.45,
      0.01 * (i / 16)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(topPoints));

  const p2 = new THREE.Vector3(0.45, 0.9, 0.01);
  const p3 = new THREE.Vector3(0.45, -0.9, 0.02);
  curvePath.add(new THREE.LineCurve3(p2, p3));

  const botCenter = new THREE.Vector3(0.12, -0.9, 0.02);
  const botPoints = [];
  for (let i = 0; i <= 16; i++) {
    const theta = 0 - (i / 16) * Math.PI;
    botPoints.push(new THREE.Vector3(
      botCenter.x + Math.cos(theta) * 0.33,
      botCenter.y + Math.sin(theta) * 0.33,
      0.02 + 0.01 * (i / 16)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(botPoints));

  const p4 = new THREE.Vector3(-0.21, -0.9, 0.03);
  const p5 = new THREE.Vector3(-0.21, 0.5, 0.04);
  curvePath.add(new THREE.LineCurve3(p4, p5));

  const inTopCenter = new THREE.Vector3(-0.02, 0.5, 0.04);
  const inTopPoints = [];
  for (let i = 0; i <= 16; i++) {
    const theta = Math.PI - (i / 16) * Math.PI;
    inTopPoints.push(new THREE.Vector3(
      inTopCenter.x + Math.cos(theta) * 0.19,
      inTopCenter.y + Math.sin(theta) * 0.19,
      0.04 + 0.01 * (i / 16)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(inTopPoints));

  const p6 = new THREE.Vector3(0.17, 0.5, 0.05);
  const p7 = new THREE.Vector3(0.17, -0.35, 0.06);
  curvePath.add(new THREE.LineCurve3(p6, p7));

  const tubeGeo = new THREE.TubeGeometry(curvePath, 64, 0.11, 14, false);
  const capStartGeo = new THREE.SphereGeometry(0.11, 12, 12);
  capStartGeo.translate(p0.x, p0.y, p0.z);
  const capEndGeo = new THREE.SphereGeometry(0.11, 12, 12);
  capEndGeo.translate(p7.x, p7.y, p7.z);

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.12,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    ior: 1.55,
  });

  group.add(new THREE.Mesh(tubeGeo, mat));
  group.add(new THREE.Mesh(capStartGeo, mat));
  group.add(new THREE.Mesh(capEndGeo, mat));
  group.rotation.z = -0.35;
  return group;
}

// ----------------------------------------------------------------------------
// Model 9: Navbar Brand 3D Faceted Ruby/Gold Gem
// ----------------------------------------------------------------------------
export function createLogoFacetedLens() {
  const g = new THREE.Group();
  g.userData.baseScale = 1.1;

  const geo = new THREE.OctahedronGeometry(0.85, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.5,
    roughness: 0.05,
    metalness: 0.2,
    clearcoat: 1.0,
    transmission: 0.2,
  });
  const m = new THREE.Mesh(geo, mat);
  g.add(m);

  g.userData.update = (t, dt) => {
    m.rotation.y += 1.8 * dt;
    m.rotation.x += 0.9 * dt;
  };

  return g;
}

// ============================================================================
// 3. MASTER INITIALIZER
// ============================================================================
export function initStudioThree() {
  console.log('✨ [Studio 3D Engine] Initializing Vivid Nature Ambient & Procedural 3D Icons...');

  // 1. Ambient Background Scene
  const ambient = new StudioNatureAmbient();

  // 2. Navbar Logo 3D
  const logoCanvas = document.getElementById('studio-logo-canvas');
  if (logoCanvas) new MicroScene(logoCanvas, createLogoFacetedLens, { cameraZ: 3.2 });

  // 3. Tab 3D Icons
  const tabExtractCanvas = document.getElementById('icon-tab-extractor');
  if (tabExtractCanvas) new MicroScene(tabExtractCanvas, createMiniClapperboard, { cameraZ: 3.4, autoRotate: false });

  const tabBgCanvas = document.getElementById('icon-tab-bg');
  if (tabBgCanvas) new MicroScene(tabBgCanvas, createMiniScissors, { cameraZ: 3.4, autoRotate: false });

  const tabScanCanvas = document.getElementById('icon-tab-scanner');
  if (tabScanCanvas) new MicroScene(tabScanCanvas, createMiniCurledDoc, { cameraZ: 3.4, autoRotate: false });

  // 4. Badges & Feature Icons
  const badgeDaisy = document.getElementById('badge-3d-daisy');
  if (badgeDaisy) new MicroScene(badgeDaisy, createMiniDaisyBadge, { cameraZ: 3.0 });

  const badgeZap = document.getElementById('badge-3d-zap');
  if (badgeZap) new MicroScene(badgeZap, createMiniZapGem, { cameraZ: 3.0 });

  const badgeMagic = document.getElementById('badge-3d-magic');
  if (badgeMagic) new MicroScene(badgeMagic, createMiniPrism, { cameraZ: 2.8 });

  const badgeLens = document.getElementById('badge-3d-lens');
  if (badgeLens) new MicroScene(badgeLens, createMiniLens, { cameraZ: 2.8, autoRotate: false });

  // 5. Paperclip Pins
  document.querySelectorAll('.paperclip-pin-canvas').forEach((pinCanvas) => {
    const color = pinCanvas.dataset.color ? parseInt(pinCanvas.dataset.color, 16) : 0xf59e0b;
    new MicroScene(pinCanvas, () => createPaperclipMesh(color), { cameraZ: 4.2, autoRotate: false });
  });

  return { ambient };
}
