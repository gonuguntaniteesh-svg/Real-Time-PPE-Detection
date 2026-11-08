/**
 * PPE Compliance State Machine & Audit Log Manager
 */
class PPEComplianceManager {
  constructor() {
    this.totalWorkers = 0;
    this.compliantCount = 0;
    this.violationCount = 0;
    this.complianceRate = 100.0;
    this.violationLogs = [];
    this.audioContext = null;
    this.isAlarmMuted = false;
    this.lastBeepTime = 0;

    // Rules config
    this.rules = {
      hardHatRequired: true,
      vestRequired: true,
      gogglesRequired: false
    };
  }

  initAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
  }

  playAlertSound() {
    if (this.isAlarmMuted) return;
    const now = Date.now();
    if (now - this.lastBeepTime < 1800) return; // Debounce beep
    this.lastBeepTime = now;

    try {
      this.initAudio();
      if (!this.audioContext) return;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // High pitch alarm
      osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio alert error:", e);
    }
  }

  evaluateWorkers(workers) {
    this.totalWorkers = workers.length;
    this.compliantCount = 0;
    this.violationCount = 0;

    const evaluatedWorkers = workers.map(worker => {
      const missing = [];

      if (this.rules.hardHatRequired && !worker.gear.hardHat) {
        missing.push("Hard Hat");
      }
      if (this.rules.vestRequired && !worker.gear.vest) {
        missing.push("Safety Vest");
      }
      if (this.rules.gogglesRequired && !worker.gear.goggles) {
        missing.push("Goggles");
      }

      const isCompliant = missing.length === 0;

      if (isCompliant) {
        this.compliantCount++;
      } else {
        this.violationCount++;
        this.recordViolation(worker.id, missing);
      }

      return {
        ...worker,
        isCompliant,
        missing
      };
    });

    this.complianceRate = this.totalWorkers > 0 
      ? Math.round((this.compliantCount / this.totalWorkers) * 100)
      : 100;

    if (this.violationCount > 0) {
      this.playAlertSound();
    }

    this.updateTelemetryUI();
    return evaluatedWorkers;
  }

  recordViolation(workerId, missingItems) {
    const timeStr = new Date().toLocaleTimeString();
    const key = `${workerId}-${missingItems.join(',')}`;

    // Debounce duplicate log entries within 4 seconds
    const existing = this.violationLogs.find(l => l.key === key && (Date.now() - l.timestampMs < 4000));
    if (existing) return;

    const entry = {
      key,
      timeStr,
      timestampMs: Date.now(),
      workerId,
      missingItems: missingItems.slice(),
      description: `Worker #${workerId} missing ${missingItems.join(' & ')}`
    };

    this.violationLogs.unshift(entry);
    if (this.violationLogs.length > 50) this.violationLogs.pop();

    this.renderAuditLog();
  }

  updateTelemetryUI() {
    const elWorkers = document.getElementById("statWorkers");
    const elCompliant = document.getElementById("statCompliant");
    const elViolations = document.getElementById("statViolations");
    const elRate = document.getElementById("statRate");
    const alertOverlay = document.getElementById("alertOverlay");

    if (elWorkers) elWorkers.innerText = this.totalWorkers;
    if (elCompliant) elCompliant.innerText = this.compliantCount;
    if (elViolations) elViolations.innerText = this.violationCount;
    if (elRate) {
      elRate.innerText = `${this.complianceRate}%`;
      elRate.style.color = this.complianceRate >= 80 ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    if (alertOverlay) {
      if (this.violationCount > 0) {
        alertOverlay.classList.add("active");
      } else {
        alertOverlay.classList.remove("active");
      }
    }
  }

  renderAuditLog() {
    const listEl = document.getElementById("auditList");
    if (!listEl) return;

    if (this.violationLogs.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 1.5rem 0; font-size: 0.8rem;">No safety violations detected. Site fully compliant.</div>`;
      return;
    }

    listEl.innerHTML = this.violationLogs.slice(0, 8).map(log => `
      <div class="audit-item">
        <div class="audit-header">
          <span>Worker #${log.workerId} Violation</span>
          <span class="audit-time">${log.timeStr}</span>
        </div>
        <div class="audit-desc">${log.description}</div>
      </div>
    `).join('');
  }

  exportCSV() {
    if (this.violationLogs.length === 0) {
      alert("No violation logs available to export.");
      return;
    }

    let csv = "Timestamp,Worker ID,Missing Gear,Status\n";
    this.violationLogs.forEach(log => {
      csv += `"${log.timeStr}",${log.workerId},"${log.missingItems.join('; ')}",NON_COMPLIANT\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ppe_safety_violations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.complianceManager = new PPEComplianceManager();

