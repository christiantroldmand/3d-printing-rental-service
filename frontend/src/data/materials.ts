export interface PrintMaterial {
  id: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  density: number;
  costPerGram: number;
  printTempMin: number;
  printTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeed: number;
  shrinkageFactor: number;
  isActive: boolean;
  description: string;
  applications: string[];
  properties: string[];
}

export interface QualityPreset {
  id: string;
  name: string;
  description: string;
  layerHeight: number;
  infill: number;
  printSpeed: number;
  supports: boolean;
  brim: boolean;
  raft: boolean;
  cooling: number;
  retraction: number;
  temperature: number;
}

// Quality Presets
export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'high',
    name: 'High Quality',
    description: 'Best surface finish and detail, slower print time',
    layerHeight: 0.1,
    infill: 30,
    printSpeed: 50,
    supports: true,
    brim: true,
    raft: false,
    cooling: 100,
    retraction: 6.5,
    temperature: 0, // Will be adjusted based on material
  },
  {
    id: 'medium',
    name: 'Medium Quality',
    description: 'Good balance of quality and speed',
    layerHeight: 0.2,
    infill: 20,
    printSpeed: 80,
    supports: true,
    brim: false,
    raft: false,
    cooling: 80,
    retraction: 6.0,
    temperature: 0, // Will be adjusted based on material
  },
  {
    id: 'low',
    name: 'Low Quality',
    description: 'Fastest print time, basic quality',
    layerHeight: 0.3,
    infill: 15,
    printSpeed: 120,
    supports: false,
    brim: false,
    raft: false,
    cooling: 60,
    retraction: 5.5,
    temperature: 0, // Will be adjusted based on material
  },
];

