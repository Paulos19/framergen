// FramerTool - Interactive 3D Aquatic Fluid Surface & Droplet Engine (Three.js / WebGL)
// Features: Mouse wave ripples, spring-elastic droplets, splash return impact, and scroll overflow transition.

export class FluidEngineBackground {
  constructor() {
    this.container = document.getElementById('engines-fluid-container');
    this.canvas = document.getElementById('fluid-engines-canvas');
    if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

    this.mouse = { x: 0.5, y: 0.5, vx: 0, vy: 0, prevX: 0.5, prevY: 0.5, isHovering: false };
    this.droplets = [];
    this.ripples = [];
    this.scrollProgress = 0;

    this.init();
  }

  init() {
    // 1. Three.js Scene, Camera & Renderer
    this.scene = new THREE.Scene();

    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 20;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(dpr);

    // 2. Iluminação Aquática & Cáusticos
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(10, 20, 15);
    this.scene.add(sunLight);

    const deepBlueLight = new THREE.PointLight(0x0284c7, 3.0, 40);
    deepBlueLight.position.set(-10, -10, 10);
    this.scene.add(deepBlueLight);

    // 3. Malha Deformável da Superfície da Água (Plane with High Subdivision)
    this.createWaterSurface();

    // 4. Sistema de Gotas Elásticas Interativas
    this.createDropletsPool();

    // 5. Event Listeners (Mouse & Scroll)
    this.setupInteractions();

    // 6. Loop de Renderização
    this.clock = new THREE.Clock();
    this.animate();
  }

