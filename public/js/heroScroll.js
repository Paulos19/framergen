// Haven / Media Studio - Scrolltelling Frame Scrubber Engine

const TOTAL_FRAMES = 240;
const FRAME_PATH = (index) => `/assets/frames/frame_${String(index).padStart(4, '0')}.jpg`;

export class HeroScrollTelling {
  constructor() {
    this.container = document.getElementById('hero-scroll-container');
    this.canvas = document.getElementById('hero-frames-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;

    this.images = [];
    this.loadedCount = 0;
    this.currentFrame = 1;
    this.targetFrame = 1;
    this.isRendering = false;

    // Text Beats
    this.beat1 = document.getElementById('hero-beat-1');
    this.beat2 = document.getElementById('hero-beat-2');
    this.beat3 = document.getElementById('hero-beat-3');
    this.skyTransition = document.getElementById('hero-sky-transition');
    this.scrollIndicator = document.getElementById('hero-scroll-indicator');

    if (this.canvas && this.container) {
      this.init();
    }
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Preload inicial do primeiro frame para exibição imediata
    this.preloadInitialFrame();

    // Preload progressivo de todos os 240 frames em segundo plano
    this.preloadAllFrames();

    // Listener de scroll otimizado com requestAnimationFrame
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Inicia loop de interpolação suave (lerp)
    this.startRenderLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }

    this.drawCurrentFrame();
  }

  preloadInitialFrame() {
    const img = new Image();
    img.src = FRAME_PATH(1);
    img.onload = () => {
      this.images[1] = img;
      this.drawCurrentFrame();
    };
  }

  preloadAllFrames() {
    // Carrega em lotes priorizando frames chave
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      if (!this.images[i]) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        img.onload = () => {
          this.images[i] = img;
          this.loadedCount++;
        };
      }
    }
  }

  onScroll() {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    const scrollableDistance = this.container.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;

    // Progresso normalizado de 0 a 1
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

    // Mapeia para o frame correspondente (1 a 240)
    const frameIndex = Math.floor(progress * (TOTAL_FRAMES - 1)) + 1;
    this.targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));

    // Atualiza opacidades e transformações dos textos conforme o progresso
    this.updateTextBeats(progress);
  }

  updateTextBeats(progress) {
    // Beat 1: "Design with ease." (0% a 25%)
    if (this.beat1) {
      if (progress <= 0.22) {
        const opacity = Math.max(0, 1 - progress / 0.20);
        const translateY = progress * -60;
        this.beat1.style.opacity = opacity;
        this.beat1.style.transform = `translateY(${translateY}px)`;
        this.beat1.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beat1.style.opacity = '0';
        this.beat1.style.pointerEvents = 'none';
      }
    }

    // Scroll Indicator (visível apenas no início)
    if (this.scrollIndicator) {
      const indOpacity = Math.max(0, 1 - progress * 8);
      this.scrollIndicator.style.opacity = indOpacity;
      this.scrollIndicator.style.transform = `translateX(-50%) translateY(${progress * 40}px)`;
    }

    // Beat 2: "Do frame à forma tridimensional." (28% a 62%)
    if (this.beat2) {
      if (progress > 0.24 && progress < 0.65) {
        let opacity = 0;
        if (progress <= 0.38) {
          // Fade in
          opacity = (progress - 0.24) / 0.14;
        } else if (progress <= 0.52) {
          // Fully visible
          opacity = 1;
        } else {
          // Fade out
          opacity = 1 - (progress - 0.52) / 0.13;
        }
        const translateY = (progress - 0.40) * -50;
        this.beat2.style.opacity = Math.max(0, Math.min(1, opacity));
        this.beat2.style.transform = `translateY(${translateY}px)`;
        this.beat2.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beat2.style.opacity = '0';
        this.beat2.style.pointerEvents = 'none';
      }
    }

    // Beat 3: "O horizonte é o seu canvas." (68% a 94%)
    if (this.beat3) {
      if (progress > 0.66 && progress < 0.96) {
        let opacity = 0;
        if (progress <= 0.78) {
          opacity = (progress - 0.66) / 0.12;
        } else if (progress <= 0.88) {
          opacity = 1;
        } else {
          opacity = 1 - (progress - 0.88) / 0.08;
        }
        const translateY = (progress - 0.80) * -50;
        this.beat3.style.opacity = Math.max(0, Math.min(1, opacity));
        this.beat3.style.transform = `translateY(${translateY}px)`;
        this.beat3.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beat3.style.opacity = '0';
        this.beat3.style.pointerEvents = 'none';
      }
    }

    // Transição do Céu (92% a 100%)
    if (this.skyTransition) {
      if (progress > 0.88) {
        const skyOpacity = Math.min(1, (progress - 0.88) / 0.12);
        this.skyTransition.style.opacity = skyOpacity;
      } else {
        this.skyTransition.style.opacity = '0';
      }
    }
  }

  startRenderLoop() {
    const render = () => {
      // Interpolação suave (lerp) para scrubbing sem solavancos
      const diff = this.targetFrame - this.currentFrame;
      if (Math.abs(diff) > 0.01) {
        this.currentFrame += diff * 0.18;
        this.drawCurrentFrame();
      }
      requestAnimationFrame(render);
    };
    render();
  }

  drawCurrentFrame() {
    if (!this.ctx || !this.canvas) return;

    const frameIdx = Math.round(this.currentFrame);
    let img = this.images[frameIdx];

    // Fallback: se o frame exato ainda não carregou, procura o mais próximo disponível
    if (!img) {
      for (let offset = 1; offset <= 20; offset++) {
        if (this.images[frameIdx - offset]) {
          img = this.images[frameIdx - offset];
          break;
        }
        if (this.images[frameIdx + offset]) {
          img = this.images[frameIdx + offset];
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasW = this.width;
    const canvasH = this.height;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    // Cálculo estilo "object-fit: cover" para preencher a tela mantendo aspecto
    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const offsetX = (canvasW - renderW) / 2;
    const offsetY = (canvasH - renderH) / 2;

    this.ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }
}
