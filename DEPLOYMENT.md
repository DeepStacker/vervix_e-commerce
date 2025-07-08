# 🚀 Vervix E-commerce Platform - Deployment Guide

This guide covers deploying the Vervix E-commerce platform in various environments, from local development to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Testing](#testing)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git** (v2.30+)
- **Node.js** (v18+) - for local development
- **MongoDB** (v6.0+) - for local development

### System Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for production)
- **Storage**: 10GB+ available space
- **Network**: Stable internet connection

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/vervix-ecommerce.git
cd vervix-ecommerce
```

### 2. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Deploy with Docker
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 4. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost/admin

## 🔐 Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/vervix?authSource=admin
MONGODB_TEST_URI=mongodb://localhost:27017/vervix-test

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_FROM=noreply@vervix.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Redis (Optional)
REDIS_PASSWORD=redis123
```

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## 🏠 Local Development

### Option 1: Docker Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Option 2: Native Development

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if not using Docker)
mongod

# Run migrations
npm run migrate

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🌐 Production Deployment

### Option 1: Docker Production

#### 1. Prepare Production Environment
```bash
# Set production environment
export NODE_ENV=production

# Create production .env
cp .env.example .env.production
# Edit .env.production with production values
```

#### 2. Deploy with Docker Compose
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 3. Set Up SSL/HTTPS
```bash
# Generate SSL certificates
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt

# Update nginx configuration for HTTPS
# Edit nginx/nginx.conf
```

### Option 2: Cloud Deployment

#### AWS Deployment
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Deploy to ECS
aws ecs create-cluster --cluster-name vervix-cluster
# ... (additional ECS deployment steps)
```

#### Google Cloud Deployment
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize project
gcloud init

# Deploy to Cloud Run
gcloud run deploy vervix-backend --source ./backend
gcloud run deploy vervix-frontend --source ./frontend
```

#### Heroku Deployment
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create apps
heroku create vervix-backend
heroku create vervix-frontend

# Set environment variables
heroku config:set NODE_ENV=production --app vervix-backend
heroku config:set MONGODB_URI=your_mongodb_uri --app vervix-backend
# ... (set other environment variables)

# Deploy
git push heroku main
```

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests (if configured)
npm run test:e2e
```

### Test Coverage
```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd frontend
npm run test:coverage
```

### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check service health
curl http://localhost/api/health
curl http://localhost/health

# Docker health status
docker-compose ps
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Database Maintenance
```bash
# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup

# Database statistics
docker-compose exec mongodb mongosh --eval "db.stats()"
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Monitor application metrics
curl http://localhost/api/metrics
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check connection string
echo $MONGODB_URI
```

#### 3. Docker Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 4. Memory Issues
```bash
# Check available memory
free -h

# Increase Docker memory limit
# Edit Docker Desktop settings
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=*

# Run with verbose output
docker-compose up --verbose
```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove all images
docker system prune -a

# Remove volumes
docker volume prune

# Start fresh
./deploy.sh
```

## 📚 Additional Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Stripe Documentation](https://stripe.com/docs)

### Support
- [GitHub Issues](https://github.com/your-username/vervix-ecommerce/issues)
- [Discord Community](https://discord.gg/vervix)
- [Email Support](mailto:support@vervix.com)

### Contributing
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Development Setup](DEVELOPMENT.md)

---

**Note**: This deployment guide is for the Vervix E-commerce platform. Make sure to customize the configuration according to your specific requirements and security policies. 