  createWaterSurface() {
    // Malha 3D de alta densidade para simular ondas e deformação
    const segX = 80;
    const segY = 50;
    this.waterGeo = new THREE.PlaneGeometry(36, 24, segX, segY);

    // Salva posições originais para deformação elástica
    this.originalPos = this.waterGeo.attributes.position.array.slice();

    // Material Aquático Físico Profundo
    this.waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.15,
      transmission: 0.45,
      ior: 1.333, // Índice de refração da água
      thickness: 2.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      sheen: 0.5,
      sheenColor: new THREE.Color(0x38bdf8),
    });

    this.waterMesh = new THREE.Mesh(this.waterGeo, this.waterMat);
    this.waterMesh.position.z = -1;
    this.scene.add(this.waterMesh);
  }

  createDropletsPool() {
    this.dropletsGroup = new THREE.Group();
    const dropletGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      transmission: 0.8,
      ior: 1.333,
      clearcoat: 1.0,
      thickness: 0.8,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xffffff),
    });

    // Pool de 14 gotas dinâmicas
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(dropletGeo, dropletMat);
      mesh.visible = false;
      mesh.scale.setScalar(Math.random() * 0.5 + 0.7);
      this.dropletsGroup.add(mesh);
      this.droplets.push({
        mesh,
        x: 0, y: 0, z: 0,
        targetX: 0, targetY: 0,
        vx: 0, vy: 0, vz: 0,
        active: false,
        life: 0,
        maxLife: 1.0,
        detached: false,
        size: Math.random() * 0.4 + 0.6,
      });
    }

    this.scene.add(this.dropletsGroup);
  }

  setupInteractions() {
    // Resize Listener
    window.addEventListener('resize', () => this.onResize());

    // Mouse Move & Hover no Container Azul
    this.container.addEventListener('mouseenter', () => {
      this.mouse.isHovering = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.isHovering = false;
      // Retorna todas as gotas soltas com impacto na água
      this.droplets.forEach(d => {
        if (d.active) {
          this.triggerSplash(d.x, d.y, 1.2);
          d.active = false;
          d.mesh.visible = false;
        }
      });
    });

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;

      this.mouse.vx = (rawX - this.mouse.prevX) * 25;
      this.mouse.vy = (rawY - this.mouse.prevY) * 25;

      this.mouse.prevX = rawX;
      this.mouse.prevY = rawY;

      // Coordenadas 3D do mundo (-16 a 16 em X, -10 a 10 em Y)
      this.mouse.x = (rawX - 0.5) * 32;
      this.mouse.y = -(rawY - 0.5) * 20;

      // Cria ondulação na superfície
      this.addRipple(this.mouse.x, this.mouse.y, Math.min(2.5, Math.hypot(this.mouse.vx, this.mouse.vy)));

      // Desprende gotas se houver movimento rápido
      if (Math.hypot(this.mouse.vx, this.mouse.vy) > 0.8) {
        this.spawnDroplet(this.mouse.x, this.mouse.y, this.mouse.vx, this.mouse.vy);
      }
    });

    // Scroll Listener para o Efeito de Transbordo
    window.addEventListener('scroll', () => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      const winH = window.innerHeight;

      // Progresso conforme o container passa pelo viewport
      const totalDist = rect.height + winH;
      const current = winH - rect.top;
      this.scrollProgress = Math.max(0, Math.min(1, current / totalDist));

      // Deformação da próxima seção ao transbordar
      this.updateOverflowEffect();
    }, { passive: true });
  }

  addRipple(x, y, strength = 1.0) {
    this.ripples.push({
      x, y,
      radius: 0.1,
      maxRadius: 8.0,
      strength: strength * 0.6,
      age: 0,
    });
    if (this.ripples.length > 20) this.ripples.shift();
  }

  triggerSplash(x, y, force = 1.0) {
    this.addRipple(x, y, force * 2.0);
  }

  spawnDroplet(x, y, vx, vy) {
    const droplet = this.droplets.find(d => !d.active);
    if (!droplet) return;

    droplet.active = true;
    droplet.mesh.visible = true;
    droplet.x = x + (Math.random() - 0.5) * 0.8;
    droplet.y = y + (Math.random() - 0.5) * 0.8;
    droplet.z = 0.5;

    droplet.vx = vx * 0.25 + (Math.random() - 0.5) * 0.3;
    droplet.vy = -vy * 0.25 + (Math.random() - 0.5) * 0.3;
    droplet.vz = 0.8 + Math.random() * 0.5;

    droplet.life = 0;
    droplet.detached = false;
  }

  updateOverflowEffect() {
    // Efeito de transbordo pintando a próxima seção de azul suave
    const nextSection = document.getElementById('modules');
    const overflowOverlay = document.getElementById('fluid-overflow-overlay');

    if (overflowOverlay) {
      if (this.scrollProgress > 0.45) {
        const factor = Math.min(1, (this.scrollProgress - 0.45) / 0.4);
        overflowOverlay.style.opacity = factor;
        overflowOverlay.style.transform = `translateY(${factor * 20}px)`;
      } else {
        overflowOverlay.style.opacity = 0;
      }
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Atualiza as Ondulações (Ripples)
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += delta * 6.5;
      r.age += delta;
      r.strength *= 0.94;
      if (r.age > 2.0 || r.strength < 0.01) {
        this.ripples.splice(i, 1);
      }
    }

    // 2. Deformação Geométrica da Água (Vertices Displacement)
    const pos = this.waterGeo.attributes.position.array;
    const orig = this.originalPos;
    const count = pos.length / 3;

    // Efeito de transbordo (onda descendo no fundo da malha conforme o scroll)
    const overflowWave = Math.sin(this.scrollProgress * Math.PI) * 1.8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const vx = orig[i3];
      const vy = orig[i3 + 1];

      // Ondulação oceânica natural base
      let z = Math.sin(vx * 0.3 + time * 1.8) * Math.cos(vy * 0.3 + time * 1.5) * 0.25;
      z += Math.sin(vx * 0.6 - time * 2.2) * 0.12;

      // Influência do Mouse Hover (Deformação fluida sob o cursor)
      if (this.mouse.isHovering) {
        const dx = vx - this.mouse.x;
        const dy = vy - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6.0) {
          const falloff = Math.cos((dist / 6.0) * Math.PI * 0.5);
          z += Math.sin(dist * 2.0 - time * 8.0) * falloff * 0.6;
        }
      }

      // Influência das Ondulações de Impacto (Ripples)
      for (let j = 0; j < this.ripples.length; j++) {
        const rip = this.ripples[j];
        const dist = Math.hypot(vx - rip.x, vy - rip.y);
        const diff = dist - rip.radius;
        if (Math.abs(diff) < 1.5) {
          z += Math.cos(diff * 2.5) * rip.strength * (1.0 - rip.radius / rip.maxRadius);
        }
      }

      // Influência do Scroll Overflow na base
      if (vy < -4.0) {
        const bottomFactor = (-vy - 4.0) / 6.0;
        z -= overflowWave * bottomFactor * 0.8;
      }

      pos[i3 + 2] = z;
    }

    this.waterGeo.attributes.position.needsUpdate = true;
    this.waterGeo.computeVertexNormals();

    // 3. Atualização das Gotas Flutuantes e Elásticas
    this.droplets.forEach(d => {
      if (!d.active) return;

      d.life += delta;

      // Movimento balístico com atração elástica de retorno para o mouse/poça
      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;

      // Gravidade e atração de volta para a poça
      d.vz -= delta * 3.5;

      // Força de atração suave em direção ao cursor (elástica)
      if (this.mouse.isHovering && !d.detached) {
        const targetDX = this.mouse.x - d.x;
        const targetDY = this.mouse.y - d.y;
        d.vx += targetDX * delta * 2.5;
        d.vy += targetDY * delta * 2.5;

        // Se afastar demais, rompe a tensão superficial e descola
        if (Math.hypot(targetDX, targetDY) > 8.0) {
          d.detached = true;
        }
      }

      // Colisão de retorno na poça de água (Z <= 0)
      if (d.z <= 0.1 && d.vz < 0) {
        this.triggerSplash(d.x, d.y, Math.abs(d.vz) * 0.8);
        d.active = false;
        d.mesh.visible = false;
      } else {
        d.mesh.position.set(d.x, d.y, d.z);
        // Deformação em gota de água (esticamento conforme a velocidade)
        const speed = Math.hypot(d.vx, d.vy, d.vz);
        d.mesh.scale.set(d.size, d.size * (1.0 + speed * 0.8), d.size);
        d.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d.vx, d.vy, d.vz).normalize());
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

export function initFluidEngine() {
  return new FluidEngineBackground();
}
