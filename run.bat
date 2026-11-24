@echo off
chcp 65001 > nul
echo ===============================================================================
echo   CHAY FULL STACK E-LEARNING CHINESE
echo ===============================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

if not defined JWT_SECRET set "JWT_SECRET=dev-local-jwt-secret-key-minimum-256-bits-length-for-development-only!"
if not defined MYSQLDATABASE set "MYSQLDATABASE=elearning_dev"
if not defined APP_DEMO_SEED_ACCOUNTS set "APP_DEMO_SEED_ACCOUNTS=true"

echo [1/4] Kiem tra MySQL tren cong 3306...
powershell -NoProfile -Command "if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host '[+] MySQL dang chay.' -ForegroundColor Green } else { if (Test-Path 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe') { Write-Host '[+] Dang tu dong khoi chay MySQL Server cuc bo...' -ForegroundColor Cyan; Start-Process -FilePath 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' -ArgumentList '--defaults-file=""C:\ProgramData\MySQL\MySQL Server 8.4\my.ini""' -WindowStyle Hidden; Start-Sleep -Seconds 3; if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host '[+] MySQL da san sang!' -ForegroundColor Green } } else { Write-Host '[-] CANH BAO: MySQL chua chay tren cong 3306!' -ForegroundColor Yellow } }"

echo.
echo [2/4] Kiem tra va khoi chay Speech Service (FastAPI :8000)...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 goto :NO_PYTHON
echo [+] Da tim thay Python. Dang khoi chay Speech Service trong cua so moi...
start "E-Learning Speech Service (FastAPI :8000)" cmd /k "cd /d ""%ROOT_DIR%\speech-service"" && python -X utf8 run_service.py"
goto :PYTHON_DONE

:NO_PYTHON
echo [-] CANH BAO: Khong tim thay Python trong PATH! Speech Service se khong chay.
echo     Tinh nang Luyen doc can Speech Service de phan tich phat am.

:PYTHON_DONE

echo.
echo [3/4] Khoi chay Spring Boot Backend (Port 8080) trong cua so moi...
start "E-Learning Backend (Spring Boot :8080)" cmd /k "cd /d ""%ROOT_DIR%\backend"" && set ""JWT_SECRET=%JWT_SECRET%"" && set ""MYSQLDATABASE=%MYSQLDATABASE%"" && set ""APP_DEMO_SEED_ACCOUNTS=%APP_DEMO_SEED_ACCOUNTS%"" && mvn spring-boot:run"

echo.
echo [4/4] Khoi chay Frontend Server (Port 3000) trong cua so moi...
start "E-Learning Frontend (Node.js :3000)" cmd /k "cd /d ""%ROOT_DIR%"" && node scripts/serve.mjs"

echo.
echo ===============================================================================
echo   HE THONG DANG KHOI DONG:
echo   - Web App Frontend : http://localhost:3000
echo   - REST API Backend : http://localhost:8080
echo   - Speech Service   : http://127.0.0.1:8000/health
echo   - Healthcheck      : http://localhost:8080/actuator/health
echo ===============================================================================
echo Dang mo trinh duyet vao http://localhost:3000...
ping 127.0.0.1 -n 4 > nul
start http://localhost:3000

echo Hoan tat.
pause