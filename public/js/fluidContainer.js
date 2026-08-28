// FramerTool - 3D Aquatic Fluid Surface & Interactive Wave Wake Trail (Three.js WebGL)
// 60 FPS rock-solid, zero flicker, viscous mouse wake trail, elastic water droplets, and splash impacts.

export class FluidEngineBackground {
  constructor() {
    this.container = document.getElementById('engines-fluid-container') || document.getElementById('engines');
    this.canvas = document.getElementById('fluid-engines-canvas');
    if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

    this.mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      vx: 0,
      vy: 0,
      prevX: 0,
      prevY: 0,
      speed: 0,
      isHovering: false,
    };

    this.droplets = [];
    this.ripples = [];
    this.scrollProgress = 0;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || 750;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.z = 22;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(dpr);

    // 1. Studio Aquatic Lighting & Caustic Highlights
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(12, 22, 18);
    this.scene.add(sunLight);

    const blueLight = new THREE.PointLight(0x0284c7, 3.5, 45);
    blueLight.position.set(-12, -10, 12);
    this.scene.add(blueLight);

    const cyanRim = new THREE.PointLight(0x38bdf8, 2.0, 30);
    cyanRim.position.set(0, 12, 10);
    this.scene.add(cyanRim);

    // 2. Malha de Superfície Líquida 3D (Subdivision Plane)
    this.createWaterSurface();

    // 3. Sistema de Gotas Elásticas com Tensão Superficial
    this.createDropletsPool();

    // 4. Listeners de Interação (Mouse Wake & Scroll)
    this.setupInteractions();

