#!/bin/bash

# Start backend on port 3001
echo "Starting backend server..."
cd /c/Users/alex-/Desktop/EVU_Backend
PORT=3001 node src/server.js &

# Wait for backend to start
sleep 2

# Start frontend on port 3000  
echo "Starting frontend server..."
cd frontend
npm start