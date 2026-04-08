@echo off
echo Starting Velin Inventory - Dual Session Mode
echo.

echo [1/3] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak > nul

echo [2/3] Starting Frontend A (Port 5173)...
start "Frontend 5173 - Admin" cmd /k "cd frontend && npx vite --port 5173"

timeout /t 2 /nobreak > nul

echo [3/3] Starting Frontend B (Port 5174)...
start "Frontend 5174 - Customer" cmd /k "cd frontend && npx vite --port 5174"

echo.
echo ======================================================
echo   SUCCESS: Sessions are starting!
echo.
echo   - http://localhost:5173
echo   - http://localhost:5174
echo.
echo   Check the 3 terminal windows for any errors.
echo ======================================================
pause
