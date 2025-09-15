import express from 'express';
import { PrismaClient, OrderStatus, PrintStatus } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import orderProcessingService from '../services/orderProcessingService';

const router = express.Router();
const prisma = new PrismaClient();

// Get all orders with pagination and filtering
router.get('/orders', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ]
        } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          },
          items: {
            include: {
              stlFile: true,
              material: true,
            }
          },
          shippingAddress: true,
          payments: true,
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/orders/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        items: {
          include: {
            stlFile: true,
            material: true,
            printJob: true,
          }
        },
        shippingAddress: true,
        payments: true,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/orders/:id/status', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await orderProcessingService.updateOrderStatus(id, status, notes);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get processing queue
router.get('/queue', authenticateToken, requireRole(['ADMIN', 'MANAGER', 'OPERATOR']), async (req, res) => {
  try {
    const queue = await orderProcessingService.getOrderProcessingQueue();
    res.json(queue);
  } catch (error) {
    console.error('Error fetching processing queue:', error);
    res.status(500).json({ error: 'Failed to fetch processing queue' });
  }
});

// Update print job status
router.patch('/print-jobs/:id/status', authenticateToken, requireRole(['ADMIN', 'MANAGER', 'OPERATOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, errorMessage } = req.body;

    if (!Object.values(PrintStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid print status' });
    }

    const printJob = await orderProcessingService.updatePrintJobStatus(id, status, notes, errorMessage);

    if (!printJob) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    res.json(printJob);
  } catch (error) {
    console.error('Error updating print job status:', error);
    res.status(500).json({ error: 'Failed to update print job status' });
  }
});

// Get processing statistics
router.get('/stats', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const stats = await orderProcessingService.getOrderProcessingStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching processing stats:', error);
    res.status(500).json({ error: 'Failed to fetch processing stats' });
  }
});

// Get orders by status
router.get('/orders/status/:status', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const result = await orderProcessingService.getOrdersByStatus(
      status as OrderStatus, 
      Number(page), 
      Number(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch orders by status' });
  }
});

// Get dashboard data
router.get('/dashboard', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const [
      stats,
      recentOrders,
      lowStockMaterials,
      processingQueue,
    ] = await Promise.all([
      orderProcessingService.getOrderProcessingStats(),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          items: {
            include: {
              stlFile: true,
              material: true,
            }
          }
        }
      }),
      prisma.materialInventory.findMany({
        where: {
          stock: { lte: prisma.materialInventory.fields.minStock },
          isAvailable: true,
        },
        include: {
          material: {
            select: {
              name: true,
              type: true,
            }
          }
        },
        orderBy: { stock: 'asc' }
      }),
      orderProcessingService.getOrderProcessingQueue(),
    ]);

    res.json({
      stats,
      recentOrders,
      lowStockMaterials,
      processingQueue,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get material inventory
router.get('/materials/inventory', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const inventory = await prisma.materialInventory.findMany({
      include: {
        material: {
          select: {
            name: true,
            type: true,
            price: true,
          }
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching material inventory:', error);
    res.status(500).json({ error: 'Failed to fetch material inventory' });
  }
});

// Update material inventory
router.patch('/materials/:id/inventory', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, minStock, isAvailable } = req.body;

    const inventory = await prisma.materialInventory.update({
      where: { materialId: id },
      data: {
        ...(stock !== undefined && { stock }),
        ...(minStock !== undefined && { minStock }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        material: {
          select: {
            name: true,
            type: true,
            price: true,
          }
        }
      }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Error updating material inventory:', error);
    res.status(500).json({ error: 'Failed to update material inventory' });
  }
});

// Get user management data
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status
router.patch('/users/:id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role && { role }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;