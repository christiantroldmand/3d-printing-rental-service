import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import PricingDisplay from './PricingDisplay';

interface PricingCalculation {
  materialCost: number;
  electricityCost: number;
  laborCost: number;
  platformFee: number;
  totalCost: number;
  breakdown: {
    material: {
      cost: number;
      usage: number;
      pricePerGram: number;
    };
    electricity: {
      cost: number;
      consumption: number;
      pricePerKwh: number;
    };
    labor: {
      cost: number;
      hours: number;
      ratePerHour: number;
    };
    platform: {
      fee: number;
      percentage: number;
    };
  };
}

interface PricingCalculatorProps {
  stlAnalysis?: {
    volume: number;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
    surfaceArea: number;
    estimatedPrintTime: number;
    materialUsage: number;
    supportRequired: boolean;
    printabilityScore: number;
  };
  onPricingChange?: (pricing: PricingCalculation | null) => void;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  stlAnalysis,
  onPricingChange,
}) => {
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    materialType: 'PLA',
    printQuality: 'normal',
    layerHeight: 0.2,
    infillPercentage: 20,
    wallThickness: 0.8,
    supportDensity: 20,
    quantity: 1,
  });

  const materialOptions = [
    { value: 'PLA', label: 'PLA', density: 1.24, costPerKg: 80 },
    { value: 'PETG', label: 'PETG', density: 1.27, costPerKg: 100 },
    { value: 'ABS', label: 'ABS', density: 1.04, costPerKg: 90 },
    { value: 'TPU', label: 'TPU', density: 1.20, costPerKg: 140 },
    { value: 'ASA', label: 'ASA', density: 1.05, costPerKg: 120 },
  ];

  const qualityOptions = [
    { value: 'draft', label: 'Draft', layerHeight: 0.3, infill: 15, speed: 1.5 },
    { value: 'normal', label: 'Normal', layerHeight: 0.2, infill: 20, speed: 1.0 },
    { value: 'high', label: 'High', layerHeight: 0.1, infill: 30, speed: 0.7 },
  ];

  const calculatePricing = async () => {
    if (!stlAnalysis) {
      setError('No STL analysis available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate material usage
      const selectedMaterial = materialOptions.find(m => m.value === settings.materialType);
      const materialDensity = selectedMaterial?.density || 1.24;
      const materialCostPerKg = selectedMaterial?.costPerKg || 80;
      
      // Calculate material usage based on volume and infill
      const baseVolume = stlAnalysis.volume; // cm³
      const infillVolume = baseVolume * (settings.infillPercentage / 100);
      const wallVolume = calculateWallVolume(stlAnalysis.dimensions, settings.wallThickness);
      const supportVolume = settings.supportRequired ? calculateSupportVolume(stlAnalysis.dimensions, settings) : 0;
      
      const totalVolume = infillVolume + wallVolume + supportVolume;
      const materialUsage = totalVolume * materialDensity; // grams
      const materialCost = (materialUsage * materialCostPerKg / 1000) * 1.3; // 30% markup

      // Calculate print time
      const printTime = calculatePrintTime(stlAnalysis, settings);

      // Calculate electricity cost (200W average, current price ~0.5 DKK/kWh)
      const electricityConsumption = (printTime * 200) / 1000; // kWh
      const electricityCost = electricityConsumption * 0.5; // Current price

      // Calculate labor cost (150 DKK/hour)
      const laborHours = printTime * 1.2; // 20% overhead
      const laborCost = laborHours * 150;

      // Calculate platform fee (15%)
      const subtotal = materialCost + electricityCost + laborCost;
      const platformFee = subtotal * 0.15;

      // Calculate total
      const totalCost = Math.max(subtotal + platformFee, 50); // 50 DKK minimum

      const pricingResult: PricingCalculation = {
        materialCost: materialCost * settings.quantity,
        electricityCost: electricityCost * settings.quantity,
        laborCost: laborCost * settings.quantity,
        platformFee: platformFee * settings.quantity,
        totalCost: totalCost * settings.quantity,
        breakdown: {
          material: {
            cost: materialCost * settings.quantity,
            usage: materialUsage * settings.quantity,
            pricePerGram: materialCostPerKg / 1000,
          },
          electricity: {
            cost: electricityCost * settings.quantity,
            consumption: electricityConsumption * settings.quantity,
            pricePerKwh: 0.5,
          },
          labor: {
            cost: laborCost * settings.quantity,
            hours: laborHours * settings.quantity,
            ratePerHour: 150,
          },
          platform: {
            fee: platformFee * settings.quantity,
            percentage: 15,
          },
        },
      };

      setPricing(pricingResult);
      onPricingChange?.(pricingResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate pricing');
    } finally {
      setLoading(false);
    }
  };

  const calculateWallVolume = (dimensions: any, wallThickness: number) => {
    const perimeter = 2 * (dimensions.width + dimensions.depth);
    const height = dimensions.height;
    const wallThicknessCm = wallThickness / 10;
    return perimeter * height * wallThicknessCm;
  };

  const calculateSupportVolume = (dimensions: any, settings: any) => {
    const baseArea = dimensions.width * dimensions.depth;
    const supportHeight = dimensions.height * 0.3;
    const supportDensity = settings.supportDensity / 100;
    return baseArea * supportHeight * supportDensity;
  };

  const calculatePrintTime = (analysis: any, settings: any) => {
    const quality = qualityOptions.find(q => q.value === settings.printQuality);
    const speedMultiplier = quality?.speed || 1.0;
    
    // Base time calculation
    const layerCount = Math.ceil(analysis.dimensions.height * 10 / settings.layerHeight);
    const baseTime = layerCount * 0.1; // 0.1 hours per layer
    
    // Adjust for quality and material
    const materialMultiplier = settings.materialType === 'TPU' ? 0.5 : 1.0;
    const infillMultiplier = 1 + (settings.infillPercentage / 100);
    
    return baseTime * speedMultiplier * materialMultiplier * infillMultiplier;
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleQualityChange = (quality: string) => {
    const qualityOption = qualityOptions.find(q => q.value === quality);
    if (qualityOption) {
      setSettings(prev => ({
        ...prev,
        printQuality: quality,
        layerHeight: qualityOption.layerHeight,
        infillPercentage: qualityOption.infill,
      }));
    }
  };

  useEffect(() => {
    if (stlAnalysis) {
      calculatePricing();
    }
  }, [stlAnalysis, settings]);

  if (!stlAnalysis) {
    return (
      <Alert severity="info">
        Upload and analyze a 3D file to see pricing calculations
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Print Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Material Type</InputLabel>
                <Select
                  value={settings.materialType}
                  onChange={(e) => handleSettingChange('materialType', e.target.value)}
                >
                  {materialOptions.map((material) => (
                    <MenuItem key={material.value} value={material.value}>
                      {material.label} ({material.density}g/cm³, {material.costPerKg} DKK/kg)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Print Quality</InputLabel>
                <Select
                  value={settings.printQuality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                >
                  {qualityOptions.map((quality) => (
                    <MenuItem key={quality.value} value={quality.value}>
                      {quality.label} ({quality.layerHeight}mm layers, {quality.infill}% infill)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography gutterBottom>
                Layer Height: {settings.layerHeight}mm
              </Typography>
              <Slider
                value={settings.layerHeight}
                onChange={(_, value) => handleSettingChange('layerHeight', value)}
                min={0.1}
                max={0.3}
                step={0.05}
                marks={[
                  { value: 0.1, label: '0.1mm' },
                  { value: 0.2, label: '0.2mm' },
                  { value: 0.3, label: '0.3mm' },
                ]}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography gutterBottom>
                Infill: {settings.infillPercentage}%
              </Typography>
              <Slider
                value={settings.infillPercentage}
                onChange={(_, value) => handleSettingChange('infillPercentage', value)}
                min={5}
                max={100}
                step={5}
                marks={[
                  { value: 5, label: '5%' },
                  { value: 20, label: '20%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={settings.quantity}
                onChange={(e) => handleSettingChange('quantity', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Volume: ${stlAnalysis.volume.toFixed(2)} cm³`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Size: ${stlAnalysis.dimensions.width.toFixed(1)}×${stlAnalysis.dimensions.height.toFixed(1)}×${stlAnalysis.dimensions.depth.toFixed(1)} cm`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={`Printability: ${stlAnalysis.printabilityScore}/100`}
                  color={stlAnalysis.printabilityScore > 80 ? 'success' : stlAnalysis.printabilityScore > 60 ? 'warning' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CalculateIcon />}
              onClick={calculatePricing}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Recalculate'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      <PricingDisplay
        pricing={pricing}
        loading={loading}
        error={error}
        showDetails={true}
      />
    </Box>
  );
};

export default PricingCalculator;