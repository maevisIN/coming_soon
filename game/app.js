// Maevicraft Idle - Main Application Logic

// --- GAME CONFIGURATIONS ---
const FILAMENTS = [
  { id: 'pla', name: 'PLA Green', cost: 0, color: '#28f3a3', multiplier: 1.0 },
  { id: 'petg', name: 'PETG Blue', cost: 120, color: '#28c3f3', multiplier: 1.5 },
  { id: 'abs', name: 'ABS Red', cost: 500, color: '#f34f28', multiplier: 2.2 },
  { id: 'wood', name: 'Wood-Fill PLA', cost: 2500, color: '#e5c07b', multiplier: 3.8 },
  { id: 'gold', name: 'Silk Gold', cost: 12000, color: '#ffd700', multiplier: 7.0 },
  { id: 'carbon', name: 'Carbon Fiber', cost: 65000, color: '#4a5061', multiplier: 15.0 },
  { id: 'rainbow', name: 'Rainbow Silk', cost: 350000, color: 'rainbow', multiplier: 40.0 },
  { id: 'glow', name: 'Glow Radioactive', cost: 1800000, color: '#bbfca2', multiplier: 120.0 }
];

const MODELS = [
  { id: 'cube', spriteId: 'cube', name: 'Calibration Cube', unlockCost: 0, baseComplexity: 100, baseValue: 12 },
  { id: 'benchy', spriteId: 'benchy', name: '3D Benchy', unlockCost: 150, baseComplexity: 220, baseValue: 38 },
  { id: 'octopus', spriteId: 'octopus', name: 'Cute Octopus', unlockCost: 900, baseComplexity: 450, baseValue: 130 },
  { id: 'knight', spriteId: 'knight', name: 'Chess Knight', unlockCost: 6000, baseComplexity: 900, baseValue: 560 },
  { id: 'sword', spriteId: 'sword', name: 'Sword of Extrusion', unlockCost: 35000, baseComplexity: 1800, baseValue: 2400 },
  { id: 'dino', spriteId: 'dino', name: 'T-Rex Dinosaur', unlockCost: 200000, baseComplexity: 3800, baseValue: 11000 },
  { id: 'mystery', spriteId: 'mystery', name: 'Glow Alien', unlockCost: 1200000, baseComplexity: 8000, baseValue: 55000 }
];

const UPGRADE_TEMPLATES = {
  speed: { name: 'Stepper Motors', desc: 'Increases printing speed.', baseCost: 15, costMult: 1.28, getStats: lvl => `${(lvl * 0.25).toFixed(2)}% per tick` },
  flow: { name: 'Flow Rate Nozzle', desc: 'Increases progress made per extrusion.', baseCost: 40, costMult: 1.32, getStats: lvl => `+${(lvl * 15)}% tick flow` },
  cooling: { name: 'Dual Cooling Fan', desc: 'Reduces bed cooling wait times between prints.', baseCost: 65, costMult: 1.35, getStats: lvl => `${Math.max(0.5, 6 / (1 + lvl * 0.3)).toFixed(1)}s cool time` },
  leveling: { name: 'Auto-Bed Leveling', desc: 'Adds chance for critical double progress ticks.', baseCost: 120, costMult: 1.45, maxLevel: 30, getStats: lvl => `${Math.min(60, lvl * 2)}% Critical Chance` },
  click: { name: 'Extruder Manual Wheel', desc: 'Increases progress added per click.', baseCost: 10, costMult: 1.22, getStats: lvl => `+${(lvl * 0.8).toFixed(1)} progress/click` },
  harvester: { name: 'Auto-Collector Script', desc: 'Automatically harvests prints after a delay.', baseCost: 300, costMult: 4.0, maxLevel: 6, getStats: lvl => {
    if (lvl === 0) return 'Manual Only';
    const delay = Math.max(0, 6 - lvl);
    return delay === 0 ? 'Instant harvest' : `Harvests after ${delay}s`;
  }}
};

