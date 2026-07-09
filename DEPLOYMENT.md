# Deployment Guide

## AWS ECS Fargate

### Prerequisites
- AWS CLI configured
- Docker installed
- ECR repositories created

### 1. Build & Push Images

```bash
# Set your AWS account and region
AWS_ACCOUNT=123456789012
AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repos
aws ecr create-repository --repository-name devchrono-api --region $AWS_REGION
aws ecr create-repository --repository-name devchrono-web --region $AWS_REGION

# Build and push API
docker build -f apps/api/Dockerfile -t devchrono-api .
docker tag devchrono-api $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/devchrono-api:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/devchrono-api:latest

# Build and push Web
docker build -f apps/web/Dockerfile -t devchrono-web .
docker tag devchrono-web $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/devchrono-web:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/devchrono-web:latest
```

### 2. ECS Task Definition (API)

```json
{
  "family": "devchrono-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [{
    "name": "api",
    "image": "ECR_IMAGE_URI",
    "portMappings": [{ "containerPort": 3001 }],
    "environment": [
      { "name": "NODE_ENV", "value": "production" },
      { "name": "PORT", "value": "3001" }
    ],
    "secrets": [
      { "name": "REDIS_URL", "valueFrom": "arn:aws:ssm:us-east-1:...redis_url" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/devchrono-api",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "api"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"],
      "interval": 30,
      "timeout": 10,
      "retries": 3
    }
  }]
}
```

### 3. Application Load Balancer

1. Create ALB with HTTPS listener (port 443)
2. Create target groups for API (port 3001) and Web (port 4001)
3. Configure routing rules:
   - `api.yourdomain.com/*` → API target group
   - `yourdomain.com/*` → Web target group
4. Add ACM certificate for HTTPS

### 4. Auto-Scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/devchrono-cluster/devchrono-api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/devchrono-cluster/devchrono-api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name devchrono-api-cpu \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

---

## Vercel (Frontend)

```bash
cd apps/web
npm install -g vercel
vercel login
vercel --prod
```

**Environment variables to set in Vercel dashboard:**
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

---

## Railway (Backend)

1. Connect your GitHub repo to Railway
2. Select `apps/api` as the root directory
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

---

## CDN Configuration (CloudFront)

For the Next.js frontend:

1. Create CloudFront distribution pointing to your Vercel/ECS origin
2. Set cache behaviors:
   - `/_next/static/*` → Cache 1 year (immutable)
   - `/*.json` → Cache 1 hour
   - `/*` → Cache 5 minutes or no-cache

---

## WAF Rules

Recommended AWS WAF rules:
- `AWSManagedRulesCommonRuleSet` — Common threats
- `AWSManagedRulesBotControlRuleSet` — Bot protection
- Custom rate limit rule: 100 req/5min per IP

---

## Observability

### Logs → CloudWatch

The API uses structured JSON logging (Winston). In production:
- All request logs include `requestId`, `method`, `path`, `status`, `durationMs`
- Errors include stack traces
- No raw JSON input is ever logged

### Metrics

Key metrics to monitor:
- API response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Rate limit hits
- Memory usage (watch for JSON processing)

### Alerts

Set up CloudWatch alarms for:
- API 5xx error rate > 1%
- API response time p99 > 2s
- ECS task restarts
- Memory utilization > 80%
