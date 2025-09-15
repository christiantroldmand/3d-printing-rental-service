import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NordpoolPrice {
  timestamp: string;
  price: number;
  currency: string;
  area: string;
}

interface NordpoolResponse {
  data: {
    Rows: Array<{
      Name: string;
      Columns: Array<{
        Name: string;
        Value: string;
      }>;
    }>;
  };
}

class NordpoolService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.NORDPOOL_API_URL || 'https://api.nordpoolgroup.com/v1';
    this.apiKey = process.env.NORDPOOL_API_KEY || '';
  }

  async fetchCurrentElectricityPrice(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/marketdata/price`, {
        params: {
          currency: 'DKK',
          area: 'DK2', // Denmark West (Copenhagen area)
          format: 'json',
        },
        headers: {
          'Accept': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });

      const data: NordpoolResponse = response.data;
      
      // Extract current price from the response
      const currentHour = new Date().getHours();
      let currentPrice = 0;

      for (const row of data.data.Rows) {
        if (row.Name.includes('DK2')) {
          for (const column of row.Columns) {
            if (column.Name && column.Value && column.Value !== '-') {
              const price = parseFloat(column.Value.replace(',', '.'));
              if (!isNaN(price)) {
                currentPrice = price;
                break;
              }
            }
          }
          break;
        }
      }

      // If no current price found, use average of available prices
      if (currentPrice === 0) {
        const prices: number[] = [];
        for (const row of data.data.Rows) {
          for (const column of row.Columns) {
            if (column.Name && column.Value && column.Value !== '-') {
              const price = parseFloat(column.Value.replace(',', '.'));
              if (!isNaN(price)) {
                prices.push(price);
              }
            }
          }
        }
        currentPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0.5; // Fallback to 0.5 DKK/kWh
      }

      // Store the price in database
      await this.storeElectricityPrice(currentPrice);

      console.log(`Current electricity price for DK2: ${currentPrice} DKK/kWh`);
      return currentPrice;
    } catch (error) {
      console.error('Error fetching electricity price from Nordpool:', error);
      
      // Fallback to last known price or default
      const lastPrice = await this.getLastElectricityPrice();
      return lastPrice || 0.5; // Default fallback price
    }
  }

  private async storeElectricityPrice(price: number): Promise<void> {
    try {
      await prisma.electricityPrice.create({
        data: {
          timestamp: new Date(),
          price: price,
          currency: 'DKK',
          area: 'DK2',
        },
      });
    } catch (error) {
      console.error('Error storing electricity price:', error);
    }
  }

  private async getLastElectricityPrice(): Promise<number | null> {
    try {
      const lastPrice = await prisma.electricityPrice.findFirst({
        where: { area: 'DK2' },
        orderBy: { timestamp: 'desc' },
      });

      return lastPrice?.price || null;
    } catch (error) {
      console.error('Error fetching last electricity price:', error);
      return null;
    }
  }

  async getElectricityPriceHistory(days: number = 7): Promise<NordpoolPrice[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const prices = await prisma.electricityPrice.findMany({
        where: {
          area: 'DK2',
          timestamp: {
            gte: startDate,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      return prices.map(price => ({
        timestamp: price.timestamp.toISOString(),
        price: price.price,
        currency: price.currency,
        area: price.area,
      }));
    } catch (error) {
      console.error('Error fetching electricity price history:', error);
      return [];
    }
  }

  async getAverageElectricityPrice(hours: number = 24): Promise<number> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const prices = await prisma.electricityPrice.findMany({
        where: {
          area: 'DK2',
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (prices.length === 0) {
        return await this.fetchCurrentElectricityPrice();
      }

      const averagePrice = prices.reduce((sum, price) => sum + price.price, 0) / prices.length;
      return averagePrice;
    } catch (error) {
      console.error('Error calculating average electricity price:', error);
      return await this.fetchCurrentElectricityPrice();
    }
  }

  // Calculate electricity cost for printing
  calculateElectricityCost(printTimeHours: number, printerPowerConsumption: number = 200): number {
    return printTimeHours * (printerPowerConsumption / 1000) * this.getCurrentPrice();
  }

  private getCurrentPrice(): number {
    // This would ideally be cached and updated regularly
    return 0.5; // Fallback price in DKK/kWh
  }

  // Start background job to fetch prices regularly
  startPriceUpdateJob(): void {
    // Fetch current price immediately
    this.fetchCurrentElectricityPrice();

    // Update every hour
    setInterval(() => {
      this.fetchCurrentElectricityPrice();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Nordpool price update job started');
  }
}

export default new NordpoolService();
