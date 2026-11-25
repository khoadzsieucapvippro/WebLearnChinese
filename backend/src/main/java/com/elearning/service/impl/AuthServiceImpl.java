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
import com.elearning.entity.PasswordResetToken;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.PasswordResetTokenRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.security.CustomUserDetails;
import com.elearning.security.JwtUtil;
import com.elearning.service.AuthService;
import com.elearning.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Implementation of {@link AuthService} handling account registration, login, and self-service password reset (Model A).
 * Orchestrates AccountRepository, RoleRepository, PasswordEncoder, AuthenticationManager, JwtUtil,
 * EmailService, and persistent PasswordResetTokenRepository.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final HexFormat HEX_FORMAT = HexFormat.of();
    private static final long RESET_CODE_TTL_MINUTES = 15L;
    private static final int MAX_RESET_ATTEMPTS = 5;
    private static final int MAX_COOLDOWN_ENTRIES = 10000;
    private static final String ANTI_ENUMERATION_MESSAGE =
            "Nếu email tồn tại trong hệ thống, mã xác thực 6 chữ số đã được gửi đến hộp thư của bạn.";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ConcurrentMap<String, Long> resetCooldownByEmail = new ConcurrentHashMap<>();

    @Value("${app.email.allow-dev-code-fallback:false}")
    private boolean allowDevCodeFallback = false;

    @Value("${app.email.reset-resend-cooldown-seconds:60}")
    private long resetResendCooldownSeconds = 60L;

    public AuthServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil) {
        this(accountRepository, roleRepository, passwordEncoder, authenticationManager, jwtUtil, null, null);
    }

    @Autowired
    public AuthServiceImpl(
            AccountRepository accountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            @Autowired(required = false) EmailService emailService,
            @Autowired(required = false) PasswordResetTokenRepository passwordResetTokenRepository) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
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
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        LocalDateTime now = LocalDateTime.now();

        enforceResendCooldown(email, now);

        // Anti-enumeration defense: return the exact same response shape & wording when account doesn't exist
        Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(email);
        if (accountOpt.isEmpty() || "Banned".equalsIgnoreCase(accountOpt.get().getStatus())) {
            log.info("Bỏ qua gửi OTP quên mật khẩu cho tài khoản không tồn tại hoặc bị khóa.");
            recordCooldown(email);
            return new ForgotPasswordResponse(ANTI_ENUMERATION_MESSAGE, null, !allowDevCodeFallback);
        }

        int num = 100000 + SECURE_RANDOM.nextInt(900000);
        String code = String.valueOf(num);

        boolean emailSent = emailService != null && emailService.sendPasswordResetCode(email, code);
        if (!emailSent && !allowDevCodeFallback) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Không thể gửi email xác thực lúc này. Vui lòng thử lại sau ít phút."
            );
        }

        if (passwordResetTokenRepository != null) {
            PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                    .orElseGet(PasswordResetToken::new);
            token.setEmail(email);
            token.setCodeHash(hashOtp(email, code));
            token.setExpiresAt(now.plusMinutes(RESET_CODE_TTL_MINUTES));
            token.setLastSentAt(now);
            token.setFailedAttempts(0);
            passwordResetTokenRepository.save(token);
        }

        recordCooldown(email);
        log.info("Đã cấp mã xác thực quên mật khẩu [TTL {} phút, emailSent={}].", RESET_CODE_TTL_MINUTES, emailSent);

        String devCode = (emailSent || !allowDevCodeFallback) ? null : code;
        return new ForgotPasswordResponse(ANTI_ENUMERATION_MESSAGE, devCode, emailSent);
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public void verifyResetCode(VerifyResetCodeRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu yêu cầu không hợp lệ");
        }
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        String code = request.getResetCode() != null ? request.getResetCode().trim() : "";

        if (email.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }
        if (code.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã xác thực không được để trống");
        }

        validateResetTokenOrThrow(email, code);
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu yêu cầu không hợp lệ");
        }
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : "";
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

        validateResetTokenOrThrow(email, code);

        Account account = accountRepository.findByEmailOrPhone(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với email này"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.incrementAuthorizationVersion();
        accountRepository.save(account);

        if (passwordResetTokenRepository != null) {
            passwordResetTokenRepository.deleteByEmail(email);
        }
        resetCooldownByEmail.remove(email);
        log.info("Đặt lại mật khẩu thành công cho tài khoản đã xác thực.");
    }

    private void enforceResendCooldown(String email, LocalDateTime now) {
        if (resetResendCooldownSeconds <= 0) {
            return;
        }
        long nowMs = System.currentTimeMillis();
        long cooldownMs = resetResendCooldownSeconds * 1000L;

        Long lastInMemory = resetCooldownByEmail.get(email);
        if (lastInMemory != null && (nowMs - lastInMemory) < cooldownMs) {
            long remaining = Math.max(1L, (cooldownMs - (nowMs - lastInMemory) + 999L) / 1000L);
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Vui lòng đợi " + remaining + " giây trước khi yêu cầu gửi lại mã mới."
            );
        }

        if (passwordResetTokenRepository != null) {
            Optional<PasswordResetToken> existingOpt = passwordResetTokenRepository.findByEmail(email);
            if (existingOpt.isPresent()) {
                PasswordResetToken existing = existingOpt.get();
                LocalDateTime lastSent = existing.getLastSentAt();
                if (lastSent != null && lastSent.plusSeconds(resetResendCooldownSeconds).isAfter(now)) {
                    throw new BusinessException(
                            ErrorCode.TOO_MANY_REQUESTS,
                            "Vui lòng đợi " + resetResendCooldownSeconds + " giây trước khi yêu cầu gửi lại mã mới."
                    );
                }
            }
        }
    }

    private void recordCooldown(String email) {
        if (resetCooldownByEmail.size() >= MAX_COOLDOWN_ENTRIES) {
            long cutoff = System.currentTimeMillis() - Math.max(resetResendCooldownSeconds, 60L) * 1000L;
            resetCooldownByEmail.entrySet().removeIf(entry -> entry.getValue() < cutoff);
        }
        resetCooldownByEmail.put(email, System.currentTimeMillis());
    }

    private void validateResetTokenOrThrow(String email, String code) {
        if (passwordResetTokenRepository == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn"));

        LocalDateTime now = LocalDateTime.now();
        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(now)) {
            passwordResetTokenRepository.deleteByEmail(email);
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        if (token.getFailedAttempts() >= MAX_RESET_ATTEMPTS) {
            passwordResetTokenRepository.deleteByEmail(email);
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai mã quá " + MAX_RESET_ATTEMPTS + " lần. Vui lòng yêu cầu mã xác thực mới."
            );
        }

        if (!verifyOtpHash(email, code, token.getCodeHash())) {
            int nextAttempts = token.getFailedAttempts() + 1;
            if (nextAttempts >= MAX_RESET_ATTEMPTS) {
                passwordResetTokenRepository.deleteByEmail(email);
                throw new BusinessException(
                        ErrorCode.TOO_MANY_REQUESTS,
                        "Bạn đã nhập sai mã quá " + MAX_RESET_ATTEMPTS + " lần. Vui lòng yêu cầu mã xác thực mới."
                );
            }
            token.setFailedAttempts(nextAttempts);
            passwordResetTokenRepository.save(token);
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }
    }

    public static String hashOtp(String email, String code) {
        byte[] saltBytes = new byte[16];
        SECURE_RANDOM.nextBytes(saltBytes);
        String saltHex = HEX_FORMAT.formatHex(saltBytes);
        String digestHex = sha256Hex(saltHex + ":" + email + ":" + code);
        return saltHex + ":" + digestHex;
    }

    private static boolean verifyOtpHash(String email, String code, String storedHash) {
        if (storedHash == null) {
            return false;
        }
        int sep = storedHash.indexOf(':');
        if (sep <= 0 || sep >= storedHash.length() - 1) {
            return false;
        }
        String saltHex = storedHash.substring(0, sep);
        String expectedHex = storedHash.substring(sep + 1);
        String actualHex = sha256Hex(saltHex + ":" + email + ":" + code);
        return MessageDigest.isEqual(
                expectedHex.getBytes(StandardCharsets.UTF_8),
                actualHex.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HEX_FORMAT.formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}
