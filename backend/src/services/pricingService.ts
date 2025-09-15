import { PrismaClient } from '@prisma/client';
import nordpoolService from './nordpoolService';
import stlAnalysisService from './stlAnalysisService';

const prisma = new PrismaClient();

interface PricingCalculation {
  materialCost: number;
  electricityCost: number;
  laborCost: number;
  platformFee: number;
  totalCost: number;
  breakdown: {
    material: {
      cost: number;
      usage: number; // grams
      pricePerGram: number;
    };
    electricity: {
      cost: number;
      consumption: number; // kWh
      pricePerKwh: number;
    };
    labor: {
      cost: number;
      hours: number;
      ratePerHour: number;
    };
    platform: {
      fee: number;
      percentage: number;
    };
  };
}

interface PricingSettings {
  laborRatePerHour: number; // DKK per hour
  platformFeePercentage: number; // 0-100
  printerPowerConsumption: number; // Watts
  materialMarkup: number; // 0-100 (percentage markup on material cost)
  minimumOrderValue: number; // DKK
}

class PricingService {
  private readonly DEFAULT_SETTINGS: PricingSettings = {
    laborRatePerHour: 150, // 150 DKK per hour
    platformFeePercentage: 15, // 15% platform fee
    printerPowerConsumption: 200, // 200W average power consumption
    materialMarkup: 30, // 30% markup on material cost
    minimumOrderValue: 50, // 50 DKK minimum order
  };

