// ==========================================================================
// MAEVIS GENESIS PORTAL - INTERACTION SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initSystemClocks();
  initConsoleLogger();
  initSubscriptionForm();
});

/**
 * 1. HIGH-PRECISION COUNTDOWN
 */
function initCountdown() {
  // Set launch target to August 8, 2026 00:00:00 UTC
  const launchTarget = new Date('2026-08-08T00:00:00Z').getTime();

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const progressBarEl = document.getElementById('progress-bar');
  const progressPctEl = document.getElementById('progress-percentage');

  function updateTimer() {
    const now = new Date().getTime();
    const distance = launchTarget - now;

    if (distance < 0) {
      // Launch target reached
      if (daysEl) daysEl.innerText = '00';
      if (hoursEl) hoursEl.innerText = '00';
      if (minutesEl) minutesEl.innerText = '00';
      if (secondsEl) secondsEl.innerText = '00';
      if (progressBarEl) progressBarEl.style.width = '100%';
      if (progressPctEl) progressPctEl.innerText = '100.0% [LAUNCHED]';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Format with leading zeros
    if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');

    // Dynamically calculate progress bar percent (starting from 84.2% on June 24, 2026, creeping up to 99% close to launch)
    const totalDuration = launchTarget - new Date('2026-06-24T00:00:00Z').getTime();
    const elapsed = now - new Date('2026-06-24T00:00:00Z').getTime();
    let percentage = 84.2 + (elapsed / totalDuration) * 15.8;
    if (percentage > 99.9) percentage = 99.9;
    if (percentage < 84.2) percentage = 84.2;

    const formattedPercentage = percentage.toFixed(4) + '%';
    if (progressBarEl) progressBarEl.style.width = formattedPercentage;
    if (progressPctEl) progressPctEl.innerText = formattedPercentage;
  }

  // Initial call and set interval
  updateTimer();
  setInterval(updateTimer, 1000);
}

/**
 * 2. LIVE SYSTEM TIME CLOCK
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
 * 3. SIMULATED SYSTEM LOG CONSOLE
 */
function initConsoleLogger() {
  const outputEl = document.getElementById('console-output');
  if (!outputEl) return;

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

  function appendLog() {
    if (currentLogIndex >= logDatabase.length) {
      // Loop logs or output idle ping status to keep console active
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

  function writeLogLine(type, text) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const rowEl = document.createElement('div');
    rowEl.className = `console-row ${type}`;
    rowEl.innerHTML = `<span style="color: var(--text-tertiary)">[${timestamp}]</span> <span style="font-weight: 700;">&gt;</span> ${text}`;
    
    outputEl.appendChild(rowEl);
    outputEl.scrollTop = outputEl.scrollHeight;

    // Maintain a max line count to prevent lag
    if (outputEl.children.length > 50) {
      outputEl.removeChild(outputEl.firstChild);
    }
  }

  // Start fast and then trigger at normal pace
  appendLog();
  setTimeout(appendLog, 500);
  setTimeout(appendLog, 1200);
  setTimeout(appendLog, 2000);
  
  // Set interval for ongoing logs
  setInterval(appendLog, 4500);
}

/**
 * 4. INTERACTIVE EMAIL NEWSLETTER FORM
 */
function initSubscriptionForm() {
  const formEl = document.getElementById('subscribe-form');
  const inputEl = document.getElementById('subscriber-email');
  const submitBtn = document.getElementById('submit-btn');
  const responseEl = document.getElementById('form-response');

  if (!formEl || !inputEl || !submitBtn || !responseEl) return;

  // Check if they are already enlisted in localStorage
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

    // Disable input and button during submission simulation
    inputEl.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerText = '[ TRANSMITTING... ]';
    responseEl.className = 'form-response';
    responseEl.innerText = 'UPLINK INITIATED. ENCRYPTING DATA PATH...';

    // Simulate cybernetic registration stages
    setTimeout(() => {
      responseEl.innerText = 'GENERATING SECURE GENESIS AUTHENTICATOR...';
    }, 1000);

    setTimeout(() => {
      // Create random access key
      const keyPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const keyPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const accessCode = `MVS-${keyPart1}-${keyPart2}`;
      
      const enlistmentDetails = {
        email: email,
        accessCode: accessCode,
        timestamp: new Date().toISOString()
      };

      // Save to localstorage
      localStorage.setItem('maevis_enlistment', JSON.stringify(enlistmentDetails));
      
      // Update UI to success state
      displaySuccessState(enlistmentDetails);
    }, 2400);
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function displaySuccessState(details) {
    // Hide standard form elements
    formEl.style.display = 'none';
    
    // Inject success content with terminal styling
    responseEl.className = 'form-response form-response-success';
    responseEl.innerHTML = `
      <div style="border: 1px solid var(--color-neon-green); padding: 1rem; border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary);">
        <div style="font-weight: 700; border-bottom: 1px dashed var(--color-neon-green); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">[ ACCESS GRANTED // LINK ESTABLISHED ]</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem;">CREDENTIAL: <span style="color: var(--text-primary)">${details.email}</span></div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.25rem;">ACCESS KEY: <span style="color: var(--text-primary); font-family: var(--font-extended); font-weight: 800; font-size: 0.8rem; letter-spacing: 1px;">${details.accessCode}</span></div>
        <div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 0.5rem;">A digital token has been allocated. System notifications will route to your address. Return to home terminal complete.</div>
      </div>
    `;
    
    // Add custom logs into the console reflecting registration
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      const timestamp = new Date().toISOString().slice(11, 19);
      const regRow = document.createElement('div');
      regRow.className = 'console-row success';
      regRow.innerHTML = `<span style="color: var(--text-tertiary)">[${timestamp}]</span> <span style="font-weight: 700;">&gt;</span> CLIENT REGISTERED SECURELY. ACCESS KEY ENABLED.`;
      consoleOutput.appendChild(regRow);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  }
}
