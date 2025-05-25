import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import ImageBox from "./components/ImageBox";
// import MainUI from "./components/MainUI";
// import AnimatedTypography from './components/AnimatedTypography';
// import { FaGlobeAmericas } from "react-icons/fa";
// import ImageVariations from './components/ImageVariations';
import DialUpContainer from './components/DialUpContainer';
import { Canvas } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
// import * as THREE from 'three';

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
      opacity: 0.45;
    }
    100% {
      transform: scale(1.45);
      opacity: 0;
    }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = animationStyles;
document.head.appendChild(styleSheet);

// First, let's add a comprehensive drag prevention module
// This runs as soon as the script is loaded
(function preventDragDefaults() {
  // These need to be set up before React even mounts
  const preventDefault = (e) => {
    // Skip if the target is a file input or its parent element
    if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
      return true;
    }
    
    // Check if the event is happening on or inside a file input
    let currentElement = e.target;
    while (currentElement) {
      if (currentElement.tagName === 'INPUT' && currentElement.type === 'file') {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    
    // Otherwise prevent the default behavior
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Prevent all drag-related events globally
  window.addEventListener('dragenter', preventDefault, true);
  window.addEventListener('dragover', preventDefault, true);
  window.addEventListener('dragleave', preventDefault, true);
  window.addEventListener('drop', preventDefault, true);
  
  // Also prevent these events on document body
  document.body.addEventListener('dragenter', preventDefault, false);
  document.body.addEventListener('dragover', preventDefault, false);
  document.body.addEventListener('dragleave', preventDefault, false);
  document.body.addEventListener('drop', preventDefault, false);
  
  // Disable selection on body to prevent text selection issues
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
})();

// Draggable 3D model component with improved drag handling
// function DraggableModel({ onDrag, onDragEnd }) {
//   const { scene } = useGLTF('/track-ball-3d.glb');
//   const { size, viewport, camera } = useThree();
//   const [dragStarted, setDragStarted] = useState(false);
//   const groupRef = useRef();
  
//   // Convert screen coordinates to normalized -1 to 1 range
//   const normalizeCoords = (x, y) => {
//     // Convert from pixels to normalized device coordinates (-1 to 1)
//     const normalizedX = (x / size.width) * 2 - 1;
//     const normalizedY = -((y / size.height) * 2 - 1); // Y is inverted
    
//     return { x: normalizedX, y: normalizedY };
//   };
  
//   // Track drag state
//   const dragStart = useRef({ x: 0, y: 0 });
//   const dragCurrent = useRef({ x: 0, y: 0 });
  
//   // Handle pointer events
//   const handlePointerDown = (e) => {
//     e.stopPropagation();
//     // Three.js events don't have preventDefault
    
//     // Set flag and capture the pointer
//     setDragStarted(true);
//     e.target.setPointerCapture(e.pointerId);
    
//     // Store start position in unprojected coordinates
//     dragStart.current = { x: e.point.x, y: e.point.y };
//     dragCurrent.current = { x: e.point.x, y: e.point.y };
    
//     // Change cursor on drag start
//     const canvasElement = document.querySelector('canvas');
//     if (canvasElement) {
//       canvasElement.style.cursor = 'grabbing';
//     }
    
//     console.log("Drag started at:", e.point);
//   };
  
//   const handlePointerMove = (e) => {
//     e.stopPropagation();
//     // Three.js events don't have preventDefault
    
//     if (!dragStarted) return;
    
//     // Update current position
//     dragCurrent.current = { x: e.point.x, y: e.point.y };
    
//     // Use the Three.js event points directly
//     const x = THREE.MathUtils.clamp(e.point.x, -1, 1);
//     const y = THREE.MathUtils.clamp(e.point.y, -1, 1);
    
//     // Move the model
//     if (groupRef.current) {
//       groupRef.current.position.x = x * 3; // Scale for better visual feedback
//       groupRef.current.position.y = y * 3;
//     }
    
//     // Call drag callback with normalized position
//     if (onDrag) {
//       onDrag({ x, y });
//     }
    
//     console.log("Dragging to:", { x, y });
//   };
  
//   const handlePointerUp = (e) => {
//     if (!dragStarted) return;
    
//     // Three.js events don't have preventDefault
//     e.stopPropagation();
    
//     // End drag
//     setDragStarted(false);
    
//     // Reset cursor on drag end
//     const canvasElement = document.querySelector('canvas');
//     if (canvasElement) {
//       canvasElement.style.cursor = 'grab';
//     }
    
//     // Use the last known position if event doesn't have point
//     const finalPos = e.point ? 
//       { x: THREE.MathUtils.clamp(e.point.x, -1, 1), y: THREE.MathUtils.clamp(e.point.y, -1, 1) } : 
//       { x: THREE.MathUtils.clamp(dragCurrent.current.x, -1, 1), y: THREE.MathUtils.clamp(dragCurrent.current.y, -1, 1) };
    
//     // Call drag end callback
//     if (onDragEnd) {
//       onDragEnd(finalPos);
//     }
    
//     // Reset position smoothly
//     if (groupRef.current) {
//       const targetPos = new THREE.Vector3(0, 0, 0);
//       const duration = 0.5;
//       const startTime = Date.now();
//       const startPos = groupRef.current.position.clone();
      
//       const animate = () => {
//         const elapsed = (Date.now() - startTime) / 1000;
//         const t = Math.min(elapsed / duration, 1);
//         const easeOutT = 1 - Math.pow(1 - t, 3); // Cubic ease out
        
//         groupRef.current.position.lerpVectors(startPos, targetPos, easeOutT);
//         if (t < 1) {
//           requestAnimationFrame(animate);
//         }
//       };
      
//       animate();
//     }
    
//     console.log("Drag ended with position:", finalPos);
//   };
  
//   // Prevent default drag behavior on the canvas
//   useEffect(() => {
//     const canvasElement = document.querySelector('canvas');
//     if (canvasElement) {
//       canvasElement.style.cursor = 'grab';
      
//       // Add these event listeners to the canvas element instead
//       const preventDefaults = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//       };
      
//       canvasElement.addEventListener('dragstart', preventDefaults);
//       canvasElement.addEventListener('dragover', preventDefaults);
//       canvasElement.addEventListener('drop', preventDefaults);
      
//       return () => {
//         canvasElement.style.cursor = 'auto';
//         canvasElement.removeEventListener('dragstart', preventDefaults);
//         canvasElement.removeEventListener('dragover', preventDefaults);
//         canvasElement.removeEventListener('drop', preventDefaults);
//       };
//     }
//   }, []);
  
//   return (
//     <group ref={groupRef} position={[0, 0, 0]}>
//       {/* Visible model */}
//       <primitive 
//         object={scene} 
//         scale={0.3}
//         rotation={[0, 0, 0]}
//         onPointerDown={handlePointerDown}
//         onPointerMove={handlePointerMove}
//         onPointerUp={handlePointerUp}
//         onPointerLeave={handlePointerUp}
//       />
      
//       {/* Larger invisible hit area for better dragging */}
//       <mesh 
//         visible={false}
//         scale={3}
//         onPointerDown={handlePointerDown}
//         onPointerMove={handlePointerMove}
//         onPointerUp={handlePointerUp}
//         onPointerLeave={handlePointerUp}
//       >
//         <sphereGeometry args={[1, 32, 32]} />
//         <meshBasicMaterial transparent opacity={0} />
//       </mesh>
//     </group>
//   );
// }

// Simpler model without drag functionality - we'll handle dragging differently
function ModelDisplay() {
  const { scene } = useGLTF('/track-ball-3d.glb');
  const modelRef = useRef();
  
  return (
    <group ref={modelRef} position={[0, 0, 0]}>
      <primitive 
        object={scene} 
        scale={0.3}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

export default function App() {
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
  const isDraggingRef = useRef(false);
  const processingCompleteRef = useRef(false);
  const API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'https://tools.qrplus.ai'
    : 'https://tools.qrplus.ai';

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
        // setShowImage(true);
        setPhase("image");
      }, 2000); // Show text for 2 seconds
    } else if (phase === "image") {
      timer = setTimeout(() => {
        // setShowBorder(true);
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

  // CSS keyframes for the ripple animation
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
      }, 2000);
    return () => clearTimeout(timer);
    }
  }, [showIcon, show3DModel]);

  // Handle image click and file selection
  const handleImageClick = async (e) => {
    // Prevent click if we clicked on a child element that handles its own events
    if (e.target !== e.currentTarget) {
      return;
    }
    
    // Don't open file picker if image clicking is disabled
    if (!imageClickEnabled) {
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

          console.log('Starting file upload...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          let res;
          // Use relative URL that will be proxied through Vercel
          try {
            console.log('Making API request through Vercel proxy...');
            res = await fetch(`${API_BASE_URL}/api/v1/uploadFile`, {
              method: "POST",
              body: formData,
              headers: {
                'Accept': 'application/json'
              },
              signal: controller.signal
            });
          } catch (error) {
            console.error('API request failed:', error);
            throw error;
          }

          clearTimeout(timeoutId);
  
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Server response:', {
              status: res.status,
              statusText: res.statusText,
              responseText: errorText
            });
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
          }
  
          const data = await res.json();
          console.log('Raw API Response:', data);

          // Store the fileId from the response
          if (!data || !data.fileId) {
            console.error('Invalid response format:', data);
            throw new Error('Invalid response format: missing fileId');
          }

          // Store the fileId
          setFileId(data.fileId);
          console.log('Received fileId:', data.fileId);

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
            console.error('No valid image data in response:', data);
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

          preloadImage.onerror = (error) => {
            console.error('Image loading error:', error);
            setLoading(false);
            alert('Failed to load the image. Please try again.');
          };

          // Set the image source
          const imageUrl = `data:image/jpeg;base64,${imageData}`;
          preloadImage.src = imageUrl;
        } catch (error) {
          console.error('Upload error:', error);
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
      console.error('No file ID available');
      alert('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setShowDialUp(false); // Ensure DialUp is hidden during processing
    try {
      console.log('Generating variations for fileId:', fileId);
      let response;
      
      // Use relative URL that will be proxied through Vercel
      try {
        console.log('Making variations API request through Vercel proxy...');
        response = await fetch(`${API_BASE_URL}/api/v1/generate/${fileId}/abc`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (error) {
        console.error('API request failed for variations:', error);
        throw error;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const variations = await response.json();
      console.log("Raw API Response:", variations);
      
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
        // Default values are typically 0.5 for both brightness (b) and contrast (c)
        // Look for values closest to default if exact match not found
        const originalImage = validVariations.find(v => 
          (v.settings.b === 0.5 && v.settings.c === 0.5) || 
          (Math.abs(v.settings.b - 0.5) < 0.1 && Math.abs(v.settings.c - 0.5) < 0.1)
        );
        
        if (originalImage) {
          // Update the displayed image with the original variation
          setImage(originalImage.processedImageData);
        } else if (validVariations.length > 0) {
          // If no "original" found, use the first variation
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
      console.error('Error processing image:', error);
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

  // Add state for Generate QR button ripple
  const [showQRRipple, setShowQRRipple] = useState(false);

  // Handle Generate QR button click with ripple
  const handleGenerateQRClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
              <AnimatePresence>
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
                          scale: 0.9,
                          transition: { duration: 0.2 }
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: "easeOut"
                        }}
          style={{
            position: "absolute",
            left: "45%",
                          top: "calc(100% + 60px)",
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
                        top: "calc(100% + 80px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        width: isMobile ? "310px" : "600px",
                        height: "100px",
                        margin: "0 auto",
                        flexDirection: isMobile ? "row" : "row"
                      }}>
                        <motion.div
                          initial={{ x: 200, opacity: 0, scale: 0.8 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.6,
                            ease: [0.4, 0, 0.2, 1],
                            opacity: { duration: 0.4 }
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
                            duration: 0.6,
                            ease: [0.4, 0, 0.2, 1],
                            opacity: { duration: 0.3, delay: 0.2 }
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
                              transition={{ duration: 0.3, delay: 0.4 }}
                              type="text"
                              placeholder="URL:"
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
                              top: "calc(50% + 5px)"
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isProcessing) return;
                        
                        const button = e.currentTarget;
                        
                        // Create multiple ripples with different delays
                        [0, 1, 2].forEach((i) => {
                          const ripple = document.createElement('div');
                          ripple.style.cssText = `
                            position: absolute;
                            width: 60px;
                            height: 60px;
                            background: rgba(255, 255, 255, ${0.45 - (i * 0.1)});
                            border-radius: 50%;
                            pointer-events: none;
                            animation: qrButtonRipple 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.12}s forwards;
                          `;
                          
                          button.appendChild(ripple);
                          setTimeout(() => ripple.remove(), 600 + (i * 120));
                        });
                        
                        handleGenerateQR();
                      }}
                    >
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
                      width: isMobile ? boxSize : boxSize * 0.9,
                      height: boxSize * 0.9,
                      top: isMobile ? "270px" : "320px",
                      left: isMobile ? "5px" : "20px",
                      transform: "translate(-50%, -50%)",
                      zIndex: 100,
                      overflow: "visible",
                      borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Side Icons */}
                    {showSideIcons && (
                      <>
                        <motion.img
                          src="/images/icn1.png"
                          alt="Icon 1"
                          initial={{ x: "50%", y: "50%", opacity: 0, scale: 0.5 }}
                          animate={{ x: "-120%", y: "50%", opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                          style={{
                            position: "absolute",
                            width: "50px",
                            height: "50px",
                            transform: "translate(-50%, -50%)",
                            cursor: "pointer"
                          }}
                        />
                        <motion.img
                          src="/images/icn2.png"
                          alt="Icon 2"
                          initial={{ x: "50%", y: "50%", opacity: 0, scale: 0.5 }}
                          animate={{ x: "220%", y: "50%", opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                          style={{
                            position: "absolute",
                            width: "50px",
                            height: "50px",
                            transform: "translate(-50%, -50%)",
                            cursor: "pointer"
                          }}
                        />
                      </>
                    )}

                    {/* Existing 3D model content */}
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
                      }}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {/* Add an invisible circular overlay to control the draggable area */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          pointerEvents: "none",
                          borderRadius: "50%",
                          border: "2px solid #40ff00",
                          boxSizing: "border-box",
                          width: "90%",
                          height: "90%",
                          margin: "auto"
                        }}
                      />
                      
                      <Canvas
                        style={{ 
                          width: "100%", 
                          height: "100%",
                          touchAction: "none",
                          userSelect: "none"
                        }}
                      >
                        <React.Suspense fallback={null}>
                          <ambientLight intensity={1.5} />
                          <directionalLight position={[5, 5, 5]} intensity={2} />
                          <spotLight position={[-5, 5, 5]} intensity={1} />
                          <spotLight position={[0, -5, 5]} intensity={0.8} />
                          
                          <PerspectiveCamera
                            makeDefault
                            position={[0, 0, 18]}
                            fov={15}
                            near={0.1}
                            far={1000}
                          />
                          
                          {/* Visual position indicator */}
                          <mesh 
                            position={[dragPosition.x * 3, dragPosition.y * 3, 2]} 
                            castShadow
                          >
                            <sphereGeometry args={[0.2, 16, 16]} />
                            <meshStandardMaterial 
                              color={Math.sqrt(dragPosition.x*dragPosition.x + dragPosition.y*dragPosition.y) <= 1.0 ? "#40ff00" : "#ff4000"} 
                              emissive={Math.sqrt(dragPosition.x*dragPosition.x + dragPosition.y*dragPosition.y) <= 1.0 ? "#40ff00" : "#ff4000"} 
                              emissiveIntensity={0.5} 
                            />
                          </mesh>
                          
                          {/* Boundary circle */}
                          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                            <ringGeometry args={[2.95, 3.05, 64]} />
                            <meshBasicMaterial color="#40ff00" opacity={0.8} transparent={true} />
                          </mesh>

                          {/* Inner boundary circle to help guide the user */}
                          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
                            <ringGeometry args={[2.7, 2.85, 64]} />
                            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent={true} />
                          </mesh>
                          
                          {/* Use simpler model without dragging */}
                          <ModelDisplay />
                        </React.Suspense>
                      </Canvas>
                      
                      {/* Overlay hint text */}
                      <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textShadow: "0 0 5px rgba(0,0,0,0.8)",
                        pointerEvents: "none",
                        opacity: 0
                      }}>
                        Drag here
  </div>
                    </div>
                    
                    {/* QR Image below 3D model */}
                    {/* <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "-100px",
                        transform: "translateX(-50%)",
                        cursor: "pointer"
                      }}
                      onClick={() => setShowSideIcons(true)}
                    >
                      <img
                        src="/images/QR.png"
                        alt="QR"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "contain"
                        }}
                      />
                    </motion.div> */}
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