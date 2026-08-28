// FramerTool — 3D Pipeline Card Models & Top Paperclip Pins (img2threejs methodology)
// Redesigned: Vibrant saturated colors, organic shapes, rich idle + hover animations.
// Every model pops against white card backgrounds with its own color identity.

// ============================================================================
// 1. TOP PAPERCLIP PIN (COMPACT, GLOSSY SKY-BLUE CLIP PINNING THE CARD)
// ============================================================================
export function createPaperclipGeometry(tubeRadius = 0.09) {
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
// 2. CINEMA CLAPPERBOARD — Golden Amber + Warm Espresso
//    Chunky, rounded, toy-like with a satisfying clap animation.
// ============================================================================
export function createClapperboardModel() {
  const group = new THREE.Group();

  // --- Striped clapstick texture (golden-amber + deep espresso) ---
  const makeStripedTexture = (fg, bg) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = fg;
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

  // Board body — warm espresso with a touch of orange
  const boardMat = new THREE.MeshPhysicalMaterial({
    color: 0x3e2723,
    roughness: 0.35,
    metalness: 0.08,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });

  // Stripe bars — warm golden-amber + espresso
  const stripeTex = makeStripedTexture('#f59e0b', '#3e2723');
  const stripedMat = new THREE.MeshPhysicalMaterial({
    map: stripeTex,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
  });

  // Base Board (rounded edges)
  const baseGeo = new THREE.BoxGeometry(2.1, 1.3, 0.18, 4, 4, 4);
  // Soften edges by nudging vertices
  const basePos = baseGeo.attributes.position;
  for (let i = 0; i < basePos.count; i++) {
    const x = basePos.getX(i), y = basePos.getY(i), z = basePos.getZ(i);
    const r = 0.06;
    const sx = Math.sign(x) * Math.max(0, Math.abs(x) - r);
    const sy = Math.sign(y) * Math.max(0, Math.abs(y) - r);
    basePos.setX(i, sx + Math.sign(x) * r * 0.95);
    basePos.setY(i, sy + Math.sign(y) * r * 0.95);
  }
  baseGeo.computeVertexNormals();
  const baseMesh = new THREE.Mesh(baseGeo, boardMat);
  baseMesh.position.set(0, -0.35, 0);
  group.add(baseMesh);

  // Embossed detail lines on the board — warm orange-amber lines
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xd97706,
    emissiveIntensity: 0.15,
    roughness: 0.4,
  });
  for (let y = -0.2; y >= -0.85; y -= 0.22) {
    const lineGeo = new THREE.BoxGeometry(1.5, 0.04, 0.025);
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.set(0, y, 0.1);
    group.add(lineMesh);
  }

  // Lower Fixed Stripe Bar
  const lowerBarGeo = new THREE.BoxGeometry(2.1, 0.34, 0.21);
  const lowerBarMesh = new THREE.Mesh(lowerBarGeo, stripedMat);
  lowerBarMesh.position.set(0, 0.42, 0.01);
  group.add(lowerBarMesh);

  // Top Hinged Clapper Stick
  const topStickGroup = new THREE.Group();
  topStickGroup.position.set(-1.0, 0.58, 0.02);
  const topStickGeo = new THREE.BoxGeometry(2.15, 0.34, 0.21);
  const topStickMesh = new THREE.Mesh(topStickGeo, stripedMat);
  topStickMesh.position.set(1.05, 0, 0);
  topStickGroup.add(topStickMesh);

  // Metal Hinge Screw — polished brass
  const hingeGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.28, 20);
  const hingeMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a017,
    metalness: 0.95,
    roughness: 0.12,
    clearcoat: 0.8,
  });
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
// 3. STYLIZED SCISSORS — Electric Violet + Magenta Handles, Bright Steel Blades
//    Smooth organic torus handles, satisfying snip animation.
// ============================================================================
export function createScissorsModel() {
  const group = new THREE.Group();

  // Handle material — vibrant violet-magenta gradient feel
  const handleMat = new THREE.MeshPhysicalMaterial({
    color: 0x9333ea,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xe879f9),
  });

  // Blade material — polished chrome steel
  const bladeMat = new THREE.MeshPhysicalMaterial({
    color: 0xc0c8d8,
    roughness: 0.08,
    metalness: 0.95,
    clearcoat: 0.7,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
  });

  // Center pin — warm gold
  const pinMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    metalness: 0.92,
    roughness: 0.1,
    clearcoat: 0.9,
  });

  const makeHalf = (isLeft) => {
    const halfGroup = new THREE.Group();

    // Blade — tapered with bevel
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.24, 0);
    bladeShape.lineTo(0.12, 1.4);
    bladeShape.lineTo(-0.06, 1.35);
    bladeShape.closePath();

    const extSettings = {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.02,
    };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extSettings);
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.set(-0.1, 0, isLeft ? 0.03 : -0.09);
    halfGroup.add(bladeMesh);

    // Handle ring — thick, glossy torus
    const handleRingGeo = new THREE.TorusGeometry(0.50, 0.16, 20, 36);
    const handleRingMesh = new THREE.Mesh(handleRingGeo, handleMat);
    handleRingMesh.position.set(0.35, -0.88, 0);
    handleRingMesh.rotation.z = -0.2;
    halfGroup.add(handleRingMesh);

    // Bridge connector
    const bridgeGeo = new THREE.CylinderGeometry(0.17, 0.20, 0.62, 18);
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

  // Center pin
  const centerPinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.26, 28);
  const centerPinMesh = new THREE.Mesh(centerPinGeo, pinMat);
  centerPinMesh.rotation.x = Math.PI / 2;
  group.add(centerPinMesh);

  // Decorative pin cap — small gem-like sphere
  const capGeo = new THREE.SphereGeometry(0.10, 16, 16);
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.05,
    clearcoat: 1.0,
  });
  const capMesh = new THREE.Mesh(capGeo, capMat);
  capMesh.position.set(0, 0, 0.16);
  group.add(capMesh);

  group.userData = { leftHalf, rightHalf };
  group.scale.setScalar(0.9);
  return group;
}

