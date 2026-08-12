import { useEffect, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarkerInstance = null;
let loadingPromise = null;

async function getFaceLandmarker() {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      return faceLandmarkerInstance;
    } catch (err) {
      console.error("Failed to initialize MediaPipe FaceLandmarker:", err);
      loadingPromise = null; // Allow retry on failure
      throw err;
    }
  })();

  return loadingPromise;
}

export function useFaceLandmarker() {
  const [landmarker, setLandmarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getFaceLandmarker()
      .then((instance) => {
        if (active) {
          setLandmarker(instance);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { landmarker, loading, error };
}
