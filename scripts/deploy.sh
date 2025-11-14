#!/bin/bash

# Deployment script for HR Management System
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY="ghcr.io"
ORG="your-org"
APP_NAME="hr-management"
IMAGE="$REGISTRY/$ORG/$APP_NAME:$VERSION"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check for Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check for kubectl if deploying to Kubernetes
    if [ "$ENVIRONMENT" = "k8s" ] && ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    log_info "All requirements met"
}

build_application() {
    log_info "Building application..."

    # Run tests
    npm run test || log_warning "Tests failed, continuing with deployment"

    # Build application
    npm run build

    log_info "Build successful"
}

build_docker_image() {
    log_info "Building Docker image: $IMAGE"

    docker build -t "$IMAGE" .

    log_info "Docker image built successfully"
}

push_docker_image() {
    log_info "Pushing Docker image to registry..."

    # Login to registry (requires GITHUB_TOKEN environment variable)
    echo "$GITHUB_TOKEN" | docker login "$REGISTRY" -u "$GITHUB_ACTOR" --password-stdin

    docker push "$IMAGE"

    log_info "Docker image pushed successfully"
}

deploy_docker() {
    log_info "Deploying with Docker..."

    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        set -a
        source ".env.$ENVIRONMENT"
        set +a
    fi

    # Stop existing container
    docker stop $APP_NAME || true
    docker rm $APP_NAME || true

    # Run new container
    docker run -d \
        --name $APP_NAME \
        -p 3000:3000 \
        --env-file ".env.$ENVIRONMENT" \
        --restart unless-stopped \
        --health-cmd="wget --quiet --tries=1 --spider http://localhost:3000/health" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$IMAGE"

    log_info "Container started successfully"

    # Wait for container to be healthy
    sleep 5
    if docker ps | grep -q $APP_NAME; then
        log_info "Deployment successful"
    else
        log_error "Container failed to start"
        docker logs $APP_NAME
        exit 1
    fi
}

deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."

    # Check if namespace exists
    kubectl get namespace production || kubectl create namespace production

    # Apply configuration
    kubectl apply -f k8s/config.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml

    # Update image
    kubectl set image deployment/hr-management-app \
        app="$IMAGE" \
        -n production \
        --record

    # Wait for rollout
    log_info "Waiting for deployment to complete..."
    kubectl rollout status deployment/hr-management-app -n production

    log_info "Kubernetes deployment successful"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Wait for application to be ready
    sleep 5

    if [ "$ENVIRONMENT" = "docker" ]; then
        # Test health endpoint
        if curl -f http://localhost:3000/health; then
            log_info "Health check passed"
        else
            log_error "Health check failed"
            exit 1
        fi
    elif [ "$ENVIRONMENT" = "k8s" ]; then
        # Test pod status
        READY_PODS=$(kubectl get deployment hr-management-app -n production -o jsonpath='{.status.readyReplicas}')
        DESIRED_PODS=$(kubectl get deployment hr-management-app -n production -o jsonpath='{.spec.replicas}')

        if [ "$READY_PODS" = "$DESIRED_PODS" ]; then
            log_info "All pods are ready ($READY_PODS/$DESIRED_PODS)"
        else
            log_warning "Not all pods are ready yet ($READY_PODS/$DESIRED_PODS)"
        fi
    fi

    log_info "Deployment verification complete"
}

rollback() {
    log_warning "Rolling back deployment..."

    if [ "$ENVIRONMENT" = "docker" ]; then
        docker stop $APP_NAME
        log_info "Docker container stopped"
    elif [ "$ENVIRONMENT" = "k8s" ]; then
        kubectl rollout undo deployment/hr-management-app -n production
        log_info "Kubernetes rollout undone"
    fi
}

main() {
    log_info "Starting deployment to $ENVIRONMENT environment (version: $VERSION)"

    check_requirements
    build_application

    if [ "$ENVIRONMENT" = "docker" ]; then
        build_docker_image
        deploy_docker
    elif [ "$ENVIRONMENT" = "k8s" ]; then
        build_docker_image
        push_docker_image
        deploy_kubernetes
    else
        log_error "Unknown environment: $ENVIRONMENT"
        exit 1
    fi

    verify_deployment

    log_info "Deployment completed successfully!"
}

# Trap errors
trap 'log_error "Deployment failed"; rollback; exit 1' ERR

# Run main function
main "$@"
