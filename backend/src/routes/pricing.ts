import express from 'express';
import { PrismaClient } from '@prisma/client';
import pricingService from '../services/pricingService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Calculate pricing for an order
router.post('/calculate', async (req, res) => {
  try {
    const {
      stlFileId,
      materialId,
      printSettings,
      quantity = 1,
    } = req.body;

    if (!stlFileId || !materialId) {
      return res.status(400).json({ error: 'STL file ID and material ID are required' });
    }

    const pricing = await pricingService.calculateOrderPricing(
      stlFileId,
      materialId,
      printSettings,
      quantity
    );

    res.json(pricing);
  } catch (error) {
    console.error('Error calculating pricing:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// Calculate pricing from volume (for calculator)
router.post('/calculate-volume', async (req, res) => {
  try {
    const {
      volume,
      materialType,
      printSettings,
      quantity = 1,
    } = req.body;

    if (!volume || !materialType) {
      return res.status(400).json({ error: 'Volume and material type are required' });
    }

    const pricing = await pricingService.calculatePricingFromVolume(
      volume,
      materialType,
      printSettings,
      quantity
    );

    res.json(pricing);
  } catch (error) {
    console.error('Error calculating pricing from volume:', error);
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// Get current electricity price
router.get('/electricity/current', async (req, res) => {
  try {
    const price = await pricingService.getCurrentElectricityPrice();
    res.json({ price, currency: 'DKK', area: 'DK2' });
  } catch (error) {
    console.error('Get current electricity price error:', error);
    res.status(500).json({ error: 'Failed to get current electricity price' });
  }
});

// Get electricity price history
router.get('/electricity/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const prices = await pricingService.getElectricityPriceHistory(Number(days));
    res.json({ prices });
  } catch (error) {
    console.error('Get electricity price history error:', error);
    res.status(500).json({ error: 'Failed to get electricity price history' });
  }
});

// Get pricing configuration
router.get('/config', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { isActive: true },
    });

    const config = configs.reduce((acc, c) => {
      acc[c.key] = parseFloat(c.value);
      return acc;
    }, {} as Record<string, number>);

    res.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
