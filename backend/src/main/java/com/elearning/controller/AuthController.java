package com.elearning.controller;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ChangePasswordRequest;
import com.elearning.dto.request.ForgotPasswordRequest;
import com.elearning.dto.request.LoginRequest;
import com.elearning.dto.request.RegisterRequest;
import com.elearning.dto.request.ResetPasswordRequest;
import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.AuthResponse;
import com.elearning.dto.response.ForgotPasswordResponse;
import com.elearning.exception.BusinessException;
import com.elearning.security.LoginRateLimiter;
import com.elearning.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller providing public authentication endpoints:
 * - POST /api/v1/auth/register (201 Created)
 * - POST /api/v1/auth/login (200 OK)
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(AuthService authService, LoginRateLimiter loginRateLimiter) {
        this.authService = authService;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = resolveClientIp(servletRequest);
        if (!loginRateLimiter.tryAcquire(clientIp)) {
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau"
            );
        }

        AuthResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = resolveClientIp(servletRequest);
        if (!loginRateLimiter.tryAcquire(clientIp)) {
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau"
            );
        }

        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        authService.logout(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        authService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = resolveClientIp(servletRequest);
        if (!loginRateLimiter.tryAcquire(clientIp)) {
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Quá nhiều yêu cầu, vui lòng thử lại sau"
            );
        }

        ForgotPasswordResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                response.getMessage() != null ? response.getMessage() : "Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến hòm thư của bạn.",
                response
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = resolveClientIp(servletRequest);
        if (!loginRateLimiter.tryAcquire(clientIp)) {
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Quá nhiều yêu cầu, vui lòng thử lại sau"
            );
        }

        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
                null
        ));
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }
}
