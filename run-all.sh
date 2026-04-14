#!/bin/bash
set -e

echo "=== Widget CORS Demo - Build & Run All Projects ==="
echo ""

# Build widget frontend
echo "[1/4] Building widget frontend..."
cd widget-frontend
npm install
npm run build:backend
cd ..
echo "✓ Widget frontend built and copied to backend dist"
echo ""

# Install backend dependencies
echo "[2/4] Installing backend dependencies..."
cd widget-backend
uv sync --all-groups
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Start backend server
echo "[3/4] Starting backend server..."
cd widget-backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
sleep 2
echo "✓ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo ""

# Start host frontend server
echo "[4/4] Starting host frontend server..."
cd host-frontend
uv run python -m http.server 9000 &
HOST_PID=$!
cd ..
sleep 1
echo "✓ Host frontend running on http://localhost:9000 (PID: $HOST_PID)"
echo ""

echo "=== All servers running ==="
echo ""
echo "Open your browser:"
echo "  - Widget + Backend: http://localhost:8000"
echo "  - Host Frontend:    http://localhost:9000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $HOST_PID
