#!/bin/bash

# Email Agent Platform - Development Setup Script

set -e

echo "🚀 Setting up Email Agent Platform for development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check Node.js (for local development)
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js is not installed (optional for containerized development)${NC}"
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Create environment file
setup_environment() {
    echo -e "${YELLOW}Setting up environment...${NC}"
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Environment file created (.env)${NC}"
        echo -e "${YELLOW}Please review and update the .env file with your configuration${NC}"
    else
        echo -e "${GREEN}✅ Environment file already exists${NC}"
    fi
}

# Setup directories
setup_directories() {
    echo -e "${YELLOW}Creating necessary directories...${NC}"
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    mkdir -p ai-engine/models
    mkdir -p ai-engine/data
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Pull Docker images
pull_images() {
    echo -e "${YELLOW}Pulling Docker images...${NC}"
    
    docker-compose pull
    
    echo -e "${GREEN}✅ Docker images pulled${NC}"
}

# Start infrastructure services
start_infrastructure() {
    echo -e "${YELLOW}Starting infrastructure services...${NC}"
    
    # Start database services first
    docker-compose up -d postgres mongodb redis minio
    
    echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
    sleep 30
    
    echo -e "${GREEN}✅ Infrastructure services started${NC}"
}

# Initialize databases
init_databases() {
    echo -e "${YELLOW}Initializing databases...${NC}"
    
    # Wait for PostgreSQL
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    until docker-compose exec postgres pg_isready -U emailagent -d emailagent; do
        sleep 5
    done
    
    # Run database migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    cd backend
    npm install
    npm run db:migrate
    cd ..
    
    echo -e "${GREEN}✅ Databases initialized${NC}"
}

# Create MinIO bucket
create_minio_bucket() {
    echo -e "${YELLOW}Creating MinIO bucket...${NC}"
    
    # Wait for MinIO
    sleep 10
    
    # Create bucket
    docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
    docker-compose exec minio mc mb local/email-agent --ignore-existing
    
    echo -e "${GREEN}✅ MinIO bucket created${NC}"
}

# Start application services
start_apps() {
    echo -e "${YELLOW}Starting application services...${NC}"
    
    docker-compose up -d backend ai-engine frontend
    
    echo -e "${GREEN}✅ Application services started${NC}"
}

# Wait for services to be ready
wait_for_services() {
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    
    # Backend health check
    echo -e "${YELLOW}Checking backend health...${NC}"
    until curl -f http://localhost:3001/health; do
        sleep 5
    done
    
    # AI Engine health check
    echo -e "${YELLOW}Checking AI Engine health...${NC}"
    until curl -f http://localhost:8000/health; do
        sleep 5
    done
    
    # Frontend
    echo -e "${YELLOW}Checking frontend...${NC}"
    sleep 10
    
    echo -e "${GREEN}✅ All services are ready${NC}"
}

# Display success message
show_success() {
    echo -e "${GREEN}"
    echo "=========================================="
    echo "🎉 Email Agent Platform Setup Complete!"
    echo "=========================================="
    echo "${NC}"
    echo -e "${GREEN}Services are available at:${NC}"
    echo -e "  📱 Frontend:        ${YELLOW}http://localhost:3000${NC}"
    echo -e "  🔌 Backend API:     ${YELLOW}http://localhost:3001${NC}"
    echo -e "  📚 API Docs:        ${YELLOW}http://localhost:3001/api${NC}"
    echo -e "  🤖 AI Engine:       ${YELLOW}http://localhost:8000${NC}"
    echo -e "  📊 AI Engine Docs:  ${YELLOW}http://localhost:8000/docs${NC}"
    echo -e "  💾 MinIO Console:   ${YELLOW}http://localhost:9001${NC}"
    echo ""
    echo -e "${YELLOW}Default credentials:${NC}"
    echo -e "  👤 MinIO:           Username: minioadmin  Password: minioadmin"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  docker-compose logs -f backend    # View backend logs"
    echo -e "  docker-compose logs -f ai-engine  # View AI engine logs"
    echo -e "  docker-compose stop               # Stop all services"
    echo -e "  docker-compose down               # Stop and remove containers"
    echo -e "  docker-compose up -d              # Start all services"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}  Email Agent Platform - Development Setup${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    
    check_prerequisites
    setup_environment
    setup_directories
    pull_images
    start_infrastructure
    init_databases
    create_minio_bucket
    start_apps
    wait_for_services
    show_success
}

# Run main function
main "$@"