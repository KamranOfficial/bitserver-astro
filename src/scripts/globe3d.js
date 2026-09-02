import * as THREE from 'three';

const SIGNAL = new THREE.Color('#3ce7c4');
const VIOLET = new THREE.Color('#8b6cff');

// A few real-world anchors: Multan, Abu Dhabi, London, Frankfurt,
// Singapore, Ashburn, São Paulo, Tokyo, Sydney, Johannesburg.
const NODES = [
  [30.19, 71.47, 'Multan'],
  [24.45, 54.38, 'Abu Dhabi'],
  [51.5, -0.13, 'London'],
  [50.11, 8.68, 'Frankfurt'],
  [1.35, 103.82, 'Singapore'],
  [39.04, -77.49, 'Ashburn'],
  [-23.55, -46.63, 'Sao Paulo'],
  [35.68, 139.69, 'Tokyo'],
  [-33.87, 151.21, 'Sydney'],
  [-26.2, 28.05, 'Johannesburg'],
  [25.2, 55.27, 'Dubai'],
  [19.08, 72.88, 'Mumbai'],
  [52.37, 4.9, 'Amsterdam'],
  [37.77, -122.42, 'San Francisco'],
];

const toVec = (lat, lon, r) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

export function initGlobe(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 760;
  const R = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 2.4, 16.4);
  camera.lookAt(0, 0, 0);

  const globe = new THREE.Group();
  globe.rotation.z = -0.32;
  scene.add(globe);

  // Point-cloud sphere
  const N = mobile ? 1600 : 3200;
  const pts = new Float32Array(N * 3);
  const cols = new Float32Array(N * 3);
  const gr = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < N; i++) {
    const theta = (2 * Math.PI * i) / gr;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
    pts[i * 3] = R * Math.cos(theta) * Math.sin(phi);
    pts[i * 3 + 1] = R * Math.cos(phi);
    pts[i * 3 + 2] = R * Math.sin(theta) * Math.sin(phi);
    const c = SIGNAL.clone().lerp(VIOLET, Math.random() * 0.5).multiplyScalar(0.55 + Math.random() * 0.45);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  cloudGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  globe.add(
    new THREE.Points(
      cloudGeo,
      new THREE.PointsMaterial({
        size: 0.055,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );

  // Inner shell + wire meridians
  globe.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x061019, transparent: true, opacity: 0.9 })
    )
  );
  globe.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.002, 32, 20),
      new THREE.MeshBasicMaterial({
        color: 0x1e6d78,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      })
    )
  );

  // Atmosphere
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.16, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { uColor: { value: SIGNAL } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; varying vec3 vN;
        void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(uColor, 1.0) * clamp(i,0.0,1.0) * 0.9; }`,
    })
  );
  globe.add(atmo);

  // City markers
  const markers = new THREE.Group();
  globe.add(markers);
  NODES.forEach(([lat, lon]) => {
    const p = toVec(lat, lon, R * 1.01);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xd9fff6 })
    );
    dot.position.copy(p);
    markers.add(dot);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.15, 24),
      new THREE.MeshBasicMaterial({
        color: SIGNAL,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    ring.userData.t = Math.random() * Math.PI * 2;
    markers.add(ring);
  });

  // Arcs between hub (Abu Dhabi / Multan) and the rest
  const arcs = [];
  const hubs = [toVec(24.45, 54.38, R), toVec(30.19, 71.47, R)];
  NODES.forEach(([lat, lon], idx) => {
    if (idx < 2) return;
    const a = hubs[idx % 2];
    const b = toVec(lat, lon, R);
    const mid = a.clone().add(b).multiplyScalar(0.5).setLength(R * (1.28 + a.distanceTo(b) / (R * 9)));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 64, 0.05, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color: idx % 3 === 0 ? VIOLET : SIGNAL,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tube = new THREE.Mesh(geo, mat);
    globe.add(tube);

    // Travelling pulse
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xeafff9 })
    );
    globe.add(pulse);
    arcs.push({ curve, pulse, offset: Math.random(), speed: 0.1 + Math.random() * 0.14 });
  });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let visible = false;
  const vo = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.05 });
  vo.observe(canvas);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  canvas.addEventListener('pointermove', onMove, { passive: true });

  const clock = new THREE.Clock();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();

    if (!reduced) globe.rotation.y = t * 0.11;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    globe.rotation.x = -pointer.y * 0.22;
    camera.position.x = pointer.x * 1.6;
    camera.lookAt(0, 0, 0);

    markers.children.forEach((m) => {
      if (m.geometry.type === 'RingGeometry') {
        const k = (Math.sin(t * 1.6 + m.userData.t) + 1) / 2;
        m.scale.setScalar(1 + k * 2.4);
        m.material.opacity = 0.7 * (1 - k);
      }
    });

    arcs.forEach((a) => {
      const u = (t * a.speed + a.offset) % 1;
      a.pulse.position.copy(a.curve.getPoint(u));
      a.pulse.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.9);
    });

    renderer.render(scene, camera);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    vo.disconnect();
    renderer.dispose();
  };
}
