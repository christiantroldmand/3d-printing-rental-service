import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.stl,.obj,.3mf').split(',');
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
  },
});

// Upload STL file
router.post('/stl', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const userId = req.user!.id;

    // Basic STL file analysis (simplified)
    const analysisData = await analyzeSTLFile(filePath);

    // Save file metadata to database
    const stlFile = await prisma.sTLFile.create({
      data: {
        filename,
        originalName: originalname,
        filePath,
        fileSize: size,
        mimeType: mimetype,
        volume: analysisData.volume,
        dimensions: analysisData.dimensions,
        surfaceArea: analysisData.surfaceArea,
        layerCount: analysisData.layerCount,
        printTime: analysisData.printTime,
        isAnalyzed: true,
        analysisData: analysisData,
      },
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: stlFile.id,
        originalName: stlFile.originalName,
        filename: stlFile.filename,
        fileSize: stlFile.fileSize,
        volume: stlFile.volume,
        dimensions: stlFile.dimensions,
        surfaceArea: stlFile.surfaceArea,
        printTime: stlFile.printTime,
        analysisData: stlFile.analysisData,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get uploaded files for user
router.get('/files', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    // Get files associated with user's orders
    const files = await prisma.sTLFile.findMany({
      where: {
        orderItems: {
          some: {
            order: {
              userId,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.sTLFile.count({
      where: {
        orderItems: {
          some: {
            order: {
              userId,
            },
          },
        },
      },
    });

    res.json({
      files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if file belongs to user
    const file = await prisma.sTLFile.findFirst({
      where: {
        id,
        orderItems: {
          some: {
            order: {
              userId,
            },
          },
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete from database
    await prisma.sTLFile.delete({
      where: { id },
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic STL file analysis function
async function analyzeSTLFile(filePath: string): Promise<any> {
  // This is a simplified analysis - in production, you'd use a proper STL parser
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  // Estimate volume based on file size (very rough approximation)
  const estimatedVolume = Math.max(fileSize / 1000, 1); // cm³
  
  // Estimate dimensions (cube approximation)
  const sideLength = Math.cbrt(estimatedVolume);
  const dimensions = {
    width: sideLength,
    height: sideLength,
    depth: sideLength,
  };
  
  // Estimate surface area
  const surfaceArea = 6 * sideLength * sideLength;
  
  // Estimate layer count (assuming 0.2mm layer height)
  const layerHeight = 0.2;
  const layerCount = Math.ceil(sideLength / layerHeight);
  
  // Estimate print time (very rough)
  const printTime = Math.max(estimatedVolume / 100, 0.5); // hours
  
  return {
    volume: estimatedVolume,
    dimensions,
    surfaceArea,
    layerCount,
    printTime,
    fileSize,
  };
}

export default router;
