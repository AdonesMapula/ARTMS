/**
 * Draws Face Mesh bounding boxes and color-coded landmarks onto HTML5 Canvas.
 */
export function drawFaceDebugOverlay(canvas, landmarks) {
  if (!canvas || !landmarks || landmarks.length === 0) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // 1. Calculate Bounding Box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  landmarks.forEach((p) => {
    const x = p.x * width;
    const y = p.y * height;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  // Draw Bounding Box (Red)
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.strokeRect(minX - 10, minY - 10, (maxX - minX) + 20, (maxY - minY) + 20);

  // Bounding Box Label
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("FACE_TRACK_ACTIVE", minX - 10, minY - 15);

  // 2. Define Region Point Groups
  // Standard MediaPipe Face Mesh index mappings
  const leftEyeIdx = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const rightEyeIdx = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
  const leftEyebrowIdx = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
  const rightEyebrowIdx = [336, 296, 334, 293, 300, 285, 295, 282, 283, 276];
  const mouthIdx = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 324, 318, 402, 312, 178, 95, 88,
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191
  ];

  // Draw all points color-coded by region
  landmarks.forEach((p, idx) => {
    const x = p.x * width;
    const y = p.y * height;

    let color = "#c084fc"; // Purple (Default Jaw/Oval)
    let radius = 1.0;

    if (leftEyeIdx.includes(idx) || rightEyeIdx.includes(idx)) {
      color = "#22c55e"; // Green (Eyes)
      radius = 1.8;
    } else if (leftEyebrowIdx.includes(idx) || rightEyebrowIdx.includes(idx)) {
      color = "#3b82f6"; // Blue (Eyebrows)
      radius = 1.8;
    } else if (mouthIdx.includes(idx)) {
      color = "#eab308"; // Yellow (Mouth/Lips)
      radius = 1.8;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
}
