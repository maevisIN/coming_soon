// ==========================================================================
// MAEVIS GENESIS PORTAL - INTERACTION SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initSystemClocks();
  initConsoleLogger();
  initSubscriptionForm();
  initNavbarInteractions();
});

/**
 * 1. DYNAMIC SYSTEM CALIBRATION PROGRESS BAR
 */
let progressInterval = null;
function initProgressBar() {
  const progressBarEl = document.getElementById('progress-bar');
  const progressPctEl = document.getElementById('progress-percentage');
  if (!progressBarEl || !progressPctEl) return;

  function updateProgress() {
    const now = new Date();
    const secs = now.getSeconds() + now.getMilliseconds() / 1000;
    // Creep the progress bar between 84.20% and 84.35% dynamically based on the current minute's seconds
    const pct = 84.2 + (secs / 60) * 0.15;
    const formatted = pct.toFixed(4) + '%';
    progressBarEl.style.width = formatted;
    progressPctEl.innerText = formatted;
  }
  updateProgress();
  progressInterval = setInterval(updateProgress, 1000);
}

/**
 * 2. LIVE SYSTEM TIME CLOCK (UTC and Local side-by-side)
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
let logInterval = null;
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

  // Clear output on init
  outputEl.innerHTML = '';
  currentLogIndex = 0;

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

  // Start fast and then trigger at normal pace
  appendLog();
  setTimeout(appendLog, 500);
  setTimeout(appendLog, 1200);
  setTimeout(appendLog, 2000);
  
  // Set interval for ongoing logs
  logInterval = setInterval(appendLog, 4500);
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

  // Maintain a max line count to prevent lag
  if (outputEl.children.length > 50) {
    outputEl.removeChild(outputEl.firstChild);
  }
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

    // Simulate registration stages
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

      // Save to localstorage
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

/**
 * 5. NAVBAR INTERACTIVE TABS CONTROL
 */
function initNavbarInteractions() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const logoBtn = document.getElementById('nav-logo-btn');
  
  const windowTitleEl = document.getElementById('gateway-node-title');
  const subtitleTagEl = document.getElementById('node-subtitle-tag');
  
  const progressBarTitleEl = document.getElementById('progress-bar-title');
  const progressBarEl = document.getElementById('progress-bar');
  const progressPctEl = document.getElementById('progress-percentage');
  const consoleNodeLabelEl = document.getElementById('console-node-label');

  if (!tabs) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active nav styles
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      handleTabSwitch(tabName);
    });
  });

  if (logoBtn) {
    logoBtn.addEventListener('click', () => {
      // Clicking logo returns to HOME tab
      tabs.forEach(t => {
        if (t.getAttribute('data-tab') === 'HOME') {
          t.click();
        }
      });
    });
  }

  function handleTabSwitch(tabName) {
    // Write routing log to the terminal console
    writeLogLine('info', `ROUTING LINK TO TARGET CHANNEL: [${tabName}]`);
    
    if (tabName === 'HOME') {
      // Restore Home state
      if (windowTitleEl) windowTitleEl.innerText = '[ GENESIS_GATEWAY_NODE ]';
      if (subtitleTagEl) subtitleTagEl.innerText = 'SOL0425 // PORTAL CALIBRATION IN PROGRESS';
      if (progressBarTitleEl) progressBarTitleEl.innerText = 'SYSTEM DECRYPTION STATUS';
      if (consoleNodeLabelEl) consoleNodeLabelEl.innerText = 'SYSTEM LOGS [RAAVH-SEC::92]';
      
      // Restart normal progress bar calibration
      if (progressInterval) clearInterval(progressInterval);
      initProgressBar();
      
      writeLogLine('success', 'LINK RESTORED. GENESIS SEQUENCE ONLINE.');
    } else {
      // Simulated connection offline redirection (similar to main React App's routing limits)
      let sectionCode = '';
      let subtagText = '';
      
      switch (tabName) {
        case 'SHOP':
          sectionCode = 'SEC_92_OFFLINE';
          subtagText = 'SEC::92 // ACCESS DENIED';
          break;
        case 'FABRICATE':
          sectionCode = 'FBR_04_OFFLINE';
          subtagText = 'FBR::04 // ACCESS DENIED';
          break;
        case 'BLOGS':
          sectionCode = 'LOG_0_92_OFFLINE';
          subtagText = 'LOG::0:92 // ACCESS DENIED';
          break;
      }
      
      // Change card title to offline alert
      if (windowTitleEl) windowTitleEl.innerText = `[ ${sectionCode} ]`;
      if (subtitleTagEl) subtitleTagEl.innerText = subtagText;
      if (progressBarTitleEl) progressBarTitleEl.innerText = 'CHANNEL PING ATTEMPT';
      if (consoleNodeLabelEl) consoleNodeLabelEl.innerText = `DIAGNOSTICS LOGGER [${tabName}]`;
      
      // Set progress bar to 0% to represent disconnected channel
      if (progressInterval) clearInterval(progressInterval);
      if (progressBarEl) progressBarEl.style.width = '0%';
      if (progressPctEl) progressPctEl.innerText = '0.0000% [OFFLINE]';
      
      writeLogLine('error', `ERR_CONN_REFUSED: Requested channel [${tabName}] is currently offline.`);
      writeLogLine('warn', 'REASON: External node requires secure genesis access key credentials.');
      writeLogLine('info', 'SUGGESTION: Input credential email in enlistment box to calibrate uplink.');
    }
  }
}
