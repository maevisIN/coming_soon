// ==========================================================================
// MAEVIS GENESIS PORTAL - INTERACTION SCRIPT
// ==========================================================================

// Global state for glitching
let isGlitching = false;

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundParticles();
  init3DSkullCanvas();
  initProgressBar();
  initSystemClocks();
  initConsoleLogger();
  initSubscriptionForm();
  initButtonRipples();
  initAudioHum();
  initMouseParallax();
});

/**
  * 1. BACKGROUND FLOATING PARTICLES CANVAS
  */
function initBackgroundParticles() {
  const canvas = document.getElementById('bg-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const maxParticles = 65;
  
  const colors = [
    'rgba(236, 72, 153, ', // Pink/Magenta
    'rgba(249, 115, 22, ',  // Orange/Coral
    'rgba(56, 176, 0, ',    // Green
    'rgba(255, 255, 255, '  // White
  ];

  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.25 + 0.05
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/**
  * 2. 3D HOLOGRAM CANVAS - ASCII OBJECTS (randomly selected per reload)
  *
  * The 3D object is rendered as a cloud of ASCII / special characters whose
  * glyph is chosen from a luminance ramp (.,-~:;=!*#$@). A different object is
  * picked at random on every page load (skull, donut, cube, sphere, knot,
  * diamond, ...).
  */
const objectPoints = [];          // active object point cloud {x,y,z}
const objectGlowPoints = [];      // optional emissive anchor points {x,y,z}
const dissolutionParticles = [];
let activeObjectName = 'SKULL';   // name of the currently rendered object

// ASCII luminance ramp, dark->bright. '.' is faint, '@' is fully lit.
const ASCII_RAMP = " .:-=+*#%@";

// Spring parallax values updated by mousemove listener
let currentTiltX = 0;
let currentTiltY = 0;
let targetTiltX = 0;
let targetTiltY = 0;

// ---------------------------------------------------------------------------
// 3D OBJECT GENERATORS
// Each returns { points:[{x,y,z}], glow:[{x,y,z}] } where points is the surface
// cloud and glow is an optional list of emissive anchor points (e.g. eyes).
// ---------------------------------------------------------------------------

/** Classic anatomical skull: cranium + face/jaw with carved sockets & nose. */
function generateSkull() {
  const points = [];
  // A. Cranium
  for (let i = 0; i < 1300; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * (Math.PI * 0.65);
    points.push({
      x: Math.cos(theta) * Math.sin(phi) * 1.5,
      y: -Math.cos(phi) * 1.3 - 0.4,
      z: Math.sin(theta) * Math.sin(phi) * 1.5
    });
  }
  // B. Face, Cheekbones & Nasal Cavity
  for (let i = 0; i < 1600; i++) {
    const y = (Math.random() * 1.4) - 0.5;
    const widthFactor = y < 0.2 ? 1.3 : 0.85;
    const rad = Math.sqrt(Math.max(0, 1 - (y * y))) * widthFactor;
    const theta = (Math.random() * Math.PI * 0.8) - (Math.PI * 0.4);
    const x = Math.sin(theta) * rad;
    const z = Math.cos(theta) * rad + 0.3;
    if (y > -0.3 && y < 0.1 && Math.abs(x) > 0.3 && Math.abs(x) < 0.85) continue; // sockets
    if (y > 0.1 && y < 0.4 && Math.abs(x) < (y - 0.1) * 0.9) continue;             // nose
    if (y > -0.5 && y < -0.1 && Math.abs(theta) > 0.8) continue;                   // temple
    points.push({ x, y, z });
  }
  // C. Lower Teeth & Narrow Jaw
  for (let i = 0; i < 900; i++) {
    const y = (Math.random() * 0.5) + 0.9;
    const theta = (Math.random() * Math.PI * 0.5) - (Math.PI * 0.25);
    const rad = 0.65 - (y * 0.1);
    points.push({ x: Math.sin(theta) * rad, y, z: Math.cos(theta) * rad + 0.4 });
  }
  return { points, glow: [{ x: -0.36, y: -0.12, z: 0.82 }, { x: 0.36, y: -0.12, z: 0.82 }] };
}

/** Classic spinning ASCII donut (torus) a la donut.c */
function generateDonut() {
  const points = [];
  const R = 1.0;   // major radius
  const r = 0.45;  // minor radius
  const stepsA = 52, stepsB = 26;
  for (let i = 0; i < stepsA; i++) {
    const a = (i / stepsA) * Math.PI * 2;
    for (let j = 0; j < stepsB; j++) {
      const b = (j / stepsB) * Math.PI * 2;
      points.push({
        x: (R + r * Math.cos(b)) * Math.cos(a),
        y: r * Math.sin(b),
        z: (R + r * Math.cos(b)) * Math.sin(a)
      });
    }
  }
  return { points, glow: [] };
}

/** Solid cube made of densely sampled face points + bright wireframe edges. */
function generateCube() {
  const points = [];
  const s = 1.05;
  const faces = [
    { n: [0, 0, 1],  u: [1, 0, 0],  v: [0, 1, 0] },   // +Z
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },   // -Z
    { n: [1, 0, 0],  u: [0, 0, -1], v: [0, 1, 0] },   // +X
    { n: [-1, 0, 0], u: [0, 0, 1],  v: [0, 1, 0] },   // -X
    { n: [0, 1, 0],  u: [1, 0, 0],  v: [0, 0, -1] },  // +Y
    { n: [0, -1, 0], u: [1, 0, 0],  v: [0, 0, 1] }    // -Y
  ];
  for (const f of faces) {
    for (let i = 0; i <= 18; i++) {
      for (let j = 0; j <= 18; j++) {
        const tu = -s + (i / 18) * 2 * s;
        const tv = -s + (j / 18) * 2 * s;
        // boost density on the edges for a wireframe-y outline
        const edge = (i % 6 === 0 || j % 6 === 0) ? 0 : 0.35;
        if (Math.random() < edge) continue;
        points.push({
          x: f.n[0] * s + f.u[0] * tu + f.v[0] * tv,
          y: f.n[1] * s + f.u[1] * tu + f.v[1] * tv,
          z: f.n[2] * s + f.u[2] * tu + f.v[2] * tv
        });
      }
    }
  }
  return { points, glow: [] };
}

/** Uniform sphere sampled with spherical coordinates. */
function generateSphere() {
  const points = [];
  const R = 1.25;
  const stepsA = 60, stepsB = 30;
  for (let i = 0; i < stepsA; i++) {
    const a = (i / stepsA) * Math.PI * 2;       // longitude
    for (let j = 0; j < stepsB; j++) {
      const b = (j / stepsB) * Math.PI;          // latitude
      points.push({
        x: R * Math.sin(b) * Math.cos(a),
        y: R * Math.cos(b),
        z: R * Math.sin(b) * Math.sin(a)
      });
    }
  }
  return { points, glow: [] };
}

/** Trefoil knot - a flowing, twisting ribbon of points. */
function generateKnot() {
  const points = [];
  const tubeR = 0.32;
  const segs = 220, ring = 14;
  for (let i = 0; i < segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const cx = Math.sin(t) + 2 * Math.sin(2 * t);
    const cy = Math.cos(t) - 2 * Math.cos(2 * t);
    const cz = -Math.sin(3 * t);
    // local frame: tangent -> normal -> binormal
    const dx = Math.cos(t) + 4 * Math.cos(2 * t);
    const dy = -Math.sin(t) + 4 * Math.sin(2 * t);
    const dz = -3 * Math.cos(3 * t);
    const tl = Math.hypot(dx, dy, dz) || 1;
    const tx = dx / tl, ty = dy / tl, tz = dz / tl;
    // crude normal ~= up x tangent
    let nx = ty * 0 - tz * 1, ny = tz * 0 - tx * 0, nz = tx * 1 - ty * 0;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      points.push({
        x: cx * 0.45 + (nx * ca + bx * sa) * tubeR,
        y: cy * 0.45 + (ny * ca + by * sa) * tubeR,
        z: cz * 0.45 + (nz * ca + bz * sa) * tubeR
      });
    }
  }
  return { points, glow: [] };
}

