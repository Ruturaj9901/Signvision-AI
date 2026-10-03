/**
 * SignVision AI - Simulation Data Generator
 * Provides synthetic MediaPipe 33-landmark skeleton sequences for every supported movement.
 * Enables zero-webcam testing, offline demonstration, and automated test pipelines.
 */

// Helper to construct a normalized 33-point neutral human pose skeleton
function createBaseSkeleton() {
  const lm = [];
  for (let i = 0; i < 33; i++) {
    lm.push({ x: 0.5, y: 0.5, z: 0.0, visibility: 0.99 });
  }

  // Head
  lm[0] = { x: 0.50, y: 0.22, z: 0.0, visibility: 0.99 }; // Nose
  lm[1] = { x: 0.52, y: 0.20, z: 0.0, visibility: 0.99 }; // Left eye inner
  lm[2] = { x: 0.54, y: 0.20, z: 0.0, visibility: 0.99 }; // Left eye
  lm[3] = { x: 0.56, y: 0.20, z: 0.0, visibility: 0.99 }; // Left eye outer
  lm[4] = { x: 0.48, y: 0.20, z: 0.0, visibility: 0.99 }; // Right eye inner
  lm[5] = { x: 0.46, y: 0.20, z: 0.0, visibility: 0.99 }; // Right eye
  lm[6] = { x: 0.44, y: 0.20, z: 0.0, visibility: 0.99 }; // Right eye outer
  lm[7] = { x: 0.58, y: 0.22, z: 0.0, visibility: 0.99 }; // Left ear
  lm[8] = { x: 0.42, y: 0.22, z: 0.0, visibility: 0.99 }; // Right ear
  lm[9] = { x: 0.52, y: 0.26, z: 0.0, visibility: 0.99 }; // Mouth left
  lm[10] = { x: 0.48, y: 0.26, z: 0.0, visibility: 0.99 }; // Mouth right

  // Torso / Shoulders
  lm[11] = { x: 0.62, y: 0.36, z: 0.0, visibility: 0.99 }; // Left shoulder
  lm[12] = { x: 0.38, y: 0.36, z: 0.0, visibility: 0.99 }; // Right shoulder

  // Arms - Neutral resting downwards
  lm[13] = { x: 0.66, y: 0.52, z: 0.0, visibility: 0.99 }; // Left elbow
  lm[14] = { x: 0.34, y: 0.52, z: 0.0, visibility: 0.99 }; // Right elbow
  lm[15] = { x: 0.68, y: 0.68, z: 0.0, visibility: 0.99 }; // Left wrist
  lm[16] = { x: 0.32, y: 0.68, z: 0.0, visibility: 0.99 }; // Right wrist

  // Hands
  lm[17] = { x: 0.69, y: 0.72, z: 0.0, visibility: 0.99 }; // Left pinky
  lm[18] = { x: 0.31, y: 0.72, z: 0.0, visibility: 0.99 }; // Right pinky
  lm[19] = { x: 0.68, y: 0.73, z: 0.0, visibility: 0.99 }; // Left index
  lm[20] = { x: 0.32, y: 0.73, z: 0.0, visibility: 0.99 }; // Right index
  lm[21] = { x: 0.67, y: 0.71, z: 0.0, visibility: 0.99 }; // Left thumb
  lm[22] = { x: 0.33, y: 0.71, z: 0.0, visibility: 0.99 }; // Right thumb

  // Hips
  lm[23] = { x: 0.57, y: 0.76, z: 0.0, visibility: 0.99 }; // Left hip
  lm[24] = { x: 0.43, y: 0.76, z: 0.0, visibility: 0.99 }; // Right hip

  // Legs
  lm[25] = { x: 0.58, y: 0.90, z: 0.0, visibility: 0.99 }; // Left knee
  lm[26] = { x: 0.42, y: 0.90, z: 0.0, visibility: 0.99 }; // Right knee
  lm[27] = { x: 0.58, y: 0.99, z: 0.0, visibility: 0.99 }; // Left ankle
  lm[28] = { x: 0.42, y: 0.99, z: 0.0, visibility: 0.99 }; // Right ankle

  return lm;
}

/**
 * Generate animated multi-frame sequences for gestures.
 */
