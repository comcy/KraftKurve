#!/bin/bash

# KraftKurve Setup Script
# This script prepares the environment and offers Docker or systemd deployment.

set -e

echo "===================================="
echo "    KraftKurve Deployment Setup     "
echo "===================================="
echo ""

# 1. Gather Admin Credentials
read -p "Enter Admin Email [admin@kraftkurve.local]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@kraftkurve.local}

read -s -p "Enter Admin Password: " ADMIN_PASSWORD
echo ""
if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Error: Password cannot be empty."
    exit 1
fi

read -p "Enter External Port [8080]: " EXTERNAL_PORT
EXTERNAL_PORT=${EXTERNAL_PORT:-8080}

# 2. Choose Deployment Method
echo ""
echo "Choose deployment method:"
echo "1) Docker Compose (Recommended for Proxmox/Containerization)"
echo "2) systemd (For direct Linux host deployment)"
read -p "Choice [1-2]: " DEPLOY_CHOICE

# Create .env file
cat <<EOF > .env
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
PORT=$EXTERNAL_PORT
DATA_DIR=$(pwd)/data
EOF

if [ "$DEPLOY_CHOICE" == "1" ]; then
    echo ""
    echo "Starting Docker Compose deployment..."
    docker compose up -d --build
    echo ""
    echo "Successfully deployed! Access KraftKurve at http://localhost:$EXTERNAL_PORT"
    echo "Please log in and change your password immediately."

elif [ "$DEPLOY_CHOICE" == "2" ]; then
    echo ""
    echo "Preparing systemd deployment..."
    
    # Check for pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "Error: pnpm is required for systemd deployment."
        exit 1
    fi

    # Build the project
    echo "Building project..."
    pnpm install
    pnpm run build:api
    pnpm run build:mobile

    # Create systemd service files
    USER_NAME=$(whoami)
    WORKING_DIR=$(pwd)

    # API Service
    cat <<EOF > kraftkurve-api.service
[Unit]
Description=KraftKurve API
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$WORKING_DIR
EnvironmentFile=$WORKING_DIR/.env
ExecStart=$(which node) $WORKING_DIR/apps/api/dist/main.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

    echo "systemd service file created: kraftkurve-api.service"
    echo ""
    echo "To finalize systemd setup:"
    echo "1. Serve the frontend (apps/web/dist/kraftkurve-mobile-app/browser) using Nginx/Apache."
    echo "2. Copy the service file: sudo cp kraftkurve-api.service /etc/systemd/system/"
    echo "3. Enable and start: sudo systemctl enable --now kraftkurve-api"
    echo ""
    echo "Note: systemd deployment requires manual Nginx configuration for the frontend and proxying."
else
    echo "Invalid choice. .env file created. You can now start the deployment manually."
fi
