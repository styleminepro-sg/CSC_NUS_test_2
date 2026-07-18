/**
 * BOEING AEROENGINE EXPLORER
 * PART 1: CORE ARCHITECTURE & TELEMETRY
 */

class AeroEngineApp {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress');
        this.loadingText = document.getElementById('loading-text');
        this.errorNotification = document.getElementById('error-notification');
        this.errorMessage = document.getElementById('error-message');
        this.spinner = document.getElementById('loader-spinner');
        this.headline = document.getElementById('loader-headline');

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

        this.clock = new THREE.Clock();
        this.init();
    }

    triggerCrashNotification(stageName, error) {
        console.error(`Crash at stage [${stageName}]:`, error);
        if(this.spinner) this.spinner.style.borderTopColor = '#ff3333';
        if(this.headline) this.headline.innerText = "SYSTEM BOOT FAILED";
        if(this.loadingText) this.loadingText.innerText = `CRASH_DURING: ${stageName.toUpperCase()}`;
        if(this.progressBar) this.progressBar.style.backgroundColor = '#ff3333';
        
        if(this.errorNotification && this.errorMessage) {
            this.errorNotification.classList.remove('hidden');
            this.errorMessage.innerText = `${error.name}: ${error.message} \nStack: ${error.stack ? error.stack.split('\n')[0] : 'N/A'}`;
        }
    }

    async init() {
        try {
            this.updateLoading(10, 'STAGE_1: Initializing WebGL Context & Frame Buffers...');
            this.setupThreeJS();
            
            this.updateLoading(35, 'STAGE_2: Generating Physical Illumination Arrays...');
            this.setupLighting();
            
            this.updateLoading(60, 'STAGE_3: Assembling Turbofan Mechanical Stages...');
            this.engineModel = new EngineModel(this.scene);
            
            this.updateLoading(80, 'STAGE_4: Injecting FADEC Control & Telemetry Interfaces...');
            this.uiController = new UIController(this);
            this.telemetrySystem = new TelemetrySystem(this);
            this.fadec = new FADECSystem(this);
            this.displayManager = new AdvancedDisplayManager(this);
            this.particles = new AirflowParticles(this.scene);
            this.interactionManager = new InteractionManager(this);
            this.heatVisualizer = new HeatVisualizer(this);
            
            this.updateLoading(95, 'STAGE_5: Binding Peripheral Hardware Signals...');
            this.setupEventListeners();
            
            this.updateLoading(100, 'BOOT_SEQUENCE: Systems Nominal. Engine Online.');
            setTimeout(() => this.completeLoading(), 600);
            
            this.animate();
        } catch (error) {
            let failedStage = "Core Architecture Extraction";
            if (this.progressBar.style.width === '10%') failedStage = "WebGL Engine Canvas Setup";
            else if (this.progressBar.style.width === '35%') failedStage = "Dynamic Scene Lighting Setup";
            else if (this.progressBar.style.width === '60%') failedStage = "Turbofan Model Generation";
            else if (this.progressBar.style.width === '80%') failedStage = "FADEC Control Module Binding";
            else if (this.progressBar.style.width === '95%') failedStage = "DOM Signal Hookup Layer";
            this.triggerCrashNotification(failedStage, error);
        }
    }

    updateLoading(percent, text) {
        if(this.progressBar) this.progressBar.style.width = `${percent}%`;
        if(this.loadingText) this.loadingText.innerText = text;
    }

    completeLoading() {
        gsap.to(this.loadingScreen, { opacity: 0, duration: 0.5, ease: "power2.inOut", onComplete: () => { this.loadingScreen.style.display = 'none'; this.state.isLoaded = true; } });
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x03070b);
        this.scene.fog = new THREE.FogExp2(0x03070b, 0.015);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(25, 15, 30);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: window.innerWidth > 768, 
            powerPreference: "high-performance",
            alpha: false,
            logarithmicDepthBuffer: false 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.localClippingEnabled = true;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 100;
        this.controls.minDistance = 5;
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(15, 25, 15);
        this.scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x88bbff, 0.6);
        fillLight.position.set(-15, -5, -15);
        this.scene.add(fillLight);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (!this.state.isLoaded) return;

        const deltaTime = this.clock.getDelta();
        this.controls.update();
        
        if (this.engineModel) this.engineModel.update(deltaTime, this.state);
        if (this.telemetrySystem) this.telemetrySystem.update(deltaTime, this.state);
        if (this.fadec) this.fadec.update(deltaTime, this.state);
        if (this.particles) this.particles.update(deltaTime, this.state);
        if (this.interactionManager) this.interactionManager.update();
        if (this.heatVisualizer) this.heatVisualizer.update(this.state);
        
        if (this.interactionManager && this.interactionManager.selectedObject && this.state.engineRunning) {
            for (const [key, group] of Object.entries(this.engineModel.parts)) {
                if (group.children.includes(this.interactionManager.selectedObject)) {
                    this.interactionManager.updateDetailsPanel(key);
                    break;
                }
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

class TelemetrySystem {
    constructor(app) {
        this.app = app;
        this.grid = document.getElementById('telemetry-grid');
        this.dataPoints = { n1: { label: 'N1 RPM (%)' }, n2: { label: 'N2 RPM (%)' }, tgt: { label: 'TGT (°C)' }, ff: { label: 'FUEL FLOW (kg/s)' }, epr: { label: 'EPR' }, oilP: { label: 'OIL PRESS (psi)' } };
        this.initGrid();
    }
    initGrid() {
        this.grid.innerHTML = '';
        for (const [key, data] of Object.entries(this.dataPoints)) {
            const div = document.createElement('div');
            div.className = 'data-item';
            div.innerHTML = `<div class="data-label">${data.label}</div><div class="data-value" id="tel-${key}">--</div>`;
            this.grid.appendChild(div);
        }
    }
    update(deltaTime, state) {
        const targetTgt = 15 + (state.n1Rpm * 9.2);
        state.tgt += (targetTgt - state.tgt) * deltaTime * 0.8;
        state.fuelFlow = state.n1Rpm > 0 ? 0.15 + Math.pow(state.n1Rpm/100, 2) * 2.8 : 0;
        
        document.getElementById('tel-n1').innerText = state.n1Rpm.toFixed(1);
        document.getElementById('tel-n2').innerText = state.n2Rpm.toFixed(1);
        document.getElementById('tel-tgt').innerText = Math.round(state.tgt);
        document.getElementById('tel-ff').innerText = state.fuelFlow.toFixed(3);
        document.getElementById('tel-epr').innerText = (1.0 + (state.n1Rpm / 100) * 0.55).toFixed(2);
        document.getElementById('tel-oilP').innerText = Math.round(state.n1Rpm > 2 ? 40 + (state.n1Rpm / 100) * 25 : 0);
    }
}

class UIController {
    constructor(app) {
        this.app = app;
        this.bindEvents();
    }
    bindEvents() {
        document.getElementById('throttle-slider').addEventListener('input', (e) => this.app.state.n1Rpm = parseFloat(e.target.value));
        const modeButtons = ['standard', 'xray', 'wireframe', 'cutaway', 'exploded'].map(id => ({ btn: document.getElementById(`btn-mode-${id}`), mode: id }));
        modeButtons.forEach(item => {
            item.btn.addEventListener('click', () => {
                this.app.state.mode = item.mode;
                if(this.app.displayManager) this.app.displayManager.setMode(item.mode);
                modeButtons.forEach(b => b.btn.classList.remove('active'));
                item.btn.classList.add('active');
            });
        });
        document.querySelectorAll('[data-cam]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-cam');
                let targetPos = new THREE.Vector3();
                switch(view) { case 'iso': targetPos.set(25, 15, 30); break; case 'front': targetPos.set(-25, 0, 0); break; case 'side': targetPos.set(0, 0, 35); break; case 'exhaust': targetPos.set(25, 0, 0); break; }
                gsap.to(this.app.camera.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.5, ease: "power2.inOut", onUpdate: () => this.app.controls.update() });
            });
        });
    }
}
/**
 * PART 2: TURBOFAN GEOMETRY & PHYSICS
 */

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
        const hub = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), this.materials.titanium);
        this.parts.fan.add(hub);
        for (let i = 0; i < 24; i++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 1), this.materials.titanium);
            const angle = (i / 24) * Math.PI * 2;
            blade.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
            blade.rotation.z = angle; blade.rotation.y = 0.3;
            this.parts.fan.add(blade);
        }
        for (let i = 0; i < 5; i++) {
            const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.2 - (i * 0.1), 1.2 - (i * 0.1), 0.5, 32), this.materials.titanium);
            stage.position.z = 3 + (i * 0.8);
            this.parts.compressor.add(stage);
        }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.4, 16, 64), this.materials.inconel);
        ring.rotation.x = Math.PI / 2; ring.position.z = 8;
        this.parts.combustor.add(ring);
        
        const turbineDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.6, 32), this.materials.inconel);
        turbineDisc.position.z = 10;
        this.parts.turbine.add(turbineDisc);
    }

    update(deltaTime, state) {
        const n1Speed = (state.n1Rpm / 100) * 15 * deltaTime;
        this.parts.fan.rotation.z += n1Speed;
        this.parts.turbine.rotation.z += n1Speed;
        const n2Speed = (state.n2Rpm / 100) * 20 * deltaTime;
        this.parts.compressor.rotation.z += n2Speed;
    }
}
/**
 * PART 3: FADEC, STRUCTURAL VIEWS, & PARTICLES
 */

