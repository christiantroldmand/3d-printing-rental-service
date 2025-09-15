import nodemailer from 'nodemailer';
import { PrismaClient, Order, OrderStatus, User } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private getOrderStatusTemplate(status: OrderStatus, order: Order & { user: User }): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    switch (status) {
      case 'PAYMENT_CONFIRMED':
        return {
          subject: `Order Confirmed - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Order Confirmed!</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Your order <strong>${order.orderNumber}</strong> has been confirmed and payment received.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order Number: ${order.orderNumber}</li>
                <li>Total Amount: €${order.totalAmount.toFixed(2)}</li>
                <li>Status: Payment Confirmed</li>
              </ul>
              <p>We'll start processing your order shortly. You'll receive updates as we progress.</p>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order Status</a>
              <p>Thank you for choosing 3D Print Pro!</p>
            </div>
          `,
          text: `Order Confirmed! Your order ${order.orderNumber} has been confirmed and payment received.`
        };

      case 'IN_QUEUE':
        return {
          subject: `Order in Queue - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">Order in Print Queue</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Your order <strong>${order.orderNumber}</strong> is now in our print queue.</p>
              <p>Estimated start time: Within 24 hours</p>
              <p>We'll notify you when printing begins.</p>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order Status</a>
            </div>
          `,
          text: `Your order ${order.orderNumber} is now in our print queue.`
        };

      case 'PRINTING':
        return {
          subject: `Printing Started - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Printing Started!</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Great news! We've started printing your order <strong>${order.orderNumber}</strong>.</p>
              <p>You can track the progress in real-time through your dashboard.</p>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Progress</a>
            </div>
          `,
          text: `Printing started for your order ${order.orderNumber}.`
        };

      case 'READY_FOR_PICKUP':
        return {
          subject: `Order Ready for Pickup - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Order Ready!</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Your order <strong>${order.orderNumber}</strong> is ready for pickup!</p>
              <p><strong>Pickup Details:</strong></p>
              <ul>
                <li>Location: Our facility in Copenhagen</li>
                <li>Hours: Monday-Friday 9AM-6PM</li>
                <li>Please bring ID and order number</li>
              </ul>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>
            </div>
          `,
          text: `Your order ${order.orderNumber} is ready for pickup!`
        };

      case 'COMPLETED':
        return {
          subject: `Order Completed - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Order Completed!</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Your order <strong>${order.orderNumber}</strong> has been completed successfully!</p>
              <p>Thank you for choosing 3D Print Pro. We hope you're satisfied with your print!</p>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
            </div>
          `,
          text: `Your order ${order.orderNumber} has been completed!`
        };

      default:
        return {
          subject: `Order Update - ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Order Update</h2>
              <p>Hello ${order.user.firstName},</p>
              <p>Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
              <a href="${baseUrl}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
            </div>
          `,
          text: `Your order ${order.orderNumber} status has been updated to: ${status}`
        };
    }
  }

  async sendOrderStatusUpdate(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        console.error('Order not found:', orderId);
        return false;
      }

      const template = this.getOrderStatusTemplate(newStatus, order);

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@3dprintpro.com',
        to: order.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Order status email sent to ${order.user.email} for order ${order.orderNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending order status email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(user: User): Promise<boolean> {
    try {
      const template = {
        subject: 'Welcome to 3D Print Pro!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Welcome to 3D Print Pro!</h2>
            <p>Hello ${user.firstName},</p>
            <p>Welcome to 3D Print Pro! We're excited to help you bring your 3D designs to life.</p>
            <p>Get started by uploading your first 3D file and getting an instant quote.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/order" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Printing</a>
            <p>If you have any questions, feel free to contact us!</p>
            <p>Best regards,<br>The 3D Print Pro Team</p>
          </div>
        `,
        text: `Welcome to 3D Print Pro! We're excited to help you bring your 3D designs to life.`
      };

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@3dprintpro.com',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  async sendOrderConfirmation(orderId: string): Promise<boolean> {
    try {
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
        },
      });

      if (!order) {
        console.error('Order not found:', orderId);
        return false;
      }

      const template = {
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Order Confirmation</h2>
            <p>Hello ${order.user.firstName},</p>
            <p>Thank you for your order! Here are the details:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Total Amount:</strong> €${order.totalAmount.toFixed(2)}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>Items Ordered</h3>
              ${order.items.map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                  <p><strong>File:</strong> ${item.stlFile.originalName}</p>
                  <p><strong>Material:</strong> ${item.material.name}</p>
                  <p><strong>Quantity:</strong> ${item.quantity}</p>
                  <p><strong>Price:</strong> €${item.totalCost.toFixed(2)}</p>
                </div>
              `).join('')}
            </div>

            <p>We'll start processing your order shortly and keep you updated on the progress.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order Status</a>
            
            <p>Thank you for choosing 3D Print Pro!</p>
          </div>
        `,
        text: `Order Confirmation - ${order.orderNumber}. Total: €${order.totalAmount.toFixed(2)}`
      };

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@3dprintpro.com',
        to: order.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent to ${order.user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }
}

export default new EmailService();
