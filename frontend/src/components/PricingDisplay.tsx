import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Info as InfoIcon,
  ElectricBolt as ElectricIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface PricingBreakdown {
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

interface PricingDisplayProps {
  pricing: PricingBreakdown | null;
  loading?: boolean;
  error?: string | null;
  showDetails?: boolean;
  compact?: boolean;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  pricing,
  loading = false,
  error = null,
  showDetails = true,
  compact = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('da-DK', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Calculating pricing...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!pricing) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Upload a 3D file to see pricing
      </Alert>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" color="primary">
          {formatCurrency(pricing.totalCost)}
        </Typography>
        <Chip
          label={`${formatNumber(pricing.breakdown.material.usage)}g material`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`${formatNumber(pricing.breakdown.labor.hours, 1)}h print time`}
          size="small"
          color="secondary"
          variant="outlined"
        />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Pricing Breakdown
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {formatCurrency(pricing.totalCost)}
            </Typography>
            <Tooltip title="Pricing includes material, electricity, labor, and platform fees">
              <IconButton size="small" onClick={() => setShowTooltip(!showTooltip)}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {showDetails && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildIcon color="primary" fontSize="small" />
                      <Typography variant="body2">Material</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(pricing.breakdown.material.usage)}g
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(pricing.breakdown.material.pricePerGram)}/g
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(pricing.breakdown.material.cost)}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ElectricIcon color="warning" fontSize="small" />
                      <Typography variant="body2">Electricity</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(pricing.breakdown.electricity.consumption, 3)}kWh
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(pricing.breakdown.electricity.pricePerKwh)}/kWh
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(pricing.breakdown.electricity.cost)}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon color="success" fontSize="small" />
                      <Typography variant="body2">Labor</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(pricing.breakdown.labor.hours, 1)}h
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(pricing.breakdown.labor.ratePerHour)}/h
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(pricing.breakdown.labor.cost)}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingIcon color="info" fontSize="small" />
                      <Typography variant="body2">Platform Fee</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(pricing.breakdown.platform.percentage)}%
                  </TableCell>
                  <TableCell align="right">-</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(pricing.breakdown.platform.fee)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Total Cost
          </Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            {formatCurrency(pricing.totalCost)}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>What's included:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • High-quality 3D printing with Bamboo Lab X1 Carbon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Real-time electricity pricing from Nordpool
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Professional setup and post-processing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Quality assurance and support
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PricingDisplay;
