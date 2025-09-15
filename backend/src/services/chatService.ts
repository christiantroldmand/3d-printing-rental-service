import axios from 'axios';
import { PrismaClient, Order, OrderStatus, User } from '@prisma/client';

const prisma = new PrismaClient();

interface FacebookMessage {
  recipient: { id: string };
  message: { text: string };
}

interface FacebookQuickReply {
  content_type: 'text';
  title: string;
  payload: string;
}

interface FacebookTemplate {
  template_type: 'generic';
  elements: Array<{
    title: string;
    subtitle: string;
    buttons: Array<{
      type: 'web_url' | 'postback';
      title: string;
      url?: string;
      payload?: string;
    }>;
  }>;
}

class ChatService {
  private pageAccessToken: string;
  private apiUrl: string;

  constructor() {
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`;
  }

  private async sendFacebookMessage(recipientId: string, message: any): Promise<boolean> {
    try {
      const response = await axios.post(this.apiUrl, {
        recipient: { id: recipientId },
        message,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error sending Facebook message:', error);
      return false;
    }
  }

  private getOrderStatusMessage(status: OrderStatus, order: Order & { user: User }): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    switch (status) {
      case 'PAYMENT_CONFIRMED':
        return `✅ Order Confirmed!\n\nYour order ${order.orderNumber} has been confirmed and payment received.\n\nTotal: €${order.totalAmount.toFixed(2)}\n\nWe'll start processing your order shortly!`;
      
      case 'IN_QUEUE':
        return `🔄 Order in Queue\n\nYour order ${order.orderNumber} is now in our print queue.\n\nEstimated start time: Within 24 hours\n\nWe'll notify you when printing begins!`;
      
      case 'PRINTING':
        return `🖨️ Printing Started!\n\nGreat news! We've started printing your order ${order.orderNumber}.\n\nYou can track the progress in real-time through your dashboard!`;
      
      case 'READY_FOR_PICKUP':
        return `📦 Order Ready!\n\nYour order ${order.orderNumber} is ready for pickup!\n\n📍 Location: Our facility in Copenhagen\n🕒 Hours: Monday-Friday 9AM-6PM\n\nPlease bring ID and order number.`;
      
      case 'COMPLETED':
        return `🎉 Order Completed!\n\nYour order ${order.orderNumber} has been completed successfully!\n\nThank you for choosing 3D Print Pro!`;
      
      default:
        return `📋 Order Update\n\nYour order ${order.orderNumber} status has been updated to: ${status}`;
    }
  }

  private getOrderStatusTemplate(order: Order & { user: User }): FacebookTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return {
      template_type: 'generic',
      elements: [
        {
          title: `Order ${order.orderNumber}`,
          subtitle: `Status: ${order.status} • Total: €${order.totalAmount.toFixed(2)}`,
          buttons: [
            {
              type: 'web_url',
              title: 'View Order',
              url: `${baseUrl}/dashboard`,
            },
            {
              type: 'postback',
              title: 'Get Help',
              payload: 'HELP',
            },
          ],
        },
      ],
    };
  }

  async sendOrderStatusUpdate(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order || !order.user.phone) {
        console.log('Order not found or user has no phone number:', orderId);
        return false;
      }

      // For now, we'll use a simple text message
      // In production, you'd need to map phone numbers to Facebook user IDs
      const message = this.getOrderStatusMessage(newStatus, order);
      
      // This is a simplified version - in production you'd need:
      // 1. User phone number to Facebook ID mapping
      // 2. Proper webhook handling for Facebook Messenger
      // 3. User opt-in for receiving messages
      
      console.log(`Would send Facebook message to user ${order.user.id}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending Facebook message:', error);
      return false;
    }
  }

  async sendWelcomeMessage(user: User): Promise<boolean> {
    try {
      if (!user.phone) {
        console.log('User has no phone number for messaging');
        return false;
      }

      const message = `🎉 Welcome to 3D Print Pro!\n\nHello ${user.firstName}, we're excited to help you bring your 3D designs to life!\n\nGet started by uploading your first 3D file and getting an instant quote.`;
      
      console.log(`Would send welcome message to user ${user.id}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome message:', error);
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

      if (!order || !order.user.phone) {
        console.log('Order not found or user has no phone number');
        return false;
      }

      const message = `✅ Order Confirmation!\n\nOrder: ${order.orderNumber}\nTotal: €${order.totalAmount.toFixed(2)}\n\nThank you for your order! We'll start processing it shortly and keep you updated.`;
      
      console.log(`Would send order confirmation to user ${order.user.id}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation message:', error);
      return false;
    }
  }

  // Webhook handler for Facebook Messenger
  async handleWebhook(req: any, res: any): Promise<void> {
    try {
      const body = req.body;

      if (body.object === 'page') {
        body.entry.forEach((entry: any) => {
          const webhookEvent = entry.messaging[0];
          console.log('Received webhook event:', webhookEvent);

          if (webhookEvent.message) {
            this.handleMessage(webhookEvent);
          } else if (webhookEvent.postback) {
            this.handlePostback(webhookEvent);
          }
        });

        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.sendStatus(500);
    }
  }

  private async handleMessage(event: any): Promise<void> {
    const senderId = event.sender.id;
    const message = event.message;

    if (message.text) {
      // Handle text messages
      const response = await this.processMessage(senderId, message.text);
      if (response) {
        await this.sendFacebookMessage(senderId, { text: response });
      }
    }
  }

  private async handlePostback(event: any): Promise<void> {
    const senderId = event.sender.id;
    const payload = event.postback.payload;

    let response = '';
    
    switch (payload) {
      case 'HELP':
        response = 'How can I help you today?\n\n• Check order status\n• Get pricing info\n• Contact support\n\nType your question or use the menu below.';
        break;
      case 'ORDER_STATUS':
        response = 'To check your order status, please provide your order number or email address.';
        break;
      case 'PRICING':
        response = 'Our pricing is based on:\n• Material used\n• Print time\n• Electricity costs\n\nVisit our website for an instant quote!';
        break;
      default:
        response = 'I didn\'t understand that. How can I help you?';
    }

    if (response) {
      await this.sendFacebookMessage(senderId, { text: response });
    }
  }

  private async processMessage(senderId: string, messageText: string): Promise<string | null> {
    const text = messageText.toLowerCase();

    if (text.includes('hello') || text.includes('hi')) {
      return 'Hello! Welcome to 3D Print Pro! How can I help you today?';
    }

    if (text.includes('order') && text.includes('status')) {
      return 'To check your order status, please provide your order number or email address.';
    }

    if (text.includes('price') || text.includes('cost')) {
      return 'Our pricing is based on material used, print time, and electricity costs. Visit our website for an instant quote!';
    }

    if (text.includes('help')) {
      return 'I can help you with:\n• Order status\n• Pricing information\n• General questions\n\nWhat would you like to know?';
    }

    return 'I\'m here to help! You can ask me about order status, pricing, or any other questions about 3D printing services.';
  }
}

export default new ChatService();
