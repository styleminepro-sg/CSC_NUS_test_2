/**
 * BOEING AEROENGINE EXPLORER
 * ARCHITECTURE FOUNDATION, SCENE INITIALIZATION, AND CORE SYSTEMS
 */

class AeroEngineApp {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress');
        this.loadingText = document.getElementById('loading-text');

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.state = {
            isLoaded: false,
            n1Rpm: 0,
            n2Rpm: 0,
            tgt: 15.0,
            fuelFlow: 0,
            mode: 'standard',
            engineRunning: false,
            selectedComponent: null
        };

        this.engineModel = null;
        this.uiController = null;
        this.telemetrySystem = null;

        this.clock = new THREE.Clock();
        
        this.init();
    }

    async init() {
        this.updateLoading(10, 'Initializing WebGL 2.0 Context...');
        this.setupThreeJS();
        
        this.updateLoading(35, 'Compiling Physically Based Shaders...');
        this.setupLighting();
        
        this.updateLoading(60, 'Instantiating Core Subsystems...');
        this.setupModules();
        
        this.updateLoading(85, 'Binding Telemetry Interfaces...');
        this.setupEventListeners();
        
        this.updateLoading(100, 'System Initialization Complete.');
        
        setTimeout(() => {
            this.completeLoading();
        }, 800);

        this.animate();
    }

    updateLoading(percent, text) {
        this.progressBar.style.width = `${percent}%`;
        this.loadingText.innerText = text;
    }

    completeLoading() {
        gsap.to(this.loadingScreen, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                this.loadingScreen.style.display = 'none';
                this.state.isLoaded = true;
            }
        });
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x03070b);
        this.scene.fog = new THREE.FogExp2(0x03070b, 0.015);

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(25, 15, 30);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            logarithmicDepthBuffer: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04;
        this.controls.maxDistance = 100;
        this.controls.minDistance = 5;
        this.controls.target.set(0, 0, 0);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(15, 25, 15);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 100;
        keyLight.shadow.camera.left = -20;
        keyLight.shadow.camera.right = 20;
        keyLight.shadow.camera.top = 20;
        keyLight.shadow.camera.bottom = -20;
        keyLight.shadow.bias = -0.0005;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x88bbff, 0.6);
        fillLight.position.set(-15, -5, -15);
        this.scene.add(fillLight);

        const rimLight = new THREE.PointLight(0xffaa88, 1.0, 100);
        rimLight.position.set(0, 10, -25);
        this.scene.add(rimLight);
    }

    setupModules() {
        this.uiController = new UIController(this);
        this.telemetrySystem = new TelemetrySystem(this);
        this.engineModel = new EngineModel(this.scene);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        if (this.state.isLoaded) {
            this.controls.update();
            
            if (this.engineModel) {
                this.engineModel.update(deltaTime, this.state);
            }
            
            if (this.telemetrySystem) {
                this.telemetrySystem.update(deltaTime, this.state);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

class EngineModel {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.parts = {};
        this.materials = {};
        
        this.buildBaseCore();
    }

    buildBaseCore() {
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x99aabb,
            metalness: 0.85,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        
        this.materials.standardMetal = material;

        const centralShaftGeo = new THREE.CylinderGeometry(0.4, 0.4, 18, 32);
        centralShaftGeo.rotateZ(Math.PI / 2);
        const centralShaft = new THREE.Mesh(centralShaftGeo, material);
        centralShaft.castShadow = true;
        centralShaft.receiveShadow = true;
        
        this.parts.n1Shaft = centralShaft;
        this.group.add(centralShaft);
        
        const axesHelper = new THREE.AxesHelper( 8 );
        this.group.add( axesHelper );
    }

    update(deltaTime, state) {
        if (this.parts.n1Shaft) {
            const rotationSpeed = (state.n1Rpm / 100) * Math.PI * 2 * deltaTime;
            this.parts.n1Shaft.rotation.x += rotationSpeed;
        }
    }
}

class UIController {
    constructor(app) {
        this.app = app;
        
        this.buttons = {
            startup: document.getElementById('btn-startup'),
            shutdown: document.getElementById('btn-shutdown'),
            modeStandard: document.getElementById('btn-mode-standard'),
            modeXray: document.getElementById('btn-mode-xray'),
            modeWireframe: document.getElementById('btn-mode-wireframe'),
            modeCutaway: document.getElementById('btn-mode-cutaway'),
            modeExploded: document.getElementById('btn-mode-exploded')
        };

        this.sliders = {
            throttle: document.getElementById('throttle-slider')
        };

        this.bindEvents();
    }

    bindEvents() {
        this.sliders.throttle.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.app.state.n1Rpm = val;
        });

        const modeButtons = [
            { btn: this.buttons.modeStandard, mode: 'standard' },
            { btn: this.buttons.modeXray, mode: 'xray' },
            { btn: this.buttons.modeWireframe, mode: 'wireframe' },
            { btn: this.buttons.modeCutaway, mode: 'cutaway' },
            { btn: this.buttons.modeExploded, mode: 'exploded' }
        ];

        modeButtons.forEach(item => {
            item.btn.addEventListener('click', () => {
                this.setMode(item.mode);
                modeButtons.forEach(b => b.btn.classList.remove('active'));
                item.btn.classList.add('active');
            });
        });
        
        document.querySelectorAll('[data-cam]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-cam');
                this.setCameraView(view);
            });
        });
    }

    setMode(mode) {
        this.app.state.mode = mode;
    }

    setCameraView(view) {
        const cam = this.app.camera;
        const controls = this.app.controls;
        let targetPos = new THREE.Vector3();

        switch(view) {
            case 'iso': targetPos.set(25, 15, 30); break;
            case 'front': targetPos.set(-25, 0, 0); break;
            case 'side': targetPos.set(0, 0, 35); break;
            case 'exhaust': targetPos.set(25, 0, 0); break;
        }

        gsap.to(cam.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });
    }
}

