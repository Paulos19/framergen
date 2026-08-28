// FramerTool - Full Section 3D Aquatic Fluid Mesh & Droplet Engine (Three.js / WebGL)
// The fluid puddle covers the entire section background, deforms under mouse hover, throws spring droplets, and overflows into the next section on scroll.

export class FluidEngineBackground {
  constructor() {
    this.section = document.getElementById('engines');
    this.canvas = document.getElementById('fluid-engines-canvas');
    if (!this.section || !this.canvas || typeof THREE === 'undefined') return;

    this.mouse = { x: 0, y: 0, vx: 0, vy: 0, prevX: 0, prevY: 0, isHovering: false };
    this.droplets = [];
    this.ripples = [];
    this.scrollProgress = 0;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const rect = this.section.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || 900;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 24;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(dpr);

    // Aquatic Lighting & Deep Caustics
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(15, 25, 20);
    this.scene.add(sunLight);

    const blueGlow = new THREE.PointLight(0x0284c7, 3.5, 50);
    blueGlow.position.set(-15, -10, 12);
    this.scene.add(blueGlow);

    // 1. Malha Tridimensional Deformável de Fluido (Full Background)
    this.createWaterSurface();

    // 2. Sistema de Gotas Elásticas
    this.createDropletsPool();

    // 3. Interações de Mouse e Scroll
    this.setupInteractions();

    // 4. Render Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  createWaterSurface() {
    const segX = 90;
    const segY = 60;
    this.waterGeo = new THREE.PlaneGeometry(50, 32, segX, segY);
    this.originalPos = this.waterGeo.attributes.position.array.slice();

    // Material de Tinta / Água Profunda Azul
    this.waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.35,
      ior: 1.333,
      thickness: 2.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      sheen: 0.6,
      sheenColor: new THREE.Color(0x38bdf8),
    });

    this.waterMesh = new THREE.Mesh(this.waterGeo, this.waterMat);
    this.waterMesh.position.z = -2;
    this.scene.add(this.waterMesh);
  }

  createDropletsPool() {
    this.dropletsGroup = new THREE.Group();
    const dropletGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      transmission: 0.85,
      ior: 1.333,
      clearcoat: 1.0,
      thickness: 0.8,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xffffff),
    });

    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(dropletGeo, dropletMat);
      mesh.visible = false;
      this.dropletsGroup.add(mesh);
      this.droplets.push({
        mesh,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        active: false,
        detached: false,
        size: Math.random() * 0.4 + 0.7,
      });
    }

    this.scene.add(this.dropletsGroup);
  }

  setupInteractions() {
    window.addEventListener('resize', () => this.onResize());

    this.section.addEventListener('mouseenter', () => {
      this.mouse.isHovering = true;
    });

    this.section.addEventListener('mouseleave', () => {
      this.mouse.isHovering = false;
      this.droplets.forEach(d => {
        if (d.active) {
          this.triggerSplash(d.x, d.y, 1.2);
          d.active = false;
          d.mesh.visible = false;
        }
      });
    });

    this.section.addEventListener('mousemove', (e) => {
      const rect = this.section.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;

      this.mouse.vx = (rawX - this.mouse.prevX) * 35;
      this.mouse.vy = (rawY - this.mouse.prevY) * 35;

      this.mouse.prevX = rawX;
      this.mouse.prevY = rawY;

      // Coordenadas 3D relativas
      this.mouse.x = (rawX - 0.5) * 44;
      this.mouse.y = -(rawY - 0.5) * 28;

      // Ondulação
      this.addRipple(this.mouse.x, this.mouse.y, Math.min(3.0, Math.hypot(this.mouse.vx, this.mouse.vy)));

      // Solta gotas se houver aceleração
      if (Math.hypot(this.mouse.vx, this.mouse.vy) > 0.65) {
        this.spawnDroplet(this.mouse.x, this.mouse.y, this.mouse.vx, this.mouse.vy);
      }
    });

    window.addEventListener('scroll', () => {
      if (!this.section) return;
      const rect = this.section.getBoundingClientRect();
      const winH = window.innerHeight;
      const totalDist = rect.height + winH;
      const current = winH - rect.top;
      this.scrollProgress = Math.max(0, Math.min(1, current / totalDist));
      this.updateOverflowEffect();
    }, { passive: true });
  }

  addRipple(x, y, strength = 1.0) {
    this.ripples.push({
      x, y,
      radius: 0.1,
      maxRadius: 10.0,
      strength: strength * 0.7,
      age: 0,
    });
    if (this.ripples.length > 25) this.ripples.shift();
  }

  triggerSplash(x, y, force = 1.0) {
    this.addRipple(x, y, force * 2.2);
  }

  spawnDroplet(x, y, vx, vy) {
    const droplet = this.droplets.find(d => !d.active);
    if (!droplet) return;

    droplet.active = true;
    droplet.mesh.visible = true;
    droplet.x = x + (Math.random() - 0.5) * 0.8;
    droplet.y = y + (Math.random() - 0.5) * 0.8;
    droplet.z = 0.5;

    droplet.vx = vx * 0.28 + (Math.random() - 0.5) * 0.4;
    droplet.vy = -vy * 0.28 + (Math.random() - 0.5) * 0.4;
    droplet.vz = 0.9 + Math.random() * 0.6;
    droplet.detached = false;
  }

  updateOverflowEffect() {
    const overflowOverlay = document.getElementById('fluid-overflow-overlay');
    if (overflowOverlay) {
      if (this.scrollProgress > 0.4) {
        const factor = Math.min(1, (this.scrollProgress - 0.4) / 0.45);
        overflowOverlay.style.opacity = factor;
        overflowOverlay.style.transform = `translateY(${factor * 30}px)`;
      } else {
        overflowOverlay.style.opacity = 0;
      }
    }
  }

  onResize() {
    if (!this.section || !this.renderer || !this.camera) return;
    const rect = this.section.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || 900;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Atualização dos Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += delta * 7.5;
      r.age += delta;
      r.strength *= 0.94;
      if (r.age > 2.2 || r.strength < 0.01) {
        this.ripples.splice(i, 1);
      }
    }

    // 2. Deformação Ondulatória e Transbordo
    const pos = this.waterGeo.attributes.position.array;
    const orig = this.originalPos;
    const count = pos.length / 3;
    const overflowWave = Math.sin(this.scrollProgress * Math.PI) * 2.2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const vx = orig[i3];
      const vy = orig[i3 + 1];

      let z = Math.sin(vx * 0.25 + time * 1.6) * Math.cos(vy * 0.25 + time * 1.4) * 0.35;
      z += Math.sin(vx * 0.5 - time * 2.0) * 0.15;

      if (this.mouse.isHovering) {
        const dx = vx - this.mouse.x;
        const dy = vy - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 8.0) {
          const falloff = Math.cos((dist / 8.0) * Math.PI * 0.5);
          z += Math.sin(dist * 1.8 - time * 7.0) * falloff * 0.8;
        }
      }

      for (let j = 0; j < this.ripples.length; j++) {
        const rip = this.ripples[j];
        const dist = Math.hypot(vx - rip.x, vy - rip.y);
        const diff = dist - rip.radius;
        if (Math.abs(diff) < 2.0) {
          z += Math.cos(diff * 2.0) * rip.strength * (1.0 - rip.radius / rip.maxRadius);
        }
      }

      // Transbordo na parte inferior
      if (vy < -6.0) {
        const bottomFactor = (-vy - 6.0) / 8.0;
        z -= overflowWave * bottomFactor * 1.2;
      }

      pos[i3 + 2] = z;
    }

    this.waterGeo.attributes.position.needsUpdate = true;
    this.waterGeo.computeVertexNormals();

    // 3. Atualização das Gotas Elásticas
    this.droplets.forEach(d => {
      if (!d.active) return;

      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;
      d.vz -= delta * 3.8;

      if (this.mouse.isHovering && !d.detached) {
        const targetDX = this.mouse.x - d.x;
        const targetDY = this.mouse.y - d.y;
        d.vx += targetDX * delta * 2.8;
        d.vy += targetDY * delta * 2.8;

        if (Math.hypot(targetDX, targetDY) > 10.0) {
          d.detached = true;
        }
      }

      if (d.z <= 0.1 && d.vz < 0) {
        this.triggerSplash(d.x, d.y, Math.abs(d.vz) * 0.85);
        d.active = false;
        d.mesh.visible = false;
      } else {
        d.mesh.position.set(d.x, d.y, d.z);
        const speed = Math.hypot(d.vx, d.vy, d.vz);
        d.mesh.scale.set(d.size, d.size * (1.0 + speed * 0.9), d.size);
        d.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d.vx, d.vy, d.vz).normalize());
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

export function initFluidEngine() {
  return new FluidEngineBackground();
}