// ============================================================================
// 4. CURLED PAPER SHEET — Warm Cream with Teal/Orange Accent Highlights
//    Folded dog-ear, colored "content" lines, floating micro-shadow.
// ============================================================================
export function createCurledPaperModel() {
  const group = new THREE.Group();

  // Paper body — warm cream (NOT pure white)
  const paperMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef3c7,
    roughness: 0.3,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide,
  });

  // Dog-ear fold — slightly darker warm parchment
  const foldUnderMat = new THREE.MeshPhysicalMaterial({
    color: 0xfde68a,
    roughness: 0.4,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Paper sheet shape with dog-ear cutout
  const paperShape = new THREE.Shape();
  paperShape.moveTo(-0.8, -1.3);
  paperShape.lineTo(0.9, -1.3);
  paperShape.lineTo(0.9, 1.3);
  paperShape.lineTo(-0.25, 1.3);
  paperShape.lineTo(-0.8, 0.75);
  paperShape.closePath();

  const extSettings = {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
  };
  const paperGeo = new THREE.ExtrudeGeometry(paperShape, extSettings);
  const paperMesh = new THREE.Mesh(paperGeo, paperMat);
  group.add(paperMesh);

  // Dog-ear fold triangle
  const foldGroup = new THREE.Group();
  foldGroup.position.set(-0.52, 1.02, 0.06);
  const foldShape = new THREE.Shape();
  foldShape.moveTo(0, 0);
  foldShape.lineTo(0.55, 0.28);
  foldShape.lineTo(-0.28, -0.55);
  foldShape.closePath();
  const foldGeo = new THREE.ExtrudeGeometry(foldShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });
  const foldMesh = new THREE.Mesh(foldGeo, foldUnderMat);
  foldMesh.rotation.z = -Math.PI / 4;
  foldMesh.rotation.y = -0.35;
  foldGroup.add(foldMesh);
  group.add(foldGroup);

  // Content lines — alternating teal, orange, blue (like highlighted PDF content)
  const lineColors = [0x0891b2, 0xea580c, 0x2563eb, 0x0891b2, 0xea580c, 0x2563eb];
  const lineWidths = [1.3, 0.9, 1.1, 0.7, 1.2, 0.5];
  let lineIdx = 0;
  for (let y = 0.5; y >= -1.0; y -= 0.28) {
    const c = lineColors[lineIdx % lineColors.length];
    const w = lineWidths[lineIdx % lineWidths.length];
    const lMat = new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.1,
      roughness: 0.5,
    });
    const lineGeo = new THREE.BoxGeometry(w, 0.06, 0.018);
    const lineMesh = new THREE.Mesh(lineGeo, lMat);
    lineMesh.position.set(0.05 + (1.3 - w) * 0.2, y, 0.06);
    group.add(lineMesh);
    lineIdx++;
  }

  // Small colored thumbnail rectangle (like an image embed in a PDF)
  const thumbMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    emissive: 0x6366f1,
    emissiveIntensity: 0.15,
    roughness: 0.3,
  });
  const thumbGeo = new THREE.BoxGeometry(0.55, 0.45, 0.02);
  const thumbMesh = new THREE.Mesh(thumbGeo, thumbMat);
  thumbMesh.position.set(-0.32, -0.65, 0.06);
  group.add(thumbMesh);

  group.scale.setScalar(0.95);
  return group;
}

