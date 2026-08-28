// FramerTool — Nature Ambient Scrolltelling Engine (frames2)
// 240-Frame 24 FPS Canvas Scrubber with floating modules, mascot callout & grounded footer

const TOTAL_FRAMES = 240;
const FRAME_PATH = (index) => `/assets/frames2/frame_${String(index).padStart(4, '0')}.jpg`;

export class NatureScrollTelling {
  constructor() {
    this.container = document.getElementById('nature-scroll-container');
    this.canvas = document.getElementById('nature-frames-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;

    this.images = [];
    this.loadedCount = 0;
    this.currentFrame = 1;
    this.targetFrame = 1;

    // Overlay Elements
    this.beatModules = document.getElementById('nature-beat-modules');
    this.beatMascot = document.getElementById('nature-beat-mascot');
    this.beatFooter = document.getElementById('nature-beat-footer');

    if (this.canvas && this.container) {
      this.init();
    }
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Preload first frame immediately
    this.preloadInitialFrame();

    // Progressive background preload of all 240 frames
    this.preloadAllFrames();

    // Scroll listener
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Smooth lerp render loop
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

    // Normalized progress 0 to 1
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

    // Map to frame index (1 to 240)
    const frameIndex = Math.floor(progress * (TOTAL_FRAMES - 1)) + 1;
    this.targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));

    // Update overlay opacities & transforms
    this.updateBeats(progress);
  }

  updateBeats(progress) {
    // ------------------------------------------------------------------------
    // Beat 1: Production Modules (0% to 38%)
    // ------------------------------------------------------------------------
    if (this.beatModules) {
      if (progress <= 0.38) {
        let opacity = 1;
        if (progress > 0.26) {
          // Fade out as camera transitions
          opacity = Math.max(0, 1 - (progress - 0.26) / 0.12);
        }
        const translateY = progress * -40;
        this.beatModules.style.opacity = opacity;
        this.beatModules.style.transform = `translateY(${translateY}px)`;
        this.beatModules.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beatModules.style.opacity = '0';
        this.beatModules.style.pointerEvents = 'none';
      }
    }

    // ------------------------------------------------------------------------
    // Beat 2: Mascot & Test Callout (42% to 74%)
    // ------------------------------------------------------------------------
    if (this.beatMascot) {
      if (progress > 0.38 && progress < 0.78) {
        let opacity = 0;
        if (progress <= 0.50) {
          // Fade in
          opacity = (progress - 0.38) / 0.12;
        } else if (progress <= 0.65) {
          // Fully visible
          opacity = 1;
        } else {
          // Fade out
          opacity = Math.max(0, 1 - (progress - 0.65) / 0.12);
        }
        const translateY = (progress - 0.55) * -50;
        this.beatMascot.style.opacity = Math.max(0, Math.min(1, opacity));
        this.beatMascot.style.transform = `translateY(${translateY}px)`;
        this.beatMascot.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beatMascot.style.opacity = '0';
        this.beatMascot.style.pointerEvents = 'none';
      }
    }

    // ------------------------------------------------------------------------
    // Beat 3: Grounded Footer (78% to 100%) — appears in final meadow frames!
    // ------------------------------------------------------------------------
    if (this.beatFooter) {
      if (progress > 0.75) {
        const opacity = Math.min(1, (progress - 0.75) / 0.18);
        const translateY = (1 - opacity) * 40;
        this.beatFooter.style.opacity = opacity;
        this.beatFooter.style.transform = `translateY(${translateY}px)`;
        this.beatFooter.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      } else {
        this.beatFooter.style.opacity = '0';
        this.beatFooter.style.pointerEvents = 'none';
      }
    }
  }

  startRenderLoop() {
    const render = () => {
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

    // Fallback: search closest loaded frame
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

    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const offsetX = (canvasW - renderW) / 2;
    const offsetY = (canvasH - renderH) / 2;

    this.ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }
}