export function getSimulatedGestureSequence(gestureId) {
  const base = createBaseSkeleton();
  const frames = [];
  const numFrames = 12;

  for (let f = 0; f < numFrames; f++) {
    // Deep clone base
    const frame = JSON.parse(JSON.stringify(base));
    const progress = f / (numFrames - 1);
    const sine = Math.sin(progress * Math.PI * 2);

    switch (gestureId) {
      case 'hand_raise_right':
        // Right arm raised high
        frame[14] = { x: 0.32, y: 0.30, z: 0.0, visibility: 0.99 }; // Elbow
        frame[16] = { x: 0.30, y: 0.14 + Math.sin(progress * Math.PI) * 0.02, z: 0.0, visibility: 0.99 }; // Wrist
        break;

      case 'hand_raise_left':
        // Left arm raised high
        frame[13] = { x: 0.68, y: 0.30, z: 0.0, visibility: 0.99 };
        frame[15] = { x: 0.70, y: 0.14 + Math.sin(progress * Math.PI) * 0.02, z: 0.0, visibility: 0.99 };
        break;

      case 'both_hands_raise':
        // Both arms raised high
        frame[13] = { x: 0.68, y: 0.28, z: 0.0, visibility: 0.99 };
        frame[14] = { x: 0.32, y: 0.28, z: 0.0, visibility: 0.99 };
        frame[15] = { x: 0.70, y: 0.14, z: 0.0, visibility: 0.99 };
        frame[16] = { x: 0.30, y: 0.14, z: 0.0, visibility: 0.99 };
        break;

      case 'wave_hand':
        // Right hand raised and oscillating left and right
        frame[14] = { x: 0.32, y: 0.30, z: 0.0, visibility: 0.99 };
        frame[16] = { x: 0.30 + sine * 0.08, y: 0.16, z: 0.0, visibility: 0.99 };
        break;

      case 'head_nod':
        // Head moves up and down cyclically
        const nodOffset = Math.sin(progress * Math.PI * 2) * 0.04;
        frame[0].y += nodOffset;
        frame[1].y += nodOffset;
        frame[2].y += nodOffset;
        frame[4].y += nodOffset;
        frame[5].y += nodOffset;
        break;

      case 'head_tilt_left':
        // Head tilted towards left shoulder
        frame[0].x += 0.06;
        frame[1].x += 0.06;
        frame[2].x += 0.06;
        frame[4].x += 0.06;
        frame[5].x += 0.06;
        break;

      case 'head_tilt_right':
        // Head tilted towards right shoulder
        frame[0].x -= 0.06;
        frame[1].x -= 0.06;
        frame[2].x -= 0.06;
        frame[4].x -= 0.06;
        frame[5].x -= 0.06;
        break;

      case 'body_lean_left':
        // Upper torso tilted left
        const leanL = 0.08;
        frame[0].x += leanL;
        frame[11].x += leanL;
        frame[12].x += leanL;
        frame[13].x += leanL;
        frame[14].x += leanL;
        frame[15].x += leanL;
        frame[16].x += leanL;
        break;

      case 'body_lean_right':
        // Upper torso tilted right
        const leanR = -0.08;
        frame[0].x += leanR;
        frame[11].x += leanR;
        frame[12].x += leanR;
        frame[13].x += leanR;
        frame[14].x += leanR;
        frame[15].x += leanR;
        frame[16].x += leanR;
        break;

      case 'hands_together':
        // Both wrists brought together near chest center
        frame[13] = { x: 0.58, y: 0.46, z: 0.0, visibility: 0.99 };
        frame[14] = { x: 0.42, y: 0.46, z: 0.0, visibility: 0.99 };
        frame[15] = { x: 0.51, y: 0.44, z: 0.0, visibility: 0.99 };
        frame[16] = { x: 0.49, y: 0.44, z: 0.0, visibility: 0.99 };
        break;

      case 'open_arms':
        // Arms spread wide horizontally
        frame[13] = { x: 0.78, y: 0.38, z: 0.0, visibility: 0.99 };
        frame[14] = { x: 0.22, y: 0.38, z: 0.0, visibility: 0.99 };
        frame[15] = { x: 0.92, y: 0.38, z: 0.0, visibility: 0.99 };
        frame[16] = { x: 0.08, y: 0.38, z: 0.0, visibility: 0.99 };
        break;

      case 'salute':
        // Right hand at temple with bent elbow
        frame[14] = { x: 0.34, y: 0.34, z: 0.0, visibility: 0.99 };
        frame[16] = { x: 0.44, y: 0.21, z: 0.0, visibility: 0.99 };
        break;

      case 'resting':
      default:
        // Neutral relaxed breathing
        frame[11].y += Math.sin(progress * Math.PI * 2) * 0.005;
        frame[12].y += Math.sin(progress * Math.PI * 2) * 0.005;
        break;
    }

    frames.push(frame);
  }

  return frames;
}

export const SIMULATION_GESTURES_LIST = [
  { id: 'hand_raise_right', name: 'Right Hand Raise', emoji: '🙋‍♂️', icon: 'hand', category: 'Upper Body' },
  { id: 'hand_raise_left', name: 'Left Hand Raise', emoji: '🙋', icon: 'hand', category: 'Upper Body' },
  { id: 'both_hands_raise', name: 'Both Hands Raised', emoji: '🙆', icon: 'chevrons-up', category: 'Upper Body' },
  { id: 'wave_hand', name: 'Waving Hand', emoji: '👋', icon: 'wind', category: 'Dynamic Gesture' },
  { id: 'head_nod', name: 'Head Nod (Affirmation)', emoji: '🙇', icon: 'arrow-down-up', category: 'Head & Neck' },
  { id: 'head_tilt_left', name: 'Head Tilt Left', emoji: '🤔', icon: 'corner-down-left', category: 'Head & Neck' },
  { id: 'head_tilt_right', name: 'Head Tilt Right', emoji: '❓', icon: 'corner-down-right', category: 'Head & Neck' },
  { id: 'body_lean_left', name: 'Body Lean Left', emoji: '👈', icon: 'arrow-left', category: 'Torso' },
  { id: 'body_lean_right', name: 'Body Lean Right', emoji: '👉', icon: 'arrow-right', category: 'Torso' },
  { id: 'hands_together', name: 'Hands Together (Namaste)', emoji: '🙏', icon: 'heart', category: 'Upper Body' },
  { id: 'open_arms', name: 'Open Arms / Welcome', emoji: '🫂', icon: 'maximize', category: 'Upper Body' },
  { id: 'salute', name: 'Salute / Ready', emoji: '🫡', icon: 'smile', category: 'Upper Body' },
  { id: 'resting', name: 'Resting / Neutral', emoji: '🧘', icon: 'user', category: 'Baseline' }
];
