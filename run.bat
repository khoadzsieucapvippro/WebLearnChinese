@echo off
chcp 65001 > nul
echo ===============================================================================
echo   CHẠY FULL STACK E-LEARNING CHINESE
echo ===============================================================================

set "ROOT_DIR=%~dp0"

echo [1/3] Kiểm tra MySQL trên cổng 3306...
powershell -Command "if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host '[+] MySQL đang chạy.' -ForegroundColor Green } else { Write-Host '[-] CẢNH BÁO: MySQL chưa chạy trên cổng 3306!' -ForegroundColor Yellow; Write-Host '    Hãy khởi động MySQL hoặc chạy Docker: docker run -d --name elearning-mysql -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=elearning_db mysql:8.0' }"

echo.
echo [2/3] Khởi chạy Spring Boot Backend (Port 8080) trong cửa sổ mới...
start "E-Learning Backend (Spring Boot :8080)" cmd /k "cd /d "%ROOT_DIR%backend" && mvn spring-boot:run -Dspring-boot.run.arguments=\"--jwt.secret=elearning-chinese-platform-secret-key-jwt-256-bits-minimum-length-key!\""

echo.
echo [3/3] Khởi chạy Frontend Server (Port 3000) trong cửa sổ mới...
start "E-Learning Frontend (Node.js :3000)" cmd /k "cd /d "%ROOT_DIR%" && node scripts/serve.mjs"

echo.
echo ===============================================================================
echo   HỆ THỐNG ĐANG KHỞI ĐỘNG:
echo   - Web App Frontend : http://localhost:3000
echo   - REST API Backend : http://localhost:8080
echo   - Healthcheck      : http://localhost:8080/actuator/health
echo ===============================================================================
echo Đang mở trình duyệt vào http://localhost:3000...
timeout /t 3 > nul
start http://localhost:3000

echo Hoàn tất.
pause
