import express from 'express';
import { body, validationResult } from 'express-validator';
import stlAnalysisService from '../services/stlAnalysisService';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/stl/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.stl', '.obj', '.3mf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only STL, OBJ, and 3MF files are allowed'));
    }
  },
});

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/stl/analyze
 * @desc    Analyze STL file and return detailed analysis
 * @access  Private
 */
router.post('/analyze', [
  authenticateToken,
  upload.single('file'),
  body('layerHeight')
    .isFloat({ min: 0.05, max: 0.3 })
    .withMessage('Layer height must be between 0.05 and 0.3 mm'),
  body('infillPercentage')
    .isInt({ min: 0, max: 100 })
    .withMessage('Infill percentage must be between 0 and 100'),
  body('wallThickness')
    .isFloat({ min: 0.4, max: 2.0 })
    .withMessage('Wall thickness must be between 0.4 and 2.0 mm'),
  body('supportDensity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Support density must be between 0 and 100'),
  body('materialType')
    .isIn(['PLA', 'PETG', 'ABS', 'TPU', 'ASA'])
    .withMessage('Material type must be one of: PLA, PETG, ABS, TPU, ASA'),
  body('printQuality')
    .isIn(['draft', 'normal', 'high'])
    .withMessage('Print quality must be one of: draft, normal, high'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'STL file is required',
      });
    }

    const {
      layerHeight,
      infillPercentage,
      wallThickness,
      supportDensity,
      materialType,
      printQuality,
    } = req.body;

    const printSettings = {
      layerHeight: parseFloat(layerHeight),
      infillPercentage: parseInt(infillPercentage),
      wallThickness: parseFloat(wallThickness),
      supportDensity: parseInt(supportDensity),
      materialType,
      printQuality,
    };

    // Analyze the STL file
    const analysis = await stlAnalysisService.analyzeSTLFile(req.file.path, printSettings);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'STL analysis completed successfully',
      data: {
        analysis,
        printSettings,
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      },
    });
  } catch (error) {
    console.error('STL analysis error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'STL analysis failed',
    });
  }
});

/**
 * @route   POST /api/stl/analyze-url
 * @desc    Analyze STL file from URL
 * @access  Private
 */
router.post('/analyze-url', [
  authenticateToken,
  body('fileUrl')
    .isURL()
    .withMessage('Valid file URL is required'),
  body('layerHeight')
    .isFloat({ min: 0.05, max: 0.3 })
    .withMessage('Layer height must be between 0.05 and 0.3 mm'),
  body('infillPercentage')
    .isInt({ min: 0, max: 100 })
    .withMessage('Infill percentage must be between 0 and 100'),
  body('wallThickness')
    .isFloat({ min: 0.4, max: 2.0 })
    .withMessage('Wall thickness must be between 0.4 and 2.0 mm'),
  body('supportDensity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Support density must be between 0 and 100'),
  body('materialType')
    .isIn(['PLA', 'PETG', 'ABS', 'TPU', 'ASA'])
    .withMessage('Material type must be one of: PLA, PETG, ABS, TPU, ASA'),
  body('printQuality')
    .isIn(['draft', 'normal', 'high'])
    .withMessage('Print quality must be one of: draft, normal, high'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const {
      fileUrl,
      layerHeight,
      infillPercentage,
      wallThickness,
      supportDensity,
      materialType,
      printQuality,
    } = req.body;

    const printSettings = {
      layerHeight: parseFloat(layerHeight),
      infillPercentage: parseInt(infillPercentage),
      wallThickness: parseFloat(wallThickness),
      supportDensity: parseInt(supportDensity),
      materialType,
      printQuality,
    };

    // Download file from URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from URL');
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer());
    const tempFilePath = path.join('uploads/stl/', `temp_${Date.now()}.stl`);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, fileBuffer);

    try {
      // Analyze the STL file
      const analysis = await stlAnalysisService.analyzeSTLFile(tempFilePath, printSettings);

      res.json({
        success: true,
        message: 'STL analysis completed successfully',
        data: {
          analysis,
          printSettings,
          fileInfo: {
            url: fileUrl,
            size: fileBuffer.length,
          },
        },
      });
    } finally {
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
    }
  } catch (error) {
    console.error('STL analysis error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'STL analysis failed',
    });
  }
});

/**
 * @route   GET /api/stl/supported-formats
 * @desc    Get supported file formats
 * @access  Public
 */
router.get('/supported-formats', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          extension: '.stl',
          name: 'STL (Stereolithography)',
          description: 'Most common 3D printing format',
          maxSize: '50MB',
        },
        {
          extension: '.obj',
          name: 'OBJ (Wavefront OBJ)',
          description: '3D model format with material support',
          maxSize: '50MB',
        },
        {
          extension: '.3mf',
          name: '3MF (3D Manufacturing Format)',
          description: 'Modern 3D printing format with metadata',
          maxSize: '50MB',
        },
      ],
      maxFileSize: '50MB',
      supportedMaterials: ['PLA', 'PETG', 'ABS', 'TPU', 'ASA'],
      printQualities: ['draft', 'normal', 'high'],
    },
  });
});

/**
 * @route   GET /api/stl/printer-specs
 * @desc    Get printer specifications
 * @access  Public
 */
router.get('/printer-specs', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    data: {
      printer: 'Bamboo Lab X1 Carbon',
      buildVolume: {
        x: 256,
        y: 256,
        z: 256,
        unit: 'mm',
      },
      layerHeight: {
        min: 0.05,
        max: 0.3,
        unit: 'mm',
      },
      nozzleDiameter: {
        value: 0.4,
        unit: 'mm',
      },
      printSpeed: {
        max: 300,
        average: 60,
        unit: 'mm/s',
      },
      supportedMaterials: ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', 'PA-CF'],
    },
  });
});

export default router;
