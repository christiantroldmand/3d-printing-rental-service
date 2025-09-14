# 3D Printing Rental Service - Requirements Specification

## Project Overview
A web-based platform offering 3D printing rental services using Bamboo Lab X1 Carbon printer, featuring dynamic pricing based on filament usage, print time, and real-time electricity costs from Nordpool.

## 1. System Architecture

### 1.1 Technology Stack
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Payment Processing**: Stripe
- **3D Rendering**: Three.js for STL preview
- **Electricity Data**: Nordpool API integration
- **File Storage**: AWS S3 or similar for STL files
- **Deployment**: Docker containers

### 1.2 Core Components
- Order Management System
- Payment Processing (Stripe)
- Material Management System
- 3D STL Preview Engine
- Dynamic Pricing Calculator
- Nordpool Electricity Price Integration
- User Authentication & Authorization
- Print Queue Management

## 2. Functional Requirements

### 2.1 User Management
- **User Registration & Authentication**
  - Email/password registration
  - OAuth integration (Google, Facebook)
  - Email verification
  - Password reset functionality
  - User profile management

- **User Roles**
  - Customer: Place orders, view print status
  - Admin: Manage materials, pricing, orders
  - Printer Operator: Monitor print queue, update status

### 2.2 Order Management System

#### 2.2.1 Order Creation
- **STL File Upload**
  - Support for .stl, .obj, .3mf file formats
  - File size limit: 50MB per file
  - File validation and security scanning
  - Automatic file optimization for preview

- **Material Selection**
  - Available materials database
  - Material properties (density, cost per gram, print settings)
  - Color selection from available options
  - Material compatibility checking

- **Print Configuration**
  - Layer height selection (0.1mm, 0.2mm, 0.3mm)
  - Infill percentage (10%, 20%, 30%, 50%, 100%)
  - Support structure requirements
  - Print quality settings (draft, normal, high)

#### 2.2.2 Order Processing
- **Automatic Pricing Calculation**
  - Filament weight estimation
  - Print time calculation
  - Electricity cost calculation
  - Labor cost markup
  - Material cost calculation

- **Order Status Tracking**
  - Pending payment
  - Payment confirmed
  - In queue
  - Printing
  - Post-processing
  - Ready for pickup/shipping
  - Completed
  - Cancelled

### 2.3 Payment Integration (Stripe)

#### 2.3.1 Payment Methods
- Credit/Debit cards (Visa, Mastercard, American Express)
- Digital wallets (Apple Pay, Google Pay)
- Bank transfers (SEPA for EU customers)
- Buy now, pay later options (Klarna, Afterpay)

#### 2.3.2 Payment Processing
- Secure payment form with Stripe Elements
- PCI DSS compliance
- 3D Secure authentication
- Payment confirmation emails
- Refund processing
- Payment failure handling

#### 2.3.3 Pricing Structure
- **Base Pricing Components**:
  - Material cost per gram
  - Printer time cost per hour
  - Electricity cost per kWh (Nordpool integration)
  - Labor cost markup (15%)
  - Platform fee (5%)

### 2.4 Material Management System

#### 2.4.1 Material Database
- **Material Types**:
  - PLA (Polylactic Acid)
  - PETG (Polyethylene Terephthalate Glycol)
  - ABS (Acrylonitrile Butadiene Styrene)
  - TPU (Thermoplastic Polyurethane)
  - Wood-filled PLA
  - Metal-filled PLA
  - Carbon fiber-filled materials

- **Material Properties**:
  - Density (g/cm³)
  - Cost per gram (EUR)
  - Print temperature range
  - Bed temperature requirements
  - Print speed limitations
  - Shrinkage factor
  - Color availability

#### 2.4.2 Inventory Management
- Real-time stock levels
- Low stock alerts
- Material ordering system
- Batch tracking
- Expiration date management

### 2.5 3D STL Preview System

#### 2.5.1 File Processing
- **STL File Analysis**:
  - Volume calculation
  - Bounding box dimensions
  - Surface area calculation
  - Mesh validation and repair
  - Printability assessment

#### 2.5.2 3D Visualization
- **Interactive 3D Viewer**:
  - Rotate, zoom, pan controls
  - Multiple view modes (wireframe, solid, textured)
  - Print bed visualization
  - Support structure preview
  - Layer-by-layer preview

