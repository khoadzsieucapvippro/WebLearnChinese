package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ChangePasswordRequest;
import com.elearning.dto.request.ForgotPasswordRequest;
import com.elearning.dto.request.LoginRequest;
import com.elearning.dto.request.RegisterRequest;
import com.elearning.dto.request.ResetPasswordRequest;
import com.elearning.dto.request.VerifyResetCodeRequest;
import com.elearning.dto.response.AuthResponse;
import com.elearning.dto.response.ForgotPasswordResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.security.CustomUserDetails;
import com.elearning.security.JwtUtil;
import com.elearning.service.AuthService;
import com.elearning.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Implementation of {@link AuthService} handling account registration, login, and self-service password reset (Model A).
 * Orchestrates AccountRepository, RoleRepository, PasswordEncoder, AuthenticationManager, and JwtUtil.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long RESET_CODE_TTL_MS = 15 * 60 * 1000L; // 15 minutes

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final ConcurrentMap<String, ResetCodeEntry> resetCodeStore = new ConcurrentHashMap<>();

    private static class ResetCodeEntry {
        final String code;
        final long expiresAt;

        ResetCodeEntry(String code, long ttlMs) {
            this.code = code;
            this.expiresAt = System.currentTimeMillis() + ttlMs;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }

    public AuthServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil) {
        this(accountRepository, roleRepository, passwordEncoder, authenticationManager, jwtUtil, null);
    }

    @Autowired
    public AuthServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            @Autowired(required = false) EmailService emailService) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Uniqueness check
        if (accountRepository.existsByEmailOrPhone(request.getEmailOrPhone())) {
            throw new BusinessException(ErrorCode.CONFLICT, "Email hoặc số điện thoại đã được đăng ký trong hệ thống");
        }

        // 2. Fetch default Learner role
        Role learnerRole = roleRepository.findByRoleName("Learner")
                .or(() -> roleRepository.findById(1))
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Không tìm thấy vai trò mặc định Learner trong hệ thống"));

        // 3. Construct Account entity with hashed password
        Account account = new Account();
        account.setEmailOrPhone(request.getEmailOrPhone());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setStatus("Active");
        account.addRole(learnerRole);

        // 4. Attach UserProfile
        UserProfile userProfile = new UserProfile();
        userProfile.setFullName(request.getFullName());
        account.setUserProfile(userProfile);

        // 5. Persist account and cascaded profile
        Account savedAccount = accountRepository.save(account);

        // 6. Generate JWT token and return AuthResponse
        List<String> roleNames = List.of(learnerRole.getRoleName());
        String token = jwtUtil.generateToken(
                savedAccount.getEmailOrPhone(),
                roleNames,
                savedAccount.getAuthorizationVersion()
        );

        return new AuthResponse(
                token,
                "Bearer",
                savedAccount.getAccountId(),
                savedAccount.getEmailOrPhone(),
                request.getFullName(),
                roleNames
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate via AuthenticationManager (verifies credentials through CustomUserDetailsService & PasswordEncoder)
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmailOrPhone(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Email/số điện thoại hoặc mật khẩu không chính xác");
        }

        // 2. Retrieve authenticated principal and account details
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        Account account = accountRepository.findByEmailOrPhone(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Email/số điện thoại hoặc mật khẩu không chính xác"));

        // 3. Verify active status
        if (!"Active".equalsIgnoreCase(account.getStatus())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hóa");
        }

        // 4. Extract roles and profile
        List<String> roleNames = account.getRoles().stream()
                .map(Role::getRoleName)
                .toList();

        String fullName = account.getUserProfile() != null ? account.getUserProfile().getFullName() : null;

        // 5. Generate JWT token
        String token = jwtUtil.generateToken(
                account.getEmailOrPhone(),
                roleNames,
                account.getAuthorizationVersion()
        );

        return new AuthResponse(
                token,
                "Bearer",
                account.getAccountId(),
                account.getEmailOrPhone(),
                fullName,
                roleNames
        );
    }

    @Override
    @Transactional
    public void logout(String emailOrPhone) {
        if (emailOrPhone == null || emailOrPhone.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        Account account = accountRepository.findByEmailOrPhone(emailOrPhone)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Không tìm thấy tài khoản"));
        account.incrementAuthorizationVersion();
        accountRepository.save(account);
    }

    @Override
    @Transactional
    public void changePassword(String emailOrPhone, ChangePasswordRequest request) {
        if (emailOrPhone == null || emailOrPhone.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        Account account = accountRepository.findByEmailOrPhone(emailOrPhone)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(request.getOldPassword(), account.getPasswordHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu hiện tại không chính xác");
        }

        if (passwordEncoder.matches(request.getNewPassword(), account.getPasswordHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.incrementAuthorizationVersion();
        accountRepository.save(account);
    }

    @Override
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        String email = request.getEmail().trim().toLowerCase();

        // Anti-enumeration defense: Return cleanly if email not found without disclosing non-existence
        var accountOpt = accountRepository.findByEmailOrPhone(email);
        if (accountOpt.isEmpty()) {
            log.info("Yêu cầu quên mật khẩu cho email không tồn tại: {}", email);
            return new ForgotPasswordResponse("Mã xác nhận đã được gửi nếu email tồn tại trong hệ thống.", null, false);
        }

        int num = 100000 + SECURE_RANDOM.nextInt(900000);
        String code = String.valueOf(num);
        resetCodeStore.put(email, new ResetCodeEntry(code, RESET_CODE_TTL_MS));
        log.info("Đã tạo mã xác thực quên mật khẩu cho email: {} [TTL 15 phút]", email);

        boolean emailSent = false;
        if (emailService != null) {
            emailSent = emailService.sendPasswordResetCode(email, code);
        }

        // When external email dispatch succeeds, devCode is omitted (null) for security.
        // If email could not be sent (or in local dev without keys), devCode is provided for seamless testing.
        String devCode = emailSent ? null : code;
        String message = emailSent
                ? "Mã xác thực 6 chữ số đã được gửi tới email của bạn."
                : "Mã xác nhận 6 chữ số đã được tạo thành công.";

        return new ForgotPasswordResponse(message, devCode, emailSent);
    }

    @Override
    public void verifyResetCode(VerifyResetCodeRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu yêu cầu không hợp lệ");
        }
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String code = request.getResetCode() != null ? request.getResetCode().trim() : "";

        if (email.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        if (code.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã xác thực không được để trống");
        }

        ResetCodeEntry entry = resetCodeStore.get(email);
        if (entry == null || entry.isExpired() || !entry.code.equals(code)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu yêu cầu không hợp lệ");
        }
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String code = request.getResetCode() != null ? request.getResetCode().trim() : "";
        String newPassword = request.getNewPassword() != null ? request.getNewPassword() : "";

        if (email.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        if (code.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã xác thực không được để trống");
        }
        if (newPassword.length() < 6 || newPassword.length() > 100) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mật khẩu mới phải từ 6 đến 100 ký tự");
        }

        ResetCodeEntry entry = resetCodeStore.get(email);
        if (entry == null || entry.isExpired() || !entry.code.equals(code)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }

        Account account = accountRepository.findByEmailOrPhone(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với email này"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.incrementAuthorizationVersion();
        accountRepository.save(account);

        // Invalidate used code
        resetCodeStore.remove(email);
        log.info("Đặt lại mật khẩu thành công cho email: {}", email);
    }

    public void setResetCodeForTesting(String email, String code) {
        resetCodeStore.put(email.trim().toLowerCase(), new ResetCodeEntry(code, RESET_CODE_TTL_MS));
    }

    public String getResetCodeForTesting(String email) {
        ResetCodeEntry entry = resetCodeStore.get(email.trim().toLowerCase());
        return (entry != null && !entry.isExpired()) ? entry.code : null;
    }
}
