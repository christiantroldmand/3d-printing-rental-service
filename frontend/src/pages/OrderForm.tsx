import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from '../components/FileUpload';
import MinimalSTLViewer from '../components/MinimalSTLViewer';
import EnhancedMaterialSelector from '../components/EnhancedMaterialSelector';
import PricingCalculator from '../components/PricingCalculator';
import { PrintMaterial, QualityPreset } from '../data/materials';

const steps = [
  'Upload 3D File',
  'Select Material & Settings',
  'Review & Calculate Price',
  'Place Order',
];

interface OrderData {
  file: File | null;
  fileUrl: string | null;
  material: PrintMaterial | null;
  qualityPreset: QualityPreset | null;
  selectedColor: string;
  layerHeight: string;
  infill: string;
  printQuality: string;
  supportRequired: boolean;
  volume: number;
  pricing: any;
}

const OrderForm: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData>({
    file: null,
    fileUrl: null,
    material: null,
    qualityPreset: null,
    selectedColor: '',
    layerHeight: '0.2',
    infill: '20',
    printQuality: 'normal',
    supportRequired: false,
    volume: 0,
    pricing: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setOrderData(prev => ({
      ...prev,
      file,
      fileUrl: URL.createObjectURL(file),
    }));
    setError(null);
  };

  const handleFileRemove = () => {
    if (orderData.fileUrl) {
      URL.revokeObjectURL(orderData.fileUrl);
    }
    setOrderData(prev => ({
      ...prev,
      file: null,
      fileUrl: null,
      volume: 0,
    }));
  };

  const handleNext = () => {
    if (activeStep === 0 && !orderData.file) {
      setError('Please upload a 3D file to continue');
      return;
    }
    if (activeStep === 1 && (!orderData.material || !orderData.qualityPreset)) {
      setError('Please select both a material and quality preset to continue');
      return;
    }
    setActiveStep(prev => prev + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const handleOrder = async () => {
    setLoading(true);
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Order placed:', orderData);
      setActiveStep(4); // Success step
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Upload Your 3D File
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Upload your STL, OBJ, or 3MF file to get started. We'll analyze it and provide 
              an instant price quote.
            </Typography>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={orderData.file}
              fileUrl={orderData.fileUrl}
              showPreview={true}
              maxSize={50 * 1024 * 1024} // 50MB
              acceptedTypes={['.stl', '.obj', '.3mf']}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Material & Print Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Choose your material and print settings to optimize quality and cost.
            </Typography>
            
            <EnhancedMaterialSelector
              selectedMaterial={orderData.material}
              selectedQuality={orderData.qualityPreset}
              selectedColor={orderData.selectedColor}
              onMaterialChange={(material) => setOrderData(prev => ({ ...prev, material }))}
              onQualityChange={(quality) => setOrderData(prev => ({ ...prev, qualityPreset: quality }))}
              onColorChange={(color) => setOrderData(prev => ({ ...prev, selectedColor: color }))}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Review & Calculate Price
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Review your order details and get an instant price calculation.
            </Typography>
            
            {orderData.fileUrl && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  3D Model Preview
                </Typography>
                <MinimalSTLViewer
                  fileUrl={orderData.fileUrl}
                  fileName={orderData.file?.name}
                  width="100%"
                  height="300px"
                />
              </Box>
            )}
            
            <PricingCalculator />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Place Your Order
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Review your order and proceed to payment.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>File:</Typography>
                <Typography>{orderData.file?.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Material:</Typography>
                <Typography>{orderData.material?.name || 'Not selected'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Quality Preset:</Typography>
                <Typography>{orderData.qualityPreset?.name || 'Not selected'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Color:</Typography>
                <Typography>{orderData.selectedColor || 'Not selected'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Layer Height:</Typography>
                <Typography>{orderData.qualityPreset?.layerHeight || orderData.layerHeight}mm</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Infill:</Typography>
                <Typography>{orderData.qualityPreset?.infill || orderData.infill}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Print Speed:</Typography>
                <Typography>{orderData.qualityPreset?.printSpeed || 80}%</Typography>
              </Box>
            </Paper>
            
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleOrder}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PrintIcon />}
              sx={{ py: 2 }}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </Button>
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <CheckIcon sx={{ fontSize: 80, color: theme.palette.success.main, mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Order Placed Successfully!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Your 3D print order has been submitted. You'll receive a confirmation email shortly.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setActiveStep(0);
                setOrderData({
                  file: null,
                  fileUrl: null,
                  material: null,
                  qualityPreset: null,
                  selectedColor: '',
                  layerHeight: '0.2',
                  infill: '20',
                  printQuality: 'normal',
                  supportRequired: false,
                  volume: 0,
                  pricing: null,
                });
              }}
            >
              Place Another Order
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 8, minHeight: '80vh' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 2 }}
        >
          Order Your 3D Print
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Upload your 3D file, choose materials, and get an instant quote. 
          Professional quality guaranteed.
        </Typography>

        <Paper sx={{ p: 4, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ p: 4 }}>
              {renderStepContent(activeStep)}
            </Paper>
          </motion.div>
        </AnimatePresence>

        {activeStep < 4 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ minWidth: 120 }}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={activeStep === 3 ? handleOrder : handleNext}
              endIcon={activeStep === 3 ? <PrintIcon /> : <ArrowForwardIcon />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {activeStep === 3 ? 'Place Order' : 'Next'}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default OrderForm;