// MediaPipe Hands Gesture Controller
import { lang } from './lang.js';

class GestureController {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.video = null;
    this.overlayCanvas = null;
    this.overlayCtx = null;
    
    // Callbacks to communicate with main.js
    this.onSwipeCallback = null;
    this.onPinchCallback = null;
    this.onFistCallback = null;
    this.onOpenHandCallback = null;
    this.onSlideCallback = null;
    this.onFistHoldStillCallback = null;
    this.onFistHoldProgressCallback = null;
    
    // State Tracking
    this.isCameraActive = false;
    this.handHistory = []; // History of palm positions for velocity calculation
    this.historyLength = 8;
    this.currentGesture = 'NONE';
    this.pinchActive = false;
    
    // Swipe Cooldown
    this.lastSwipeTime = 0;
    this.swipeCooldown = 400; // ms

    // Slide tracking position
    this.prevPalmX = null;

    // Fist hold still tracking
    this.fistStartTime = null;
    this.fistStartPos = null;
    this.fistPlayTriggered = false;

    // Listen to language changes
    window.addEventListener('languagechanged', () => {
      this.updateStatusUI();
    });
  }

  updateStatusUI() {
    const mpStatus = document.getElementById('mp-status');
    if (mpStatus) {
      if (this.isCameraActive) {
        mpStatus.className = "status-indicator active";
        mpStatus.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" style="color: #22c55e;" title="${lang.t('camera_active')}"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`;
      } else {
        mpStatus.className = "status-indicator";
        mpStatus.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" style="color: #6b7280;" title="${lang.t('camera_off')}"><path fill="currentColor" d="M9.56 8H16c.55 0 1 .45 1 1v6.44l2 2V9c0-1.66-1.34-3-3-3H7.56l2 2zM2.26 4L4 5.74V17c0 1.66 1.34 3 3 3h11.26l1.74 1.74 1.41-1.41L3.67 2.59 2.26 4zM7 8.74L15.26 17H7V8.74z"/></svg>`;
      }
    }
    const camWarningSpan = document.getElementById('cam-warning')?.querySelector('span');
    if (camWarningSpan) {
      // If camera is active, we don't display warning, but if off, we translate it
      if (!this.isCameraActive) {
        // Find if it was blocked or off
        const isBlocked = camWarningSpan.textContent === "Camera Blocked" || camWarningSpan.textContent === lang.t('camera_blocked');
        camWarningSpan.textContent = isBlocked ? lang.t('camera_blocked') : lang.t('camera_off');
      }
    }
  }

  // Initialize MediaPipe Hands and set up overlay canvas
  init(videoElement, canvasElement) {
    this.video = videoElement;
    this.overlayCanvas = canvasElement;
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    
    // Configure MediaPipe Hands
    // Note: We use jsDelivr CDN libraries imported in index.html which defines standard 'Hands'
    if (typeof window.Hands === 'undefined') {
      console.error("MediaPipe Hands library not loaded yet.");
      return false;
    }

    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => this.onResults(results));
    return true;
  }

  // Request camera and start tracking
  async startCamera() {
    if (this.isCameraActive) return;

    try {
      const mpStatus = document.getElementById('mp-status');
      if (mpStatus) {
        mpStatus.innerHTML = `<svg class="pulse-icon" viewBox="0 0 24 24" width="16" height="16" style="color: #eab308;" title="${lang.t('camera_requesting')}"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      
      this.video.srcObject = stream;
      this.video.play().catch(err => console.warn("Video play failed:", err));
      this.isCameraActive = true;
      document.getElementById('cam-warning').classList.add('hidden');
      
      // Start MediaPipe Camera helper
      if (window.Camera) {
        this.camera = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.isCameraActive) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 640,
          height: 480
        });
        this.camera.start();
        
        this.updateStatusUI();
      } else {
        // Fallback if Camera class is not loaded
        this.startRequestAnimationFrameLoop();
      }
    } catch (error) {
      console.error("Camera access denied or failed:", error);
      this.isCameraActive = false;
      this.updateStatusUI();
      document.getElementById('cam-warning').classList.remove('hidden');
      document.getElementById('cam-warning').querySelector('span').textContent = lang.t('camera_blocked');
      throw error;
    }
  }

  // Stop camera feed
  stopCamera() {
    this.isCameraActive = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    this.updateStatusUI();
    document.getElementById('cam-warning').classList.remove('hidden');
    document.getElementById('cam-warning').querySelector('span').textContent = lang.t('camera_off');
    
    // Clear canvas
    if (this.overlayCtx) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  // Fallback animation frame pump if MediaPipe Camera utility is unavailable
  startRequestAnimationFrameLoop() {
    const process = async () => {
      if (!this.isCameraActive) return;
      try {
        await this.hands.send({ image: this.video });
      } catch (err) {
        console.error("Error processing camera frame:", err);
      }
      requestAnimationFrame(process);
    };
    requestAnimationFrame(process);
    this.updateStatusUI();
  }

  // Process MediaPipe results
  onResults(results) {
    const canvasWidth = this.overlayCanvas.width;
    const canvasHeight = this.overlayCanvas.height;
    
    // Sync overlay dimensions
    if (this.overlayCanvas.clientWidth !== canvasWidth || this.overlayCanvas.clientHeight !== canvasHeight) {
      this.overlayCanvas.width = this.overlayCanvas.clientWidth;
      this.overlayCanvas.height = this.overlayCanvas.clientHeight;
    }

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand landmarks wireframe
      this.drawHandMesh(landmarks);
      
      // Process gesture classification
      this.processGestures(landmarks);
    } else {
      // Clear hand active indicators
      this.currentGesture = 'NONE';
      this.updateGestureCardsHighlight();
      if (this.pinchActive) {
        this.pinchActive = false;
        if (this.onPinchCallback) this.onPinchCallback(false, null);
      }
      this.prevPalmX = null; // Clear hand coordinate tracking cache when lost
    }
  }

  // Draw wireframe with cool neon styling
  drawHandMesh(landmarks) {
    if (!window.drawConnectors || !window.drawLandmarks) return;

    // Draw lines
    window.drawConnectors(this.overlayCtx, landmarks, window.HAND_CONNECTIONS, {
      color: '#00f0ff',
      lineWidth: 2
    });
    
    // Draw dots
    window.drawLandmarks(this.overlayCtx, landmarks, {
      color: '#bd00ff',
      lineWidth: 1,
      radius: 3
    });
  }

  // Classify gestures based on coordinates
  processGestures(landmarks) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Calculate reference size: distance between Wrist (0) and Middle Finger MCP (9)
    const mcp9 = landmarks[9];
    const handSize = Math.hypot(mcp9.x - wrist.x, mcp9.y - wrist.y);
    
    // If handSize is too small, skip calculation to avoid noise
    if (handSize < 0.05) return;

    // Distances from finger tips to middle MCP (palm center area)
    const indexPalmDist = Math.hypot(indexTip.x - mcp9.x, indexTip.y - mcp9.y);
    const middlePalmDist = Math.hypot(middleTip.x - mcp9.x, middleTip.y - mcp9.y);
    const ringPalmDist = Math.hypot(ringTip.x - mcp9.x, ringTip.y - mcp9.y);
    const pinkyPalmDist = Math.hypot(pinkyTip.x - mcp9.x, pinkyTip.y - mcp9.y);
    const thumbPalmDist = Math.hypot(thumbTip.x - mcp9.x, thumbTip.y - mcp9.y);

    // Classify gesture with relaxed thresholds for better motion tracking
    let detectedGesture = 'NONE';

    // 1. FIST GESTURE
    const isFist = (indexPalmDist < handSize * 0.65) && 
                   (middlePalmDist < handSize * 0.6) && 
                   (ringPalmDist < handSize * 0.65) && 
                   (pinkyPalmDist < handSize * 0.75);

    // 2. OPEN PALM GESTURE (Relaxed thresholds for reliable detection during hand movement)
    const isOpenHand = (indexPalmDist > handSize * 0.75) && 
                       (middlePalmDist > handSize * 0.8) && 
                       (ringPalmDist > handSize * 0.75) && 
                       (pinkyPalmDist > handSize * 0.7) &&
                       (thumbPalmDist > handSize * 0.5);

    // 3. DIGIT 1 GESTURE (Index extended, others closed/folded)
    const isDigit1 = (indexPalmDist > handSize * 0.95) && 
                     (middlePalmDist < handSize * 0.7) && 
                     (ringPalmDist < handSize * 0.7) && 
                     (pinkyPalmDist < handSize * 0.8) &&
                     (thumbPalmDist < handSize * 0.8);

    if (isFist) {
      detectedGesture = 'FIST';
    } else if (isOpenHand) {
      detectedGesture = 'OPEN';
    } else if (isDigit1) {
      detectedGesture = 'DIGIT1';
    }

    const oldGesture = this.currentGesture;
    this.currentGesture = detectedGesture;
    this.updateGestureCardsHighlight();

    // Trigger onOpenHandCallback on transition to OPEN
    if (detectedGesture === 'OPEN' && oldGesture !== 'OPEN') {
      if (this.onOpenHandCallback) {
        this.onOpenHandCallback();
      }
    }

    // --- Action Triggers based on detectedGesture ---
    
    // A. Fist Hold Still Logic (Zoom in & Play)
    if (detectedGesture === 'FIST') {
      const now = Date.now();
      
      // Trigger zoom immediately on first detection of FIST
      if (this.fistStartTime === null) {
        this.fistStartTime = now;
        this.fistStartPos = { x: mcp9.x, y: mcp9.y };
        this.fistPlayTriggered = false;
        
        // Callback to zoom in current album
        if (this.onFistCallback) this.onFistCallback();
        if (this.onFistHoldProgressCallback) this.onFistHoldProgressCallback(0);
      } else {
        // Track movement to verify if hand is still
        const dist = Math.hypot(mcp9.x - this.fistStartPos.x, mcp9.y - this.fistStartPos.y);
        if (dist > 0.05) {
          // Hand moved too much, reset hold still timer
          this.fistStartTime = now;
          this.fistStartPos = { x: mcp9.x, y: mcp9.y };
          if (this.onFistHoldProgressCallback) {
            this.onFistHoldProgressCallback(0);
          }
        } else {
          // Calculate and broadcast progress
          const progress = Math.min(1.0, (now - this.fistStartTime) / 1000);
          if (this.onFistHoldProgressCallback) {
            this.onFistHoldProgressCallback(progress);
          }
          
          if (now - this.fistStartTime >= 1000 && !this.fistPlayTriggered) {
            this.fistPlayTriggered = true;
            if (this.onFistHoldStillCallback) {
              this.onFistHoldStillCallback();
            }
          }
        }
      }
    } else {
      // Reset fist timers and hide loader if gesture is not FIST
      if (this.fistStartTime !== null) {
        if (this.onFistHoldProgressCallback) {
          this.onFistHoldProgressCallback(0);
        }
      }
      this.fistStartTime = null;
      this.fistStartPos = null;
      this.fistPlayTriggered = false;
    }

    // B. Continuous Position Tracking and Slide Callback
    const currentPalmX = mcp9.x;
    
    // Reset tracking when gesture type changes to prevent position jumps
    if (detectedGesture !== oldGesture) {
      this.prevPalmX = null;
    }
    
    if (this.prevPalmX !== null) {
      const dx = this.prevPalmX - currentPalmX;
      
      // Only trigger slide behavior when currently in OPEN or DIGIT1 gesture state
      // Apply a small dead zone to filter noise
      if ((detectedGesture === 'OPEN' || detectedGesture === 'DIGIT1') && Math.abs(dx) > 0.003) {
        const isFast = (detectedGesture === 'OPEN');
        if (this.onSlideCallback) {
          this.onSlideCallback(dx, isFast);
        }
      }
    }
    this.prevPalmX = currentPalmX;
  }

  // UI styling feedback for Swipe triggers
  triggerCardFeedback(cardId, className) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.add(className);
    setTimeout(() => {
      card.classList.remove(className);
    }, 500);
  }

  // Update active gesture lists in Sidebar UI
  updateGestureCardsHighlight() {
    const cards = {
      'card-open': this.currentGesture === 'OPEN',
      'card-digit1': this.currentGesture === 'DIGIT1',
      'card-fist': this.currentGesture === 'FIST'
    };

    Object.entries(cards).forEach(([id, active]) => {
      const card = document.getElementById(id);
      if (!card) return;
      
      if (active) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }
}

export const gestures = new GestureController();