- **Technical Specifications**:
  - WebGL-based rendering
  - Mobile-responsive design
  - Touch gesture support
  - Performance optimization for large files

### 2.6 Dynamic Pricing Engine

#### 2.6.1 Filament Usage Calculation
- **Volume-to-Weight Conversion**:
  - STL file volume analysis
  - Material density application
  - Infill percentage calculation
  - Support material estimation
  - Waste factor (5-10%)

#### 2.6.2 Print Time Estimation
- **Bamboo Lab X1 Carbon Specifications**:
  - Maximum print speed: 200mm/s
  - Layer height range: 0.05-0.3mm
  - Nozzle diameter: 0.4mm
  - Build volume: 256×256×256mm

- **Time Calculation Factors**:
  - Layer count calculation
  - Travel time estimation
  - Acceleration/deceleration
  - Support generation time
  - Bed heating time
  - Cool-down time

#### 2.6.3 Electricity Cost Integration

##### 2.6.3.1 Nordpool API Integration
- **Real-time Price Data**:
  - Hourly electricity prices
  - Day-ahead market prices
  - Intraday market prices
  - Price forecasting (24-48 hours)

- **API Specifications**:
  - Endpoint: `https://api.nordpoolgroup.com/v1/`
  - Authentication: API key required
  - Rate limiting: 1000 requests/hour
  - Data format: JSON

##### 2.6.3.2 Power Consumption Calculation
- **Bamboo Lab X1 Carbon Power Usage**:
  - Idle power: 2W
  - Heating power: 300W (bed + nozzle)
  - Printing power: 200W average
  - Cooling power: 50W

- **Cost Calculation**:
  - Print time × average power consumption
  - Real-time electricity price application
  - Peak/off-peak pricing consideration
  - Carbon footprint calculation

### 2.7 Pricing Formula

```
Total Price = (Material Cost + Time Cost + Electricity Cost) × (1 + Labor Markup + Platform Fee)

Where:
- Material Cost = Filament Weight (g) × Material Price (€/g)
- Time Cost = Print Time (hours) × Hourly Rate (€/hour)
- Electricity Cost = Power Consumption (kWh) × Electricity Price (€/kWh)
- Labor Markup = 15%
- Platform Fee = 5%
```

## 3. Non-Functional Requirements

### 3.1 Performance Requirements
- **Page Load Time**: < 3 seconds
- **STL Preview Loading**: < 5 seconds for files up to 10MB
- **Payment Processing**: < 10 seconds
- **API Response Time**: < 500ms for 95% of requests
- **Concurrent Users**: Support 100+ simultaneous users

### 3.2 Security Requirements
- **Data Protection**: GDPR compliance
- **Payment Security**: PCI DSS Level 1 compliance
- **File Security**: Virus scanning for uploaded files
- **API Security**: Rate limiting, authentication, encryption
- **Data Encryption**: AES-256 for sensitive data

### 3.3 Scalability Requirements
- **Horizontal Scaling**: Microservices architecture
- **Database Scaling**: Read replicas, connection pooling
- **File Storage**: CDN integration for STL files
- **Caching**: Redis for frequently accessed data

### 3.4 Availability Requirements
- **Uptime**: 99.9% availability
- **Backup**: Daily automated backups
- **Disaster Recovery**: RTO < 4 hours, RPO < 1 hour
- **Monitoring**: Real-time system monitoring

## 4. User Interface Requirements

### 4.1 Design Principles
- **Mobile-First**: Responsive design for all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **User Experience**: Intuitive, minimal learning curve
- **Branding**: Professional, modern aesthetic

### 4.2 Key Pages
- **Landing Page**: Service overview, pricing calculator
- **Order Form**: Step-by-step order creation
- **3D Preview**: Interactive STL viewer
- **Order Status**: Real-time print progress
- **User Dashboard**: Order history, account management
- **Admin Panel**: Material management, order oversight

### 4.3 Interactive Elements
- **Pricing Calculator**: Real-time price updates
- **3D Viewer**: Touch/click interactions
- **Progress Tracking**: Visual print status updates
- **File Upload**: Drag-and-drop interface

