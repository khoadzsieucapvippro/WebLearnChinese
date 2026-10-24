@echo off
chcp 65001 > nul
echo ===============================================================================
echo   CHẠY FULL STACK E-LEARNING CHINESE
echo ===============================================================================

set "ROOT_DIR=%~dp0"
if not defined JWT_SECRET set "JWT_SECRET=dev-local-jwt-secret-key-minimum-256-bits-length-for-development-only!"

echo [1/4] Kiểm tra MySQL trên cổng 3306...
powershell -Command "if ((Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host '[+] MySQL đang chạy.' -ForegroundColor Green } else { Write-Host '[-] CẢNH BÁO: MySQL chưa chạy trên cổng 3306!' -ForegroundColor Yellow; Write-Host '    Hãy khởi động MySQL hoặc chạy Docker: docker run -d --name elearning-mysql -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=elearning_db mysql:8.0' }"

echo.
echo [2/4] Kiểm tra và khởi chạy Speech Service (FastAPI :8000)...
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] Đã tìm thấy Python. Đang khởi chạy Speech Service trong cửa sổ mới...
    start "E-Learning Speech Service (FastAPI :8000)" cmd /k "cd /d "%ROOT_DIR%speech-service" && python -X utf8 run_service.py"
) else (
    echo [-] CẢNH BÁO: Không tìm thấy Python trong PATH! Speech Service sẽ không chạy.
    echo     Tính năng Luyện đọc cần Speech Service để phân tích phát âm hoặc có thể dùng nút Bỏ qua an toàn.
)

echo.
echo [3/4] Khởi chạy Spring Boot Backend (Port 8080) trong cửa sổ mới...
start "E-Learning Backend (Spring Boot :8080)" cmd /k "cd /d "%ROOT_DIR%backend" && set "JWT_SECRET=%JWT_SECRET%" && mvn spring-boot:run -Dspring-boot.run.arguments=\"--jwt.secret=%JWT_SECRET%\""

echo.
echo [4/4] Khởi chạy Frontend Server (Port 3000) trong cửa sổ mới...
start "E-Learning Frontend (Node.js :3000)" cmd /k "cd /d "%ROOT_DIR%" && node scripts/serve.mjs"

echo.
echo ===============================================================================
echo   HỆ THỐNG ĐANG KHỞI ĐỘNG:
echo   - Web App Frontend : http://localhost:3000
echo   - REST API Backend : http://localhost:8080
echo   - Speech Service   : http://127.0.0.1:8000/health
echo   - Healthcheck      : http://localhost:8080/actuator/health
echo ===============================================================================
echo Đang mở trình duyệt vào http://localhost:3000...
timeout /t 3 > nul
start http://localhost:3000

echo Hoàn tất.
pause
