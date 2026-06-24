// ==========================================================================
// MAEVIS GENESIS PORTAL - INTERACTION SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  init3DSkulls();
  initProgressBar();
  initSystemClocks();
  initConsoleLogger();
  initSubscriptionForm();
});

/**
 * 1. MATHEMATICAL 3D ROTATING SKULL GENERATOR (Flanking Sides)
 */
function init3DSkulls() {
  const preLeft = document.getElementById('ascii-art-left');
  const preRight = document.getElementById('ascii-art-right');
  if (!preLeft && !preRight) return;

  const points = [];
  
  // A. Generate 3D cranium dome
  for (let theta = 0; theta < Math.PI * 2; theta += 0.1) {
    for (let phi = 0; phi < Math.PI / 2; phi += 0.1) {
      points.push({
        x: Math.cos(theta) * Math.sin(phi) * 1.5,
        y: -Math.cos(phi) * 1.5 - 0.3,
        z: Math.sin(theta) * Math.sin(phi) * 1.5
      });
    }
  }
  
  // B. Generate jaw and cheekbones (with hollow cheek, nose and eye cuts)
  for (let x = -0.6; x <= 0.6; x += 0.1) {
    for (let y = -0.3; y <= 0.8; y += 0.1) {
      let z = Math.sqrt(Math.max(0, 1 - (x*x) - (y*y))) * 1.2;
      if (y > 0.3 && Math.abs(x) > 0.4) continue; // Hollow cheeks
      if (y > 0.1 && y < 0.3 && Math.abs(x) < 0.2) continue; // Nose hole
      if (y > -0.4 && y < 0.0 && Math.abs(x) > 0.3 && Math.abs(x) < 0.7) continue; // Eye sockets
      points.push({ x: x, y: y, z: z });
      points.push({ x: x, y: y, z: -z });
    }
  }

  let angleLeft = 0;
  let angleRight = Math.PI; // Out of phase by 180 degrees
  const width = 80;
  const height = 45;
  const chars = " .:-=+*#%@";

  // Function to render a single frame of the 3D skull
  function renderFrame(preElement, currentAngle) {
    let screen = Array(width * height).fill(' ');
    let zBuffer = Array(width * height).fill(-Infinity);

    for (let p of points) {
      // Rotate around Y axis (horizontal rotation)
      let x1 = p.x * Math.cos(currentAngle) - p.z * Math.sin(currentAngle);
      let z1 = p.x * Math.sin(currentAngle) + p.z * Math.cos(currentAngle);
      
      // Rotate slightly around X axis (3D tilt)
      let y2 = p.y * Math.cos(0.25) - z1 * Math.sin(0.25);
      let z2 = p.y * Math.sin(0.25) + z1 * Math.cos(0.25);

      // Perspective projection mapping 3D to 2D
      let distance = 3.5;
      let ooz = 1 / (distance - z2);
      
      // Horizontal scale multiplier 2.1 to compensate for terminal font height aspect ratios
      let xp = Math.floor(width / 2 + (x1 * 33 * ooz * 2.1));
      let yp = Math.floor(height / 2 + (y2 * 33 * ooz));

      if (xp >= 0 && xp < width && yp >= 0 && yp < height) {
        let idx = xp + yp * width;
        // Compare current depth against Z-buffer (using corrected z2 variable)
        if (z2 > zBuffer[idx]) {
          zBuffer[idx] = z2;
          // Calculate lighting based on Z depth
          let luminanceIdx = Math.floor(((z2 + 1.5) / 3) * (chars.length - 1));
          luminanceIdx = Math.max(0, Math.min(chars.length - 1, luminanceIdx));
          screen[idx] = chars[luminanceIdx];
        }
      }
    }

    // Assemble screen buffer into a single text output
    let output = "";
    for (let i = 0; i < height; i++) {
      output += screen.slice(i * width, (i + 1) * width).join('') + "\n";
    }
    preElement.textContent = output;
  }

  function renderLoop() {
    angleLeft += 0.02; // Rotation speed for left skull
    angleRight -= 0.02; // Rotate right skull in opposite direction

    if (preLeft) renderFrame(preLeft, angleLeft);
    if (preRight) renderFrame(preRight, angleRight);

    requestAnimationFrame(renderLoop);
  }

  renderLoop();
}

/**
 * 2. DYNAMIC SYSTEM CALIBRATION PROGRESS BAR
 */
function initProgressBar() {
  const progressBarEl = document.getElementById('progress-bar');
  const progressPctEl = document.getElementById('progress-percentage');
  if (!progressBarEl || !progressPctEl) return;

  function updateProgress() {
    const now = new Date();
    const secs = now.getSeconds() + now.getMilliseconds() / 1000;
    const pct = 84.2 + (secs / 60) * 0.15;
    const formatted = pct.toFixed(4) + '%';
    progressBarEl.style.width = formatted;
    progressPctEl.innerText = formatted;
  }
  updateProgress();
  setInterval(updateProgress, 1000);
}

/**
 * 3. LIVE SYSTEM TIME CLOCK (UTC and Local side-by-side)
 */
