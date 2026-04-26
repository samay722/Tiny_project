#!/bin/bash
# NeuroSense AI - GCP Deployment Script
# Run this script ONCE after installing gcloud CLI

set -e

echo "🚀 Starting NeuroSense AI GCP Deployment..."

# --- CONFIGURATION ---
# IMPORTANT: Replace 'your-gcp-project-id' with your actual GCP Project ID
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"

# Set your project
gcloud config set project $PROJECT_ID

# Enable required GCP services
echo "📦 Enabling GCP services..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push images
echo "🔨 Building Docker images and pushing to GCR..."
gcloud builds submit --config cloudbuild.yaml --project $PROJECT_ID .

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your services are now live on GCP Cloud Run."
echo "   Run the following to get your live URLs:"
echo "   gcloud run services list --region=$REGION"
