import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.grey[900],
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 4, mb: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              3D Print Pro
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.grey[300] }}>
              Professional 3D printing rental services with dynamic pricing, 
              real-time electricity costs, and advanced material support.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: theme.palette.grey[300] }}>
                <GitHubIcon />
              </IconButton>
              <IconButton sx={{ color: theme.palette.grey[300] }}>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ color: theme.palette.grey[300] }}>
                <LinkedInIcon />
              </IconButton>
              <IconButton sx={{ color: theme.palette.grey[300] }}>
                <EmailIcon />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Services
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Order Print
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Material Selection
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  3D Preview
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Pricing Calculator
                </Typography>
              </Link>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Help Center
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Contact Us
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Status
                </Typography>
              </Link>
              <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                  Documentation
                </Typography>
              </Link>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                📧 hello@3dprintpro.com
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                📞 +1 (555) 123-4567
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                📍 Copenhagen, Denmark
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.grey[700]}`,
            pt: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
            © 2024 3D Print Pro. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.grey[400] }}>
              Powered by Bamboo Lab X1 Carbon
            </Typography>
            <Link 
              href="/admin/login" 
              sx={{ 
                color: theme.palette.grey[500], 
                textDecoration: 'none',
                fontSize: '0.75rem',
                '&:hover': { color: theme.palette.grey[300] }
              }}
            >
              Admin
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;