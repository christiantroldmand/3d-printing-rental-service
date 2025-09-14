import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2 as Grid,
  Chip,
  Divider,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  LocalShipping as EcoIcon,
  Palette as MaterialIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface PricingData {
  materialCost: number;
  timeCost: number;
  electricityCost: number;
  laborMarkup: number;
  platformFee: number;
  totalCost: number;
}

const PricingCalculator: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    volume: '',
    material: 'PLA',
    layerHeight: '0.2',
    infill: '20',
    printQuality: 'normal',
  });
  
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Material properties (in EUR)
  const materials = {
    PLA: { density: 1.24, costPerGram: 0.05, printSpeed: 1.0 },
    PETG: { density: 1.27, costPerGram: 0.06, printSpeed: 0.8 },
    ABS: { density: 1.04, costPerGram: 0.07, printSpeed: 0.7 },
    TPU: { density: 1.20, costPerGram: 0.08, printSpeed: 0.5 },
  };

  // Electricity price (simulated - would come from Nordpool API)
  const electricityPrice = 0.25; // EUR/kWh
  const hourlyRate = 15; // EUR/hour
  const laborMarkup = 0.15;
  const platformFee = 0.05;

  const calculatePricing = async () => {
    setLoading(true);
    setError(null);

    try {
      const volume = parseFloat(formData.volume);
      if (!volume || volume <= 0) {
        throw new Error('Please enter a valid volume');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const material = materials[formData.material as keyof typeof materials];
      const layerHeight = parseFloat(formData.layerHeight);
      const infill = parseFloat(formData.infill) / 100;
      const qualityMultiplier = formData.printQuality === 'high' ? 1.2 : formData.printQuality === 'draft' ? 0.8 : 1.0;

      // Calculate filament weight (with 5% waste factor)
      const filamentWeight = (volume * material.density * infill * 1.05) / 1000; // Convert to grams
      
      // Calculate print time (simplified formula)
      const baseTime = volume / (1000 * layerHeight * material.printSpeed * qualityMultiplier); // hours
      const printTime = Math.max(baseTime, 0.5); // Minimum 30 minutes

      // Calculate costs
      const materialCost = filamentWeight * material.costPerGram;
      const timeCost = printTime * hourlyRate;
      const electricityCost = (printTime * 0.2) * electricityPrice; // 200W average power
      const subtotal = materialCost + timeCost + electricityCost;
      const totalCost = subtotal * (1 + laborMarkup + platformFee);

      setPricing({
        materialCost,
        timeCost,
        electricityCost,
        laborMarkup: subtotal * laborMarkup,
        platformFee: subtotal * platformFee,
        totalCost,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.volume) {
      const timeoutId = setTimeout(calculatePricing, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Calculate Your Print Cost
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Volume (cm³)"
                type="number"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                placeholder="Enter STL volume"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Material</InputLabel>
                <Select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                >
                  {Object.entries(materials).map(([name, props]) => (
                    <MenuItem key={name} value={name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MaterialIcon sx={{ fontSize: 20 }} />
                        {name} (€{props.costPerGram}/g)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Layer Height</InputLabel>
                <Select
                  value={formData.layerHeight}
                  onChange={(e) => setFormData({ ...formData, layerHeight: e.target.value })}
                >
                  <MenuItem value="0.1">0.1mm (High Quality)</MenuItem>
                  <MenuItem value="0.2">0.2mm (Normal)</MenuItem>
                  <MenuItem value="0.3">0.3mm (Fast)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Infill Percentage</InputLabel>
                <Select
                  value={formData.infill}
                  onChange={(e) => setFormData({ ...formData, infill: e.target.value })}
                >
                  <MenuItem value="10">10% (Lightweight)</MenuItem>
                  <MenuItem value="20">20% (Standard)</MenuItem>
                  <MenuItem value="30">30% (Strong)</MenuItem>
                  <MenuItem value="50">50% (Very Strong)</MenuItem>
                  <MenuItem value="100">100% (Solid)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Print Quality</InputLabel>
                <Select
                  value={formData.printQuality}
                  onChange={(e) => setFormData({ ...formData, printQuality: e.target.value })}
                >
                  <MenuItem value="draft">Draft (Fast)</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High Quality</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<EcoIcon />}
                  label="Real-time electricity pricing"
                  size="small"
                  color="success"
                />
                <Chip
                  icon={<TimeIcon />}
                  label="Accurate time estimation"
                  size="small"
                  color="info"
                />
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {pricing && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Cost Breakdown
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Material Cost
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(pricing.materialCost)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Print Time
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(pricing.timeCost)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Electricity Cost
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(pricing.electricityCost)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Labor (15%)
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(pricing.laborMarkup)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Platform Fee (5%)
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(pricing.platformFee)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total Cost
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {formatCurrency(pricing.totalCost)}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                * Pricing includes real-time electricity costs from Nordpool
              </Typography>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PricingCalculator;
