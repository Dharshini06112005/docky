#!/bin/bash
set -e

echo "Starting frontend build..."

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "Error: client directory not found"
    exit 1
fi

echo "Found client directory, changing to it..."
cd client

echo "Installing dependencies..."
npm install

echo "Running build..."
npm run build

echo "Build completed successfully!" 