// --- INITIAL STATE ---
let state = {
  coins: 0,
  crystals: 0,
  activeFilamentId: 'pla',
  activeModelId: 'cube',
  unlockedModels: ['cube'],
  unlockedFilaments: ['pla'],
  upgrades: {
    speed: 1,
    flow: 0,
    cooling: 0,
    leveling: 0,
    click: 1,
    harvester: 0
  },
  printProgress: 0,
  printState: 'printing', // 'printing', 'cooling', 'completed'
  coinsEarnedLifetime: 0,
  totalClicks: 0,
  totalPrintsCompleted: 0,
  coolingTimerLeft: 0,
  lastSavedTime: Date.now()
};

// --- CORE ENGINE ---
let canvasEngine = null;
let gameInterval = null;
let saveInterval = null;

// --- DOM ELEMENTS ---
const coinsDisplay = document.getElementById('coins-display');
const crystalsDisplay = document.getElementById('crystals-display');
const activeModelName = document.getElementById('active-model-name');
const printProgressBar = document.getElementById('print-progress-bar');
const printProgressText = document.getElementById('print-progress-text');
const metricTimeLeft = document.getElementById('metric-time-left');
const metricFilamentUsed = document.getElementById('metric-filament-used');
const metricPrintValue = document.getElementById('metric-print-value');
const manualExtrudeBtn = document.getElementById('manual-extrude-btn');
const collectPrintBtn = document.getElementById('collect-print-btn');
const printerStatusText = document.getElementById('printer-status-text');
const statusIndicatorDot = document.getElementById('status-indicator-dot');
const prestigePendingTokens = document.getElementById('prestige-pending-tokens');
const prestigeCurrentBoostPercent = document.getElementById('prestige-current-boost-percent');
const prestigeBtn = document.getElementById('prestige-btn');
const prestigeMultDisplay = document.getElementById('prestige-mult-display');
const tempDisplay = document.getElementById('temp-display');
const clockDisplay = document.getElementById('clock-display');

// --- SYSTEM INITIALIZATION ---
function init() {
  canvasEngine = new PrinterCanvas('printer-canvas');
  
  loadGame();
  setupEventListeners();
  renderAllTabs();
  
  // Game ticks 20 times per second (50ms interval)
  gameInterval = setInterval(gameTick, 50);
  
  // Auto save every 15 seconds
  saveInterval = setInterval(() => {
    saveGame();
    showToast('State Auto-Saved to Disk', 'info');
  }, 15000);

  // Initial UI refresh
  updateUI();
  
  showToast('MAEVICRAFT CORE BOOTED SUCCESSFULLY', 'success');
}

