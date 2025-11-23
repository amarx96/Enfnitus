#!/bin/bash

echo "========================================"
echo "Installing EVU Frontend Dependencies"
echo "========================================"

cd frontend

echo "Installing Node.js dependencies..."
npm install

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "To start the development server:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "The frontend will be available at:"
echo "  http://localhost:3001"
echo ""
echo "Make sure the EVU backend is running at:"
echo "  http://localhost:3000"
echo "========================================"