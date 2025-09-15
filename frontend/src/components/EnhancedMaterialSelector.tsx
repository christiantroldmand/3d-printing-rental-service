import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Thermostat as ThermostatIcon,
  Speed as SpeedIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { BAMBU_FILAMENTS, QUALITY_PRESETS, calculatePrintSettings, PrintMaterial, QualityPreset } from '../data/materials';


interface EnhancedMaterialSelectorProps {
  selectedMaterial?: PrintMaterial | null;
  selectedQuality?: QualityPreset | null;
  selectedColor?: string;
  onMaterialChange: (material: PrintMaterial | null) => void;
  onQualityChange: (quality: QualityPreset | null) => void;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

const EnhancedMaterialSelector: React.FC<EnhancedMaterialSelectorProps> = ({
  selectedMaterial,
  selectedQuality,
  selectedColor,
  onMaterialChange,
  onQualityChange,
  onColorChange,
  disabled = false,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const filteredMaterials = BAMBU_FILAMENTS.filter(material => {
    const matchesType = filterType === 'all' || material.type === filterType;
    return matchesType;
  });

  const handleMaterialSelect = (material: PrintMaterial) => {
    onMaterialChange(material);
    setError(null);
  };

  const handleQualitySelect = (quality: QualityPreset) => {
    onQualityChange(quality);
    setError(null);
  };


  const getPrintSettings = () => {
    if (selectedMaterial && selectedQuality) {
      return calculatePrintSettings(selectedMaterial, selectedQuality);
    }
    return null;
  };

  const printSettings = getPrintSettings();

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Material & Quality Selection
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Materials" icon={<PaletteIcon />} />
          <Tab label="Quality Presets" icon={<StarIcon />} />
          <Tab label="Print Settings" icon={<SettingsIcon />} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          {/* Filter Controls */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Material Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="PLA">PLA</MenuItem>
                <MenuItem value="PETG">PETG</MenuItem>
                <MenuItem value="ABS">ABS</MenuItem>
                <MenuItem value="TPU">TPU</MenuItem>
                <MenuItem value="PC">PC</MenuItem>
                <MenuItem value="PA-CF">PA-CF</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Material Grid */}
          <Grid container spacing={2}>
            {filteredMaterials.map((material) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={material.id}>
                <Card
                  sx={{
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    border: selectedMaterial?.id === material.id ? 2 : 1,
                    borderColor: selectedMaterial?.id === material.id ? 'primary.main' : 'divider',
                    '&:hover': disabled ? {} : { boxShadow: 4 },
                  }}
                  onClick={() => !disabled && handleMaterialSelect(material)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {material.name}
                      </Typography>
                      {selectedMaterial?.id === material.id && (
                        <CheckIcon color="primary" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {material.brand} • {material.type}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={material.color}
                        size="small"
                        icon={<PaletteIcon />}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`€${material.costPerGram.toFixed(2)}/g`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {material.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {material.properties.slice(0, 3).map((property, index) => (
                        <Chip
                          key={index}
                          label={property}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ThermostatIcon fontSize="small" color="primary" />
                          <Typography variant="caption">
                            {material.printTempMin}-{material.printTempMax}°C
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <SpeedIcon fontSize="small" color="primary" />
                          <Typography variant="caption">
                            {material.printSpeed}mm/s
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Quality Presets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a quality preset that matches your requirements
          </Typography>

          <Grid container spacing={2}>
            {QUALITY_PRESETS.map((preset) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={preset.id}>
                <Card
                  sx={{
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    border: selectedQuality?.id === preset.id ? 2 : 1,
                    borderColor: selectedQuality?.id === preset.id ? 'primary.main' : 'divider',
                    '&:hover': disabled ? {} : { boxShadow: 4 },
                  }}
                  onClick={() => !disabled && handleQualitySelect(preset)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {preset.name}
                      </Typography>
                      {selectedQuality?.id === preset.id && (
                        <CheckIcon color="primary" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {preset.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Layer Height:</Typography>
                        <Typography variant="body2" fontWeight={600}>{preset.layerHeight}mm</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Infill:</Typography>
                        <Typography variant="body2" fontWeight={600}>{preset.infill}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Print Speed:</Typography>
                        <Typography variant="body2" fontWeight={600}>{preset.printSpeed}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Supports:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {preset.supports ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Print Settings
          </Typography>
          
          {printSettings ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommended Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Based on {selectedMaterial?.name} with {selectedQuality?.name} preset
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Temperature Settings
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Nozzle Temperature:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.temperature}°C</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Bed Temperature:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.bedTemperature}°C</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Print Parameters
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Layer Height:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.layerHeight}mm</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Print Speed:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.printSpeed}mm/s</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Structure Settings
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Infill:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.infill}%</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Supports:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {printSettings.supports ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Advanced Settings
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Retraction:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.retraction}mm</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Cooling:</Typography>
                        <Typography variant="body2" fontWeight={600}>{printSettings.cooling}%</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              Please select both a material and quality preset to see recommended print settings.
            </Alert>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default EnhancedMaterialSelector;