function initSystemClocks() {
  const clockEl = document.getElementById('clock-display');
  if (!clockEl) return;

  function updateClocks() {
    const now = new Date();
    
    // Format UTC Time
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
    const utcSecs = String(now.getUTCSeconds()).padStart(2, '0');
    
    // Format Local Time
    const locHours = String(now.getHours()).padStart(2, '0');
    const locMins = String(now.getMinutes()).padStart(2, '0');
    const locSecs = String(now.getSeconds()).padStart(2, '0');

    clockEl.innerText = `UTC: ${utcHours}:${utcMins}:${utcSecs} | LOC: ${locHours}:${locMins}:${locSecs}`;
  }

  updateClocks();
  setInterval(updateClocks, 1000);
}

/**
 * 4. SIMULATED SYSTEM LOG CONSOLE
 */
const logDatabase = [
  { type: 'info', text: 'SYSTEM REBOOT INITIATED ON GENESIS NODE [RAAVH-SEC::92]' },
  { type: 'info', text: 'CALIBRATING CORE MEMORY ARRAYS...' },
  { type: 'success', text: 'CORE SYSTEM MEMORY CALIBRATED.' },
  { type: 'info', text: 'CONNECTING TO REMOTE SUITE WORKSHOPS...' },
  { type: 'success', text: 'CONNECTION ESTABLISHED WITH WORKSHOP UNIT [WSH-01]' },
  { type: 'info', text: 'FETCHING STAMP & SEAL LEDGER REGISTRY...' },
  { type: 'warn', text: 'DETECTOR WARNING: VACUUM DOCK DUST FILTER LEVEL AT 12%' },
  { type: 'success', text: 'VACUUM PACK INTEGRITY TEST: STABLE [0.98 bar]' },
  { type: 'info', text: 'PARSING INVENTORY: SKIBIDI TOILET, BUTTERFLY KNIFE...' },
  { type: 'success', text: 'INVENTORY READY FOR FABRICATION QUEUE.' },
  { type: 'info', text: 'INJECTING RECENT LEDGER ENTRIES TO COLD ARCHIVE...' },
  { type: 'success', text: 'ARCHIVE COMMITTED TO SECURE STORAGE.' },
  { type: 'info', text: 'ESTABLISHING HANDSHAKE PING TO CLOUD NETWORK...' },
  { type: 'success', text: 'PING ESTABLISHED [RTT 14ms]. DEPLOYMENT READY.' }
];

let currentLogIndex = 0;

function initConsoleLogger() {
  const outputEl = document.getElementById('console-output');
  if (!outputEl) return;

  function appendLog() {
    if (currentLogIndex >= logDatabase.length) {
      const pingLogs = [
        { type: 'info', text: `CONN PING STATUS: STABLE [LATENCY ${Math.floor(Math.random() * 8) + 12}ms]` },
        { type: 'success', text: `HEALTH CHECK: NODE ONLINE [TEMP: -8.${Math.floor(Math.random() * 5) + 7}°C]` }
      ];
      const randomLog = pingLogs[Math.floor(Math.random() * pingLogs.length)];
      writeLogLine(randomLog.type, randomLog.text);
    } else {
      const log = logDatabase[currentLogIndex];
      writeLogLine(log.type, log.text);
      currentLogIndex++;
    }
  }

  // Start fast and then trigger at normal pace
  appendLog();
  setTimeout(appendLog, 500);
  setTimeout(appendLog, 1200);
  setTimeout(appendLog, 2000);
  
  setInterval(appendLog, 4500);
}

function writeLogLine(type, text) {
  const outputEl = document.getElementById('console-output');
  if (!outputEl) return;

  const timestamp = new Date().toISOString().slice(11, 19);
  const rowEl = document.createElement('div');
  rowEl.className = `console-row ${type}`;
  rowEl.innerHTML = `<span style="color: var(--text-tertiary)">[${timestamp}]</span> <span style="font-weight: 700;">&gt;</span> ${text}`;
  
  outputEl.appendChild(rowEl);
  outputEl.scrollTop = outputEl.scrollHeight;

  if (outputEl.children.length > 50) {
    outputEl.removeChild(outputEl.firstChild);
  }
}

/**
 * 5. INTERACTIVE EMAIL NEWSLETTER FORM
 */
function initSubscriptionForm() {
  const formEl = document.getElementById('subscribe-form');
  const inputEl = document.getElementById('subscriber-email');
  const submitBtn = document.getElementById('submit-btn');
  const responseEl = document.getElementById('form-response');

  if (!formEl || !inputEl || !submitBtn || !responseEl) return;

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
      writeLogLine('success', 'MAIL LINK FORWARDED TO GATEWAY SECURELY.');
    })
    .catch(err => {
      console.error("Mail linkage error:", err);
      writeLogLine('warn', 'MAIL UPLINK OFFLINE. LOCAL ENLISTMENT SAVED.');
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
    
    writeLogLine('success', 'CLIENT REGISTERED SECURELY. ACCESS KEY ENABLED.');
  }
}