/** Faceted diamond/gem: two cones joined at the equator. */
function generateDiamond() {
  const points = [];
  const rad = 1.1;
  const height = 1.6;
  const rings = 28, sides = 26;
  for (let i = 0; i < rings; i++) {
    const v = i / (rings - 1);                 // 0..1
    const y = -height / 2 + v * height;        // bottom -> top
    const t = Math.abs(y) / (height / 2);      // 0 at equator, 1 at tips
    const r = rad * (1 - t);                    // widest at equator
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      points.push({ x: r * Math.cos(a), y, z: r * Math.sin(a) });
    }
  }
  // tip points
  points.push({ x: 0, y: -height / 2, z: 0 });
  points.push({ x: 0, y: height / 2, z: 0 });
  return { points, glow: [] };
}

/** Twisted helix DNA strand - two intertwined spirals with rungs. */
function generateHelix() {
  const points = [];
  const turns = 3, steps = 240, R = 0.8;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2;
    const y = (i / steps) * 2.6 - 1.3;
    points.push({ x: R * Math.cos(t), y, z: R * Math.sin(t) });           // strand 1
    points.push({ x: R * Math.cos(t + Math.PI), y, z: R * Math.sin(t + Math.PI) }); // strand 2
    if (i % 8 === 0) {                                                     // rung
      for (let k = 1; k < 8; k++) {
        const f = k / 8;
        points.push({
          x: R * Math.cos(t) * (1 - f) + R * Math.cos(t + Math.PI) * f,
          y,
          z: R * Math.sin(t) * (1 - f) + R * Math.sin(t + Math.PI) * f
        });
      }
    }
  }
  return { points, glow: [] };
}

