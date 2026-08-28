// FramerTool - 3D Pipeline Card Models & Top Paperclip Pins (img2threejs methodology)
// Zero external asset bloat - 100% procedural Three.js geometry, PBR shaders & hover micro-interactions.

// ============================================================================
// 1. TOP PAPERCLIP PIN (COMPACT, GLOSSY SKY-BLUE CLIP PINNING THE CARD)
// ============================================================================
export function createPaperclipGeometry(tubeRadius = 0.09) {
  const curvePath = new THREE.CurvePath();

  const p0 = new THREE.Vector3(-0.45, -1.0, 0);
  const p1 = new THREE.Vector3(-0.45, 0.9, 0);
  curvePath.add(new THREE.LineCurve3(p0, p1));

  // Top Outer Arc
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

  // Right Outer Leg
  const p2 = new THREE.Vector3(0.45, 0.9, 0.01);
  const p3 = new THREE.Vector3(0.45, -0.9, 0.02);
  curvePath.add(new THREE.LineCurve3(p2, p3));

  // Bottom Outer Arc
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

  // Inner Leg Up
  const p4 = new THREE.Vector3(-0.21, -0.9, 0.03);
  const p5 = new THREE.Vector3(-0.21, 0.5, 0.04);
  curvePath.add(new THREE.LineCurve3(p4, p5));

  // Inner Top Arc
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

  // Final Short Leg Down
  const p6 = new THREE.Vector3(0.17, 0.5, 0.05);
  const p7 = new THREE.Vector3(0.17, -0.35, 0.06);
  curvePath.add(new THREE.LineCurve3(p6, p7));

  const tubeGeo = new THREE.TubeGeometry(curvePath, 64, tubeRadius, 14, false);

  const capStartGeo = new THREE.SphereGeometry(tubeRadius, 12, 12);
  capStartGeo.translate(p0.x, p0.y, p0.z);

  const capEndGeo = new THREE.SphereGeometry(tubeRadius, 12, 12);
  capEndGeo.translate(p7.x, p7.y, p7.z);

  return { tubeGeo, capStartGeo, capEndGeo };
}

export function createPaperclipMesh(colorHex = 0x0284c7) {
  const group = new THREE.Group();
  const { tubeGeo, capStartGeo, capEndGeo } = createPaperclipGeometry(0.10);

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    ior: 1.52,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x38bdf8),
  });

  group.add(new THREE.Mesh(tubeGeo, mat));
  group.add(new THREE.Mesh(capStartGeo, mat));
  group.add(new THREE.Mesh(capEndGeo, mat));

  group.rotation.z = -0.35;
  return group;
}

// ============================================================================
// 2. MODEL 1: 3D CINEMA CLAPPERBOARD (24 FPS FRAME EXTRACTOR)
// ============================================================================
export function createClapperboardModel() {
  const group = new THREE.Group();

  const makeStripedTexture = () => {
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
    return tex;
  };

  const stripedTex = makeStripedTexture();

  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.2,
  });

  const stripedMat = new THREE.MeshStandardMaterial({
    map: stripedTex,
    roughness: 0.25,
    metalness: 0.1,
  });

  // Base Board
  const baseGeo = new THREE.BoxGeometry(2.1, 1.3, 0.18);
  const baseMesh = new THREE.Mesh(baseGeo, boardMat);
  baseMesh.position.set(0, -0.35, 0);
  group.add(baseMesh);

  // Lower Fixed Stripe Bar
  const lowerBarGeo = new THREE.BoxGeometry(2.1, 0.32, 0.2);
  const lowerBarMesh = new THREE.Mesh(lowerBarGeo, stripedMat);
  lowerBarMesh.position.set(0, 0.42, 0.01);
  group.add(lowerBarMesh);

  // Top Hinged Clapper Stick
  const topStickGroup = new THREE.Group();
  topStickGroup.position.set(-1.0, 0.58, 0.02);

  const topStickGeo = new THREE.BoxGeometry(2.15, 0.32, 0.2);
  const topStickMesh = new THREE.Mesh(topStickGeo, stripedMat);
  topStickMesh.position.set(1.05, 0, 0);
  topStickGroup.add(topStickMesh);

  // Metal Hinge Screw
  const hingeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.26, 16);
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
  hingeMesh.rotation.x = Math.PI / 2;
  topStickGroup.add(hingeMesh);

  topStickGroup.rotation.z = 0.38;
  group.add(topStickGroup);

  group.userData = { topStick: topStickGroup };
  group.scale.setScalar(0.95);
  return group;
}

// ============================================================================
// 3. MODEL 2: 3D STYLIZED PURPLE SCISSORS (AI MATTING / BACKGROUND REMOVER)
// ============================================================================
export function createScissorsModel() {
  const group = new THREE.Group();

  const handleMat = new THREE.MeshPhysicalMaterial({
    color: 0xa855f7,
    roughness: 0.18,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
    sheen: 0.3,
    sheenColor: new THREE.Color(0xc084fc),
  });

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.92,
  });

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.9,
    roughness: 0.2,
  });

  const makeHalf = (isLeft) => {
    const halfGroup = new THREE.Group();

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.24, 0);
    bladeShape.lineTo(0.12, 1.4);
    bladeShape.lineTo(-0.06, 1.35);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.set(-0.1, 0, isLeft ? 0.03 : -0.09);
    halfGroup.add(bladeMesh);

    const handleRingGeo = new THREE.TorusGeometry(0.48, 0.14, 16, 32);
    const handleRingMesh = new THREE.Mesh(handleRingGeo, handleMat);
    handleRingMesh.position.set(0.35, -0.85, 0);
    handleRingMesh.rotation.z = -0.2;
    halfGroup.add(handleRingMesh);

    const bridgeGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.6, 16);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, handleMat);
    bridgeMesh.position.set(0.18, -0.4, 0);
    bridgeMesh.rotation.z = 0.3;
    halfGroup.add(bridgeMesh);

    return halfGroup;
  };

  const leftHalf = makeHalf(true);
  leftHalf.rotation.z = 0.25;
  group.add(leftHalf);

  const rightHalf = makeHalf(false);
  rightHalf.scale.x = -1;
  rightHalf.rotation.z = -0.25;
  group.add(rightHalf);

  const centerPinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.24, 24);
  const centerPinMesh = new THREE.Mesh(centerPinGeo, pinMat);
  centerPinMesh.rotation.x = Math.PI / 2;
  group.add(centerPinMesh);

  group.userData = { leftHalf, rightHalf };
  group.scale.setScalar(0.9);
  return group;
}

