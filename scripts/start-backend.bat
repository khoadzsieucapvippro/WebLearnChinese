@echo off
set "JWT_SECRET=dev-local-jwt-secret-key-minimum-256-bits-length-for-development-only!"
set "MYSQLDATABASE=elearning_dev"
cd /d "%~dp0..\backend"
mvn spring-boot:run -Dapp.demo.seed-accounts=true
