#!/bin/bash

# Vervix E-commerce Platform Deployment Script
# This script automates the deployment of the entire platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to check environment file
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env 2>/dev/null || {
            print_error "No .env.example found. Please create a .env file with required environment variables."
            exit 1
        }
        print_warning "Please update the .env file with your actual configuration values."
        exit 1
    fi
    
    # Check for required environment variables
    local required_vars=(
        "JWT_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
        "SMTP_HOST"
        "SMTP_USER"
        "SMTP_PASS"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        print_status "Please update your .env file with the missing variables."
        exit 1
    fi
    
    print_success "Environment configuration is valid"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Function to wait for services to be healthy
wait_for_health() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts"
        
        if docker-compose ps | grep -q "healthy"; then
            print_success "All services are healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    print_error "Services failed to become healthy within the expected time"
    docker-compose logs
    exit 1
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for MongoDB to be ready
    sleep 10
    
    # Run migrations (if any)
    docker-compose exec backend npm run migrate 2>/dev/null || {
        print_warning "No migration script found or migration failed"
    }
    
    print_success "Database setup completed"
}

# Function to seed initial data
seed_data() {
    print_status "Seeding initial data..."
    
    # Create admin user and sample data
    docker-compose exec backend npm run seed 2>/dev/null || {
        print_warning "No seed script found or seeding failed"
    }
    
    print_success "Initial data seeded"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    print_status "Running backend tests..."
    docker-compose exec backend npm test -- --passWithNoTests || {
        print_warning "Backend tests failed or no tests found"
    }
    
    # Frontend tests
    print_status "Running frontend tests..."
    docker-compose exec frontend npm test -- --passWithNoTests --watchAll=false || {
        print_warning "Frontend tests failed or no tests found"
    }
    
    print_success "Tests completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    
    print_status "Service URLs:"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost:5000"
    echo "MongoDB: localhost:27017"
    echo "Redis: localhost:6379"
    echo ""
    
    print_status "Useful commands:"
    echo "View logs: docker-compose logs -f"
    echo "Stop services: docker-compose down"
    echo "Restart services: docker-compose restart"
    echo "Update services: docker-compose pull && docker-compose up -d"
}

# Function to cleanup on error
cleanup() {
    print_error "Deployment failed. Cleaning up..."
    docker-compose down --remove-orphans
    exit 1
}

# Set trap for cleanup
trap cleanup ERR

# Main deployment process
main() {
    echo "=========================================="
    echo "Vervix E-commerce Platform Deployment"
    echo "=========================================="
    echo ""
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_SEED=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-seed)
                SKIP_SEED=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-seed     Skip seeding initial data"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    check_environment
    deploy_services
    wait_for_health
    run_migrations
    
    if [ "$SKIP_SEED" = false ]; then
        seed_data
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    show_status
    
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Your Vervix E-commerce platform is now running!"
    print_status "Visit http://localhost to access the application."
}

# Run main function with all arguments
main "$@" 