class TelemetrySystem {
    constructor(app) {
        this.app = app;
        this.grid = document.getElementById('telemetry-grid');
        
        this.dataPoints = {
            n1: { label: 'N1 RPM (%)', value: 0 },
            n2: { label: 'N2 RPM (%)', value: 0 },
            tgt: { label: 'TGT (°C)', value: 15 },
            ff: { label: 'FUEL FLOW (kg/s)', value: 0 },
            epr: { label: 'EPR', value: 1.0 },
            oilP: { label: 'OIL PRESS (psi)', value: 0 }
        };

        this.initGrid();
    }

    initGrid() {
        this.grid.innerHTML = '';
        for (const [key, data] of Object.entries(this.dataPoints)) {
            const div = document.createElement('div');
            div.className = 'data-item';
            div.innerHTML = `
                <div class="data-label">${data.label}</div>
                <div class="data-value" id="tel-${key}">--</div>
            `;
            this.grid.appendChild(div);
        }
    }

    update(deltaTime, state) {
        const targetN2 = state.n1Rpm * 1.08; 
        state.n2Rpm += (targetN2 - state.n2Rpm) * deltaTime * 2.5;

        const targetTgt = 15 + (state.n1Rpm * 9.2); 
        state.tgt += (targetTgt - state.tgt) * deltaTime * 0.8;

        state.fuelFlow = state.n1Rpm > 0 ? 0.15 + Math.pow(state.n1Rpm/100, 2) * 2.8 : 0;

        this.updateUIVal('n1', state.n1Rpm.toFixed(1));
        this.updateUIVal('n2', state.n2Rpm.toFixed(1));
        this.updateUIVal('tgt', Math.round(state.tgt));
        this.updateUIVal('ff', state.fuelFlow.toFixed(3));
        
        const epr = 1.0 + (state.n1Rpm / 100) * 0.55;
        this.updateUIVal('epr', epr.toFixed(2));
        
        const oilP = state.n1Rpm > 2 ? 40 + (state.n1Rpm / 100) * 25 : 0;
        this.updateUIVal('oilP', Math.round(oilP));
    }

    updateUIVal(key, value) {
        const el = document.getElementById(`tel-${key}`);
        if (el) el.innerText = value;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new AeroEngineApp();
});
/**
 * PART 2: TURBOFAN GEOMETRY, MATERIALS, AND ANIMATION SYSTEMS
 * Extends the AeroEngineApp with complex geometric assemblies.
 */

// Add this to the EngineModel class or replace the existing EngineModel
class EngineModel {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.parts = {
            fan: new THREE.Group(),
            compressor: new THREE.Group(),
            combustor: new THREE.Group(),
            turbine: new THREE.Group(),
            nozzle: new THREE.Group()
        };
        
        Object.values(this.parts).forEach(part => this.group.add(part));
        
        this.materials = {
            titanium: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }),
            inconel: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.7, roughness: 0.4 }),
            ceramic: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.8 })
        };

        this.initGeometry();
    }

    initGeometry() {
        this.createFan();
        this.createCompressor();
        this.createCombustor();
        this.createTurbine();
    }

    createFan() {
        const hub = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), this.materials.titanium);
        this.parts.fan.add(hub);

        // Fan Blades
        for (let i = 0; i < 24; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 5, 1),
                this.materials.titanium
            );
            const angle = (i / 24) * Math.PI * 2;
            blade.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
            blade.rotation.z = angle;
            blade.rotation.y = 0.3;
            this.parts.fan.add(blade);
        }
    }

    createCompressor() {
        // Simple stage approximation
        for (let i = 0; i < 5; i++) {
            const stage = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2 - (i * 0.1), 1.2 - (i * 0.1), 0.5, 32),
                this.materials.titanium
            );
            stage.position.z = 3 + (i * 0.8);
            this.parts.compressor.add(stage);
        }
    }

    createCombustor() {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.8, 0.4, 16, 64),
            this.materials.inconel
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.z = 8;
        this.parts.combustor.add(ring);
    }

    createTurbine() {
        const turbineDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(1.0, 1.0, 0.6, 32),
            this.materials.inconel
        );
        turbineDisc.position.z = 10;
        this.parts.turbine.add(turbineDisc);
    }

    update(deltaTime, state) {
        // N1 Spool Rotation (Fan + Low Pressure Turbine)
        const n1Speed = (state.n1Rpm / 100) * 15 * deltaTime;
        this.parts.fan.rotation.z += n1Speed;
        this.parts.turbine.rotation.z += n1Speed;

        // N2 Spool Rotation (Compressor)
        const n2Speed = (state.n2Rpm / 100) * 20 * deltaTime;
        this.parts.compressor.rotation.z += n2Speed;
    }
}

/**
 * ADDITION: Particle System for Exhaust/Flow
 * To be added to the scene in Part 3, this defines the architecture.
 */
class AirflowParticles {
    constructor(scene) {
        this.scene = scene;
        this.geometry = new THREE.BufferGeometry();
        this.particles = 500;
        // Logic to be initialized in Part 3
    }
}
