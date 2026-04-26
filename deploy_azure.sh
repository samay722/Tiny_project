#!/bin/bash
# NeuroSense AI - Azure Deployment Script
# Run this script ONCE after installing the Azure CLI (az)

set -e

echo "🚀 Starting NeuroSense AI Azure Deployment..."

# --- CONFIGURATION ---
# IMPORTANT: Update these values if you want different names
RESOURCE_GROUP="NeuroSenseResourceGroup"
LOCATION="eastus"
# ACR names must be globally unique and alphanumeric only
ACR_NAME="neurosenseacr$RANDOM"
ENV_NAME="neurosense-env"

echo "🔑 Ensuring you are logged in to Azure..."
# This will prompt a browser login if not already logged in
az account show > /dev/null || az login

echo "📦 Creating Resource Group: $RESOURCE_GROUP..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "📦 Creating Azure Container Registry: $ACR_NAME..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

echo "🔨 Building and pushing Backend image to Azure..."
az acr build --registry $ACR_NAME --image neurosense-backend:latest -f backend/Dockerfile .

echo "🔨 Building and pushing Frontend image to Azure..."
az acr build --registry $ACR_NAME --image neurosense-frontend:latest -f frontend/Dockerfile ./frontend

echo "📦 Creating Azure Container Apps Environment..."
# Ensure the Container Apps extension is installed
az extension add --name containerapp --upgrade
az containerapp env create --name $ENV_NAME --resource-group $RESOURCE_GROUP --location $LOCATION

echo "🌐 Deploying Backend Container App..."
az containerapp create \
  --name neurosense-backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/neurosense-backend:latest \
  --target-port 5001 \
  --ingress 'external' \
  --registry-server $ACR_NAME.azurecr.io

echo "🌐 Deploying Frontend Container App..."
az containerapp create \
  --name neurosense-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/neurosense-frontend:latest \
  --target-port 80 \
  --ingress 'external' \
  --registry-server $ACR_NAME.azurecr.io

echo ""
echo "✅ Azure Deployment complete!"
echo "Check your Azure Portal to find the URLs for your new Container Apps."
