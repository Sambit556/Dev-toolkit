export interface ConfigFormat {
  id: string;
  name: string;
  extension: string;
  monacoLanguage: string;
  icon: string;
  sample: string;
  description: string;
}

export const CONFIG_FORMATS: ConfigFormat[] = [
  {
    id: 'json',
    name: 'JSON (Application Config)',
    extension: '.json',
    monacoLanguage: 'json',
    icon: '{ }',
    description: 'JavaScript Object Notation with full schema validation & formatting',
    sample: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "app": {
    "name": "DevKits Online IDE",
    "version": "1.0.0",
    "environment": "production",
    "port": 4001
  },
  "database": {
    "host": "postgres.internal.net",
    "port": 5432,
    "maxConnections": 20,
    "ssl": true
  },
  "security": {
    "rateLimiting": {
      "enabled": true,
      "maxRequestsPerMinute": 120
    },
    "corsOrigins": [
      "https://devkits.space",
      "http://localhost:4001"
    ]
  }
}`,
  },
  {
    id: 'yaml',
    name: 'YAML (CI/CD & Config)',
    extension: '.yaml',
    monacoLanguage: 'yaml',
    icon: '📝',
    description: 'Human-friendly data serialization standard for workflows & configs',
    sample: `name: Production CI/CD Pipeline

on:
  push:
    branches: [main, release/*]
  pull_request:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Run Test Suite
        run: |
          npm ci
          npm run test
          npm run build
`,
  },
  {
    id: 'k8s',
    name: 'Kubernetes YAML',
    extension: '.k8s.yaml',
    monacoLanguage: 'yaml',
    icon: '☸️',
    description: 'K8s Deployment, Service, and Ingress manifests with resource limits',
    sample: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: devkits-sandbox-runner
  namespace: production
  labels:
    app.kubernetes.io/name: sandbox-runner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sandbox-runner
  template:
    metadata:
      labels:
        app: sandbox-runner
    spec:
      containers:
        - name: runner
          image: devkits/sandbox-engine:v1.0.0
          ports:
            - containerPort: 3001
          resources:
            limits:
              cpu: "2"
              memory: "1Gi"
            requests:
              cpu: "500m"
              memory: "256Mi"
          env:
            - name: NODE_ENV
              value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: sandbox-service
  namespace: production
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3001
  selector:
    app: sandbox-runner
`,
  },
  {
    id: 'dockerfile',
    name: 'Dockerfile',
    extension: 'Dockerfile',
    monacoLanguage: 'dockerfile',
    icon: '🐳',
    description: 'Multi-stage container definition with security best practices',
    sample: `# Multi-stage secure build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 devuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

USER devuser
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD wget --spider -q http://localhost:3001/health || exit 1
CMD ["node", "dist/server.js"]
`,
  },
  {
    id: 'env',
    name: '.env Environment File',
    extension: '.env',
    monacoLanguage: 'ini',
    icon: '🔒',
    description: 'Key-value environment variables with validation and masking',
    sample: `# DevKits Cloud Workspace Secrets
APP_ENV=production
PORT=4001
API_URL=https://api.devkits.space

# Upstash Isolated Box Configuration
UPSTASH_BOX_API_KEY=box_0875b313b2b5bce7d01b7a12fc5ddb24e4f822747f328671f7015552c733fc63
UPSTASH_REDIS_REST_URL=https://glad-goblin-107253.upstash.io

# Security Bounds
SANDBOX_TIMEOUT_MS=15000
SANDBOX_MAX_MEMORY_MB=256
CORS_ALLOWED_ORIGINS=https://devkits.space
`,
  },
  {
    id: 'toml',
    name: 'TOML (Cargo / PyProject)',
    extension: '.toml',
    monacoLanguage: 'ini',
    icon: '⚙️',
    description: 'Tom\'s Obvious Minimal Language for Rust Cargo & Python pyproject',
    sample: `[package]
name = "devkits-cloud-workspace"
version = "1.0.0"
authors = ["DevKits Team <dev@devkits.space>"]
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.36", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
`,
  },
  {
    id: 'xml',
    name: 'XML / SVG / Config',
    extension: '.xml',
    monacoLanguage: 'xml',
    icon: '< >',
    description: 'Extensible Markup Language with attribute hierarchy',
    sample: `<?xml version="1.0" encoding="UTF-8"?>
<configuration version="2.0">
  <server name="Cloud-Gateway" port="8080">
    <security enabled="true">
      <cipher-suites>TLS_AES_256_GCM_SHA384</cipher-suites>
      <max-handshake-timeout>5000</max-handshake-timeout>
    </security>
    <logging level="INFO">
      <destination>/var/log/devkits/gateway.log</destination>
    </logging>
  </server>
</configuration>
`,
  },
];
