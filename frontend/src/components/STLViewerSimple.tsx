import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
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
  file?: File;
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
  url?: string;
  file?: File;
  onLoad: (geometry: THREE.BufferGeometry) => void;
  onError: (error: string) => void;
}

const Model: React.FC<ModelProps> = ({ url, file, onLoad, onError }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);
        let loadedGeometry: THREE.BufferGeometry;

        if (file) {
          // Handle File object
          const arrayBuffer = await file.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          
          if (file.name.toLowerCase().endsWith('.stl')) {
            const loader = new STLLoader();
            loadedGeometry = loader.parse(data.buffer);
          } else if (file.name.toLowerCase().endsWith('.obj')) {
            const loader = new OBJLoader();
            const object = loader.parse(new TextDecoder().decode(data));
            // Extract geometry from OBJ object
            loadedGeometry = new THREE.BufferGeometry();
            const vertices: number[] = [];
            const normals: number[] = [];
            
            object.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const childGeometry = child.geometry;
                if (childGeometry instanceof THREE.BufferGeometry) {
                  const position = childGeometry.getAttribute('position');
                  const normal = childGeometry.getAttribute('normal');
                  
                  if (position) {
                    for (let i = 0; i < position.count; i++) {
                      vertices.push(position.getX(i), position.getY(i), position.getZ(i));
                    }
                  }
                  
                  if (normal) {
                    for (let i = 0; i < normal.count; i++) {
                      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
                    }
                  }
                }
              }
            });
            
            loadedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            if (normals.length > 0) {
              loadedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            }
          } else {
            throw new Error('Unsupported file format');
          }
        } else if (url) {
          // Handle URL
          if (url.endsWith('.stl') || url.toLowerCase().includes('.stl')) {
            const loader = new STLLoader();
            loadedGeometry = await new Promise((resolve, reject) => {
              loader.load(url, resolve, undefined, reject);
            });
          } else if (url.endsWith('.obj') || url.toLowerCase().includes('.obj')) {
            const loader = new OBJLoader();
            const object = await new Promise<THREE.Group>((resolve, reject) => {
              loader.load(url, resolve, undefined, reject);
            });
            // Extract geometry from OBJ object
            loadedGeometry = new THREE.BufferGeometry();
            const vertices: number[] = [];
            const normals: number[] = [];
            
            object.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                const childGeometry = child.geometry;
                if (childGeometry instanceof THREE.BufferGeometry) {
                  const position = childGeometry.getAttribute('position');
                  const normal = childGeometry.getAttribute('normal');
                  
                  if (position) {
                    for (let i = 0; i < position.count; i++) {
                      vertices.push(position.getX(i), position.getY(i), position.getZ(i));
                    }
                  }
                  
                  if (normal) {
                    for (let i = 0; i < normal.count; i++) {
                      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
                    }
                  }
                }
              }
            });
            
            loadedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            if (normals.length > 0) {
              loadedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            }
          } else {
            throw new Error('Unsupported file format');
          }
        } else {
          throw new Error('No file or URL provided');
        }

        // Compute normals if not present
        if (!loadedGeometry.getAttribute('normal')) {
          loadedGeometry.computeVertexNormals();
        }

        // Compute bounding box
        loadedGeometry.computeBoundingBox();
        const box = new THREE.Box3();
        const positionAttribute = loadedGeometry.getAttribute('position');
        if (positionAttribute) {
          box.setFromBufferAttribute(positionAttribute as THREE.BufferAttribute);
        }

        // Center the geometry
        const center = box.getCenter(new THREE.Vector3());
        loadedGeometry.translate(-center.x, -center.y, -center.z);

        // Scale to fit in view
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = maxDimension > 0 ? 2 / maxDimension : 1;
        loadedGeometry.scale(scale, scale, scale);

        setGeometry(loadedGeometry);
        onLoad(loadedGeometry);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
        setError(errorMessage);
        onError(errorMessage);
        setLoading(false);
      }
    };

    loadModel();
  }, [url, file, onLoad, onError]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading 3D model...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
};

// Simple Grid Component without external dependencies
const SimpleGrid: React.FC = () => {
  return (
    <Grid 
      args={[10, 10]} 
      position={[0, -2, 0]}
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#6f6f6f"
      sectionSize={1}
      sectionThickness={1}
      sectionColor="#9d4edd"
      fadeDistance={30}
      fadeStrength={1}
    />
  );
};

const STLViewerSimple: React.FC<STLViewerProps> = ({
  fileUrl,
  file,
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
  const [showGridState, setShowGridState] = useState(showGrid);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  const handleLoad = (loadedGeometry: THREE.BufferGeometry) => {
    setGeometry(loadedGeometry);
    onLoad?.(loadedGeometry);
  };

  const handleError = (error: string) => {
    onError?.(error);
  };

  const handleToggleGrid = () => {
    setShowGridState(!showGridState);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!file && !fileUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
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
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Model
          url={fileUrl}
          file={file}
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {/* Grid temporarily disabled to debug Circle error */}
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>

      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Tooltip title={showGridState ? 'Hide Grid' : 'Show Grid'}>
            <IconButton onClick={handleToggleGrid} size="small">
              {showGridState ? <GridOffIcon /> : <GridOnIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={handleFullscreen} size="small">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {fileName && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption">{fileName}</Typography>
        </Box>
      )}

      {showStats && geometry && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption">
            Vertices: {geometry.getAttribute('position')?.count || 0}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default STLViewerSimple;

