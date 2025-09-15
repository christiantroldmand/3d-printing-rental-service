import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  useTheme,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import MinimalSTLViewer from './MinimalSTLViewer';
import ThingiverseImport from './ThingiverseImport';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File | null;
  fileUrl?: string | null;
  loading?: boolean;
  error?: string | null;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  showPreview?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  fileUrl,
  loading = false,
  error = null,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['.stl', '.obj', '.3mf'],
  showPreview = true,
}) => {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [thingiverseOpen, setThingiverseOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'application/sla': ['.stl'],
      'application/octet-stream': ['.stl'],
      'model/stl': ['.stl'],
      'model/obj': ['.obj'],
      'application/obj': ['.obj'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'application/3mf': ['.3mf'],
      'model/3mf': ['.3mf'],
    },
    maxSize,
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'stl':
        return '📐';
      case 'obj':
        return '🔺';
      case '3mf':
        return '📦';
      case 'glb':
      case 'gltf':
        return '🎨';
      default:
        return '📄';
    }
  };

  const handleThingiverseImport = async (modelId: string, selectedFileIndex: number) => {
    try {
      const response = await fetch(`/api/thingiverse/import/${modelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ selectedFileIndex }),
      });

      if (!response.ok) {
        throw new Error('Failed to import model from Thingiverse');
      }

      const result = await response.json();
      // Create a fake File object for the imported model
      const fakeFile = new File([''], result.stlFileId, { type: 'application/sla' });
      onFileSelect(fakeFile);
    } catch (err) {
      console.error('Error importing from Thingiverse:', err);
    }
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Upload File" />
        <Tab label="Import from Thingiverse" />
      </Tabs>

      {tabValue === 0 && (
        <Paper
          {...getRootProps()}
          data-testid="dropzone"
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            border: `2px dashed ${
              isDragReject
                ? theme.palette.error.main
                : isDragActive || dragActive
                ? theme.palette.primary.main
                : theme.palette.grey[300]
            }`,
            backgroundColor: isDragActive
              ? theme.palette.primary.light + '20'
              : theme.palette.grey[50],
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light + '10',
            },
          }}
        >
        <input {...getInputProps()} />
        
        <UploadIcon
          sx={{
            fontSize: 48,
            color: isDragReject
              ? theme.palette.error.main
              : isDragActive
              ? theme.palette.primary.main
              : theme.palette.grey[400],
            mb: 2,
          }}
        />
        
        <Typography variant="h6" gutterBottom>
          {isDragReject
            ? 'File type not supported'
            : isDragActive
            ? 'Drop your 3D file here'
            : 'Drag & drop your 3D file here'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to browse files
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Supported formats: {acceptedTypes.join(', ')} • Max size: {formatFileSize(maxSize)}
        </Typography>
      </Paper>
      )}

      {tabValue === 1 && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Import 3D Models from Thingiverse
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Browse thousands of free 3D models and import them directly to your project
          </Typography>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => setThingiverseOpen(true)}
            size="large"
          >
            Browse Thingiverse
          </Button>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Processing file...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <Paper
          sx={{
            p: 2,
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.success.light + '20',
            border: `1px solid ${theme.palette.success.main}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {getFileIcon(selectedFile.name)}
            </Typography>
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showPreview && fileUrl && (
              <Button
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => {
                  // This would open a preview modal or expand the preview
                  console.log('Preview file:', selectedFile.name);
                }}
              >
                Preview
              </Button>
            )}
            
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onFileRemove}
            >
              Remove
            </Button>
          </Box>
        </Paper>
      )}

      {/* 3D Preview */}
      {showPreview && fileUrl && selectedFile && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            3D Preview
          </Typography>
          <MinimalSTLViewer
            file={selectedFile}
            fileName={selectedFile.name}
            width="100%"
            height="400px"
            onLoad={(geometry) => {
              console.log('3D model loaded:', geometry);
            }}
            onError={(error) => {
              console.error('3D model error:', error);
            }}
          />
        </Box>
      )}

      <ThingiverseImport
        open={thingiverseOpen}
        onClose={() => setThingiverseOpen(false)}
        onModelImport={handleThingiverseImport}
      />
    </Box>
  );
};

export default FileUpload;
