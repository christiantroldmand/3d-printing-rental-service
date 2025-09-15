import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Download as DownloadCountIcon,
  Visibility as ViewCountIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ThingiverseModel {
  id: string;
  name: string;
  thumbnail: string;
  creator: {
    name: string;
    url: string;
  };
  downloadCount: number;
  likeCount: number;
  viewCount: number;
}

interface ThingiverseSearchResult {
  hits: ThingiverseModel[];
  total: number;
  page: number;
  perPage: number;
}

interface ThingiverseImportProps {
  onModelImport: (modelId: string, selectedFileIndex: number) => void;
  onClose: () => void;
  open: boolean;
}

const ThingiverseImport: React.FC<ThingiverseImportProps> = ({
  onModelImport,
  onClose,
  open,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ThingiverseSearchResult | null>(null);
  const [popularModels, setPopularModels] = useState<ThingiverseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ThingiverseModel | null>(null);
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open) {
      loadPopularModels();
    }
  }, [open]);

  const loadPopularModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/thingiverse/popular?perPage=12');
      if (!response.ok) throw new Error('Failed to load popular models');
      
      const data = await response.json();
      setPopularModels(data.hits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load popular models');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/thingiverse/search?q=${encodeURIComponent(searchQuery)}&perPage=20`);
      if (!response.ok) throw new Error('Failed to search models');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = async (model: ThingiverseModel) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/thingiverse/model/${model.id}`);
      if (!response.ok) throw new Error('Failed to load model details');
      
      const details = await response.json();
      setModelDetails(details);
      setSelectedModel(model);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model details');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (selectedModel) {
      onModelImport(selectedModel.id, selectedFileIndex);
      onClose();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderModelCard = (model: ThingiverseModel) => (
    <motion.div
      key={model.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
        }}
        onClick={() => handleModelSelect(model)}
      >
        <CardMedia
          component="img"
          height="200"
          image={model.thumbnail}
          alt={model.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography variant="h6" noWrap title={model.name}>
            {model.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            by {model.creator.name}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              icon={<DownloadCountIcon />}
              label={formatNumber(model.downloadCount)}
              size="small"
              color="primary"
            />
            <Chip
              icon={<StarIcon />}
              label={formatNumber(model.likeCount)}
              size="small"
              color="secondary"
            />
            <Chip
              icon={<ViewCountIcon />}
              label={formatNumber(model.viewCount)}
              size="small"
              color="default"
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Import from Thingiverse</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Search" />
          <Tab label="Popular" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search for 3D models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Search
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {searchResults && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Search Results ({searchResults.total} models found)
                </Typography>
                <Grid container spacing={2}>
                  {searchResults.hits.map(renderModelCard)}
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Popular Models
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {popularModels.map(renderModelCard)}
              </Grid>
            )}
          </Box>
        )}

        {selectedModel && modelDetails && (
          <Box sx={{ mt: 3, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Selected Model: {selectedModel.name}
            </Typography>
            
            {modelDetails.files && modelDetails.files.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Files:
                </Typography>
                {modelDetails.files.map((file: any, index: number) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onClick={() => setSelectedFileIndex(index)}
                    color={selectedFileIndex === index ? 'primary' : 'default'}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!selectedModel}
          startIcon={<DownloadIcon />}
        >
          Import Model
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThingiverseImport;
