package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ChangePasswordRequest;
import com.elearning.dto.request.ForgotPasswordRequest;
import com.elearning.dto.request.LoginRequest;
import com.elearning.dto.request.RegisterRequest;
import com.elearning.dto.request.RegisterSendOtpRequest;
import com.elearning.dto.request.RegisterVerifyOtpRequest;
import com.elearning.dto.request.ResetPasswordRequest;
import com.elearning.dto.request.VerifyResetCodeRequest;
import com.elearning.dto.response.AuthResponse;
import com.elearning.dto.response.ForgotPasswordResponse;
import com.elearning.dto.response.RegistrationOtpResponse;
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
import com.elearning.service.EmailDomainValidator;
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
 * Implementation of {@link AuthService} handling account registration (including real email OTP verification),
 * login, logout, password change, and self-service password reset (Model A).
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final HexFormat HEX_FORMAT = HexFormat.of();
    private static final long OTP_TTL_MINUTES = 15L;
    private static final int MAX_OTP_ATTEMPTS = 5;
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
    private final ConcurrentMap<String, Long> otpCooldownByKey = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private EmailDomainValidator emailDomainValidator;

    @Value("${app.email.allow-dev-code-fallback:false}")
    private boolean allowDevCodeFallback = false;

    @Value("${app.email.reset-resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds = 60L;

    @Value("${app.auth.require-registration-otp:false}")
    private boolean requireRegistrationOtp = false;

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
    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResponse register(RegisterRequest request) {
        String identifier = request.getEmailOrPhone() != null ? request.getEmailOrPhone().trim() : "";
        String normalizedEmail = identifier.toLowerCase(Locale.ROOT);

        if (requireRegistrationOtp) {
            validateDeliverableEmailOrThrow(normalizedEmail);
            String code = request.getVerificationCode() != null ? request.getVerificationCode().trim() : "";
            if (code.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Vui lòng xác thực mã OTP gửi về email trước khi tạo tài khoản");
            }
            if (accountRepository.existsByEmailOrPhone(normalizedEmail)) {
                throw new BusinessException(ErrorCode.CONFLICT, "Email đã được đăng ký trong hệ thống");
            }
            validateOtpOrThrow(normalizedEmail, PasswordResetToken.PURPOSE_REGISTRATION, code);
            AuthResponse response = createAccountAndIssueToken(normalizedEmail, request.getPassword(), request.getFullName().trim());
            clearOtpState(normalizedEmail, PasswordResetToken.PURPOSE_REGISTRATION);
            return response;
        }

        // Compatibility path for automated API tests that post directly to /auth/register
        if (accountRepository.existsByEmailOrPhone(identifier)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Email hoặc số điện thoại đã được đăng ký trong hệ thống");
        }
        return createAccountAndIssueToken(identifier, request.getPassword(), request.getFullName());
    }

    @Override
    @Transactional
    public RegistrationOtpResponse sendRegistrationOtp(RegisterSendOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không được để trống");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        validateDeliverableEmailOrThrow(email);

        if (accountRepository.existsByEmailOrPhone(email)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Email này đã được đăng ký trong hệ thống");
        }

        LocalDateTime now = LocalDateTime.now();
        enforceCooldown(email, PasswordResetToken.PURPOSE_REGISTRATION, now);

        String code = generateSixDigitCode();
        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        boolean emailSent = emailService != null && emailService.sendRegistrationVerificationCode(email, code, fullName);
        if (!emailSent) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Không thể gửi mã xác thực tới địa chỉ email này. Vui lòng kiểm tra lại email hoặc thử lại sau."
            );
        }

        persistOtpToken(email, PasswordResetToken.PURPOSE_REGISTRATION, code, now);
        recordCooldown(email, PasswordResetToken.PURPOSE_REGISTRATION);
        log.info("Đã gửi OTP xác thực đăng ký tài khoản [TTL {} phút].", OTP_TTL_MINUTES);

        return new RegistrationOtpResponse(
                "Mã xác thực 6 chữ số đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư mục Spam.",
                true
        );
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResponse verifyRegistrationOtpAndRegister(RegisterVerifyOtpRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu yêu cầu không hợp lệ");
        }

        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        String code = request.getVerificationCode() != null ? request.getVerificationCode().trim() : "";
        String fullName = request.getFullName() != null ? request.getFullName().trim() : "";
        String password = request.getPassword() != null ? request.getPassword() : "";

        validateDeliverableEmailOrThrow(email);
        if (code.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã xác thực không được để trống");
        }
        if (accountRepository.existsByEmailOrPhone(email)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Email này đã được đăng ký trong hệ thống");
        }

        validateOtpOrThrow(email, PasswordResetToken.PURPOSE_REGISTRATION, code);

        AuthResponse response = createAccountAndIssueToken(email, password, fullName);
        clearOtpState(email, PasswordResetToken.PURPOSE_REGISTRATION);
        log.info("Hoàn tất xác thực email và đăng ký tài khoản mới.");
        return response;
    }

    private AuthResponse createAccountAndIssueToken(String emailOrPhone, String rawPassword, String fullName) {
        Role learnerRole = roleRepository.findByRoleName("Learner")
                .or(() -> roleRepository.findById(1))
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Không tìm thấy vai trò mặc định Learner trong hệ thống"));

        Account account = new Account();
        account.setEmailOrPhone(emailOrPhone);
        account.setPasswordHash(passwordEncoder.encode(rawPassword));
        account.setStatus("Active");
        account.addRole(learnerRole);

        UserProfile userProfile = new UserProfile();
        userProfile.setFullName(fullName);
        account.setUserProfile(userProfile);

        Account savedAccount = accountRepository.save(account);

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
                fullName,
                roleNames
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmailOrPhone(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Email/số điện thoại hoặc mật khẩu không chính xác");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        Account account = accountRepository.findByEmailOrPhone(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Email/số điện thoại hoặc mật khẩu không chính xác"));

        if (!"Active".equalsIgnoreCase(account.getStatus())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hóa");
        }

        List<String> roleNames = account.getRoles().stream()
                .map(Role::getRoleName)
                .toList();

        String fullName = account.getUserProfile() != null ? account.getUserProfile().getFullName() : null;

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

        enforceCooldown(email, PasswordResetToken.PURPOSE_PASSWORD_RESET, now);

        Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(email);
        if (accountOpt.isEmpty() || "Banned".equalsIgnoreCase(accountOpt.get().getStatus())) {
            log.info("Bỏ qua gửi OTP quên mật khẩu cho tài khoản không tồn tại hoặc bị khóa.");
            recordCooldown(email, PasswordResetToken.PURPOSE_PASSWORD_RESET);
            return new ForgotPasswordResponse(ANTI_ENUMERATION_MESSAGE, null, !allowDevCodeFallback);
        }

        String code = generateSixDigitCode();

        boolean emailSent = emailService != null && emailService.sendPasswordResetCode(email, code);
        if (!emailSent && !allowDevCodeFallback) {
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Không thể gửi email xác thực lúc này. Vui lòng thử lại sau ít phút."
            );
        }

        persistOtpToken(email, PasswordResetToken.PURPOSE_PASSWORD_RESET, code, now);
        recordCooldown(email, PasswordResetToken.PURPOSE_PASSWORD_RESET);
        log.info("Đã cấp mã xác thực quên mật khẩu [TTL {} phút, emailSent={}].", OTP_TTL_MINUTES, emailSent);

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

        validateOtpOrThrow(email, PasswordResetToken.PURPOSE_PASSWORD_RESET, code);
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

        validateOtpOrThrow(email, PasswordResetToken.PURPOSE_PASSWORD_RESET, code);

        Account account = accountRepository.findByEmailOrPhone(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với email này"));

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.incrementAuthorizationVersion();
        accountRepository.save(account);

        clearOtpState(email, PasswordResetToken.PURPOSE_PASSWORD_RESET);
        log.info("Đặt lại mật khẩu thành công cho tài khoản đã xác thực.");
    }

    private void validateDeliverableEmailOrThrow(String email) {
        if (emailDomainValidator != null) {
            if (!emailDomainValidator.isValidEmailSyntax(email)) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không đúng định dạng (ví dụ: tenban@gmail.com)");
            }
            if (!emailDomainValidator.isDeliverableEmailDomain(email)) {
                throw new BusinessException(
                        ErrorCode.VALIDATION_ERROR,
                        "Tên miền email không tồn tại hoặc không hỗ trợ nhận thư. Vui lòng dùng Gmail hoặc email thật."
                );
            }
        } else if (email == null || !email.contains("@")) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email không đúng định dạng");
        }
    }

    private void persistOtpToken(String email, String purpose, String code, LocalDateTime now) {
        if (passwordResetTokenRepository == null) {
            return;
        }
        PasswordResetToken token = passwordResetTokenRepository.findByEmailAndPurpose(email, purpose)
                .orElseGet(PasswordResetToken::new);
        token.setEmail(email);
        token.setPurpose(purpose);
        token.setCodeHash(hashOtp(scopedEmailKey(email, purpose), code));
        token.setExpiresAt(now.plusMinutes(OTP_TTL_MINUTES));
        token.setLastSentAt(now);
        token.setFailedAttempts(0);
        passwordResetTokenRepository.save(token);
    }

    private void enforceCooldown(String email, String purpose, LocalDateTime now) {
        if (otpResendCooldownSeconds <= 0) {
            return;
        }
        long nowMs = System.currentTimeMillis();
        long cooldownMs = otpResendCooldownSeconds * 1000L;
        String key = scopedEmailKey(email, purpose);

        Long lastInMemory = otpCooldownByKey.get(key);
        if (lastInMemory != null && (nowMs - lastInMemory) < cooldownMs) {
            long remaining = Math.max(1L, (cooldownMs - (nowMs - lastInMemory) + 999L) / 1000L);
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Vui lòng đợi " + remaining + " giây trước khi yêu cầu gửi lại mã mới."
            );
        }

        if (passwordResetTokenRepository != null) {
            Optional<PasswordResetToken> existingOpt = passwordResetTokenRepository.findByEmailAndPurpose(email, purpose);
            if (existingOpt.isPresent()) {
                LocalDateTime lastSent = existingOpt.get().getLastSentAt();
                if (lastSent != null && lastSent.plusSeconds(otpResendCooldownSeconds).isAfter(now)) {
                    throw new BusinessException(
                            ErrorCode.TOO_MANY_REQUESTS,
                            "Vui lòng đợi " + otpResendCooldownSeconds + " giây trước khi yêu cầu gửi lại mã mới."
                    );
                }
            }
        }
    }

    private void recordCooldown(String email, String purpose) {
        if (otpCooldownByKey.size() >= MAX_COOLDOWN_ENTRIES) {
            long cutoff = System.currentTimeMillis() - Math.max(otpResendCooldownSeconds, 60L) * 1000L;
            otpCooldownByKey.entrySet().removeIf(entry -> entry.getValue() < cutoff);
        }
        otpCooldownByKey.put(scopedEmailKey(email, purpose), System.currentTimeMillis());
    }

    private void validateOtpOrThrow(String email, String purpose, String code) {
        if (passwordResetTokenRepository == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }

        PasswordResetToken token = passwordResetTokenRepository.findByEmailAndPurpose(email, purpose)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn"));

        LocalDateTime now = LocalDateTime.now();
        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(now)) {
            passwordResetTokenRepository.deleteByEmailAndPurpose(email, purpose);
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        if (token.getFailedAttempts() >= MAX_OTP_ATTEMPTS) {
            passwordResetTokenRepository.deleteByEmailAndPurpose(email, purpose);
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai mã quá " + MAX_OTP_ATTEMPTS + " lần. Vui lòng yêu cầu mã xác thực mới."
            );
        }

        if (!verifyOtpHash(scopedEmailKey(email, purpose), code, token.getCodeHash())) {
            int nextAttempts = token.getFailedAttempts() + 1;
            if (nextAttempts >= MAX_OTP_ATTEMPTS) {
                passwordResetTokenRepository.deleteByEmailAndPurpose(email, purpose);
                throw new BusinessException(
                        ErrorCode.TOO_MANY_REQUESTS,
                        "Bạn đã nhập sai mã quá " + MAX_OTP_ATTEMPTS + " lần. Vui lòng yêu cầu mã xác thực mới."
                );
            }
            token.setFailedAttempts(nextAttempts);
            passwordResetTokenRepository.save(token);
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã xác thực không chính xác hoặc đã hết hạn");
        }
    }

    private void clearOtpState(String email, String purpose) {
        if (passwordResetTokenRepository != null) {
            passwordResetTokenRepository.deleteByEmailAndPurpose(email, purpose);
        }
        otpCooldownByKey.remove(scopedEmailKey(email, purpose));
    }

    private static String generateSixDigitCode() {
        return String.valueOf(100000 + SECURE_RANDOM.nextInt(900000));
    }

    public static String scopedEmailKey(String email, String purpose) {
        return purpose + ":" + email;
    }

    public static String hashOtp(String scopedKey, String code) {
        byte[] saltBytes = new byte[16];
        SECURE_RANDOM.nextBytes(saltBytes);
        String saltHex = HEX_FORMAT.formatHex(saltBytes);
        String digestHex = sha256Hex(saltHex + ":" + scopedKey + ":" + code);
        return saltHex + ":" + digestHex;
    }

    private static boolean verifyOtpHash(String scopedKey, String code, String storedHash) {
        if (storedHash == null) {
            return false;
        }
        int sep = storedHash.indexOf(':');
        if (sep <= 0 || sep >= storedHash.length() - 1) {
            return false;
        }
        String saltHex = storedHash.substring(0, sep);
        String expectedHex = storedHash.substring(sep + 1);
        String actualHex = sha256Hex(saltHex + ":" + scopedKey + ":" + code);
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
