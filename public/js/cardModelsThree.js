// FramerTool - 3D Pipeline Card Models & Top Paperclip Pins (img2threejs)
// 100% procedural Three.js geometry, PBR materials & interactive hover physics.

// ============================================================================
// 1. COMPACT TOP 3D PAPERCLIP PIN (BLUE PLASTIC GLOSS)
// ============================================================================
export function createPaperclipMesh(colorHex = 0x0284c7) {
  const group = new THREE.Group();

  const curvePath = new THREE.CurvePath();
  const r = 0.08;

  // 1. Left outer leg
  curvePath.add(new THREE.LineCurve3(new THREE.Vector3(-0.4, -0.9, 0), new THREE.Vector3(-0.4, 0.8, 0)));

  // 2. Top outer arc
  const topCenter = new THREE.Vector3(0, 0.8, 0);
  const topPts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI - (i / 16) * Math.PI;
    topPts.push(new THREE.Vector3(topCenter.x + Math.cos(a) * 0.4, topCenter.y + Math.sin(a) * 0.4, 0.01 * (i / 16)));
  }
  curvePath.add(new THREE.CatmullRomCurve3(topPts));

  // 3. Right outer leg
  curvePath.add(new THREE.LineCurve3(new THREE.Vector3(0.4, 0.8, 0.01), new THREE.Vector3(0.4, -0.8, 0.02)));

  // 4. Bottom outer arc
  const botCenter = new THREE.Vector3(0.1, -0.8, 0.02);
  const botPts = [];
  for (let i = 0; i <= 16; i++) {
    const a = 0 - (i / 16) * Math.PI;
    botPts.push(new THREE.Vector3(botCenter.x + Math.cos(a) * 0.3, botCenter.y + Math.sin(a) * 0.3, 0.02 + 0.01 * (i / 16)));
  }
  curvePath.add(new THREE.CatmullRomCurve3(botPts));

  // 5. Inner leg up
  curvePath.add(new THREE.LineCurve3(new THREE.Vector3(-0.2, -0.8, 0.03), new THREE.Vector3(-0.2, 0.45, 0.04)));

  // 6. Top inner arc
  const inTopCenter = new THREE.Vector3(-0.02, 0.45, 0.04);
  const inTopPts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI - (i / 16) * Math.PI;
    inTopPts.push(new THREE.Vector3(inTopCenter.x + Math.cos(a) * 0.18, inTopCenter.y + Math.sin(a) * 0.18, 0.04 + 0.01 * (i / 16)));
  }
  curvePath.add(new THREE.CatmullRomCurve3(inTopPts));

  // 7. Final leg down
  curvePath.add(new THREE.LineCurve3(new THREE.Vector3(0.16, 0.45, 0.05), new THREE.Vector3(0.16, -0.3, 0.06)));

  const tubeGeo = new THREE.TubeGeometry(curvePath, 64, r, 12, false);

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.18,
    metalness: 0.1,
  });

  const tubeMesh = new THREE.Mesh(tubeGeo, mat);
  group.add(tubeMesh);

  // Rounded end caps
  const cap1 = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), mat);
  cap1.position.set(-0.4, -0.9, 0);
  group.add(cap1);

  const cap2 = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), mat);
  cap2.position.set(0.16, -0.3, 0.06);
  group.add(cap2);

  group.rotation.z = -0.35;
  group.scale.setScalar(1.2);
  return group;
}

// ============================================================================
// 2. MODEL 1: 3D CINEMA CLAPPERBOARD
// ============================================================================
export function createClapperboardModel() {
  const group = new THREE.Group();

  // Striped texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#ffffff';
  for (let x = -64; x < 320; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 20, 0);
    ctx.lineTo(x + 50, 0);
    ctx.lineTo(x + 30, 64);
    ctx.lineTo(x, 64);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
  const stripedMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25 });

  // Base Board
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 0.16), boardMat);
  baseMesh.position.set(0, -0.35, 0);
  group.add(baseMesh);

  // Fixed Lower Bar
  const lowerBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.18), stripedMat);
  lowerBar.position.set(0, 0.38, 0.01);
  group.add(lowerBar);

  // Top Hinged Stick
  const topStickGroup = new THREE.Group();
  topStickGroup.position.set(-0.95, 0.52, 0.02);

  const topStickMesh = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.3, 0.18), stripedMat);
  topStickMesh.position.set(1.0, 0, 0);
  topStickGroup.add(topStickMesh);

  // Hinge pin
  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
  );
  hinge.rotation.x = Math.PI / 2;
  topStickGroup.add(hinge);

  topStickGroup.rotation.z = 0.35;
  group.add(topStickGroup);

  group.userData = { topStick: topStickGroup };
  group.scale.setScalar(0.95);
  return group;
}

