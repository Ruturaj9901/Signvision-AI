/**
 * SignVision AI - Browser Kinematic & Temporal Movement Classifier
 * 100% Client-Side Real-Time Gesture Recognition for MediaPipe Pose
 * Computes joint angles, scale-invariant distances, and temporal oscillation directly in JS.
 */

// MediaPipe Pose Landmark Indices
const NOSE = 0;
const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

function calculateAngle(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]];
  const v2 = [c[0] - b[0], c[1] - b[1]];
  const norm1 = Math.hypot(v1[0], v1[1]);
  const norm2 = Math.hypot(v2[0], v2[1]);
  if (norm1 < 1e-6 || norm2 < 1e-6) return 0.0;
  let cosine = (v1[0] * v2[0] + v1[1] * v2[1]) / (norm1 * norm2);
  cosine = Math.max(-1.0, Math.min(1.0, cosine));
  return (Math.acos(cosine) * 180.0) / Math.PI;
}

function euclideanDist(p1, p2) {
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
}

class BrowserMovementClassifier {
  constructor() {
    this.version = '2.0.0-Client';
  }

  predict(currentLandmarks, historyFrames = []) {
    if (!currentLandmarks || currentLandmarks.length < 25) {
      return { gestureId: 'resting', confidence: 0.90 };
    }

    const pt = (idx) => {
      if (idx < currentLandmarks.length) {
        const lm = currentLandmarks[idx];
        return [Number(lm.x || 0), Number(lm.y || 0)];
      }
      return [0, 0];
    };

    const nose = pt(NOSE);
    const l_sh = pt(LEFT_SHOULDER);
    const r_sh = pt(RIGHT_SHOULDER);
    const l_el = pt(LEFT_ELBOW);
    const r_el = pt(RIGHT_ELBOW);
    const l_wr = pt(LEFT_WRIST);
    const r_wr = pt(RIGHT_WRIST);
    const l_hip = pt(LEFT_HIP);
    const r_hip = pt(RIGHT_HIP);

    // Baseline scale metric
    let shoulderWidth = euclideanDist(l_sh, r_sh);
    if (shoulderWidth < 0.01) shoulderWidth = 0.2;

    const midShoulder = [(l_sh[0] + r_sh[0]) / 2.0, (l_sh[1] + r_sh[1]) / 2.0];
    const midHip = [(l_hip[0] + r_hip[0]) / 2.0, (l_hip[1] + r_hip[1]) / 2.0];

    // -----------------------------------------------------------------------
    // 1. Dynamic Oscillation Gestures: Hand Wave & Head Nod
    // -----------------------------------------------------------------------
    if (historyFrames && historyFrames.length >= 5) {
      const wave = this.detectWave(historyFrames, shoulderWidth);
      if (wave.detected) {
        return { gestureId: 'wave_hand', confidence: wave.confidence };
      }

      const nod = this.detectNod(historyFrames, shoulderWidth);
      if (nod.detected) {
        return { gestureId: 'head_nod', confidence: nod.confidence };
      }
    }

    // -----------------------------------------------------------------------
    // 2. Upper Body Raised Gestures (MediaPipe: y=0 is top, y=1 is bottom)
    // -----------------------------------------------------------------------
    const lHandRaised = l_wr[1] < (l_sh[1] - 0.03);
    const rHandRaised = r_wr[1] < (r_sh[1] - 0.03);

    // Both Hands Raised
    if (lHandRaised && rHandRaised) {
      const elevation = ((l_sh[1] - l_wr[1]) + (r_sh[1] - r_wr[1])) / 2.0;
      const conf = Math.min(0.99, Math.max(0.80, 0.80 + (elevation / shoulderWidth) * 0.15));
      return { gestureId: 'both_hands_raise', confidence: Math.round(conf * 100) / 100 };
    }

    // Left Hand Raised
    if (lHandRaised && !rHandRaised) {
      const elevation = l_sh[1] - l_wr[1];
      const conf = Math.min(0.98, Math.max(0.78, 0.78 + (elevation / shoulderWidth) * 0.18));
      return { gestureId: 'hand_raise_left', confidence: Math.round(conf * 100) / 100 };
    }

    // Right Hand Raised
    if (rHandRaised && !lHandRaised) {
      const elevation = r_sh[1] - r_wr[1];
      const conf = Math.min(0.98, Math.max(0.78, 0.78 + (elevation / shoulderWidth) * 0.18));
      return { gestureId: 'hand_raise_right', confidence: Math.round(conf * 100) / 100 };
    }

    // -----------------------------------------------------------------------
    // 3. Salute Gesture: Hand elevated near temple/forehead with bent elbow
    // -----------------------------------------------------------------------
    const rWristToNose = euclideanDist(r_wr, nose);
    const lWristToNose = euclideanDist(l_wr, nose);
    const rElbowAngle = calculateAngle(r_sh, r_el, r_wr);
    const lElbowAngle = calculateAngle(l_sh, l_el, l_wr);

    if (rWristToNose < 0.7 * shoulderWidth && r_wr[1] <= nose[1] + 0.05 && rElbowAngle > 40 && rElbowAngle < 120) {
      return { gestureId: 'salute', confidence: 0.91 };
    }
    if (lWristToNose < 0.7 * shoulderWidth && l_wr[1] <= nose[1] + 0.05 && lElbowAngle > 40 && lElbowAngle < 120) {
      return { gestureId: 'salute', confidence: 0.91 };
    }

    // -----------------------------------------------------------------------
    // 4. Hands Together (Namaste / Prayer / Gratitude)
    // -----------------------------------------------------------------------
    const wristDist = euclideanDist(l_wr, r_wr);
    const wristsChestHeight = (l_wr[1] > l_sh[1]) && (l_wr[1] < l_hip[1]) && (r_wr[1] > r_sh[1]) && (r_wr[1] < r_hip[1]);
    if (wristDist < (0.45 * shoulderWidth) && wristsChestHeight) {
      const conf = Math.min(0.96, Math.max(0.80, 1.0 - (wristDist / (0.45 * shoulderWidth)) * 0.2));
      return { gestureId: 'hands_together', confidence: Math.round(conf * 100) / 100 };
    }

    // -----------------------------------------------------------------------
    // 5. Open Arms Gesture: Both arms extended outwards
    // -----------------------------------------------------------------------
    if (lElbowAngle > 135 && rElbowAngle > 135) {
      const armSpan = Math.abs(l_wr[0] - r_wr[0]);
      if (armSpan > (1.8 * shoulderWidth) && l_wr[1] > (l_sh[1] - 0.1) && l_wr[1] < (l_hip[1] + 0.1)) {
        return { gestureId: 'open_arms', confidence: 0.89 };
      }
    }

    // -----------------------------------------------------------------------
    // 6. Torso Lateral Movement (Body Lean Left / Right)
    // -----------------------------------------------------------------------
    const torsoDx = midShoulder[0] - midHip[0];
    const torsoDy = midHip[1] - midShoulder[1];
    if (torsoDy > 0.05) {
      const leanRatio = torsoDx / torsoDy;
      if (leanRatio < -0.22) {
        const conf = Math.min(0.95, Math.max(0.78, 0.75 + Math.abs(leanRatio) * 0.3));
        return { gestureId: 'body_lean_left', confidence: Math.round(conf * 100) / 100 };
      } else if (leanRatio > 0.22) {
        const conf = Math.min(0.95, Math.max(0.78, 0.75 + Math.abs(leanRatio) * 0.3));
        return { gestureId: 'body_lean_right', confidence: Math.round(conf * 100) / 100 };
      }
    }

    // -----------------------------------------------------------------------
    // 7. Head & Neck Lateral Movement (Head Tilt Left / Right)
    // -----------------------------------------------------------------------
    const neckDx = nose[0] - midShoulder[0];
    const neckDy = midShoulder[1] - nose[1];
    if (neckDy > 0.03) {
      const neckRatio = neckDx / neckDy;
      if (neckRatio < -0.30) {
        const conf = Math.min(0.93, Math.max(0.75, 0.72 + Math.abs(neckRatio) * 0.3));
        return { gestureId: 'head_tilt_left', confidence: Math.round(conf * 100) / 100 };
      } else if (neckRatio > 0.30) {
        const conf = Math.min(0.93, Math.max(0.75, 0.72 + Math.abs(neckRatio) * 0.3));
        return { gestureId: 'head_tilt_right', confidence: Math.round(conf * 100) / 100 };
      }
    }

    // Baseline Neutral
    return { gestureId: 'resting', confidence: 0.92 };
  }

