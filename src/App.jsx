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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [clearWindowPosition, setClearWindowPosition] = useState({ x: 50, y: 50 });
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const isDraggingRef = useRef(false);
  const processingCompleteRef = useRef(false);
  const lastTouchDistanceRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const clearWindowRef = useRef(null);
  const isDraggingWindowRef = useRef(false);
  const API_BASE_URL = 'https://tools.qrplus.ai';

  // Add new state for icon animations
  const [showSideIcons, setShowSideIcons] = useState(false);

  // For tracking drag state
const clearWindowTouchDragRef = useRef(false);
const clearWindowLastTouchRef = useRef({ x: 0, y: 0 });

const handleClearWindowTouchStart = (e) => {
  if (image === DEFAULT_IMAGE || isFrozen) return;
  clearWindowTouchDragRef.current = true;
  const touch = e.touches[0];
  clearWindowLastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  e.stopPropagation();
};

const handleClearWindowTouchMove = (e) => {
  if (!clearWindowTouchDragRef.current || isFrozen) return;
  const touch = e.touches[0];
  const container = containerRef.current.getBoundingClientRect();
  const clearWindow = clearWindowRef.current.getBoundingClientRect();

  // Calculate new position in percentages
  let newX = ((touch.clientX - container.left - clearWindow.width / 2) / container.width) * 100;
  let newY = ((touch.clientY - container.top - clearWindow.height / 2) / container.height) * 100;

  // Clamp values to keep window within container
  newX = Math.max(0, Math.min(100 - (clearWindow.width / container.width) * 100, newX));
  newY = Math.max(0, Math.min(100 - (clearWindow.height / container.height) * 100, newY));

  setClearWindowPosition({ x: newX, y: newY });

  e.preventDefault();
  e.stopPropagation();
};

const handleClearWindowTouchEnd = (e) => {
  clearWindowTouchDragRef.current = false;
  e.stopPropagation();
};

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
          // Compress image before displaying
          const compressedFile = await compressImage(file);
          
          // Create a URL for the compressed file
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target.result;
            setImage(imageUrl);
            setShowRipple(true);
            setShowDialUp(false);
            setTimeout(() => setShowRipple(false), 1000);
            setLoading(false);
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          alert(`Failed to process image: ${error.message}`);
          setLoading(false);
        }
      }
    };
    input.click();
  };
  
  const boxSize = isMobile ? 320 : 340;
  // const borderColor = "#8fd6f9";

  const whiteCyan = "linear-gradient(to bottom, #2D87C7 0%, #ffffff 100%)";
  const blueCyan = "linear-gradient(to bottom, #2D87C7 0%, #002496 100%)";

  // Move the processing logic to a new function
  // 1. Update handleGenerateQR to remove redundant image data in payload