// --- GAME TICK LOOP ---
function gameTick() {
  const model = MODELS.find(m => m.id === state.activeModelId);
  const filament = FILAMENTS.find(f => f.id === state.activeFilamentId);
  
  // Update Local Clock
  const now = new Date();
  clockDisplay.innerText = now.toTimeString().split(' ')[0];

  // Random micro-variations for nozzle temperature
  if (state.printState === 'printing') {
    const targetTemp = 195 + Math.sin(Date.now() / 1000) * 2 + Math.random() * 2;
    tempDisplay.innerText = targetTemp.toFixed(1);
  } else if (state.printState === 'cooling') {
    const elapsedRatio = state.coolingTimerLeft / getCooldownTime();
    const coolTemp = 40 + elapsedRatio * 160;
    tempDisplay.innerText = coolTemp.toFixed(1);
  } else {
    tempDisplay.innerText = "25.0"; // Ambient temperature
  }

  // Handle different states
  if (state.printState === 'printing') {
    // 1. Calculate print speed
    // Base speed = 0.2% progress per tick.
    const speedLvl = state.upgrades.speed;
    const crystalMultiplier = 1 + (state.crystals * 0.03); // +3% speed per Crystal
    const baseSpeed = 0.15;
    const progressSpeed = baseSpeed * (1 + (speedLvl - 1) * 0.2) * crystalMultiplier;

    // Apply nozzle flow upgrade factor
    const flowLvl = state.upgrades.flow;
    const flowMultiplier = 1 + flowLvl * 0.15;

    let progressIncrement = progressSpeed * flowMultiplier;

    // Bed Leveling Critical Check
    const levelingLvl = state.upgrades.leveling;
    const critChance = Math.min(0.60, levelingLvl * 0.02); // Max 60%
    let isCrit = false;
    if (Math.random() < critChance) {
      progressIncrement *= 2.0; // Double progress on crit
      isCrit = true;
      if (Math.random() < 0.1) {
        showToast('CRITICAL EXTRUSION BURST', 'success');
      }
    }

    // Add progress
    state.printProgress = Math.min(100, state.printProgress + progressIncrement);

    if (state.printProgress >= 100) {
      if (getCooldownTime() > 0.5) {
        state.printState = 'cooling';
        state.coolingTimerLeft = getCooldownTime();
        showToast('Print Complete. Starting Fan Cool Down.', 'info');
      } else {
        // Instant completed
        state.printState = 'completed';
      }
    }
  } else if (state.printState === 'cooling') {
    state.coolingTimerLeft = Math.max(0, state.coolingTimerLeft - 0.05); // decrement by 50ms (0.05s)
    
    if (state.coolingTimerLeft <= 0) {
      state.printState = 'completed';
      showToast('Cooling Done. Ready for Harvest.', 'success');
    }
  } else if (state.printState === 'completed') {
    if (state.upgrades.harvester > 0) {
      state.autoHarvestTicks = (state.autoHarvestTicks || 0) + 1;
      const targetDelay = Math.max(0, 6 - state.upgrades.harvester);
      if (state.autoHarvestTicks >= targetDelay * 20) {
        handleCollectPrint();
        state.autoHarvestTicks = 0;
      }
    }
  }

  // Reset harvest counter if state shifts away from completed
  if (state.printState !== 'completed') {
    state.autoHarvestTicks = 0;
  }

  updateUI();
  
  // Render canvas
  canvasEngine.draw(state, filament, model);
}

// --- GAME LOGIC FUNCTIONS ---

function getCooldownTime() {
  const lvl = state.upgrades.cooling;
  return Math.max(0.4, 6 / (1 + lvl * 0.3));
}

function getClickPower() {
  const lvl = state.upgrades.click;
  // base click = 2% progress
  return 1.8 * (1 + (lvl - 1) * 0.5);
}

function getModelValue(model, filament) {
  const prestigeBoost = 1 + (state.crystals * 0.03); // +3% cash boost per crystal
  return model.baseValue * filament.multiplier * prestigeBoost;
}

function getUpgradeCost(type, lvl) {
  const template = UPGRADE_TEMPLATES[type];
  return Math.floor(template.baseCost * Math.pow(template.costMult, lvl));
}

function getPrestigeTokensReward() {
  // Prestige formula based on lifetime coins earned
  // Starts awarding crystals when lifetime earnings pass $350
  if (state.coinsEarnedLifetime < 350) return 0;
  
  const pending = Math.floor(Math.sqrt(state.coinsEarnedLifetime / 200) - Math.sqrt(350 / 200));
  return Math.max(0, pending - state.crystals);
}

// --- USER INTERACTION HANDLERS ---

function handleManualExtrude() {
  if (state.printState !== 'printing') return;
  
  state.totalClicks++;
  const clickVal = getClickPower();
  state.printProgress = Math.min(100, state.printProgress + clickVal);
  
  // Burst particles
  const filament = FILAMENTS.find(f => f.id === state.activeFilamentId);
  canvasEngine.emitParticles(canvasEngine.nozzleX, canvasEngine.nozzleY + 4, filament.color);
  
  if (state.printProgress >= 100) {
    if (getCooldownTime() > 0.5) {
      state.printState = 'cooling';
      state.coolingTimerLeft = getCooldownTime();
      showToast('Print Complete. Cool Down Initiated.', 'info');
    } else {
      state.printState = 'completed';
    }
  }
  
  updateUI();
}

