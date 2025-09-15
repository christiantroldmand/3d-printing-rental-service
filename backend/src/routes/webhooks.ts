import express from 'express';
import chatService from '../services/chatService';

const router = express.Router();

// Facebook Messenger webhook verification
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('Facebook webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('Facebook webhook verification failed');
    res.sendStatus(403);
  }
});

// Facebook Messenger webhook handler
router.post('/facebook', (req, res) => {
  chatService.handleWebhook(req, res);
});

// Stripe webhook handler
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentFailed(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Payment success handler
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);
    
    // Find the order by payment intent ID
    const order = await require('../services/orderProcessingService').default.processNewOrder(
      paymentIntent.metadata.orderId
    );

    if (order) {
      console.log(`Order ${order.orderNumber} processed after successful payment`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Payment failure handler
async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Update order status to payment failed
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.order.update({
      where: { id: paymentIntent.metadata.orderId },
      data: { status: 'PAYMENT_FAILED' }
    });

    console.log(`Order ${paymentIntent.metadata.orderId} marked as payment failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Invoice payment success handler
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('Invoice payment succeeded:', invoice.id);
    // Handle subscription or recurring payment success
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

// Invoice payment failure handler
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    console.log('Invoice payment failed:', invoice.id);
    // Handle subscription or recurring payment failure
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}

export default router;
