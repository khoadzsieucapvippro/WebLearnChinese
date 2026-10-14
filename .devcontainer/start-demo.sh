#!/usr/bin/env bash
# =============================================================================
# E-Learning Chinese Platform - DevContainer Demo Auto-Starter
# Description: Idempotent initialization & service starter for fullstack demo.
# =============================================================================

set -e

# Resolve repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${WORKSPACE_ROOT}"

# Environment configuration with sensible defaults
DB_HOST="${DB_HOST:-db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-elearning_db}"
JWT_SECRET="${JWT_SECRET:-elearning-chinese-platform-secret-key-jwt-256-bits-minimum-length-key!}"
BACKEND_PORT=8080
FRONTEND_PORT="${PORT:-3000}"

echo "================================================================================"
echo " Starting E-Learning Chinese Platform Demo Environment..."
echo "================================================================================"

# -----------------------------------------------------------------------------
# 1. Wait for MySQL to be ready (up to 60 seconds)
# -----------------------------------------------------------------------------
echo "[1/5] Checking MySQL readiness at ${DB_HOST}:3306..."
DB_READY=false
for i in $(seq 1 60); do
  if [ -n "${DB_PASSWORD}" ]; then
    MYSQL_PWD="${DB_PASSWORD}" mysqladmin ping -h "${DB_HOST}" -u "${DB_USER}" --silent > /dev/null 2>&1 && DB_READY=true && break
  else
    mysqladmin ping -h "${DB_HOST}" -u "${DB_USER}" --silent > /dev/null 2>&1 && DB_READY=true && break
  fi
  echo "      Waiting for MySQL database... (${i}/60s)"
  sleep 1
done

if [ "${DB_READY}" != "true" ]; then
  echo "[-] ERROR: MySQL did not become ready within 60 seconds." >&2
  exit 1
fi
echo "[+] MySQL is ready and responding."

# -----------------------------------------------------------------------------
# 2. Ensure Database exists
# -----------------------------------------------------------------------------
echo "[2/5] Ensuring database '${DB_NAME}' exists..."
if [ -n "${DB_PASSWORD}" ]; then
  MYSQL_PWD="${DB_PASSWORD}" mysql -h "${DB_HOST}" -u "${DB_USER}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
  mysql -h "${DB_HOST}" -u "${DB_USER}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi
echo "[+] Database '${DB_NAME}' is ready."

# -----------------------------------------------------------------------------
# 3. Check and start Spring Boot Backend
# -----------------------------------------------------------------------------
echo "[3/5] Checking Spring Boot Backend..."
BACKEND_RUNNING=false
if curl -s -f "http://127.0.0.1:${BACKEND_PORT}/actuator/health" > /dev/null 2>&1; then
  BACKEND_RUNNING=true
  echo "[+] Backend is already running and healthy."
else
  echo "[*] Backend is not running. Launching Spring Boot application in background..."
  nohup mvn -f backend/pom.xml spring-boot:run \
    -Dspring-boot.run.arguments="--jwt.secret=${JWT_SECRET} --spring.datasource.url=jdbc:mysql://${DB_HOST}:3306/${DB_NAME}?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
    > /tmp/backend.log 2>&1 &

  echo "      Waiting for Spring Boot to start and Flyway migrations to complete..."
  for i in $(seq 1 90); do
    if curl -s -f "http://127.0.0.1:${BACKEND_PORT}/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
      BACKEND_RUNNING=true
      echo ""
      echo "[+] Spring Boot Backend is UP and healthy! (${i}s)"
      break
    fi
    printf "."
    sleep 1
  done
  echo ""

  if [ "${BACKEND_RUNNING}" != "true" ]; then
    echo "[-] ERROR: Backend failed to start within 90 seconds. Check /tmp/backend.log:" >&2
    tail -n 30 /tmp/backend.log >&2 || true
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 4. Seed test accounts (Learner, Creator, Moderator, Admin)
# -----------------------------------------------------------------------------
echo "[4/5] Seeding test accounts from tests/postman/fixtures/seed-test-accounts.sql..."
if [ -f "tests/postman/fixtures/seed-test-accounts.sql" ]; then
  if [ -n "${DB_PASSWORD}" ]; then
    MYSQL_PWD="${DB_PASSWORD}" mysql -h "${DB_HOST}" -u "${DB_USER}" --default-character-set=utf8mb4 "${DB_NAME}" < tests/postman/fixtures/seed-test-accounts.sql
  else
    mysql -h "${DB_HOST}" -u "${DB_USER}" --default-character-set=utf8mb4 "${DB_NAME}" < tests/postman/fixtures/seed-test-accounts.sql
  fi
  echo "[+] Test accounts verified and seeded successfully."