function handleCollectPrint() {
  if (state.printState !== 'completed') return;
  
  const model = MODELS.find(m => m.id === state.activeModelId);
  const filament = FILAMENTS.find(f => f.id === state.activeFilamentId);
  const value = getModelValue(model, filament);
  
  // Reward Coins
  state.coins += value;
  state.coinsEarnedLifetime += value;
  state.totalPrintsCompleted++;
  
  showToast(`Harvested ${model.name}! Earned $${value.toFixed(2)}`, 'success');
  
  // Restart print loop automatically
  state.printProgress = 0;
  state.printState = 'printing';
  
  updateUI();
}

function buyUpgrade(type) {
  const currentLvl = state.upgrades[type];
  const cost = getUpgradeCost(type, currentLvl);
  
  if (state.coins >= cost) {
    state.coins -= cost;
    state.upgrades[type]++;
    showToast(`Upgraded ${UPGRADE_TEMPLATES[type].name} to Level ${state.upgrades[type]}`, 'success');
    renderUpgradeTab();
    updateUI();
  } else {
    showToast('Insufficient coin balance.', 'error');
  }
}

function unlockModel(modelId) {
  const model = MODELS.find(m => m.id === modelId);
  if (!model) return;
  
  if (state.coins >= model.unlockCost) {
    state.coins -= model.unlockCost;
    state.unlockedModels.push(modelId);
    showToast(`Unlocked blueprint: ${model.name}`, 'success');
    renderModelsTab();
    updateUI();
  } else {
    showToast('Insufficient coin balance to unlock blueprint.', 'error');
  }
}

function selectModel(modelId) {
  if (!state.unlockedModels.includes(modelId)) {
    unlockModel(modelId);
    return;
  }
  
  if (state.activeModelId === modelId) return;
  
  // Alert player printing will reset progress
  if (state.printProgress > 0 && state.printProgress < 100) {
    if (!confirm('Switching models will scrap your current print progress. Proceed?')) {
      return;
    }
  }
  
  state.activeModelId = modelId;
  state.printProgress = 0;
  state.printState = 'printing';
  showToast(`Carriage adjusted. Loaded ${MODELS.find(m => m.id === modelId).name}`, 'info');
  renderModelsTab();
  updateUI();
}

function unlockFilament(filamentId) {
  const fil = FILAMENTS.find(f => f.id === filamentId);
  if (!fil) return;
  
  if (state.coins >= fil.cost) {
    state.coins -= fil.cost;
    state.unlockedFilaments.push(filamentId);
    showToast(`Unlocked filament spool: ${fil.name}`, 'success');
    renderFilamentsTab();
    updateUI();
  } else {
    showToast('Insufficient coin balance to unlock filament.', 'error');
  }
}

function selectFilament(filamentId) {
  if (!state.unlockedFilaments.includes(filamentId)) {
    unlockFilament(filamentId);
    return;
  }
  
  if (state.activeFilamentId === filamentId) return;
  
  state.activeFilamentId = filamentId;
  showToast(`Filament spool swapped: ${FILAMENTS.find(f => f.id === filamentId).name}`, 'info');
  renderFilamentsTab();
  updateUI();
}

function handlePrestige() {
  const gain = getPrestigeTokensReward();
  if (gain <= 0) {
    showToast('Requirements for recycle not met. Print more models to earn more lifetime value.', 'error');
    return;
  }
  
  if (!confirm(`Are you ready to melt down your current workshop?\n\nThis will reset:\n- Current Coins\n- Hardware Upgrades\n- Unlocked Models (except Cube)\n- Unlocked Filaments (except PLA)\n\nYou will gain: +${gain} Polylactic Crystals!`)) {
    return;
  }
  
  // Accumulate crystals
  state.crystals += gain;
  
  // Reset fields
  state.coins = 0;
  state.activeFilamentId = 'pla';
  state.activeModelId = 'cube';
  state.unlockedModels = ['cube'];
  state.unlockedFilaments = ['pla'];
  state.upgrades = {
    speed: 1,
    flow: 0,
    cooling: 0,
    leveling: 0,
    click: 1
  };
  state.printProgress = 0;
  state.printState = 'printing';
  
  showToast(`Melted down workshop! Synthesized ${gain} Crystals.`, 'success');
  
  saveGame();
  renderAllTabs();
  updateUI();
}

