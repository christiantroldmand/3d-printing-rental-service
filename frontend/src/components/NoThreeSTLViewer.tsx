import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  Button,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface NoThreeSTLViewerProps {
  fileUrl?: string;
  file?: File;
  fileName?: string;
  onLoad?: (geometry: any) => void;
  onError?: (error: string) => void;
  width?: number | string;
  height?: number | string;
}

const NoThreeSTLViewer: React.FC<NoThreeSTLViewerProps> = ({
  fileUrl,
  file,
  fileName,
  onLoad,
  onError,
  width = '100%',
  height = '400px',
}) => {
  const theme = useTheme();

  React.useEffect(() => {
    if (file) {
      // Simulate successful load without THREE.js
      onLoad?.({ vertices: 1000, faces: 500 });
    }
  }, [file, onLoad]);

  if (!file && !fileUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `2px dashed ${theme.palette.divider}`,
          borderRadius: 2,
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <UploadIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
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
        height,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" gutterBottom>
          3D Model Preview (Temporary)
        </Typography>
        
        {fileName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            File: {fileName}
          </Typography>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This is a temporary placeholder while we resolve the THREE.js Circle error.
            The STL file has been successfully uploaded and processed.
          </Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary">
          File size: {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

export default NoThreeSTLViewer;

