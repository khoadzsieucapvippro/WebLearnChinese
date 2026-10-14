# BẢN ĐẶC TẢ KỸ THUẬT & ĐIỀU PHỐI SUBAGENTS (HƯỚNG 1): TRIỂN KHAI GITHUB PAGES (FRONTEND) + CLOUD 24/7 RAILWAY/RENDER (BACKEND & MYSQL)

Bạn là **Lead Orchestrator Agent**. Nhiệm vụ của bạn là cấu hình toàn diện repository này để triển khai theo kiến trúc **Production Cloud 24/7**:
- **Frontend (`frontend/`)** tự động xuất bản lên **GitHub Pages** (`https://<username>.github.io/<repo>/`) thông qua GitHub Actions. Nhóm trưởng bấm vào link trên GitHub là giao diện hiện lên ngay lập tức (0 giây chờ đợi).
- **Backend (`backend/`) + MySQL** đóng gói chuẩn Docker để chạy 24/7 trên **Railway.app** hoặc **Render.com**, tự động chạy Flyway migrations, tự động nạp sẵn 4 tài khoản mẫu (`Admin`, `Creator`, `Moderator`, `Learner`), và mở kết nối CORS + CSP an toàn với GitHub Pages.

Bạn **BẮT BUỘC** phải làm việc theo từng Giai đoạn (Phase 1 -> Phase 5), gọi các **Subagents** theo đúng phân công, tuân thủ tuyệt đối các quy tắc bảo mật/kiểm thử của dự án và **LƯU TIẾN TRÌNH VÀO GIT (`git add` & `git commit`)** sau mỗi Phase.

---

## PHẦN 0: CÁC QUY TẮC BẤT BIẾN CẤM VI PHẠM (ĐỌC KỸ TRƯỚC KHI CODE)

1. **CẤM SỬA CÁC FILE FLYWAY ĐÃ CÓ (`V1` đến `V19`/`V20`):**
   - Tuyệt đối không sửa bất kỳ file `.sql` nào đã tồn tại trong `backend/src/main/resources/db/migration/` để tránh lỗi Flyway Checksum.
2. **CẤM THÊM TÀI KHOẢN TEST VÀO FLYWAY MIGRATION CHUNG:**
   - Các bài test tích hợp trong `backend/src/test/java/com/elearning/` (như `AdminAccountIntegrationTests`, `IdentityPersistenceTests`, `IdentityRepositoryTests`) chạy toàn bộ Flyway migrations và kiểm tra số lượng bản ghi trong bảng `accounts`.
   - Vì vậy, việc nạp 4 tài khoản mẫu (`Admin`, `Creator`, `Moderator`, `Learner`) cho môi trường Cloud **PHẢI** được thực hiện qua một Spring `@Component` (`DemoAccountSeeder.java`) chỉ chạy khi cấu hình `app.demo.seed-accounts=true` (mặc định là `false` trong `application.yml` để không ảnh hưởng tới `mvn test`, và bật thành `true` trong biến môi trường của `Dockerfile` / Cloud).
3. **CẤM DÙNG `innerHTML`, `outerHTML`, `insertAdjacentHTML`:**
   - Mọi chỉnh sửa JS trong `frontend/js/` phải dùng DOM APIs an toàn (`createElement`, `textContent`) để vượt qua `tests/frontend/static/dom-sinks.test.mjs`.
4. **ĐỒNG BỘ THẺ `<meta http-equiv="Content-Security-Policy">` TRÊN TẤT CẢ 22 FILE `frontend/*.html`:**
   - Bài test `tests/frontend/static/csp-resource-graph.test.mjs` kiểm tra thẻ CSP trên toàn bộ 22 file HTML. Khi thêm domain Cloud vào `connect-src`, phải cập nhật đồng bộ tất cả 22 file HTML và kiểm tra `csp-resource-graph.test.mjs`.
5. **GIAO THỨC LƯU GIT (GIT CHECKPOINT PROTOCOL):**
   - Sau mỗi Phase (từ Phase 1 đến Phase 5), bắt buộc chạy lệnh kiểm thử của Phase đó. Chỉ khi PASS 100% mới chạy `git add -A` và `git commit -m "..."` theo đúng mẫu.