/** Registry of all generatable objects. New shapes can be appended freely. */
const OBJECT_REGISTRY = [
  { name: 'SKULL',    generate: generateSkull },
  { name: 'DONUT',    generate: generateDonut },
  { name: 'CUBE',     generate: generateCube },
  { name: 'SPHERE',   generate: generateSphere },
  { name: 'KNOT',     generate: generateKnot },
  { name: 'DIAMOND',  generate: generateDiamond },
  { name: 'HELIX',    generate: generateHelix }
];

function init3DSkullCanvas() {
  const canvas = document.getElementById('hologram-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 660;
  const height = canvas.height = 660;

  // --- Pick a RANDOM object on every page load -----------------------------
  const choice = OBJECT_REGISTRY[Math.floor(Math.random() * OBJECT_REGISTRY.length)];
  activeObjectName = choice.name;
  const model = choice.generate();
  objectPoints.push(...model.points);
  objectGlowPoints.push(...(model.glow || []));
  console.log('[MAEVIS] Hologram object selected:', activeObjectName);

  const scale = 520;
  const distance = 3.8;

  // ASCII glyph rendering uses a monospace font
  const FONT_SIZE = 11;
  ctx.font = `${FONT_SIZE}px "JetBrains Mono", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  function getRotatedProjectedPoint(p, angleY, angleX) {
    let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
    let z1 = p.x * Math.sin(angleY) + p.z * Math.cos(angleY);
    let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
    let z2 = p.y * Math.sin(angleX) + z1 * Math.cos(angleX);
    let ooz = 1 / (distance - z2);
    let xp = width / 2 + (x1 * scale * ooz);
    let yp = height / 2 + (y2 * scale * ooz);
    return { xp, yp, z2, ooz };
  }

  // Rotate a point and also return its surface normal for lighting.
  function getRotatedNormal(p, angleY, angleX) {
    // Approximate normal as the radial direction from the object centre.
    const len = Math.hypot(p.x, p.y, p.z) || 1;
    let nx = p.x / len, ny = p.y / len, nz = p.z / len;
    // rotate normal exactly like the position
    let x1 = nx * Math.cos(angleY) - nz * Math.sin(angleY);
    let z1 = nx * Math.sin(angleY) + nz * Math.cos(angleY);
    let y2 = ny * Math.cos(angleX) - z1 * Math.sin(angleX);
    let z2 = ny * Math.sin(angleX) + z1 * Math.cos(angleX);
    return { nx: x1, ny: y2, nz: z2 };
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    // Mouse Parallax integration
    const displayWidth = canvas.clientWidth || 660;
    const isMobileSize = displayWidth < 500;

    // On desktop, turn slightly right (towards the card); on mobile, face straight front
    const baseAngleY = isMobileSize ? 0.0 : 0.55;

    // Slow scanning oscillation so the detailed front stays visible
    const scanAngle = Math.sin(Date.now() / 3500) * 0.6;

    const angleY = baseAngleY + scanAngle + currentTiltY * 0.4;
    const angleX = 0.05 + currentTiltX * 0.2; // keep upright, responsive to mouse/tilt

    // Light direction (towards viewer, slightly up & right) - used for shading
    const lightDir = { x: 0.35, y: -0.35, z: 0.87 };
    const ll = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= ll; lightDir.y /= ll; lightDir.z /= ll;

    // --- Project + shade every point into an ASCII glyph ------------------
    const glyphs = [];
    for (let i = 0; i < objectPoints.length; i++) {
      const p = objectPoints[i];
      const pt = getRotatedProjectedPoint(p, angleY, angleX);
      if (pt.xp < 0 || pt.xp >= width || pt.yp < 0 || pt.yp >= height) continue;

      const n = getRotatedNormal(p, angleY, angleX);
      // Lambert brightness: dot(normal, light)
      let lum = n.nx * lightDir.x + n.ny * lightDir.y + n.nz * lightDir.z;
      // fold in depth so closer points read slightly brighter
      const depthT = Math.max(0, Math.min(1, (pt.z2 + 1.5) / 3.0));
      lum = Math.max(0, lum) * 0.7 + depthT * 0.45;
      lum = Math.max(0, Math.min(1, lum));

      glyphs.push({ xp: pt.xp, yp: pt.yp, z2: pt.z2, lum });
    }

    // Back-to-front so closer glyphs overwrite the farther ones
    glyphs.sort((a, b) => a.z2 - b.z2);

    // --- Render glyphs ----------------------------------------------------
    const glitching = isGlitching;
    for (const g of glyphs) {
      const idx = Math.min(ASCII_RAMP.length - 1, Math.floor(g.lum * ASCII_RAMP.length));
      const char = ASCII_RAMP[idx];

      let dx = 0, dy = 0;
      if (glitching) { dx = (Math.random() - 0.5) * 14; dy = (Math.random() - 0.5) * 7; }

      // Magenta (236,72,153) -> Orange (249,115,22) blend by luminance
      const r = Math.round(236 + g.lum * (249 - 236));
      const gg = Math.round(72 + g.lum * (115 - 72));
      const b = Math.round(153 + g.lum * (22 - 153));
      const alpha = 0.45 + g.lum * 0.55;
      ctx.fillStyle = glitching
        ? (Math.random() > 0.5 ? 'rgba(236,72,153,0.8)' : 'rgba(0,255,255,0.8)')
        : `rgba(${r},${gg},${b},${alpha})`;
      ctx.fillText(char, g.xp + dx, g.yp + dy);
    }

    // --- Spawn & draw dissolution particles -------------------------------
    if (Math.random() < 0.35 && objectPoints.length > 0) {
      const randPt = objectPoints[Math.floor(Math.random() * objectPoints.length)];
      const ptProj = getRotatedProjectedPoint(randPt, angleY, angleX);
      if (ptProj.z2 > 0) {
        const sizeMultiplier = isMobileSize ? 2.5 : 1.0;
        const dustChars = ['.', '*', '+', ':', '`'];
        dissolutionParticles.push({
          x: ptProj.xp,
          y: ptProj.yp,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 1.5 - 0.5,
          alpha: 1.0,
          decay: 0.01 + Math.random() * 0.015,
          color: Math.random() > 0.5 ? 'rgba(236, 72, 153, ' : 'rgba(249, 115, 22, ',
          size: (Math.random() * 1.5 + 0.5) * sizeMultiplier,
          char: dustChars[Math.floor(Math.random() * dustChars.length)]
        });
      }
    }

    for (let i = dissolutionParticles.length - 1; i >= 0; i--) {
      const p = dissolutionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        dissolutionParticles.splice(i, 1);
      } else {
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fillText(p.char, p.x, p.y);
      }
    }

    // --- Optional emissive glow anchors (e.g. skull eyes) -----------------
    for (const gp of objectGlowPoints) {
      const eye = getRotatedProjectedPoint(gp, angleY, angleX);
      drawEyeGlow(eye);
    }

    requestAnimationFrame(drawFrame);
  }

  function drawEyeGlow(eye) {
    if (eye.z2 < -0.1) return; // behind head

    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
    const displayWidth = canvas.clientWidth || 660;
    const isMobileSize = displayWidth < 500;
    const glowMultiplier = isMobileSize ? 2.0 : 1.0;
    const radius = (7 + pulse * 5) * eye.ooz * 3.8 * glowMultiplier;
    if (radius <= 0) return;

    const grad = ctx.createRadialGradient(eye.xp, eye.yp, 0, eye.xp, eye.yp, radius);

    if (isGlitching) {
      grad.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
      grad.addColorStop(0.5, 'rgba(0, 100, 255, 0.4)');
    } else {
      grad.addColorStop(0, 'rgba(236, 72, 153, 0.95)');
      grad.addColorStop(0.4, 'rgba(249, 115, 22, 0.5)');
    }
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(eye.xp, eye.yp, radius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(eye.xp, eye.yp, 1.2 * eye.ooz * 3.8 * glowMultiplier, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFrame();
}

/**
  * 3. MOUSE PARALLAX & SYSTEM GLITCH SCHEDULER
  */
function initMouseParallax() {
  const cardEl = document.getElementById('terminal-card');
  const skullContainer = document.querySelector('.skull-container');
  if (!cardEl) return;

  window.addEventListener('mousemove', (e) => {
    targetTiltY = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
    targetTiltX = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
  });

  window.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  function updateParallax() {
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;

    const maxTilt = 4.0;
    const tiltX = -currentTiltX * maxTilt;
    const tiltY = currentTiltY * maxTilt;

    cardEl.style.setProperty('--tilt-x', tiltX + 'deg');
    cardEl.style.setProperty('--tilt-y', tiltY + 'deg');

    if (skullContainer) {
      const pX = currentTiltY * 25;
      const pY = currentTiltX * 25;
      skullContainer.style.transform = `translate(calc(-50% + ${pX}px), calc(-50% + ${pY}px))`;
    }

    requestAnimationFrame(updateParallax);
  }

  updateParallax();

  // Schedule random glitches (must recover in < 300ms)
  function triggerGlitch() {
    isGlitching = true;
    cardEl.classList.add('glitch-active');
    
    setTimeout(() => {
      isGlitching = false;
      cardEl.classList.remove('glitch-active');
      
      // Schedule next glitch at random time between 15 and 35 seconds
      setTimeout(triggerGlitch, 15000 + Math.random() * 20000);
    }, 150 + Math.random() * 120); // 150ms to 270ms duration
  }

  setTimeout(triggerGlitch, 8000);
}

/**
  * 4. DYNAMIC PROGRESS BAR (Creeping decimal status)
  */
function initProgressBar() {
  const progressBarEl = document.getElementById('progress-bar');
  const progressPctEl = document.getElementById('progress-percentage');
  if (!progressBarEl || !progressPctEl) return;

  let progress = parseFloat(localStorage.getItem('maevis_decryption_progress'));
  if (isNaN(progress) || progress < 84.2200 || progress >= 99.9999) {
    progress = 84.2200;
  }

  function creep() {
    // Occasional pause (15% chance)
    if (Math.random() < 0.15) {
      setTimeout(creep, 1000 + Math.random() * 2000);
      return;
    }

    const inc = (Math.random() * 0.0015) + 0.0002;
    progress += inc;
    if (progress > 99.999) progress = 84.220; // wrap around

    localStorage.setItem('maevis_decryption_progress', progress.toFixed(4));
    
    const formatted = progress.toFixed(3) + '%';
    progressBarEl.style.width = progress.toFixed(3) + '%';
    progressPctEl.innerText = formatted;

    setTimeout(creep, 500 + Math.random() * 1500);
  }
  
  const formatted = progress.toFixed(3) + '%';
  progressBarEl.style.width = progress.toFixed(3) + '%';
  progressPctEl.innerText = formatted;

  setTimeout(creep, 1000);
}

/**
  * 5. SYSTEM CLOCKS (UTC & LOC Side-by-Side)
  */
function initSystemClocks() {
  const clockEl = document.getElementById('clock-display');
  if (!clockEl) return;

  function updateClocks() {
    const now = new Date();
    
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
    const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
    
    const locHours = String(now.getHours()).padStart(2, '0');
    const locMins = String(now.getMinutes()).padStart(2, '0');
    const locSecs = String(now.getSeconds()).padStart(2, '0');

    clockEl.innerText = `UTC: ${utcHours}:${utcMins}:${utcSecs} | LOC: ${locHours}:${locMins}:${locSecs}`;
  }

  updateClocks();
  setInterval(updateClocks, 1000);
}

/**
  * 6. TYPEWRITER SYSTEM LOG CONSOLE
  */
const logDatabase = [
  { type: 'info', text: 'SYSTEM REBOOT IN INITIAL STAGE...' },
  { type: 'info', text: 'CALIBRATING CORE MEMORY ARRAYS...' },
  { type: 'success', text: 'CORE SYSTEM MEMORY CALIBRATED.' },
  { type: 'info', text: 'CONNECTING TO REMOTE SUITE WORKSHOPS...' },
  { type: 'success', text: 'CONNECTION ESTABLISHED WITH WORKSHOP UNIT [WSH-01]' },
  { type: 'info', text: 'FETCHING STAMP & SEAL LEDGER REGISTRY...' },
  { type: 'warn', text: 'DETECTOR WARNING: VACUUM DOCK DUST FILTER LEVEL AT 12%' },
  { type: 'success', text: 'VACUUM PACK INTEGRITY TEST: STABLE [0.98 bar]' },
  { type: 'info', text: 'PARSING INVENTORY: DECRYPTION NODE ONLINE...' },
  { type: 'success', text: 'INVENTORY READY FOR FABRICATION QUEUE.' },
  { type: 'info', text: 'INJECTING RECENT LEDGER ENTRIES TO COLD ARCHIVE...' },
  { type: 'success', text: 'ARCHIVE COMMITTED TO SECURE STORAGE.' },
  { type: 'info', text: 'ESTABLISHING HANDSHAKE PING TO CLOUD NETWORK...' },
  { type: 'success', text: 'PING ESTABLISHED [RTT 14ms]. DEPLOYMENT READY.' },
  { type: 'info', text: 'SIMULATION PORT COMPILED. RUN MAEVICRAFT AT /game/' }
];

const easterEggLogs = [
  { type: 'success', text: 'ACCESS GRANTED: COLD ARCHIVE SEQUENCE COMPLETE.' },
  { type: 'success', text: 'AI ONLINE: COGNITIVE NEURAL LAYER SYNCHRONIZED.' },
  { type: 'info', text: 'NEURAL LINK: SYNCING QUANTUM CRYPTOGRAPHY ENGINES...' },
  { type: 'success', text: 'SOL0425: GENESIS BLOCK MINED SUCCESSFULLY [HASH: 0000x8a92f]' },
  { type: 'warn', text: 'PORTAL CALIBRATION: DETECTED SPATIAL ANOMALY IN MATRIX. CORRECTING...' },
  { type: 'error', text: 'FIREWALL ALERT: UNIDENTIFIED MALICIOUS SUBNET ATTEMPT DEFEATED.' },
  { type: 'info', text: 'SYSTEM CAPACITORS FLOODED. POWER GRID AT 105% OVERLOAD.' },
  { type: 'success', text: 'MAEVICRAFT IDLE LOADED. SIMULATE PRINT QUEUE: /game/' }
];

let isTypingLog = false;
const logQueue = [];

function processLogQueue() {
  if (isTypingLog || logQueue.length === 0) return;
  const { type, text } = logQueue.shift();
  isTypingLog = true;

  const outputEl = document.getElementById('console-output');
  if (!outputEl) {
    isTypingLog = false;
    return;
  }

  const timestamp = new Date().toISOString().slice(11, 19);
  const rowEl = document.createElement('div');
  rowEl.className = `console-row ${type}`;
  rowEl.innerHTML = `<span style="color: var(--text-tertiary)">[${timestamp}]</span> <span style="font-weight: 700;">&gt;</span> <span class="log-text"></span>`;
  outputEl.appendChild(rowEl);
  
  if (outputEl.children.length > 50) {
    outputEl.removeChild(outputEl.firstChild);
  }
  
  const textSpan = rowEl.querySelector('.log-text');
  let charIdx = 0;
  
  function typeChar() {
    if (charIdx < text.length) {
      textSpan.textContent += text.charAt(charIdx);
      charIdx++;
      outputEl.scrollTop = outputEl.scrollHeight;
      setTimeout(typeChar, 8 + Math.random() * 15);
    } else {
      outputEl.scrollTop = outputEl.scrollHeight;
      isTypingLog = false;
      setTimeout(processLogQueue, 200 + Math.random() * 300);
    }
  }
  
  typeChar();
}

function queueLog(type, text) {
  logQueue.push({ type, text });
  processLogQueue();
}

function initConsoleLogger() {
  let logDbIndex = 0;
  
  function queueNextDbLog() {
    if (logDbIndex < logDatabase.length) {
      queueLog(logDatabase[logDbIndex].type, logDatabase[logDbIndex].text);
      logDbIndex++;
      setTimeout(queueNextDbLog, 1000 + Math.random() * 1500);
    } else {
      startDiagnosticsLoop();
    }
  }

  queueNextDbLog();

  function startDiagnosticsLoop() {
    function queueDiagnostic() {
      const diagnostics = [
        { type: 'info', text: `CONN PING STATUS: STABLE [LATENCY ${Math.floor(Math.random() * 8) + 12}ms]` },
        { type: 'success', text: `HEALTH CHECK: NODE ONLINE [TEMP: -8.${Math.floor(Math.random() * 5) + 7}°C]` },
        { type: 'info', text: `UPLINK BUFFER STATUS: CLEAR [PACKETS PROCESSED: ${Math.floor(Math.random() * 100) + 400}]` },
        { type: 'warn', text: `CPU TEMPERATURE spikes to -6.2°C. FAN CONTROL AUTO-ENGAGED.` }
      ];
      const randomLog = diagnostics[Math.floor(Math.random() * diagnostics.length)];
      queueLog(randomLog.type, randomLog.text);
      setTimeout(queueDiagnostic, 6000 + Math.random() * 6000);
    }
    queueDiagnostic();
  }

  // Start Easter Egg loop (every 60-90s)
  function startEasterEggLoop() {
    function queueEasterEgg() {
      const log = easterEggLogs[Math.floor(Math.random() * easterEggLogs.length)];
      queueLog(log.type, log.text);
      setTimeout(queueEasterEgg, 60000 + Math.random() * 30000);
    }
    setTimeout(queueEasterEgg, 30000);
  }
  startEasterEggLoop();
}

/**
  * 7. NEWSLETTER SUBSCRIPTION FORM
  */
function initSubscriptionForm() {
  const formEl = document.getElementById('subscribe-form');
  const inputEl = document.getElementById('subscriber-email');
  const submitBtn = document.getElementById('submit-btn');
  const responseEl = document.getElementById('form-response');

  if (!formEl || !inputEl || !submitBtn || !responseEl) return;

  // Placeholder focus/load flicker triggers
  inputEl.classList.add('placeholder-flicker');
  inputEl.addEventListener('focus', () => {
    inputEl.classList.remove('placeholder-flicker');
    void inputEl.offsetWidth; // force reflow
    inputEl.classList.add('placeholder-flicker');
  });

  const savedEnlistment = localStorage.getItem('maevis_enlistment');
  if (savedEnlistment) {
    displaySuccessState(JSON.parse(savedEnlistment));
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = inputEl.value.trim();

    if (!validateEmail(email)) {
      responseEl.className = 'form-response form-response-error';
      responseEl.innerText = 'ERROR: INVALID CORRESPONDENCE FORMAT';
      return;
    }

    inputEl.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerText = '[ TRANSMITTING... ]';
    responseEl.className = 'form-response';
    responseEl.innerText = 'UPLINK INITIATED. ENCRYPTING DATA PATH...';

    // Dispatch email to Formsubmit.co asynchronously
    fetch("https://formsubmit.co/ajax/maevis1807@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email,
        _subject: "MAEVIS Portal - New Enlistment Request",
        message: `Subscriber ${email} has requested early genesis portal access.`
      })
    })
    .then(res => res.json())
    .then(data => {
      queueLog('success', 'MAIL LINK FORWARDED TO GATEWAY SECURELY.');
    })
    .catch(err => {
      console.error("Mail linkage error:", err);
      queueLog('warn', 'MAIL UPLINK OFFLINE. LOCAL ENLISTMENT SAVED.');
    });

    setTimeout(() => {
      responseEl.innerText = 'GENERATING SECURE GENESIS AUTHENTICATOR...';
    }, 1000);

    setTimeout(() => {
      const keyPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const accessCode = `MVS-${keyPart1}-${keyPart2}`;
      
      const enlistmentDetails = {
        email: email,
        accessCode: accessCode,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('maevis_enlistment', JSON.stringify(enlistmentDetails));
      displaySuccessState(enlistmentDetails);
    }, 2400);
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function displaySuccessState(details) {
    formEl.style.display = 'none';
    
    responseEl.className = 'form-response form-response-success';
    responseEl.innerHTML = `
      <div style="border: 1px solid var(--color-neon-green); padding: 1rem; border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary);">
        <div style="font-weight: 700; border-bottom: 1px dashed var(--color-neon-green); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">[ ACCESS GRANTED // LINK ESTABLISHED ]</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem;">CREDENTIAL: <span style="color: var(--text-primary)">${details.email}</span></div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem;">ACCESS KEY: <span style="color: var(--text-primary); font-family: var(--font-extended); font-weight: 800; font-size: 0.8rem; letter-spacing: 1px;">${details.accessCode}</span></div>
        <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 0.5rem;">A digital token has been allocated. System notifications will route to your address. Return to home terminal complete.</div>
      </div>
    `;
    
    queueLog('success', 'CLIENT REGISTERED SECURELY. ACCESS KEY ENABLED.');
  }
}

/**
  * 8. BUTTON CLICK RIPPLE EFFECTS
  */
function initButtonRipples() {
  const buttons = document.querySelectorAll('.submit-button, .audio-toggle-btn, .social-capsule');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      this.appendChild(ripple);
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });
  });
}

