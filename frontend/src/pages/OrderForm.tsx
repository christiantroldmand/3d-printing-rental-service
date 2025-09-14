import React from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

const OrderForm: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: 8, minHeight: '60vh' }}>
      <Container maxWidth="lg">
        <Box textAlign="center">
          <PrintIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Order Form
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Multi-step order form with 3D preview integration coming soon...
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default OrderForm;
