// FramerTool - Interactive Procedural 3D Logo (Three.js)

export class LogoThreeScene {
  constructor() {
    this.canvas = document.getElementById('logo-three-canvas');
    if (!this.canvas || typeof THREE === 'undefined') return;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.isHovered = false;

    this.init();
  }

  init() {
    // 1. Scene, Camera & Renderer
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.z = 7;

    const size = 36;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });

    this.renderer.setSize(size, size);
    this.renderer.setPixelRatio(dpr);

    // 2. Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf59e0b, 2.5); // Amber
    keyLight.position.set(5, 5, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 2.0); // Indigo
    rimLight.position.set(-5, -5, -5);
    this.scene.add(rimLight);

    // 3. Geometria Procedural do Logo FramerTool (Nested 3D Frame Shutter)
    this.logoGroup = new THREE.Group();

    // Frame Exterior (Dourado / Titânio escovado)
    const outerFrameGeo = new THREE.BoxGeometry(2.4, 2.4, 0.4);
    const outerFrameEdges = new THREE.EdgesGeometry(outerFrameGeo);
    const outerFrameMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2,
    });
    this.outerFrame = new THREE.LineSegments(outerFrameEdges, outerFrameMat);
    this.logoGroup.add(this.outerFrame);

    // Frame Interior Rotacionado (Abertura de lente / Prisma)
    const innerFrameGeo = new THREE.OctahedronGeometry(1.2, 0);
    const innerFrameMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.8,
      ior: 1.5,
      clearcoat: 1.0,
      reflectivity: 0.8,
    });
    this.innerMesh = new THREE.Mesh(innerFrameGeo, innerFrameMat);
    this.logoGroup.add(this.innerMesh);

    // Anel Central Indicador
    const ringGeo = new THREE.TorusGeometry(1.5, 0.08, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.logoGroup.add(this.ring);

    this.scene.add(this.logoGroup);

    // 4. Interação com o Mouse / Hover
    const navItem = this.canvas.closest('a') || this.canvas;
    navItem.addEventListener('mouseenter', () => (this.isHovered = true));
    navItem.addEventListener('mouseleave', () => (this.isHovered = false));

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      this.targetMouseX = (e.clientX - cx) / (window.innerWidth / 2);
      this.targetMouseY = (e.clientY - cy) / (window.innerHeight / 2);
    });

    // 5. Render Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;

    const rotSpeed = this.isHovered ? 2.5 : 0.8;

    if (this.logoGroup) {
      this.logoGroup.rotation.y += delta * rotSpeed;
      this.logoGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2 + this.mouseY * 0.5;
      this.logoGroup.rotation.z = this.mouseX * 0.5;

      this.innerMesh.rotation.y = -elapsedTime * 1.2;
      this.innerMesh.rotation.z = elapsedTime * 0.8;
      this.ring.rotation.x = Math.PI / 3 + Math.sin(elapsedTime) * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
