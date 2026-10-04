import * as THREE from './vendor/three.module.min.js';

const canvas = document.querySelector('#hero-three-canvas');
const hero = document.querySelector('.editorial-hero');

if (canvas && hero) {
  try {
    canvas.dataset.scene = 'phone';
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const phone = new THREE.Group();
    scene.add(phone);

    const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc99a3d, metalness: 0.95, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });
    const screenMaterial = new THREE.MeshPhysicalMaterial({ color: 0x11141b, emissive: 0x172033, emissiveIntensity: 0.65, metalness: 0.28, roughness: 0.2, clearcoat: 1 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x17283c, emissive: 0x0c2945, emissiveIntensity: 0.65, metalness: 0.24, roughness: 0.12, clearcoat: 1 });

    phone.add(new THREE.Mesh(new THREE.BoxGeometry(1.62, 3.18, 0.22), frameMaterial));
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.94, 0.035), screenMaterial);
    screen.position.z = 0.128;
    phone.add(screen);
    const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 2.72), glassMaterial);
    screenGlow.position.z = 0.149;
    phone.add(screenGlow);

    const island = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.028), new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.35, roughness: 0.22 }));
    island.position.set(0, 1.27, 0.17);
    phone.add(island);
    phone.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.64, 3.2, 0.24)),
      new THREE.LineBasicMaterial({ color: 0xf1cf88, transparent: true, opacity: 0.76 })
    ));
    const sideButton = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.52, 0.08), frameMaterial);
    sideButton.position.set(0.83, 0.48, 0);
    phone.add(sideButton);

    phone.position.set(3, 0.05, 0);
    phone.rotation.set(-0.08, -0.34, 0.08);
    scene.add(new THREE.HemisphereLight(0xffe8b5, 0x11141b, 2.8));
    const key = new THREE.DirectionalLight(0xffc65b, 5.2);
    key.position.set(4, 5, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8bc8ff, 2.4);
    rim.position.set(-3, -1, 4);
    scene.add(rim);

    const pointer = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const { width, height } = hero.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      const compact = width < 760;
      phone.position.x = compact ? 2.35 : 3;
      phone.scale.setScalar(compact ? 0.45 : 0.72);
    }

    function render(time = 0) {
      const seconds = time * 0.001;
      const targetY = -0.34 + Math.sin(seconds * 0.7) * 0.22 + pointer.x * 0.12;
      phone.rotation.y += (targetY - phone.rotation.y) * 0.045;
      phone.rotation.x += (-0.08 - pointer.y * 0.08 - phone.rotation.x) * 0.045;
      phone.position.y = Math.sin(seconds * 0.9) * 0.08;
      renderer.render(scene, camera);
      canvas.dataset.frame = String(Number(canvas.dataset.frame || 0) + 1);
      if (!reducedMotion) requestAnimationFrame(render);
    }

    hero.addEventListener('pointermove', event => {
      const bounds = hero.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
    window.addEventListener('resize', resize, { passive: true });
    resize();
    render();
  } catch (error) {
    canvas.hidden = true;
    console.warn('Hero 3D scene unavailable, using image fallback.', error);
  }
}
