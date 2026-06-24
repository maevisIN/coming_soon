// ==========================================================================
// MAEVIS GENESIS PORTAL - INTERACTION SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initMatrixSkull();
  initProgressBar();
  initSystemClocks();
  initConsoleLogger();
  initSubscriptionForm();
});

/**
 * 1. DYNAMIC HOLOGRAPHIC MATRIX SKULL BACKGROUND
 */
const skullMatrix = [
  "mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm",
  "mmmmmmmmmmmmmmmmmmmmmmmmmmpppppppppppppppppppppppppppppppppppppp",
  "mmmmmmmmmmmmmmmmmmmmppppppddddddddddddddddddddddpppppppppppppppp",
  "mmmmmmmmmmmmmmmmppppddddddddddddddddddddddddddddddppppppppcccccc",
  "mmmmmmmmmmmmmmppddddddddddddddddddddddddddddddddddddppppcccccccc",
  "mmmmmmmmmmmmppddddddddddddddddddddddddddddddddddddddddppcccccccc",
  "mmmmmmmmmmppddddddddddddddddddddddddddddddddddddddddddddppcccccc",
  "mmmmmmmmmpddddddddddddddddddddddddddddddddddddddddddddddddPccccc",
  "mmmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddppccc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmppdddddddyyyyyyyddddddddddddddddddyyyyyyydddddddddddddppcc",
  "mmmmmmppddddddyyyyyyyyyddddddddddddddddyyyyyyyyyddddddddddddppcc",
  "mmmmmmppddddddyy     yyddddddddddddddddyy     yyddddddddddddppcc",
  "mmmmmmppddddddyy  o  yyddddddddddddddddyy  o  yyddddddddddddppcc",
  "mmmmmmppddddddyy     yyddddddddddddddddyy     yyddddddddddddppcc",
  "mmmmmmppddddddyyyyyyyyyddddddddddddddddyyyyyyyyyddddddddddddppcc",
  "mmmmmmppdddddddyyyyyyyddddddddddddddddddyyyyyyydddddddddddddppcc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddddddppcc",
  "mmmmmmmppddddddddddddddddddddddooddddddddddddddddddddddddddppccc",
  "mmmmmmmppdddddddddddddddddddddoooodddddddddddddddddddddddddppccc",
  "mmmmmmmmppddddddddddddddddddddddddddddddddddddddddddddddddppcccc",
  "mmmmmmmmmppddddddddddddddddddddddddddddddddddddddddddddddppccccc",
  "mmmmmmmmmmppddddddddddddddddddddddddddddddddddddddddddddppcccccc",
  "mmmmmmmmmmmppddddddddddddddddddddddddddddddddddddddddddppccccccc",
  "mmmmmmmmmmmmppddddddddddddddddddddddddddddddddddddddddppcccccccc",
  "mmmmmmmmmmmmmppddddddddddddddddddddddddddddddddddddddppccccccccc",
  "mmmmmmmmmmmmmmppddddddddddddddddddddddddddddddddddddppcccccccccc",
  "mmmmmmmmmmmmmmmppddddddddddddddddddddddddddddddddddppccccccccccc",
  "mmmmmmmmmmmmmmmmppddddddddddddddddddddddddddddddddppcccccccccccc",
  "mmmmmmmmmmmmmmmmmppddddddddddddddddddddddddddddddppccccccccccccc",
  "mmmmmmmmmmmmmmmmmmppdddddyyyddddyyyyydddddddddddppcccccccccccccc",
  "mmmmmmmmmmmmmmmmmmmppddddyyyddddyyyddddddddddddppccccccccccccc",
  "mmmmmmmmmmmmmmmmmmmmppdddyyyddddyyydddddddddddppcccccccccccc",
  "mmmmmmmmmmmmmmmmcccccppddddddddddddddddddddddppcccccccccccc",
  "mmmmmmmmmmmmccccccccccppppppppppppppppppppppppccccccccccccc"
];

function initMatrixSkull() {
  const container = document.getElementById('ascii-skull');
  if (!container) return;

  const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=:;.";
  let displayRows = [];

  function buildGrid() {
    container.innerHTML = '';
    displayRows = [];

    // Calculate how many characters are needed to fill the screen width
    const charWidth = 8.5; // average width in pixels for JetBrains Mono at 13px
    const colsToFill = Math.ceil(window.innerWidth / charWidth);
    const skullWidth = skullMatrix[0].length;
    const paddingSize = Math.max(0, Math.floor((colsToFill - skullWidth) / 2));

    skullMatrix.forEach((row, rowIndex) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'matrix-line';
      const cellSpans = [];

      // Helper to add characters
      function addChar(type) {
        const span = document.createElement('span');
        let char = 'm';
        
        if (type === 'm') {
          span.className = 'char-g';
        } else if (type === 'p') {
          span.className = 'char-t';
          char = charSet[Math.floor(Math.random() * charSet.length)];
        } else if (type === 'd') {
          span.className = 'char-d';
          char = charSet[Math.floor(Math.random() * charSet.length)];
        } else if (type === 'y') {
          span.className = 'char-y';
          char = charSet[Math.floor(Math.random() * charSet.length)];
        } else if (type === 'o') {
          span.className = 'char-o';
          char = charSet[Math.floor(Math.random() * charSet.length)];
        } else if (type === 'c') {
          span.className = 'char-c';
          char = charSet[Math.floor(Math.random() * charSet.length)];
        } else if (type === ' ') {
          span.innerHTML = '&nbsp;';
          lineEl.appendChild(span);
          cellSpans.push({ span, type: ' ', char: ' ' });
          return;
        }

        span.innerText = char;
        lineEl.appendChild(span);
        cellSpans.push({ span, type, char });
      }

      // Prepend padding
      for (let i = 0; i < paddingSize; i++) {
        addChar('m');
      }

      // Skull content
      for (let i = 0; i < row.length; i++) {
        addChar(row[i]);
      }

      // Append padding
      for (let i = 0; i < paddingSize; i++) {
        addChar('m');
      }

      container.appendChild(lineEl);
      displayRows.push(cellSpans);
    });
  }

  // Twinkle animation: randomly update a small fraction of characters
  function twinkle() {
    if (displayRows.length === 0) return;
    
    const tweakCount = Math.floor(displayRows.length * displayRows[0].length * 0.04);
    for (let k = 0; k < tweakCount; k++) {
      const r = Math.floor(Math.random() * displayRows.length);
      const c = Math.floor(Math.random() * displayRows[0].length);
      const cell = displayRows[r][c];

      if (cell.type !== ' ' && cell.type !== 'm') {
        const newChar = charSet[Math.floor(Math.random() * charSet.length)];
        cell.span.innerText = newChar;
        cell.char = newChar;
      }
    }
  }

  // Generate on load
  buildGrid();

  // Re-generate on resize to keep background filled
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(buildGrid, 250);
  });

  // Run the twinkling loops
  setInterval(twinkle, 120);
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