// --- RENDERING TABS & PANELS ---

function renderAllTabs() {
  renderUpgradeTab();
  renderFilamentsTab();
  renderModelsTab();
  renderStatsTab();
}

function renderUpgradeTab() {
  const container = document.getElementById('hardware-upgrades-list');
  container.innerHTML = '';
  
  Object.keys(UPGRADE_TEMPLATES).forEach(key => {
    const template = UPGRADE_TEMPLATES[key];
    const level = state.upgrades[key];
    const cost = getUpgradeCost(key, level);
    const costText = `$${cost.toLocaleString()}`;
    const statsText = template.getStats(level);
    
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    
    // Check if max level reached for this upgrade
    const isMax = template.maxLevel && level >= template.maxLevel;
    
    card.innerHTML = `
      <div class="upgrade-info">
        <span class="upgrade-name">${template.name}</span>
        <span class="upgrade-desc">${template.desc}</span>
        <div class="upgrade-lvl-badge">LEVEL ${level}</div>
        <span class="upgrade-stats">Current: <span>${statsText}</span></span>
      </div>
      <div class="upgrade-action">
        <button class="btn btn-primary btn-buy" data-cost="${cost}" data-is-max="${isMax}" ${state.coins < cost || isMax ? 'disabled' : ''} onclick="buyUpgrade('${key}')">
          ${isMax ? 'MAXED' : `BUY<br>${costText}`}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderFilamentsTab() {
  const container = document.getElementById('filaments-list');
  container.innerHTML = '';
  
  FILAMENTS.forEach(fil => {
    const isUnlocked = state.unlockedFilaments.includes(fil.id);
    const isActive = state.activeFilamentId === fil.id;
    const canAfford = state.coins >= fil.cost;
    
    const card = document.createElement('div');
    card.className = `filament-card ${isActive ? 'active' : ''}`;
    
    let btnText = 'SELECT';
    let btnClass = 'btn-secondary';
    let disabled = false;
    let cost = 0;
    
    if (!isUnlocked) {
      btnText = `UNLOCK<br>$${fil.cost.toLocaleString()}`;
      btnClass = 'btn-accent';
      cost = fil.cost;
      if (!canAfford) disabled = true;
    } else if (isActive) {
      btnText = 'ACTIVE';
      disabled = true;
      btnClass = 'btn-primary';
    }
    
    // Convert rainbow to a nice gradient preview
    const colorStyle = fil.color === 'rainbow' 
      ? 'background: linear-gradient(45deg, red, orange, yellow, green, blue, violet);' 
      : `background-color: ${fil.color};`;

    card.innerHTML = `
      <div class="filament-header">
        <span class="filament-name">${fil.name}</span>
        <div class="filament-color-dot" style="${colorStyle}"></div>
      </div>
      <div>
        <span class="filament-multiplier">${fil.multiplier.toFixed(1)}x value</span>
      </div>
      <button class="btn ${btnClass} btn-buy" data-cost="${cost}" data-is-max="${isActive}" ${disabled ? 'disabled' : ''} onclick="selectFilament('${fil.id}')">
        ${btnText}
      </button>
    `;
    container.appendChild(card);
  });
}

function renderModelsTab() {
  const container = document.getElementById('models-list');
  container.innerHTML = '';
  
  MODELS.forEach(m => {
    const isUnlocked = state.unlockedModels.includes(m.id);
    const isActive = state.activeModelId === m.id;
    const canAfford = state.coins >= m.unlockCost;
    
    const card = document.createElement('div');
    card.className = `model-card ${isActive ? 'active' : ''}`;
    
    let btnText = 'SELECT PRINT';
    let btnClass = 'btn-secondary';
    let disabled = false;
    let cost = 0;
    
    if (!isUnlocked) {
      btnText = `UNLOCK BLUEPRINT<br>$${m.unlockCost.toLocaleString()}`;
      btnClass = 'btn-accent';
      cost = m.unlockCost;
      if (!canAfford) disabled = true;
    } else if (isActive) {
      btnText = 'PRINTING CURRENTLY';
      disabled = true;
      btnClass = 'btn-primary';
    }

    const value = getModelValue(m, FILAMENTS.find(f => f.id === state.activeFilamentId));
    
    card.innerHTML = `
      <div>
        <span class="model-name">${m.name}</span>
        <div class="model-difficulty">Ticks: ${m.baseComplexity} // Base: $${m.baseValue}</div>
      </div>
      <div>
        <span class="model-value">Est: $${value.toFixed(2)}</span>
      </div>
      <button class="btn ${btnClass} btn-buy" data-cost="${cost}" data-is-max="${isActive}" ${disabled ? 'disabled' : ''} onclick="selectModel('${m.id}')">
        ${btnText}
      </button>
    `;
    container.appendChild(card);
  });
}

function renderStatsTab() {
  const container = document.getElementById('stats-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="terminal-row">
      <span>Total Prints Harvested:</span>
      <span>${state.totalPrintsCompleted}</span>
    </div>
    <div class="terminal-row">
      <span>Lifetime Coins Earned:</span>
      <span>$${state.coinsEarnedLifetime.toFixed(2)}</span>
    </div>
    <div class="terminal-row">
      <span>Total Manual Extrusions:</span>
      <span>${state.totalClicks} Clicks</span>
    </div>
    <div class="terminal-row">
      <span>Active Filament Mult:</span>
      <span>${FILAMENTS.find(f => f.id === state.activeFilamentId).multiplier.toFixed(1)}x</span>
    </div>
    <div class="terminal-row">
      <span>Polylactic Crystals Boost:</span>
      <span>+${(state.crystals * 3)}% Speed & Value</span>
    </div>
  `;
}

// --- UI SYNC ---
function updateUI() {
  const model = MODELS.find(m => m.id === state.activeModelId);
  const filament = FILAMENTS.find(f => f.id === state.activeFilamentId);
  const value = getModelValue(model, filament);

  // Coins and Crystals displays
  coinsDisplay.innerText = `$${state.coins.toFixed(2)}`;
  crystalsDisplay.innerText = state.crystals.toString();
  
  // Meta-bar prestige mult
  const crystalsBoost = 1 + (state.crystals * 0.03);
  prestigeMultDisplay.innerText = crystalsBoost.toFixed(2);

  // Header active print labels
  activeModelName.innerText = `MODEL: ${model.name.toUpperCase().replace(/ /g, '_')}.gcode`;
  
  // Progress bar updates
  printProgressBar.style.width = `${state.printProgress.toFixed(1)}%`;
  printProgressText.innerText = `${state.printProgress.toFixed(1)}%`;

  // Metric box updates
  metricPrintValue.innerText = `$${value.toFixed(2)}`;
  metricFilamentUsed.innerText = `${(state.printProgress * model.baseComplexity * 0.0003).toFixed(2)}g`;

  // Estimate remaining seconds (assumes normal ticking rate)
  const speedLvl = state.upgrades.speed;
  const flowLvl = state.upgrades.flow;
  const progressSpeed = 0.15 * (1 + (speedLvl - 1) * 0.2) * crystalsBoost * (1 + flowLvl * 0.15);
  const remainingPercent = 100 - state.printProgress;
  const remainingTicks = remainingPercent / progressSpeed;
  const remainingSeconds = (remainingTicks * 0.05).toFixed(1);
  metricTimeLeft.innerText = state.printState === 'printing' ? `${remainingSeconds}s` : '0.0s';

  // Toggle buttons states based on printStatus
  if (state.printState === 'completed') {
    manualExtrudeBtn.disabled = true;
    collectPrintBtn.disabled = false;
    
    printerStatusText.innerText = 'PRINT COMPLETED';
    statusIndicatorDot.className = 'status-dot'; // no active pulsing glow
  } else if (state.printState === 'cooling') {
    manualExtrudeBtn.disabled = true;
    collectPrintBtn.disabled = true;
    
    printerStatusText.innerText = `COOLING BED (${state.coolingTimerLeft.toFixed(1)}s)`;
    statusIndicatorDot.className = 'status-dot';
  } else {
    manualExtrudeBtn.disabled = false;
    collectPrintBtn.disabled = true;
    
    printerStatusText.innerText = 'PRINTING';
    statusIndicatorDot.className = 'status-dot status-dot-active';
  }

  // Update Prestige pane details
  const prestigeGain = getPrestigeTokensReward();
  prestigePendingTokens.innerText = `+${prestigeGain}`;
  prestigeCurrentBoostPercent.innerText = `+${state.crystals * 3}% speed & value boost`;
  prestigeBtn.disabled = prestigeGain <= 0;

  // Update button disabled states based on current coins
  const buyButtons = document.querySelectorAll('.btn-buy');
  buyButtons.forEach(btn => {
    const cost = parseFloat(btn.getAttribute('data-cost') || '0');
    const isMax = btn.getAttribute('data-is-max') === 'true';
    btn.disabled = state.coins < cost || isMax;
  });

  // Periodically refresh stats tab if it's active
  const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
  if (activeTab === 'settings') {
    renderStatsTab();
  }
}

// --- TAB SELECTION HANDLER ---
function setupEventListeners() {
  // Tab click listeners
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const paneId = `tab-${tab.getAttribute('data-tab')}`;
      document.getElementById(paneId).classList.add('active');
      
      renderAllTabs();
      updateUI();
    });
  });

  // Action Buttons
  manualExtrudeBtn.addEventListener('click', () => {
    // On first user interaction, initialize Audio Context (if they toggle mute off later)
    if (canvasEngine && canvasEngine.isMuted) {
      // By default start muted, but init audio node so browser permits playback when toggled
      canvasEngine.setMute(true);
    }
    handleManualExtrude();
  });
  collectPrintBtn.addEventListener('click', handleCollectPrint);
  prestigeBtn.addEventListener('click', handlePrestige);

  // Settings Buttons
  document.getElementById('save-game-btn').addEventListener('click', () => {
    saveGame();
    showToast('Manually Saved Game State', 'success');
  });
  document.getElementById('export-save-btn').addEventListener('click', exportSave);
  document.getElementById('import-file-input').addEventListener('change', importSave);
  document.getElementById('reset-game-btn').addEventListener('click', wipeSave);

  // Audio mute button addition (insert dynamic audio control at top bar)
  const metaBarRight = document.querySelector('.system-meta-bar .layout-container');
  const audioToggleSpan = document.createElement('span');
  audioToggleSpan.innerHTML = `AUDIO: <a href="#" id="audio-toggle-link" style="color: var(--color-neon-green); font-weight:bold;">OFF</a>`;
  metaBarRight.appendChild(audioToggleSpan);

  const audioToggleLink = document.getElementById('audio-toggle-link');
  audioToggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    const curMute = canvasEngine.isMuted;
    canvasEngine.setMute(!curMute);
    audioToggleLink.innerText = !curMute ? 'OFF' : 'ON';
    audioToggleLink.style.color = !curMute ? 'var(--color-neon-green)' : 'var(--color-gradient-start)';
    showToast(`Printer Sound FX: ${!curMute ? 'Muted' : 'Unmuted'}`, 'info');
  });
}