class FADECSystem {
    constructor(app) {
        this.app = app;
        this.status = 'OFF';
        this.throttleInput = document.getElementById('throttle-slider');
        this.targetN1 = 0;
        this.targetN2 = 0;
        
        document.getElementById('btn-startup').addEventListener('click', () => this.initiateStartup());
        document.getElementById('btn-shutdown').addEventListener('click', () => this.initiateShutdown());
    }

    initiateStartup() {
        if (this.status === 'OFF' || this.status === 'SHUTDOWN') {
            this.status = 'SPOOLING';
            this.app.state.engineRunning = true;
            this.updateSystemStatus('SPOOLING N2', 'warn');
        }
    }

    initiateShutdown() {
        if (this.status !== 'OFF' && this.status !== 'SHUTDOWN') {
            this.status = 'SHUTDOWN';
            this.throttleInput.value = 0;
            this.updateSystemStatus('FUEL CUTOFF', 'danger');
        }
    }

    updateSystemStatus(msg, className) {
        const indicator = document.querySelector('.status-indicator');
        indicator.innerHTML = `<span class="dot" style="background-color: var(--accent-${className === 'warn' ? 'orange' : 'red'})"></span> ${msg}`;
        indicator.style.color = className === 'warn' ? 'var(--accent-orange)' : 'var(--accent-red)';
        if(msg === 'SYSTEM ONLINE') {
            indicator.innerHTML = `<span class="dot"></span> SYSTEM ONLINE`;
            indicator.style.color = '#00e676';
        }
    }

