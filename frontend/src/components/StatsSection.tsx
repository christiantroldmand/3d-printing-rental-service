import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Print as PrintIcon,
  Speed as SpeedIcon,
  LocalShipping as EcoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const StatsSection: React.FC = () => {
  const theme = useTheme();

  const stats = [
    {
      icon: <PrintIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      number: '2,500+',
      label: 'Prints Completed',
      description: 'Successfully delivered high-quality 3D prints',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      number: '24h',
      label: 'Average Turnaround',
      description: 'Fast delivery with professional quality',
    },
    {
      icon: <EcoIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
      number: '95%',
      label: 'Success Rate',
      description: 'Reliable printing with minimal failures',
    },
    {
      icon: <StarIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />,
      number: '4.9/5',
      label: 'Customer Rating',
      description: 'Highly rated by our satisfied customers',
    },
  ];

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          textAlign="center"
          gutterBottom
          sx={{ mb: 2, fontWeight: 700 }}
        >
          Trusted by Thousands
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Our numbers speak for themselves - professional 3D printing 
          services you can rely on
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 4 }}>
          {stats.map((stat, index) => (
            <Box key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.light,
                        mb: 3,
                        mx: 'auto',
                      }}
                    >
                      {stat.icon}
                    </Box>
                    
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: theme.palette.primary.main,
                        mb: 1,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                      }}
                    >
                      {stat.label}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6,
                      }}
                    >
                      {stat.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default StatsSection;
