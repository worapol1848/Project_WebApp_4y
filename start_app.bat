@echo off
echo Starting Velin Inventory System...

echo Starting Backend Server...
start cmd /k "cd backend && npm install && node server.js"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm install && npm run dev"

echo Both servers are starting. Please open your browser to the URL shown in the Frontend window.
