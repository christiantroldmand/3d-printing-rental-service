import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current electricity prices
router.get('/prices', async (req, res) => {
  try {
    const { date, area = 'DK1' } = req.query;
    
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const prices = await prisma.electricityPrice.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        area: area as string,
      },
      orderBy: { hour: 'asc' },
    });

    res.json({ prices });
  } catch (error) {
    console.error('Get electricity prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current electricity price
router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    const price = await prisma.electricityPrice.findFirst({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        hour: currentHour,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!price) {
      // Fallback to default price
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'electricity_price' },
      });
      
      const defaultPrice = config ? parseFloat(config.value) : 0.25;
      
      res.json({
        price: defaultPrice,
        hour: currentHour,
        date: now.toISOString().split('T')[0],
        area: 'DK1',
        isDefault: true,
      });
      return;
    }

    res.json({
      price: price.price,
      hour: price.hour,
      date: price.date.toISOString().split('T')[0],
      area: price.area,
      isDefault: false,
    });
  } catch (error) {
    console.error('Get current electricity price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update electricity prices (Admin only)
router.post('/prices', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices)) {
      return res.status(400).json({ error: 'Prices must be an array' });
    }

    const createdPrices = [];

    for (const priceData of prices) {
      const { date, hour, price, area = 'DK1' } = priceData;

      const priceRecord = await prisma.electricityPrice.upsert({
        where: {
          date_hour_area: {
            date: new Date(date),
            hour,
            area,
          },
        },
        update: { price },
        create: {
          date: new Date(date),
          hour,
          price,
          area,
        },
      });

      createdPrices.push(priceRecord);
    }

    res.json({
      message: 'Electricity prices updated successfully',
      prices: createdPrices,
    });
  } catch (error) {
    console.error('Update electricity prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get electricity price history
router.get('/history', async (req, res) => {
  try {
    const { days = 7, area = 'DK1' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const prices = await prisma.electricityPrice.findMany({
      where: {
        date: {
          gte: startDate,
        },
        area: area as string,
      },
      orderBy: [
        { date: 'desc' },
        { hour: 'asc' },
      ],
    });

    res.json({ prices });
  } catch (error) {
    console.error('Get electricity price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
