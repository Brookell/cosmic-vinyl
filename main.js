// Cosmic Vinyl - Main Orchestrator (Three.js + Gestures + Audio)

import * as THREE from 'three';
import { audio } from './audio.js';
import { gestures } from './gestures.js';

// --- CONFIGURATION CONSTANTS ---
let NUM_ALBUMS = 7;
const ALBUM_WIDTH = 2.2;
const ALBUM_HEIGHT = 2.2;
const VINYL_ROTATION_SPEED = 2.5;

class App {
  constructor() {
    this.container = document.body;
    this.canvas = document.getElementById('canvas3d');
    
    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // 3D Objects
    this.albumGroups = []; // Array of { group, sleeve, vinyl, index, initialAngle }
    this.starfield = null;
    this.starPositions = null; // Float32Array cache of original star points
    this.starsCount = 4000;
    this.particleSpeedSetting = 1.0;
    this.bgBrightnessSetting = 1.0; // 1.0x is default 20% in UI
    
    // Carousel Interaction State
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.rotationVelocity = 0;
    this.focusedIndex = 0;
    this.isZoomed = false; // Is the focused album zoomed in (Selected)
    
    // Zoom/Selection Lerp targets
    this.zoomProgress = 0;
    
    // Particle Burst/Warp State
    this.warpActive = false;
    this.warpFactor = 0;
    
    // Mouse/Pointer Fallback Drag State
    this.isDragging = false;
    this.previousPointerX = 0;
    this.dragStartRotation = 0;
    this.dragDistance = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    
    // Gesture Slide State
    this.isGestureSliding = false;
    this.gestureSlideTimer = null;

    // Texture caches
    this.albumCanvasTextures = [];
    this.activeView = 'carousel'; // 'carousel' or 'grid'
    this.viewTransitionProgress = 0.0;
    
    // Spotify UI State
    this.activeFilter = 'all';
  }

  // Start the application setup
  init() {
    this.setupThree();
    this.createStarfield();
    this.createCarousel();
    this.setupLights();
    this.bindEvents();
    
    // Run loop
    this.animate();

    // Initialize bottom player HUD with first track
    this.updatePlayingTrackUI(0);

    // Re-draw canvas covers once elegant google fonts finish loading
    document.fonts.ready.then(() => {
      console.log("Artistic Google Fonts loaded. Re-generating album covers...");
      this.albumGroups.forEach((item) => {
        const track = audio.tracks[item.index];
        // Only regenerate if the cover has not been replaced by an online search
        if (this.albumCanvasTextures[item.index] && this.albumCanvasTextures[item.index].isProcedural) {
          const texture = this.generateAlbumTexture(item.index, track);
          
          item.sleeve.material[4].map = texture;
          item.sleeve.material[4].needsUpdate = true;
          
          const vinylTexture = this.generateVinylTexture(texture);
          item.vinyl.material[1].map = vinylTexture;
          item.vinyl.material[1].needsUpdate = true;
        }
      });
      this.updateHUDTrackDetails(this.focusedIndex);
    });
  }

