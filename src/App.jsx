import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DialUpContainer from './components/DialUpContainer';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, OrbitControls } from '@react-three/drei';

const DEFAULT_IMAGE = "/face.png";

// Styles for animations
const animationStyles = `
  @keyframes rippleAnimation {
    0% {
      transform: scale(1);
      opacity: 0.4;
      border-width: 2px;
    }
    50% {
      opacity: 0.2;
      border-width: 1.5px;
    }
    100% {
      transform: scale(1.25);
      opacity: 0;
      border-width: 1.5px;
    }
  }
  
  @keyframes qrButtonRipple {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
`;

// Apply styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = animationStyles;
document.head.appendChild(styleSheet);

function ModelDisplay({ onRotation }) {
  const { scene } = useGLTF('/track-ball-3d.glb');
  const modelRef = useRef();
  const controlsRef = useRef();

  // Get the camera to adjust its position
  const { camera } = useThree();
  
  // Set camera closer to fill the viewport completely
  useEffect(() => {
    if (camera) {
      camera.position.z = 7; // Move camera closer for larger appearance
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame(() => {
    if (controlsRef.current && onRotation) {
      // Get the actual rotation from OrbitControls
      const azimuthalAngle = controlsRef.current.getAzimuthalAngle();
      const polarAngle = controlsRef.current.getPolarAngle();
      
      // Normalize angles to 0-1 range
      const normalizedRotation = {
        x: ((polarAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI),
        y: ((azimuthalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI)
      };
      
      onRotation(normalizedRotation);
    }
    
    // Enlarged scale to fill the entire circle
    if (modelRef.current) {
      modelRef.current.scale.set(0.6, 0.6, 0.6); // Larger to fill the circle
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 7]}
        fov={25}
        near={0.1}
        far={1000}
      />
      
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 3 / 4}
        rotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
      
      <ambientLight intensity={1.2} />
      
      <mesh ref={modelRef}>
        <primitive 
          object={scene} 
          scale={0.6} // Enlarged to fill the circle
          position={[0, 0, 0]}
        />
      </mesh>
    </>
  );
}

function App() {
  const [phase, setPhase] = useState("text");
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const [loading, setLoading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showProcessButtons, setShowProcessButtons] = useState(false);
  const [variations, setVariations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDialUp, setShowDialUp] = useState(false);
  const [dialRotation, setDialRotation] = useState(0);
  const [show3DModel, setShow3DModel] = useState(false);
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0 });
  const [imageClickEnabled, setImageClickEnabled] = useState(true);
  const [showQRRipple, setShowQRRipple] = useState(false);
  const [userUrl, setUserUrl] = useState("");
  const isDraggingRef = useRef(false);
  const processingCompleteRef = useRef(false);
  const API_BASE_URL = 'https://tools.qrplus.ai';

  // Add new state for icon animations
  const [showSideIcons, setShowSideIcons] = useState(false);

  // Disable image click when certain interactions are happening
  useEffect(() => {
    // Disable image clicking when showing dialup, 3D model, or processing
    setImageClickEnabled(!showDialUp && !show3DModel && !isProcessing);
  }, [showDialUp, show3DModel, isProcessing]);

  // Phase progression with timers
  useEffect(() => {
    let timer;
    if (phase === "text") {
      timer = setTimeout(() => {
        setPhase("image");
      }, 2000); // Show text for 2 seconds
    } else if (phase === "image") {
      timer = setTimeout(() => {
        setPhase("border");
      }, 2000); // Show image for 2 seconds before border
    }
    return () => clearTimeout(timer);
  }, [phase]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // CSS keyframes for animations
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes rippleAnimation {
        0% {
          transform: scale(1);
          opacity: 0.35;
        }
        40% {
          opacity: 0.25;
        }
        80% {
          opacity: 0.15;
        }
        100% {
          transform: scale(1.15);
          opacity: 0;
        }
      }
      
      @keyframes glowPulse {
        0% {
          box-shadow: 0 0 0 0.5px rgba(64, 255, 0, 1);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(64, 255, 0, 0.5);
        }
        100% {
          box-shadow: 0 0 0 0.5px rgba(64, 255, 0, 1);
        }
      }
      
      @keyframes processingOverlay {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        80% {
          opacity: 1;
        }
        100% {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes subtlePulse {
        0%, 100% {
          opacity: 1;
          filter: brightness(1);
        }
        50% {
          opacity: 0.92;
          filter: brightness(0.97);
        }
      }
      
      @keyframes scanEffect {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes qrButtonRipple {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          opacity: 0.3;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .scanning-overlay {
        position: absolute;
        top: 0;
        left: -50%;
        width: 200%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          transparent 35%,
          rgba(255, 255, 255, 0.4) 45%,
          rgba(255, 255, 255, 0.9) 50%,
          rgba(255, 255, 255, 0.4) 55%,
          transparent 65%,
          transparent 100%
        );
        transform: translateX(-100%);
        mix-blend-mode: overlay;
      }

      .scanning-overlay.active {
        animation: scanEffect 4s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
      }

      @keyframes imageDim {
        0%, 100% {
          filter: brightness(0.9) contrast(1.1);
        }
        50% {
          filter: brightness(0.85) contrast(1.15);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Show icon after image loads
  useEffect(() => {
    if (image !== DEFAULT_IMAGE && !loading && !show3DModel) {
      const timer = setTimeout(() => {
        setShowIcon(true);
        setShowDialUp(false); // Ensure DialUp is hidden when image is first loaded
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowIcon(false);
      setShowUrlInput(false);
      setShowProcessButtons(false);
    }
  }, [image, loading, show3DModel]);

  // Show URL input after icon appears
  useEffect(() => {
    if (showIcon && !show3DModel) {
      const timer = setTimeout(() => {
        setShowUrlInput(true);
      }, 1000); // Reduced from 2000ms to 1000ms for quicker transition
      return () => clearTimeout(timer);
    }
  }, [showIcon, show3DModel]);

  // Handle image click and file selection
  const handleImageClick = async (e) => {
    // Prevent click if we clicked on a child element that handles its own events
    if (e.target !== e.currentTarget || !imageClickEnabled) {
      return;
    }
    
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 1000);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    // Add compression options
    const compressImage = async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            }, 'image/jpeg', 0.8); // 80% quality
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        try {
          // Compress image before upload
          const compressedFile = await compressImage(file);
          const formData = new FormData();
          formData.append("file", compressedFile);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          let res;
          try {
            res = await fetch(`${API_BASE_URL}/api/v1/uploadFile`, {
              method: "POST",
              body: formData,
              headers: {
                'Accept': 'application/json'
              },
              signal: controller.signal
            });
          } catch (error) {
            throw error;
          }

          clearTimeout(timeoutId);
  
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
  
          const data = await res.json();

          // Store the fileId from the response
          if (!data || !data.fileId) {
            throw new Error('Invalid response format: missing fileId');
          }

          // Store the fileId
          setFileId(data.fileId);

          // Handle the image data - updated to handle both base64 and array data
          let imageData;
          if (data.contents) {
            if (data.contents.type === "Buffer" && Array.isArray(data.contents.data)) {
              // Convert array of bytes to base64 string
              const uint8Array = new Uint8Array(data.contents.data);
              const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
              imageData = btoa(binaryString);
            } else if (data.contents.Data) {
              // Handle base64 Data field
              imageData = data.contents.Data;
            }
          } else if (data.croppedImage) {
            // Handle direct base64 format
            imageData = data.croppedImage.replace(/^data:image\/\w+;base64,/, '');
          }

          if (!imageData) {
            throw new Error('No valid image data in response');
          }

          const preloadImage = new Image();
          preloadImage.onload = () => {
            const imageUrl = `data:image/jpeg;base64,${imageData}`;
            setImage(imageUrl);
            setShowRipple(true);
            setShowDialUp(false); // Explicitly ensure DialUp is hidden for new images
            setTimeout(() => setShowRipple(false), 1000);
            setLoading(false);
          };

          preloadImage.onerror = () => {
            setLoading(false);
            alert('Failed to load the image. Please try again.');
          };

          // Set the image source
          const imageUrl = `data:image/jpeg;base64,${imageData}`;
          preloadImage.src = imageUrl;
        } catch (error) {
          if (error.name === 'AbortError') {
            alert('Upload timed out. Please try again.');
          } else {
            alert(`Upload failed: ${error.message}`);
          }
          setLoading(false);
        }
      }
    };
    input.click();
  };
  
  const boxSize = isMobile ? 270 : 340;
  // const borderColor = "#8fd6f9";

  const whiteCyan = "linear-gradient(to bottom, #2D87C7 0%, #ffffff 100%)";
  const blueCyan = "linear-gradient(to bottom, #2D87C7 0%, #002496 100%)";

  // Move the processing logic to a new function
  const handleGenerateQR = async () => {
    if (!fileId) {
      alert('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setShowDialUp(false); // Ensure DialUp is hidden during processing
    try {
      let response;
      
      // Use the user-provided URL or default to "abc"
      const targetUrl = userUrl.trim() || "abc";
      
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/generate/${fileId}/${targetUrl}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        throw error;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const variations = await response.json();
      
      if (Array.isArray(variations) && variations.length > 0) {
        // Process and store variations
        const processedVariations = variations.map(variation => {
          let base64Data;
          if (variation.imageData && typeof variation.imageData === 'object') {
            if (variation.imageData.type === 'Buffer' && Array.isArray(variation.imageData.data)) {
              const uint8Array = new Uint8Array(variation.imageData.data);
              const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
              base64Data = btoa(binaryString);
            } else if (variation.imageData.Data) {
              base64Data = variation.imageData.Data;
            }
          } else if (typeof variation.imageData === 'string') {
            base64Data = variation.imageData.replace(/^data:image\/\w+;base64,/, '');
          }

          return {
            ...variation,
            processedImageData: base64Data ? `data:image/jpeg;base64,${base64Data}` : null
          };
        });

        // Store all the processed variations for later use
        const validVariations = processedVariations.filter(v => v.processedImageData !== null);
        setVariations(validVariations);
        
        // Find the original image (with default brightness and contrast)
        const originalImage = validVariations.find(v => 
          (v.settings.b === 0.5 && v.settings.c === 0.5) || 
          (Math.abs(v.settings.b - 0.5) < 0.1 && Math.abs(v.settings.c - 0.5) < 0.1)
        );
        
        if (originalImage) {
          setImage(originalImage.processedImageData);
        } else if (validVariations.length > 0) {
          setImage(validVariations[0].processedImageData);
        }
      } else {
        throw new Error('Invalid response format or no variations received');
      }

      // After processing is complete - clean up UI and show 3D model
      setShow3DModel(true);
      setShowProcessButtons(false);
      setShowIcon(false);
      setShowUrlInput(false);
      setShowDialUp(false);

    } catch (error) {
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show buttons after image upload
  useEffect(() => {
    if (image !== DEFAULT_IMAGE && !loading) {
      const timer = setTimeout(() => {
        // setShowButtons(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // setShowButtons(false);
    }
  }, [image, loading]);

  const handleProcessClick = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    setShowProcessButtons(true);
    setShowDialUp(false); // Ensure DialUp is hidden when showing process buttons
    setShowIcon(false);
    setShowUrlInput(false);
  };

  // Add styles for processing animation
  const processingBorderStyle = isProcessing ? {
    boxShadow: "0 0 0 0.5px rgba(64, 255, 0, 1)",
    animation: "glowPulse 1.5s ease-in-out infinite"
  } : {};

  // Add the glowing animation keyframes
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes glowPulse {
        0% {
          box-shadow: 0 0 0 0.5px rgba(64, 255, 0, 1);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(64, 255, 0, 0.5);
        }
        100% {
          box-shadow: 0 0 0 0.5px rgba(64, 255, 0, 1);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Add the image processing animation keyframes
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes processingOverlay {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        80% {
          opacity: 1;
        }
        100% {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes subtlePulse {
        0%, 100% {
          opacity: 1;
          filter: brightness(1);
        }
        50% {
          opacity: 0.92;
          filter: brightness(0.97);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes scanEffect {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      .scanning-overlay {
        position: absolute;
        top: 0;
        left: -50%;
        width: 200%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          transparent 35%,
          rgba(255, 255, 255, 0.4) 45%,
          rgba(255, 255, 255, 0.9) 50%,
          rgba(255, 255, 255, 0.4) 55%,
          transparent 65%,
          transparent 100%
        );
        transform: translateX(-100%);
        mix-blend-mode: overlay;
      }

      .scanning-overlay.active {
        animation: scanEffect 4s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
      }

      @keyframes imageDim {
        0%, 100% {
          filter: brightness(0.9) contrast(1.1);
        }
        50% {
          filter: brightness(0.85) contrast(1.15);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Add rotation animation for dial
  useEffect(() => {
    let animationFrame;
    if (showDialUp) {
      const animate = () => {
        setDialRotation(prev => prev + 0.02);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [showDialUp]);

  // Function to update image based on normalized coordinates
  const updateImageBasedOnPosition = useCallback((position) => {
    if (!variations || variations.length === 0) return;
    
    // Normalize position to -1 to 1 range
    const x = position.x;
    const y = position.y;
    
    // Calculate distance from center (0,0)
    const distance = Math.sqrt(x*x + y*y);
    
    // Only update if within the circle boundary (radius 1.0)
    if (distance <= 1.0) {
      console.log("Position coordinates:", { x, y, distance });
      
      // Map x and y coordinates to variations in a grid-like pattern
      const gridSize = Math.ceil(Math.sqrt(variations.length));
      
      // Map x and y from -1,1 to 0,gridSize-1
      const xIndex = Math.floor(((x + 1) / 2) * (gridSize - 0.01));
      const yIndex = Math.floor(((y + 1) / 2) * (gridSize - 0.01));
      
      // Calculate 1D index from 2D coordinates
      const index = Math.min(variations.length - 1, yIndex * gridSize + xIndex);
      
      if (index !== currentVariationIndex && variations[index]) {
        console.log("Updating to variation:", index);
        setCurrentVariationIndex(index);
        
        // Update the displayed image with the selected variation
        if (variations[index].processedImageData) {
          setImage(variations[index].processedImageData);
        }
      }
    } else {
      console.log("Position outside model boundary:", { x, y, distance });
    }
  }, [variations, currentVariationIndex]);

  // Implement the drag functionality at the component level instead of in Three.js
  const handleMouseDown = useCallback((e) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvasElement = e.currentTarget;
    isDraggingRef.current = true;
    
    // Set cursor
    canvasElement.style.cursor = 'grabbing';
    
    // Calculate normalized coordinates from canvas
    const updateCoordinates = (clientX, clientY) => {
      const rect = canvasElement.getBoundingClientRect();
      
      // Calculate center points
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Raw position relative to center (-1 to 1 range)
      let rawX = (clientX - centerX) / (rect.width / 2);
      let rawY = -1 * (clientY - centerY) / (rect.height / 2);
      
      // Calculate distance from center
      const distance = Math.sqrt(rawX * rawX + rawY * rawY);
      
      // If outside circle, normalize coordinates to lie on the circle boundary
      if (distance > 1.0) {
        rawX = rawX / distance;
        rawY = rawY / distance;
      }
      
      return { x: rawX, y: rawY };
    };
    
    // Initial position
    const initialPos = updateCoordinates(e.clientX, e.clientY);
    setDragPosition(initialPos);
    setDebugInfo(initialPos);
    
    // Mouse move handler
    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const newPos = updateCoordinates(moveEvent.clientX, moveEvent.clientY);
      setDragPosition(newPos);
      setDebugInfo(newPos);
      
      // Update the image based on current position during dragging for immediate feedback
      updateImageBasedOnPosition(newPos);
    };
    
    // Mouse up handler
    const handleMouseUp = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      isDraggingRef.current = false;
      canvasElement.style.cursor = 'grab';
      
      // Final position
      const finalPos = updateCoordinates(upEvent.clientX, upEvent.clientY);
      
      // Update the image based on final position
      updateImageBasedOnPosition(finalPos);
      
      // Clean up
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add document-level event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateImageBasedOnPosition]);
  
  // Handle touch events similarly
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasElement = e.currentTarget;
    isDraggingRef.current = true;
    
    const touch = e.touches[0];
    
    // Calculate normalized coordinates from canvas
    const updateCoordinates = (clientX, clientY) => {
      const rect = canvasElement.getBoundingClientRect();
      
      // Calculate center points
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Raw position relative to center (-1 to 1 range)
      let rawX = (clientX - centerX) / (rect.width / 2);
      let rawY = -1 * (clientY - centerY) / (rect.height / 2);
      
      // Calculate distance from center
      const distance = Math.sqrt(rawX * rawX + rawY * rawY);
      
      // If outside circle, normalize coordinates to lie on the circle boundary
      if (distance > 1.0) {
        rawX = rawX / distance;
        rawY = rawY / distance;
      }
      
      return { x: rawX, y: rawY };
    };
    
    // Initial position
    const initialPos = updateCoordinates(touch.clientX, touch.clientY);
    setDragPosition(initialPos);
    setDebugInfo(initialPos);
    
    // Touch move handler
    const handleTouchMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const moveTouch = moveEvent.touches[0];
      const newPos = updateCoordinates(moveTouch.clientX, moveTouch.clientY);
      setDragPosition(newPos);
      setDebugInfo(newPos);
      
      // Update the image based on current position during dragging for immediate feedback
      updateImageBasedOnPosition(newPos);
    };
    
    // Touch end handler
    const handleTouchEnd = (upEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      isDraggingRef.current = false;
      
      // Final position - use last known position since touches may be empty
      updateImageBasedOnPosition(dragPosition);
      
      // Clean up
      document.removeEventListener('touchmove', handleTouchMove, { passive: false });
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    // Add document-level event listeners
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [dragPosition, updateImageBasedOnPosition]);

  // const handleIconClick = (e) => {
  //   e.stopPropagation(); // Prevent image click handler from firing
  //   setShowUrlInput(true);
  // };

  // Add responsive width calculation
  // const getUrlInputWidth = () => {
  //   if (isMobile) {
  //     return Math.min(360, window.innerWidth - 40); // 20px padding on each side
  //   }
  //   return 360; // Desktop width
  // };

  // Function to get neutral variations (middle range of brightness and contrast)
  // const getNeutralVariations = (variations) => {
  //   return variations.filter(v => {
  //     // Consider variations with brightness and contrast between 0.4 and 0.6 as neutral
  //     return v.settings.b >= 0.4 && v.settings.b <= 0.6 && 
  //            v.settings.c >= 0.4 && v.settings.c <= 0.6;
  //   });
  // };

  // const handleVariationSelect = (variation) => {
  //   setSelectedVariation(variation);
  //   const imageUrl = variation.imageData.startsWith('data:') 
  //     ? variation.imageData 
  //     : `data:image/jpeg;base64,${variation.imageData}`;
  //   setImage(imageUrl);
  // };

  // Update the handleGenerateQRClick function to use the white ripple effect
  const handleGenerateQRClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    
    setShowQRRipple(true);
    setTimeout(() => setShowQRRipple(false), 600);
    handleGenerateQR();
  };

  return (
    <motion.div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background crossfade layers */}
      <motion.div
        key="bg-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "border" ? 0 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: whiteCyan,
          zIndex: -1,
        }}
      />
      <motion.div
        key="bg-colored"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "border" ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: blueCyan,
          zIndex: -1,
        }}
      />
      {/* Header without logout, only menu icon */}
      <div style={{
          position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "90px",
        zIndex: 10
      }}>
        <img
          src="/logo.png"
          alt="Logo"
        style={{
          position: "absolute",
            top: "50%",
            left: isMobile ? "50%" : "20px",
            transform: isMobile ? "translate(-50%, -50%)" : "translateY(-50%)",
            height: isMobile ? "30px" : "40px",
            width: "auto"
          }}
        />
        <div style={{
          position: "absolute",
          top: "50%",
          right: "20px",
          transform: "translateY(-50%)"
        }}>
          <img
            src="/menu.png"
            alt="Menu"
          style={{
              height: "5px",
              width: "20px",
              cursor: "pointer"
            }}
          />
        </div>
      </div>
      {/* Centered Content Container */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: isMobile ? "40%" : "50%",
        transform: "translate(-50%, -50%)",
            display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <AnimatePresence mode="wait">
          {/* Text Phase */}
        {phase === "text" && (
          <motion.div
              key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                fontSize: "2.5rem",
                fontFamily: "'Gotham Light', sans-serif",
                fontWeight: "400",
                color: "#002496",
                textAlign: "center"
              }}
            >
              Style your pictures!
          </motion.div>
        )}

          {/* Image Phase */}
      {(phase === "image" || phase === "border") && (
          <motion.div
              key="image-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
            position: "relative",
            width: boxSize,
            height: boxSize,
            top: isMobile ? "10px" : "-70px",
            borderRadius: "4px",
            border: `3px solid ${image === DEFAULT_IMAGE ? "#6EC2FF" : "#45FF02"}`,
            cursor: imageClickEnabled ? "pointer" : "default",
            ...processingBorderStyle,
            transition: 'border-color 0.3s ease'
          }}
              onClick={handleImageClick}
              onDragStart={(e) => e.preventDefault()}
            >
              {/* Ripple Borders */}
              {showRipple && (
                <>
                  {[...Array(5)].map((_, index) => (
              <motion.div
                      key={`ripple-${index}`}
          style={{
            position: "absolute",
                        inset: -3 ,
                        border: `${2 - (index * 0.15)}px  solid ${image === DEFAULT_IMAGE ? "#6EC2FF" : "#45FF02"}`,
                        borderRadius: "4px",
                        opacity: 0,
                        animation: `rippleAnimation ${1.4 + (index * 0.2)}s cubic-bezier(0.4, 0, 0.2, 1) ${
            index * 0.15
          }s forwards`,
                        pointerEvents: "none",
                        zIndex: 3,
                        transform: `scale(1)`,  
                        willChange: "transform, opacity", 
                        transition: 'all 0.3s ease-out'
                      }}
                    />
                  ))}
                </>
              )}

              {/* Image Content */}
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
                  borderRadius: "2px",
                  pointerEvents: "none",
              position: "relative",
              zIndex: 1,
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  backdropFilter: "none"  // Ensure no blur on the image container
                }}
              >
                {loading ? (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.8)",
                    pointerEvents: "none"
                  }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      border: "1px solid #f3f3f3",
                      borderTop: "1px solid #40ff00",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                  </div>
                ) : (
                  <>
                    <motion.img
                      key={image}
                      src={image}
                      alt="Preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        pointerEvents: "none",
                        animation: isProcessing ? "imageDim 4s ease-in-out infinite" : "none"
                      }}
                      onError={(e) => {
                        console.error('Image loading error:', e);
                        setImage(DEFAULT_IMAGE);
                      }}
                    />
                  </>
                )}
                {isProcessing && (
                  <>
                    <div 
                      className={`scanning-overlay${isProcessing ? ' active' : ''}`}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "-50%",
                        width: "200%",
                        height: "100%",
                        pointerEvents: "none",
            zIndex: 2,
                        willChange: "transform",
                        mixBlendMode: "overlay"
          }}
                    />
          <div
            style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
              width: "100%",
              height: "100%",
                        background: "rgba(0, 0, 0, 0.15)",
                        pointerEvents: "none",
                        zIndex: 1
                      }}
                    />
                  </>
            )}
          </motion.div>

              {/* Icon and URL Input */}
              <AnimatePresence mode="crossfade">
                {showIcon && !showProcessButtons && !show3DModel && (
                  <>
                    {!showUrlInput ? (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ 
                          opacity: 1, 
                          y: 20 
                        }}
                        exit={{ 
                          opacity: 0,
                          y: 20,
                          transition: { duration: 0.3 }
                        }}
                        transition={{ 
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                        style={{
                          position: "absolute",
                          left: "45%", // Changed from 45% to 50% for perfect centering
                          top: "calc(100% + 65px)",
                          transform: "translateX(-50%)",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10,
                        }}
                      >
                        <img
                          src="/images/icon-below-image.png" 
                          alt="Icon" 
                          style={{
                            width: "32px",
                            height: "32px",
                            objectFit: "contain"
                          }}
                        />
                      </motion.div>
                    ) : (
                      <div style={{ 
                        position: "absolute",
                        top: "calc(100% + 60px)", // Changed from 80px to 60px to match icon position
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        width: isMobile ? "310px" : "600px",
                        height: "100px",
                        margin: "0 auto",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <motion.div
                          initial={{ x: 0, opacity: 0, scale: 0.9 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            ease: "easeOut",
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "1px"
                          }}
                        >
                          <img
                            src="/images/icon-below-image.png" 
                            alt="Icon"
                            style={{
                              width: "32px",
                              height: "32px",
                              objectFit: "contain"
                            }}
                          />
                        </motion.div>
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "calc(100% - 32px)", opacity: 1 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1],
                            opacity: { duration: 0.3, delay: 0.1 }
                          }}
                          style={{
                            height: "32px",
                            background: "linear-gradient(to right, #4a90e2 0%, #8fd6f9 5%, white 35%)",
                            borderRadius: "1px",
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden"
                          }}
                        >
                          <div style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            background: "transparent",
                            whiteSpace: "nowrap"
                          }}>
                            <motion.input
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "100%", opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                              type="text"
                              placeholder="URL:"
                              value={userUrl}
                              onChange={(e) => setUserUrl(e.target.value)}
                              style={{
                                flex: 1,
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: "#333",
                                padding: "0 12px",
                                height: "100%",
                                fontFamily: "inherit"
                              }}
                            />
                            {!isMobile && (
                              <motion.button
                                initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.6 }}
                  style={{
                                  padding: " 16px",
                                  background: "#40ff00",
                                  border: "none",
                                  color: "white",
                                  cursor: "pointer",
                                  fontWeight: "500",
                                  fontSize: "13px",
                                  height: "30px",
                    display: "flex",
                    alignItems: "center",
                                  marginLeft: "auto",
                                  borderRadius: "1px",
                                  textDecoration: "none",
                                  width: "auto"
                                }}
                                onClick={handleProcessClick}
                                type="button"
                              >
                                Link
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                        
                        {isMobile && (
                          <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                  style={{
                              padding: "16px",
                              background: "#40ff00",
                              border: "none",
                              color: "white",
                              cursor: "pointer",
                              fontWeight: "500",
                              fontSize: "13px",
                              height: "30px",
                    display: "flex",
                    alignItems: "center",
                              marginTop: "10px",
                              borderRadius: "1px",
                              textDecoration: "none",
                              width: "auto",
                              position: "absolute",
                              left: "50%",
                              transform: "translateX(-50%)",
                              top: "calc(50% + 30px)"
                            }}
                            onClick={handleProcessClick}
                            type="button"
                          >
                            Link
                          </motion.button>
                        )}
        </div>
                    )}
                  </>
                )}

                {/* Back and Generate QR Buttons */}
                {showProcessButtons && !showDialUp && !show3DModel && (
                  <>
                    {/* Back Button - Repositioned to left side of image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
        style={{
                        width: "32px",
                        height: "32px",
                        // background: "#4a90e2",
                        // borderRadius: "1px",
          display: "flex",
          alignItems: "center",
                        justifyContent: "bottom",
                        cursor: "pointer",
                        // border: "0.5px solid rgba(74, 144, 226, 0.5)",
                        position: "absolute",
                        left: isMobile ? "-45px" : "-50px",
                        bottom: "0px",
                        zIndex: 10
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowProcessButtons(false);
                        setShowIcon(true);
                        setShowUrlInput(true);
                      }}
    >
      <img
                        src="/images/back.png" 
                        alt="Back" 
      style={{
                          width: "32px",
                          height: "32px",
                          pointerEvents: "none"
                        }}
      />
    </motion.div>

                    {/* Generate QR Button */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      style={{
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isProcessing ? "wait" : "pointer",
                        opacity: isProcessing ? 0.7 : 1,
                        position: "absolute",
                        bottom: "-150px",
                        left: isMobile ? "40%" : "43%",
                        transform: "translateX(-50%)",
                        zIndex: 10
                      }}
                      onClick={handleGenerateQRClick}
                    >
                      {/* White ripple effect for Generate QR Button */}
                      {showQRRipple && (
                        <>
                          {[...Array(3)].map((_, index) => (
                            <motion.div
                              key={`qr-ripple-${index}`}
                              style={{
                                position: "absolute",
                                inset: -3,
                                border: `${2 - (index * 0.15)}px solid #FFFFFF`,
                                borderRadius: "50%",
                                opacity: 0,
                                animation: `qrButtonRipple ${0.6 + (index * 0.15)}s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s forwards`,
                                pointerEvents: "none",
                                zIndex: 3,
                                transform: `scale(1)`,  
                                willChange: "transform, opacity", 
                                transition: 'all 0.3s ease-out'
                              }}
                            />
                          ))}
                        </>
                      )}
                      <img
                        src="/images/GenerateQRBtn.png" 
                        alt="Generate QR" 
                        style={{
                          width: "60px",
                          height: "60px",
                          pointerEvents: "none"
                        }}
                      />
                    </motion.div>
                  </>
                )}

                {/* 3D Model with side icons */}
                {show3DModel && variations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: "absolute",
                      width: isMobile ? boxSize*0.8 : boxSize * 0.6,
                      height: isMobile ? boxSize*0.8 : boxSize * 0.6,
                      top: isMobile ? "300px" : "360px",
                      left: isMobile ? "20px" : "60px",
                      transform: "translate(-50%, -50%)",
                      zIndex: 100,
                      overflow: "visible",
                      // borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Drop shadow behind the trackball */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "84%",  // Exactly match clipPath size (42% * 2)
                        height: "84%",
                        borderRadius: "50%",
                        boxShadow: "0 0 0 1.5px #44FF00E5, 0 0 8px 6px rgba(68, 255, 0, 0.25), 0 0 16px 12px rgba(68, 255, 0, 0.15)",
                        opacity: 0.7,
                        zIndex: 999, // Just under the trackball
                        pointerEvents: "none",
                      }}
                    />
                    
                    {/* Additional perfect-fit ring */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "84%", // Match exact clipPath size
                        height: "84%",
                        borderRadius: "50%",
                        border: "1px solid #44FF00E5",
                        opacity: 0.6,
                        zIndex: 999, // Just under the trackball
                        pointerEvents: "none",
                      }}
                    />
                    
                    <div 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        userSelect: "none",
                        touchAction: "none",
                        position: "relative",
                        cursor: "grab",
                        border: "none",
                        borderRadius: "0",
                        background: "transparent",
                        clipPath: "circle(42% at center)",
                        zIndex: 1000
                      }}
                    >
                      <Canvas
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          touchAction: "none",
                          userSelect: "none",
                          cursor: "grab"
                        }}
                        camera={{ position: [0, 0, 7], fov: 25 }} // Adjusted for larger model
                      >
                        <React.Suspense fallback={null}>
                          <ambientLight intensity={1.5} />
                          <directionalLight position={[5, 5, 5]} intensity={2} />
                          <spotLight position={[-5, 5, 5]} intensity={1} />
                          <spotLight position={[0, -5, 5]} intensity={0.8} />
                          
                          <ModelDisplay onRotation={(rotation) => {
                            const totalVariations = variations.length;
                            const angleSum = (rotation.x + rotation.y) / 2;
                            const variationIndex = Math.floor(angleSum * totalVariations);
                            const safeIndex = Math.abs(variationIndex % totalVariations);
                            
                            if (variations[safeIndex] && variations[safeIndex].processedImageData) {
                              setImage(variations[safeIndex].processedImageData);
                            }
                          }} />
                        </React.Suspense>
                      </Canvas>
                    </div>
                  </motion.div>
                )}

                {/* Only show DialUp when 3D model is not shown */}
                {showDialUp && !show3DModel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 20px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "200px",
                      zIndex: 5
                    }}
                  >
                    <DialUpContainer rotation={dialRotation} />
                  </motion.div>
          )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
export default App;