  async calculateOrderPricing(
    stlFileId: string,
    materialId: string,
    printSettings: any,
    quantity: number = 1
  ): Promise<PricingCalculation> {
    try {
      // Get STL file analysis
      const stlFile = await prisma.sTLFile.findUnique({
        where: { id: stlFileId },
      });

      if (!stlFile) {
        throw new Error('STL file not found');
      }

      // Get material information
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        throw new Error('Material not found');
      }

      // Get current electricity price
      const electricityPrice = await nordpoolService.fetchCurrentElectricityPrice();

      // Calculate material usage and cost
      const materialUsage = stlFile.materialUsage || 0; // grams
      const materialCostPerGram = material.price / 1000; // Convert DKK/kg to DKK/g
      const materialCost = (materialUsage * materialCostPerGram * (1 + this.DEFAULT_SETTINGS.materialMarkup / 100)) * quantity;

      // Calculate electricity cost
      const printTimeHours = stlFile.estimatedPrintTime || 1;
      const electricityConsumption = (printTimeHours * this.DEFAULT_SETTINGS.printerPowerConsumption) / 1000; // kWh
      const electricityCost = electricityConsumption * electricityPrice * quantity;

      // Calculate labor cost
      const laborHours = printTimeHours * 1.2; // Add 20% for setup and post-processing
      const laborCost = laborHours * this.DEFAULT_SETTINGS.laborRatePerHour * quantity;

      // Calculate platform fee
      const subtotal = materialCost + electricityCost + laborCost;
      const platformFee = subtotal * (this.DEFAULT_SETTINGS.platformFeePercentage / 100);

      // Calculate total cost
      const totalCost = Math.max(subtotal + platformFee, this.DEFAULT_SETTINGS.minimumOrderValue);

      return {
        materialCost,
        electricityCost,
        laborCost,
        platformFee,
        totalCost,
        breakdown: {
          material: {
            cost: materialCost,
            usage: materialUsage * quantity,
            pricePerGram: materialCostPerGram,
          },
          electricity: {
            cost: electricityCost,
            consumption: electricityConsumption * quantity,
            pricePerKwh: electricityPrice,
          },
          labor: {
            cost: laborCost,
            hours: laborHours * quantity,
            ratePerHour: this.DEFAULT_SETTINGS.laborRatePerHour,
          },
          platform: {
            fee: platformFee,
            percentage: this.DEFAULT_SETTINGS.platformFeePercentage,
          },
        },
      };
    } catch (error) {
      console.error('Error calculating order pricing:', error);
      throw error;
    }
  }

  async calculatePricingFromVolume(
    volume: number, // cm³
    materialType: string,
    printSettings: any,
    quantity: number = 1
  ): Promise<PricingCalculation> {
    try {
      // Get material information
      const material = await prisma.material.findFirst({
        where: { type: materialType },
      });

      if (!material) {
        throw new Error('Material not found');
      }

      // Get current electricity price
      const electricityPrice = await nordpoolService.fetchCurrentElectricityPrice();

      // Estimate material usage based on volume and settings
      const materialDensity = this.getMaterialDensity(materialType);
      const infillPercentage = printSettings.infillPercentage || 20;
      const estimatedMaterialUsage = (volume * materialDensity * (infillPercentage / 100)) * 1000; // Convert to grams

      // Calculate material cost
      const materialCostPerGram = material.price / 1000; // Convert DKK/kg to DKK/g
      const materialCost = (estimatedMaterialUsage * materialCostPerGram * (1 + this.DEFAULT_SETTINGS.materialMarkup / 100)) * quantity;

      // Estimate print time based on volume
      const estimatedPrintTime = this.estimatePrintTimeFromVolume(volume, printSettings);

      // Calculate electricity cost
      const electricityConsumption = (estimatedPrintTime * this.DEFAULT_SETTINGS.printerPowerConsumption) / 1000; // kWh
      const electricityCost = electricityConsumption * electricityPrice * quantity;

      // Calculate labor cost
      const laborHours = estimatedPrintTime * 1.2; // Add 20% for setup and post-processing
      const laborCost = laborHours * this.DEFAULT_SETTINGS.laborRatePerHour * quantity;

      // Calculate platform fee
      const subtotal = materialCost + electricityCost + laborCost;
      const platformFee = subtotal * (this.DEFAULT_SETTINGS.platformFeePercentage / 100);

      // Calculate total cost
      const totalCost = Math.max(subtotal + platformFee, this.DEFAULT_SETTINGS.minimumOrderValue);

      return {
        materialCost,
        electricityCost,
        laborCost,
        platformFee,
        totalCost,
        breakdown: {
          material: {
            cost: materialCost,
            usage: estimatedMaterialUsage * quantity,
            pricePerGram: materialCostPerGram,
          },
          electricity: {
            cost: electricityCost,
            consumption: electricityConsumption * quantity,
            pricePerKwh: electricityPrice,
          },
          labor: {
            cost: laborCost,
            hours: laborHours * quantity,
            ratePerHour: this.DEFAULT_SETTINGS.laborRatePerHour,
          },
          platform: {
            fee: platformFee,
            percentage: this.DEFAULT_SETTINGS.platformFeePercentage,
          },
        },
      };
    } catch (error) {
      console.error('Error calculating pricing from volume:', error);
      throw error;
    }
  }

  private getMaterialDensity(materialType: string): number {
    const densities: { [key: string]: number } = {
      PLA: 1.24,
      PETG: 1.27,
      ABS: 1.04,
      TPU: 1.20,
      ASA: 1.05,
    };
    return densities[materialType] || 1.24; // Default to PLA density
  }

  private estimatePrintTimeFromVolume(volume: number, printSettings: any): number {
    // Simple estimation based on volume and settings
    const layerHeight = printSettings.layerHeight || 0.2; // mm
    const infillPercentage = printSettings.infillPercentage || 20;
    const printSpeed = 60; // mm/s average

    // Estimate based on volume and complexity
    const baseTime = Math.sqrt(volume) * 0.1; // Base time in hours
    const infillMultiplier = 1 + (infillPercentage / 100);
    const layerHeightMultiplier = 0.2 / layerHeight; // Thinner layers take longer

    return baseTime * infillMultiplier * layerHeightMultiplier;
  }

  async updatePricingSettings(settings: Partial<PricingSettings>): Promise<void> {
    try {
      // Store pricing settings in configuration table
      for (const [key, value] of Object.entries(settings)) {
        await prisma.configuration.upsert({
          where: { key: `pricing.${key}` },
          update: { value: value.toString() },
          create: { key: `pricing.${key}`, value: value.toString() },
        });
      }
    } catch (error) {
      console.error('Error updating pricing settings:', error);
      throw error;
    }
  }

  async getPricingSettings(): Promise<PricingSettings> {
    try {
      const configs = await prisma.configuration.findMany({
        where: {
          key: {
            startsWith: 'pricing.',
          },
        },
      });

      const settings = { ...this.DEFAULT_SETTINGS };

      for (const config of configs) {
        const key = config.key.replace('pricing.', '');
        const value = parseFloat(config.value);
        
        if (!isNaN(value)) {
          (settings as any)[key] = value;
        }
      }

      return settings;
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  async getPricingBreakdown(orderId: string): Promise<PricingCalculation | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              stlFile: true,
              material: true,
            },
          },
        },
      });

      if (!order || order.items.length === 0) {
        return null;
      }

      const item = order.items[0]; // For simplicity, calculate for first item
      
      return await this.calculateOrderPricing(
        item.stlFileId,
        item.materialId,
        {
          layerHeight: 0.2,
          infillPercentage: 20,
        },
        item.quantity
      );
    } catch (error) {
      console.error('Error getting pricing breakdown:', error);
      return null;
    }
  }

  // Get current electricity price for display
  async getCurrentElectricityPrice(): Promise<number> {
    return await nordpoolService.fetchCurrentElectricityPrice();
  }

  // Get electricity price history
  async getElectricityPriceHistory(days: number = 7): Promise<any[]> {
    return await nordpoolService.getElectricityPriceHistory(days);
  }
}

export default new PricingService();