const handleGenerateQR = async () => {
  if (!image || image === DEFAULT_IMAGE) {
    alert('Please upload or select an image first');
    return;
  }

  setIsProcessing(true);
  setShowDialUp(false);

  try {
    // Get fileId from uploaded image
    const fileId = await uploadImageAndGetFileId(image);
    
    // Use GET request with fileId in URL path as per API requirements
    const targetUrl = userUrl.trim() || "abc";
    const response = await fetch(
      `${API_BASE_URL}/api/v1/generate/${fileId}/${targetUrl}`, 
      {
        method: 'GET', // Changed from POST to GET
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Process the response
    const variations = await response.json();
    
    console.log("Received variations:", variations);
    
    const processedVariations = variations.map((variation, index) => {
      try {
        // Handle different response formats
        let base64Data = '';
        
        console.log(`Processing variation ${index}:`, variation);
        
        if (variation.imageData) {
          if (typeof variation.imageData === 'string') {
            // If it's already a string, use it directly
            base64Data = variation.imageData.replace(/^data:image\/\w+;base64,/, '');
            console.log(`Variation ${index}: Using string data`);
          } else if (Array.isArray(variation.imageData)) {
            // If it's an array of numbers, convert to base64
            base64Data = bytesToBase64(variation.imageData);
            console.log(`Variation ${index}: Converted array data, length: ${variation.imageData.length}`);
          } else if (variation.imageData.data && Array.isArray(variation.imageData.data)) {
            // If it has a data property with array
            base64Data = bytesToBase64(variation.imageData.data);
            console.log(`Variation ${index}: Converted data.array, length: ${variation.imageData.data.length}`);
          } else if (variation.imageData.Data) {
            // If it has a Data property
            base64Data = variation.imageData.Data;
            console.log(`Variation ${index}: Using Data property`);
          } else {
            console.warn(`Variation ${index}: Unknown imageData format:`, typeof variation.imageData);
          }
        } else {
          console.warn(`Variation ${index}: No imageData property found`);
        }
        
        const result = {
          ...variation,
          processedImageData: base64Data ? 
            `data:image/jpeg;base64,${base64Data}` : 
            null
        };
        
        return result;
      } catch (error) {
        console.error(`Error processing variation ${index}:`, error);
        return { ...variation, processedImageData: null };
      }
    });

    // Filter out invalid variations
    const validVariations = processedVariations.filter(v => v.processedImageData);
    
    console.log(`Processed ${processedVariations.length} variations, ${validVariations.length} valid`);
    
    if (validVariations.length === 0) {
      throw new Error('No valid variations received');
    }

    // Update UI states
    setVariations(validVariations);
    setImage(validVariations[0].processedImageData);
    setShow3DModel(true);
    setShowProcessButtons(false);
    setShowIcon(false);
    setShowUrlInput(false);
    setShowDialUp(false);

  } catch (error) {
    console.error('API Error:', error);
    alert(`Failed to process image: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};

// Function to handle large arrays that might exceed the apply limit
function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 1024;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.slice(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
}

async function uploadImageAndGetFileId(image) {
  try {
    const file = base64ToFile(image, "image.jpg");
    console.log("Uploading image...");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/v1/uploadFile`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.fileId) {
      throw new Error('No fileId in response');
    }
    
    console.log("File uploaded successfully, fileId:", data.fileId);
    setFileId(data.fileId); // Store fileId in state for future use
    return data.fileId;

  } catch (error) {
    console.error('Upload Error:', error);
    throw new Error('Image upload failed. Please try again.');
  }
}

// 3. Add error boundaries and logging
function base64ToFile(base64Data, filename) {
  try {
    // Validate input
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Invalid base64 data');
    }

    // Handle data URIs by removing the prefix
    let cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Remove any line breaks and whitespace that might cause issues
    cleanBase64 = cleanBase64.replace(/[\r\n\s]/g, '');
    
    // Convert base64 to binary
    const binary = atob(cleanBase64);
    
    // Create array buffer from binary
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Determine MIME type from the data URI or use default
    let mime = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const mimeMatch = base64Data.match(/^data:(image\/[a-z]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1];
      }
    }
    
    // Create and return File object
    return new File([bytes], filename, { type: mime });
    
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error(`Failed to convert base64 to file: ${error.message}`);
  }
}


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
  
  // Modified touch handlers to respect minimum zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Handle pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistanceRef.current = distance;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Handle single touch for dragging
      isDraggingRef.current = true;
      const canvasElement = e.currentTarget;
      canvasElement.style.cursor = 'grabbing';
      
      const touch = e.touches[0];
      const rect = canvasElement.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / (rect.width / 2) - 1;
      const y = (touch.clientY - rect.top) / (rect.height / 2) - 1;
      
      setDragPosition({ x, y });
      setDebugInfo({ x, y });
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (isFrozen) return;
    if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistanceRef.current !== null) {
        const delta = distance - lastTouchDistanceRef.current;
        setZoomLevel(prev => Math.min(Math.max(prev + delta * 0.005, minZoom), 3));
      }

      lastTouchDistanceRef.current = distance;
      e.preventDefault();
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      // Existing single touch drag code...
      e.preventDefault();
      const touch = e.touches[0];
      const canvasElement = e.currentTarget;
      const rect = canvasElement.getBoundingClientRect();
      
      const x = (touch.clientX - rect.left) / (rect.width / 2) - 1;
      const y = (touch.clientY - rect.top) / (rect.height / 2) - 1;
      
      setDragPosition({ x, y });
      setDebugInfo({ x, y });
      
      updateImageBasedOnPosition({ x, y });
    }
  }, [updateImageBasedOnPosition, minZoom, isFrozen]);

  const handleTouchEnd = useCallback((e) => {
    lastTouchDistanceRef.current = null;
    isDraggingRef.current = false;
    const canvasElement = e.currentTarget;
    canvasElement.style.cursor = 'grab';
    
    if (e.touches.length === 0) {
      updateImageBasedOnPosition(dragPosition);
    }
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

  // Function to calculate minimum zoom level
  const calculateMinZoom = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const image = imageRef.current;
      
      // Calculate ratios
      const containerRatio = container.width / container.height;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      
      if (containerRatio > imageRatio) {
        // Container is wider than image ratio - fit to width
        setMinZoom(container.width / image.width);
      } else {
        // Container is taller than image ratio - fit to height
        setMinZoom(container.height / image.height);
      }
    }
  }, []);

  // Update minimum zoom when image or container size changes
  useEffect(() => {
    if (image !== DEFAULT_IMAGE) {
      const updateMinZoom = () => {
        calculateMinZoom();
      };
      
      window.addEventListener('resize', updateMinZoom);
      return () => window.removeEventListener('resize', updateMinZoom);
    }
  }, [image, calculateMinZoom]);

  // Add zoom control functions with minimum zoom check
  const handleZoomIn = (e) => {
    if (isFrozen) return;
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = (e) => {
    if (isFrozen) return;
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.2, minZoom));
  };

  // Add clear window drag handlers
  const handleClearWindowMouseDown = (e) => {
    if (image === DEFAULT_IMAGE || isFrozen) return;
    isDraggingWindowRef.current = true;
    e.stopPropagation();
  };

  const handleClearWindowMouseMove = useCallback((e) => {
    if (!isDraggingWindowRef.current || isFrozen) return;

    const container = containerRef.current.getBoundingClientRect();
    const clearWindow = clearWindowRef.current.getBoundingClientRect();
    
    // Calculate new position in percentages
    let newX = ((e.clientX - container.left - clearWindow.width / 2) / container.width) * 100;
    let newY = ((e.clientY - container.top - clearWindow.height / 2) / container.height) * 100;
    
    // Clamp values to keep window within container
    newX = Math.max(0, Math.min(100 - (clearWindow.width / container.width) * 100, newX));
    newY = Math.max(0, Math.min(100 - (clearWindow.height / container.height) * 100, newY));
    
    setClearWindowPosition({ x: newX, y: newY });
    e.preventDefault();
  }, [isFrozen]);

  const handleClearWindowMouseUp = () => {
    isDraggingWindowRef.current = false;
  };

  // Add event listeners for window dragging
  useEffect(() => {
    if (image !== DEFAULT_IMAGE) {
      window.addEventListener('mousemove', handleClearWindowMouseMove);
      window.addEventListener('mouseup', handleClearWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleClearWindowMouseMove);
        window.removeEventListener('mouseup', handleClearWindowMouseUp);
      };
    }
  }, [image, handleClearWindowMouseMove]);

  // Handle double click on clear window
  const handleClearWindowDoubleClick = (e) => {
    e.stopPropagation();
    setIsFrozen(!isFrozen); // Toggle frozen state
  };

  // Extract selected section
  const extractSelectedSection = useCallback(() => {
    if (!clearWindowRef.current || !containerRef.current) return;

    // Create a canvas to capture the clear window content
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Get the container and clear window elements
    const container = containerRef.current.getBoundingClientRect();
    const clearWindow = clearWindowRef.current;
    
    // First, create a canvas that matches the clear window size
    canvas.width = clearWindow.offsetWidth;
    canvas.height = clearWindow.offsetHeight;

    // Find the image element inside the clear window
    const clearImage = clearWindow.querySelector('img');
    if (!clearImage) return;

    // Calculate the visible portion coordinates
    const scale = zoomLevel;
    const offsetX = (clearWindowPosition.x / 100) * clearImage.width * scale;
    const offsetY = (clearWindowPosition.y / 100) * clearImage.height * scale;

    // Draw the visible portion
    ctx.drawImage(
      clearImage,
      -offsetX,
      -offsetY,
      clearImage.width * scale,
      clearImage.height * scale
    );

    // Create a new canvas for the final output at container size
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    outputCanvas.width = container.width;
    outputCanvas.height = container.height;

    // Draw the captured content stretched to container size
    outputCtx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);

    // Convert to base64
    const extractedImage = outputCanvas.toDataURL('image/jpeg', 1.0);

    // Update state
    setSelectedSection(extractedImage);
    setImage(extractedImage);
    
    // Reset states
    setShowIcon(false);
    setShowUrlInput(false);
    setZoomLevel(1);
    setIsFrozen(false);

  }, [clearWindowPosition, zoomLevel]);

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
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: "2px",
              pointerEvents: image !== DEFAULT_IMAGE ? "auto" : "none",
              position: "relative",
              zIndex: 1,
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              backdropFilter: "none"
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                  ref={imageRef}
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
                    animation: isProcessing ? "imageDim 4s ease-in-out infinite" : "none",
                    filter: (image !== DEFAULT_IMAGE && !selectedSection) ? "blur(8px)" : "none",
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.2s ease-out"
                  }}
                  onLoad={calculateMinZoom}
                  onError={(e) => {
                    console.error('Image loading error:', e);
                    setImage(DEFAULT_IMAGE);
                  }}
                />

                {/* Clear Window */}
                {image !== DEFAULT_IMAGE && !selectedSection && (
                  <div
                    ref={clearWindowRef}
                    style={{
                      position: "absolute",
                      left: `${clearWindowPosition.x}%`,
                      top: `${clearWindowPosition.y}%`,
                      width: isMobile ? "150px" : "250px",
                      height: isMobile ? "150px" : "250px",
                      cursor: isFrozen ? "default" : "move",
                      pointerEvents: "auto",
                      zIndex: 3,
                      touchAction: "none"
                    }}
                    onMouseDown={handleClearWindowMouseDown}
                    onDoubleClick={handleClearWindowDoubleClick}
                    onTouchStart={handleClearWindowTouchStart}
                    onTouchMove={handleClearWindowTouchMove}
                    onTouchEnd={handleClearWindowTouchEnd}
                  >
                    {/* Clear Window Border */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        border: `2px solid ${isFrozen ? "rgba(64, 255, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"}`,
                        borderRadius: "6px",
                        boxShadow: isFrozen 
                          ? "0 0 10px rgba(64, 255, 0, 0.5), 0 0 20px rgba(64, 255, 0, 0.3)" 
                          : "0 0 10px rgba(0, 0, 0, 0.3)",
                        pointerEvents: "none",
                        transition: "all 0.3s ease"
                      }}
                    />
                    {/* Clear Window Content */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: "4px"
                      }}
                    >
                      <img
                        src={image}
                        alt="Clear Preview"
                        style={{
                          width: `${100 * (containerRef.current?.offsetWidth || 340) / 100}px`,
                          height: `${100 * (containerRef.current?.offsetHeight || 340) / 100}px`,
                          objectFit: "cover",
                          objectPosition: "center",
                          transform: `scale(${zoomLevel}) translate(${-clearWindowPosition.x}%, ${-clearWindowPosition.y}%)`,
                          transformOrigin: "top left",
                          pointerEvents: "none"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Zoom Controls for Desktop */}
                {!isMobile && image !== DEFAULT_IMAGE && !selectedSection && (
                  <div style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 2,
                    pointerEvents: "auto"
                  }}>
                    <button
                      onClick={handleZoomIn}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "4px",
                        border: "none",
                        background: "rgba(255, 255, 255, 0.8)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#002496"
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={handleZoomOut}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "4px",
                        border: "none",
                        background: "rgba(255, 255, 255, 0.8)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#002496"
                      }}
                    >
                      -
                    </button>
                  </div>
                )}
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
                        justifyContent: "center",
                        gap: "10px"
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
                                  background: isFrozen ? "#40ff00" : "#a0a0a0",
                                  border: "none",
                                  color: "white",
                                  cursor: isFrozen ? "pointer" : "not-allowed",
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
                                onClick={(e) => {
                                  if (!isFrozen) return;
                                  extractSelectedSection();
                                  handleProcessClick(e);
                                }}
                                type="button"
                              >
                                Link
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                        
                        {/* Freeze instruction message */}
                        {/* {!isFrozen && image !== DEFAULT_IMAGE && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              position: "absolute",
                              bottom: "-20px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "12px",
                              color: "#4a90e2",
                              whiteSpace: "nowrap",
                              textAlign: "center",
                              width: "100%"
                            }}
                          >
                            Double-click the clear window to freeze image before linking
                          </motion.div>
                        )} */}

                        {isMobile && (
                          <>
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.6 }}
                              style={{
                                padding: "16px",
                                background: isFrozen ? "#40ff00" : "#a0a0a0",
                                border: "none",
                                color: "white",
                                cursor: isFrozen ? "pointer" : "not-allowed",
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
                              onClick={(e) => {
                                if (!isFrozen) return;
                                extractSelectedSection();
                                handleProcessClick(e);
                              }}
                              type="button"
                            >
                              Link
                            </motion.button>
                            
                            {/* Mobile freeze instruction message */}
                            {/* {!isFrozen && image !== DEFAULT_IMAGE && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                  position: "absolute",
                                  top: "calc(50% + 65px)",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  fontSize: "12px",
                                  color: "#4a90e2",
                                  whiteSpace: "nowrap",
                                  textAlign: "center",
                                  width: "100%"
                                }}
                              >
                                Double-tap clear window to freeze image
                              </motion.div>
                            )} */}
                          </>
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