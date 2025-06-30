# Azure Deployment Guide for Avatar Management Application

## Prerequisites
- Azure CLI installed
- Docker installed
- Azure subscription
- Domain name (for production)

## Step 1: Set Up Azure Container Registry (ACR)

```bash
# Create resource group
az group create --name avatar-mgmt-rg --location eastus

# Create container registry
az acr create --resource-group avatar-mgmt-rg \
    --name avatarMgmtRegistry --sku Basic

# Login to ACR
az acr login --name avatarMgmtRegistry

# Get login server
az acr show --name avatarMgmtRegistry --query loginServer --output tsv
```

## Step 2: Build and Push Docker Images

```bash
# Build API image
docker build -f api-server/Dockerfile -t avatarMgmtRegistry.azurecr.io/avatar-mgmt-api:latest .

# Build frontend image (if needed)
docker build -f frontend/Dockerfile -t avatarMgmtRegistry.azurecr.io/avatar-mgmt-frontend:latest ./frontend

# Push images to ACR
docker push avatarMgmtRegistry.azurecr.io/avatar-mgmt-api:latest
docker push avatarMgmtRegistry.azurecr.io/avatar-mgmt-frontend:latest
```

## Step 3: Set Up Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres flexible-server create \
    --resource-group avatar-mgmt-rg \
    --name avatar-mgmt-db \
    --admin-user dbadmin \
    --admin-password "YourSecurePassword123!" \
    --sku-name Standard_B1ms \
    --version 15

# Create database
az postgres flexible-server db create \
    --resource-group avatar-mgmt-rg \
    --server-name avatar-mgmt-db \
    --database-name directus

# Get connection string
az postgres flexible-server show-connection-string \
    --server-name avatar-mgmt-db \
    --admin-user dbadmin \
    --admin-password "YourSecurePassword123!" \
    --database-name directus
```

## Step 4: Choose Deployment Option

### Option A: Azure Container Instances (Simple)

```bash
# Deploy using ACI
az container create \
    --resource-group avatar-mgmt-rg \
    --name avatar-mgmt-api \
    --image avatarMgmtRegistry.azurecr.io/avatar-mgmt-api:latest \
    --dns-name-label avatar-mgmt-api \
    --ports 3000 \
    --environment-variables \
        NODE_ENV=production \
        DATABASE_URL="your-postgres-connection-string"
```

### Option B: Azure App Service (Recommended for Web Apps)

```bash
# Create App Service plan
az appservice plan create \
    --name avatar-mgmt-plan \
    --resource-group avatar-mgmt-rg \
    --sku B1 \
    --is-linux

# Create web app
az webapp create \
    --resource-group avatar-mgmt-rg \
    --plan avatar-mgmt-plan \
    --name avatar-mgmt-app \
    --deployment-local-git

# Configure container
az webapp config container set \
    --name avatar-mgmt-app \
    --resource-group avatar-mgmt-rg \
    --docker-custom-image-name avatarMgmtRegistry.azurecr.io/avatar-mgmt-api:latest

# Set environment variables
az webapp config appsettings set \
    --resource-group avatar-mgmt-rg \
    --name avatar-mgmt-app \
    --settings \
        NODE_ENV=production \
        DATABASE_URL="your-postgres-connection-string" \
        WEBSITES_PORT=3000
```

### Option C: Azure Kubernetes Service (Production)

```bash
# Create AKS cluster
az aks create \
    --resource-group avatar-mgmt-rg \
    --name avatar-mgmt-aks \
    --node-count 2 \
    --enable-addons monitoring \
    --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group avatar-mgmt-rg --name avatar-mgmt-aks

# Deploy using kubectl
kubectl apply -f azure-deploy-aks.yml
```

## Step 5: Configure SSL and Domain

### For App Service:
```bash
# Add custom domain
az webapp config hostname add \
    --webapp-name avatar-mgmt-app \
    --resource-group avatar-mgmt-rg \
    --hostname your-domain.com

# Configure SSL
az webapp config ssl bind \
    --certificate-thumbprint your-cert-thumbprint \
    --ssl-type SNI \
    --name avatar-mgmt-app \
    --resource-group avatar-mgmt-rg
```

### For AKS:
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Step 6: Set Up CI/CD (Optional)

### Using GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Build and push image
      run: |
        az acr build --registry avatarMgmtRegistry --image avatar-mgmt-api:${{ github.sha }} .
    
    - name: Deploy to App Service
      run: |
        az webapp config container set \
          --name avatar-mgmt-app \
          --resource-group avatar-mgmt-rg \
          --docker-custom-image-name avatarMgmtRegistry.azurecr.io/avatar-mgmt-api:${{ github.sha }}
```

## Cost Estimation

### Azure Container Instances:
- ~$0.000014/second per vCPU
- ~$0.0000015/second per GB memory
- **Estimated monthly cost**: $10-30

### Azure App Service:
- B1 plan: ~$13/month
- **Estimated monthly cost**: $13-50

### Azure Kubernetes Service:
- 2 nodes (B2s): ~$70/month
- **Estimated monthly cost**: $70-200

## Monitoring and Logging

```bash
# Enable Application Insights
az monitor app-insights component create \
    --app avatar-mgmt-insights \
    --location eastus \
    --resource-group avatar-mgmt-rg \
    --application-type web

# Get instrumentation key
az monitor app-insights component show \
    --app avatar-mgmt-insights \
    --resource-group avatar-mgmt-rg \
    --query instrumentationKey
```

## Security Best Practices

1. **Use Azure Key Vault** for secrets
2. **Enable managed identities** for service-to-service authentication
3. **Configure network security groups** to restrict access
4. **Enable Azure Security Center** for threat detection
5. **Regular security updates** and vulnerability scanning

## Troubleshooting

### Common Issues:
1. **Container won't start**: Check logs with `az webapp log tail`
2. **Database connection issues**: Verify connection string and firewall rules
3. **SSL certificate problems**: Ensure domain is properly configured
4. **Performance issues**: Monitor with Azure Application Insights 
