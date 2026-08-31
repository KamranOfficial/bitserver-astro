/* ============================================================================
   BitsServer IT Lab — Ultra-Premium Futuristic 3D Visual Scene
   Concept: Floating Digital Infrastructure System
   Communicating: Cloud Infrastructure, AI, Servers, Computing, Networking, Cybersecurity.

   Redesign of ONLY the 3D hero scene area inside #hero-canvas.
   Zero external 3D model dependencies. Optimized for Cloudflare Pages.
   ============================================================================ */
(function () {
  var canvas = document.getElementById('hero-canvas');
  var heroSection = document.getElementById('hero');
  if (!canvas || !heroSection || typeof THREE === 'undefined') return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene state
  var renderer, scene, camera;
  var mainGroup, backgroundGroup, foregroundGroup;
  var serverCoreGroup, satelliteGroup, ringsGroup, dataNetworkGroup;
  var satelliteModules = [];
  var dataPackets = [];
  var ambientParticles;

  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 0;
  var clock = new THREE.Clock();
  var rafId = null;
  var isHeroVisible = true;
  var isMobile = false;

  // BitsServer Design Tokens (Color Palette)
  var COLOR_CYAN = 0x00E5FF;
  var COLOR_PRIMARY = 0x0A84FF;
  var COLOR_ACCENT = 0x7B61FF;
  var COLOR_DARK_METAL = 0x0a1128;
  var COLOR_GLASS = 0x0c1b3a;

  function updateMobileState() {
    isMobile = window.innerWidth < 960;
  }

  function init() {
    updateMobileState();

    // 1. WebGL Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);

    // 2. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, heroSection.clientWidth / heroSection.clientHeight, 0.1, 100);

    // 3. Lighting System
    setupLighting();

    // 4. Composition Hierarchy
    mainGroup = new THREE.Group();
    scene.add(mainGroup);

    backgroundGroup = new THREE.Group();
    foregroundGroup = new THREE.Group();
    scene.add(backgroundGroup);
    scene.add(foregroundGroup);

    // Build 3D elements
    buildBackgroundAtmosphere();
    buildModularServerCore();
    buildSatelliteNodes();
    buildCybersecurityRings();
    buildDataNetworkFlow();
    buildForegroundDetails();

    applyResponsiveLayout();

    // 5. Event Listeners
    window.addEventListener('resize', onResize);
    heroSection.addEventListener('mousemove', onMouseMove);
    heroSection.addEventListener('mouseleave', onMouseLeave);
    heroSection.addEventListener('touchmove', onTouchMove, { passive: true });

    setupIntersectionObserver();

    // 6. Start Loop
    if (prefersReducedMotion) {
      renderSingleFrame();
    } else {
      animate();
    }
  }

  // ---- Lighting Setup ----
  function setupLighting() {
    var ambient = new THREE.AmbientLight(0x0a142e, 1.8);
    scene.add(ambient);

    // Key cyan light (Cloud & Cyber glow)
    var keyLight = new THREE.PointLight(COLOR_CYAN, 4.0, 45);
    keyLight.position.set(6, 6, 8);
    scene.add(keyLight);

    // Rim violet light (AI & Processing accent)
    var rimLight = new THREE.PointLight(COLOR_ACCENT, 3.5, 45);
    rimLight.position.set(-7, -4, 5);
    scene.add(rimLight);

    // Top blue directional fill
    var topLight = new THREE.DirectionalLight(COLOR_PRIMARY, 1.8);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);
  }

  // ---- BACKGROUND: Atmospheric digital grid & environmental micro-particles ----
  function buildBackgroundAtmosphere() {
    // Subtle perspective digital grid floor
    var gridGeo = new THREE.PlaneGeometry(36, 24, 18, 12);
    var gridMat = new THREE.MeshBasicMaterial({
      color: COLOR_CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.04
    });
    var gridPlane = new THREE.Mesh(gridGeo, gridMat);
    gridPlane.rotation.x = -Math.PI / 2.3;
    gridPlane.position.set(0, -4.8, -4);
    backgroundGroup.add(gridPlane);

    // Deep environmental micro-particles
    var count = isMobile ? 140 : 280;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var particleMat = new THREE.PointsMaterial({
      color: COLOR_CYAN,
      size: isMobile ? 0.03 : 0.04,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    ambientParticles = new THREE.Points(particleGeo, particleMat);
    backgroundGroup.add(ambientParticles);
  }

  // ---- MIDGROUND: Modular Cloud Server Core (AI Tower & Processing Modules) ----
  function buildModularServerCore() {
    serverCoreGroup = new THREE.Group();

    // Reusable Materials
    var glassMat = new THREE.MeshStandardMaterial({
      color: COLOR_GLASS,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });

    var metalMat = new THREE.MeshStandardMaterial({
      color: COLOR_DARK_METAL,
      roughness: 0.35,
      metalness: 0.9
    });

    var edgeLineMat = new THREE.LineBasicMaterial({
      color: COLOR_CYAN,
      transparent: true,
      opacity: 0.4
    });

    var cyanEmissiveMat = new THREE.MeshStandardMaterial({
      color: COLOR_CYAN,
      emissive: COLOR_CYAN,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    var violetEmissiveMat = new THREE.MeshStandardMaterial({
      color: COLOR_ACCENT,
      emissive: COLOR_ACCENT,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });

    // 1. Central Vertical Chassis Structure
    var chassisGeo = new THREE.BoxGeometry(1.6, 3.8, 1.2);
    var chassisEdges = new THREE.EdgesGeometry(chassisGeo);
    var chassisWire = new THREE.LineSegments(chassisEdges, edgeLineMat);
    serverCoreGroup.add(chassisWire);

    // Chassis corner support columns
    var colGeo = new THREE.BoxGeometry(0.06, 4.0, 0.06);
    var colOffsets = [
      [-0.8, 0, -0.6], [0.8, 0, -0.6],
      [-0.8, 0, 0.6], [0.8, 0, 0.6]
    ];
    colOffsets.forEach(function (offset) {
      var col = new THREE.Mesh(colGeo, metalMat);
      col.position.set(offset[0], offset[1], offset[2]);
      serverCoreGroup.add(col);
    });

    // 2. Stacked Translucent Blade Server Units (5 Modular Slots)
    var bladeCount = 5;
    var bladeGeo = new THREE.BoxGeometry(1.48, 0.42, 1.08);
    for (var b = 0; b < bladeCount; b++) {
      var yPos = -1.4 + b * 0.7;
      var blade = new THREE.Mesh(bladeGeo, glassMat);
      blade.position.set(0, yPos, 0);

      // Edge outline on each blade
      var bladeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(bladeGeo), edgeLineMat);
      blade.add(bladeEdge);

      // Front LED indicator bar (AI/Server status)
      var ledColorMat = (b % 2 === 0) ? cyanEmissiveMat : violetEmissiveMat;
      var ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), ledColorMat);
      ledBar.position.set(-0.3, 0, 0.55);
      blade.add(ledBar);

      var ledDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), cyanEmissiveMat);
      ledDot.position.set(0.45, 0, 0.55);
      blade.add(ledDot);

      serverCoreGroup.add(blade);
    }

    // 3. Glowing AI Processing Core (Central Column)
    var coreCylinderGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.6, 16);
    var coreCylinderMat = new THREE.MeshStandardMaterial({
      color: COLOR_CYAN,
      emissive: COLOR_CYAN,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85
    });
    var coreCylinder = new THREE.Mesh(coreCylinderGeo, coreCylinderMat);
    serverCoreGroup.add(coreCylinder);

    mainGroup.add(serverCoreGroup);
  }

  // ---- MIDGROUND: Floating Satellite Nodes (Edge Computing & Data Storage Pods) ----
  function buildSatelliteNodes() {
    satelliteGroup = new THREE.Group();
    satelliteModules = [];

    var glassMat = new THREE.MeshStandardMaterial({
      color: COLOR_GLASS,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75
    });
    var emissiveCyan = new THREE.MeshStandardMaterial({
      color: COLOR_CYAN,
      emissive: COLOR_CYAN,
      emissiveIntensity: 0.9
    });
    var emissiveViolet = new THREE.MeshStandardMaterial({
      color: COLOR_ACCENT,
      emissive: COLOR_ACCENT,
      emissiveIntensity: 0.8
    });
    var edgeMat = new THREE.LineBasicMaterial({ color: COLOR_CYAN, transparent: true, opacity: 0.5 });

    // Define 5 satellite node configurations floating around the main core
    var nodeConfigs = [
      { geo: new THREE.BoxGeometry(0.65, 0.65, 0.65), pos: [-2.6, 1.8, 1.2], speed: 0.5, floatAmp: 0.25, rotAxis: 'y' },
      { geo: new THREE.CylinderGeometry(0.35, 0.35, 0.7, 12), pos: [2.5, 1.6, -1.0], speed: 0.4, floatAmp: 0.3, rotAxis: 'x' },
      { geo: new THREE.BoxGeometry(0.7, 0.35, 0.5), pos: [-2.2, -1.9, -0.8], speed: 0.6, floatAmp: 0.2, rotAxis: 'z' },
      { geo: new THREE.OctahedronGeometry(0.42, 0), pos: [2.7, -1.7, 1.0], speed: 0.45, floatAmp: 0.35, rotAxis: 'y' },
      { geo: new THREE.BoxGeometry(0.48, 0.48, 0.48), pos: [0.2, 2.5, -1.5], speed: 0.55, floatAmp: 0.22, rotAxis: 'y' }
    ];

    nodeConfigs.forEach(function (cfg, idx) {
      var mesh = new THREE.Mesh(cfg.geo, glassMat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

      // Metallic trim frame inside/around satellite node
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(cfg.geo), edgeMat);
      mesh.add(edges);

      // Inset emissive core node
      var innerCoreMat = (idx % 2 === 0) ? emissiveCyan : emissiveViolet;
      var innerCore = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), innerCoreMat);
      mesh.add(innerCore);

      mesh.userData = {
        baseY: cfg.pos[1],
        baseX: cfg.pos[0],
        baseZ: cfg.pos[2],
        speed: cfg.speed,
        floatAmp: cfg.floatAmp,
        phase: idx * 1.2,
        rotAxis: cfg.rotAxis
      };

      satelliteGroup.add(mesh);
      satelliteModules.push(mesh);
    });

    mainGroup.add(satelliteGroup);
  }

  // ---- MIDGROUND: Cybersecurity Perimeter Rings & Data Orbits ----
  function buildCybersecurityRings() {
    ringsGroup = new THREE.Group();

    // Ring 1: Inner Octagonal Shield Conduit
    var innerRingGeo = new THREE.TorusGeometry(2.5, 0.022, 12, 48);
    var ringMat1 = new THREE.MeshStandardMaterial({
      color: COLOR_PRIMARY,
      emissive: COLOR_PRIMARY,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });
    var innerRing = new THREE.Mesh(innerRingGeo, ringMat1);
    innerRing.rotation.x = Math.PI / 3.2;
    innerRing.rotation.y = Math.PI / 6;
    ringsGroup.add(innerRing);

    // Node indicator pods along inner shield ring
    var podGeo = new THREE.SphereGeometry(0.045, 8, 8);
    var podMat = new THREE.MeshStandardMaterial({ color: COLOR_CYAN, emissive: COLOR_CYAN, emissiveIntensity: 0.9 });
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(2.5 * Math.cos(angle), 2.5 * Math.sin(angle), 0);
      innerRing.add(pod);
    }

    // Ring 2: Outer Cybersecurity Defense Orbit
    var outerRingGeo = new THREE.TorusGeometry(3.6, 0.016, 8, 64);
    var ringMat2 = new THREE.MeshBasicMaterial({
      color: COLOR_ACCENT,
      transparent: true,
      opacity: 0.45
    });
    var outerRing = new THREE.Mesh(outerRingGeo, ringMat2);
    outerRing.rotation.x = -Math.PI / 4;
    outerRing.rotation.y = -Math.PI / 5;
    ringsGroup.add(outerRing);

    mainGroup.add(ringsGroup);
  }

  // ---- MIDGROUND: Interconnected Data Pathways & Network Packet Flow ----
  function buildDataNetworkFlow() {
    dataNetworkGroup = new THREE.Group();
    dataPackets = [];

    var lineMat = new THREE.LineBasicMaterial({
      color: COLOR_CYAN,
      transparent: true,
      opacity: 0.35
    });

    var packetGeo = new THREE.SphereGeometry(0.038, 8, 8);
    var packetMatCyan = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var packetMatViolet = new THREE.MeshBasicMaterial({ color: COLOR_CYAN });

    // Connect core to each satellite node with network lines
    satelliteModules.forEach(function (satMesh, idx) {
      var startPos = new THREE.Vector3(0, satMesh.userData.baseY * 0.4, 0);
      var endPos = satMesh.position.clone();

      var lineGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
      var networkLine = new THREE.Line(lineGeo, lineMat);
      dataNetworkGroup.add(networkLine);

      // Create 2 flowing data packets along each pathway
      for (var p = 0; p < 2; p++) {
        var packetMesh = new THREE.Mesh(packetGeo, (idx + p) % 2 === 0 ? packetMatCyan : packetMatViolet);
        dataNetworkGroup.add(packetMesh);

        dataPackets.push({
          mesh: packetMesh,
          satMesh: satMesh,
          startPos: startPos,
          progress: (p * 0.5 + idx * 0.15) % 1.0,
          speed: 0.25 + (idx % 3) * 0.08
        });
      }
    });

    mainGroup.add(dataNetworkGroup);
  }

  // ---- FOREGROUND: Tech Elements & Micro Data Particles (Depth Layering) ----
  function buildForegroundDetails() {
    // 2 Close floating micro-chip nodes near camera bounds (subtle spatial depth effect)
    var fgMat = new THREE.MeshStandardMaterial({
      color: COLOR_GLASS,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.55
    });
    var fgEdgeMat = new THREE.LineBasicMaterial({ color: COLOR_CYAN, transparent: true, opacity: 0.3 });

    var fgGeo1 = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var fgMesh1 = new THREE.Mesh(fgGeo1, fgMat);
    fgMesh1.position.set(-4.2, 2.4, 3.2);
    fgMesh1.add(new THREE.LineSegments(new THREE.EdgesGeometry(fgGeo1), fgEdgeMat));
    foregroundGroup.add(fgMesh1);

    var fgGeo2 = new THREE.OctahedronGeometry(0.28, 0);
    var fgMesh2 = new THREE.Mesh(fgGeo2, fgMat);
    fgMesh2.position.set(4.5, -2.2, 2.8);
    fgMesh2.add(new THREE.LineSegments(new THREE.EdgesGeometry(fgGeo2), fgEdgeMat));
    foregroundGroup.add(fgMesh2);

    fgMesh1.userData = { baseY: 2.4, speed: 0.4 };
    fgMesh2.userData = { baseY: -2.2, speed: 0.5 };
  }

  // ---- Responsive Camera & Layout Positioning ----
  function applyResponsiveLayout() {
    updateMobileState();

    var w = heroSection.clientWidth;
    var h = heroSection.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (w >= 960) {
      // Desktop: Shift 3D scene right so it occupies the hero visual container (.hero-scene-spacer)
      mainGroup.position.set(2.4, 0, 0);
      mainGroup.scale.set(1.0, 1.0, 1.0);
      camera.position.set(0, 0, 10.8);
      camera.lookAt(0.4, 0, 0);
    } else if (w >= 600) {
      // Tablet: Centered slightly lower
      mainGroup.position.set(0, -0.4, -0.5);
      mainGroup.scale.set(0.85, 0.85, 0.85);
      camera.position.set(0, 0, 11.5);
      camera.lookAt(0, 0, 0);
    } else {
      // Mobile: Compact floating composition, clear of hero copy
      mainGroup.position.set(0, -0.6, -1.0);
      mainGroup.scale.set(0.72, 0.72, 0.72);
      camera.position.set(0, 0, 12.2);
      camera.lookAt(0, 0, 0);
    }
  }

  // ---- Mouse / Touch Parallax Event Handlers ----
  function onMouseMove(e) {
    if (isMobile) return;
    var rect = heroSection.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    targetCamX = mouseX * 0.75;
    targetCamY = -mouseY * 0.45;
  }

  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    var rect = heroSection.getBoundingClientRect();
    var t = e.touches[0];
    mouseX = ((t.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((t.clientY - rect.top) / rect.height - 0.5) * 2;
    targetCamX = mouseX * 0.3;
    targetCamY = -mouseY * 0.2;
  }

  function onMouseLeave() {
    targetCamX = 0;
    targetCamY = 0;
  }

  function onResize() {
    applyResponsiveLayout();
  }

  // ---- Performance Optimization: Intersection Observer for Viewport Visibility ----
  function setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isHeroVisible = entry.isIntersecting;
          if (isHeroVisible && !rafId && !prefersReducedMotion) {
            clock.start();
            animate();
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }
  }

  // ---- Single Static Frame Renderer for Reduced Motion / Power Saving ----
  function renderSingleFrame() {
    renderer.render(scene, camera);
  }

  // ---- MAIN ANIMATION LOOP ----
  function animate() {
    if (!isHeroVisible) {
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var elapsed = clock.getElapsedTime();

    // 1. Slow, sophisticated floating & rotation of Main Infrastructure Group
    if (mainGroup) {
      mainGroup.rotation.y = Math.sin(elapsed * 0.12) * 0.08;
      mainGroup.position.y = (isMobile ? -0.6 : 0) + Math.sin(elapsed * 0.5) * 0.12;
    }

    // 2. Slow rotation of Cybersecurity Shield Rings
    if (ringsGroup && ringsGroup.children.length >= 2) {
      ringsGroup.children[0].rotation.z = elapsed * 0.15;
      ringsGroup.children[1].rotation.z = -elapsed * 0.1;
    }

    // 3. Floating animation of Satellite Nodes
    satelliteModules.forEach(function (mesh) {
      var d = mesh.userData;
      mesh.position.y = d.baseY + Math.sin(elapsed * d.speed + d.phase) * d.floatAmp;

      if (d.rotAxis === 'y') mesh.rotation.y = elapsed * d.speed * 0.4;
      else if (d.rotAxis === 'x') mesh.rotation.x = elapsed * d.speed * 0.4;
      else mesh.rotation.z = elapsed * d.speed * 0.4;
    });

    // 4. Data Packet Network Flow (Points moving along network lines)
    dataPackets.forEach(function (pkt) {
      pkt.progress = (pkt.progress + delta * pkt.speed) % 1.0;
      var currentEnd = pkt.satMesh.position;
      pkt.mesh.position.lerpVectors(pkt.startPos, currentEnd, pkt.progress);
    });

    // 5. Environmental Background Particles Rotation
    if (ambientParticles) {
      ambientParticles.rotation.y = elapsed * 0.012;
    }

    // 6. Foreground subtle floating
    if (foregroundGroup && foregroundGroup.children.length >= 2) {
      foregroundGroup.children[0].position.y = foregroundGroup.children[0].userData.baseY + Math.sin(elapsed * 0.4) * 0.15;
      foregroundGroup.children[1].position.y = foregroundGroup.children[1].userData.baseY + Math.cos(elapsed * 0.5) * 0.15;
    }

    // 7. Smooth Parallax Camera Movement
    var currentCamX = isMobile ? 0 : 0.4;
    camera.position.x += ((currentCamX + targetCamX) - camera.position.x) * 0.04;
    camera.position.y += ((0 + targetCamY) - camera.position.y) * 0.04;
    camera.lookAt(currentCamX, 0, 0);

    renderer.render(scene, camera);
  }

  // ---- Tab Visibility Change Handler ----
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (isHeroVisible && !prefersReducedMotion && !rafId) {
      clock.start();
      animate();
    }
  });

  // Init execution
  try {
    init();
  } catch (err) {
    // Fail-safe: canvas hidden if WebGL fails
    if (canvas) canvas.style.display = 'none';
  }
})();
