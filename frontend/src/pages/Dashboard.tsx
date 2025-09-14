import React from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: 8, minHeight: '60vh' }}>
      <Container maxWidth="lg">
        <Box textAlign="center">
          <DashboardIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            User Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Order history, print status, and account management coming soon...
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
