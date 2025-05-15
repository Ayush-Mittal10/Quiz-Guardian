import * as faceapi from 'face-api.js';
import { Warning } from '@/types';

// Types for face detection results
export interface FaceDetectionResult {
  faceCount: number;
  isLookingAway: boolean;
  eyesClosed: boolean;
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  hasForeignObjects: boolean;
}

// Initialize and load the face-api models
export const initFaceDetection = async (): Promise<boolean> => {
  try {
    console.log('Loading face-api.js models...');
    // Load models from the public directory
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    console.log('Face detection models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    return false;
  }
};

// Detect faces in the video element
export const detectFaces = async (
  videoElement: HTMLVideoElement
): Promise<FaceDetectionResult> => {
  if (!videoElement || videoElement.paused || videoElement.ended) {
    return {
      faceCount: 0,
      isLookingAway: false,
      eyesClosed: false,
      headPose: { yaw: 0, pitch: 0, roll: 0 },
      hasForeignObjects: false
    };
  }

  try {
    // Run detection with face landmarks, expressions
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceExpressions();

    // Initialize result object
    const result: FaceDetectionResult = {
      faceCount: detections.length,
      isLookingAway: false,
      eyesClosed: false,
      headPose: { yaw: 0, pitch: 0, roll: 0 },
      hasForeignObjects: false
    };

    // If at least one face is detected, analyze the primary face
    if (detections.length > 0) {
      const primaryFace = detections[0];
      const landmarks = primaryFace.landmarks;
      const expressions = primaryFace.expressions;

      // Detect if eyes are closed (using expressions)
      result.eyesClosed = expressions.sad > 0.5 || expressions.angry > 0.7;

      // Estimate head pose from landmarks
      if (landmarks) {
        const jawOutline = landmarks.getJawOutline();
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Simple head pose estimation using face landmarks
        // This is a basic approximation - the full algorithm would be more complex
        const faceWidth = jawOutline[16].x - jawOutline[0].x;
        const eyeDistance = rightEye[0].x - leftEye[0].x;
        const noseToJaw = nose[3].y - jawOutline[8].y;

        // Calculate approximate head pose values
        // These thresholds should be calibrated for better accuracy
        const yaw = (eyeDistance / faceWidth - 0.4) * 90; // side-to-side rotation
        const pitch = (noseToJaw / faceWidth - 0.32) * 90; // up-down rotation

        result.headPose = {
          yaw: yaw,
          pitch: pitch,
          roll: 0 // roll is more complex to calculate
        };

        // Determine if looking away (based on head pose)
        // Increased thresholds to be less strict on what constitutes "looking away"
        result.isLookingAway = Math.abs(yaw) > 45 || Math.abs(pitch) > 30;
        
        // Log head pose values for debugging
        console.log(`Head pose - yaw: ${yaw.toFixed(2)}, pitch: ${pitch.toFixed(2)}, looking away: ${result.isLookingAway}`);
      }

      // This would require additional object detection models
      // Currently stubbed with a random check for demonstration
      result.hasForeignObjects = false;
    }

    return result;
  } catch (error) {
    console.error('Error during face detection:', error);
    return {
      faceCount: 0,
      isLookingAway: false,
      eyesClosed: false,
      headPose: { yaw: 0, pitch: 0, roll: 0 },
      hasForeignObjects: false
    };
  }
};

// Analyze detection results and generate appropriate warnings
export const analyzeFaceDetection = (
  result: FaceDetectionResult,
  lastActivity: number,
  currentTime: number = Date.now()
): {
  hasViolation: boolean;
  warningType: 'no-face' | 'multiple-faces' | 'focus-loss' | null;
  description: string;
} => {
  // Check for no face detected
  if (result.faceCount === 0) {
    return {
      hasViolation: true,
      warningType: 'no-face',
      description: 'No face detected in camera'
    };
  }

  // Check for multiple faces detected
  if (result.faceCount > 1) {
    return {
      hasViolation: true,
      warningType: 'multiple-faces',
      description: `Multiple faces detected (${result.faceCount})`
    };
  }

  // Check for looking away or inactive for too long
  if (result.isLookingAway || currentTime - lastActivity > 30000) {
    return {
      hasViolation: true,
      warningType: 'focus-loss',
      description: result.isLookingAway
        ? 'Looking away from screen detected'
        : 'User inactive for extended period'
    };
  }

  // No violations detected
  return {
    hasViolation: false,
    warningType: null,
    description: ''
  };
};

// Run periodic face detection with callback for warnings
export const startFaceMonitoring = (
  videoElement: HTMLVideoElement,
  intervalMs: number,
  lastActivity: number,
  onViolation: (type: 'no-face' | 'multiple-faces' | 'focus-loss', description: string) => void
): number => {
  // Add throttling for warnings
  let lastWarningTime = 0;
  const THROTTLE_MS = 5000; // Only send a warning every 5 seconds
  
  // Return the interval ID so it can be cleared later
  return window.setInterval(async () => {
    try {
      const detectionResult = await detectFaces(videoElement);
      const analysis = analyzeFaceDetection(detectionResult, lastActivity);
      
      if (analysis.hasViolation && analysis.warningType) {
        const now = Date.now();
        // Only trigger warning if enough time has passed since last warning
        if (now - lastWarningTime >= THROTTLE_MS) {
          lastWarningTime = now;
          onViolation(analysis.warningType, analysis.description);
        }
      }
    } catch (error) {
      console.error('Error in face monitoring interval:', error);
    }
  }, intervalMs);
}; 