## 5. Integration Requirements

### 5.1 External APIs
- **Stripe API**: Payment processing
- **Nordpool API**: Electricity pricing
- **Email Service**: Transactional emails (SendGrid/Mailgun)
- **SMS Service**: Order notifications (Twilio)
- **Shipping API**: Package tracking (PostNord/DHL)

### 5.2 Internal Systems
- **Printer Management**: Bamboo Lab X1 Carbon integration
- **File Storage**: AWS S3 or equivalent
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for performance
- **Monitoring**: Application performance monitoring

## 6. Data Requirements

### 6.1 Data Models
- **User**: Authentication, profile, preferences
- **Order**: Order details, status, pricing
- **Material**: Properties, inventory, pricing
- **STL File**: Metadata, analysis results
- **Print Job**: Configuration, status, results
- **Pricing**: Historical data, calculations

### 6.2 Data Storage
- **Database**: PostgreSQL for structured data
- **File Storage**: S3 for STL files and generated previews
- **Cache**: Redis for session data and calculations
- **Backup**: Automated daily backups with 30-day retention

## 7. Testing Requirements

### 7.1 Testing Strategy
- **Unit Tests**: 90% code coverage
- **Integration Tests**: API and database testing
- **End-to-End Tests**: User journey testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Penetration testing, vulnerability scanning

### 7.2 Test Data
- **Sample STL Files**: Various sizes and complexities
- **Material Data**: Complete material database
- **User Scenarios**: Different user types and workflows
- **Edge Cases**: Error conditions and boundary testing

## 8. Deployment Requirements

### 8.1 Environment Setup
- **Development**: Local development environment
- **Staging**: Production-like testing environment
- **Production**: High-availability production setup

### 8.2 Infrastructure
- **Containerization**: Docker containers
- **Orchestration**: Kubernetes or Docker Swarm
- **Load Balancing**: Nginx or AWS ALB
- **SSL/TLS**: Let's Encrypt or AWS Certificate Manager
- **CDN**: CloudFront or similar for static assets

## 9. Compliance Requirements

### 9.1 Legal Compliance
- **GDPR**: Data protection and privacy
- **PCI DSS**: Payment card industry standards
- **Consumer Rights**: EU consumer protection laws
- **Tax Compliance**: VAT calculation and reporting

### 9.2 Industry Standards
- **3D Printing Standards**: ASTM/ISO standards compliance
- **Quality Assurance**: Print quality standards
- **Safety Standards**: Material safety data sheets
- **Environmental**: Carbon footprint reporting

## 10. Success Metrics

### 10.1 Business Metrics
- **Order Conversion Rate**: > 15%
- **Average Order Value**: €50-200
- **Customer Retention**: > 60% repeat customers
- **Print Success Rate**: > 95%

### 10.2 Technical Metrics
- **System Uptime**: > 99.9%
- **Page Load Speed**: < 3 seconds
- **API Response Time**: < 500ms
- **Error Rate**: < 0.1%

## 11. Risk Assessment

### 11.1 Technical Risks
- **STL File Processing**: Large file handling performance
- **3D Rendering**: Browser compatibility issues
- **API Dependencies**: Third-party service availability
- **Scalability**: Traffic spike handling

### 11.2 Business Risks
- **Material Costs**: Price volatility
- **Electricity Prices**: Market fluctuations
- **Printer Downtime**: Maintenance and repairs
- **Competition**: Market competition

### 11.3 Mitigation Strategies
- **Performance Optimization**: Caching, CDN, optimization
- **Redundancy**: Multiple API providers, backup systems
- **Monitoring**: Real-time alerts and monitoring
- **Contingency Planning**: Alternative solutions and fallbacks

## 12. Future Enhancements

### 12.1 Phase 2 Features
- **Multiple Printer Support**: Additional printer models
- **Advanced Materials**: Specialty materials and composites
- **Bulk Ordering**: Multiple item orders
- **Subscription Plans**: Recurring print services

### 12.2 Phase 3 Features
- **AI-Powered Optimization**: Print parameter optimization
- **Quality Prediction**: Print success probability
- **Marketplace**: User-to-user printing services
- **Mobile App**: Native mobile application

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: January 2025