// ============================================================================
// 4. MODEL 3: 3D CURLED PAPER SHEET (SMART PDF DIGITIZER)
// ============================================================================
export function createCurledPaperModel() {
  const group = new THREE.Group();

  const paperMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.02,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });

  const foldUnderMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  const paperShape = new THREE.Shape();
  paperShape.moveTo(-0.8, -1.3);
  paperShape.lineTo(0.9, -1.3);
  paperShape.lineTo(0.9, 1.3);
  paperShape.lineTo(-0.25, 1.3);
  paperShape.lineTo(-0.8, 0.75);
  paperShape.closePath();

  const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 };
  const paperGeo = new THREE.ExtrudeGeometry(paperShape, extrudeSettings);
  const paperMesh = new THREE.Mesh(paperGeo, paperMat);
  group.add(paperMesh);

  const foldGroup = new THREE.Group();
  foldGroup.position.set(-0.52, 1.02, 0.06);

  const foldShape = new THREE.Shape();
  foldShape.moveTo(0, 0);
  foldShape.lineTo(0.55, 0.28);
  foldShape.lineTo(-0.28, -0.55);
  foldShape.closePath();

  const foldGeo = new THREE.ExtrudeGeometry(foldShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
  const foldMesh = new THREE.Mesh(foldGeo, foldUnderMat);
  foldMesh.rotation.z = -Math.PI / 4;
  foldMesh.rotation.y = -0.35;
  foldGroup.add(foldMesh);

  group.add(foldGroup);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  for (let y = 0.4; y >= -1.0; y -= 0.25) {
    const lineGeo = new THREE.BoxGeometry(1.2, 0.04, 0.01);
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.set(0.05, y, 0.05);
    group.add(lineMesh);
  }

  group.scale.setScalar(0.95);
  return group;
}

// ============================================================================
// 5. MODEL 4: 3D TRANSLUCENT RED RUBY DICE (PROCEDURAL 3D CODE / img2threejs)
// ============================================================================
export function createRedDiceModel() {
  const group = new THREE.Group();

  // 1. Ruby Red Glass Material with Vibrant Refraction
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.25,
    transmission: 0.85,
    opacity: 0.96,
    transparent: true,
    roughness: 0.06,
    ior: 1.54,
    thickness: 1.5,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    attenuationColor: new THREE.Color(0xdc2626),
    attenuationDistance: 0.8,
  });

  const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 8, 8, 8);
  const cubeMesh = new THREE.Mesh(cubeGeo, glassMat);
  group.add(cubeMesh);

  // 2. Crisp White Inset Pips
  const pipMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.05,
  });

  const pipGeo = new THREE.SphereGeometry(0.12, 16, 16);
  pipGeo.scale(1, 1, 0.4);

  const addPip = (x, y, z, rotX = 0, rotY = 0) => {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(x, y, z);
    pip.rotation.set(rotX, rotY, 0);
    group.add(pip);
  };

  const d = 0.38;
  const o = 0.76;

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
// 6. SINGLE ISOLATED MINI-VIEWPORT CONTROLLER FOR FLICKER-FREE RENDERING
// ============================================================================
export class Card3DViewer {
  constructor(canvas, modelType, options = {}) {
    this.canvas = canvas;
    this.modelType = modelType;
    this.options = Object.assign({
      isPaperclipPin: false,
    }, options);

    this.isHovered = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const w = this.canvas.clientWidth || this.canvas.width || 120;
    const h = this.canvas.clientHeight || this.canvas.height || 120;

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

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.8, 15);
    rimLight.position.set(-4, -3, 3);
    this.scene.add(rimLight);

    // Instantiate specific model
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

    // Hover Interaction tied to the parent card
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
        this.model.rotation.z = baseZ + (this.isHovered ? this.mouseX * 0.2 : Math.sin(elapsedTime * 1.5) * 0.03);
        this.model.rotation.y = this.isHovered ? this.mouseX * 0.3 : 0;
      } else {
        switch (this.modelType) {
          case 'clapperboard':
            this.model.rotation.y = this.mouseX * 0.5 + Math.sin(elapsedTime * 1.2) * 0.08;
            this.model.rotation.x = -this.mouseY * 0.4 + 0.1;
            if (this.model.userData.topStick) {
              const clapAngle = this.isHovered ? 0.15 + Math.sin(elapsedTime * 6) * 0.12 : 0.38;
              this.model.userData.topStick.rotation.z += (clapAngle - this.model.userData.topStick.rotation.z) * 0.2;
            }
            break;

          case 'scissors':
            this.model.rotation.y = this.mouseX * 0.6 + Math.sin(elapsedTime * 1.5) * 0.1;
            this.model.rotation.x = -this.mouseY * 0.5;
            if (this.model.userData.leftHalf && this.model.userData.rightHalf) {
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