// ============================================================================
// 3. MODEL 2: 3D STYLIZED PURPLE SCISSORS
// ============================================================================
export function createScissorsModel() {
  const group = new THREE.Group();

  const handleMat = new THREE.MeshPhysicalMaterial({
    color: 0xa855f7, // Vibrant Purple
    roughness: 0.18,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.92,
  });

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Gold hinge
    metalness: 0.9,
    roughness: 0.2,
  });

  // Left Half
  const leftHalf = new THREE.Group();
  
  // Steel Blade
  const leftBlade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.4, 0.04), bladeMat);
  leftBlade.position.set(0.06, 0.7, 0.02);
  leftBlade.rotation.z = -0.06;
  leftHalf.add(leftBlade);

  // Purple Handle Loop
  const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 16, 28), handleMat);
  leftRing.position.set(0.32, -0.75, 0);
  leftRing.rotation.z = -0.2;
  leftHalf.add(leftRing);

  // Purple Stem
  const leftStem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.55, 16), handleMat);
  leftStem.position.set(0.15, -0.32, 0);
  leftStem.rotation.z = 0.25;
  leftHalf.add(leftStem);

  leftHalf.rotation.z = 0.25;
  group.add(leftHalf);

  // Right Half (Mirrored)
  const rightHalf = new THREE.Group();

  const rightBlade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.4, 0.04), bladeMat);
  rightBlade.position.set(-0.06, 0.7, -0.02);
  rightBlade.rotation.z = 0.06;
  rightHalf.add(rightBlade);

  const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 16, 28), handleMat);
  rightRing.position.set(-0.32, -0.75, 0);
  rightRing.rotation.z = 0.2;
  rightHalf.add(rightRing);

  const rightStem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.55, 16), handleMat);
  rightStem.position.set(-0.15, -0.32, 0);
  rightStem.rotation.z = -0.25;
  rightHalf.add(rightStem);

  rightHalf.rotation.z = -0.25;
  group.add(rightHalf);

  // Center Gold Pin
  const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 20), pinMat);
  centerPin.rotation.x = Math.PI / 2;
  group.add(centerPin);

  group.userData = { leftHalf, rightHalf };
  group.scale.setScalar(0.92);
  return group;
}

// ============================================================================
// 4. MODEL 3: 3D CURLED PAPER SHEET
// ============================================================================
export function createCurledPaperModel() {
  const group = new THREE.Group();

  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.02,
  });

  const foldMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.35,
  });

  // Base Document Sheet
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.1, 0.04), paperMat);
  group.add(sheet);

  // 3D Folded / Curled Corner (Top-Left)
  const foldCorner = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 0.05, 4),
    foldMat
  );
  foldCorner.position.set(-0.62, 0.88, 0.05);
  foldCorner.rotation.z = Math.PI / 4;
  foldCorner.rotation.x = 0.3;
  group.add(foldCorner);

  // Simulated Text Lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  const linePositions = [0.4, 0.15, -0.1, -0.35, -0.6, -0.85];
  linePositions.forEach((y, i) => {
    const w = i % 2 === 0 ? 1.1 : 0.85;
    const line = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.01), lineMat);
    line.position.set(w === 1.1 ? 0 : -0.12, y, 0.03);
    group.add(line);
  });

  group.scale.setScalar(0.95);
  return group;
}

// ============================================================================
// 5. MODEL 4: 3D TRANSLUCENT RED RUBY DICE
// ============================================================================
export function createRedDiceModel() {
  const group = new THREE.Group();

  // Red Ruby Glass Cube
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xef4444, // Vibrant Red
    transmission: 0.85,
    opacity: 0.95,
    transparent: true,
    roughness: 0.08,
    ior: 1.52,
    thickness: 1.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    attenuationColor: new THREE.Color(0xdc2626),
    attenuationDistance: 0.7,
  });

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4, 4, 4, 4), glassMat);
  group.add(cube);

  // White Inset Pips (Dots)
  const pipMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pipGeo = new THREE.SphereGeometry(0.10, 12, 12);
  pipGeo.scale(1, 1, 0.35);

  const addPip = (x, y, z, rotX = 0, rotY = 0) => {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(x, y, z);
    pip.rotation.set(rotX, rotY, 0);
    group.add(pip);
  };

  const d = 0.36;
  const o = 0.71;

  // Face 1 (Front: +Z)
  addPip(0, 0, o);

  // Face 6 (Back: -Z)
  addPip(-d, -d, -o, 0, Math.PI);
  addPip(-d, 0, -o, 0, Math.PI);
  addPip(-d, d, -o, 0, Math.PI);
  addPip(d, -d, -o, 0, Math.PI);
  addPip(d, 0, -o, 0, Math.PI);
  addPip(d, d, -o, 0, Math.PI);

  // Face 2 (Top: +Y)
  addPip(-d, o, -d, -Math.PI / 2, 0);
  addPip(d, o, d, -Math.PI / 2, 0);

  // Face 5 (Bottom: -Y)
  addPip(0, -o, 0, Math.PI / 2, 0);
  addPip(-d, -o, -d, Math.PI / 2, 0);
  addPip(-d, -o, d, Math.PI / 2, 0);
  addPip(d, -o, -d, Math.PI / 2, 0);
  addPip(d, -o, d, Math.PI / 2, 0);

  // Face 3 (Right: +X)
  addPip(o, -d, -d, 0, Math.PI / 2);
  addPip(o, 0, 0, 0, Math.PI / 2);
  addPip(o, d, d, 0, Math.PI / 2);

  // Face 4 (Left: -X)
  addPip(-o, -d, -d, 0, -Math.PI / 2);
  addPip(-o, -d, d, 0, -Math.PI / 2);
  addPip(-o, d, -d, 0, -Math.PI / 2);
  addPip(-o, d, d, 0, -Math.PI / 2);

  group.rotation.set(0.55, 0.65, -0.2);
  group.scale.setScalar(0.92);
  return group;
}

