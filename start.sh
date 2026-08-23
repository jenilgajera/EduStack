#!/bin/bash
# Edustack - Start All Services
# Usage: bash start.sh

set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROMA_DATA="$PROJECT_DIR/../chromadb_data"
CHROMA_BIN="$HOME/.local/bin/chroma"

echo "🚀 Starting Edustack Services..."
echo ""

# 1. ChromaDB Vector DB
echo "1️⃣  Starting ChromaDB (Vector DB) on port 8000..."
mkdir -p "$CHROMA_DATA"
if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
  echo "   ✅ ChromaDB already running"
else
  nohup "$CHROMA_BIN" run --host 0.0.0.0 --port 8000 --path "$CHROMA_DATA" > /tmp/chromadb.log 2>&1 &
  sleep 3
  curl -s http://localhost:8000/api/v2/heartbeat > /dev/null && echo "   ✅ ChromaDB started" || echo "   ❌ ChromaDB failed - check /tmp/chromadb.log"
fi

# 2. MongoDB (should be running as a service)
echo ""
echo "2️⃣  MongoDB status..."
if systemctl is-active --quiet mongod 2>/dev/null; then
  echo "   ✅ MongoDB running"
else
  echo "   ⚠️  MongoDB not running via systemctl - trying to start..."
  sudo systemctl start mongod 2>/dev/null || mongod --fork --logpath /tmp/mongod.log 2>/dev/null || echo "   ❌ Could not start MongoDB"
fi

# 3. Backend Server
echo ""
echo "3️⃣  Starting Backend Server on port 4000..."
fuser -k 4000/tcp > /dev/null 2>&1 || true
sleep 1
cd "$PROJECT_DIR/server"
nohup node server.js > /tmp/edustack-server.log 2>&1 &
sleep 3
curl -s http://localhost:4000/ > /dev/null && echo "   ✅ Backend started" || echo "   ❌ Backend failed - check /tmp/edustack-server.log"

# 4. Frontend
echo ""
echo "4️⃣  Starting Frontend on port 5173..."
fuser -k 5173/tcp > /dev/null 2>&1 || true
sleep 1
cd "$PROJECT_DIR/client"
nohup npm run dev -- --host 0.0.0.0 > /tmp/edustack-client.log 2>&1 &
sleep 4
curl -s http://localhost:5173/ > /dev/null && echo "   ✅ Frontend started" || echo "   ❌ Frontend failed - check /tmp/edustack-client.log"

echo ""
echo "======================================"
echo "✅ Edustack is running!"
echo ""
echo "   🌐 Frontend:  http://localhost:5173"
echo "   🔧 Backend:   http://localhost:4000"
echo "   🧠 ChromaDB:  http://localhost:8000"
echo "   🗄️  MongoDB:   mongodb://localhost:27017/edustack"
echo ""
echo "   📋 Logs:"
echo "      Server:   tail -f /tmp/edustack-server.log"
echo "      Client:   tail -f /tmp/edustack-client.log"
echo "      ChromaDB: tail -f /tmp/chromadb.log"
echo "======================================"
