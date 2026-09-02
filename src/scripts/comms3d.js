import * as THREE from 'three';

/**
 * Contact page scene: a signal beacon.
 * A central emissive core broadcasts expanding rings across a particle plane,
 * with an orbiting wire cage and drifting motes. Lightweight — no post-processing.
 */
export function initComms(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 720px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070d, 0.05);

  const camera = new THREE.PerspectiveCamera(48, canvas.clientWidth / canvas.clientHeight, 0.1, 120);
  camera.position.set(0, 4.2, 13.5);
  camera.lookAt(0, 0.6, 0);

  const root = new THREE.Group();
  scene.add(root);

  const SIGNAL = new THREE.Color(0x3ce7c4);
  const VIOLET = new THREE.Color(0x8b6cff);

  // Core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 2),
    new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.9 })
  );
  root.add(core);

  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.55, 1),
    new THREE.MeshBasicMaterial({ color: SIGNAL, wireframe: true, transparent: true, opacity: 0.35 })
  );
  root.add(cage);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 32, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { c: { value: SIGNAL } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.,0.,1.)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0) * 0.5); }`,
    })
  );
  root.add(halo);

  // Broadcast rings
  const rings = [];
  const RING_N = 5;
  for (let i = 0; i < RING_N; i++) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.02, 96),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? VIOLET : SIGNAL,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.4;
    mesh.userData.phase = i / RING_N;
    root.add(mesh);
    rings.push(mesh);
  }

  // Grid floor
  const grid = new THREE.GridHelper(56, 56, 0x1aa98d, 0x14304a);
  grid.position.y = -1.42;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  grid.material.depthWrite = false;
  root.add(grid);

  // Drifting motes
  const COUNT = mobile ? 320 : 700;
  const pos = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 3 + Math.random() * 12;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = -1.3 + Math.random() * 9;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const motes = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: SIGNAL,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  root.add(motes);

  // Uplink beams
  const beams = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const from = new THREE.Vector3(Math.cos(a) * 7.5, -1.3, Math.sin(a) * 7.5);
    const curve = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(new THREE.Vector3(0, 4.5, 0), 0.5), new THREE.Vector3(0, 0, 0));
    const beam = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, 0.022, 6, false),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? VIOLET : SIGNAL,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beams.add(beam);
  }
  root.add(beams);

  const pointer = { x: 0, y: 0 };
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();

    core.rotation.y = t * 0.35;
    core.rotation.x = Math.sin(t * 0.4) * 0.2;
    core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.05);
    cage.rotation.y = -t * 0.22;
    cage.rotation.z = t * 0.12;

    rings.forEach((r) => {
      const p = (t * 0.28 + r.userData.phase) % 1;
      const s = 1 + p * 11;
      r.scale.setScalar(s);
      r.material.opacity = (1 - p) * 0.55;
    });

    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += 0.006 + seeds[i] * 0.012;
      if (arr[i * 3 + 1] > 8.5) arr[i * 3 + 1] = -1.3;
    }
    pGeo.attributes.position.needsUpdate = true;

    beams.children.forEach((b, i) => {
      b.material.opacity = 0.28 + Math.abs(Math.sin(t * 1.1 + i)) * 0.42;
    });

    root.rotation.y = Math.sin(t * 0.08) * 0.2 + pointer.x * 0.25;
    camera.position.y += (4.2 - pointer.y * 1.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0.6, 0);

    renderer.render(scene, camera);
  };

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    frame();
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
    },
    { threshold: 0.01 }
  );
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reduced) {
      raf = requestAnimationFrame(frame);
    }
  });
}
