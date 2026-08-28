// Haven / Media Studio - Interactive Three.js Procedural Ambient Layer (img2threejs technique)

export class HeroThreeScene {
  constructor() {
    this.canvas = document.getElementById('hero-three-canvas');
    if (!this.canvas || typeof THREE === 'undefined') return;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
  }

  init() {
    // 1. Scene, Camera & Renderer
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 30;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 2. Iluminação Ambiente & Luz Dourada de Pôr do Sol
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.9);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffaa44, 1.8);
    sunLight.position.set(20, 30, 20);
    this.scene.add(sunLight);

    const rimLight = new THREE.PointLight(0x60a5fa, 1.2, 50);
    rimLight.position.set(-15, -10, 10);
    this.scene.add(rimLight);

    // 3. Sistema Procedural de Partículas Douradas (Pólen & Brilho Alpino)
    this.createPollenParticles();

    // 4. Emblema 3D Flutuante Prismático (Compass Emblem)
    this.createFloatingEmblem();

    // 5. Event Listeners
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 6. Loop de Animação
    this.clock = new THREE.Clock();
    this.animate();
  }

  createPollenParticles() {
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const speedOffsets = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribui em uma caixa 3D ao redor da câmera
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      scales[i] = Math.random() * 0.8 + 0.3;

      speedOffsets[i * 3] = (Math.random() - 0.5) * 0.02;
      speedOffsets[i * 3 + 1] = Math.random() * 0.03 + 0.01; // Sobe suavemente
      speedOffsets[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    this.particleSpeeds = speedOffsets;

    // Shader / Material suave para partículas circulares brilhantes
    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = 64;
    canvasTexture.height = 64;
    const ctx = canvasTexture.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 230, 160, 1)');
    grad.addColorStop(0.3, 'rgba(255, 180, 70, 0.6)');
    grad.addColorStop(0.7, 'rgba(255, 150, 40, 0.15)');
    grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvasTexture);

    const material = new THREE.PointsMaterial({
      size: 1.4,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createFloatingEmblem() {
    // Grupo do emblema 3D que acompanha o mouse
    this.emblemGroup = new THREE.Group();

    // 1. Núcleo Prismático Octaédrico (estilo Joia / Prisma de Cristal)
    const coreGeometry = new THREE.OctahedronGeometry(1.6, 0);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 1.2,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    this.emblemCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.emblemGroup.add(this.emblemCore);

    // 2. Anel Orbital Dourado
    const ringGeometry = new THREE.TorusGeometry(2.4, 0.06, 16, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.emblemRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.emblemRing.rotation.x = Math.PI / 3;
    this.emblemGroup.add(this.emblemRing);

    // 3. Segundo Anel Delicado
    const ring2Geometry = new THREE.TorusGeometry(2.8, 0.03, 16, 64);
    const ring2Material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.3,
    });
    this.emblemRing2 = new THREE.Mesh(ring2Geometry, ring2Material);
    this.emblemRing2.rotation.y = Math.PI / 4;
    this.emblemGroup.add(this.emblemRing2);

    // Posiciona no canto superior direito sutil
    this.emblemGroup.position.set(16, 7, -5);
    this.scene.add(this.emblemGroup);
  }

  onMouseMove(e) {
    // Coordenadas normalizadas de -1 a 1
    this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Interpolação suave do mouse (Parallax)
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // 1. Atualização do Emblema Prismático
    if (this.emblemGroup) {
      this.emblemGroup.rotation.y = elapsedTime * 0.4 + this.mouseX * 0.8;
      this.emblemGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 + this.mouseY * 0.5;
      this.emblemCore.rotation.z = elapsedTime * 0.2;
      this.emblemRing.rotation.z = -elapsedTime * 0.3;
      this.emblemRing2.rotation.x = elapsedTime * 0.25;

      // Leve flutuação vertical orgânica
      this.emblemGroup.position.y = 7 + Math.sin(elapsedTime * 0.8) * 0.4;
    }

    // 2. Movimento orgânico das partículas de pólen
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Movimento vertical contínuo
        positions[i3 + 1] += this.particleSpeeds[i3 + 1];

        // Oscilação lateral por vento + influência do mouse
        positions[i3] += Math.sin(elapsedTime + i) * 0.015 + this.mouseX * 0.02;
        positions[i3 + 2] += Math.cos(elapsedTime * 0.8 + i) * 0.015;

        // Se passar do teto da tela, reaparece no fundo
        if (positions[i3 + 1] > 20) {
          positions[i3 + 1] = -20;
          positions[i3] = (Math.random() - 0.5) * 50;
        }
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.y = this.mouseX * 0.15;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