---

## PHẦN 1: QUY TRÌNH ĐIỀU PHỐI SUBAGENTS THEO 5 GIAI ĐOẠN (PHASES)

### 🔹 PHASE 1: Khảo sát Cấu hình Backend, CORS, Frontend Config & CSP (Read-Only)
**Gọi song song 2 Subagents chỉ đọc (`Phase1A-Backend-Explorer` và `Phase1B-Frontend-Explorer`):**

1. **`Phase1A-Backend-Explorer` đọc và báo cáo:**
   - `backend/pom.xml` (phiên bản Java 21, Spring Boot 3.3.5, tên file JAR khi build).
   - `backend/src/main/resources/application.yml` và `backend/src/test/resources/application.yml` (cấu hình `spring.datasource`, `app.jwt`, `app.cors`, `server.port`).
   - `backend/src/main/java/com/elearning/config/SecurityConfig.java` (cách cấu hình `CorsConfigurationSource` hiện tại).
   - `backend/src/test/java/com/elearning/CorsSecurityIntegrationTests.java` và `SecurityConfigTests.java` (các test case đang kiểm tra CORS).
   - `tests/postman/fixtures/seed-test-accounts.sql` và `tests/postman/fixtures/seed-test-accounts.mjs` (thông tin email, mật khẩu, role và bảng liên quan của 4 tài khoản mẫu).

2. **`Phase1B-Frontend-Explorer` đọc và báo cáo:**
   - `frontend/js/config.js` và `tests/frontend/unit/config/config.test.mjs` (cách `resolveConfig` hoạt động và các test case đang kiểm tra `config.js`).
   - Thẻ `<meta http-equiv="Content-Security-Policy" ...>` trong 22 file `frontend/*.html`.
   - `tests/frontend/static/csp-resource-graph.test.mjs` và `tests/frontend/e2e/csp-enforcement.browser.mjs` (cách test kiểm tra `connect-src` và các directive CSP).

---

### 🔹 PHASE 2: Cấu hình Backend Cloud-Ready (Dynamic Port, Env DB, CORS cho GitHub Pages & Auto-Seeder 4 Tài Khoản)
**Gọi Subagent: `Phase2-Backend-Cloud-Config-Agent`**

#### Nhiệm vụ 2.1: Chuẩn hóa `backend/src/main/resources/application.yml` cho Cloud (Railway / Render)
Cập nhật `backend/src/main/resources/application.yml` sao cho **giữ nguyên toàn bộ giá trị mặc định ở local** (để không làm hỏng local dev hay test), nhưng đọc linh hoạt từ biến môi trường của Railway/Render:
- `server.port: ${PORT:8080}`
- Trong `spring.datasource`:
  - `url: ${SPRING_DATASOURCE_URL:jdbc:mysql://${MYSQLHOST:localhost}:${MYSQLPORT:3306}/${MYSQLDATABASE:elearning_db}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&characterEncoding=UTF-8&serverTimezone=UTC}`
  - `username: ${SPRING_DATASOURCE_USERNAME:${MYSQLUSER:root}}`
  - `password: ${SPRING_DATASOURCE_PASSWORD:${MYSQLPASSWORD:root}}`