// Bambu Lab Filaments
export const BAMBU_FILAMENTS: PrintMaterial[] = [
  // PLA Series
  {
    id: 'bambu-pla-basic',
    name: 'PLA Basic',
    brand: 'Bambu Lab',
    type: 'PLA',
    color: 'White',
    density: 1.24,
    costPerGram: 0.08,
    printTempMin: 190,
    printTempMax: 220,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 200,
    shrinkageFactor: 0.002,
    isActive: true,
    description: 'Standard PLA filament with excellent printability and surface finish',
    applications: ['Prototyping', 'Decorative items', 'Toys', 'Educational models'],
    properties: ['Easy to print', 'Good surface finish', 'Biodegradable', 'Low warping'],
  },
  {
    id: 'bambu-pla-cf',
    name: 'PLA-CF',
    brand: 'Bambu Lab',
    type: 'PLA-CF',
    color: 'Black',
    density: 1.30,
    costPerGram: 0.15,
    printTempMin: 220,
    printTempMax: 250,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 150,
    shrinkageFactor: 0.001,
    isActive: true,
    description: 'Carbon fiber reinforced PLA for enhanced strength and stiffness',
    applications: ['Functional parts', 'Mechanical components', 'Tools', 'Fixtures'],
    properties: ['High strength', 'Stiff', 'Abrasive', 'Requires hardened nozzle'],
  },
  {
    id: 'bambu-pla-silk',
    name: 'PLA Silk+',
    brand: 'Bambu Lab',
    type: 'PLA',
    color: 'Gold',
    density: 1.25,
    costPerGram: 0.12,
    printTempMin: 200,
    printTempMax: 230,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 180,
    shrinkageFactor: 0.002,
    isActive: true,
    description: 'High-gloss silk finish PLA with metallic appearance',
    applications: ['Decorative items', 'Jewelry', 'Art pieces', 'Display models'],
    properties: ['High gloss', 'Metallic finish', 'Smooth surface', 'Aesthetic appeal'],
  },
  {
    id: 'bambu-pla-matte',
    name: 'PLA Matte',
    brand: 'Bambu Lab',
    type: 'PLA',
    color: 'Black',
    density: 1.23,
    costPerGram: 0.10,
    printTempMin: 200,
    printTempMax: 230,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 180,
    shrinkageFactor: 0.002,
    isActive: true,
    description: 'Matte finish PLA with reduced shine and excellent layer adhesion',
    applications: ['Prototypes', 'Functional parts', 'Enclosures', 'Consumer products'],
    properties: ['Matte finish', 'Good layer adhesion', 'Consistent color', 'Easy post-processing'],
  },

  // PETG Series
  {
    id: 'bambu-petg-basic',
    name: 'PETG Basic',
    brand: 'Bambu Lab',
    type: 'PETG',
    color: 'Clear',
    density: 1.27,
    costPerGram: 0.10,
    printTempMin: 240,
    printTempMax: 260,
    bedTempMin: 70,
    bedTempMax: 85,
    printSpeed: 150,
    shrinkageFactor: 0.003,
    isActive: true,
    description: 'Tough and flexible PETG with excellent chemical resistance',
    applications: ['Functional parts', 'Outdoor items', 'Food containers', 'Mechanical parts'],
    properties: ['Tough', 'Flexible', 'Chemical resistant', 'UV stable', 'Food safe'],
  },
  {
    id: 'bambu-petg-cf',
    name: 'PETG-CF',
    brand: 'Bambu Lab',
    type: 'PETG-CF',
    color: 'Black',
    density: 1.35,
    costPerGram: 0.18,
    printTempMin: 250,
    printTempMax: 270,
    bedTempMin: 70,
    bedTempMax: 85,
    printSpeed: 120,
    shrinkageFactor: 0.002,
    isActive: true,
    description: 'Carbon fiber reinforced PETG for maximum strength and durability',
    applications: ['High-stress parts', 'Automotive components', 'Aerospace parts', 'Tools'],
    properties: ['Very strong', 'Stiff', 'Abrasive', 'High temperature resistance'],
  },

  // ABS Series
  {
    id: 'bambu-abs-basic',
    name: 'ABS Basic',
    brand: 'Bambu Lab',
    type: 'ABS',
    color: 'Black',
    density: 1.04,
    costPerGram: 0.09,
    printTempMin: 250,
    printTempMax: 270,
    bedTempMin: 80,
    bedTempMax: 100,
    printSpeed: 100,
    shrinkageFactor: 0.005,
    isActive: true,
    description: 'Classic ABS with good mechanical properties and post-processing options',
    applications: ['Functional parts', 'Enclosures', 'Automotive parts', 'Toys'],
    properties: ['Tough', 'Heat resistant', 'Post-processable', 'Requires heated bed'],
  },
  {
    id: 'bambu-abs-cf',
    name: 'ABS-CF',
    brand: 'Bambu Lab',
    type: 'ABS-CF',
    color: 'Black',
    density: 1.12,
    costPerGram: 0.16,
    printTempMin: 260,
    printTempMax: 280,
    bedTempMin: 80,
    bedTempMax: 100,
    printSpeed: 80,
    shrinkageFactor: 0.003,
    isActive: true,
    description: 'Carbon fiber reinforced ABS for industrial applications',
    applications: ['Industrial parts', 'High-stress components', 'Jigs and fixtures', 'Prototypes'],
    properties: ['Very strong', 'Heat resistant', 'Abrasive', 'Professional grade'],
  },

  // TPU Series
  {
    id: 'bambu-tpu-95a',
    name: 'TPU 95A',
    brand: 'Bambu Lab',
    type: 'TPU',
    color: 'Black',
    density: 1.20,
    costPerGram: 0.14,
    printTempMin: 220,
    printTempMax: 240,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 30,
    shrinkageFactor: 0.001,
    isActive: true,
    description: 'Flexible TPU with 95A hardness for gaskets and flexible parts',
    applications: ['Gaskets', 'Seals', 'Phone cases', 'Flexible joints', 'Wearables'],
    properties: ['Flexible', 'Elastic', 'Wear resistant', 'Chemical resistant'],
  },
  {
    id: 'bambu-tpu-85a',
    name: 'TPU 85A',
    brand: 'Bambu Lab',
    type: 'TPU',
    color: 'Clear',
    density: 1.18,
    costPerGram: 0.15,
    printTempMin: 220,
    printTempMax: 240,
    bedTempMin: 25,
    bedTempMax: 60,
    printSpeed: 25,
    shrinkageFactor: 0.001,
    isActive: true,
    description: 'Softer TPU with 85A hardness for very flexible applications',
    applications: ['Soft grips', 'Cushions', 'Medical devices', 'Flexible prototypes'],
    properties: ['Very flexible', 'Soft', 'Elastic', 'Biocompatible'],
  },

  // Specialty Materials
  {
    id: 'bambu-pc-basic',
    name: 'PC Basic',
    brand: 'Bambu Lab',
    type: 'PC',
    color: 'Clear',
    density: 1.20,
    costPerGram: 0.20,
    printTempMin: 280,
    printTempMax: 300,
    bedTempMin: 100,
    bedTempMax: 120,
    printSpeed: 60,
    shrinkageFactor: 0.006,
    isActive: true,
    description: 'Polycarbonate with excellent heat resistance and transparency',
    applications: ['High-temp parts', 'Optical components', 'Lighting', 'Automotive'],
    properties: ['Heat resistant', 'Transparent', 'Strong', 'Requires high temps'],
  },
  {
    id: 'bambu-pa-cf',
    name: 'PA-CF',
    brand: 'Bambu Lab',
    type: 'PA-CF',
    color: 'Black',
    density: 1.30,
    costPerGram: 0.25,
    printTempMin: 280,
    printTempMax: 300,
    bedTempMin: 100,
    bedTempMax: 120,
    printSpeed: 50,
    shrinkageFactor: 0.004,
    isActive: true,
    description: 'Carbon fiber reinforced nylon for maximum strength and heat resistance',
    applications: ['Aerospace', 'Automotive', 'Industrial', 'High-performance parts'],
    properties: ['Very strong', 'Heat resistant', 'Chemical resistant', 'Professional'],
  },
];

// Get material by ID
export const getMaterialById = (id: string): PrintMaterial | undefined => {
  return BAMBU_FILAMENTS.find(material => material.id === id);
};

// Get materials by type
export const getMaterialsByType = (type: string): PrintMaterial[] => {
  return BAMBU_FILAMENTS.filter(material => material.type === type);
};

// Get quality preset by ID
export const getQualityPresetById = (id: string): QualityPreset | undefined => {
  return QUALITY_PRESETS.find(preset => preset.id === id);
};

// Calculate print settings based on material and quality preset
export const calculatePrintSettings = (material: PrintMaterial, qualityPreset: QualityPreset) => {
  const baseTemp = (material.printTempMin + material.printTempMax) / 2;
  const baseBedTemp = (material.bedTempMin + material.bedTempMax) / 2;
  
  return {
    ...qualityPreset,
    temperature: Math.round(baseTemp + qualityPreset.temperature),
    bedTemperature: Math.round(baseBedTemp),
    printSpeed: Math.round(material.printSpeed * (qualityPreset.printSpeed / 100)),
    retraction: qualityPreset.retraction,
  };
};
