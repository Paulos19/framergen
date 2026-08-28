// FramerTool – GPU Water-Puddle Ripple Simulation
// Realistic "finger dragging through water" wake effect.
// Uses WebGL ping-pong render targets + wave equation propagation.
// Zero MeshPhysicalMaterial, zero transmission artifacts, zero bright-pixel glitch.

export class FluidEngineBackground {
  constructor() {
    this.container =
      document.getElementById('engines-fluid-container') ||
      document.getElementById('engines');
    this.canvas = document.getElementById('fluid-engines-canvas');
    if (!this.container || !this.canvas || typeof THREE === 'undefined') return;

    this.mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, inside: false };
    this._init();
  }

  /* ------------------------------------------------------------------ */
  /*  BOOTSTRAP                                                         */
  /* ------------------------------------------------------------------ */
  _init() {
    const rect = this.container.getBoundingClientRect();
    this.cw = rect.width || 1200;
    this.ch = rect.height || 600;

    // Simulation grid (256 wide; height adapts to aspect ratio)
    this.SIM_W = 256;
    this.SIM_H = Math.round(this.SIM_W * (this.ch / this.cw));

    /* ── renderer ── */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,            // fully opaque – shader paints the whole surface
      antialias: false,        // not needed for fullscreen-quad passes
    });
    this.renderer.setSize(this.cw, this.ch, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x1d4ed8, 1.0);

    /* ── ping-pong render targets (height-field buffers) ── */
    const rtOpts = {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    };
    this.rtA = new THREE.WebGLRenderTarget(this.SIM_W, this.SIM_H, rtOpts);
    this.rtB = new THREE.WebGLRenderTarget(this.SIM_W, this.SIM_H, rtOpts);
    this.rtC = new THREE.WebGLRenderTarget(this.SIM_W, this.SIM_H, rtOpts);

    /* ── ortho camera + fullscreen quad ── */
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.PlaneGeometry(2, 2);

    this._buildShaders();
    this._bindEvents();

    this.clock = new THREE.Clock();
    this._loop();
  }

  /* ------------------------------------------------------------------ */
  /*  GLSL SHADERS                                                      */
  /* ------------------------------------------------------------------ */
  _buildShaders() {
    // Shared vertex shader (fullscreen quad)
    const VS = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    /* ── 1. DROP SHADER ──
       Adds a smooth circular impulse at the given centre. */
    this.dropMat = new THREE.ShaderMaterial({
      uniforms: {
        tex:      { value: null },
        center:   { value: new THREE.Vector2() },
        radius:   { value: 0.015 },
        strength: { value: 0.1 },
      },
      vertexShader: VS,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D tex;
        uniform vec2 center;
        uniform float radius, strength;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tex, vUv);
          float d = distance(vUv, center);
          float impulse = strength * smoothstep(radius, radius * 0.12, d);
          gl_FragColor = vec4(c.r + impulse, c.gba);
        }
      `,
    });

    /* ── 2. WAVE-EQUATION PROPAGATION SHADER ──
       Classic 2-D wave equation: next = 2·curr − prev + c²·∇²curr
       Damping shrinks amplitude each step so waves fade out. */
    this.propMat = new THREE.ShaderMaterial({
      uniforms: {
        curr: { value: null },
        prev: { value: null },
        res:  { value: new THREE.Vector2(this.SIM_W, this.SIM_H) },
      },
      vertexShader: VS,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D curr, prev;
        uniform vec2 res;
        varying vec2 vUv;
        void main() {
          vec2 e = 1.0 / res;
          float c0 = texture2D(curr, vUv).r;
          float p0 = texture2D(prev, vUv).r;
          float cL = texture2D(curr, vUv - vec2(e.x, 0.0)).r;
          float cR = texture2D(curr, vUv + vec2(e.x, 0.0)).r;
          float cU = texture2D(curr, vUv + vec2(0.0, e.y)).r;
          float cD = texture2D(curr, vUv - vec2(0.0, e.y)).r;
          // wave equation step
          float next = 2.0 * c0 - p0 + 0.25 * (cL + cR + cU + cD - 4.0 * c0);
          next *= 0.988;   // damping – trail lingers ~2 s
          gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
        }
      `,
    });

    /* ── 3. WATER-SURFACE RENDER SHADER ──
       Converts the height-field into a gorgeous deep-blue water surface
       with refraction, specular highlights, caustics, and wave-crest glow. */
    this.waterMat = new THREE.ShaderMaterial({
      uniforms: {
        hmap: { value: null },
        res:  { value: new THREE.Vector2(this.SIM_W, this.SIM_H) },
        time: { value: 0 },
      },
      vertexShader: VS,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D hmap;
        uniform vec2 res;
        uniform float time;
        varying vec2 vUv;

        /* ── deep-ocean gradient (replicates the CSS 140deg linear-gradient) ── */
        vec3 waterGrad(vec2 uv) {
          float a  = 2.443;                                   // 140° in rad
          float t  = dot(uv - 0.5, vec2(cos(a), sin(a))) + 0.5;
          t = clamp(t, 0.0, 1.0);
          vec3 c0 = vec3(0.118, 0.251, 0.686);               // #1e40af
          vec3 c1 = vec3(0.145, 0.388, 0.922);               // #2563eb
          vec3 c2 = vec3(0.010, 0.341, 0.780);               // #0284c7
          vec3 c3 = vec3(0.012, 0.227, 0.631);               // #0369a1
          vec3 c4 = vec3(0.059, 0.090, 0.165);               // #0f172a
          vec3 col = c0;
          col = mix(col, c1, smoothstep(0.00, 0.30, t));
          col = mix(col, c2, smoothstep(0.30, 0.65, t));
          col = mix(col, c3, smoothstep(0.65, 0.85, t));
          col = mix(col, c4, smoothstep(0.85, 1.00, t));
          return col;
        }

        void main() {
          vec2 e = 1.0 / res;
          float h = texture2D(hmap, vUv).r;

          /* ── surface normal via finite differences ── */
          float hL = texture2D(hmap, vUv - vec2(e.x, 0.0)).r;
          float hR = texture2D(hmap, vUv + vec2(e.x, 0.0)).r;
          float hU = texture2D(hmap, vUv + vec2(0.0, e.y)).r;
          float hD = texture2D(hmap, vUv - vec2(0.0, e.y)).r;
          vec3 N = normalize(vec3((hL - hR) * 10.0, (hD - hU) * 10.0, 1.0));

          /* ── refracted background ── */
          vec2 rUv = vUv + N.xy * 0.022;
          vec3 col = waterGrad(rUv);

          /* ── ambient caustic shimmer ── */
          vec2 cUv = rUv * 30.0 + time * 0.55;
          float caustic = sin(cUv.x) * sin(cUv.y);
          caustic = pow(abs(caustic), 1.5) * 0.055;
          col += vec3(0.10, 0.25, 0.50) * caustic;

          /* ── second micro-caustic layer ── */
          vec2 cUv2 = rUv * 55.0 - time * 0.35;
          float caustic2 = sin(cUv2.x + 0.7) * sin(cUv2.y + 1.1);
          caustic2 = pow(abs(caustic2), 2.0) * 0.03;
          col += vec3(0.06, 0.18, 0.40) * caustic2;

          /* ── specular highlight (Blinn-Phong) ── */
          vec3 L = normalize(vec3(0.35, 0.55, 1.0));
          vec3 V = vec3(0.0, 0.0, 1.0);
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 100.0);
          col += vec3(0.80, 0.92, 1.0) * spec * 0.90;

          /* ── secondary softer spec from opposite angle ── */
          vec3 L2 = normalize(vec3(-0.4, 0.3, 0.8));
          vec3 H2 = normalize(L2 + V);
          float spec2 = pow(max(dot(N, H2), 0.0), 60.0);
          col += vec3(0.55, 0.75, 1.0) * spec2 * 0.35;

          /* ── fresnel rim on ripples ── */
          float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
          col += vec3(0.15, 0.40, 0.75) * fres * 0.08;

          /* ── wave crest / trough shading ── */
          float crest  = smoothstep(0.004, 0.055, h);
          float trough = smoothstep(-0.004, -0.04, h);
          col += vec3(0.40, 0.62, 0.92) * crest  * 0.30;   // lighter crests
          col -= vec3(0.025, 0.045, 0.07) * trough;         // darker troughs

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    /* ── build scene graphs (one per pass) ── */
    this.dropMesh  = new THREE.Mesh(this.quad, this.dropMat);
    this.propMesh  = new THREE.Mesh(this.quad, this.propMat);
    this.waterMesh = new THREE.Mesh(this.quad, this.waterMat);

    this.sDrops = new THREE.Scene();  this.sDrops.add(this.dropMesh);
    this.sProp  = new THREE.Scene();  this.sProp.add(this.propMesh);
    this.sWater = new THREE.Scene();  this.sWater.add(this.waterMesh);
  }

  /* ------------------------------------------------------------------ */
  /*  EVENT BINDING                                                     */
  /* ------------------------------------------------------------------ */
  _bindEvents() {
    this.container.addEventListener('mouseenter', () => {
      this.mouse.inside = true;
    });
    this.container.addEventListener('mouseleave', () => {
      this.mouse.inside = false;
    });
    this.container.addEventListener('mousemove', (e) => {
      const r = this.container.getBoundingClientRect();
      this.mouse.px = this.mouse.x;
      this.mouse.py = this.mouse.y;
      this.mouse.x  = (e.clientX - r.left) / r.width;
      this.mouse.y  = 1.0 - (e.clientY - r.top) / r.height;   // flip Y for GL
      this.mouse.inside = true;
    });

    // Touch support
    this.container.addEventListener('touchstart', (e) => {
      this.mouse.inside = true;
      this._touchUpdate(e);
    }, { passive: true });
    this.container.addEventListener('touchmove', (e) => {
      this._touchUpdate(e);
    }, { passive: true });
    this.container.addEventListener('touchend', () => {
      this.mouse.inside = false;
    });

    window.addEventListener('resize', () => this._resize());
  }

  _touchUpdate(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const r = this.container.getBoundingClientRect();
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x  = (t.clientX - r.left) / r.width;
    this.mouse.y  = 1.0 - (t.clientY - r.top) / r.height;
  }

  /* ------------------------------------------------------------------ */
  /*  SIMULATION HELPERS                                                */
  /* ------------------------------------------------------------------ */

  /** Paint a circular impulse into the current height-field. */
  _drop(x, y, radius, strength) {
    this.dropMat.uniforms.tex.value      = this.rtA.texture;
    this.dropMat.uniforms.center.value.set(x, y);
    this.dropMat.uniforms.radius.value   = radius;
    this.dropMat.uniforms.strength.value = strength;

    this.renderer.setRenderTarget(this.rtC);
    this.renderer.render(this.sDrops, this.cam);
    // swap A ↔ C  (A is always "current")
    const tmpDrop = this.rtA;
    this.rtA = this.rtC;
    this.rtC = tmpDrop;
  }

  /** One step of the wave-equation propagation. */
  _step() {
    this.propMat.uniforms.curr.value = this.rtA.texture;
    this.propMat.uniforms.prev.value = this.rtB.texture;

    this.renderer.setRenderTarget(this.rtC);
    this.renderer.render(this.sProp, this.cam);
    // cycle:  prev ← curr,  curr ← new,  spare ← old prev
    const tmpPrev = this.rtB;
    this.rtB = this.rtA;
    this.rtA = this.rtC;
    this.rtC = tmpPrev;
  }

  _resize() {
    if (!this.container || !this.renderer) return;
    const r = this.container.getBoundingClientRect();
    this.cw = r.width || 1200;
    this.ch = r.height || 600;
    this.renderer.setSize(this.cw, this.ch, false);
  }

  /* ------------------------------------------------------------------ */
  /*  MAIN LOOP                                                         */
  /* ------------------------------------------------------------------ */
  _loop() {
    requestAnimationFrame(() => this._loop());
    const t = this.clock.getElapsedTime();

    /* ── mouse-trail drops ── */
    if (this.mouse.inside) {
      const dx  = this.mouse.x - this.mouse.px;
      const dy  = this.mouse.y - this.mouse.py;
      const spd = Math.sqrt(dx * dx + dy * dy);

      if (spd > 0.001) {
        // Interpolate drops along the path → smooth, continuous wake
        const steps = Math.min(12, Math.max(1, Math.floor(spd / 0.003)));
        for (let i = 0; i < steps; i++) {
          const f  = i / steps;
          const px = this.mouse.px + dx * f;
          const py = this.mouse.py + dy * f;
          const str = Math.min(0.14, spd * 1.6);
          this._drop(px, py, 0.010 + spd * 0.018, str);
        }
      }

      // Tiny disturbance even when barely moving → feels alive
      if (spd > 0.0003) {
        this._drop(this.mouse.x, this.mouse.y, 0.007, 0.015);
      }
    }

    /* ── ambient random drops for living surface ── */
    if (Math.random() < 0.03) {
      this._drop(Math.random(), Math.random(), 0.020, 0.004);
    }

    /* ── propagation (3 sub-steps → faster wave travel → wider wake) ── */
    this._step();
    this._step();
    this._step();

    /* ── render the final water surface ── */
    this.waterMat.uniforms.hmap.value = this.rtA.texture;
    this.waterMat.uniforms.time.value = t;

    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.sWater, this.cam);
  }
}

export function initFluidEngine() {
  return new FluidEngineBackground();
}
