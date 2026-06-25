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
  * 2. 3D HOLOGRAM CANVAS SKULL
  */
const skullPoints = [];
const dissolutionParticles = [];

// Spring parallax values updated by mousemove listener
let currentTiltX = 0;
let currentTiltY = 0;
let targetTiltX = 0;
let targetTiltY = 0;

function init3DSkullCanvas() {
  const canvas = document.getElementById('hologram-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 660;
  const height = canvas.height = 660;

  // Sculpt the 3D skull points (Denser point cloud for organic visibility)
  // A. Cranium
  for (let i = 0; i < 1300; i++) {
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.random() * (Math.PI * 0.65);
      skullPoints.push({
          x: Math.cos(theta) * Math.sin(phi) * 1.5,
          y: -Math.cos(phi) * 1.3 - 0.4,
          z: Math.sin(theta) * Math.sin(phi) * 1.5
      });
  }
  
  // B. Face, Cheekbones & Nasal Cavity
  for (let i = 0; i < 1600; i++) {
      let y = (Math.random() * 1.4) - 0.5;
      let widthFactor = y < 0.2 ? 1.3 : 0.85;
      let rad = Math.sqrt(Math.max(0, 1 - (y * y))) * widthFactor;
      let theta = (Math.random() * Math.PI * 0.8) - (Math.PI * 0.4);
      
      let x = Math.sin(theta) * rad;
      let z = Math.cos(theta) * rad + 0.3;

      // Carve sockets
      if (y > -0.3 && y < 0.1 && Math.abs(x) > 0.3 && Math.abs(x) < 0.85) continue;
      // Carve nose
      if (y > 0.1 && y < 0.4 && Math.abs(x) < (y - 0.1) * 0.9) continue;
      // Carve temple
      if (y > -0.5 && y < -0.1 && Math.abs(theta) > 0.8) continue;

      skullPoints.push({ x: x, y: y, z: z });
  }
  
  // C. Lower Teeth & Narrow Jaw
  for (let i = 0; i < 900; i++) {
      let y = (Math.random() * 0.5) + 0.9;
      let theta = (Math.random() * Math.PI * 0.5) - (Math.PI * 0.25);
      let rad = 0.65 - (y * 0.1); 
      skullPoints.push({
          x: Math.sin(theta) * rad,
          y: y,
          z: Math.cos(theta) * rad + 0.4
      });
  }

  let rotationAngle = 0;
  const scale = 520;
  const distance = 3.8;

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

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    // Mouse Parallax integration
    const displayWidth = canvas.clientWidth || 660;
    const isMobileSize = displayWidth < 500;
    
    // On desktop, face slightly right (towards the card); on mobile, face straight front
    const baseAngleY = isMobileSize ? 0.0 : 0.55;
    
    // Slow scanning oscillation instead of full rotation so the detailed front face is always visible
    const scanAngle = Math.sin(Date.now() / 3500) * 0.6; 
    
    const angleY = baseAngleY + scanAngle + currentTiltY * 0.4;
    const angleX = 0.05 + currentTiltX * 0.2; // Keep skull upright, responsive to mouse/tilt

    // Update & Draw Dissolution Particles
    if (Math.random() < 0.35 && skullPoints.length > 0) {
      const randPt = skullPoints[Math.floor(Math.random() * skullPoints.length)];
      const ptProj = getRotatedProjectedPoint(randPt, angleY, angleX);
      if (ptProj.z2 > 0) {
        const displayWidth = canvas.clientWidth || 660;
        const isMobileSize = displayWidth < 500;
        const sizeMultiplier = isMobileSize ? 2.5 : 1.0;
        dissolutionParticles.push({
          x: ptProj.xp,
          y: ptProj.yp,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 1.5 - 0.5,
          alpha: 1.0,
          decay: 0.01 + Math.random() * 0.015,
          color: Math.random() > 0.5 ? 'rgba(236, 72, 153, ' : 'rgba(249, 115, 22, ',
          size: (Math.random() * 1.5 + 0.5) * sizeMultiplier
        });
      }
    }

    // Draw dissolution particles
    for (let i = dissolutionParticles.length - 1; i >= 0; i--) {
      const p = dissolutionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        dissolutionParticles.splice(i, 1);
      } else {
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
    }

    // Draw Skull points
    if (isGlitching) {
      const dx = (Math.random() - 0.5) * 16;
      const dy = (Math.random() - 0.5) * 8;
      drawPoints(angleY, angleX, dx, dy, 'rgba(236, 72, 153, 0.7)');
      drawPoints(angleY, angleX, -dx, -dy, 'rgba(0, 255, 255, 0.7)');
    } else {
      drawPoints(angleY, angleX, 0, 0);
    }

    // Draw eye socket flares
    const leftEye = { x: -0.36, y: -0.12, z: 0.82 };
    const rightEye = { x: 0.36, y: -0.12, z: 0.82 };
    
    const eyeL = getRotatedProjectedPoint(leftEye, angleY, angleX);
    const eyeR = getRotatedProjectedPoint(rightEye, angleY, angleX);
    
    drawEyeGlow(eyeL);
    drawEyeGlow(eyeR);

    requestAnimationFrame(drawFrame);
  }

  function drawPoints(angY, angX, offsetOffsetX, offsetOffsetY, overrideColor) {
    const displayWidth = canvas.clientWidth || 660;
    const isMobileSize = displayWidth < 500;
    
    // Scale up dots and baseline alpha on mobile/small screens to compensate for canvas downscaling
    const dotBase = isMobileSize ? 2.5 : 1.0;
    const dotExtra = isMobileSize ? 3.0 : 1.5;
    const alphaBase = isMobileSize ? 0.38 : 0.15;
    const alphaExtra = isMobileSize ? 0.57 : 0.70;

    for (let p of skullPoints) {
      let pt = getRotatedProjectedPoint(p, angY, angX);
      let xp = pt.xp + offsetOffsetX;
      let yp = pt.yp + offsetOffsetY;

      if (xp >= 0 && xp < width && yp >= 0 && yp < height) {
        let t = (pt.z2 + 1.5) / 3.0;
        t = Math.max(0, Math.min(1, t));

        let r, g, b, alpha;
        if (overrideColor) {
          ctx.fillStyle = overrideColor;
        } else {
          // Blend Magenta (236, 72, 153) to Orange (249, 115, 22)
          r = Math.round(236 + t * (249 - 236));
          g = Math.round(72 + t * (115 - 72));
          b = Math.round(153 + t * (22 - 153));
          alpha = alphaBase + t * alphaExtra;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        let dotSize = dotBase + t * dotExtra;
        ctx.fillRect(xp - dotSize/2, yp - dotSize/2, dotSize, dotSize);
      }
    }
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
  { type: 'success', text: 'PING ESTABLISHED [RTT 14ms]. DEPLOYMENT READY.' }
];

const easterEggLogs = [
  { type: 'success', text: 'ACCESS GRANTED: COLD ARCHIVE SEQUENCE COMPLETE.' },
  { type: 'success', text: 'AI ONLINE: COGNITIVE NEURAL LAYER SYNCHRONIZED.' },
  { type: 'info', text: 'NEURAL LINK: SYNCING QUANTUM CRYPTOGRAPHY ENGINES...' },
  { type: 'success', text: 'SOL0425: GENESIS BLOCK MINED SUCCESSFULLY [HASH: 0000x8a92f]' },
  { type: 'warn', text: 'PORTAL CALIBRATION: DETECTED SPATIAL ANOMALY IN MATRIX. CORRECTING...' },
  { type: 'error', text: 'FIREWALL ALERT: UNIDENTIFIED MALICIOUS SUBNET ATTEMPT DEFEATED.' },
  { type: 'info', text: 'SYSTEM CAPACITORS FLOODED. POWER GRID AT 105% OVERLOAD.' }
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
