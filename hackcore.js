import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Creates the Hack Core: a wireframe icosahedron with an inner glow core,
// scattered node points and two tilted orbital rings. Returns {dispose}.
export function createHackCore(canvas, { accent = '#35D6E0', accent2 = '#A78BFA' } = {}) {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const group = new THREE.Group();
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.55 })
  );
  group.add(core);

  const innerGlow = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 2),
    new THREE.MeshBasicMaterial({ color: accent2, transparent: true, opacity: 0.14 })
  );
  group.add(innerGlow);

  // node points scattered on a slightly larger sphere
  const nodeCount = 90;
  const positions = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    const r = 1.9 + Math.random() * 0.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const nodeMat = new THREE.PointsMaterial({ color: accent, size: 0.045, transparent: true, opacity: 0.85 });
  const nodes = new THREE.Points(nodeGeo, nodeMat);
  group.add(nodes);

  function ring(radius, color, rx, ry) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.006, 8, 120),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })
    );
    r.rotation.x = rx;
    r.rotation.y = ry;
    return r;
  }
  const ring1 = ring(2.6, accent, Math.PI / 2.4, 0.3);
  const ring2 = ring(3.1, accent2, Math.PI / 1.8, -0.5);
  group.add(ring1, ring2);

  let w = 1, h = 1;
  function resize() {
    const parent = canvas.parentElement;
    w = parent.clientWidth; h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  let targetX = 0, targetY = 0;
  function onMove(e) {
    const rect = canvas.parentElement.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = nx * 0.6;
    targetY = ny * 0.6;
  }
  window.addEventListener('pointermove', onMove);

  let raf;
  let t = 0;
  function animate() {
    raf = requestAnimationFrame(animate);
    t += 0.0035;
    if (!reduced) {
      group.rotation.y += 0.0018;
      group.rotation.x = Math.sin(t * 0.6) * 0.08;
      ring1.rotation.z += 0.0012;
      ring2.rotation.z -= 0.0009;
    }
    group.rotation.y += (targetX - 0) * 0.01;
    camera.position.x += (targetX * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (-targetY * 1.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();

  function dispose() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    [core, innerGlow, nodes, ring1, ring2].forEach(o => { o.geometry.dispose(); o.material.dispose(); });
    renderer.dispose();
  }
  return { dispose };
}
