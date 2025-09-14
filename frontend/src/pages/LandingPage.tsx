import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  Print as PrintIcon,
  Speed as SpeedIcon,
  Eco as EcoIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Palette as PaletteIcon,
  ThreeDRotation as ThreeDIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PricingCalculator from '../components/PricingCalculator';
import FeatureCard from '../components/FeatureCard';
import StatsSection from '../components/StatsSection';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showCalculator, setShowCalculator] = useState(false);

  const features = [
    {
      icon: <ThreeDIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: '3D Preview',
      description: 'Interactive 3D viewer with print bed visualization and layer-by-layer preview',
    },
    {
      icon: <MoneyIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: 'Dynamic Pricing',
      description: 'Real-time pricing based on filament usage, print time, and electricity costs',
    },
    {
      icon: <PaletteIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      title: 'Material Variety',
      description: 'PLA, PETG, ABS, TPU, and specialty materials with full color selection',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      title: 'Fast Turnaround',
      description: 'Professional printing with Bamboo Lab X1 Carbon for quality and speed',
    },
    {
      icon: <EcoIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      title: 'Eco-Friendly',
      description: 'Sustainable materials and optimized printing to minimize waste',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />,
      title: 'Secure Payments',
      description: 'Stripe integration with PCI DSS compliance and multiple payment methods',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  gutterBottom
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 3,
                  }}
                >
                  Professional 3D Printing
                  <Box component="span" sx={{ display: 'block', color: theme.palette.secondary.light }}>
                    Made Simple
                  </Box>
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  Upload your STL files, choose materials, and get instant pricing 
                  with real-time electricity costs. Professional quality prints 
                  delivered fast.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/order"
                    startIcon={<PrintIcon />}
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: theme.palette.grey[100],
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    Start Printing
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowCalculator(!showCalculator)}
                    startIcon={<MoneyIcon />}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    Calculate Price
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label="Bamboo Lab X1 Carbon"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label="Real-time Pricing"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label="Nordpool Integration"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: { xs: 300, md: 400 },
                  }}
                >
                  {/* 3D Printer Visualization Placeholder */}
                  <Box
                    sx={{
                      width: { xs: 250, md: 350 },
                      height: { xs: 250, md: 350 },
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <ThreeDIcon sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
                    <Typography variant="h6" sx={{ textAlign: 'center', opacity: 0.8 }}>
                      3D Printer Visualization
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.6, mt: 1 }}>
                      Interactive preview coming soon
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing Calculator Section */}
      {showCalculator && (
        <Fade in={showCalculator} timeout={500}>
          <Box sx={{ py: 6, backgroundColor: theme.palette.grey[50] }}>
            <Container maxWidth="lg">
              <Typography
                variant="h3"
                textAlign="center"
                gutterBottom
                sx={{ mb: 4, fontWeight: 700 }}
              >
                Instant Price Calculator
              </Typography>
              <PricingCalculator />
            </Container>
          </Box>
        </Fade>
      )}

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            textAlign="center"
            gutterBottom
            sx={{ mb: 2, fontWeight: 700 }}
          >
            Why Choose 3D Print Pro?
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Professional 3D printing services with cutting-edge technology 
            and transparent pricing
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <FeatureCard {...feature} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <StatsSection />

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`,
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Ready to Start Printing?
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}
            >
              Upload your STL file and get an instant quote with real-time pricing. 
              Professional quality guaranteed.
            </Typography>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/order"
              startIcon={<PrintIcon />}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
