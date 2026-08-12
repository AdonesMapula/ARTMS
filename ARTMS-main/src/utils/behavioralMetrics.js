/**
 * Behavioral Metrics Calculation & Formulas
 *
 * NOTE: The thresholds and limits defined below are INITIAL DEFAULTS PENDING CALIBRATION
 * against real interview footage. They can be dynamically configured at runtime via URL query
 * parameters (e.g., ?ear_limit=0.20&stress_threshold=0.45).
 */

export const BEHAVIOR_CONFIG = {
  // Eye Aspect Ratio (EAR) limit below which eyes are considered closed or occluded
  ear_limit: parseFloat(new URLSearchParams(window.location.search).get("ear_limit")) || 0.22,

  // Maximum allowed head deviation in degrees before attentiveness score is penalized
  head_deg_limit: parseFloat(new URLSearchParams(window.location.search).get("head_deg_limit")) || 25.0,

  // Threshold above which stress blendshapes (brow down, mouth press) indicate tension
  stress_threshold: parseFloat(new URLSearchParams(window.location.search).get("stress_threshold")) || 0.40,

  // Threshold above which smile blendshape indicates active engagement / warmth
  smile_threshold: parseFloat(new URLSearchParams(window.location.search).get("smile_threshold")) || 0.35,

  // Threshold above which composure score is considered composed & focused
  composed_threshold: parseFloat(new URLSearchParams(window.location.search).get("composed_threshold")) || 75.0,
};

/**
 * Calculates distance between two 3D landmarks.
 */
function dist(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

/**
 * Calculates Eye Aspect Ratio (EAR) from standard eye landmarks.
 */
export function calculateEAR(landmarks) {
  if (!landmarks || landmarks.length < 468) return 0.0;

  // Left Eye Landmarks
  const leftEAR = (dist(landmarks[160], landmarks[144]) + dist(landmarks[158], landmarks[153])) / (2.0 * dist(landmarks[33], landmarks[133]));

  // Right Eye Landmarks
  const rightEAR = (dist(landmarks[385], landmarks[373]) + dist(landmarks[387], landmarks[380])) / (2.0 * dist(landmarks[362], landmarks[263]));

  return (leftEAR + rightEAR) / 2.0;
}

/**
 * Estimates simple Head Pose (Yaw, Pitch, Roll) in degrees based on key face points.
 */
export function estimateHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // Yaw: Horizontal ratio of nose position relative to eyes line
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeDist = dist(leftEye, rightEye) || 0.01;
  const yaw = ((nose.x - eyeCenterX) / eyeDist) * 50; // Scale approximation

  // Pitch: Vertical ratio of nose position relative to forehead-chin line
  const faceHeight = dist(forehead, chin) || 0.01;
  const faceCenterY = (forehead.y + chin.y) / 2;
  const pitch = ((nose.y - faceCenterY) / faceHeight) * 50; // Scale approximation

  // Roll: Angle of the eyes line relative to horizontal
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180.0 / Math.PI);

  return { yaw, pitch, roll };
}

/**
 * Main evaluation scoring function.
 * Computes live metrics from landmarks and blendshape categories.
 */
export function evaluateBehavior(landmarks, blendshapes, headHistory = []) {
  if (!landmarks || landmarks.length === 0) {
    return {
      faceDetected: false,
      attentiveScore: 0,
      composedScore: 0,
      engagedScore: 0,
      emotion: "No Face Detected",
      ear: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
    };
  }

  const ear = calculateEAR(landmarks);
  const { yaw, pitch, roll } = estimateHeadPose(landmarks);

  // Extract Blendshapes by Name
  const getBlendshapeValue = (name) => {
    const item = blendshapes.find(b => b.categoryName === name);
    return item ? item.score : 0.0;
  };

  const browDownLeft = getBlendshapeValue("browDownLeft");
  const browDownRight = getBlendshapeValue("browDownRight");
  const mouthSmileLeft = getBlendshapeValue("mouthSmileLeft");
  const mouthSmileRight = getBlendshapeValue("mouthSmileRight");
  const mouthPressLeft = getBlendshapeValue("mouthPressLeft");
  const mouthPressRight = getBlendshapeValue("mouthPressRight");

  // 1. Attentiveness Score calculation
  const headDev = Math.sqrt(yaw * yaw + pitch * pitch);
  const headPenalty = Math.min(1.0, headDev / BEHAVIOR_CONFIG.head_deg_limit);
  const earFactor = Math.min(1.0, ear / BEHAVIOR_CONFIG.ear_limit);
  const attentiveScore = Math.max(0, Math.min(100, Math.round(
    100.0 * (1.0 - 0.7 * headPenalty) * earFactor
  )));

  // 2. Composure Score calculation
  // Substitute jawClench (unsupported) with average lip/jaw tension (mouthPressLeft / mouthPressRight)
  const mouthPressAvg = (mouthPressLeft + mouthPressRight) / 2.0;
  const stressBlendshapesVal = (browDownLeft + browDownRight + mouthPressAvg) / 3.0;

  // Calculate Head Jitter / Fidgeting over sliding window
  let headJitter = 0;
  if (headHistory.length > 1) {
    const yaws = headHistory.map(h => h.yaw);
    const pitches = headHistory.map(h => h.pitch);
    const meanYaw = yaws.reduce((a, b) => a + b, 0) / yaws.length;
    const meanPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const varYaw = yaws.reduce((a, b) => a + Math.pow(b - meanYaw, 2), 0) / yaws.length;
    const varPitch = pitches.reduce((a, b) => a + Math.pow(b - meanPitch, 2), 0) / pitches.length;
    headJitter = Math.sqrt(varYaw + varPitch);
  }
  const composedScore = Math.max(0, Math.min(100, Math.round(
    100.0 - (stressBlendshapesVal * 60.0 + headJitter * 8.0)
  )));

  // 3. Engagement Score calculation
  const smileVal = (mouthSmileLeft + mouthSmileRight) / 2.0;
  const engagedScore = Math.max(0, Math.min(100, Math.round(
    0.4 * attentiveScore + 0.6 * (smileVal * 100.0)
  )));

  // 4. Live Badge Emotion Label Precedence (Explicit Ordered Chain)
  let emotion = "Neutral & Attentive";
  if (attentiveScore < (BEHAVIOR_CONFIG.ear_limit * 100.0)) {
    // Condition A: Distracted (Looks away or eyes closed)
    emotion = "Distracted / Looking Away";
  } else if (stressBlendshapesVal > BEHAVIOR_CONFIG.stress_threshold) {
    // Condition B: Tense (Brows lowered, lips tight)
    emotion = "Hesitant / Tense";
  } else if (smileVal > BEHAVIOR_CONFIG.smile_threshold) {
    // Condition C: Friendly (Active smiling)
    emotion = "Engaged & Friendly";
  } else if (composedScore >= BEHAVIOR_CONFIG.composed_threshold) {
    // Condition D: Focused (Steady head, relaxed face)
    emotion = "Composed & Focused";
  }

  return {
    faceDetected: true,
    attentiveScore,
    composedScore,
    engagedScore,
    emotion,
    ear,
    yaw,
    pitch,
    roll,
    smile: smileVal,
    stress: stressBlendshapesVal
  };
}
