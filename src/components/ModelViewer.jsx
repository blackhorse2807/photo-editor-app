import React, { useEffect, useRef } from 'react';

const ModelViewer = () => {
  const modelViewerRef = useRef(null);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      // Add error handling
      modelViewer.addEventListener('error', (error) => {
        console.error('Error loading model:', error);
      });

      // Add load handling
      modelViewer.addEventListener('load', () => {
        console.log('Model loaded successfully');
      });
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <model-viewer
        ref={modelViewerRef}
        src="/images/track-ball-3d.glb"
        alt="3D model"
        auto-rotate
        camera-controls
        shadow-intensity="1"
        exposure="1"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          '--progress-bar-color': '#40ff00',
          '--progress-bar-height': '2px',
        }}
        poster="/images/icon.png"
        loading="eager"
        reveal="auto"
      >
        <div className="progress-bar hide" slot="progress-bar">
          <div className="update-bar"></div>
        </div>
        <div slot="poster" style={{
          backgroundColor: '#f5f5f5',
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          Loading 3D model...
        </div>
      </model-viewer>
    </div>
  );
};

export default ModelViewer; 