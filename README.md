# 3D Printing Rental Service

A comprehensive web-based platform offering 3D printing rental services using Bamboo Lab X1 Carbon printer, featuring dynamic pricing based on filament usage, print time, and real-time electricity costs from Nordpool.

## 🚀 Features

- **3D File Support**: Upload and preview STL, OBJ, and 3MF files
- **Material Management**: Support for PLA, PETG, ABS, TPU, and specialty materials
- **Dynamic Pricing**: Real-time cost calculation based on filament usage, print time, and electricity prices
- **Interactive 3D Preview**: Three.js-powered 3D viewer with print bed visualization
- **Secure Payments**: Stripe integration with multiple payment methods
- **Real-time Tracking**: Order status updates and print progress monitoring
- **Electricity Integration**: Nordpool API integration for accurate electricity cost calculation

## 🏗️ Architecture

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **3D Rendering**: Three.js
- **Payment Processing**: Stripe
- **File Storage**: AWS S3
- **Electricity Data**: Nordpool API

## 📋 Project Structure

```
├── requirements-specification.md    # Detailed requirements document
├── implementation-roadmap.md        # 12-week implementation plan
├── frontend/                        # React frontend application
├── backend/                         # Node.js backend API
├── database/                        # Database schema and migrations
└── docs/                           # Additional documentation
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Docker (optional)
- Stripe account
- Nordpool API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/3d-printing-rental-service.git
cd 3d-printing-rental-service
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. Start the development servers:
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm start
```

## 📊 Pricing Formula

The system calculates pricing using the following formula:

```
Total Price = (Material Cost + Time Cost + Electricity Cost) × (1 + Labor Markup + Platform Fee)

Where:
- Material Cost = Filament Weight (g) × Material Price (€/g)
- Time Cost = Print Time (hours) × Hourly Rate (€/hour)
- Electricity Cost = Power Consumption (kWh) × Electricity Price (€/kWh)
- Labor Markup = 15%
- Platform Fee = 5%
```

## 🔧 Key Components

### Material Management
- Comprehensive material database with properties
- Real-time inventory tracking
- Material compatibility checking
- Color and finish options

### STL Analysis Engine
- Volume and weight calculation
- Printability assessment
- Support structure estimation
- Print time calculation

### 3D Preview System
- Interactive 3D viewer
- Print bed visualization
- Layer-by-layer preview
- Mobile-responsive design

### Dynamic Pricing
- Real-time electricity price integration
- Filament usage calculation
- Print time estimation
- Cost breakdown display

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📈 Performance

- **Page Load Time**: < 3 seconds
- **STL Preview Loading**: < 5 seconds for files up to 10MB
- **API Response Time**: < 500ms for 95% of requests
- **Concurrent Users**: 100+ simultaneous users

## 🔒 Security

- GDPR compliance
- PCI DSS Level 1 compliance
- File security scanning
- JWT authentication
- Rate limiting and API security

## 🚀 Deployment

The application is containerized with Docker and can be deployed to any container orchestration platform.

```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- [Requirements Specification](requirements-specification.md) - Detailed project requirements
- [Implementation Roadmap](implementation-roadmap.md) - 12-week development plan
- [API Documentation](docs/api.md) - Backend API reference
- [Component Library](docs/components.md) - Frontend component documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact: [your-email@example.com]
- Documentation: [project-docs-url]

## 🗺️ Roadmap

See [implementation-roadmap.md](implementation-roadmap.md) for the complete 12-week development plan.

### Phase 1: Foundation (Weeks 1-2)
- Project setup and architecture
- Database schema design
- Authentication system

### Phase 2: Core Logic (Weeks 3-4)
- Material management
- STL file analysis
- 3D preview system

### Phase 3: Pricing & Orders (Weeks 5-6)
- Dynamic pricing calculator
- Order management
- Stripe integration

### Phase 4: UI/UX (Weeks 7-8)
- User interface components
- Order workflow
- Admin panel

### Phase 5: Testing (Weeks 9-10)
- Comprehensive testing suite
- Performance optimization
- Security testing

### Phase 6: Production (Weeks 11-12)
- Deployment setup
- Monitoring and logging
- Security hardening

---

**Status**: 🚧 In Development  
**Version**: 0.1.0  
**Last Updated**: December 2024
