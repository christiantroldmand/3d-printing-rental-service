import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface PrintMaterial {
  id: string;
  name: string;
  type: string;
  density: number;
  costPerGram: number;
  printTempMin: number;
  printTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeed: number;
  shrinkageFactor: number;
  isActive: boolean;
  inventory: MaterialInventory[];
}

interface MaterialInventory {
  id: string;
  color: string;
  stock: number;
  minStock: number;
  maxStock: number;
  isAvailable: boolean;
}

interface MaterialManagementProps {
  isAdmin?: boolean;
}

const MaterialManagement: React.FC<MaterialManagementProps> = ({ isAdmin = false }) => {
  const theme = useTheme();
  const [materials, setMaterials] = useState<PrintMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<PrintMaterial | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'PLA',
    density: 1.24,
    costPerGram: 0.05,
    printTempMin: 190,
    printTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 70,
    printSpeed: 1.0,
    shrinkageFactor: 0.02,
  });

  const materialTypes = [
    'PLA',
    'PETG', 
    'ABS',
    'TPU',
    'WOOD_FILLED',
    'METAL_FILLED',
    'CARBON_FIBER',
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async () => {
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create material');

      setSuccess('Material created successfully');
      setOpenDialog(false);
      resetForm();
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create material');
    }
  };

  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return;

    try {
      const response = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update material');

      setSuccess('Material updated successfully');
      setOpenDialog(false);
      resetForm();
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update material');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete material');

      setSuccess('Material deleted successfully');
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  const handleEditMaterial = (material: PrintMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      density: material.density,
      costPerGram: material.costPerGram,
      printTempMin: material.printTempMin,
      printTempMax: material.printTempMax,
      bedTempMin: material.bedTempMin,
      bedTempMax: material.bedTempMax,
      printSpeed: material.printSpeed,
      shrinkageFactor: material.shrinkageFactor,
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'PLA',
      density: 1.24,
      costPerGram: 0.05,
      printTempMin: 190,
      printTempMax: 220,
      bedTempMin: 50,
      bedTempMax: 70,
      printSpeed: 1.0,
      shrinkageFactor: 0.02,
    });
    setSelectedMaterial(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setOpenDialog(true);
  };

  const getStockStatus = (inventory: MaterialInventory[]) => {
    const totalStock = inventory.reduce((sum, inv) => sum + inv.stock, 0);
    const lowStockItems = inventory.filter(inv => inv.stock <= inv.minStock);
    
    if (lowStockItems.length > 0) return { status: 'low', count: lowStockItems.length };
    if (totalStock === 0) return { status: 'out', count: 0 };
    return { status: 'good', count: 0 };
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'low': return 'warning';
      case 'out': return 'error';
      default: return 'success';
    }
  };

  const filteredMaterials = materials.filter(material => {
    if (filterType !== 'all' && material.type !== filterType) return false;
    if (lowStockOnly) {
      const stockStatus = getStockStatus(material.inventory);
      return stockStatus.status === 'low' || stockStatus.status === 'out';
    }
    return true;
  });

  const getTotalLowStockCount = () => {
    return materials.reduce((count, material) => {
      const stockStatus = getStockStatus(material.inventory);
      return count + (stockStatus.status === 'low' || stockStatus.status === 'out' ? 1 : 0);
    }, 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading materials...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Material Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage 3D printing materials and inventory
          </Typography>
        </Box>
        
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            size="large"
          >
            Add Material
          </Button>
        )}
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Material Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {materialTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                />
              }
              label="Low Stock Only"
            />

            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchMaterials}
              variant="outlined"
            >
              Refresh
            </Button>

            {getTotalLowStockCount() > 0 && (
              <Badge badgeContent={getTotalLowStockCount()} color="warning">
                <Chip
                  icon={<WarningIcon />}
                  label={`${getTotalLowStockCount()} materials need attention`}
                  color="warning"
                  variant="outlined"
                />
              </Badge>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Material</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Density</TableCell>
              <TableCell>Cost/Gram</TableCell>
              <TableCell>Print Temp</TableCell>
              <TableCell>Bed Temp</TableCell>
              <TableCell>Print Speed</TableCell>
              <TableCell>Stock Status</TableCell>
              <TableCell>Colors</TableCell>
              {isAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMaterials.map((material) => {
              const stockStatus = getStockStatus(material.inventory);
              const availableColors = material.inventory.filter(inv => inv.isAvailable && inv.stock > 0);
              
              return (
                <TableRow key={material.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {material.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Shrinkage: {(material.shrinkageFactor * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip label={material.type} size="small" />
                  </TableCell>
                  
                  <TableCell>{material.density} g/cm³</TableCell>
                  
                  <TableCell>€{material.costPerGram.toFixed(3)}</TableCell>
                  
                  <TableCell>
                    {material.printTempMin}°C - {material.printTempMax}°C
                  </TableCell>
                  
                  <TableCell>
                    {material.bedTempMin}°C - {material.bedTempMax}°C
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {(material.printSpeed * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={stockStatus.status === 'good' ? <CheckCircleIcon /> : <WarningIcon />}
                      label={
                        stockStatus.status === 'low' 
                          ? `${stockStatus.count} low stock`
                          : stockStatus.status === 'out'
                          ? 'Out of stock'
                          : 'Good'
                      }
                      color={getStockColor(stockStatus.status) as any}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {availableColors.slice(0, 3).map((inv) => (
                        <Chip
                          key={inv.id}
                          label={inv.color}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {availableColors.length > 3 && (
                        <Chip
                          label={`+${availableColors.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  
                  {isAdmin && (
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Material">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Material">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Material' : 'Edit Material'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Material Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Material Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Material Type"
                >
                  {materialTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Density (g/cm³)"
                type="number"
                value={formData.density}
                onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cost per Gram (€)"
                type="number"
                value={formData.costPerGram}
                onChange={(e) => setFormData({ ...formData, costPerGram: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ step: 0.001, min: 0 }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Print Temp Min (°C)"
                type="number"
                value={formData.printTempMin}
                onChange={(e) => setFormData({ ...formData, printTempMin: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Print Temp Max (°C)"
                type="number"
                value={formData.printTempMax}
                onChange={(e) => setFormData({ ...formData, printTempMax: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bed Temp Min (°C)"
                type="number"
                value={formData.bedTempMin}
                onChange={(e) => setFormData({ ...formData, bedTempMin: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bed Temp Max (°C)"
                type="number"
                value={formData.bedTempMax}
                onChange={(e) => setFormData({ ...formData, bedTempMax: parseInt(e.target.value) || 0 })}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Print Speed Multiplier"
                type="number"
                value={formData.printSpeed}
                onChange={(e) => setFormData({ ...formData, printSpeed: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ step: 0.1, min: 0, max: 1 }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Shrinkage Factor"
                type="number"
                value={formData.shrinkageFactor}
                onChange={(e) => setFormData({ ...formData, shrinkageFactor: parseFloat(e.target.value) || 0 })}
                required
                inputProps={{ step: 0.001, min: 0, max: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={dialogMode === 'create' ? handleCreateMaterial : handleUpdateMaterial}
            variant="contained"
            disabled={!formData.name || !formData.type}
          >
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialManagement;