  detectWave(history, shoulderWidth) {
    try {
      const rwXs = [];
      const rwYs = [];
      const lwXs = [];
      const lwYs = [];
      const rshYs = [];
      const lshYs = [];

      const recent = history.slice(-15);
      for (const frame of recent) {
        if (frame.length > 16) {
          rwXs.push(Number(frame[RIGHT_WRIST]?.x || 0));
          rwYs.push(Number(frame[RIGHT_WRIST]?.y || 1));
          lwXs.push(Number(frame[LEFT_WRIST]?.x || 0));
          lwYs.push(Number(frame[LEFT_WRIST]?.y || 1));
          rshYs.push(Number(frame[RIGHT_SHOULDER]?.y || 1));
          lshYs.push(Number(frame[LEFT_SHOULDER]?.y || 1));
        }
      }

      // Check right hand wave
      if (rwXs.length >= 6) {
        const avgRwY = rwYs.reduce((a, b) => a + b, 0) / rwYs.length;
        const avgRshY = rshYs.reduce((a, b) => a + b, 0) / rshYs.length;
        if (avgRwY < avgRshY + 0.05) {
          const xSpan = Math.max(...rwXs) - Math.min(...rwXs);
          const diffs = [];
          for (let i = 1; i < rwXs.length; i++) diffs.push(rwXs[i] - rwXs[i - 1]);
          let signChanges = 0;
          for (let i = 1; i < diffs.length; i++) {
            if (diffs[i] * diffs[i - 1] < 0 && Math.abs(diffs[i]) > 0.01) signChanges++;
          }
          if (xSpan > 0.28 * shoulderWidth && signChanges >= 2) {
            return { detected: true, confidence: 0.92 };
          }
        }
      }

      // Check left hand wave
      if (lwXs.length >= 6) {
        const avgLwY = lwYs.reduce((a, b) => a + b, 0) / lwYs.length;
        const avgLshY = lshYs.reduce((a, b) => a + b, 0) / lshYs.length;
        if (avgLwY < avgLshY + 0.05) {
          const xSpan = Math.max(...lwXs) - Math.min(...lwXs);
          const diffs = [];
          for (let i = 1; i < lwXs.length; i++) diffs.push(lwXs[i] - lwXs[i - 1]);
          let signChanges = 0;
          for (let i = 1; i < diffs.length; i++) {
            if (diffs[i] * diffs[i - 1] < 0 && Math.abs(diffs[i]) > 0.01) signChanges++;
          }
          if (xSpan > 0.28 * shoulderWidth && signChanges >= 2) {
            return { detected: true, confidence: 0.92 };
          }
        }
      }
    } catch (e) {
      // Ignore calculation error
    }
    return { detected: false, confidence: 0.0 };
  }

