import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import {
  Box,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';

interface STLViewerProps {
  fileUrl?: string | null;
  file?: File | null;
  fileName?: string;
  width?: string | number;
  height?: string | number;
  onLoad?: (geometry: THREE.BufferGeometry) => void;
  onError?: (error: Error) => void;
}

const MinimalModel: React.FC<{ geometry: THREE.BufferGeometry }> = ({ geometry }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
};

const MinimalSTLViewer: React.FC<STLViewerProps> = ({
  fileUrl,
  file,
  fileName,
  width = '100%',
  height = '400px',
  onLoad,
  onError,
}) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file && !fileUrl) {
      setGeometry(null);
      return;
    }

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      try {
        let buffer: ArrayBuffer;

        if (file) {
          buffer = await file.arrayBuffer();
        } else if (fileUrl) {
          const response = await fetch(fileUrl);
          buffer = await response.arrayBuffer();
        } else {
          throw new Error('No file or fileUrl provided');
        }

        const loader = new STLLoader();
        const loadedGeometry = loader.parse(buffer);
        
        // Calculate bounding box and scale the geometry
        loadedGeometry.computeBoundingBox();
        const box = new THREE.Box3();
        const positionAttribute = loadedGeometry.getAttribute('position');
        box.setFromBufferAttribute(positionAttribute as THREE.BufferAttribute);

        // Center the geometry
        const center = box.getCenter(new THREE.Vector3());
        loadedGeometry.translate(-center.x, -center.y, -center.z);

        // Scale the geometry to fit in a reasonable size
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
          const scale = 2 / maxDimension;
          loadedGeometry.scale(scale, scale, scale);
        }

        loadedGeometry.computeVertexNormals();
        setGeometry(loadedGeometry);
        onLoad?.(loadedGeometry);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
        setError(errorMessage);
        onError?.(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [file, fileUrl, onLoad, onError]);

  if (loading) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!geometry) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No model loaded
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width, height, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <MinimalModel geometry={geometry} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </Box>
  );
};

export default MinimalSTLViewer;
