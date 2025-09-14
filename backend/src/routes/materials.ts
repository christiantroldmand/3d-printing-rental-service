import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        inventory: {
          where: { isAvailable: true },
          select: {
            id: true,
            color: true,
            stock: true,
            isAvailable: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get material by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        inventory: {
          where: { isAvailable: true },
          select: {
            id: true,
            color: true,
            stock: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get material inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.materialInventory.findMany({
      where: { 
        materialId: id,
        isAvailable: true,
      },
      orderBy: { color: 'asc' },
    });

    res.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      density,
      costPerGram,
      printTempMin,
      printTempMax,
      bedTempMin,
      bedTempMax,
      printSpeed,
      shrinkageFactor,
    } = req.body;

    // Validate required fields
    if (!name || !type || !density || !costPerGram) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const material = await prisma.material.create({
      data: {
        name,
        type,
        density,
        costPerGram,
        printTempMin,
        printTempMax,
        bedTempMin,
        bedTempMax,
        printSpeed,
        shrinkageFactor,
      },
    });

    res.status(201).json({
      message: 'Material created successfully',
      material,
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update material (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Material updated successfully',
      material,
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    await prisma.material.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory (Admin only)
router.put('/:id/inventory', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { color, stock, minStock, maxStock, isAvailable } = req.body;

    const inventory = await prisma.materialInventory.upsert({
      where: {
        materialId_color: {
          materialId: id,
          color: color,
        },
      },
      update: {
        stock,
        minStock,
        maxStock,
        isAvailable,
      },
      create: {
        materialId: id,
        color,
        stock,
        minStock,
        maxStock,
        isAvailable,
      },
    });

    res.json({
      message: 'Inventory updated successfully',
      inventory,
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock materials (Admin only)
router.get('/admin/low-stock', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const lowStockMaterials = await prisma.materialInventory.findMany({
      where: {
        stock: {
          lte: prisma.materialInventory.fields.minStock,
        },
        isAvailable: true,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    res.json({ lowStockMaterials });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
