// FramerTool - Procedural 3D Paperclip (img2threejs technique)
// Rebuilds the stylized blue paperclip with continuous curve tube geometry, glossy PBR materials, and hover interactivity.

export function createPaperclipGeometry(tubeRadius = 0.11) {
  const curvePath = new THREE.CurvePath();

  // 1. Ponto de início (Perna Externa Esquerda - Baixo)
  const p0 = new THREE.Vector3(-0.55, -1.3, 0);
  const p1 = new THREE.Vector3(-0.55, 1.2, 0);
  curvePath.add(new THREE.LineCurve3(p0, p1));

  // 2. Arco Superior Externo (180 graus no topo, raio 0.55)
  const topCenter = new THREE.Vector3(0, 1.2, 0);
  const topPoints = [];
  for (let i = 0; i <= 20; i++) {
    const theta = Math.PI - (i / 20) * Math.PI;
    topPoints.push(new THREE.Vector3(
      topCenter.x + Math.cos(theta) * 0.55,
      topCenter.y + Math.sin(theta) * 0.55,
      0.01 * (i / 20)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(topPoints));

  // 3. Perna Externa Direita descendo até o fundo
  const p2 = new THREE.Vector3(0.55, 1.2, 0.01);
  const p3 = new THREE.Vector3(0.55, -1.2, 0.02);
  curvePath.add(new THREE.LineCurve3(p2, p3));

  // 4. Arco Inferior Externo (180 graus na base, raio 0.40)
  const botCenter = new THREE.Vector3(0.15, -1.2, 0.02);
  const botPoints = [];
  for (let i = 0; i <= 20; i++) {
    const theta = 0 - (i / 20) * Math.PI;
    botPoints.push(new THREE.Vector3(
      botCenter.x + Math.cos(theta) * 0.40,
      botCenter.y + Math.sin(theta) * 0.40,
      0.02 + 0.01 * (i / 20)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(botPoints));

  // 5. Perna Interna subindo
  const p4 = new THREE.Vector3(-0.25, -1.2, 0.03);
  const p5 = new THREE.Vector3(-0.25, 0.65, 0.04);
  curvePath.add(new THREE.LineCurve3(p4, p5));

  // 6. Arco Superior Interno (180 graus, raio 0.225)
  const inTopCenter = new THREE.Vector3(-0.025, 0.65, 0.04);
  const inTopPoints = [];
  for (let i = 0; i <= 20; i++) {
    const theta = Math.PI - (i / 20) * Math.PI;
    inTopPoints.push(new THREE.Vector3(
      inTopCenter.x + Math.cos(theta) * 0.225,
      inTopCenter.y + Math.sin(theta) * 0.225,
      0.04 + 0.01 * (i / 20)
    ));
  }
  curvePath.add(new THREE.CatmullRomCurve3(inTopPoints));

  // 7. Perna Interna Final descendo
  const p6 = new THREE.Vector3(0.20, 0.65, 0.05);
  const p7 = new THREE.Vector3(0.20, -0.45, 0.06);
  curvePath.add(new THREE.LineCurve3(p6, p7));

  const tubeGeo = new THREE.TubeGeometry(curvePath, 128, tubeRadius, 18, false);

  // Tampas esféricas para acabamento arredondado perfeito nas pontas
  const capStartGeo = new THREE.SphereGeometry(tubeRadius, 16, 16);
  capStartGeo.translate(p0.x, p0.y, p0.z);

  const capEndGeo = new THREE.SphereGeometry(tubeRadius, 16, 16);
  capEndGeo.translate(p7.x, p7.y, p7.z);

  return { tubeGeo, capStartGeo, capEndGeo, p0, p7 };
}

export function createPaperclipMaterial(colorHex = 0x0284c7) {
  // Material Satin Plastic / High-Gloss Blue como no template de referência
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    reflectivity: 0.85,
    ior: 1.52,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x38bdf8),
  });
}

export class InteractivePaperclip {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    if (!this.canvas || typeof THREE === 'undefined') return;

    this.options = Object.assign({
      color: 0x0284c7, // Sky blue padrão
      tiltAngle: -0.42, // Ângulo característico inclinado
      scale: 1.0,
      interactive: true,
      autoRotate: false,
    }, options);

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.isHovered = false;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 120;
    const height = rect.height || 160;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 6.2);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.4);
    fillLight.position.set(-5, -3, 3);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    rimLight.position.set(0, -4, 4);
    this.scene.add(rimLight);

    // Criação do Modelo 3D do Clipe
    this.clipGroup = new THREE.Group();

    const { tubeGeo, capStartGeo, capEndGeo } = createPaperclipGeometry(0.12);
    this.material = createPaperclipMaterial(this.options.color);

    const tubeMesh = new THREE.Mesh(tubeGeo, this.material);
    const cap1 = new THREE.Mesh(capStartGeo, this.material);
    const cap2 = new THREE.Mesh(capEndGeo, this.material);

    this.clipGroup.add(tubeMesh);
    this.clipGroup.add(cap1);
    this.clipGroup.add(cap2);

    // Aplica escala e inclinação padrão inspirada na imagem
    this.clipGroup.rotation.z = this.options.tiltAngle;
    this.clipGroup.scale.setScalar(this.options.scale);

    this.scene.add(this.clipGroup);

    // Eventos de Mouse
    if (this.options.interactive) {
      const parent = this.canvas.closest('.card-3d-tilt') || this.canvas;
      
      parent.addEventListener('mouseenter', () => {
        this.isHovered = true;
      });

      parent.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
      });

      parent.addEventListener('mousemove', (e) => {
        const cRect = parent.getBoundingClientRect();
        const cx = cRect.left + cRect.width / 2;
        const cy = cRect.top + cRect.height / 2;
        this.targetMouseX = (e.clientX - cx) / (cRect.width / 2);
        this.targetMouseY = (e.clientY - cy) / (cRect.height / 2);
      });
    }

    this.clock = new THREE.Clock();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

    if (this.clipGroup) {
      // Efeito de flutuação suave e rotação 3D ao passar o mouse
      const baseTilt = this.options.tiltAngle;
      
      if (this.isHovered) {
        this.clipGroup.rotation.z = baseTilt + this.mouseX * 0.4;
        this.clipGroup.rotation.y = this.mouseX * 0.6;
        this.clipGroup.rotation.x = -this.mouseY * 0.6;
        this.clipGroup.position.z = 0.3;
      } else {
        this.clipGroup.rotation.z = baseTilt + Math.sin(elapsedTime * 1.5) * 0.04;
        this.clipGroup.rotation.y = Math.sin(elapsedTime * 1.2) * 0.06;
        this.clipGroup.rotation.x = Math.cos(elapsedTime * 1.2) * 0.06;
        this.clipGroup.position.z = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Inicializador para todos os clipes 3D da página
export function initAllPaperclips() {
  const canvases = document.querySelectorAll('.paperclip-canvas-3d');
  const instances = [];

  const colors = [
    0x0284c7, // Sky Blue
    0x8b5cf6, // Violet
    0x10b981, // Emerald
    0xf59e0b, // Amber
  ];

  canvases.forEach((canvas, idx) => {
    const color = colors[idx % colors.length];
    const clip = new InteractivePaperclip(canvas, {
      color: color,
      scale: 1.15,
      tiltAngle: -0.38,
      interactive: true,
    });
    instances.push(clip);
  });

  return instances;
}