- Thêm cấu hình tùy chọn nạp tài khoản mẫu:
  ```yaml
  app:
    demo:
      seed-accounts: ${APP_DEMO_SEED_ACCOUNTS:false}
Nhiệm vụ 2.2: Mở rộng CORS an toàn cho GitHub Pages trong SecurityConfig.javaKiểm tra backend/src/main/java/com/elearning/config/SecurityConfig.java và application.yml.Đảm bảo CorsConfiguration:Giữ nguyên việc đọc danh sách origins được phép từ cấu hình hiện tại để tất cả các test trong CorsSecurityIntegrationTests.java vẫn PASS 100%.Cho phép cấu hình qua biến môi trường CORS_ALLOWED_ORIGINS (hoặc APP_CORS_ALLOWED_ORIGINS) và hỗ trợ setAllowedOriginPatterns cho https://*.github.io khi biến môi trường Cloud kích hoạt (hoặc thêm https://*.github.io vào pattern hợp lệ mà không vi phạm test CorsSecurityIntegrationTests).Đảm bảo cho phép đầy đủ các methods: GET, POST, PUT, PATCH, DELETE, OPTIONS và headers: Authorization, Content-Type, Accept, Origin, X-Requested-With.Nhiệm vụ 2.3: Tạo DemoAccountSeeder.java tự động nạp 4 Tài khoản mẫu trên CloudTạo file backend/src/main/java/com/elearning/config/DemoAccountSeeder.java:Đánh dấu @Component và @ConditionalOnProperty(name = "app.demo.seed-accounts", havingValue = "true").Implement ApplicationRunner.Bên trong run(ApplicationArguments args) (kèm @Transactional):Kiểm tra và tạo tự động (idempotent — nếu email đã tồn tại thì bỏ qua hoặc đảm bảo đúng mật khẩu & role) cho 4 tài khoản mẫu chuẩn của dự án (dựa theo tests/postman/fixtures/seed-test-accounts.mjs / .sql):Learner: learner@elearning.local (và thêm 1 bản dễ nhớ learner@gmail.com) — Role: LearnerCreator: creator@elearning.local (và creator@gmail.com) — Role: CreatorModerator: moderator@elearning.local (và moderator@gmail.com) — Role: ModeratorAdmin: admin@elearning.local (và admin@gmail.com) — Role: AdminMật khẩu mã hóa bằng PasswordEncoder (Password@123), trạng thái ACTIVE, khởi tạo đầy đủ UserProfile và UserSrsSetting (20 thẻ/ngày, timezone Asia/Ho_Chi_Minh) cho từng tài khoản để khi Nhóm trưởng đăng nhập vào bất kỳ tài khoản nào cũng không bị lỗi thiếu Profile hay SRS Settings.Nhiệm vụ 2.4: Kiểm thử Backend & Lưu Git Checkpoint 1Chạy test Maven cho CorsSecurityIntegrationTests, SecurityConfigTests, AuthIntegrationTests:mvn -f backend/pom.xml test -Dtest=CorsSecurityIntegrationTests,SecurityConfigTestsKhi PASS 100%, lưu Git Checkpoint:Bashgit add -A
git commit -m "feat(backend-cloud): support cloud env vars, github.io CORS, and conditional DemoAccountSeeder"
🔹 PHASE 3: Đóng gói Docker & Cấu hình Deploy 1-Click cho Railway / RenderGọi Subagent: Phase3-Docker-And-Cloud-Manifest-AgentNhiệm vụ 3.1: Tạo Multi-stage Dockerfile tối ưu cho Java 21 Spring BootTạo file Dockerfile ở thư mục gốc của dự án (và backend/Dockerfile nếu cần) với cấu trúc Multi-stage:Stage 1 (builder):Dùng image maven:3.9.9-eclipse-temurin-21-alpine (hoặc maven:3.9.9-eclipse-temurin-21).Copy backend/pom.xml tải dependencies trước (mvn dependency:go-offline -B), sau đó copy backend/src và chạy mvn clean package -DskipTests -B.Stage 2 (runtime):Dùng image nhẹ eclipse-temurin:21-jre-alpine (hoặc eclipse-temurin:21-jre-jammy).Đặt biến môi trường mặc định cho Cloud Demo:DockerfileENV PORT=8080 \
    APP_DEMO_SEED_ACCOUNTS=true \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
Copy file .jar từ stage builder sang /app/app.jar.EXPOSE 8080ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]Tạo file .dockerignore ở thư mục gốc để loại trừ node_modules, .git, artifacts, tests, frontend giúp tốc độ build Docker trên Railway/Render cực nhanh (dưới 1 phút).Nhiệm vụ 3.2: Tạo file cấu hình railway.json và render.yamlTạo railway.json ở thư mục gốc:Cấu hình builder DOCKERFILE (dockerfilePath: "Dockerfile"), healthcheckPath: "/actuator/health", healthcheckTimeout: 180, restartPolicyType: "ON_FAILURE".Tạo render.yaml ở thư mục gốc:Cấu hình Blueprint cho web service elearning-backend dùng runtime: docker, healthCheckPath: /actuator/health, kèm các biến môi trường mẫu.Nhiệm vụ 3.3: Lưu Git Checkpoint 2Bashgit add -A
git commit -m "chore(docker): add multi-stage Java 21 Dockerfile, railway.json, and render.yaml"
🔹 PHASE 4: Cấu hình Frontend (config.js, CSP 22 trang HTML, .nojekyll) & GitHub Actions Deploy GitHub PagesGọi Subagent: Phase4-GitHub-Pages-And-CSP-AgentNhiệm vụ 4.1: Nâng cấp frontend/js/config.js hỗ trợ GitHub Pages & Cloud Backend URLMở frontend/js/config.js và đọc kỹ tests/frontend/unit/config/config.test.mjs.Cập nhật frontend/js/config.js sao cho:Giữ nguyên 100% hành vi hiện tại đối với window.__ENV__ và localhost / 127.0.0.1 để mọi bài test trong tests/frontend/unit/config/config.test.mjs PASS tuyệt đối.Bổ sung cơ chế linh hoạt khi chạy trên GitHub Pages (*.github.io):Nếu có tham số URL ?apiUrl=https://... trên thanh địa chỉ trình duyệt: Lưu vào localStorage.setItem('ELEARNING_CLOUD_API_URL', ...) và sử dụng URL đó (cực kỳ tiện lợi để đổi link Backend bất kỳ lúc nào mà không cần sửa code).Nếu trong localStorage có ELEARNING_CLOUD_API_URL hợp lệ (https://...): Sử dụng URL đó.Nếu window.__ENV__?.API_BASE_URL được khai báo: Sử dụng window.__ENV__.API_BASE_URL.Khai báo hằng số CLOUD_PRODUCTION_API_URL = '__CLOUD_BACKEND_API_URL__' (sẽ được GitHub Actions tự động điền từ biến BACKEND_API_URL của repo khi deploy lên GitHub Pages).Nhiệm vụ 4.2: Cập nhật <meta http-equiv="Content-Security-Policy"> trên 22 file frontend/*.htmlKiểm tra tests/frontend/static/csp-resource-graph.test.mjs để xem bài test đang kiểm tra những gì ở directive connect-src.Cập nhật directive connect-src trong thẻ <meta http-equiv="Content-Security-Policy" ...> trên toàn bộ 22 file frontend/*.html để cho phép kết nối tới các nền tảng Cloud HTTPS phổ biến:connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https://*.up.railway.app https://*.onrender.com https://*.koyeb.app;Nếu tests/frontend/static/csp-resource-graph.test.mjs có kiểm tra danh sách cứng các nguồn trong connect-src, hãy cập nhật quy tắc trong csp-resource-graph.test.mjs cho khớp với các nguồn HTTPS Cloud đã được cấp phép này.Tạo file rỗng frontend/.nojekyll để GitHub Pages phục vụ nguyên vẹn hơn 300 file dữ liệu nét viết chữ Hán (frontend/assets/data/strokes/*.json) mà không bị bộ xử lý Jekyll can thiệp.Nhiệm vụ 4.3: Tạo Workflow .github/workflows/deploy-pages.yml tự động xuất bản frontend/ lên GitHub PagesTạo file .github/workflows/deploy-pages.yml với chức năng:Kích hoạt khi push lên nhánh chính (main hoặc master) hoặc bấm nút chạy thủ công (workflow_dispatch có ô nhập backend_api_url tùy chọn!).Cấp quyền pages: write, id-token: write, contents: read.Bước chuẩn bị artifact từ thư mục frontend/:Copy toàn bộ thư mục frontend/ ra thư mục build _site/.Nếu người dùng có cài đặt GitHub Repository Variable vars.BACKEND_API_URL (hoặc nhập inputs.backend_api_url khi bấm chạy workflow), tự động ghi giá trị đó vào window.__ENV__.API_BASE_URL trong _site/js/config.js!Đảm bảo _site/.nojekyll tồn tại.Dùng actions/upload-pages-artifact@v3 (path: _site) và actions/deploy-pages@v4 để xuất bản trực tiếp ra đường link https://<username>.github.io/<repo>/.Nhiệm vụ 4.4: Kiểm thử Frontend & Lưu Git Checkpoint 3Chạy:node tests/frontend/runner.mjs --tier staticnode tests/frontend/runner.mjs --tier unitKhi cả 2 tầng test đều PASS 100%, lưu Git Checkpoint:Bashgit add -A
git commit -m "feat(github-pages): add deploy-pages workflow, cloud CSP connect-src, and dynamic API URL resolution"
🔹 PHASE 5: Cập nhật README.md Hướng Dẫn Cho Nhóm Trưởng & Kiểm Thử Toàn Diện Cuối CùngGọi Subagent: Phase5-Documentation-And-Verification-AgentNhiệm vụ 5.1: Cập nhật README.md trực quan, chuyên nghiệpBổ sung ngay đầu file README.md:Mục "🌐 Link Trải Nghiệm Trực Tuyến (Dành Cho Nhóm Trưởng / Giảng Viên)":Đặt vị trí nổi bật cho đường link GitHub Pages: https://<USERNAME>.github.io/<REPO_NAME>/Bảng 4 Tài Khoản Đăng Nhập Mẫu Có Sẵn (Mật khẩu chung: Password@123):Vai trò (Role)Email đăng nhậpCác chức năng chính cần kiểm traHọc viên (Learner)learner@elearning.local / learner@gmail.comTra cứu 214 Bộ thủ, Từ vựng HSK, Luyện viết chữ Hán, Ôn tập Flashcard SRS, Ghi chú, Cài đặtBiên soạn (Creator)creator@elearning.local / creator@gmail.comTạo bài học mới, Import từ vựng bằng file Excel, Sắp xếp từ vựng, Gửi duyệtKiểm duyệt (Moderator)moderator@elearning.local / moderator@gmail.comXem hàng đợi duyệt bài, Phê duyệt / Từ chối bài học, Xem lịch sử kiểm duyệtQuản trị (Admin)admin@elearning.local / admin@gmail.comQuản lý tài khoản, Phân quyền RBAC, Quản trị 214 Bộ thủ, Từ vựng & Bài học toàn hệ thốngMục "☁️ Hướng Dẫn Chủ Dự Án Kết Nối Railway / Render Trong 3 Phút":Hướng dẫn ngắn gọn cách bấm tạo MySQL + Web Service trên Railway từ GitHub repo này và cách điền biến BACKEND_API_URL trong mục Settings -> Pages / Settings -> Secrets and variables -> Actions -> Variables trên GitHub.Nhiệm vụ 5.2: Chạy Tổng Kiểm Thử & Lưu Git Checkpoint Cuối CùngChạy lại toàn bộ kiểm thử:node tests/frontend/runner.mjs --tier staticnode tests/frontend/runner.mjs --tier unitmvn -f backend/pom.xml test -Dtest=CorsSecurityIntegrationTests,SecurityConfigTestsKiểm tra git status đảm bảo kho code sạch sẽ, không có file tạm.Commit tiến trình cuối cùng:Bashgit add -A
git commit -m "docs(readme): add live demo guide, RBAC test credentials, and cloud deployment instructions"
In ra git log -n 5 --oneline và báo cáo hoàn tất.
## PHASE TỰ ĐỘNG HÓA TRIỂN KHAI LÊN MẠNG 100% (ZERO-TOUCH DEPLOYMENT AGENT)

Tôi ủy quyền toàn bộ cho bạn thực hiện việc đẩy code và kích hoạt trang web trực tiếp từ Terminal mà tôi không phải thao tác tay trên giao diện web. Hãy gọi Subagent `Auto-Deployment-CLI-Agent` thực hiện tuần tự các bước sau:

### Bước 1: Tích hợp chế độ Tự vận hành (Zero-Backend Fallback) vào `frontend/js/api/api.js` để link GitHub Pages luôn sống 100%
1. Mở `frontend/js/api/api.js` (và tạo module phụ trợ `frontend/js/api/demo-fallback-engine.js` nếu cần).
2. Giữ nguyên 100% logic gọi HTTP `fetch` hiện tại để mọi bài test trong `tests/frontend/unit/api/api-client.test.mjs` và kết nối Backend thật hoạt động bình thường.
3. Bổ sung cơ chế **Smart Cloud Fallback**:
   - Khi trang web đang chạy trên tên miền GitHub Pages (`window.location.hostname.endsWith('.github.io')`) HOẶC khi lệnh gọi tới Cloud Backend bị lỗi mạng (Network Error) trên môi trường Demo:
   - `apiClient` tự động xử lý các endpoint API ngay trên trình duyệt bằng dữ liệu chuẩn của dự án (nạp từ bộ dữ liệu 214 bộ thủ, từ vựng HSK 1–2–3, các chủ đề ôn tập, thuật toán SM-2 SRS, ghi chú cá nhân, quản lý bài học Creator/Moderator/Admin và 4 tài khoản đăng nhập `learner@gmail.com`, `creator@gmail.com`, `moderator@gmail.com`, `admin@gmail.com` với mật khẩu `Password@123`), đồng thời lưu trạng thái thay đổi vào `localStorage`.
   - Nhờ cơ chế này, dù Backend Railway đang bật hay tắt, Nhóm trưởng bấm vào link `https://<username>.github.io/<repo>/` đều đăng nhập và kiểm tra được 100% chức năng không bao giờ gặp lỗi đỏ!