    update(deltaTime, state) {
        switch(this.status) {
            case 'SPOOLING':
                this.targetN2 = 25;
                if (state.n2Rpm > 20) { this.status = 'IGNITION'; this.updateSystemStatus('IGNITION', 'warn'); }
                break;
            case 'IGNITION':
                this.targetN2 = 60; this.targetN1 = 20;
                if (state.n1Rpm > 18) { this.status = 'IDLE'; this.updateSystemStatus('SYSTEM ONLINE', 'good'); }
                break;
            case 'IDLE':
            case 'RUNNING':
                const commandedN1 = parseFloat(this.throttleInput.value);
                if (commandedN1 > 20) { this.status = 'RUNNING'; this.targetN1 = commandedN1; } 
                else { this.status = 'IDLE'; this.targetN1 = 20; }
                break;
            case 'SHUTDOWN':
                this.targetN1 = 0; this.targetN2 = 0;
                if (state.n1Rpm < 1 && state.n2Rpm < 1) { this.status = 'OFF'; this.app.state.engineRunning = false; this.updateSystemStatus('SYSTEM OFFLINE', 'danger'); }
                break;
        }
        if (this.status !== 'OFF') {
            state.n1Rpm += (this.targetN1 - state.n1Rpm) * deltaTime * (this.status === 'SHUTDOWN' ? 0.25 : 0.4);
            state.n2Rpm += (this.targetN2 - state.n2Rpm) * deltaTime * (this.status === 'SHUTDOWN' ? 0.3 : 0.6);
        }
    }
}

