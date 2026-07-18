# BOEING AEROENGINE EXPLORER

A professional aerospace engineering visualization platform built with WebGL and Three.js. This application simulates a high-fidelity turbofan engine, featuring real-time FADEC (Full Authority Digital Engine Control) telemetry, dynamic structural inspection modes, and physically-based rendering.

## Features

- **Interactive Turbofan Engine:** Fully modeled internal architecture including Fan, Compressor, Combustor, Turbine, and Exhaust Nozzle stages.
- **FADEC Simulation:** Realistic startup and shutdown sequences, modulating N1/N2 spools, TGT (Target Gas Temperature), and Fuel Flow dynamics.
- **Advanced Inspection Modes:**
  - **Standard Visual:** PBR materials with dynamic heat emissive mapping.
  - **X-Ray Analysis:** Transparent depth-sorted rendering for internal flow analysis.
  - **Wireframe Mesh:** Topological inspection.
  - **Internal Cutaway:** Localized clipping planes to reveal cross-sections.
  - **Exploded Assembly:** Automated geometric displacement for component isolation.
- **Live Telemetry:** Real-time data readouts driven by physics-based engine spooling interpolation.
- **Component Diagnostics:** Raycasted hover and selection events for localized stress and temperature readouts.
- **Particle Dynamics:** GPU-accelerated airflow and exhaust simulation mapped to engine throttle.

## Technology Stack

- **HTML5 / CSS3:** Semantic structure and aerospace-grade UI design.
- **JavaScript (ES6+):** Modular, object-oriented application architecture.
- **Three.js (WebGL):** 3D scene management, geometries, PBR materials, and raycasting.
- **GSAP:** High-performance kinematic animations for UI and camera state transitions.

## Installation & Usage

1. Clone or download the repository.
2. Ensure all files (`index.html`, `style.css`, `script.js`) are in the same directory.
3. Serve the directory using a local web server to avoid CORS issues with WebGL rendering.
   - Example using Python: `python -m http.server 8000`
   - Example using Node.js: `npx serve .`
4. Open your web browser and navigate to `http://localhost:8000`.

## Controls

- **Orbit:** Left-Click + Drag to rotate the camera.
- **Pan:** Right-Click + Drag to pan the camera.
- **Zoom:** Mouse Scroll Wheel.
- **Select:** Left-Click on engine components to view live diagnostic data.
- **Propulsion Controls:** Use the UI panel to initiate STARTUP/SHUTDOWN and adjust the throttle slider to command N1 RPM percentages.
- **Inspection Protocols:** Toggle between structural view modes using the right-side control panel.

## Architecture Notes

This project is built using a continuous extension pattern via JavaScript prototypes. Core systems (`EngineModel`, `TelemetrySystem`) are initialized first, while advanced features (`FADECSystem`, `AdvancedDisplayManager`, `InteractionManager`) are injected into the main rendering loop seamlessly to ensure maximum performance and separation of concerns.

---
*Developed for advanced engineering visualization purposes.*
