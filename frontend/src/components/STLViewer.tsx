import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  ViewInAr as ViewInArIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

interface STLViewerProps {
  fileUrl?: string;
  fileName?: string;
  onLoad?: (geometry: THREE.BufferGeometry) => void;
  onError?: (error: string) => void;
  showControls?: boolean;
  showGrid?: boolean;
  showStats?: boolean;
  width?: number | string;
  height?: number | string;
}

interface ModelProps {
  url: string;
  onLoad: (geometry: THREE.BufferGeometry) => void;
  onError: (error: string) => void;
}

const Model: React.FC<ModelProps> = ({ url, onLoad, onError }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadModel = async () => {
      try {
        let geometry: THREE.BufferGeometry;

        if (url.endsWith('.stl')) {
          const loader = new STLLoader();
          geometry = await new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
        } else if (url.endsWith('.obj')) {
          const loader = new OBJLoader();
          const object = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
          // Extract geometry from OBJ object
          geometry = new THREE.BufferGeometry();
          const vertices: number[] = [];
          const normals: number[] = [];
          
          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              const childGeometry = child.geometry;
              if (childGeometry.attributes.position) {
                const positions = childGeometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                  vertices.push(positions[i], positions[i + 1], positions[i + 2]);
                }
              }
              if (childGeometry.attributes.normal) {
                const normalsArray = childGeometry.attributes.normal.array;
                for (let i = 0; i < normalsArray.length; i += 3) {
                  normals.push(normalsArray[i], normalsArray[i + 1], normalsArray[i + 2]);
                }
              }
            }
          });
          
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          if (normals.length > 0) {
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
          }
        } else {
          throw new Error('Unsupported file format');
        }

        // Compute bounding box and center the model
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const center = box.getCenter(new THREE.Vector3());
        geometry.translate(-center.x, -center.y, -center.z);

        // Compute normals if not present
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }

        onLoad(geometry);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
        setError(errorMessage);
        onError(errorMessage);
        setLoading(false);
      }
    };

    loadModel();
  }, [url, onLoad, onError]);

  useFrame((state) => {
    if (meshRef.current) {
      // Add subtle rotation animation
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (loading) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Loading...
      </Text>
    );
  }

  if (error) {
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.3}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        Error: {error}
      </Text>
    );
  }

  return (
    <mesh ref={meshRef}>
      <bufferGeometry />
      <meshStandardMaterial
        color="#6366f1"
        metalness={0.1}
        roughness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const STLViewer: React.FC<STLViewerProps> = ({
  fileUrl,
  fileName,
  onLoad,
  onError,
  showControls = true,
  showGrid = true,
  showStats = false,
  width = '100%',
  height = '400px',
}) => {
  const theme = useTheme();
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [showGridState, setShowGridState] = useState(showGrid);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const handleLoad = (loadedGeometry: THREE.BufferGeometry) => {
    setGeometry(loadedGeometry);
    setError(null);
    onLoad?.(loadedGeometry);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const zoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(0.5);
    }
  };

  const zoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(0.5);
    }
  };

  const fitToView = () => {
    if (controlsRef.current && geometry) {
      const box = new THREE.Box3();
      box.setFromObject(new THREE.Mesh(geometry));
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = 75; // Default camera FOV
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      
      controlsRef.current.object.position.set(cameraZ, cameraZ, cameraZ);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!fileUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2,
          border: `2px dashed ${theme.palette.grey[300]}`,
        }}
      >
        <Box textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No 3D Model Loaded
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload an STL, OBJ, or 3MF file to preview
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width,
        height: isFullscreen ? '100vh' : height,
        position: 'relative',
        backgroundColor: theme.palette.grey[900],
        borderRadius: isFullscreen ? 0 : 2,
        overflow: 'hidden',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1 }}>
          {error}
        </Alert>
      )}

      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1,
          }}
        >
          <Tooltip title="Zoom In">
            <IconButton
              size="small"
              onClick={zoomIn}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton
              size="small"
              onClick={zoomOut}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset View">
            <IconButton
              size="small"
              onClick={resetView}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fit to View">
            <IconButton
              size="small"
              onClick={fitToView}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <ViewInArIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showGridState ? "Hide Grid" : "Show Grid"}>
            <IconButton
              size="small"
              onClick={() => setShowGridState(!showGridState)}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              {showGridState ? <GridOffIcon /> : <GridOnIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {showGridState && (
          <Grid
            args={[10, 10]}
            cellSize={1}
            cellThickness={0.5}
            cellColor={theme.palette.grey[600]}
            sectionSize={5}
            sectionThickness={1}
            sectionColor={theme.palette.primary.main}
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={true}
          />
        )}
        
        <Model url={fileUrl} onLoad={handleLoad} onError={handleError} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={50}
        />
        
        <Environment preset="studio" />
      </Canvas>

      {fileName && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption">
            {fileName}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default STLViewer;
