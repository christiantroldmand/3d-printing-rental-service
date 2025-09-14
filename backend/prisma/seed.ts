import { PrismaClient, MaterialType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@3dprintpro.com' },
    update: {},
    create: {
      email: 'admin@3dprintpro.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  // Create test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
    },
  });

  // Create materials
  const materials = [
    {
      name: 'PLA',
      type: MaterialType.PLA,
      density: 1.24,
      costPerGram: 0.05,
      printTempMin: 190,
      printTempMax: 220,
      bedTempMin: 50,
      bedTempMax: 70,
      printSpeed: 1.0,
      shrinkageFactor: 0.02,
    },
    {
      name: 'PETG',
      type: MaterialType.PETG,
      density: 1.27,
      costPerGram: 0.06,
      printTempMin: 220,
      printTempMax: 250,
      bedTempMin: 70,
      bedTempMax: 90,
      printSpeed: 0.8,
      shrinkageFactor: 0.01,
    },
    {
      name: 'ABS',
      type: MaterialType.ABS,
      density: 1.04,
      costPerGram: 0.07,
      printTempMin: 240,
      printTempMax: 260,
      bedTempMin: 80,
      bedTempMax: 100,
      printSpeed: 0.7,
      shrinkageFactor: 0.05,
    },
    {
      name: 'TPU',
      type: MaterialType.TPU,
      density: 1.20,
      costPerGram: 0.08,
      printTempMin: 220,
      printTempMax: 250,
      bedTempMin: 50,
      bedTempMax: 70,
      printSpeed: 0.5,
      shrinkageFactor: 0.03,
    },
    {
      name: 'Wood-filled PLA',
      type: MaterialType.WOOD_FILLED,
      density: 1.25,
      costPerGram: 0.12,
      printTempMin: 200,
      printTempMax: 230,
      bedTempMin: 50,
      bedTempMax: 70,
      printSpeed: 0.8,
      shrinkageFactor: 0.02,
    },
    {
      name: 'Metal-filled PLA',
      type: MaterialType.METAL_FILLED,
      density: 1.30,
      costPerGram: 0.15,
      printTempMin: 200,
      printTempMax: 230,
      bedTempMin: 50,
      bedTempMax: 70,
      printSpeed: 0.7,
      shrinkageFactor: 0.02,
    },
  ];

  for (const materialData of materials) {
    const material = await prisma.material.upsert({
      where: { name: materialData.name },
      update: {},
      create: materialData,
    });

    // Create inventory for each material with different colors
    const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'];
    
    for (const color of colors) {
      await prisma.materialInventory.upsert({
        where: {
          materialId_color: {
            materialId: material.id,
            color: color,
          },
        },
        update: {},
        create: {
          materialId: material.id,
          color: color,
          stock: Math.floor(Math.random() * 500) + 100,
          minStock: 10,
          maxStock: 1000,
        },
      });
    }
  }

  // Create system configuration
  const systemConfigs = [
    {
      key: 'hourly_rate',
      value: '15',
      description: 'Hourly rate for printing (EUR)',
    },
    {
      key: 'labor_markup',
      value: '0.15',
      description: 'Labor markup percentage',
    },
    {
      key: 'platform_fee',
      value: '0.05',
      description: 'Platform fee percentage',
    },
    {
      key: 'electricity_price',
      value: '0.25',
      description: 'Default electricity price (EUR/kWh)',
    },
    {
      key: 'printer_power_consumption',
      value: '0.2',
      description: 'Average printer power consumption (kW)',
    },
    {
      key: 'waste_factor',
      value: '0.05',
      description: 'Material waste factor percentage',
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // Create sample electricity prices (last 7 days)
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    for (let hour = 0; hour < 24; hour++) {
      const price = 0.15 + Math.random() * 0.3; // Random price between 0.15-0.45 EUR/kWh
      
      await prisma.electricityPrice.upsert({
        where: {
          date_hour_area: {
            date: date,
            hour: hour,
            area: 'DK1',
          },
        },
        update: {},
        create: {
          date: date,
          hour: hour,
          price: price,
          area: 'DK1',
        },
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@3dprintpro.com / admin123`);
  console.log(`👤 Customer user: customer@example.com / customer123`);
  console.log(`📦 Created ${materials.length} materials with inventory`);
  console.log(`⚙️ Created ${systemConfigs.length} system configurations`);
  console.log(`⚡ Created 7 days of electricity price data`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