/**
  * 9. AUDIO HUM WEB AUDIO SYNTHESIZER
  */
let audioCtx = null;
let osc1 = null;
let osc2 = null;
let filter = null;
let mainGain = null;
let isAudioPlaying = false;

function initAudioHum() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (!audioBtn) return;
  
  audioBtn.addEventListener('click', () => {
    if (!isAudioPlaying) {
      startSynthHum();
    } else {
      stopSynthHum();
    }
  });
}

function startSynthHum() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    filter = audioCtx.createBiquadFilter();
    mainGain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 59.5;

    osc2.type = 'sawtooth';
    osc2.frequency.value = 60.5;

    filter.type = 'lowpass';
    filter.frequency.value = 90;
    filter.Q.value = 4;

    mainGain.gain.setValueAtTime(0, audioCtx.currentTime);
    mainGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    osc1.start(0);
    osc2.start(0);

    isAudioPlaying = true;
    document.getElementById('audio-toggle-btn').innerText = '[ AUDIO: ACTIVE ]';
    queueLog('info', 'AMBIENT SYNTH DRONE ACTIVATED [60Hz MACHINE HUM].');
  } catch (e) {
    console.error('Audio initialization failed:', e);
  }
}

function stopSynthHum() {
  if (mainGain && audioCtx) {
    mainGain.gain.setValueAtTime(mainGain.gain.value, audioCtx.currentTime);
    mainGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    setTimeout(() => {
      try {
        if (osc1) osc1.stop();
        if (osc2) osc2.stop();
      } catch(e) {}
      isAudioPlaying = false;
      document.getElementById('audio-toggle-btn').innerText = '[ AUDIO: MUTED ]';
      queueLog('info', 'AMBIENT SYNTH DRONE DEACTIVATED.');
    }, 350);
  }
}