### Bước 2: Tự động Commit và Đẩy Code lên GitHub (`git push`)
1. Chạy lại `node tests/frontend/runner.mjs --tier static` và `node tests/frontend/runner.mjs --tier unit` để đảm bảo 100% test PASS.
2. Chạy lệnh:
   ```bash
   git add -A
   git commit -m "feat(deploy): enable full-auto GitHub Pages deployment with smart serverless fallback"
   git push -u origin HEAD
Bước 3: Tự động Bật GitHub Pages và Kích hoạt Workflow bằng GitHub CLI (gh)
Sử dụng gh CLI trên máy để tự động cấu hình GitHub Pages mà không bắt người dùng mở trình duyệt:

Kiểm tra trạng thái đăng nhập GitHub CLI: gh auth status.

Lấy thông tin <OWNER>/<REPO> hiện tại:

Bash
REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
Tự động bật GitHub Pages ở chế độ workflow (GitHub Actions) qua API:

Bash
gh api -X POST "repos/$REPO_FULL/pages" -f build_type=workflow || gh api -X PUT "repos/$REPO_FULL/pages" -f build_type=workflow
Tự động kích hoạt workflow xuất bản trang web:

Bash
gh workflow run deploy-pages.yml
Tự động cập nhật đường link trang web https://<OWNER>.github.io/<REPO>/ vào trường Website (Homepage) ở mục About trên trang chủ GitHub repo:

Bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)
LIVE_URL="https://${OWNER}.github.io/${REPO_NAME}/"
gh repo edit --homepage "$LIVE_URL"
Bước 4: (Tùy chọn tự động nếu có Railway CLI) Kết nối Railway Backend
Kiểm tra xem máy đã đăng nhập Railway chưa bằng npx --yes @railway/cli whoami.

Nếu đã đăng nhập: Tự động chạy lệnh tạo service, lấy domain bằng npx --yes @railway/cli domain, sau đó tự động gán vào GitHub Variable bằng lệnh:

Bash
gh variable set BACKEND_API_URL --body "https://<RAILWAY_DOMAIN>/api/v1"
gh workflow run deploy-pages.yml
Cuối cùng, kiểm tra tiến trình chạy của GitHub Actions bằng gh run list --limit 1 và in ra đường link chính thức https://<OWNER>.github.io/<REPO>/ để tôi gửi ngay cho Nhóm trưởng!