  // Initialize Three.js WebGL Renderer, Scene, Camera
  setupThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04020d, 0.05);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    // Camera is positioned back looking down at the center of the carousel
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.updateBackgroundAndFog();
  }

  // Update background clear color and fog color based on brightness setting
  updateBackgroundAndFog() {
    // Base color 0x04020d multiplied by brightness multiplier
    const baseColor = new THREE.Color(0x04020d);
    baseColor.multiplyScalar(this.bgBrightnessSetting);

    if (this.renderer) {
      this.renderer.setClearColor(baseColor, 1);
    }
    if (this.scene && this.scene.fog) {
      this.scene.fog.color.copy(baseColor);
    }
  }

  // Re-generate the starfield when particle count changes
  recreateStarfield() {
    if (this.starfield) {
      this.scene.remove(this.starfield);
      if (this.starfield.geometry) this.starfield.geometry.dispose();
      if (this.starfield.material) this.starfield.material.dispose();
    }
    this.createStarfield();
  }

  // Setup dynamic lighting for glassmorphic shading
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambientLight);

    // Dynamic key light pointing down onto focused album area
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // Direct cyan spot light highlight
    const spotLight = new THREE.SpotLight(0xffffff, 4.0, 15, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 4, 6);
    spotLight.target.position.set(0, 0, 0);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
  }

  // Procedural Glowing Starfield Generator
  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starsCount * 3);
    const colors = new Float32Array(this.starsCount * 3);
    const sizes = new Float32Array(this.starsCount);

    this.starPositions = new Float32Array(this.starsCount * 3);

    for (let i = 0; i < this.starsCount; i++) {
      // Random coordinates distributed in a shell around the viewer
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 8 + Math.random() * 12; // Outer boundaries
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) - 2; // Offset slightly behind the carousel

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.starPositions[i * 3] = x;
      this.starPositions[i * 3 + 1] = y;
      this.starPositions[i * 3 + 2] = z;

      // Color mapping: Cyan, Purple, White mixes
      const randColor = Math.random();
      if (randColor < 0.35) {
        // Cyan
        colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.0;
      } else if (randColor < 0.7) {
        // Soft Purple
        colors[i * 3] = 0.74; colors[i * 3 + 1] = 0.0; colors[i * 3 + 2] = 1.0;
      } else {
        // Starry White
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
      }

      sizes[i] = 0.05 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circular glow texture
    const starTexture = this.generateStarTexture();

    const material = new THREE.PointsMaterial({
      size: 0.15,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      opacity: 0.8
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  // Create radial alpha texture for soft circular stars
  generateStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(230, 248, 255, 0.8)');
    grad.addColorStop(0.6, 'rgba(189, 0, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }

  // Procedural Canvas Album Cover Generator
  generateAlbumTexture(index, track) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    
    // Different procedural art styles for each index position
    const styles = [
      () => { // Style 0: Multi-colored text rows
        ctx.fillStyle = '#08080a';
        ctx.fillRect(0, 0, 512, 512);
        const colors = ['#e62e2d', '#ea7f2c', '#ebd035', '#4fa93d', '#2b78bc', '#8d2db0'];
        ctx.textAlign = 'center';
        ctx.font = '800 34px Plus Jakarta Sans';
        for (let row = 0; row < 6; row++) {
          ctx.fillStyle = colors[row];
          ctx.fillText(track.album || track.name, 256, 120 + row * 60);
        }
      },
      () => { // Style 1: Bold orange
        ctx.fillStyle = '#df6524';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#ffffff';
        ctx.font = '500 30px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(track.album || track.name, 256, 240);
      },
      () => { // Style 2: Deep red with gold frame
        ctx.fillStyle = '#8a0f1d';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#c5a059';
        ctx.lineWidth = 14;
        ctx.strokeRect(80, 80, 352, 352);
        ctx.fillStyle = '#532c1c';
        ctx.fillRect(120, 120, 272, 272);
        ctx.fillStyle = '#c5a059';
        ctx.beginPath();
        ctx.arc(256, 256, 70, 0, Math.PI * 2);
        ctx.fill();
      },
      () => { // Style 3: Polaroid
        ctx.fillStyle = '#e5e5e2';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#1c1b1f';
        ctx.fillRect(60, 60, 392, 310);
        ctx.fillStyle = '#413e45';
        ctx.fillRect(80, 80, 352, 270);
        ctx.fillStyle = '#222225';
        ctx.font = '600 16px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(track.album || track.name, 256, 425);
      },
      () => { // Style 4: Black with metallic shapes
        ctx.fillStyle = '#060608';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#8f949a';
        ctx.beginPath();
        ctx.arc(200, 240, 75, -Math.PI/2, Math.PI/2, true);
        ctx.fill();
        ctx.fillStyle = '#bfa163';
        ctx.beginPath();
        ctx.arc(312, 240, 75, -Math.PI/2, Math.PI/2, false);
        ctx.fill();
        ctx.fillStyle = '#101014';
        ctx.fillRect(165, 185, 65, 45);
        ctx.fillRect(282, 185, 65, 45);
      },
      () => { // Style 5: White minimalist
        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#1e241e';
        ctx.fillRect(90, 70, 332, 330);
        ctx.fillStyle = '#4c874a';
        ctx.beginPath();
        ctx.arc(256, 210, 65, 0, Math.PI, true);
        ctx.fill();
        ctx.fillStyle = '#dca68c';
        ctx.fillRect(216, 210, 80, 90);
        ctx.fillStyle = '#060608';
        ctx.font = '800 44px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(track.album || track.name, 256, 460);
      },
      () => { // Style 6: Dark nebula gradient
        grad.addColorStop(0, '#040d2b');
        grad.addColorStop(0.5, '#121f4e');
        grad.addColorStop(1, '#661554');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = 'rgba(212, 178, 111, 0.15)';
        ctx.beginPath(); ctx.arc(140, 140, 170, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath(); ctx.arc(360, 330, 210, 0, Math.PI * 2); ctx.fill();
      }
    ];
    
    // Apply the style for this index (wrap around if index > styles count)
    const styleIndex = index % styles.length;
    styles[styleIndex]();

    // Outer Edge Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 512, 512);

    // Title / Artist Overlay tags
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '700 28px Plus Jakarta Sans';
    ctx.textAlign = 'left';
    ctx.fillText(track.name, 36, 435);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 13px Plus Jakarta Sans';
    ctx.fillText(track.artist, 38, 465);
    ctx.fillText(track.album || ("ALBUM 0" + (index + 1)), 38, 56);

    const texture = new THREE.CanvasTexture(canvas);
    this.albumCanvasTextures[index] = {
      texture: texture,
      dataUrl: canvas.toDataURL(),
      isProcedural: true
    };
    
    return texture;
  }

  // Attempt to load custom image, falling back to procedural textures
  loadAlbumTexture(index, track) {
    if (this.albumCanvasTextures[index] && this.albumCanvasTextures[index].texture) {
      return this.albumCanvasTextures[index].texture;
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    
    // If track has a pre-defined artwork URL (from iTunes search/library additions)
    if (track.artworkUrl) {
      const fallbackTexture = this.generateAlbumTexture(index, track);
      
      textureLoader.load(
        track.artworkUrl,
        (loadedTexture) => {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          this.applyCustomTexture(index, loadedTexture);
        },
        undefined,
        () => {
          console.warn("Failed to load track.artworkUrl, keeping procedural fallback");
        }
      );
      
      return fallbackTexture;
    }
    
    // Otherwise load from local assets or procedural fallback
    const fallbackTexture = this.generateAlbumTexture(index, track);
    const fileName = `assets/album${index + 1}`;
    
    // Attempt to load JPEG format
    textureLoader.load(
      `${fileName}.jpg`,
      (loadedTexture) => {
        console.log(`Loaded custom cover: ${fileName}.jpg`);
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        this.applyCustomTexture(index, loadedTexture);
      },
      undefined,
      () => {
        // Fallback to PNG if JPEG is not found
        textureLoader.load(
          `${fileName}.png`,
          (loadedTexturePng) => {
            console.log(`Loaded custom cover: ${fileName}.png`);
            loadedTexturePng.colorSpace = THREE.SRGBColorSpace;
            this.applyCustomTexture(index, loadedTexturePng);
          },
          undefined,
          () => {
            // Quietly retain procedural canvas if no custom file exists
            console.log(`Using procedural fallback for album ${index + 1}`);
          }
        );
      }
    );

    return fallbackTexture;
  }

  // Applies loaded custom texture to sleeve, vinyl label, and HUD data url cache
  applyCustomTexture(index, loadedTexture) {
    // Safety initialization and cache update to store the loaded Three.js texture
    if (!this.albumCanvasTextures[index]) {
      this.albumCanvasTextures[index] = {};
    }
    this.albumCanvasTextures[index].texture = loadedTexture;

    const item = this.albumGroups[index];
    if (item) {
      // Sleeve front material (index 4)
      item.sleeve.material[4].map = loadedTexture;
      item.sleeve.material[4].needsUpdate = true;
      
      // Vinyl label material (index 1)
      const labelTexture = this.generateVinylTexture(loadedTexture);
      item.vinyl.material[1].map = labelTexture;
      item.vinyl.material[1].needsUpdate = true;
    }
    
    // Generate dataUrl from loaded image element for the HUD player console
    const img = loadedTexture.image;
    if (img) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, 256, 256);
        this.albumCanvasTextures[index].dataUrl = tempCanvas.toDataURL();
      } catch (e) {
        console.warn("Failed to generate dataURL for custom texture:", e);
        const track = audio.tracks[index];
        if (track && track.artworkUrl) {
          this.albumCanvasTextures[index].dataUrl = track.artworkUrl;
        }
      }
      this.albumCanvasTextures[index].isProcedural = false;
      
      // Re-trigger preview update if this is the active album
      if (index === this.focusedIndex) {
        this.updateHUDTrackDetails(index);
      }
      
      // Refresh the sidebar list UI to show the newly loaded cover art thumbnail!
      this.updateLibraryListUI();
    }
  }

  // Handle selection of a searched song from iTunes API
  selectSearchTrack(track) {
    const focusedIdx = this.focusedIndex;
    
    // Update local track data in library at the focused index
    if (focusedIdx >= 0 && focusedIdx < audio.tracks.length) {
      audio.tracks[focusedIdx].name = track.name;
      audio.tracks[focusedIdx].artist = track.artist;
      audio.tracks[focusedIdx].previewUrl = track.previewUrl;
      audio.tracks[focusedIdx].artworkUrl = track.artworkUrl;
      
      // Update focused detail banner with the new track information
      this.updateHUDTrackDetails(focusedIdx);
    }
    
    // Load cover texture onto 3D card front and vinyl label dynamically
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    
    textureLoader.load(
      track.artworkUrl,
      (loadedTexture) => {
        console.log("Loaded searched track artwork successfully:", track.artworkUrl);
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        
        // Apply directly to the current active group's sleeve front face (index 4)
        const item = this.albumGroups[focusedIdx];
        if (item) {
          item.sleeve.material[4].map = loadedTexture;
          item.sleeve.material[4].needsUpdate = true;
          
          // Also update vinyl label map (index 1)
          const newVinylTexture = this.generateVinylTexture(loadedTexture);
          item.vinyl.material[1].map = newVinylTexture;
          item.vinyl.material[1].needsUpdate = true;
        }
        
        // Cache the search results artwork so it stays when scrolling away and back
        this.albumCanvasTextures[focusedIdx] = {
          texture: loadedTexture,
          dataUrl: track.artworkUrl,
          isProcedural: false
        };
        
        // Update track details in the bottom player preview art
        const previewArt = document.getElementById('player-art-preview');
        if (previewArt) {
          previewArt.style.backgroundImage = `url(${track.artworkUrl})`;
        }
      },
      undefined,
      (err) => {
        console.error("Failed to load searched track cover:", err);
      }
    );
  }

  // Construct the Curved Carousel (Sleeves & Records)
  createCarousel() {
    const sleeveGeometry = new THREE.BoxGeometry(ALBUM_WIDTH, ALBUM_HEIGHT, 0.08);
    const vinylGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.018, 48);

    for (let i = 0; i < NUM_ALBUMS; i++) {
      const track = audio.tracks[i];
      const texture = this.loadAlbumTexture(i, track);

      // Create Album Group
      const albumGroup = new THREE.Group();
      
      // Sleeve Materials: Glassmorphic reflection on backing sides
      const coverMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.15,
        metalness: 0.2
      });
      const backMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0a0816,
        roughness: 0.1,
        transmission: 0.7,
        thickness: 0.2,
        clearcoat: 1.0
      });
      const glassEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0x221e38 });
      
      // Assign front face cover texture and glass backs
      const sleeveMaterials = [
        glassEdgeMaterial, // Right
        glassEdgeMaterial, // Left
        glassEdgeMaterial, // Top
        glassEdgeMaterial, // Bottom
        coverMaterial,     // Front
        backMaterial       // Back
      ];

      const sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterials);
      sleeve.castShadow = true;
      sleeve.receiveShadow = true;
      albumGroup.add(sleeve);

      // Vinyl Record Mesh
      const vinylTexture = this.generateVinylTexture(texture);
      const vinylLabelMat = new THREE.MeshStandardMaterial({ map: vinylTexture, roughness: 0.3 });
      const recordGroovesMat = new THREE.MeshStandardMaterial({
        color: 0x121016,
        roughness: 0.45,
        metalness: 0.7,
        bumpMap: this.generateGrooveBumpMap(),
        bumpScale: 0.005
      });
      
      const vinylMaterials = [
        recordGroovesMat, // Cylinder side
        vinylLabelMat,    // Top label
        recordGroovesMat  // Bottom label
      ];

      const vinyl = new THREE.Mesh(vinylGeometry, vinylMaterials);
      vinyl.rotation.x = Math.PI / 2; // Flat circle face forward
      vinyl.position.set(0, 0, -0.01); // Positioned inside/behind sleeve
      albumGroup.add(vinyl);

      // Cache elements
      this.scene.add(albumGroup);
      this.albumGroups.push({
        group: albumGroup,
        sleeve: sleeve,
        vinyl: vinyl,
        index: i
      });
    }

    // Set initial active card display
    this.updateHUDTrackDetails(0);
    this.updateLibraryListUI();
  }

  // Generates concentric grooves for Vinyl bump map
  generateGrooveBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#808080'; // Neutral bump gray
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let r = 25; r < 120; r += 2) {
      ctx.beginPath();
      ctx.arc(128, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  // Generates copy of cover art mapped onto vinyl label
  generateVinylTexture(coverTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Standard vinyl color rings
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw cropped center of album art
    if (coverTexture.image) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(128, 128, 50, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(coverTexture.image, 0, 0, 256, 256);
      ctx.restore();
    }
    
    // Draw spindle hole center
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(128, 128, 10, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
  }

  // Event bindings
  bindEvents() {
    window.addEventListener('resize', () => this.onWindowResize());
    
    // 3D Raycast click listeners (mouse pinch fallback)
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    
    // Scroll Wheel rotation
    this.canvas.addEventListener('wheel', (e) => {
      this.rotationVelocity += e.deltaY * 0.0015;
    }, { passive: true });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        this.rotateCarousel(1); // Shift right
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.rotateCarousel(-1); // Shift left
      } else if (e.key === ' ' || e.key === 'Enter') {
        audio.togglePlay();
      } else if (e.key === 'Escape') {
        this.deselectFocusedAlbum();
      }
    });

    // Onboarding Panel buttons
    document.getElementById('btn-start').addEventListener('click', () => this.startExperience(true));
    document.getElementById('btn-start-no-cam').addEventListener('click', () => this.startExperience(false));

    // HUD controls buttons
    document.getElementById('btn-play').addEventListener('click', () => audio.togglePlay());
    document.getElementById('btn-next').addEventListener('click', () => this.rotateCarousel(1));
    document.getElementById('btn-prev').addEventListener('click', () => this.rotateCarousel(-1));
    
    // View Toggle button Action
    const viewToggle = document.getElementById('btn-toggle-view');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        this.activeView = this.activeView === 'carousel' ? 'grid' : 'carousel';
        const textSpan = document.getElementById('view-toggle-text');
        if (textSpan) {
          textSpan.textContent = this.activeView === 'carousel' ? 'Grid View' : 'Carousel View';
        }
      });
    }
    
    document.getElementById('volume-slider').addEventListener('input', (e) => {
      audio.setVolume(e.target.value);
    });

    // Progress bar click to seek
    const progressWrap = document.getElementById('progress-bar-wrap');
    if (progressWrap) {
      progressWrap.addEventListener('click', (e) => {
        const rect = progressWrap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        audio.seek(percent);
      });
    }

    // Source Selector Toggles
    const uploadInput = document.getElementById('audio-upload');

    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.addSongToLibrary(file.name, "Uploaded Local Track", null, null, file);
      }
    });

    // Webcam Mini-Preview Toggle button
    document.getElementById('btn-toggle-cam').addEventListener('click', () => {
      if (gestures.isCameraActive) {
        gestures.stopCamera();
      } else {
        gestures.startCamera().catch(() => {});
      }
    });

    // Settings Panel Toggle
    const settingsPanel = document.getElementById('settings-panel');
    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    if (btnToggleSettings && settingsPanel) {
      btnToggleSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('collapsed');
      });
      document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsPanel.classList.contains('collapsed')) {
          settingsPanel.classList.add('collapsed');
        }
      });
    }

    // Settings Controls
    const sliderStars = document.getElementById('setting-stars');
    const valStars = document.getElementById('stars-val');
    if (sliderStars && valStars) {
      sliderStars.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valStars.textContent = val;
        this.starsCount = val;
        this.recreateStarfield();
      });
    }

    const sliderBrightness = document.getElementById('setting-brightness');
    const valBrightness = document.getElementById('brightness-val');
    if (sliderBrightness && valBrightness) {
      sliderBrightness.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valBrightness.textContent = val + '%';
        this.bgBrightnessSetting = val / 20.0;
        this.updateBackgroundAndFog();
      });
    }

    const sliderSpeed = document.getElementById('setting-speed');
    const valSpeed = document.getElementById('speed-val');
    if (sliderSpeed && valSpeed) {
      sliderSpeed.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valSpeed.textContent = (val / 100.0).toFixed(1) + 'x';
        this.particleSpeedSetting = val / 100.0;
      });
    }

    // Song Search Input and Dropdown Bindings
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchDebounceTimeout = null;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      clearTimeout(searchDebounceTimeout);

      if (!query || query.trim() === '') {
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
        return;
      }

      // Debounce requests (300ms) to prevent hitting iTunes rate limits
      searchDebounceTimeout = setTimeout(async () => {
        searchResults.classList.remove('hidden');
        searchResults.innerHTML = '<div class="search-status-message">Searching cosmos...</div>';

        const results = await audio.searchiTunes(query);

        if (results.length === 0) {
          searchResults.innerHTML = '<div class="search-status-message">No songs found in this quadrant</div>';
          return;
        }

        searchResults.innerHTML = '';
        results.forEach(track => {
          const item = document.createElement('div');
          item.className = 'search-result-item';
          item.innerHTML = `
            <div class="search-result-art" style="background-image: url(${track.artworkUrl})"></div>
            <div class="search-result-details">
              <span class="search-result-title">${track.name}</span>
              <span class="search-result-artist">${track.artist}</span>
            </div>
            <button class="search-result-add-btn" title="Add to Library">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          `;

          // Click on the main item details -> play it immediately on the focused slot
          item.addEventListener('click', (e) => {
            if (e.target.closest('.search-result-add-btn')) return;
            
            this.selectSearchTrack(track);
            searchResults.classList.add('hidden');
            searchInput.value = '';
            this.isZoomed = true;
            this.triggerStarburstWarp();
          });

          // Click on the "+" button -> add it to library
          const addBtn = item.querySelector('.search-result-add-btn');
          addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addSongToLibrary(track.name, track.artist, track.artworkUrl, track.previewUrl);
            searchResults.classList.add('hidden');
            searchInput.value = '';
          });

          searchResults.appendChild(item);
        });
      }, 300);
    });

    // Hide search drop-down when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });

    // Keyboard shortcut: Press "/" to focus search input (if not already focused)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Spotify Sidebar Toggles and Grid Resizing
    const hud = document.getElementById('hud');
    const btnToggleLib = document.getElementById('btn-toggle-library');
    const btnCloseLib = document.getElementById('btn-close-library');
    
    if (btnToggleLib) {
      btnToggleLib.addEventListener('click', () => {
        hud.classList.toggle('sidebar-collapsed');
        // Re-calculate renderer/camera bounds after transition completes
        setTimeout(() => this.onWindowResize(), 310);
      });
    }
    
    if (btnCloseLib) {
      btnCloseLib.addEventListener('click', () => {
        hud.classList.add('sidebar-collapsed');
        setTimeout(() => this.onWindowResize(), 310);
      });
    }

        // Add Custom Song Panel Show/Hide
    const btnAddSong = document.getElementById('btn-add-song');
    const btnCancelAdd = document.getElementById('btn-cancel-add');
    const addSongContainer = document.getElementById('add-song-container');
    
    if (btnAddSong && addSongContainer) {
      btnAddSong.addEventListener('click', () => {
        addSongContainer.classList.toggle('hidden');
      });
    }
    
    if (btnCancelAdd && addSongContainer) {
      btnCancelAdd.addEventListener('click', () => {
        addSongContainer.classList.add('hidden');
      });
    }

    // Panel Mode Selection Toggles
    const btnModeSearch = document.getElementById('btn-mode-search');
    const btnModeManual = document.getElementById('btn-mode-manual');
    const modeSearchContainer = document.getElementById('mode-search-container');
    const modeManualContainer = document.getElementById('mode-manual-container');

    if (btnModeSearch && btnModeManual && modeSearchContainer && modeManualContainer) {
      btnModeSearch.addEventListener('click', () => {
        btnModeSearch.classList.add('active');
        btnModeManual.classList.remove('active');
        modeSearchContainer.classList.remove('hidden');
        modeManualContainer.classList.add('hidden');
      });

      btnModeManual.addEventListener('click', () => {
        btnModeManual.classList.add('active');
        btnModeSearch.classList.remove('active');
        modeManualContainer.classList.remove('hidden');
        modeSearchContainer.classList.add('hidden');
      });
    }

    // Sidebar Song Search Input Binding
    const sidebarSearchInput = document.getElementById('sidebar-song-search');
    const sidebarSearchResults = document.getElementById('sidebar-search-results');
    let sidebarSearchDebounce = null;

    if (sidebarSearchInput && sidebarSearchResults) {
      sidebarSearchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(sidebarSearchDebounce);

        if (!query || query.trim() === '') {
          sidebarSearchResults.innerHTML = '';
          return;
        }

        // Debounce search requests (300ms)
        sidebarSearchDebounce = setTimeout(async () => {
          sidebarSearchResults.innerHTML = '<div class="search-status-message">Searching cosmos...</div>';
          const results = await audio.searchiTunes(query);

          if (results.length === 0) {
            sidebarSearchResults.innerHTML = '<div class="search-status-message">No songs found</div>';
            return;
          }

          sidebarSearchResults.innerHTML = '';
          results.forEach(track => {
            const item = document.createElement('div');
            item.className = 'sidebar-search-result-item';
            item.innerHTML = `
              <div class="result-art" style="background-image: url(${track.artworkUrl})"></div>
              <div class="result-details">
                <span class="result-title">${track.name}</span>
                <span class="result-artist">${track.artist}</span>
              </div>
              <button class="result-add-btn" title="Add to Library">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
            `;

            // Click result body -> preview play immediately on active slot
            item.addEventListener('click', (e) => {
              if (e.target.closest('.result-add-btn')) return;
              this.selectSearchTrack(track);
              this.isZoomed = true;
              this.triggerStarburstWarp();
            });

            // Click "+" button -> add song to gallery
            const addBtn = item.querySelector('.result-add-btn');
            addBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.addSongToLibrary(track.name, track.artist, track.artworkUrl, track.previewUrl);
              sidebarSearchInput.value = '';
              sidebarSearchResults.innerHTML = '';
              if (addSongContainer) {
                addSongContainer.classList.add('hidden');
              }
            });

            sidebarSearchResults.appendChild(item);
          });
        }, 300);
      });
    }

    // Filter Chips Events
    const chips = document.querySelectorAll('.filter-chips .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.getAttribute('data-filter');
        this.updateLibraryListUI();
      });
    });

    // Banner Play/Pause Action
    const bannerPlay = document.getElementById('btn-banner-play');
    if (bannerPlay) {
      bannerPlay.addEventListener('click', () => {
        if (audio.currentTrackIndex !== this.focusedIndex) {
          this.updatePlayingTrackUI(this.focusedIndex);
          audio.play();
        } else {
          audio.togglePlay();
        }
      });
    }

    // Add Custom Song Form Submission
    const addSongForm = document.getElementById('add-song-form');
    addSongForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('custom-song-title');
      const artistInput = document.getElementById('custom-song-artist');
      
      const title = titleInput.value.trim();
      const artist = artistInput.value.trim();
      
      if (title && artist) {
        this.addSongToLibrary(title, artist);
        titleInput.value = '';
        artistInput.value = '';
      }
    });
    
    // Bind Gesture System callbacks
    gestures.onSwipeCallback = (vx) => this.handleGestureSwipe(vx);
    gestures.onPinchCallback = (isPinching, pos) => this.handleGesturePinch(isPinching, pos);
    gestures.onFistCallback = () => this.handleGestureFist();
    gestures.onSlideCallback = (dx, isFast) => this.handleGestureSlide(dx, isFast);
    gestures.onFistHoldStillCallback = () => this.handleGestureFistHoldStill();
    gestures.onOpenHandCallback = () => this.handleGestureOpenHand();
    gestures.onFistHoldProgressCallback = (progress) => this.handleFistHoldProgress(progress);
  }

  // Handle window resizing
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- MOUSE RAYCASTING & INERTIAL ROTATION ---
  onPointerDown(e) {
    this.isDragging = true;
    this.previousPointerX = e.clientX;
    this.dragStartRotation = this.targetRotation;
    this.dragDistance = 0;
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.previousPointerX;
    this.dragDistance += Math.abs(deltaX);
    
    // Move target rotation immediately based on drag distance (moving mouse left scrolls right)
    const dragSensitivity = 0.0055;
    this.targetRotation = this.targetRotation - deltaX * dragSensitivity;
    
    // Keep track of velocity for flinging on release
    this.rotationVelocity = -deltaX * dragSensitivity;
    
    this.previousPointerX = e.clientX;
  }

  onPointerUp(e) {
    this.isDragging = false;
    
    // If the click was clean without dragging, Raycast to select
    if (this.dragDistance < 6) {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      this.raycaster.setFromCamera(this.pointer, this.camera);
      
      // Intersect with sleeves
      const targets = this.albumGroups.map(item => item.sleeve);
      const intersects = this.raycaster.intersectObjects(targets);
      
      if (intersects.length > 0) {
        const clickedSleeve = intersects[0].object;
        const clickedItem = this.albumGroups.find(item => item.sleeve === clickedSleeve);
        
        if (clickedItem) {
          if (this.activeView === 'grid') {
            // In grid view, click instantly focuses and zooms the clicked album
            this.focusAlbumIndex(clickedItem.index);
            this.isZoomed = true;
            this.triggerStarburstWarp();
          } else {
            // If clicked album is already focused, toggle selection zoom
            if (clickedItem.index === this.focusedIndex) {
              this.toggleZoomFocusedAlbum();
            } else {
              // Otherwise rotate carousel to focus it
              this.focusAlbumIndex(clickedItem.index);
            }
          }
        }
      }
    }
  }

  // Rotate Carousel by steps
  rotateCarousel(direction) {
    if (this.isZoomed) this.deselectFocusedAlbum();
    
    // Increment or decrement scroll target index
    this.targetRotation = Math.round(this.targetRotation) + direction;
  }

  focusAlbumIndex(index, warp = false) {
    if (this.isZoomed) this.deselectFocusedAlbum();
    
    // Rotate to the nearest congruent copy of index modulo NUM_ALBUMS
    let diff = index - (this.targetRotation % NUM_ALBUMS);
    const half = NUM_ALBUMS / 2;
    diff = ((diff + half) % NUM_ALBUMS + NUM_ALBUMS) % NUM_ALBUMS - half;
    this.targetRotation = this.targetRotation + diff;
    
    if (warp) {
      this.currentRotation = this.targetRotation;
    }
    
    this.focusedIndex = index;
    this.updateHUDTrackDetails(this.focusedIndex);
  }

  // Toggle Zoom mode
  toggleZoomFocusedAlbum() {
    this.isZoomed = !this.isZoomed;
    
    if (this.isZoomed) {
      this.triggerStarburstWarp();
      // Don't auto-play; user controls playback via fist hold 3s or play button
    }
  }

  deselectFocusedAlbum() {
    this.isZoomed = false;
  }

  // Trigger temporary star explosion burst when zooming album
  triggerStarburstWarp() {
    this.warpActive = true;
    this.warpFactor = 1.0;
  }

  // Update bottom player HUD and select active track in the audio engine when a song actually starts playing
  updatePlayingTrackUI(index) {
    if (index < 0 || index >= NUM_ALBUMS) return;
    
    // Select track in audio engine (which updates bottom HUD title/artist/duration)
    audio.selectTrack(index);
    
    // Update bottom player overlay mini cover preview artwork
    const previewArt = document.getElementById('player-art-preview');
    if (previewArt) {
      const track = audio.tracks[index];
      let artUrl = '';
      if (this.albumCanvasTextures[index] && this.albumCanvasTextures[index].dataUrl) {
        artUrl = this.albumCanvasTextures[index].dataUrl;
      } else if (track && track.artworkUrl) {
        artUrl = track.artworkUrl;
      }
      if (artUrl) {
        previewArt.style.backgroundImage = `url(${artUrl})`;
      }
    }
  }

  // Update dynamic album artist details on the Spotify detail banner (focused album)
  updateHUDTrackDetails(index) {
    if (index < 0 || index >= NUM_ALBUMS) return;
    
    const track = audio.tracks[index];

    // Update Spotify detail banner text and images!
    const bannerArt = document.getElementById('banner-art-preview');
    const bannerTitle = document.getElementById('banner-title-text');
    const bannerArtist = document.getElementById('banner-artist-text');
    const bannerDuration = document.getElementById('banner-duration-text');
    
    if (bannerArt && this.albumCanvasTextures[index]) {
      bannerArt.style.backgroundImage = `url(${this.albumCanvasTextures[index].dataUrl})`;
    }
    if (bannerTitle) bannerTitle.textContent = track.name;
    if (bannerArtist) bannerArtist.textContent = track.artist;
    if (bannerDuration) bannerDuration.textContent = track.duration;
    
    // Highlight the active sidebar song item
    this.updateLibraryHighlight(index);
  }

  // --- MEDIAPIPE GESTURE HANDLERS ---
  
  handleGestureSwipe(vx) {
    // Apply velocity impulse directly to scroll velocity
    this.rotationVelocity += vx * 0.45;
  }

  handleGesturePinch(isPinching, pos) {
    // Triggers Zoom state when pinch detected on centered item
    if (isPinching && !this.isZoomed) {
      this.isZoomed = true;
      this.triggerStarburstWarp();
      // Don't auto-play; user controls playback via fist hold 3s or play button
    } else if (!isPinching && this.isZoomed) {
      this.isZoomed = false;
    }
  }

  handleGestureFist() {
    // Fist triggers Zoom in of current focused album card
    if (!this.isZoomed) {
      this.isZoomed = true;
      this.triggerStarburstWarp();
    }
  }

  handleGestureFistHoldStill() {
    // Fist held still for 2s triggers music play
    this.updatePlayingTrackUI(this.focusedIndex);
    audio.play();
  }

  handleGestureSlide(dx, isFast) {
    // Enters slide state and views different albums by shifting targetRotation
    if (this.isZoomed) {
      this.deselectFocusedAlbum();
    }
    
    // Mark gesture as actively sliding - this suppresses snap-to-grid physics
    this.isGestureSliding = true;
    clearTimeout(this.gestureSlideTimer);
    this.gestureSlideTimer = setTimeout(() => {
      this.isGestureSliding = false;
    }, 300); // Resume snapping 300ms after last gesture input
    
    // Use velocity-based approach for smoother momentum and natural feel
    const speedMultiplier = isFast ? 15.0 : 5.0;
    this.rotationVelocity += dx * speedMultiplier * 0.15;
    
    // Also apply direct position shift for immediate responsiveness
    this.targetRotation += dx * speedMultiplier * 0.5;
    
    // Smooth out target rotation calculations (removed clamp for infinite loop)
  }

  handleGestureOpenHand() {
    // Open hand returns to gallery overview if currently playing and zoomed-in
    if (audio.isPlaying && this.isZoomed) {
      this.deselectFocusedAlbum();
    }
  }

  handleFistHoldProgress(progress) {
    const loader = document.getElementById('fist-loader');
    const ringCircle = loader ? loader.querySelector('.progress-ring__circle') : null;
    
    if (!loader || !ringCircle) return;
    
    if (progress > 0) {
      loader.classList.add('visible');
      // SVG circumference is 263.89 (r=42)
      const offset = 263.89 * (1 - progress);
      ringCircle.style.strokeDashoffset = offset;
    } else {
      loader.classList.remove('visible');
      ringCircle.style.strokeDashoffset = 263.89;
    }
  }

  // Onboarding Start Click Action
  startExperience(enableWebcam) {
    // Audio Context initialization
    audio.init();
    
    const onboarding = document.getElementById('onboarding');
    onboarding.classList.add('fade-out');
    
    setTimeout(() => {
      onboarding.classList.add('hidden');
    }, 500);

    // Webcam permission and stream trigger
    if (enableWebcam) {
      const webcamElement = document.getElementById('webcam');
      const overlayElement = document.getElementById('gesture-overlay');
      
      gestures.init(webcamElement, overlayElement);
      gestures.startCamera().catch(err => {
        console.warn("Webcam activation was bypassed:", err);
      });
    } else {
      document.getElementById('mp-status').innerHTML = `<span class="dot red"></span><span class="status-text">OFFLINE / MOUSE MODE</span>`;
    }
    
    // Load real iTunes preview URLs and artwork for default tracks
    audio.loadDefaultTrackData((index, track) => {
      // When iTunes data arrives for a track, load and apply the real artwork texture
      if (track.artworkUrl && index < this.albumGroups.length) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        textureLoader.load(
          track.artworkUrl,
          (loadedTexture) => {
            loadedTexture.colorSpace = THREE.SRGBColorSpace;
            this.applyCustomTexture(index, loadedTexture);
            console.log(`Applied iTunes artwork for track ${index}: ${track.name}`);
          },
          undefined,
          () => {
            console.warn(`Failed to load artwork for track ${index}: ${track.name}`);
          }
        );
      }
    });
  }

  // --- ANIMATION LOOP & PHYSICS UPDATES ---
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    
    // 1. Fetch live audio analysis parameters
    const audioData = audio.getAnalysisData();

    // Update view transition progress (carousel vs grid)
    const targetViewProgress = this.activeView === 'grid' ? 1.0 : 0.0;
    this.viewTransitionProgress += (targetViewProgress - this.viewTransitionProgress) * 0.1;

    // 2. Carousel snap and rotational damping physics (Spring Lerp)
    if (!this.isDragging) {
      // Add velocity damping friction
      this.rotationVelocity *= 0.85;
      this.targetRotation += this.rotationVelocity;
      
      // Calculate target step snaps when speed is extremely slow
      // BUT skip snapping while gesture is actively sliding (prevents fighting)
      if (Math.abs(this.rotationVelocity) < 0.01 && !this.isGestureSliding) {
        const snapped = Math.round(this.targetRotation);
        this.targetRotation += (snapped - this.targetRotation) * 0.18;
      }
    }
    
    // Smoothly interpolate current scroll position towards the target scroll position
    this.currentRotation += (this.targetRotation - this.currentRotation) * 0.18;

    // 3. Update Focused Index tracking (wrapped using modulo for infinite scroll)
    const activeIndex = ((Math.round(this.currentRotation) % NUM_ALBUMS) + NUM_ALBUMS) % NUM_ALBUMS;
    if (activeIndex !== this.focusedIndex && activeIndex >= 0 && activeIndex < NUM_ALBUMS) {
      this.focusedIndex = activeIndex;
      this.updateHUDTrackDetails(this.focusedIndex);
    }

    // 4. Zoom Lerp progress interpolations
    const targetZoom = this.isZoomed ? 1.0 : 0.0;
    this.zoomProgress += (targetZoom - this.zoomProgress) * 0.1;

    // 5. Update individual Album positions, rotations, sleeves, and vinyl offsets
    this.albumGroups.forEach((item) => {
      // Offset distance from scroll index wrapping infinitely
      let d = item.index - this.currentRotation;
      const half = NUM_ALBUMS / 2;
      d = ((d + half) % NUM_ALBUMS + NUM_ALBUMS) % NUM_ALBUMS - half;
      
      const sign = Math.sign(d);
      const absD = Math.abs(d);

      // Cover Flow spacing math
      const spacing = 1.35;
      const spread = 0.9;
      
      // Base positions
      let baseX = d * spacing;
      if (absD > 0.15) {
        baseX += sign * spread * Math.min(1.0, (absD - 0.15) * 1.5);
      }
      
      let baseZ = -Math.min(1.0, absD) * 1.6;
      let baseY = 0;

      const isFocusedItem = item.index === this.focusedIndex;
      
      // Adjust visibility/opacity of elements (fake Depth of Field)
      let targetOpacity = 0.4;
      if (isFocusedItem) {
        targetOpacity = 1.0;
      } else {
        targetOpacity = 0.4 * (1.0 - this.zoomProgress * 0.85); // Fade non-focused items almost completely when zoomed
      }

       // Smooth opacity mapping onto multi-materials
       item.sleeve.material.forEach((mat) => {
         if (mat) {
           mat.transparent = true;
           mat.opacity = targetOpacity;
         }
       });
       item.vinyl.material.forEach((mat) => {
         if (mat) {
           mat.transparent = true;
           mat.opacity = targetOpacity;
         }
       });
 

      // Carousel coordinates
      const carouselX = baseX;
      const carouselY = baseY;
      const carouselZ = baseZ;
      const carouselRotY = -sign * Math.min(1.0, absD) * (Math.PI / 3.2);
      const carouselScale = 1.0 - absD * 0.12;

      // Grid coordinates (4 columns layout with floating flow sensation)
      const COLS = 4;
      const col = item.index % COLS;
      const row = Math.floor(item.index / COLS);
      const ROWS = Math.ceil(NUM_ALBUMS / COLS);
      
      // Floating/breathing movement over time
      const flowTime = time;
      const floatX = Math.sin(flowTime * 0.8 + item.index * 1.5) * 0.12;
      const floatY = Math.cos(flowTime * 0.7 + item.index * 2.0) * 0.12;
      const floatZ = Math.sin(flowTime * 0.5 + item.index * 1.0) * 0.08;
      const floatRotX = Math.sin(flowTime * 0.4 + item.index) * 0.03;
      const floatRotY = Math.cos(flowTime * 0.3 + item.index) * 0.03;
      
      const gridX = (col - (COLS - 1) / 2) * 2.0 + floatX; // slightly increased spacing
      const gridY = -(row - (ROWS - 1) / 2) * 2.2 + floatY; // slightly increased spacing
      const gridZ = (isFocusedItem ? -0.8 : -1.5) + floatZ;
      const gridRotX = floatRotX;
      const gridRotY = floatRotY;
      const gridScale = isFocusedItem ? 0.95 : 0.82; // active item is slightly larger in grid view

      // Smoothly blend layout parameters based on active view transition progress
      let finalX = THREE.MathUtils.lerp(carouselX, gridX, this.viewTransitionProgress);
      let finalY = THREE.MathUtils.lerp(carouselY, gridY, this.viewTransitionProgress);
      let finalZ = THREE.MathUtils.lerp(carouselZ, gridZ, this.viewTransitionProgress);
      let finalRotX = THREE.MathUtils.lerp(0, gridRotX, this.viewTransitionProgress);
      let finalRotY = THREE.MathUtils.lerp(carouselRotY, gridRotY, this.viewTransitionProgress);
      let finalScale = THREE.MathUtils.lerp(carouselScale, gridScale, this.viewTransitionProgress);

      if (isFocusedItem) {
        // Zoom selection shifts card closer to camera, re-centers it, and flattens rotation
        finalZ = THREE.MathUtils.lerp(finalZ, 2.2, this.zoomProgress);
        finalY = THREE.MathUtils.lerp(finalY, 0.15, this.zoomProgress);
        finalScale = THREE.MathUtils.lerp(finalScale, 1.35, this.zoomProgress);
        
        finalX = THREE.MathUtils.lerp(finalX, 0, this.zoomProgress);
        finalRotX = THREE.MathUtils.lerp(finalRotX, 0, this.zoomProgress);
        finalRotY = THREE.MathUtils.lerp(finalRotY, 0, this.zoomProgress);

        // Slide record disc out of the sleeve to the right
        const recordTargetOffset = this.zoomProgress * 1.35;
        item.vinyl.position.x += (recordTargetOffset - item.vinyl.position.x) * 0.1;
        
        // Only make the vinyl visible when it starts sliding out
        item.vinyl.visible = this.zoomProgress > 0.01;
        
        // Spin record when playing
        if (audio.isPlaying && item.vinyl.visible) {
          item.vinyl.rotation.y += VINYL_ROTATION_SPEED * delta;
        }
      } else {
        // Retract record disc inside sleeve for non-focused cards
        item.vinyl.position.x += (0 - item.vinyl.position.x) * 0.1;
        item.vinyl.visible = false;
      }

      item.group.position.set(finalX, finalY, finalZ);
      item.group.scale.set(finalScale, finalScale, finalScale);
      
      // Face card elements based on Cover Flow math
      item.group.rotation.set(finalRotX, finalRotY, 0);
    });

    // 6. Update Starfield wave ripples and twinkles
    if (this.starfield) {
      const positions = this.starfield.geometry.attributes.position.array;
      
      // Adjust general simulation speed based on Fist/Pause state (Slow down by 80%)
      const simulationSpeedMultiplier = audio.isPlaying ? 1.0 : 0.2;
      const speedTime = time * simulationSpeedMultiplier * this.particleSpeedSetting;

      // Particle drift rotation
      this.starfield.rotation.y = time * 0.015 * simulationSpeedMultiplier * this.particleSpeedSetting;
      this.starfield.rotation.x = time * 0.008 * simulationSpeedMultiplier * this.particleSpeedSetting;

      // Warp blast decay mechanics (Pinch zoom radial burst)
      if (this.warpActive) {
        this.warpFactor *= 0.94; // Decay warp burst
        if (this.warpFactor < 0.01) {
          this.warpFactor = 0;
          this.warpActive = false;
        }
      }

      // Apply audio reactive wave ripples on stars
      // Low frequencies (Bass) create wave-like ripples through coordinates
      // High frequencies scale twinkle speeds
      const bassIntensity = audioData.bass;
      const highIntensity = audioData.high;

      // Twinkle size/opacity animations
      this.starfield.material.size = 0.12 + highIntensity * 0.08;
      this.starfield.material.opacity = 0.65 + Math.sin(time * 5.0) * 0.1 * (1.0 + highIntensity);

      for (let i = 0; i < this.starsCount; i++) {
        const origX = this.starPositions[i * 3];
        const origY = this.starPositions[i * 3 + 1];
        const origZ = this.starPositions[i * 3 + 2];

        // Star distance from scene center
        const radialDist = Math.sqrt(origX * origX + origY * origY + origZ * origZ);

        // Ripple offset formula
        const ripple = Math.sin(radialDist * 0.35 - speedTime * 2.5) * 0.45 * bassIntensity;

        // Apply position displacement
        // Push stars outward if pinch warp active
        const warpOffset = 1.0 + (this.warpFactor * (2.0 / (radialDist + 0.1)));
        
        positions[i * 3] = origX * warpOffset;
        positions[i * 3 + 1] = origY * warpOffset + ripple; // Wave ripple on Y axis
        positions[i * 3 + 2] = origZ * warpOffset;
      }
      this.starfield.geometry.attributes.position.needsUpdate = true;
    }

    // 7. Render HUD updates (Progress, time labels, play state toggle buttons)
    this.updateHUDProgressBar();

    // Sync play/pause icons on Spotify Detail Banner (Active only for current playing track)
    const bannerPlay = document.getElementById('btn-banner-play');
    if (bannerPlay) {
      const playIcon = bannerPlay.querySelector('.icon-play-svg');
      const pauseIcon = bannerPlay.querySelector('.icon-pause-svg');
      if (playIcon && pauseIcon) {
        const isFocusedTrackPlaying = audio.isPlaying && (audio.currentTrackIndex === this.focusedIndex);
        if (isFocusedTrackPlaying) {
          playIcon.classList.add('hidden');
          pauseIcon.classList.remove('hidden');
        } else {
          playIcon.classList.remove('hidden');
          pauseIcon.classList.add('hidden');
        }
      }
    }

    // Toggle Spotify detail banner visibility based on zoom progress (hide if active playing to clean view)
    const banner = document.getElementById('track-detail-banner');
    if (banner) {
      if (this.isZoomed && this.zoomProgress > 0.15 && !audio.isPlaying) {
        banner.classList.remove('hidden');
        banner.style.opacity = Math.min(1.0, (this.zoomProgress - 0.15) * 1.18); // smooth fade in
      } else {
        banner.style.opacity = Math.max(0.0, this.zoomProgress / 0.15); // smooth fade out
        if (this.zoomProgress < 0.05 || audio.isPlaying) {
          banner.classList.add('hidden');
        }
      }
    }

    // 8. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  // Updates the timeline, elapsed time, and duration text on player HUD
  updateHUDProgressBar() {
    const currentElem = document.getElementById('current-time');
    const fillElem = document.getElementById('progress-fill');
    
    if (currentElem) {
      currentElem.textContent = audio.getElapsedTimeString();
    }
    if (fillElem) {
      const progress = audio.getProgress(); // float between 0 and 1
      fillElem.style.width = `${progress * 100}%`;
    }
  }

  // Dynamically rebuilds the Three.js Cover Flow cards when a song is added/deleted
  rebuildCarousel() {
    // 1. Remove all old album groups from the scene
    this.albumGroups.forEach(item => {
      this.scene.remove(item.group);
      
      // Clean up WebGL resources to prevent leaks
      item.sleeve.geometry.dispose();
      item.sleeve.material.forEach(mat => { if (mat) mat.dispose(); });
      item.vinyl.geometry.dispose();
      item.vinyl.material.forEach(mat => { if (mat) mat.dispose(); });
    });
    this.albumGroups = [];
    
    // Update global album count variable
    NUM_ALBUMS = audio.tracks.length;
    
    // 2. Re-create sleeves and vinyl records for the new tracklist
    const sleeveGeometry = new THREE.BoxGeometry(ALBUM_WIDTH, ALBUM_HEIGHT, 0.08);
    const vinylGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.018, 48);

    for (let i = 0; i < NUM_ALBUMS; i++) {
      const track = audio.tracks[i];
      const texture = this.loadAlbumTexture(i, track);

      const albumGroup = new THREE.Group();
      
      const coverMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.15,
        metalness: 0.2
      });
      const backMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0a0816,
        roughness: 0.1,
        transmission: 0.7,
        thickness: 0.2,
        clearcoat: 1.0
      });
      const glassEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0x221e38 });
      
      const sleeveMaterials = [
        glassEdgeMaterial, glassEdgeMaterial, glassEdgeMaterial, glassEdgeMaterial,
        coverMaterial, backMaterial
      ];

      const sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterials);
      sleeve.castShadow = true;
      sleeve.receiveShadow = true;
      albumGroup.add(sleeve);

      const vinylTexture = this.generateVinylTexture(texture);
      const vinylLabelMat = new THREE.MeshStandardMaterial({ map: vinylTexture, roughness: 0.3 });
      const recordGroovesMat = new THREE.MeshStandardMaterial({
        color: 0x121016,
        roughness: 0.45,
        metalness: 0.7,
        bumpMap: this.generateGrooveBumpMap(),
        bumpScale: 0.005
      });
      
      const vinylMaterials = [
        recordGroovesMat, vinylLabelMat, recordGroovesMat
      ];

      const vinyl = new THREE.Mesh(vinylGeometry, vinylMaterials);
      vinyl.rotation.x = Math.PI / 2;
      vinyl.position.set(0, 0, -0.01);
      albumGroup.add(vinyl);

      this.scene.add(albumGroup);
      this.albumGroups.push({
        group: albumGroup,
        sleeve: sleeve,
        vinyl: vinyl,
        index: i
      });
    }
    
    // 3. Re-clamp scroll targets (wrapped using modulo for infinite scroll)
    this.targetRotation = ((this.targetRotation % NUM_ALBUMS) + NUM_ALBUMS) % NUM_ALBUMS;
    this.currentRotation = ((this.currentRotation % NUM_ALBUMS) + NUM_ALBUMS) % NUM_ALBUMS;
    this.focusedIndex = ((Math.round(this.currentRotation) % NUM_ALBUMS) + NUM_ALBUMS) % NUM_ALBUMS;
    
    // Re-sync UI overlays
    this.updateHUDTrackDetails(this.focusedIndex);
    this.updateLibraryListUI();
  }

  // Updates list elements inside the Library sidebar
  updateLibraryListUI() {
    const listContainer = document.getElementById('library-song-list');
    const gestureSection = document.getElementById('gesture-guide-section');
    if (!listContainer || !gestureSection) return;
    
    if (this.activeFilter === 'gestures') {
      listContainer.classList.add('hidden');
      gestureSection.classList.remove('hidden');
      return;
    } else {
      listContainer.classList.remove('hidden');
      gestureSection.classList.add('hidden');
    }
    
    listContainer.innerHTML = '';
    
    audio.tracks.forEach((track, index) => {
      // Filter matching
      if (this.activeFilter === 'custom' && !track.isCustom) return;
      if (this.activeFilter === 'online' && !track.previewUrl) return;
      
      const item = document.createElement('div');
      item.className = 'library-song-item';
      item.setAttribute('data-index', index);
      if (index === this.focusedIndex) {
        item.classList.add('active');
      }
      
      // Get cover art URL cache
      let artUrl = '';
      if (this.albumCanvasTextures[index] && this.albumCanvasTextures[index].dataUrl) {
        artUrl = this.albumCanvasTextures[index].dataUrl;
      } else if (track.artworkUrl) {
        artUrl = track.artworkUrl;
      }
      
      item.innerHTML = `
        <div class="library-song-art" style="background-image: url(${artUrl})"></div>
        <div class="library-song-details">
          <span class="library-song-title">${track.name}</span>
          <span class="library-song-artist">${track.artist}</span>
        </div>
        <div class="library-song-actions">
          <button class="library-song-play-btn" title="Play Song">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          </button>
          <button class="library-song-delete-btn" title="Delete Song">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      
      // Click on item -> focuses and zooms
      item.addEventListener('click', (e) => {
        if (e.target.closest('.library-song-delete-btn') || e.target.closest('.library-song-play-btn')) return;
        this.focusAlbumIndex(index, true);
        this.isZoomed = true;
        this.triggerStarburstWarp();
      });
      
      item.querySelector('.library-song-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.focusAlbumIndex(index, true);
        this.updatePlayingTrackUI(index);
        audio.play();
        this.isZoomed = true;
        this.triggerStarburstWarp();
      });
      
      item.querySelector('.library-song-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSongFromLibrary(index);
      });
      
      listContainer.appendChild(item);
    });
  }

  // Updates active library song item highlight in the sidebar
  updateLibraryHighlight(activeIndex) {
    const items = document.querySelectorAll('.library-song-item');
    items.forEach(item => {
      const idx = parseInt(item.getAttribute('data-index'));
      if (idx === activeIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Appends a new song to library and rebuilds the 3D Cover Flow
  addSongToLibrary(name, artist, artworkUrl = null, previewUrl = null, fileBlob = null) {
    const newIdx = audio.addTrack(name, artist, artworkUrl, previewUrl, fileBlob);
    this.rebuildCarousel();
    
    // Auto-focus and zoom-in to the new addition
    this.focusAlbumIndex(newIdx, true);
    this.isZoomed = true;
    this.triggerStarburstWarp();
  }
  
  // Deletes song from library and updates Three.js
  deleteSongFromLibrary(index) {
    const success = audio.deleteTrack(index);
    if (!success) return;
    
    // Clean up texture resources for the deleted album
    if (this.albumCanvasTextures[index]) {
      this.albumCanvasTextures[index].texture.dispose();
    }
    this.albumCanvasTextures.splice(index, 1);
    
    this.rebuildCarousel();
    
    // Refocus if index was out of bounds (wrapped using modulo)
    const nextFocused = ((this.focusedIndex % NUM_ALBUMS) + NUM_ALBUMS) % NUM_ALBUMS;
    this.focusAlbumIndex(nextFocused, true);
    
    // Update bottom player HUD to the new playing track
    this.updatePlayingTrackUI(audio.currentTrackIndex);
  }
}

// Start app
const app = new App();
app.init();
