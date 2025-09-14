import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Calculate pricing for an order
router.post('/calculate', async (req, res) => {
  try {
    const {
      volume, // cm³
      materialId,
      layerHeight, // mm
      infillPercent, // percentage
      printQuality,
    } = req.body;

    // Validate input
    if (!volume || !materialId || !layerHeight || !infillPercent) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get material data
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Get system configuration
    const configs = await prisma.systemConfig.findMany({
      where: { isActive: true },
    });

    const config = configs.reduce((acc, c) => {
      acc[c.key] = parseFloat(c.value);
      return acc;
    }, {} as Record<string, number>);

    // Calculate filament weight (with waste factor)
    const infill = infillPercent / 100;
    const wasteFactor = config.waste_factor || 0.05;
    const filamentWeight = (volume * material.density * infill * (1 + wasteFactor)) / 1000; // Convert to grams

    // Calculate print time
    const qualityMultiplier = printQuality === 'high' ? 1.2 : printQuality === 'draft' ? 0.8 : 1.0;
    const baseTime = volume / (1000 * layerHeight * material.printSpeed * qualityMultiplier); // hours
    const printTime = Math.max(baseTime, 0.5); // Minimum 30 minutes

    // Calculate costs
    const materialCost = filamentWeight * material.costPerGram;
    const timeCost = printTime * (config.hourly_rate || 15);
    const electricityCost = (printTime * (config.printer_power_consumption || 0.2)) * (config.electricity_price || 0.25);
    
    const subtotal = materialCost + timeCost + electricityCost;
    const laborMarkup = subtotal * (config.labor_markup || 0.15);
    const platformFee = subtotal * (config.platform_fee || 0.05);
    const totalCost = subtotal + laborMarkup + platformFee;

    // Get current electricity price
    const now = new Date();
    const currentHour = now.getHours();
    const electricityPrice = await prisma.electricityPrice.findFirst({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        hour: currentHour,
      },
      orderBy: { createdAt: 'desc' },
    });

    const actualElectricityCost = electricityPrice 
      ? (printTime * (config.printer_power_consumption || 0.2)) * (electricityPrice.price / 1000) // Convert MWh to kWh
      : electricityCost;

    const finalTotal = subtotal + laborMarkup + platformFee + (actualElectricityCost - electricityCost);

    res.json({
      pricing: {
        materialCost,
        timeCost,
        electricityCost: actualElectricityCost,
        laborMarkup,
        platformFee,
        totalCost: finalTotal,
      },
      calculations: {
        filamentWeight,
        printTime,
        volume,
        layerHeight,
        infillPercent,
        printQuality,
        material: {
          id: material.id,
          name: material.name,
          type: material.type,
          density: material.density,
          costPerGram: material.costPerGram,
        },
        electricityPrice: electricityPrice?.price || config.electricity_price || 0.25,
      },
    });
  } catch (error) {
    console.error('Pricing calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current electricity prices
router.get('/electricity', async (req, res) => {
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
