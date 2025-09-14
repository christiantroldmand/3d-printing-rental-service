import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockMaterials,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'IN_QUEUE'] } },
      }),
      prisma.materialInventory.findMany({
        where: {
          stock: { lte: prisma.materialInventory.fields.minStock },
          isAvailable: true,
        },
        include: { material: true },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { material: true } },
        },
      }),
    ]);

    res.json({
      statistics: {
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingOrders,
        lowStockCount: lowStockMaterials.length,
      },
      lowStockMaterials,
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (admin view)
router.get('/orders', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            stlFile: true,
            material: true,
          },
        },
        shippingAddress: true,
        payments: true,
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
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      message: 'User status updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system configuration
router.get('/config', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    res.json({ configs });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update system configuration
router.put('/config', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { configs } = req.body;

    if (!Array.isArray(configs)) {
      return res.status(400).json({ error: 'Configs must be an array' });
    }

    const updatedConfigs = [];

    for (const config of configs) {
      const updated = await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, description: config.description },
        create: {
          key: config.key,
          value: config.value,
          description: config.description,
        },
      });
      updatedConfigs.push(updated);
    }

    res.json({
      message: 'Configuration updated successfully',
      configs: updatedConfigs,
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get print jobs
router.get('/print-jobs', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const printJobs = await prisma.printJob.findMany({
      where,
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            stlFile: true,
            material: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.printJob.count({ where });

    res.json({
      printJobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get print jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update print job status
router.put('/print-jobs/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes, errorMessage } = req.body;

    const printJob = await prisma.printJob.update({
      where: { id },
      data: {
        status,
        notes,
        errorMessage,
        ...(status === 'PRINTING' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            stlFile: true,
            material: true,
          },
        },
      },
    });

    res.json({
      message: 'Print job status updated successfully',
      printJob,
    });
  } catch (error) {
    console.error('Update print job status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