class AdvancedDisplayManager {
    constructor(app) {
        this.app = app;
        this.engine = app.engineModel;
        this.originalMaterials = new Map();
        this.originalPositions = new Map();
        this.clippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        this.engine.group.traverse((child) => {
            if (child.isMesh) {
                this.originalMaterials.set(child, child.material.clone());
                this.originalPositions.set(child, child.position.clone());
            }
        });
    }
    setMode(mode) {
        this.engine.group.traverse((child) => {
            if (child.isMesh) {
                child.material.copy(this.originalMaterials.get(child));
                child.material.clippingPlanes = [];
                gsap.to(child.position, { ...this.originalPositions.get(child), duration: 1, ease: "power2.inOut" });
            }
        });
        if (mode === 'wireframe') this.engine.group.traverse(c => { if(c.isMesh) c.material.wireframe = true; });
        if (mode === 'xray') this.engine.group.traverse(c => { if(c.isMesh) { c.material.transparent = true; c.material.opacity = 0.25; c.material.depthWrite = false; c.material.color.setHex(0x0099ff); }});
        if (mode === 'cutaway') this.engine.group.traverse(c => { if(c.isMesh) { c.material.clippingPlanes = [this.clippingPlane]; c.material.side = THREE.DoubleSide; }});
        if (mode === 'exploded') {
            const offsets = { fan: -6, compressor: -2, combustor: 0, turbine: 3, nozzle: 6 };
            for (const [key, group] of Object.entries(this.engine.parts)) {
                if (offsets[key] !== undefined) group.traverse(c => { if(c.isMesh) gsap.to(c.position, { z: this.originalPositions.get(c).z + offsets[key], duration: 1.5 }); });
            }
        }
    }
}

