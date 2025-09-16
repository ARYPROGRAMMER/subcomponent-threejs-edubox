
/** @format */
import * as THREE from 'three';

class Common {
  readonly devicePixelRatio: number;
  // renderer/clock are created only in the browser. Keep them nullable to
  // avoid accessing DOM during SSR.
  renderer: THREE.WebGLRenderer | null;
  clock: THREE.Clock | null;
  width: number;
  height: number;
  aspect: number;
  time: number;
  timeScale: number;

  static RENDERER_PARAM = {
    clearColor: 0xffffff,
    alpha: 0,
    width: 0,   // set dummy values for SSR
    height: 0,
  };

  constructor() {
    // guard every browser-only property
    if (typeof window !== 'undefined') {
      this.devicePixelRatio = window.devicePixelRatio;
      this.width  = window.innerWidth;
      this.height = window.innerHeight;
    } else {
      this.devicePixelRatio = 1;
      this.width  = 0;
      this.height = 0;
    }

    this.aspect = this.width && this.height ? this.width / this.height : 1;
    this.time = 0;
    this.timeScale = 2.0;

    // Only create browser-only objects when window/document exist.
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Create renderer with performance-friendly defaults
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: !!Common.RENDERER_PARAM.alpha,
        powerPreference: 'high-performance',
      });
      this.clock = new THREE.Clock();
    } else {
      this.renderer = null;
      this.clock = null;
    }
  }

  init() {
    if (typeof window === 'undefined' || !this.renderer) return;

    const clearColor = new THREE.Color(Common.RENDERER_PARAM.clearColor);
    this.renderer.setClearColor(clearColor, Common.RENDERER_PARAM.alpha);

    // Cap devicePixelRatio to avoid huge GPU workloads on high-DPI displays.
    const cap = 1.5;
    const dpr = Math.max(1, Math.min(cap, window.devicePixelRatio || 1));
    this.renderer.setPixelRatio(dpr);

    // Use performant renderer options where possible
    // (antialias off is often faster for heavy fragment shaders)
    try {
      // If the renderer was created without options, adjust attributes where possible
      // Note: some attributes need to be passed at construction time; we at least set pixel ratio/size here.
    } catch (e) {
      // ignore
    }

    this.resize();
  }

  resize() {
    if (typeof window === 'undefined' || !this.renderer) return;

    this.width  = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.height ? this.width / this.height : 1;
    // Update the drawing buffer size without altering the canvas style
    // so layout remains controlled by CSS.
    this.renderer.setSize(this.width, this.height, false);
  }

  update() {
    if (this.clock) {
      this.time = this.clock.getElapsedTime() * this.timeScale;
    } else {
      this.time = 0;
    }
  }
}

export default new Common();
