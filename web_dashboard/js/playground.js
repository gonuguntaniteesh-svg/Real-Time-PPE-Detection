/**
 * Interactive Core Concepts Playground
 * 1. Bounding Boxes & IoU Sandbox (Drag & Resize)
 * 2. Anchor Boxes vs Anchor-Free Visualizer (Strides 8, 16, 32)
 * 3. Transfer Learning Visualizer (Backbone Layer Freezing)
 */

class CoreConceptsPlayground {
  constructor() {
    this.initBoundingBoxSandbox();
    this.initAnchorBoxVisualizer();
    this.initTransferLearningVisualizer();
  }

  /* -------------------------------------------------------------
   * 1. Bounding Boxes & IoU Interactive Sandbox
   * ------------------------------------------------------------- */
  initBoundingBoxSandbox() {
    const canvas = document.getElementById("iouCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = 440;
    canvas.height = 240;

    // Two interactive boxes [x, y, w, h]
    this.boxA = { x: 50, y: 40, w: 140, h: 120, label: "Box A (Prediction)", color: "#06b6d4" };
    this.boxB = { x: 130, y: 70, w: 150, h: 130, label: "Box B (Ground Truth)", color: "#f59e0b" };

    this.activeDragBox = null;
    this.dragOffset = { x: 0, y: 0 };

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const isInside = (pos, box) => {
      return pos.x >= box.x && pos.x <= box.x + box.w &&
             pos.y >= box.y && pos.y <= box.y + box.h;
    };

    canvas.addEventListener("mousedown", (e) => {
      const pos = getMousePos(e);
      if (isInside(pos, this.boxA)) {
        this.activeDragBox = this.boxA;
        this.dragOffset = { x: pos.x - this.boxA.x, y: pos.y - this.boxA.y };
      } else if (isInside(pos, this.boxB)) {
        this.activeDragBox = this.boxB;
        this.dragOffset = { x: pos.x - this.boxB.x, y: pos.y - this.boxB.y };
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.activeDragBox) return;
      const pos = getMousePos(e);
      this.activeDragBox.x = Math.max(0, Math.min(canvas.width - this.activeDragBox.w, pos.x - this.dragOffset.x));
      this.activeDragBox.y = Math.max(0, Math.min(canvas.height - this.activeDragBox.h, pos.y - this.dragOffset.y));
      this.renderIoU(ctx, canvas.width, canvas.height);
    });

    window.addEventListener("mouseup", () => {
      this.activeDragBox = null;
    });

    // Touch support for mobile / tablets
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const pos = getMousePos(touch);
        if (isInside(pos, this.boxA)) {
          this.activeDragBox = this.boxA;
          this.dragOffset = { x: pos.x - this.boxA.x, y: pos.y - this.boxA.y };
          e.preventDefault();
        } else if (isInside(pos, this.boxB)) {
          this.activeDragBox = this.boxB;
          this.dragOffset = { x: pos.x - this.boxB.x, y: pos.y - this.boxB.y };
          e.preventDefault();
        }
      }
    });

    canvas.addEventListener("touchmove", (e) => {
      if (!this.activeDragBox || e.touches.length === 0) return;
      const touch = e.touches[0];
      const pos = getMousePos(touch);
      this.activeDragBox.x = Math.max(0, Math.min(canvas.width - this.activeDragBox.w, pos.x - this.dragOffset.x));
      this.activeDragBox.y = Math.max(0, Math.min(canvas.height - this.activeDragBox.h, pos.y - this.dragOffset.y));
      this.renderIoU(ctx, canvas.width, canvas.height);
      e.preventDefault();
    });

    window.addEventListener("touchend", () => {
      this.activeDragBox = null;
    });

    this.renderIoU(ctx, canvas.width, canvas.height);
  }

  renderIoU(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Draw background grid
    ctx.strokeStyle = "#172033";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const a = this.boxA;
    const b = this.boxB;

    // Calculate Intersection
    const xA = Math.max(a.x, b.x);
    const yA = Math.max(a.y, b.y);
    const xB = Math.min(a.x + a.w, b.x + b.w);
    const yB = Math.min(a.y + a.h, b.y + b.h);

    const interW = Math.max(0, xB - xA);
    const interH = Math.max(0, yB - yA);
    const interArea = interW * interH;

    const areaA = a.w * a.h;
    const areaB = b.w * b.h;
    const unionArea = areaA + areaB - interArea;
    const iou = unionArea > 0 ? (interArea / unionArea) : 0;

    // Draw Box A
    ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x, a.y, a.w, a.h);
    ctx.fillStyle = a.color;
    ctx.font = "10px monospace";
    ctx.fillText("Box A (Pred)", a.x + 5, a.y + 14);

    // Draw Box B
    ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillText("Box B (GT)", b.x + 5, b.y + 14);

    // Draw Intersection Region (Cross-hatched / green glow)
    if (interArea > 0) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.45)";
      ctx.fillRect(xA, yA, interW, interH);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.strokeRect(xA, yA, interW, interH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.fillText("Intersection", xA + 5, yA + interH / 2);
    }

    // Update telemetry display
    const elIouValue = document.getElementById("iouValue");
    const elIouMath = document.getElementById("iouMath");
    const elBoxCoordA = document.getElementById("boxCoordA");
    const elBoxCoordB = document.getElementById("boxCoordB");

    if (elIouValue) {
      elIouValue.innerText = `${(iou * 100).toFixed(1)}%`;
      elIouValue.style.color = iou > 0.5 ? '#10b981' : '#f59e0b';
    }
    if (elIouMath) {
      elIouMath.innerText = `IoU = Inter (${Math.round(interArea)}px²) / Union (${Math.round(unionArea)}px²) = ${iou.toFixed(3)}`;
    }
    if (elBoxCoordA) {
      const cx = ((a.x + a.w / 2) / w).toFixed(2);
      const cy = ((a.y + a.h / 2) / h).toFixed(2);
      const nw = (a.w / w).toFixed(2);
      const nh = (a.h / h).toFixed(2);
      elBoxCoordA.innerText = `Box A: [${Math.round(a.x)}, ${Math.round(a.y)}, ${Math.round(a.x + a.w)}, ${Math.round(a.y + a.h)}] | YOLO: (${cx}, ${cy}, ${nw}, ${nh})`;
    }
    if (elBoxCoordB) {
      const cx = ((b.x + b.w / 2) / w).toFixed(2);
      const cy = ((b.y + b.h / 2) / h).toFixed(2);
      const nw = (b.w / w).toFixed(2);
      const nh = (b.h / h).toFixed(2);
      elBoxCoordB.innerText = `Box B: [${Math.round(b.x)}, ${Math.round(b.y)}, ${Math.round(b.x + b.w)}, ${Math.round(b.y + b.h)}] | YOLO: (${cx}, ${cy}, ${nw}, ${nh})`;
    }
  }

  /* -------------------------------------------------------------
   * 2. Anchor Boxes vs Anchor-Free Visualizer
   * ------------------------------------------------------------- */
  initAnchorBoxVisualizer() {
    this.anchorMode = "anchor_free"; // "anchor_free" or "anchor_based"
    this.currentStride = 8; // 8, 16, 32

    const canvas = document.getElementById("anchorCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 440;
    canvas.height = 240;

    this.renderAnchorDemo(ctx, canvas.width, canvas.height);
  }

  setAnchorMode(mode) {
    this.anchorMode = mode;
    const canvas = document.getElementById("anchorCanvas");
    if (!canvas) return;
    this.renderAnchorDemo(canvas.getContext("2d"), canvas.width, canvas.height);

    document.querySelectorAll(".anchor-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`btnAnchor_${mode}`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  setAnchorStride(stride) {
    this.currentStride = stride;
    const canvas = document.getElementById("anchorCanvas");
    if (!canvas) return;
    this.renderAnchorDemo(canvas.getContext("2d"), canvas.width, canvas.height);

    document.querySelectorAll(".stride-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`btnStride_${stride}`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  renderAnchorDemo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Grid spacing based on stride
    const cellSize = this.currentStride * 3.5;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += cellSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += cellSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Target object (e.g., Hard Hat / Goggles)
    const targetObj = { x: 170, y: 70, w: 90, h: 60 };
    ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
    ctx.fillRect(targetObj.x, targetObj.y, targetObj.w, targetObj.h);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(targetObj.x, targetObj.y, targetObj.w, targetObj.h);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px monospace";
    ctx.fillText("Ground Truth (Hard Hat)", targetObj.x + 5, targetObj.y - 6);

    // Selected grid center
    const centerGridX = Math.floor((targetObj.x + targetObj.w / 2) / cellSize) * cellSize + cellSize / 2;
    const centerGridY = Math.floor((targetObj.y + targetObj.h / 2) / cellSize) * cellSize + cellSize / 2;

    const elDesc = document.getElementById("anchorExplanation");

    if (this.anchorMode === "anchor_based") {
      // Draw 3 Preset Anchor Boxes (YOLOv3 - YOLOv5 style)
      const presets = [
        { w: 50, h: 50, color: "#38bdf8" },
        { w: 100, h: 65, color: "#a855f7" },
        { w: 70, h: 120, color: "#ec4899" }
      ];

      presets.forEach(p => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(centerGridX - p.w / 2, centerGridY - p.h / 2, p.w, p.h);
      });
      ctx.setLineDash([]);

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(centerGridX, centerGridY, 4, 0, Math.PI * 2);
      ctx.fill();

      if (elDesc) {
        elDesc.innerHTML = `<strong>Traditional Anchor-Based (YOLOv3-v5):</strong> Grid point tests 3 preset anchor templates (dashed boxes). If object shape mismatches preset anchors, IoU is low and gradients suffer. Requires K-means clustering on dataset.`;
      }
    } else {
      // Draw YOLOv8 Anchor-Free Center Point & 4 Distance Vectors
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.arc(centerGridX, centerGridY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 4 Directional continuous distance predictions (left, top, right, bottom)
      const left = centerGridX - targetObj.x;
      const top = centerGridY - targetObj.y;
      const right = (targetObj.x + targetObj.w) - centerGridX;
      const bottom = (targetObj.y + targetObj.h) - centerGridY;

      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;

      // Arrows to 4 boundaries
      const drawArrow = (x1, y1, x2, y2, lbl) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "9px monospace";
        ctx.fillText(lbl, (x1 + x2) / 2 + 3, (y1 + y2) / 2 - 3);
      };

      drawArrow(centerGridX, centerGridY, targetObj.x, centerGridY, `L:${Math.round(left)}`);
      drawArrow(centerGridX, centerGridY, centerGridX, targetObj.y, `T:${Math.round(top)}`);
      drawArrow(centerGridX, centerGridY, targetObj.x + targetObj.w, centerGridY, `R:${Math.round(right)}`);
      drawArrow(centerGridX, centerGridY, centerGridX, targetObj.y + targetObj.h, `B:${Math.round(bottom)}`);

      if (elDesc) {
        elDesc.innerHTML = `<strong>YOLOv8 Anchor-Free:</strong> Eliminates anchor boxes entirely! A single anchor point directly regresses 4 boundary distances [Left, Top, Right, Bottom] using <em>Distribution Focal Loss (DFL)</em>. Leaner head, 40% faster on edge devices!`;
      }
    }
  }

  /* -------------------------------------------------------------
   * 3. Transfer Learning Visualizer
   * ------------------------------------------------------------- */
  initTransferLearningVisualizer() {
    this.totalParams = 3157200; // ~3.2M for YOLOv8n
    this.freezeSlider = document.getElementById("freezeSlider");
    if (this.freezeSlider) {
      this.freezeSlider.addEventListener("input", (e) => {
        this.updateTransferLearningUI(parseInt(e.target.value));
      });
      this.updateTransferLearningUI(parseInt(this.freezeSlider.value));
    }
  }

  updateTransferLearningUI(frozenLayers) {
    const elLayerCount = document.getElementById("frozenLayerCount");
    const elTrainable = document.getElementById("trainableParams");
    const elFrozen = document.getElementById("frozenParams");
    const elPct = document.getElementById("trainablePct");

    // Estimate parameters based on layer breakdown
    // Stem + Backbone C2f blocks (layers 0-9) contain ~62% of parameters
    const backboneRatio = 0.62;
    const frozenRatio = (frozenLayers / 10) * backboneRatio;

    const frozenCount = Math.round(this.totalParams * frozenRatio);
    const trainableCount = this.totalParams - frozenCount;
    const trainablePct = ((trainableCount / this.totalParams) * 100).toFixed(1);

    if (elLayerCount) elLayerCount.innerText = `${frozenLayers} / 10`;
    if (elTrainable) elTrainable.innerText = `${(trainableCount / 1000000).toFixed(2)}M`;
    if (elFrozen) elFrozen.innerText = `${(frozenCount / 1000000).toFixed(2)}M`;
    if (elPct) elPct.innerText = `${trainablePct}%`;

    // Highlight architecture diagram blocks
    for (let i = 0; i < 10; i++) {
      const block = document.getElementById(`layerBlock_${i}`);
      if (block) {
        if (i < frozenLayers) {
          block.style.background = "rgba(100, 116, 139, 0.4)";
          block.style.borderColor = "#475569";
          block.innerText = `L${i}: Frozen`;
        } else {
          block.style.background = "rgba(59, 130, 246, 0.3)";
          block.style.borderColor = "#3b82f6";
          block.innerText = `L${i}: Active`;
        }
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.playground = new CoreConceptsPlayground();
});