class AirflowParticles {
    constructor(scene) {
        this.scene = scene; this.particles = 500; this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particles * 3);
        this.velocities = [];
        for (let i = 0; i < this.particles; i++) {
            positions[i*3] = (Math.random()-0.5)*4; positions[i*3+1] = (Math.random()-0.5)*4; positions[i*3+2] = (Math.random()*20)-10;
            this.velocities.push(0.1 + Math.random() * 0.2);
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.material = new THREE.PointsMaterial({ color: 0x00aaff, size: 0.08, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }
    update(deltaTime, state) {
        const positions = this.geometry.attributes.position.array;
        const speedMult = (state.n1Rpm / 100) * 15 * deltaTime;
        for (let i = 0; i < this.particles; i++) {
            let zIndex = i * 3 + 2;
            positions[zIndex] += this.velocities[i] * speedMult;
            if (positions[zIndex] > 15) { positions[zIndex] = -5; positions[i*3] = (Math.random()-0.5)*4; positions[i*3+1] = (Math.random()-0.5)*4; }
        }
        if (state.tgt > 300) {
            const h = Math.min((state.tgt - 300) / 700, 1.0);
            this.material.color.setRGB(h, 0.6 - (h*0.4), 1.0 - h);
        } else { this.material.color.setHex(0x00aaff); }
        this.geometry.attributes.position.needsUpdate = true;
    }
}
/**
 * PART 4: INTERACTION, THERMALS, & INITIALIZATION
 */

class InteractionManager {
    constructor(app) {
        this.app = app;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.detailsBox = document.getElementById('component-details');
        this.hoveredObject = null;
        this.selectedObject = null;
        this.compData = {
            fan: { name: 'FAN BLADE ASSEMBLY', desc: 'Provides bypass thrust.', tempBase: 15, stressMax: 450 },
            compressor: { name: 'HP COMPRESSOR', desc: 'Compresses core airflow.', tempBase: 250, stressMax: 800 },
            combustor: { name: 'ANNULAR COMBUSTOR', desc: 'Fuel ignition sector.', tempBase: 800, stressMax: 600 },
            turbine: { name: 'HP TURBINE', desc: 'Extracts combustion energy.', tempBase: 950, stressMax: 950 }
        };
        window.addEventListener('pointermove', (e) => { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; });
        window.addEventListener('touchstart', (e) => { if(e.touches.length > 0) { this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1; } }, {passive:true});
        window.addEventListener('click', () => this.onClick());
        window.addEventListener('touchend', () => this.onClick());
    }
    onClick() {
        if (this.hoveredObject) {
            this.selectedObject = this.hoveredObject;
            let compKey = null;
            for (const [key, group] of Object.entries(this.app.engineModel.parts)) {
                if (group.children.includes(this.selectedObject) || group === this.selectedObject.parent) { compKey = key; break; }
            }
            if (compKey && this.compData[compKey]) this.updateDetailsPanel(compKey);
        } else {
            this.selectedObject = null;
            this.detailsBox.classList.add('hidden');
        }
    }
    updateDetailsPanel(key) {
        const data = this.compData[key];
        const state = this.app.state;
        this.detailsBox.classList.remove('hidden');
        document.getElementById('comp-name').innerText = data.name;
        document.getElementById('comp-desc').innerText = data.desc;
        const curTemp = data.tempBase + (state.n1Rpm * (data.tempBase / 100));
        const curStress = (state.n1Rpm / 100) * data.stressMax;
        document.getElementById('comp-temp').innerText = `${Math.round(curTemp)} °C`;
        document.getElementById('comp-stress').innerText = `${Math.round(curStress)} MPa`;
        const statEl = document.getElementById('comp-status');
        statEl.innerText = curTemp > data.tempBase * 1.5 ? 'WARNING' : 'NOMINAL';
        statEl.className = curTemp > data.tempBase * 1.5 ? 'warn' : 'good';
    }
    update() {
        if (!this.app.engineModel) return;
        this.raycaster.setFromCamera(this.mouse, this.app.camera);
        const intersects = this.raycaster.intersectObjects(this.app.engineModel.group.children, true);
        if (intersects.length > 0) {
            this.hoveredObject = intersects[0].object;
            document.body.style.cursor = 'pointer';
        } else {
            this.hoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }
}

class HeatVisualizer {
    constructor(app) {
        this.app = app;
        setTimeout(() => { if (this.app.engineModel) { this.combustor = this.app.engineModel.parts.combustor.children[0]; this.turbine = this.app.engineModel.parts.turbine.children[0]; } }, 1000);
    }
    update(state) {
        if (!this.combustor || !this.turbine || this.app.state.mode !== 'standard') return;
        const heatIntensity = Math.max(0, Math.min(1, (state.tgt - 300) / 700));
        this.combustor.material.emissive.setRGB(heatIntensity * 0.9, heatIntensity * 0.3, 0);
        this.combustor.material.emissiveIntensity = heatIntensity * 2;
        this.turbine.material.emissive.setRGB(heatIntensity * 0.7, heatIntensity * 0.2, 0);
        this.turbine.material.emissiveIntensity = heatIntensity * 1.5;
    }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new AeroEngineApp(); });