// ============================================================================
// 5. JEWEL-TONE MULTI-COLORED DICE — Rounded Cube, Rainbow Face Pips
//    Each face has a distinct jewel color. Pips glow. Continuous tumble.
// ============================================================================
export function createRedDiceModel() {
  const group = new THREE.Group();

  // Face colors — one vivid jewel tone per face
  const faceColors = {
    front:  0x6366f1,  // Indigo
    back:   0xec4899,  // Pink
    top:    0x14b8a6,  // Teal
    bottom: 0xf59e0b,  // Amber
    right:  0x8b5cf6,  // Violet
    left:   0xef4444,  // Red
  };

  // Rounded cube via subdivided box + vertex-sphere-projection
  const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 12, 12, 12);
  const pos = cubeGeo.attributes.position;
  const roundRadius = 0.18;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const half = 0.75;
    // Clamp to inner cube, then push outward by roundRadius
    const cx = Math.max(-half + roundRadius, Math.min(half - roundRadius, x));
    const cy = Math.max(-half + roundRadius, Math.min(half - roundRadius, y));
    const cz = Math.max(-half + roundRadius, Math.min(half - roundRadius, z));
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len > 0.001) {
      const scale = roundRadius / len;
      x = cx + dx * scale;
      y = cy + dy * scale;
      z = cz + dz * scale;
    }
    pos.setXYZ(i, x, y, z);
  }
  cubeGeo.computeVertexNormals();

  // Apply per-face colors via vertex colors
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const nx = cubeGeo.attributes.normal.getX(i);
    const ny = cubeGeo.attributes.normal.getY(i);
    const nz = cubeGeo.attributes.normal.getZ(i);
    const anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz);
    let hex;
    if (anz >= anx && anz >= any) {
      hex = nz > 0 ? faceColors.front : faceColors.back;
    } else if (any >= anx && any >= anz) {
      hex = ny > 0 ? faceColors.top : faceColors.bottom;
    } else {
      hex = nx > 0 ? faceColors.right : faceColors.left;
    }
    const col = new THREE.Color(hex);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  cubeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const cubeMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  });
  const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
  group.add(cubeMesh);

  // Pip material — bright white with subtle glow
  const pipMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.45,
    roughness: 0.1,
    metalness: 0.05,
  });

  const pipGeo = new THREE.SphereGeometry(0.12, 16, 16);
  pipGeo.scale(1, 1, 0.45);

  const addPip = (x, y, z, rotX = 0, rotY = 0) => {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(x, y, z);
    pip.rotation.set(rotX, rotY, 0);
    group.add(pip);
  };

  const d = 0.38;
  const o = 0.76;

  // Face 1 (Front: +Z) — 1 pip
  addPip(0, 0, o);

  // Face 6 (Back: -Z) — 6 pips
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
// 6. CARD 3D VIEWER — Isolated mini-viewport with rich idle + hover animations
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // ── Rich studio lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff5e1, 2.4);
    keyLight.position.set(4, 5, 5);
    this.scene.add(keyLight);

    // Cool fill light (blue rim)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-3, 2, 4);
    this.scene.add(fillLight);

    // Accent point light from below — warm amber bounce
    const bounceLight = new THREE.PointLight(0xfbbf24, 1.0, 12);
    bounceLight.position.set(0, -4, 3);
    this.scene.add(bounceLight);

    // Blue rim light
    const rimLight = new THREE.PointLight(0x60a5fa, 1.4, 15);
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

    // Hover interaction tied to the parent card
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
    const t = this.clock.getElapsedTime();

    // Smooth mouse follow
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.10;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.10;

    if (!this.model) return;

    if (this.options.isPaperclipPin) {
      const baseZ = -0.35;
      this.model.rotation.z = baseZ + (this.isHovered ? this.mouseX * 0.2 : Math.sin(t * 1.5) * 0.03);
      this.model.rotation.y = this.isHovered ? this.mouseX * 0.3 : 0;
    } else {
      // Shared: gentle floating bob for all models
      const bob = Math.sin(t * 1.8) * 0.04;
      const sway = Math.cos(t * 1.2) * 0.03;

      switch (this.modelType) {
        case 'clapperboard': {
          // Gentle idle sway + mouse tilt + clap on hover
          this.model.rotation.y = this.mouseX * 0.5 + sway + Math.sin(t * 1.2) * 0.06;
          this.model.rotation.x = -this.mouseY * 0.4 + 0.1 + bob * 0.5;
          this.model.position.y = bob;

          if (this.model.userData.topStick) {
            // On hover: rapid satisfying clap-clap; idle: gentle breathing
            const targetAngle = this.isHovered
              ? 0.08 + Math.sin(t * 7) * 0.18
              : 0.35 + Math.sin(t * 1.5) * 0.05;
            this.model.userData.topStick.rotation.z +=
              (targetAngle - this.model.userData.topStick.rotation.z) * 0.18;
          }
          break;
        }

        case 'scissors': {
          // Smooth orbiting + mouse tilt + snip animation
          this.model.rotation.y = this.mouseX * 0.6 + Math.sin(t * 1.3) * 0.08;
          this.model.rotation.x = -this.mouseY * 0.5 + bob * 0.3;
          this.model.position.y = bob;

          if (this.model.userData.leftHalf && this.model.userData.rightHalf) {
            // Hover: fast snip-snip; Idle: slow breathing open/close
            const snipAngle = this.isHovered
              ? 0.08 + Math.sin(t * 9) * 0.18
              : 0.22 + Math.sin(t * 1.6) * 0.06;
            this.model.userData.leftHalf.rotation.z = snipAngle;
            this.model.userData.rightHalf.rotation.z = -snipAngle;
          }
          break;
        }

        case 'curled_paper': {
          // Floating page with gentle flutter
          this.model.rotation.y = this.mouseX * 0.5 + Math.sin(t * 1.0) * 0.05;
          this.model.rotation.x = -this.mouseY * 0.4 + Math.sin(t * 0.8) * 0.03;
          this.model.rotation.z = Math.sin(t * 0.7) * 0.04;
          this.model.position.y = bob * 1.2;
          // Slight scale pulse on hover
          const s = this.isHovered ? 0.98 + Math.sin(t * 3) * 0.02 : 0.95;
          this.model.scale.setScalar(s);
          break;
        }

        case 'red_dice': {
          // Continuous gentle tumble, accelerates on hover
          const speed = this.isHovered ? 2.2 : 0.45;
          this.model.rotation.x += delta * speed;
          this.model.rotation.y += delta * speed * 1.3;
          // Mouse nudge on hover
          if (this.isHovered) {
            this.model.rotation.z = this.mouseX * 0.5;
          }
          this.model.position.y = bob;
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
