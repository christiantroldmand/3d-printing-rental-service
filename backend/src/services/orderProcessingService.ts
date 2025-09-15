import { PrismaClient, Order, OrderStatus, PrintStatus } from '@prisma/client';
import emailService from './emailService';
import chatService from './chatService';

const prisma = new PrismaClient();

class OrderProcessingService {
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Promise<Order | null> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          ...(notes && { notes }),
          ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
        },
        include: {
          user: true,
          items: {
            include: {
              stlFile: true,
              material: true,
            }
          }
        }
      });

      // Send notifications
      await this.sendOrderNotifications(order, newStatus);

      // Update print jobs if applicable
      if (this.shouldUpdatePrintJobs(newStatus)) {
        await this.updatePrintJobs(orderId, newStatus);
      }

      console.log(`Order ${order.orderNumber} status updated to ${newStatus}`);
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  private async sendOrderNotifications(order: Order & { user: any }, status: OrderStatus): Promise<void> {
    try {
      // Send email notification
      await emailService.sendOrderStatusUpdate(order.id, status);

      // Send chat notification (if user has phone number)
      if (order.user.phone) {
        await chatService.sendOrderStatusUpdate(order.id, status);
      }

      console.log(`Notifications sent for order ${order.orderNumber} status: ${status}`);
    } catch (error) {
      console.error('Error sending order notifications:', error);
    }
  }

  private shouldUpdatePrintJobs(status: OrderStatus): boolean {
    return ['IN_QUEUE', 'PRINTING', 'POST_PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED'].includes(status);
  }

  private async updatePrintJobs(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) return;

      for (const item of order.items) {
        const printJobStatus = this.mapOrderStatusToPrintStatus(status);
        
        await prisma.printJob.upsert({
          where: { orderItemId: item.id },
          update: {
            status: printJobStatus,
            ...(status === 'PRINTING' && { startedAt: new Date() }),
            ...(status === 'COMPLETED' && { completedAt: new Date() }),
          },
          create: {
            orderItemId: item.id,
            status: printJobStatus,
            printerId: 'bamboo-x1-carbon-1',
            ...(status === 'PRINTING' && { startedAt: new Date() }),
            ...(status === 'COMPLETED' && { completedAt: new Date() }),
          }
        });
      }
    } catch (error) {
      console.error('Error updating print jobs:', error);
    }
  }

  private mapOrderStatusToPrintStatus(orderStatus: OrderStatus): PrintStatus {
    switch (orderStatus) {
      case 'IN_QUEUE':
        return 'QUEUED';
      case 'PRINTING':
        return 'PRINTING';
      case 'POST_PROCESSING':
        return 'COMPLETED';
      case 'READY_FOR_PICKUP':
        return 'COMPLETED';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'QUEUED';
    }
  }

  async processNewOrder(orderId: string): Promise<Order | null> {
    try {
      // Get the order with all related data
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              stlFile: true,
              material: true,
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Send order confirmation
      await emailService.sendOrderConfirmation(orderId);
      await chatService.sendOrderConfirmation(orderId);

      // Create print jobs for each item
      for (const item of order.items) {
        await prisma.printJob.create({
          data: {
            orderItemId: item.id,
            status: 'QUEUED',
            printerId: 'bamboo-x1-carbon-1',
          }
        });
      }

      // Update order status to payment confirmed
      const updatedOrder = await this.updateOrderStatus(orderId, 'PAYMENT_CONFIRMED');

      console.log(`Order ${order.orderNumber} processed successfully`);
      return updatedOrder;
    } catch (error) {
      console.error('Error processing new order:', error);
      throw error;
    }
  }

  async getOrderProcessingStats(): Promise<any> {
    try {
      const [
        totalOrders,
        pendingOrders,
        printingOrders,
        completedOrders,
        averageProcessingTime,
        lowStockMaterials,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: { status: { in: ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'IN_QUEUE'] } }
        }),
        prisma.order.count({
          where: { status: 'PRINTING' }
        }),
        prisma.order.count({
          where: { status: 'COMPLETED' }
        }),
        this.calculateAverageProcessingTime(),
        this.getLowStockMaterials(),
      ]);

      return {
        totalOrders,
        pendingOrders,
        printingOrders,
        completedOrders,
        averageProcessingTime,
        lowStockMaterials,
        processingRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting order processing stats:', error);
      throw error;
    }
  }

  private async calculateAverageProcessingTime(): Promise<number> {
    try {
      const completedOrders = await prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          completedAt: true,
        }
      });

      if (completedOrders.length === 0) return 0;

      const totalHours = completedOrders.reduce((sum, order) => {
        const processingTime = order.completedAt!.getTime() - order.createdAt.getTime();
        return sum + (processingTime / (1000 * 60 * 60)); // Convert to hours
      }, 0);

      return totalHours / completedOrders.length;
    } catch (error) {
      console.error('Error calculating average processing time:', error);
      return 0;
    }
  }

  private async getLowStockMaterials(): Promise<any[]> {
    try {
      return await prisma.materialInventory.findMany({
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
      });
    } catch (error) {
      console.error('Error getting low stock materials:', error);
      return [];
    }
  }

  async getOrdersByStatus(status: OrderStatus, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { status },
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where: { status } })
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw error;
    }
  }

  async getOrderProcessingQueue(): Promise<any[]> {
    try {
      return await prisma.printJob.findMany({
        where: {
          status: { in: ['QUEUED', 'PREPARING', 'PRINTING'] }
        },
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    }
                  }
                }
              },
              stlFile: true,
              material: true,
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    } catch (error) {
      console.error('Error getting order processing queue:', error);
      throw error;
    }
  }

  async updatePrintJobStatus(printJobId: string, status: PrintStatus, notes?: string, errorMessage?: string): Promise<any> {
    try {
      const printJob = await prisma.printJob.update({
        where: { id: printJobId },
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
                include: { user: true }
              }
            }
          }
        }
      });

      // Update corresponding order status if needed
      const orderStatus = this.mapPrintStatusToOrderStatus(status);
      if (orderStatus) {
        await this.updateOrderStatus(printJob.orderItem.order.id, orderStatus, notes);
      }

      return printJob;
    } catch (error) {
      console.error('Error updating print job status:', error);
      throw error;
    }
  }

  private mapPrintStatusToOrderStatus(printStatus: PrintStatus): OrderStatus | null {
    switch (printStatus) {
      case 'PRINTING':
        return 'PRINTING';
      case 'COMPLETED':
        return 'POST_PROCESSING';
      case 'FAILED':
        return 'CANCELLED';
      default:
        return null;
    }
  }
}

export default new OrderProcessingService();
