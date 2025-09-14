import express from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's orders
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            stlFile: true,
            material: true,
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: {
          include: {
            stlFile: true,
            material: true,
          },
        },
        shippingAddress: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      items,
      shippingAddressId,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Generate order number
    const orderNumber = `3DP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { stlFileId, materialId, quantity, layerHeight, infillPercent, printQuality, supportRequired } = item;

      // Get pricing for this item
      const pricingResponse = await fetch(`${req.protocol}://${req.get('host')}/api/pricing/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volume: item.volume,
          materialId,
          layerHeight,
          infillPercent,
          printQuality,
        }),
      });

      if (!pricingResponse.ok) {
        return res.status(400).json({ error: 'Failed to calculate pricing for item' });
      }

      const { pricing } = await pricingResponse.json();

      const itemTotal = pricing.totalCost * quantity;
      subtotal += itemTotal;

      orderItems.push({
        stlFileId,
        materialId,
        quantity,
        layerHeight,
        infillPercent,
        printQuality,
        supportRequired,
        materialCost: pricing.materialCost,
        timeCost: pricing.timeCost,
        electricityCost: pricing.electricityCost,
        laborCost: pricing.laborMarkup,
        platformFee: pricing.platformFee,
        totalCost: itemTotal,
      });
    }

    const taxAmount = subtotal * 0.25; // 25% VAT
    const totalAmount = subtotal + taxAmount;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        subtotal,
        taxAmount,
        totalAmount,
        shippingAddressId,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            stlFile: true,
            material: true,
          },
        },
        shippingAddress: true,
      },
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (for admin/operator)
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            stlFile: true,
            material: true,
          },
        },
        shippingAddress: true,
      },
    });

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_CONFIRMED],
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