else
  echo "[-] WARNING: tests/postman/fixtures/seed-test-accounts.sql not found, skipping account seeding."
fi

# -----------------------------------------------------------------------------
# 5. Check and start Frontend server
# -----------------------------------------------------------------------------
echo "[5/5] Checking Frontend server..."
if curl -s -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/" 2>/dev/null; then
  echo "[+] Frontend server is already running on port ${FRONTEND_PORT}."
else
  echo "[*] Frontend server is not running. Starting node scripts/serve.mjs..."
  PORT="${FRONTEND_PORT}" BACKEND_ORIGIN="http://127.0.0.1:${BACKEND_PORT}" nohup node scripts/serve.mjs > /tmp/frontend.log 2>&1 &
  sleep 2
  if curl -s -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/" 2>/dev/null; then
    echo "[+] Frontend server started successfully on port ${FRONTEND_PORT}."
  else
    echo "[-] WARNING: Frontend server may take another moment to bind. Check /tmp/frontend.log if needed."
  fi
fi

# -----------------------------------------------------------------------------
# Summary Dashboard
# -----------------------------------------------------------------------------
cat << 'EOF'

================================================================================
  ███████╗      ██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗ 
  ██╔════╝      ██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝ 
  █████╗  █████╗██║     █████╗  ███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
  ██╔══╝  ╚════╝██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║
  ███████╗      ███████╗███████╗██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝
  ╚══════╝      ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                 CHINESE LANGUAGE LEARNING PLATFORM (DEMO)
================================================================================

 [URL TRUY CẬP HỆ THỐNG]
   Web App Frontend : http://localhost:3000   (Tự động mở trình duyệt)
   REST API Backend : http://localhost:8080
   Health Check API : http://localhost:8080/actuator/health

 [DANH SÁCH TÀI KHOẢN MẪU (TEST ACCOUNTS)]
 +-----------+--------------------+---------------+-----------------------------+
 | Role      | Email              | Password      | Quyền hạn & Chức năng       |
 +-----------+--------------------+---------------+-----------------------------+
 | Learner   | learner@test.com   | Password123!  | Học bộ thủ, từ vựng, ôn SRS |
 | Creator   | creator@test.com   | Password123!  | Soạn bài học, Import từ CSV |
 | Moderator | moderator@test.com | Password123!  | Hàng đợi duyệt nội dung     |
 | Admin     | admin@test.com     | Password123!  | Quản trị tài khoản & User   |
 +-----------+--------------------+---------------+-----------------------------+

 [TÍNH NĂNG CHÍNH ĐỂ TRẢI NGHIỆM]
   1. 214 Bộ Thủ Khang Hy (Kangxi Radicals) - Học theo nét, Pinyin, Hán Việt
   2. Từ Vựng HSK 1 - Tra cứu, phát âm, ví dụ câu ngữ cảnh
   3. Thuật Toán Lặp Lại Ngắt Quãng (SRS) - Ghi nhớ từ vựng dài hạn
   4. Creator Studio - Nhập kho từ vựng hàng loạt từ file CSV / JSON
   5. Moderator Queue - Kiểm duyệt nội dung từ cộng đồng trước khi xuất bản
   6. Admin Control Center - Khóa/mở tài khoản, phân quyền Role động

 [NHẬT KÝ VẬN HÀNH (LOGS)]
   - Backend Log  : tail -f /tmp/backend.log
   - Frontend Log : tail -f /tmp/frontend.log

================================================================================
 HỆ THỐNG ĐÃ SẴN SÀNG! CHÚC BẠN CÓ TRẢI NGHIỆM HỌC TẬP TUYỆT VỜI!
================================================================================

EOF
