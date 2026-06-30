// 3D Printer Canvas Renderer and Animation Engine

const SPRITES = {
  cube: [
    "................",
    ".XXXXXXXXXXXXXX.",
    ".X............X.",
    ".X...XXXXXX...X.",
    ".X...X....X...X.",
    ".X...X.XX.X...X.",
    ".X...X.XX.X...X.",
    ".X...X....X...X.",
    ".X...XXXXXX...X.",
    ".X............X.",
    ".X...XXXXXX...X.",
    ".X...X....X...X.",
    ".X...XXXXXX...X.",
    ".X............X.",
    ".XXXXXXXXXXXXXX.",
    "................"
  ],
  benchy: [
    "......XX........",
    "......XX........",
    "....XXXXXX......",
    "....X.XX.X......",
    "....XXXXXX......",
    "....X....X......",
    "..XXXXXXXXXX....",
    ".XXXXXXXXXXXX...",
    "XXXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXX.",
    "..XXXXXXXXXXXX..",
    "...XXXXXXXXXX...",
    "....XXXXXXXX....",
    "......XXXX......"
  ],
  octopus: [
    "......XXXX......",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXXXXXXXXXXX..",
    "..XX.XX..XX.XX..",
    "..XXXXX..XXXXX..",
    "..XXXXXXXXXXXX..",
    "..XXXXXXXXXXXX..",
    "...XXXXXXXXXX...",
    "....XXXXXXXX....",
    "...XX.XXXX.XX...",
    "..XX..XXXX..XX..",
    ".XX...XXXX...XX.",
    "XX....XXXX....XX",
    "XXXX..XXXX..XXXX",
    ".XXXX.XXXX.XXXX."
  ],
  knight: [
    "......XXXX......",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXXXXXXXXXXX..",
    "..XXXXXXXXX.XX..",
    "..XXXXXXXX..XX..",
    "..XXXXXXX.......",
    "..XXXXXXXXXX....",
    "...XXXXXXXXXXXX.",
    "....XXXXXXXXXXX.",
    ".....XXXXXXXXX..",
    "......XXXXXX....",
    "......XXXXXX....",
    ".....XXXXXXXX...",
    "....XXXXXXXXXX..",
    "...XXXXXXXXXXXX."
  ],
  dino: [
    "......XXXXXXX...",
    "......XX.XXXX...",
    "......XXXXXXX...",
    "......XXXX......",
    "......XXXXXX....",
    "..XX..XXXXXXXX..",
    ".XXX.XXXXXXXXX..",
    "XXXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXX..",
    " XXXXXXXXXXX....",
    "   XXXXXXXX.....",
    "    XXXXXX......",
    "    XX..XX......",
    "    XX..XX......",
    "    XX..XX......",
    "   XXX..XXX....."
  ],
  sword: [
    ".......XX.......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "......XXXX......",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    ".......XX.......",
    "......XXXX......",
    ".......XX......."
  ],
  mystery: [
    "....XX....XX....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXXXXXXXXXXX..",
    "..XX.XX..XX.XX..",
    "..XXXXXXXXXXXX..",
    "...XXXXXXXXXX...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXX",
    "XX..XX....XX..XX",
    "X....X....X....X"
  ]
};

class PrinterCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Set rendering styles for pixel art
    this.ctx.imageSmoothingEnabled = false;
    
    // Core geometry
    this.bedY = 320;
    this.scale = 10; // each sprite pixel is 10x10 canvas pixels
    this.spriteWidth = 16;
    this.spriteHeight = 16;
    this.modelWidth = this.spriteWidth * this.scale;  // 160
    this.modelHeight = this.spriteHeight * this.scale; // 160
    this.centerX = this.canvas.width / 2; // 240
    this.modelLeft = this.centerX - this.modelWidth / 2; // 160
    this.modelTop = this.bedY - this.modelHeight; // 160

    // Animation state
    this.nozzleX = this.centerX;
    this.nozzleY = 80;
    this.targetNozzleX = this.centerX;
    this.targetNozzleY = 80;
    this.spoolRotation = 0;
    
    // Particle system
    this.particles = [];
    
    // Sound FX (Web Audio API synth)
    this.audioCtx = null;
    this.motorOsc = null;
    this.motorGain = null;
    this.isMuted = true;
  }

  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Setup oscillator for stepper motor sound
      this.motorOsc = this.audioCtx.createOscillator();
      this.motorGain = this.audioCtx.createGain();
      
      this.motorOsc.type = 'triangle';
      this.motorOsc.frequency.setValueAtTime(60, this.audioCtx.currentTime); // low hum
      
      this.motorGain.gain.setValueAtTime(0, this.audioCtx.currentTime); // start silent
      
      this.motorOsc.connect(this.motorGain);
      this.motorGain.connect(this.audioCtx.destination);
      this.motorOsc.start();
    } catch (e) {
      console.warn("Audio Context not supported", e);
    }
  }

  setMute(mute) {
    this.isMuted = mute;
    if (!this.isMuted) {
      this.initAudio();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
    this.updateAudioState(0, false);
  }

  updateAudioState(speedFactor, isPrinting) {
    if (!this.audioCtx || this.isMuted) return;
    
    if (isPrinting && speedFactor > 0.05) {
      // Calculate frequency based on nozzle movement speed
      const baseFreq = 50;
      const targetFreq = baseFreq + Math.min(speedFactor * 15, 300);
      
      this.motorOsc.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.05);
      
      // Volume based on printing speed
      const targetGain = Math.min(0.04, 0.01 + speedFactor * 0.005);
      this.motorGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    } else {
      this.motorGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
    }
  }

  emitParticles(x, y, color) {
    // Spawn spark particles
    const rainbowColors = ['#ff007f', '#7f00ff', '#00f0ff', '#00ff7f', '#ffbf00'];
    for (let i = 0; i < 3; i++) {
      const pColor = color === 'rainbow' ? rainbowColors[Math.floor(Math.random() * rainbowColors.length)] : color;
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.3) * -2 - 0.5,
        color: pColor,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        size: Math.random() * 3 + 1
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getFilamentStyle(color, x1, y1, x2, y2) {
    if (color === 'rainbow') {
      const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0.0, '#ff007f'); // Neon Pink/Red
      grad.addColorStop(0.2, '#7f00ff'); // Purple
      grad.addColorStop(0.4, '#00f0ff'); // Cyan
      grad.addColorStop(0.6, '#00ff7f'); // Green
      grad.addColorStop(0.8, '#ffbf00'); // Gold/Yellow
      grad.addColorStop(1.0, '#ff007f'); // Neon Pink
      return grad;
    }
    return color;
  }

  draw(state, activeFilament, activeModel) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 1. Clear Canvas with deep background
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, width, height);

    // Grid lines behind printer
    ctx.strokeStyle = "rgba(40, 44, 52, 0.3)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Extract Sprite Info
    const sprite = SPRITES[activeModel.spriteId] || SPRITES.cube;
    const filamentColor = activeFilament.color;
    const modelFillStyle = this.getFilamentStyle(
      filamentColor, 
      this.modelLeft, 
      0, 
      this.modelLeft + this.spriteWidth * this.scale, 
      0
    );

    // Calculate total pixels to print
    let totalPrintablePixels = 0;
    for (let r = 0; r < this.spriteHeight; r++) {
      for (let c = 0; c < this.spriteWidth; c++) {
        if (sprite[r][c] === 'X') {
          totalPrintablePixels++;
        }
      }
    }

    const progressFraction = state.printProgress / 100;
    const pixelsToPrint = Math.floor(progressFraction * totalPrintablePixels);

    // 3. Render Printed Object on Bed
    let currentPixelCount = 0;
    let lastPrintedX = this.centerX;
    let lastPrintedY = this.bedY;
    let isCurrentlyExtruding = false;

    // Loop from bottom of sprite (row 15) to top (row 0)
    for (let r = this.spriteHeight - 1; r >= 0; r--) {
      const spriteRow = sprite[r];
      const canvasY = this.bedY - (this.spriteHeight - r) * this.scale;

      for (let c = 0; c < this.spriteWidth; c++) {
        if (spriteRow[c] === 'X') {
          currentPixelCount++;
          if (currentPixelCount <= pixelsToPrint) {
            // Draw printed pixel
            const canvasX = this.modelLeft + c * this.scale;
            ctx.fillStyle = modelFillStyle;
            ctx.fillRect(canvasX, canvasY, this.scale - 1, this.scale - 1);
            
            // Subtle pixel shadow/depth
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(canvasX, canvasY + this.scale - 2, this.scale - 1, 2);
            ctx.fillRect(canvasX + this.scale - 2, canvasY, 2, this.scale - 1);

            lastPrintedX = canvasX + this.scale / 2;
            lastPrintedY = canvasY + this.scale / 2;
          } else if (currentPixelCount === pixelsToPrint + 1 && state.printProgress > 0 && state.printProgress < 100) {
            // This is the active pixel being printed
            const canvasX = this.modelLeft + c * this.scale;
            lastPrintedX = canvasX + this.scale / 2;
            lastPrintedY = canvasY + this.scale / 2;
            isCurrentlyExtruding = true;
          }
        }
      }
    }

    // 4. Update Target Nozzle Position
    const isPrinting = state.printProgress > 0 && state.printProgress < 100;
    if (isPrinting) {
      this.targetNozzleX = lastPrintedX;
      this.targetNozzleY = lastPrintedY - 4; // nozzle tip hovering just above active pixel
      this.spoolRotation += 0.05 * activeModel.complexity; // rotate spool
    } else if (state.printProgress >= 100) {
      // Park at top side when done
      this.targetNozzleX = this.centerX + 120;
      this.targetNozzleY = 120;
    } else {
      // Home position when idling
      this.targetNozzleX = this.centerX - 100;
      this.targetNozzleY = 140;
    }

    // Smoothly interpolate nozzle position
    const dx = this.targetNozzleX - this.nozzleX;
    const dy = this.targetNozzleY - this.nozzleY;
    const speed = 0.25; // Interpolation speed
    this.nozzleX += dx * speed;
    this.nozzleY += dy * speed;

    // Emit sparks if actively extruding
    const nozzleSpeed = Math.sqrt(dx * dx + dy * dy);
    if (isPrinting && isCurrentlyExtruding && Math.random() < 0.35) {
      this.emitParticles(this.nozzleX, this.nozzleY + 4, filamentColor);
    }

    // Play/adjust motor audio
    this.updateAudioState(nozzleSpeed, isPrinting);

    // 5. Draw Particles
    this.updateParticles();
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1.0; // Reset alpha

    // 6. Draw Printer Mechanical Components

    // A. Z-Axis Lead Screws (Sliver vertical threaded rods)
    ctx.fillStyle = "#2c2e3a";
    ctx.fillRect(48, 50, 4, 300);
    ctx.fillRect(428, 50, 4, 300);
    // Thread grooves
    ctx.fillStyle = "#1e2029";
    for (let sy = 50; sy < 350; sy += 10) {
      ctx.fillRect(48, sy, 4, 2);
      ctx.fillRect(428, sy, 4, 2);
    }

    // Frame Pillars
    ctx.fillStyle = "#1b1d24";
    ctx.fillRect(35, 45, 10, 310);
    ctx.fillRect(435, 45, 10, 310);
    ctx.fillRect(35, 40, 410, 10); // top frame bar

    // B. Heated Build Bed (Y-axis plate)
    ctx.fillStyle = "#333745"; // aluminum bed
    ctx.fillRect(80, this.bedY, 320, 12);
    ctx.fillStyle = "#1e2029"; // bed heater underplate
    ctx.fillRect(85, this.bedY + 12, 310, 8);
    // Bed leveling springs
    ctx.fillStyle = "#e5c07b";
    ctx.fillRect(100, this.bedY + 20, 8, 12);
    ctx.fillRect(372, this.bedY + 20, 8, 12);
    // Bed mounts
    ctx.fillStyle = "#1b1d24";
    ctx.fillRect(70, this.bedY + 32, 340, 8);

    // C. Horizontal Gantry (X-axis metal rods)
    const gantryY = this.nozzleY - 18; // offset from nozzle
    ctx.fillStyle = "#5c6370"; // metal rails
    ctx.fillRect(45, gantryY + 4, 390, 4);
    ctx.fillRect(45, gantryY + 16, 390, 4);
    // Left/Right Z-Axis carriage blocks
    ctx.fillStyle = "#1b1d24";
    ctx.fillRect(40, gantryY, 12, 28);
    ctx.fillRect(428, gantryY, 12, 28);

    // D. Filament Spool (Top Left corner of frame)
    const spoolX = 120;
    const spoolY = 45;
    ctx.save();
    ctx.translate(spoolX, spoolY);
    ctx.rotate(this.spoolRotation);
    
    // Spool flange (outer circle)
    ctx.strokeStyle = "#2c2e3a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    // Inner hub
    ctx.fillStyle = "#15171e";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // Spool filament coil
    ctx.strokeStyle = this.getFilamentStyle(filamentColor, -15, 0, 15, 0);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Spool spokes
    ctx.strokeStyle = "#2c2e3a";
    ctx.lineWidth = 2;
    for (let spoke = 0; spoke < 4; spoke++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(22, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Filament line from spool down to print head
    ctx.beginPath();
    ctx.strokeStyle = this.getFilamentStyle(filamentColor, spoolX, spoolY + 24, this.nozzleX, gantryY);
    ctx.lineWidth = 2;
    // Curved filament path
    ctx.moveTo(spoolX, spoolY + 24);
    ctx.bezierCurveTo(
      spoolX + 10, spoolY + 80, 
      this.nozzleX - 10, gantryY - 40, 
      this.nozzleX, gantryY
    );
    ctx.stroke();

    // E. Extruder Print Head Assembly
    // X-Carriage carriage body
    ctx.fillStyle = "#282c34";
    ctx.fillRect(this.nozzleX - 22, gantryY - 4, 44, 32);
    // Details on carriage (cooling fan)
    ctx.fillStyle = "#1b1d24";
    ctx.fillRect(this.nozzleX - 14, gantryY + 4, 28, 20);
    // Fan hub
    ctx.fillStyle = "#5c6370";
    ctx.beginPath();
    ctx.arc(this.nozzleX, gantryY + 14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hotend (Heat block)
    ctx.fillStyle = "#abb2bf";
    ctx.fillRect(this.nozzleX - 6, gantryY + 28, 12, 6);
    // Nozzle Tip (brass triangle)
    ctx.fillStyle = "#e5c07b";
    ctx.beginPath();
    ctx.moveTo(this.nozzleX - 3, gantryY + 34);
    ctx.lineTo(this.nozzleX + 3, gantryY + 34);
    ctx.lineTo(this.nozzleX, gantryY + 39);
    ctx.closePath();
    ctx.fill();

    // Hotend glow (when active)
    if (isPrinting) {
      const glowGrad = ctx.createRadialGradient(
        this.nozzleX, gantryY + 34, 1, 
        this.nozzleX, gantryY + 34, 6
      );
      glowGrad.addColorStop(0, "rgba(255, 100, 50, 0.8)");
      glowGrad.addColorStop(1, "rgba(255, 50, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.nozzleX, gantryY + 34, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // F. Status Light Overlay (Printer HUD)
    ctx.fillStyle = "rgba(40, 255, 140, 0.05)";
    ctx.fillRect(0, 0, width, height);

    // Screen scanline flickering (optional subtle glow)
    const scanlineOpacity = 0.03 + Math.sin(Date.now() / 200) * 0.01;
    ctx.fillStyle = `rgba(255, 255, 255, ${scanlineOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }
}

// Bind to window for app.js access
window.PrinterCanvas = PrinterCanvas;
