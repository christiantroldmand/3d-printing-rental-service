import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Palette as PaletteIcon,
  Speed as SpeedIcon,
  Thermostat as ThermostatIcon,
  Scale as ScaleIcon,
} from '@mui/icons-material';

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

interface MaterialSelectorProps {
  selectedMaterial?: PrintMaterial | null;
  selectedColor?: string;
  onMaterialChange: (material: PrintMaterial | null) => void;
  onColorChange: (color: string) => void;
  disabled?: boolean;
  showDetails?: boolean;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedMaterial,
  selectedColor,
  onMaterialChange,
  onColorChange,
  disabled = false,
  showDetails = true,
}) => {
  const [materials, setMaterials] = useState<PrintMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    onMaterialChange(material || null);
    
    // Reset color selection when material changes
    if (material && material.inventory.length > 0) {
      const firstAvailableColor = material.inventory.find(inv => inv.isAvailable && inv.stock > 0);
      if (firstAvailableColor) {
        onColorChange(firstAvailableColor.color);
      } else {
        onColorChange('');
      }
    } else {
      onColorChange('');
    }
  };

  const handleColorChange = (color: string) => {
    onColorChange(color);
  };

  const getAvailableColors = (material: PrintMaterial) => {
    return material.inventory.filter(inv => inv.isAvailable && inv.stock > 0);
  };

  const getStockStatus = (inventory: MaterialInventory[]) => {
    const totalStock = inventory.reduce((sum, inv) => sum + inv.stock, 0);
    const lowStockItems = inventory.filter(inv => inv.stock <= inv.minStock);
    
    if (lowStockItems.length > 0) return 'low';
    if (totalStock === 0) return 'out';
    return 'good';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'low': return 'warning';
      case 'out': return 'error';
      default: return 'success';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading materials...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Material Selection */}
      <FormControl fullWidth disabled={disabled} sx={{ mb: 3 }}>
        <InputLabel>Select Material</InputLabel>
        <Select
          value={selectedMaterial?.id || ''}
          onChange={(e) => handleMaterialChange(e.target.value)}
          label="Select Material"
        >
          {materials.map((material) => {
            const stockStatus = getStockStatus(material.inventory);
            const availableColors = getAvailableColors(material);
            
            return (
              <MenuItem key={material.id} value={material.id} disabled={stockStatus === 'out'}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {material.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {material.type} • €{material.costPerGram.toFixed(3)}/g • {availableColors.length} colors
                    </Typography>
                  </Box>
                  <Chip
                    label={stockStatus === 'good' ? 'In Stock' : stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                    color={getStockColor(stockStatus) as any}
                    size="small"
                  />
                </Box>
              </MenuItem>
            );
          })}
        </Select>
        <FormHelperText>
          Choose the material for your 3D print
        </FormHelperText>
      </FormControl>

      {/* Color Selection */}
      {selectedMaterial && (
        <Box sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            Select Color
          </FormLabel>
          <RadioGroup
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            row
            sx={{ flexWrap: 'wrap' }}
          >
            {getAvailableColors(selectedMaterial).map((inventory) => (
              <FormControlLabel
                key={inventory.id}
                value={inventory.color}
                control={<Radio size="small" />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      width={20}
                      height={20}
                      borderRadius="50%"
                      sx={{
                        backgroundColor: inventory.color.toLowerCase(),
                        border: '1px solid #ccc',
                      }}
                    />
                    <Typography variant="body2">
                      {inventory.color}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({inventory.stock}g)
                    </Typography>
                  </Box>
                }
                disabled={disabled}
              />
            ))}
          </RadioGroup>
          {getAvailableColors(selectedMaterial).length === 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              No colors available for this material
            </Alert>
          )}
        </Box>
      )}

      {/* Material Details */}
      {selectedMaterial && showDetails && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Material Properties
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ScaleIcon color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Density: {selectedMaterial.density} g/cm³
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PaletteIcon color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Cost: €{selectedMaterial.costPerGram.toFixed(3)}/g
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ThermostatIcon color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Print Temp: {selectedMaterial.printTempMin}°C - {selectedMaterial.printTempMax}°C
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ThermostatIcon color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Bed Temp: {selectedMaterial.bedTempMin}°C - {selectedMaterial.bedTempMax}°C
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SpeedIcon color="primary" />
                  <Typography variant="body2" fontWeight={600}>
                    Print Speed: {(selectedMaterial.printSpeed * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" fontWeight={600}>
                  Shrinkage: {(selectedMaterial.shrinkageFactor * 100).toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Available Colors Table */}
            <Typography variant="subtitle1" gutterBottom>
              Available Colors & Stock
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Color</TableCell>
                    <TableCell align="right">Stock (g)</TableCell>
                    <TableCell align="right">Min Stock</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedMaterial.inventory.map((inventory) => {
                    const isLowStock = inventory.stock <= inventory.minStock;
                    const isOutOfStock = inventory.stock === 0;
                    
                    return (
                      <TableRow key={inventory.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              width={16}
                              height={16}
                              borderRadius="50%"
                              sx={{
                                backgroundColor: inventory.color.toLowerCase(),
                                border: '1px solid #ccc',
                              }}
                            />
                            {inventory.color}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{inventory.stock}</TableCell>
                        <TableCell align="right">{inventory.minStock}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              isOutOfStock 
                                ? 'Out of Stock' 
                                : isLowStock 
                                ? 'Low Stock' 
                                : 'Available'
                            }
                            color={
                              isOutOfStock 
                                ? 'error' 
                                : isLowStock 
                                ? 'warning' 
                                : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MaterialSelector;
