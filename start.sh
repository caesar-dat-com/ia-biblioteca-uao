#!/bin/bash
# CatalogIA — arranque completo
PROJECT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Iniciando backend..."
cd "$PROJECT/backend"
venv/bin/python run.py &
BACKEND_PID=$!

echo "▶ Iniciando frontend..."
cd "$PROJECT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend  → http://localhost:8001"
echo "✓ Frontend → http://localhost:5174"
echo "✓ API docs → http://localhost:8001/docs"
echo ""
echo "Ctrl+C para detener todo."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
