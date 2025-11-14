# Deployment Guide

Complete guide for deploying the HR Management System in production environments.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development with Docker](#local-development-with-docker)
3. [Building for Production](#building-for-production)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [Environment Variables](#environment-variables)
8. [Health Checks & Monitoring](#health-checks--monitoring)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Docker 20.10+
- Docker Compose 2.0+ (for local development)
- Node.js 20.x (for building)
- kubectl 1.24+ (for Kubernetes)
- Helm 3.x (optional, for advanced deployments)

### Required Secrets
- Google Sheets API Key (if using Google Sheets)
- SSL/TLS certificates (for production)
- Database credentials (if applicable)
- API keys for external services

---

## Local Development with Docker

### 1. Build Development Image

```bash
docker-compose build
```

### 2. Run Development Container

```bash
docker-compose up -d
```

### 3. Verify Container is Running

```bash
docker-compose ps
curl http://localhost:3000/health
```

### 4. View Logs

```bash
docker-compose logs -f app
```

### 5. Stop Container

```bash
docker-compose down
```

---

## Building for Production

### 1. Install Production Dependencies

```bash
npm ci --omit=dev
```

### 2. Build Application

```bash
npm run build
```

### 3. Verify Build

```bash
ls -lh dist/
# Check that main bundle is ~182KB
```

### 4. Run Tests

```bash
npm run test
```

---

## Docker Deployment

### 1. Build Production Image

```bash
docker build -t hr-management:latest .
```

### 2. Tag for Registry

```bash
docker tag hr-management:latest ghcr.io/your-org/hr-management:latest
docker tag hr-management:latest ghcr.io/your-org/hr-management:v1.0.0
```

### 3. Push to Registry

```bash
docker push ghcr.io/your-org/hr-management:latest
docker push ghcr.io/your-org/hr-management:v1.0.0
```

### 4. Run Production Container

```bash
docker run -d \
  --name hr-management \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  --health-cmd='wget --quiet --tries=1 --spider http://localhost:3000/health' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  ghcr.io/your-org/hr-management:latest
```

### 5. Verify Running Container

```bash
docker ps
docker logs hr-management
curl http://localhost:3000/health
```

---

## Kubernetes Deployment

### 1. Prepare Kubernetes Manifests

Update `k8s/config.yaml` with your actual values:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  google-sheets-key: "YOUR_BASE64_ENCODED_KEY"
  spreadsheet-id: "YOUR_BASE64_ENCODED_ID"
```

Encode secrets:

```bash
echo -n "your-secret-value" | base64
```

### 2. Create Namespace

```bash
kubectl apply -f k8s/config.yaml
```

### 3. Deploy Application

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 4. Verify Deployment

```bash
# Check deployment
kubectl get deployment -n production

# Check pods
kubectl get pods -n production

# Check services
kubectl get svc -n production

# View logs
kubectl logs -n production -l app=hr-management -f
```

### 5. Port Forward (for testing)

```bash
kubectl port-forward -n production svc/hr-management-service 3000:80
curl http://localhost:3000/health
```

### 6. Scale Deployment

```bash
# Manual scaling
kubectl scale deployment hr-management-app -n production --replicas=5

# Check HPA status
kubectl get hpa -n production
```

---

## Nginx Configuration

### 1. Copy Configuration

```bash
cp nginx.conf /etc/nginx/nginx.conf
```

### 2. Update SSL Certificates

```bash
# Path: /etc/nginx/certs/cert.pem
# Path: /etc/nginx/certs/key.pem

# Or use certbot for Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

### 3. Test Configuration

```bash
nginx -t
```

### 4. Reload Nginx

```bash
systemctl reload nginx
```

### 5. Verify Access

```bash
curl https://your-domain.com/health
```

---

## Environment Variables

### Production Environment

Create `.env.production`:

```bash
# Required
VITE_API_URL=https://api.your-domain.com
NODE_ENV=production

# Google Sheets (if applicable)
VITE_GOOGLE_SHEETS_API_KEY=your-key
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your-id

# Error Tracking
VITE_ERROR_REPORTING_URL=https://sentry.your-domain.com

# Security
VITE_SECURE_COOKIES=true
VITE_HTTPS_ONLY=true
```

### Loading Environment Variables

```bash
# For Docker
docker run --env-file .env.production ...

# For Kubernetes
kubectl create secret generic app-secrets --from-file=.env.production
```

---

## Health Checks & Monitoring

### 1. Health Endpoint

```bash
curl http://localhost:3000/health
# Response: 200 OK
```

### 2. Application Metrics (optional)

```bash
curl http://localhost:3000/metrics
```

### 3. Monitoring Setup

#### Docker Health Check
Configured in Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health
```

#### Kubernetes Probes
Configured in `k8s/deployment.yaml`:
- Liveness Probe: Restarts unhealthy pods
- Readiness Probe: Removes pods from load balancer

#### Monitoring Tools
- **Prometheus**: Collect metrics
- **Grafana**: Visualize metrics
- **ELK Stack**: Centralized logging
- **Sentry**: Error tracking

---

## Backup & Recovery

### 1. Database Backups

```bash
# PostgreSQL
pg_dump hr_management > backup.sql

# Restore
psql hr_management < backup.sql
```

### 2. Configuration Backups

```bash
# Backup Kubernetes manifests
kubectl get all -n production -o yaml > backup-k8s.yaml

# Restore
kubectl apply -f backup-k8s.yaml
```

### 3. Automated Backups

Schedule daily backups:

```bash
# Cron job
0 2 * * * /usr/local/bin/backup-database.sh
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n production

# Check limits in deployment
kubectl get deployment hr-management-app -n production -o yaml | grep -A 10 resources:
```

### Network Issues

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default

# Test connectivity
kubectl exec -it <pod-name> -n production -- curl http://localhost:3000/health
```

### SSL Certificate Issues

```bash
# Check certificate expiration
openssl x509 -in /etc/nginx/certs/cert.pem -text -noout | grep -A 2 Validity
```

### Container Crashes

```bash
# Check recent logs
docker logs --tail 100 hr-management

# Check exit code
docker ps -a | grep hr-management
```

---

## Deployment Checklist

- [ ] All environment variables set
- [ ] SSL certificates valid
- [ ] Database credentials secured
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] Logs being collected
- [ ] Error tracking configured
- [ ] Load balancer configured
- [ ] DNS records updated
- [ ] Disaster recovery plan ready

---

## Rolling Update Procedure

### 1. Prepare New Version

```bash
npm run build
npm run test
docker build -t ghcr.io/your-org/hr-management:v2.0.0 .
docker push ghcr.io/your-org/hr-management:v2.0.0
```

### 2. Update Deployment

```bash
kubectl set image deployment/hr-management-app \
  app=ghcr.io/your-org/hr-management:v2.0.0 \
  -n production
```

### 3. Monitor Rollout

```bash
kubectl rollout status deployment/hr-management-app -n production
```

### 4. Rollback if Needed

```bash
kubectl rollout undo deployment/hr-management-app -n production
```

---

## Performance Optimization

### 1. Enable Caching

```bash
# Nginx caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
```

### 2. Enable Compression

```bash
# Gzip in Nginx (already configured)
gzip on;
gzip_types text/plain application/json;
```

### 3. Database Optimization

```bash
# Create indexes on frequently queried fields
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_hours_date ON hours(date);
```

### 4. CDN Configuration

```bash
# Point static assets to CDN
# Example: https://cdn.your-domain.com/assets/...
```

---

**Last Updated:** 2025-11-14
