"use client";
/** @format */

import * as THREE from 'three';
import Common from './Common';
import Pointer from './Pointer';
// import Gui, { type Options } from './Gui';

// Use bundler raw imports so the shader source is available at build time.
// Some dev servers / environments cannot resolve fetch('../path?raw') at runtime.
// The `?raw` suffix is supported by Vite / Next.js when configured.
// Shader files live in src/shaders; from this module (src/scripts/modules)
// we need to go up two levels to reach src.
import output_frag from '../../shaders/frag/output.frag.ts';
import base_vert from '../../shaders/vert/base.vert.ts';

export default class Output {
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly uniforms: THREE.ShaderMaterialParameters['uniforms'];
    // private readonly options: Options;
    // private readonly gui: Gui;
    private readonly trailLength: number;
    private pointerTrail: THREE.Vector2[];
    private lastFrameTime: number;
    private maxFPS: number;

    // Avoid accessing `window` at module-eval time so this module is SSR-safe.
    static CAMERA_PARAM = {
        fovy: 60,
        aspect: 1, // set a safe default; real value applied in init()
        near: 0.1,
        far: 50,
        position: new THREE.Vector3(0.0, 0.0, 10.0),
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };

    /**
     * @constructor
     */
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            Output.CAMERA_PARAM.fovy,
            Output.CAMERA_PARAM.aspect,
            Output.CAMERA_PARAM.near,
            Output.CAMERA_PARAM.far
        );

        this.trailLength = 15;
        this.pointerTrail = Array.from({ length: this.trailLength }, () => new THREE.Vector2(0, 0));

        this.uniforms = {
            uTime: { value: Common.time },
            uResolution: {
                value: new THREE.Vector2(Common.width, Common.height),
            },
            uPointerTrail: { value: this.pointerTrail },
        };

        // Performance tuning
        this.lastFrameTime = 0;
        this.maxFPS = 30; // limit renders to 30 FPS by default; adjust as needed

        // this.options = {
        //     timeScale: Common.timeScale,
        // };
        // this.gui = new Gui(this.options);
    }

    /**
     * # Initialization
     */
    init() {
        // Camera
        // Apply client-side aspect ratio (Common.aspect is SSR-safe)
        this.camera.aspect = Common.aspect || Output.CAMERA_PARAM.aspect;
        this.camera.position.copy(Output.CAMERA_PARAM.position);
        this.camera.lookAt(Output.CAMERA_PARAM.lookAt);

        // Mesh
        const planeGeometry = new THREE.PlaneGeometry(2.0, 2.0);
        const planeMaterial = new THREE.RawShaderMaterial({
            vertexShader: base_vert,
            fragmentShader: output_frag,
            wireframe: false,
            uniforms: this.uniforms,
            precision: 'mediump', // reduce fragment shader precision where acceptable
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add(plane);
    }

    /**
     * # Resize handling
     */
    resize() {
        this.camera.aspect = Common.aspect;
        this.camera.updateProjectionMatrix();
        if (this.uniforms) {
            this.uniforms.uResolution.value.set(Common.width, Common.height);
        }
    }

    /**
     * # Render the final output scene
     */
    private render() {
        if (this.uniforms) {
            this.uniforms.uTime.value = Common.time;
        }
        // Frame limiting to reduce GPU load on heavy fragment shaders
        const now = performance.now();
        const minFrameInterval = 1000 / this.maxFPS;
        if (now - this.lastFrameTime < minFrameInterval) return;
        this.lastFrameTime = now;

        // renderer is created only on the client; guard its usage
        if (Common.renderer) {
            Common.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * # rAF update
     */
    update() {
        // this.gui.update();
        this.updatePointerTrail();
        this.render();
    }

    /**
     * # Update the pointer trail
     */
    updatePointerTrail() {
        for (let i = this.trailLength - 1; i > 0; i--) {
            this.pointerTrail[i].copy(this.pointerTrail[i - 1]);
        }
        this.pointerTrail[0].copy(Pointer.coords);
    }
}
