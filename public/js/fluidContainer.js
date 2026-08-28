// FramerTool - Organic Liquid Ink Puddle & Interactive Droplets Engine
// Ultra-smooth 60fps, zero flicker, global mouse tracking, viscous surface tension, and organic fluid dripping transition.

export class FluidEngineBackground {
  constructor() {
    this.section = document.getElementById('engines');
    this.canvas = document.getElementById('fluid-engines-canvas');
    if (!this.section || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse tracking (Global na janela para não prender aos limites do card)
    this.mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      vx: 0,
      vy: 0,
      prevX: 0,
      prevY: 0,
      speed: 0,
      isNear: false,
    };

    // Coleções de física
    this.droplets = [];
    this.splashes = [];
    this.waveNodes = [];
    this.scrollRatio = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // 1. Inicializa nós de onda na borda superior e inferior da poça
    this.initWaveNodes();

    // 2. Rastreamento global do mouse (não preso ao card)
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), { passive: true });
    window.addEventListener('mouseleave', () => this.onMouseLeave());

    // 3. Rastreamento de Scroll para escorrimento
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();

    // 4. Inicia loop de renderização ultra-fluido
    this.lastTime = performance.now();
    this.animate();
  }

  resize() {
    if (!this.canvas || !this.section) return;
    const rect = this.section.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || 950;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.initWaveNodes();
  }

  initWaveNodes() {
    this.waveNodes = [];
    const nodeCount = 36;
    for (let i = 0; i <= nodeCount; i++) {
      this.waveNodes.push({
        x: (i / nodeCount) * this.width,
        y: 0,
        vy: 0,
        targetY: 0,
      });
    }
  }

  onMouseMove(e) {
    const rect = this.section.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    this.mouse.vx = curX - this.mouse.prevX;
    this.mouse.vy = curY - this.mouse.prevY;
    this.mouse.speed = Math.hypot(this.mouse.vx, this.mouse.vy);

    this.mouse.prevX = curX;
    this.mouse.prevY = curY;
    this.mouse.x = curX;
    this.mouse.y = curY;

    // Verifica se está na região da seção ou arredores próximos
    this.mouse.isNear = (curY >= -150 && curY <= this.height + 250 && curX >= -100 && curX <= this.width + 100);

    if (this.mouse.isNear) {
      // Perturbação de ondas ao mover o mouse
      this.disturbWaves(curX, this.mouse.speed);

      // Solta gotas se houver movimento
      if (this.mouse.speed > 8 && Math.random() < 0.65) {
        this.spawnDroplet(curX, curY, this.mouse.vx, this.mouse.vy);
      }
    }
  }

  onMouseLeave() {
    this.mouse.isNear = false;
    // Retorna todas as gotas soltas com impacto de splash
    this.droplets.forEach(d => {
      if (d.active) {
        this.triggerSplash(d.x, Math.min(this.height - 20, Math.max(20, d.y)), d.size * 1.5);
        d.active = false;
      }
    });
  }

  onScroll() {
    if (!this.section) return;
    const rect = this.section.getBoundingClientRect();
    const winH = window.innerHeight;
    const totalDist = rect.height + winH;
    const current = winH - rect.top;
    this.scrollRatio = Math.max(0, Math.min(1, current / totalDist));
  }

  disturbWaves(x, force) {
    const clampedForce = Math.min(force * 0.4, 25);
    this.waveNodes.forEach(node => {
      const dist = Math.abs(node.x - x);
      if (dist < 180) {
        const factor = Math.cos((dist / 180) * Math.PI * 0.5);
        node.vy += clampedForce * factor * (Math.random() > 0.5 ? 1 : -1);
      }
    });
  }

  spawnDroplet(x, y, vx, vy) {
    const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.6;
    const speed = Math.min(Math.hypot(vx, vy) * 0.55, 18);

    this.droplets.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 7 + 5,
      alpha: 1.0,
      active: true,
      tether: { x, y }, // Ponto de ancoragem elástica
      life: 0,
      maxLife: Math.random() * 60 + 50,
    });

    if (this.droplets.length > 35) this.droplets.shift();
  }

  triggerSplash(x, y, radius = 20) {
    this.splashes.push({
      x, y,
      radius: 4,
      maxRadius: radius * 3.5,
      alpha: 0.8,
      speed: 2.2,
    });
    if (this.splashes.length > 25) this.splashes.shift();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.updatePhysics(dt, now * 0.001);
    this.draw(now * 0.001);
  }

  updatePhysics(dt, time) {
    // 1. Atualização das Ondas (Spring Oscillation)
    const tension = 0.045;
    const dampening = 0.94;
    const spread = 0.25;

    for (let i = 0; i < this.waveNodes.length; i++) {
      const node = this.waveNodes[i];
      const force = -tension * node.y;
      node.vy += force;
      node.vy *= dampening;
      node.y += node.vy;
    }

    // Propagação lateral das ondas
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < this.waveNodes.length; i++) {
        if (i > 0) {
          const leftDiff = spread * (this.waveNodes[i - 1].y - this.waveNodes[i].y);
          this.waveNodes[i - 1].vy += leftDiff;
        }
        if (i < this.waveNodes.length - 1) {
          const rightDiff = spread * (this.waveNodes[i + 1].y - this.waveNodes[i].y);
          this.waveNodes[i + 1].vy += rightDiff;
        }
      }
    }

    // 2. Atualização das Gotas com Tensão Superficial e Retorno Elástico
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      if (!d.active) continue;

      d.life++;

      // Atração de retorno elástico em direção ao mouse ou ao corpo da poça
      if (this.mouse.isNear) {
        const dx = this.mouse.x - d.x;
        const dy = this.mouse.y - d.y;
        d.vx += dx * 0.035;
        d.vy += dy * 0.035;
      } else {
        // Gravidade e atração para o centro da poça
        d.vy += 0.45;
      }

      d.vx *= 0.93;
      d.vy *= 0.93;
      d.x += d.vx;
      d.y += d.vy;

      // Colisão / Retorno à poça com splash
      if (d.life > d.maxLife || d.y < 0 || d.y > this.height || d.x < 0 || d.x > this.width) {
        this.triggerSplash(Math.max(10, Math.min(this.width - 10, d.x)), Math.max(10, Math.min(this.height - 10, d.y)), d.size);
        this.droplets.splice(i, 1);
      }
    }

    // 3. Atualização dos Splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.radius += s.speed;
      s.alpha -= 0.022;
      if (s.alpha <= 0 || s.radius >= s.maxRadius) {
        this.splashes.splice(i, 1);
      }
    }
  }

  draw(time) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const w = this.width;
    const h = this.height;

    // 1. FORMA ORGÂNICA UNIFORME DA POÇA DE TINTA / ÁGUA (SEM LIMITES RETANGULARES)
    // Curva superior orgânica e curva inferior de escorrimento dinâmico
    this.ctx.save();

    this.ctx.beginPath();
    // Início no topo esquerdo com curvatura suave
    this.ctx.moveTo(0, 70);

    // Curva do Topo (Menisco Superior Fluido com Ondas)
    const topWaveAmp = 28;
    for (let i = 0; i < this.waveNodes.length; i++) {
      const node = this.waveNodes[i];
      const naturalWave = Math.sin((node.x / w) * Math.PI * 4 + time * 2) * 12;
      const waveY = 60 + node.y + naturalWave;
      this.ctx.lineTo(node.x, waveY);
    }

    // Lateral Direita
    this.ctx.lineTo(w, h - 80);

    // Curva Inferior com Efeito de Escorrimento / Transbordo (Drips & Viscous Curves)
    const overflowFactor = Math.sin(this.scrollRatio * Math.PI) * 60;
    
    // Goteiras e estalactites fluidas orgânicas na base
    const dripCount = 5;
    for (let i = dripCount; i >= 0; i--) {
      const nx = (i / dripCount) * w;
      const dripWave = Math.sin(i * 1.8 + time * 2.5) * (20 + overflowFactor);
      const bottomY = h - 40 + dripWave + overflowFactor;
      const ctrlX = nx - w / (dripCount * 2);
      const ctrlY = bottomY + 25 + overflowFactor * 0.5;
      this.ctx.quadraticCurveTo(ctrlX, ctrlY, nx - w / dripCount, bottomY);
    }

    // Lateral Esquerda de volta ao início
    this.ctx.lineTo(0, 70);
    this.ctx.closePath();

    // 2. GRADIENTE DE PROFUNDIDADE AQUÁTICA PROFUNDA & ILUMINAÇÃO
    const grad = this.ctx.createLinearGradient(0, 0, w * 0.6, h);
    grad.addColorStop(0, '#1d4ed8');   // Royal Blue
    grad.addColorStop(0.35, '#2563eb'); // Electric Blue
    grad.addColorStop(0.7, '#0284c7');  // Deep Sky Blue
    grad.addColorStop(1, '#0f172a');    // Deep Ocean Slate

    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = 'rgba(2, 132, 199, 0.45)';
    this.ctx.shadowBlur = 40;
    this.ctx.fill();
    this.ctx.restore();

    // 3. CÁUSTICOS E BRILHO DE SUPERFÍCIE LÍQUIDA
    this.ctx.save();
    // Brilho no topo do menisco
    const topGlow = this.ctx.createLinearGradient(0, 40, 0, 180);
    topGlow.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    topGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
    topGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = topGlow;
    this.ctx.fillRect(0, 30, w, 150);

    // Reflexo de Luz Cáustica Dinâmica próxima ao Mouse
    if (this.mouse.isNear) {
      const mouseGlow = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, 220
      );
      mouseGlow.addColorStop(0, 'rgba(186, 230, 254, 0.35)');
      mouseGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
      mouseGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      this.ctx.fillStyle = mouseGlow;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 220, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 4. DESENHO DOS IMPACTOS DE SPLASH (ONDULAÇÕES CONCÊNTRICAS)
    this.splashes.forEach(s => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(186, 230, 254, ${s.alpha})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius * 0.65, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${s.alpha * 0.6})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();
    });

    // 5. DESENHO DAS GOTAS ELÁSTICAS FLUTUANTES (3D WATER DROPLETS)
    this.droplets.forEach(d => {
      this.ctx.save();
      
      // Conexão de tensão superficial se estiver perto do mouse (tendão elástico)
      if (this.mouse.isNear) {
        const dist = Math.hypot(this.mouse.x - d.x, this.mouse.y - d.y);
        if (dist < 120) {
          const tetherAlpha = (1 - dist / 120) * 0.45;
          this.ctx.beginPath();
          this.ctx.moveTo(d.x, d.y);
          this.ctx.quadraticCurveTo(
            (d.x + this.mouse.x) / 2 + d.vx * 2,
            (d.y + this.mouse.y) / 2 + d.vy * 2,
            this.mouse.x, this.mouse.y
          );
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${tetherAlpha})`;
          this.ctx.lineWidth = Math.max(1, (1 - dist / 120) * (d.size * 0.6));
          this.ctx.stroke();
        }
      }

      // Corpo da Gota com Sombra e Brilho Esférico
      this.ctx.beginPath();
      const speed = Math.hypot(d.vx, d.vy);
      const stretch = Math.min(speed * 0.25, 2.0);
      const angle = Math.atan2(d.vy, d.vx);

      this.ctx.translate(d.x, d.y);
      this.ctx.rotate(angle);
      this.ctx.ellipse(0, 0, d.size * (1 + stretch), d.size, 0, 0, Math.PI * 2);

      const dropGrad = this.ctx.createRadialGradient(-d.size * 0.3, -d.size * 0.3, 0, 0, 0, d.size);
      dropGrad.addColorStop(0, '#ffffff');
      dropGrad.addColorStop(0.3, '#38bdf8');
      dropGrad.addColorStop(0.8, '#0284c7');
      dropGrad.addColorStop(1, '#1e40af');

      this.ctx.fillStyle = dropGrad;
      this.ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();

      // Ponto de brilho especular branco no topo da gota
      this.ctx.beginPath();
      this.ctx.arc(-d.size * 0.35, -d.size * 0.35, d.size * 0.28, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fill();

      this.ctx.restore();
    });
  }
}

export function initFluidEngine() {
  return new FluidEngineBackground();
}