  detectNod(history, shoulderWidth) {
    try {
      const noseYs = [];
      const shYs = [];

      const recent = history.slice(-15);
      for (const frame of recent) {
        if (frame.length > 12) {
          noseYs.push(Number(frame[NOSE]?.y || 0));
          const shY = (Number(frame[LEFT_SHOULDER]?.y || 0) + Number(frame[RIGHT_SHOULDER]?.y || 0)) / 2.0;
          shYs.push(shY);
        }
      }

      if (noseYs.length >= 8) {
        const relYs = [];
        for (let i = 0; i < noseYs.length; i++) relYs.push(shYs[i] - noseYs[i]);
        const ySpan = Math.max(...relYs) - Math.min(...relYs);
        const diffs = [];
        for (let i = 1; i < relYs.length; i++) diffs.push(relYs[i] - relYs[i - 1]);
        let signChanges = 0;
        for (let i = 1; i < diffs.length; i++) {
          if (diffs[i] * diffs[i - 1] < 0 && Math.abs(diffs[i]) > 0.005) signChanges++;
        }
        if (ySpan > 0.12 * shoulderWidth && signChanges >= 2) {
          return { detected: true, confidence: 0.88 };
        }
      }
    } catch (e) {
      // Ignore calculation error
    }
    return { detected: false, confidence: 0.0 };
  }
}

export const movementClassifier = new BrowserMovementClassifier();
export default movementClassifier;