    // 5. Loop de Renderização
    this.clock = new THREE.Clock();
    this.animate();
  }

  createWaterSurface() {
    const segX = 64;
    const segY = 40;
    this.waterGeo = new THREE.PlaneGeometry(38, 25, segX, segY);
    this.originalPos = new Float32Array(this.waterGeo.attributes.position.array);

    // Material Físico Aquático Realista
    this.waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.12,
      transmission: 0.45,
      ior: 1.333,
      thickness: 2.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95,
      sheen: 0.6,
      sheenColor: new THREE.Color(0x38bdf8),
    });

    this.waterMesh = new THREE.Mesh(this.waterGeo, this.waterMat);
    this.waterMesh.position.z = -1.5;
    this.scene.add(this.waterMesh);
  }

  createDropletsPool() {
    this.dropletsGroup = new THREE.Group();
    const dropletGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.06,
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
        size: Math.random() * 0.4 + 0.6,
      });
    }

    this.scene.add(this.dropletsGroup);
  }

  setupInteractions() {
    window.addEventListener('resize', () => this.onResize());

    // Rastreamento no Container do Card Azul
    this.container.addEventListener('mouseenter', () => {
      this.mouse.isHovering = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.isHovering = false;
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

      const vx = (rawX - this.mouse.prevX) * 35;
      const vy = (rawY - this.mouse.prevY) * 35;
      this.mouse.speed = Math.hypot(vx, vy);

      this.mouse.vx = vx;
      this.mouse.vy = vy;
      this.mouse.prevX = rawX;
      this.mouse.prevY = rawY;

      // Coordenadas 3D do mundo (-18 a 18 em X, -12 a 12 em Y)
      this.mouse.targetX = (rawX - 0.5) * 36;
      this.mouse.targetY = -(rawY - 0.5) * 23;

      // Cria ondas de rastro viscoso sob o cursor
      this.addRipple(this.mouse.targetX, this.mouse.targetY, Math.min(2.5, this.mouse.speed));

      // Solta gotas se houver aceleração rápida
      if (this.mouse.speed > 0.8) {
        this.spawnDroplet(this.mouse.targetX, this.mouse.targetY, vx, vy);
      }
    });

    // Scroll progress para o transbordo suave
    window.addEventListener('scroll', () => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
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
      maxRadius: 8.5,
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
    droplet.x = x + (Math.random() - 0.5) * 0.6;
    droplet.y = y + (Math.random() - 0.5) * 0.6;
    droplet.z = 0.5;

    droplet.vx = vx * 0.22 + (Math.random() - 0.5) * 0.3;
    droplet.vy = -vy * 0.22 + (Math.random() - 0.5) * 0.3;
    droplet.vz = 0.85 + Math.random() * 0.5;
    droplet.detached = false;
  }

  updateOverflowEffect() {
    const overflowOverlay = document.getElementById('fluid-overflow-overlay');
    if (overflowOverlay) {
      if (this.scrollProgress > 0.42) {
        const factor = Math.min(1, (this.scrollProgress - 0.42) / 0.4);
        overflowOverlay.style.opacity = factor;
        overflowOverlay.style.transform = `translateY(${factor * 22}px)`;
      } else {
        overflowOverlay.style.opacity = 0;
      }
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || 750;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height, false);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Suavização do movimento do mouse
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.2;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.2;

    // 1. Atualização dos Ripples do Rastro
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += delta * 6.5;
      r.age += delta;
      r.strength *= 0.94;
      if (r.age > 2.0 || r.strength < 0.01) {
        this.ripples.splice(i, 1);
      }
    }

    // 2. Deformação Ondulatória na Superfície da Água
    const pos = this.waterGeo.attributes.position.array;
    const orig = this.originalPos;
    const count = pos.length / 3;
    const overflowWave = Math.sin(this.scrollProgress * Math.PI) * 1.8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const vx = orig[i3];
      const vy = orig[i3 + 1];

      // Ondulação Orgânica Natural
      let z = Math.sin(vx * 0.28 + time * 1.6) * Math.cos(vy * 0.28 + time * 1.4) * 0.28;
      z += Math.sin(vx * 0.55 - time * 2.0) * 0.12;

      // Rastro Viscoso Sob o Mouse
      if (this.mouse.isHovering) {
        const dx = vx - this.mouse.x;
        const dy = vy - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6.5) {
          const falloff = Math.cos((dist / 6.5) * Math.PI * 0.5);
          z += Math.sin(dist * 1.8 - time * 7.5) * falloff * 0.7;
        }
      }

      // Propagação das Ondas (Ripples)
      for (let j = 0; j < this.ripples.length; j++) {
        const rip = this.ripples[j];
        const dist = Math.hypot(vx - rip.x, vy - rip.y);
        const diff = dist - rip.radius;
        if (Math.abs(diff) < 1.6) {
          z += Math.cos(diff * 2.2) * rip.strength * (1.0 - rip.radius / rip.maxRadius);
        }
      }

      // Deformação de Transbordo na Base
      if (vy < -4.5) {
        const bottomFactor = (-vy - 4.5) / 6.5;
        z -= overflowWave * bottomFactor * 0.9;
      }

      pos[i3 + 2] = z;
    }

    this.waterGeo.attributes.position.needsUpdate = true;

    // 3. Atualização das Gotas Elásticas Flutuantes
    this.droplets.forEach(d => {
      if (!d.active) return;

      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;
      d.vz -= delta * 3.5;

      // Força de atração elástica em direção ao cursor
      if (this.mouse.isHovering && !d.detached) {
        const targetDX = this.mouse.x - d.x;
        const targetDY = this.mouse.y - d.y;
        d.vx += targetDX * delta * 2.5;
        d.vy += targetDY * delta * 2.5;

        if (Math.hypot(targetDX, targetDY) > 8.5) {
          d.detached = true;
        }
      }

      // Impacto de retorno na água (Z <= 0.1)
      if (d.z <= 0.1 && d.vz < 0) {
        this.triggerSplash(d.x, d.y, Math.abs(d.vz) * 0.8);
        d.active = false;
        d.mesh.visible = false;
      } else {
        d.mesh.position.set(d.x, d.y, d.z);
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
