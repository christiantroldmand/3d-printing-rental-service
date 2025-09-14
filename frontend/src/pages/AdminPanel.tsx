import React from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

const AdminPanel: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: 8, minHeight: '60vh' }}>
      <Container maxWidth="lg">
        <Box textAlign="center">
          <AdminIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 3 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Admin Panel
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Material management, order oversight, and system analytics coming soon...
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPanel;