// ============================================================================
// 6. ISOLATED, RESILIENT CARD 3D VIEWER
// ============================================================================
export class Card3DViewer {
  constructor(canvas, modelType, options = {}) {
    this.canvas = canvas;
    this.modelType = modelType;
    this.options = Object.assign({ isPaperclipPin: false }, options);

    this.isHovered = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    try {
      this.init();
    } catch (err) {
      console.error(`[Card3DViewer] Error initializing ${modelType}:`, err);
    }
  }

  init() {
    this.scene = new THREE.Scene();

    const w = this.canvas.width || 120;
    const h = this.canvas.height || 120;

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.z = this.options.isPaperclipPin ? 5.2 : 5.8;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(dpr);

    // Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.8, 15);
    rimLight.position.set(-4, -3, 3);
    this.scene.add(rimLight);

    if (this.options.isPaperclipPin) {
      this.model = createPaperclipMesh(0x0284c7);
    } else {
      switch (this.modelType) {
        case 'clapperboard':
          this.model = createClapperboardModel();
          break;
        case 'scissors':
          this.model = createScissorsModel();
          break;
        case 'curled_paper':
          this.model = createCurledPaperModel();
          break;
        case 'red_dice':
          this.model = createRedDiceModel();
          break;
      }
    }

    if (this.model) {
      this.scene.add(this.model);
    }

    // Hover Interaction
    const card = this.canvas.closest('.card-3d-tilt') || this.canvas.parentElement;
    if (card) {
      card.addEventListener('mouseenter', () => (this.isHovered = true));
      card.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
      });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        this.targetMouseX = (e.clientX - cx) / (rect.width / 2);
        this.targetMouseY = (e.clientY - cy) / (rect.height / 2);
      });
    }

    this.clock = new THREE.Clock();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.12;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.12;

    if (this.model) {
      if (this.options.isPaperclipPin) {
        const baseZ = -0.35;
        this.model.rotation.z = baseZ + (this.isHovered ? this.mouseX * 0.25 : Math.sin(elapsedTime * 1.5) * 0.03);
        this.model.rotation.y = this.isHovered ? this.mouseX * 0.35 : 0;
      } else {
        switch (this.modelType) {
          case 'clapperboard':
            this.model.rotation.y = this.mouseX * 0.5 + Math.sin(elapsedTime * 1.2) * 0.08;
            this.model.rotation.x = -this.mouseY * 0.4 + 0.1;
            if (this.model.userData && this.model.userData.topStick) {
              const clapAngle = this.isHovered ? 0.15 + Math.sin(elapsedTime * 6) * 0.12 : 0.35;
              this.model.userData.topStick.rotation.z += (clapAngle - this.model.userData.topStick.rotation.z) * 0.2;
            }
            break;

          case 'scissors':
            this.model.rotation.y = this.mouseX * 0.6 + Math.sin(elapsedTime * 1.5) * 0.1;
            this.model.rotation.x = -this.mouseY * 0.5;
            if (this.model.userData && this.model.userData.leftHalf && this.model.userData.rightHalf) {
              const snipAngle = this.isHovered ? 0.12 + Math.sin(elapsedTime * 8) * 0.15 : 0.25;
              this.model.userData.leftHalf.rotation.z = snipAngle;
              this.model.userData.rightHalf.rotation.z = -snipAngle;
            }
            break;

          case 'curled_paper':
            this.model.rotation.y = this.mouseX * 0.5 + Math.sin(elapsedTime * 1.2) * 0.06;
            this.model.rotation.x = -this.mouseY * 0.4;
            this.model.rotation.z = Math.sin(elapsedTime * 0.8) * 0.04;
            break;

          case 'red_dice':
            this.model.rotation.x += delta * (this.isHovered ? 1.8 : 0.5);
            this.model.rotation.y += delta * (this.isHovered ? 2.2 : 0.6);
            this.model.rotation.z = this.mouseX * 0.6;
            break;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

export function initPipeline3DModels() {
  const cardElements = [
    { id: 'canvas-clapperboard', type: 'clapperboard' },
    { id: 'canvas-scissors', type: 'scissors' },
    { id: 'canvas-curled-paper', type: 'curled_paper' },
    { id: 'canvas-red-dice', type: 'red_dice' },
  ];

  cardElements.forEach((item) => {
    const el = document.getElementById(item.id);
    if (el) {
      new Card3DViewer(el, item.type, { isPaperclipPin: false });
    }
  });

  const pinCanvases = document.querySelectorAll('.paperclip-pin-canvas');
  pinCanvases.forEach((canvas) => {
    new Card3DViewer(canvas, 'paperclip', { isPaperclipPin: true });
  });
}
