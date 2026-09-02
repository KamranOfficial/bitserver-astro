import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const SIGNAL = new THREE.Color('#3ce7c4');
const VIOLET = new THREE.Color('#8b6cff');
const DEEP = new THREE.Color('#0a1526');

export function initHero(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070d, 0.028);

  const camera = new THREE.PerspectiveCamera(46, canvas.clientWidth / canvas.clientHeight, 0.1, 220);
  const LOOK_X = mobile ? 0 : -4.6;
  const CAM_Y = mobile ? 13 : 6.4;
  const CAM_Z = mobile ? 40 : 24;
  camera.position.set(0, CAM_Y, CAM_Z);
  camera.lookAt(LOOK_X, 3.2, 0);

  const root = new THREE.Group();
  scene.add(root);

  /* ---------------- Lighting ---------------- */
  scene.add(new THREE.AmbientLight(0x2c3b57, 1.1));
  const key = new THREE.PointLight(SIGNAL, 420, 110, 2);
  key.position.set(-12, 14, 12);
  scene.add(key);
  const rim = new THREE.PointLight(VIOLET, 320, 100, 2);
  rim.position.set(14, 9, -10);
  scene.add(rim);

  /* ---------------- Server rack field ---------------- */
  const COLS = mobile ? 9 : 15;
  const ROWS = mobile ? 9 : 13;
  const GAP = 2.5;
  const count = COLS * ROWS;

  const rackGeo = new THREE.BoxGeometry(1.15, 1, 1.15);
  const rackMat = new THREE.MeshStandardMaterial({
    color: DEEP,
    metalness: 0.85,
    roughness: 0.28,
    emissive: new THREE.Color('#0a3243'),
    emissiveIntensity: 1.1,
  });
  const racks = new THREE.InstancedMesh(rackGeo, rackMat, count);
  racks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  racks.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

  const dummy = new THREE.Object3D();
  const seeds = new Float32Array(count);
  const heights = new Float32Array(count);
  let i = 0;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const px = (x - (COLS - 1) / 2) * GAP;
      const pz = (z - (ROWS - 1) / 2) * GAP;
      const d = Math.hypot(px, pz);
      seeds[i] = Math.random() * Math.PI * 2;
      heights[i] = 1.4 + Math.random() * 3.6 + Math.max(0, 7 - d * 0.42);
      dummy.position.set(px, heights[i] / 2, pz);
      dummy.scale.set(1, heights[i], 1);
      dummy.updateMatrix();
      racks.setMatrixAt(i, dummy.matrix);
      const c = SIGNAL.clone().lerp(VIOLET, Math.min(1, d / 18)).multiplyScalar(0.16);
      racks.setColorAt(i, c);
      i++;
    }
  }
  racks.instanceColor.needsUpdate = true;
  root.add(racks);

  // Glowing wireframe overlay — shares the rack transform buffer
  const wire = new THREE.InstancedMesh(
    rackGeo,
    new THREE.MeshBasicMaterial({
      color: SIGNAL,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    count
  );
  wire.instanceMatrix = racks.instanceMatrix;
  wire.frustumCulled = false;
  root.add(wire);

  /* --------- Emissive status LEDs on top of each rack --------- */
  const ledGeo = new THREE.BufferGeometry();
  const ledPos = new Float32Array(count * 3);
  const ledCol = new Float32Array(count * 3);
  const ledPhase = new Float32Array(count);
  i = 0;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const px = (x - (COLS - 1) / 2) * GAP;
      const pz = (z - (ROWS - 1) / 2) * GAP;
      ledPos[i * 3] = px;
      ledPos[i * 3 + 1] = heights[i] + 0.18;
      ledPos[i * 3 + 2] = pz;
      const c = Math.random() > 0.78 ? VIOLET : SIGNAL;
      ledCol[i * 3] = c.r;
      ledCol[i * 3 + 1] = c.g;
      ledCol[i * 3 + 2] = c.b;
      ledPhase[i] = Math.random() * Math.PI * 2;
      i++;
    }
  }
  ledGeo.setAttribute('position', new THREE.BufferAttribute(ledPos, 3));
  ledGeo.setAttribute('color', new THREE.BufferAttribute(ledCol, 3));
  const leds = new THREE.Points(
    ledGeo,
    new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  root.add(leds);

  /* ---------------- Ground grid ---------------- */
  const grid = new THREE.GridHelper(120, 60, 0x1c4a52, 0x102437);
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  grid.position.y = 0.01;
  root.add(grid);

  /* ---------------- Orbiting wireframe core ---------------- */
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 12.5, 0);
  root.add(coreGroup);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.1, 1),
    new THREE.MeshBasicMaterial({ color: SIGNAL, wireframe: true, transparent: true, opacity: 0.5 })
  );
  coreGroup.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(4.4, 2),
    new THREE.MeshBasicMaterial({ color: VIOLET, wireframe: true, transparent: true, opacity: 0.16 })
  );
  coreGroup.add(shell);

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xd9fff6 })
  );
  coreGroup.add(nucleus);

  /* ---------------- Data stream particles ---------------- */
  const P = mobile ? 900 : 2200;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(P * 3);
  const sVel = new Float32Array(P);
  const sCol = new Float32Array(P * 3);
  for (let k = 0; k < P; k++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 26;
    sPos[k * 3] = Math.cos(a) * r;
    sPos[k * 3 + 1] = Math.random() * 24;
    sPos[k * 3 + 2] = Math.sin(a) * r;
    sVel[k] = 0.025 + Math.random() * 0.09;
    const c = Math.random() > 0.7 ? VIOLET : SIGNAL;
    sCol[k * 3] = c.r;
    sCol[k * 3 + 1] = c.g;
    sCol[k * 3 + 2] = c.b;
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const streams = new THREE.Points(
    sGeo,
    new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  root.add(streams);

  /* ---------------- Post-processing ---------------- */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
  composer.setSize(canvas.clientWidth, canvas.clientHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    mobile ? 0.55 : 0.78,
    0.75,
    0.14
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------------- Interaction ---------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  let scrollN = 0;
  const onScroll = () => {
    scrollN = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let visible = true;
  const vo = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.01 });
  vo.observe(canvas);

  /* ---------------- Loop ---------------- */
  const clock = new THREE.Clock();
  let raf = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    if (!reduced) {
      // Breathing racks
      const m = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      const q = new THREE.Quaternion();
      for (let n = 0; n < count; n += 1) {
        racks.getMatrixAt(n, m);
        m.decompose(pos, q, scl);
        const h = heights[n] * (1 + Math.sin(t * 0.7 + seeds[n]) * 0.045);
        scl.set(1, h, 1);
        pos.y = h / 2;
        m.compose(pos, q, scl);
        racks.setMatrixAt(n, m);
        ledPos[n * 3 + 1] = h + 0.18;
      }
      racks.instanceMatrix.needsUpdate = true;
      wire.instanceMatrix.needsUpdate = true;
      ledGeo.attributes.position.needsUpdate = true;

      // Stream flow
      const sp = sGeo.attributes.position.array;
      for (let k = 0; k < P; k++) {
        sp[k * 3 + 1] += sVel[k];
        if (sp[k * 3 + 1] > 26) sp[k * 3 + 1] = 0;
      }
      sGeo.attributes.position.needsUpdate = true;

      core.rotation.y = t * 0.22;
      core.rotation.x = t * 0.11;
      shell.rotation.y = -t * 0.14;
      shell.rotation.z = t * 0.08;
      coreGroup.position.y = 12.5 + Math.sin(t * 0.6) * 0.5;
      nucleus.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
      leds.material.opacity = 0.75 + Math.sin(t * 3) * 0.18;
      root.rotation.y = Math.sin(t * 0.06) * 0.12 + pointer.x * 0.16;
    }

    camera.position.x += (pointer.x * 4 - camera.position.x) * 0.05;
    camera.position.y += (CAM_Y - pointer.y * 2.2 + scrollN * 6 - camera.position.y) * 0.05;
    camera.position.z += (CAM_Z - scrollN * 7 - camera.position.z) * 0.05;
    camera.lookAt(LOOK_X, 3.2 + scrollN * 2.5, 0);

    composer.render(dt);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    vo.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', onScroll);
    renderer.dispose();
  };
}
