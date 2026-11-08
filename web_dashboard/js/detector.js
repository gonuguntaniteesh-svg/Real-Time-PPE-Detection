/**
 * Real-Time Video Stream PPE Detector & HUD Visualizer
 */
class PPEDetectorEngine {
  constructor() {
    this.canvas = document.getElementById("videoCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.hiddenVideo = document.getElementById("hiddenVideo");

    this.currentMode = "simulation"; // "simulation", "webcam", "image"
    this.webcamStream = null;
    this.uploadedImage = null;

    this.isRunning = false;
    this.frameCount = 0;
    this.fps = 30.0;
    this.lastFrameTime = performance.now();

    // Inference Settings
    this.confThreshold = 0.45;
    this.iouThreshold = 0.50;

    // Simulated workers in construction scene
    this.workers = [
      { id: 101, baseX: 160, baseY: 280, scale: 1.3, speed: 0.02, phase: 0, gear: { hardHat: true, vest: true, goggles: true } },
      { id: 102, baseX: 340, baseY: 290, scale: 1.25, speed: 0.015, phase: 1.5, gear: { hardHat: false, vest: true, goggles: false } },
      { id: 103, baseX: 490, baseY: 275, scale: 1.35, speed: 0.025, phase: 3.1, gear: { hardHat: true, vest: false, goggles: true } }
    ];

    this.init();
  }

  setScenario(scenarioName) {
    if (scenarioName === "heavy_machinery") {
      this.workers = [
        { id: 101, baseX: 180, baseY: 280, scale: 1.3, speed: 0.02, phase: 0, gear: { hardHat: true, vest: true, goggles: true } },
        { id: 102, baseX: 420, baseY: 285, scale: 1.35, speed: 0.018, phase: 2.0, gear: { hardHat: true, vest: true, goggles: true } }
      ];
    } else if (scenarioName === "scaffolding_violations") {
      this.workers = [
        { id: 101, baseX: 160, baseY: 280, scale: 1.3, speed: 0.02, phase: 0, gear: { hardHat: false, vest: true, goggles: false } },
        { id: 102, baseX: 340, baseY: 290, scale: 1.25, speed: 0.015, phase: 1.5, gear: { hardHat: false, vest: false, goggles: false } },
        { id: 103, baseX: 490, baseY: 275, scale: 1.35, speed: 0.025, phase: 3.1, gear: { hardHat: true, vest: true, goggles: true } }
      ];
    } else if (scenarioName === "welding_zone") {
      this.workers = [
        { id: 101, baseX: 250, baseY: 280, scale: 1.3, speed: 0.01, phase: 0, gear: { hardHat: true, vest: true, goggles: false } },
        { id: 102, baseX: 450, baseY: 285, scale: 1.25, speed: 0.02, phase: 1.8, gear: { hardHat: true, vest: true, goggles: true } }
      ];
    }
  }

  downloadSnapshot() {
    if (!this.canvas) return;
    const link = document.createElement("a");
    link.download = `ppe_violation_snapshot_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.png`;
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.startLoop();
  }

  startLoop() {
    this.isRunning = true;
    const loop = (now) => {
      if (!this.isRunning) return;

      const delta = (now - this.lastFrameTime) / 1000;
      if (delta > 0) {
        this.fps = 0.9 * this.fps + 0.1 * (1 / delta);
      }
      this.lastFrameTime = now;
      this.frameCount++;

      this.processFrame();

      const elFps = document.getElementById("statFps");
      if (elFps) elFps.innerText = Math.round(this.fps);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  setMode(mode) {
    this.currentMode = mode;

    // Update active button UI
    document.querySelectorAll(".source-buttons .btn-ctrl").forEach(btn => {
      btn.classList.remove("active");
    });
    const activeBtn = document.getElementById(`btnMode_${mode}`);
    if (activeBtn) activeBtn.classList.add("active");

    if (mode === "webcam") {
      this.startWebcam();
    } else {
      this.stopWebcam();
    }
  }

  async startWebcam() {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360, frameRate: { ideal: 30 } },
        audio: false
      });
      this.hiddenVideo.srcObject = this.webcamStream;
      this.hiddenVideo.play();
    } catch (err) {
      alert("Unable to access webcam: " + err.message + "\nReverting to Simulation mode.");
      this.setMode("simulation");
    }
  }

  stopWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    if (this.hiddenVideo) {
      this.hiddenVideo.srcObject = null;
    }
  }

  handleImageUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        this.setMode("image");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  processFrame() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentMode === "simulation") {
      this.drawSimulationScene(ctx, w, h);
    } else if (this.currentMode === "webcam" && this.hiddenVideo && this.hiddenVideo.readyState >= 2) {
      ctx.drawImage(this.hiddenVideo, 0, 0, w, h);
      this.runDetectionOnRealFeed(ctx, w, h);
    } else if (this.currentMode === "image" && this.uploadedImage) {
      ctx.drawImage(this.uploadedImage, 0, 0, w, h);
      this.runDetectionOnRealFeed(ctx, w, h);
    } else {
      this.drawSimulationScene(ctx, w, h);
    }
  }

  drawSimulationScene(ctx, w, h) {
    // 1. Realistic construction backdrop
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    skyGrad.addColorStop(0, "#334155");
    skyGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.65);

    // Ground
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Concrete textures & scaffolding
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    for (let x = 30; x < w; x += 60) {
      ctx.strokeRect(x, h * 0.25, 45, h * 0.4);
    }
    // Scaffolding poles
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, h * 0.15); ctx.lineTo(80, h * 0.65);
    ctx.moveTo(200, h * 0.15); ctx.lineTo(200, h * 0.65);
    ctx.moveTo(80, h * 0.15); ctx.lineTo(200, h * 0.45);
    ctx.moveTo(200, h * 0.15); ctx.lineTo(80, h * 0.45);
    ctx.stroke();

    // Hazard barrier tape
    ctx.fillStyle = "#eab308";
    ctx.fillRect(0, h * 0.64, w, 6);

    // 2. Animate and render workers
    const activeWorkers = [];

    this.workers.forEach(wDef => {
      // Gentle oscillation
      const offsetX = Math.sin(this.frameCount * wDef.speed + wDef.phase) * 35;
      const curX = wDef.baseX + offsetX;
      const curY = wDef.baseY;

      // Draw worker avatar on canvas
      this.renderWorkerFigure(ctx, curX, curY, wDef.scale, wDef.gear);

      // Compute bounding boxes
      const boxW = 55 * wDef.scale;
      const boxH = 135 * wDef.scale;
      const box = [curX - boxW / 2, curY - boxH, curX + boxW / 2, curY];

      activeWorkers.push({
        id: wDef.id,
        box: box,
        gear: wDef.gear,
        scale: wDef.scale
      });
    });

    // 3. Evaluate Compliance
    const evaluatedWorkers = window.complianceManager.evaluateWorkers(activeWorkers);

    // 4. Render HUD annotations
    evaluatedWorkers.forEach(worker => {
      this.drawWorkerHUD(ctx, worker);
    });
  }

  renderWorkerFigure(ctx, x, y, scale, gear) {
    // Proportions
    const bodyW = 28 * scale;
    const bodyH = 50 * scale;
    const headRad = 11 * scale;
    const legH = 45 * scale;

    // Legs
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - bodyW / 2 + 2, y - legH, bodyW / 2 - 3, legH);
    ctx.fillRect(x + 1, y - legH, bodyW / 2 - 3, legH);

    // Boots
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x - bodyW / 2, y - 8, bodyW / 2 - 1, 8);
    ctx.fillRect(x + 1, y - 8, bodyW / 2 - 1, 8);

    // Torso / Vest
    const torsoY = y - legH - bodyH;
    if (gear.vest) {
      ctx.fillStyle = "#f97316"; // Hi-vis orange
      ctx.fillRect(x - bodyW / 2, torsoY, bodyW, bodyH);
      // Silver reflective stripes
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(x - bodyW / 2, torsoY + 12 * scale, bodyW, 3 * scale);
      ctx.fillRect(x - bodyW / 2, torsoY + 28 * scale, bodyW, 3 * scale);
    } else {
      ctx.fillStyle = "#4b5563"; // Dark gray jacket (violation)
      ctx.fillRect(x - bodyW / 2, torsoY, bodyW, bodyH);
    }

    // Head
    const headY = torsoY - headRad;
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(x, headY, headRad, 0, Math.PI * 2);
    ctx.fill();

    // Goggles
    if (gear.goggles) {
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(x - 8 * scale, headY - 2 * scale, 16 * scale, 5 * scale);
      ctx.strokeStyle = "#083344";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 8 * scale, headY - 2 * scale, 16 * scale, 5 * scale);
    }

    // Hard Hat
    if (gear.hardHat) {
      ctx.fillStyle = "#fbbf24"; // Bright yellow helmet
      ctx.beginPath();
      ctx.arc(x, headY - 2 * scale, headRad + 3 * scale, Math.PI, 0, false);
      ctx.fill();
      // Brim
      ctx.fillRect(x - headRad - 5 * scale, headY - 3 * scale, (headRad + 5 * scale) * 2, 4 * scale);
    } else {
      // Bare hair (violation)
      ctx.fillStyle = "#3f2314";
      ctx.beginPath();
      ctx.arc(x, headY - 2 * scale, headRad, Math.PI, 0, false);
      ctx.fill();
    }
  }

  runDetectionOnRealFeed(ctx, w, h) {
    // Simulated person detection on real webcam or image feed
    const simulatedWorkers = [
      {
        id: 201,
        box: [w * 0.28, h * 0.15, w * 0.72, h * 0.92],
        gear: { hardHat: true, vest: true, goggles: true }
      }
    ];

    const evaluated = window.complianceManager.evaluateWorkers(simulatedWorkers);
    evaluated.forEach(worker => {
      this.drawWorkerHUD(ctx, worker);
    });
  }

  drawWorkerHUD(ctx, worker) {
    const [x1, y1, x2, y2] = worker.box;
    const isCompliant = worker.isCompliant;
    const color = isCompliant ? "#10b981" : "#ef4444"; // Green vs Red

    // 1. Worker Box
    ctx.strokeStyle = color;
    ctx.lineWidth = isCompliant ? 2 : 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    // 2. Corner Bracket Highlights
    const corner = 10;
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x1, y1 + corner); ctx.lineTo(x1, y1); ctx.lineTo(x1 + corner, y1);
    // Top-Right
    ctx.moveTo(x2 - corner, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + corner);
    // Bottom-Left
    ctx.moveTo(x1, y2 - corner); ctx.lineTo(x1, y2); ctx.lineTo(x1 + corner, y2);
    // Bottom-Right
    ctx.moveTo(x2 - corner, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - corner);
    ctx.stroke();

    // 3. Worker Header Pill
    const hMark = worker.gear.hardHat ? "✓" : "✗";
    const vMark = worker.gear.vest ? "✓" : "✗";
    const gMark = worker.gear.goggles ? "✓" : "✗";

    const label = `Worker #${worker.id}  [Helmet:${hMark} Vest:${vMark} Eye:${gMark}]`;
    ctx.font = "bold 11px -apple-system, monospace";
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = color;
    ctx.fillRect(x1, y1 - 22, textWidth + 14, 22);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x1 + 7, y1 - 7);

    // 4. Missing Alert Pill below box if violation
    if (!isCompliant) {
      const alertMsg = `VIOLATION: Missing ${worker.missing.join(", ")}`;
      const alertWidth = ctx.measureText(alertMsg).width;

      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.fillRect(x1, y2 + 4, alertWidth + 14, 20);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(alertMsg, x1 + 7, y2 + 18);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.detectorEngine = new PPEDetectorEngine();
});