// --- SAVE SYSTEM ---
const SAVE_KEY = 'maevicraft_idle_save_v1';

function saveGame() {
  state.lastSavedTime = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Copy loaded fields to state (ensures compatibility with future upgrades)
      Object.keys(parsed).forEach(k => {
        if (state[k] !== undefined) {
          if (typeof state[k] === 'object' && !Array.isArray(state[k]) && state[k] !== null) {
            // Merge objects
            state[k] = { ...state[k], ...parsed[k] };
          } else {
            state[k] = parsed[k];
          }
        }
      });
      
      // Calculate offline progress
      const secondsOffline = (Date.now() - state.lastSavedTime) / 1000;
      if (secondsOffline > 10) {
        processOfflineProgress(secondsOffline);
      }
    }
  } catch (err) {
    console.warn('Failed to load save from disk, starting fresh', err);
  }
}

function processOfflineProgress(seconds) {
  // Let the user print at active speeds offline
  const speedLvl = state.upgrades.speed;
  const flowLvl = state.upgrades.flow;
  const crystalsBoost = 1 + (state.crystals * 0.03);
  
  // Progress made per second offline
  const progressSpeedPerSec = 20 * 0.15 * (1 + (speedLvl - 1) * 0.2) * crystalsBoost * (1 + flowLvl * 0.15);
  
  const model = MODELS.find(m => m.id === state.activeModelId);
  const filament = FILAMENTS.find(f => f.id === state.activeFilamentId);
  
  // Total prints possible offline
  const totalValuePerPrint = getModelValue(model, filament);
  const cooldownSecs = getCooldownTime();
  const ticksPerModel = 100;
  const secondsPerModel = (ticksPerModel / progressSpeedPerSec) + cooldownSecs;
  
  const printsCompletedOffline = Math.floor(seconds / secondsPerModel);
  
  if (printsCompletedOffline > 0) {
    const offlineRevenue = printsCompletedOffline * totalValuePerPrint;
    state.coins += offlineRevenue;
    state.coinsEarnedLifetime += offlineRevenue;
    state.totalPrintsCompleted += printsCompletedOffline;
    
    // Leave print at partial progress
    const remainingSeconds = seconds % secondsPerModel;
    state.printProgress = Math.min(99.9, (remainingSeconds / (secondsPerModel - cooldownSecs)) * 100);
    state.printState = 'printing';
    
    setTimeout(() => {
      alert(`OFFLINE PRODUCTION SUMMARY:\n\nWhile your printer hummed away for ${Math.floor(seconds/60)} minutes, it completed ${printsCompletedOffline} prints of ${model.name}.\n\nRevenue Generated: $${offlineRevenue.toFixed(2)}`);
    }, 1000);
  }
}

function exportSave() {
  saveGame();
  const serialized = btoa(JSON.stringify(state));
  
  const tempLink = document.createElement('a');
  tempLink.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(serialized);
  tempLink.download = `maevicraft_save_${Date.now()}.txt`;
  tempLink.click();
  showToast('Save file downloaded to device', 'success');
}

function importSave(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const decrypted = atob(evt.target.result);
      const parsed = JSON.parse(decrypted);
      
      if (parsed.coins !== undefined && parsed.upgrades !== undefined) {
        state = parsed;
        saveGame();
        renderAllTabs();
        updateUI();
        showToast('Save Import Complete!', 'success');
      } else {
        showToast('Invalid save format', 'error');
      }
    } catch(err) {
      showToast('Error parsing file', 'error');
    }
  };
  reader.readAsText(file);
}

function wipeSave() {
  if (confirm("WARNING: This will erase all print settings, coins, levels, crystals, and progress. This operation is permanent. Proceed?")) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message.toUpperCase();
  
  container.appendChild(toast);
  
  // Auto remove
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Bind to window for direct HTML actions
window.buyUpgrade = buyUpgrade;
window.selectFilament = selectFilament;
window.selectModel = selectModel;

// Boot application when window loads
window.onload = init;
