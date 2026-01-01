import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { Line2 } from "three/addons/lines/Line2.js";

let scene, camera, renderer;
let clock = new THREE.Clock();
let pointer = new THREE.Vector2(999, 999);
let raycaster = new THREE.Raycaster();
let controllerParts = [];

export function initHomeBackground(container) {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(0, 0, 90);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    raycaster.params.Line2 = { threshold: 2 };

    const material = new LineMaterial({
        color: 0x66aaff,
        linewidth: 2,
        worldUnits: true,
        transparent: true,
        opacity: 0.85
    });

    material.resolution.set(container.clientWidth, container.clientHeight);

    // Helper
    const createLine = (pts) => {
        const geo = new LineGeometry();
        geo.setPositions(pts.flat());
        const line = new Line2(geo, material.clone());
        line.computeLineDistances();
        scene.add(line);
        controllerParts.push(line);
    };

    // Controller body
    createLine([
        [-35, 0, 0], [-25, 15, 0], [-10, 18, 0], [10, 18, 0],
        [25, 15, 0], [35, 0, 0], [25, -15, 0], [10, -18, 0],
        [-10, -18, 0], [-25, -15, 0], [-35, 0, 0]
    ]);

    // D-Pad
    createLine([[-18, 4, 0], [-18, -4, 0]]);
    createLine([[-22, 0, 0], [-14, 0, 0]]);

    // Left stick
    createLine(circle(-12, -6, 4));

    // Right stick
    createLine(circle(12, -6, 4));

    // Face buttons
    createLine(circle(18, 4, 2));
    createLine(circle(22, 8, 2));
    createLine(circle(22, 0, 2));
    createLine(circle(26, 4, 2));

    window.addEventListener("mousemove", e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener("resize", () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        controllerParts.forEach(p => p.material.resolution.set(container.clientWidth, container.clientHeight));
    });

    animate();
}

function circle(cx, cy, r) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0]);
    }
    return pts;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    scene.rotation.y += delta * 0.12;
    scene.rotation.x += delta * 0.04;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(controllerParts);

    controllerParts.forEach(p => {
        p.material.opacity = 0.85;
        p.material.color.set(0x66aaff);
    });

    if (hits.length) {
        hits[0].object.material.opacity = 1.0;
        hits[0].object.material.color.set(0xffffff);
    }

    renderer.render(scene, camera);
}
