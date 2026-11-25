package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ChangePasswordRequest;
import com.elearning.dto.request.ForgotPasswordRequest;
import com.elearning.dto.request.ResetPasswordRequest;
import com.elearning.dto.request.LoginRequest;
import com.elearning.dto.request.RegisterRequest;
import com.elearning.dto.request.RegisterSendOtpRequest;
import com.elearning.dto.request.RegisterVerifyOtpRequest;
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
import com.elearning.service.EmailDomainValidator;
import com.elearning.service.EmailService;
import com.elearning.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTests {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private Role learnerRole;

    @BeforeEach
    void setUp() {
        learnerRole = new Role(1, "Learner");
    }

    @Nested
    @DisplayName("Registration Tests")
    class RegisterTests {

        @Test
        @DisplayName("GIVEN valid RegisterRequest WHEN register THEN creates Account with Learner role, hashed password, UserProfile, and returns AuthResponse")
        void testRegisterSuccess() {
            RegisterRequest request = new RegisterRequest("newlearner@elearning.com", "rawPass123", "Tran Van A");

            when(accountRepository.existsByEmailOrPhone("newlearner@elearning.com")).thenReturn(false);
            when(roleRepository.findByRoleName("Learner")).thenReturn(Optional.of(learnerRole));
            when(passwordEncoder.encode("rawPass123")).thenReturn("$2a$10$hashedPasswordValue");
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> {
                Account acc = invocation.getArgument(0);
                // simulate JPA identity generation
                try {
                    var field = Account.class.getDeclaredField("accountId");
                    field.setAccessible(true);
                    field.set(acc, 100L);
                } catch (Exception ignored) {}
                return acc;
            });
            when(jwtUtil.generateToken("newlearner@elearning.com", List.of("Learner"), 1L)).thenReturn("mock.jwt.token");

            AuthResponse response = authService.register(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("mock.jwt.token");
            assertThat(response.getType()).isEqualTo("Bearer");
            assertThat(response.getEmailOrPhone()).isEqualTo("newlearner@elearning.com");
            assertThat(response.getFullName()).isEqualTo("Tran Van A");
            assertThat(response.getRoles()).containsExactly("Learner");

            // Verify account details persisted
            ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(captor.capture());
            Account saved = captor.getValue();
            assertThat(saved.getEmailOrPhone()).isEqualTo("newlearner@elearning.com");
            assertThat(saved.getPasswordHash()).isEqualTo("$2a$10$hashedPasswordValue");
            assertThat(saved.getStatus()).isEqualTo("Active");
            assertThat(saved.getRoles()).containsExactly(learnerRole);
            assertThat(saved.getUserProfile()).isNotNull();
            assertThat(saved.getUserProfile().getFullName()).isEqualTo("Tran Van A");
        }

        @Test
        @DisplayName("GIVEN existing emailOrPhone WHEN register THEN throws BusinessException CONFLICT without saving")
        void testRegisterDuplicateIdentifier() {
            RegisterRequest request = new RegisterRequest("existing@elearning.com", "pass123", "User Name");
            when(accountRepository.existsByEmailOrPhone("existing@elearning.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.CONFLICT));

            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN missing Learner role in repository WHEN register THEN throws BusinessException INTERNAL_ERROR")
        void testRegisterLearnerRoleMissing() {
            RegisterRequest request = new RegisterRequest("learner@elearning.com", "pass123", "User Name");
            when(accountRepository.existsByEmailOrPhone("learner@elearning.com")).thenReturn(false);
            when(roleRepository.findByRoleName("Learner")).thenReturn(Optional.empty());
            when(roleRepository.findById(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.INTERNAL_ERROR));

            verify(accountRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("GIVEN valid credentials and active account WHEN login THEN returns AuthResponse with JWT")
        void testLoginSuccess() {
            LoginRequest request = new LoginRequest("user@elearning.com", "correctPass");

            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setPasswordHash("hashedPass");
            account.setStatus("Active");
            account.addRole(learnerRole);
            UserProfile profile = new UserProfile();
            profile.setFullName("Nguyen Van B");
            account.setUserProfile(profile);

            CustomUserDetails userDetails = CustomUserDetails.fromAccount(account);
            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(jwtUtil.generateToken("user@elearning.com", List.of("Learner"), 1L)).thenReturn("login.jwt.token");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("login.jwt.token");
            assertThat(response.getEmailOrPhone()).isEqualTo("user@elearning.com");
            assertThat(response.getFullName()).isEqualTo("Nguyen Van B");
            assertThat(response.getRoles()).containsExactly("Learner");
        }

        @Test
        @DisplayName("GIVEN invalid credentials WHEN login THEN throws BusinessException UNAUTHORIZED without leaking user existence")
        void testLoginInvalidCredentials() {
            LoginRequest request = new LoginRequest("user@elearning.com", "wrongPass");
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
        }

        @Test
        @DisplayName("GIVEN inactive or banned account WHEN login THEN throws BusinessException UNAUTHORIZED")
        void testLoginInactiveAccount() {
            LoginRequest request = new LoginRequest("banned@elearning.com", "pass");

            Account account = new Account();
            account.setEmailOrPhone("banned@elearning.com");
            account.setStatus("Banned");
            CustomUserDetails userDetails = CustomUserDetails.fromAccount(account);
            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(accountRepository.findByEmailOrPhone("banned@elearning.com")).thenReturn(Optional.of(account));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
        }
    }

    @Nested
    @DisplayName("Logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("GIVEN active account WHEN logout THEN increments authorizationVersion and saves")
        void testLogoutSuccess() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setAuthorizationVersion(1L);

            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));

            authService.logout("user@elearning.com");

            assertThat(account.getAuthorizationVersion()).isEqualTo(2L);
            verify(accountRepository).save(account);
        }

        @Test
        @DisplayName("GIVEN nonexistent account WHEN logout THEN throws UNAUTHORIZED")
        void testLogoutNonexistentAccount() {
            when(accountRepository.findByEmailOrPhone("ghost@elearning.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.logout("ghost@elearning.com"))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
        }
    }

    @Nested
    @DisplayName("Change Password Tests")
    class ChangePasswordTests {

        @Test
        @DisplayName("GIVEN valid current password and new password WHEN changePassword THEN encodes new password and increments auth version")
        void testChangePasswordSuccess() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setPasswordHash("hashedOldPassword");
            account.setAuthorizationVersion(1L);

            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("OldPassword@123", "hashedOldPassword")).thenReturn(true);
            when(passwordEncoder.matches("NewPassword@123", "hashedOldPassword")).thenReturn(false);
            when(passwordEncoder.encode("NewPassword@123")).thenReturn("hashedNewPassword");

            ChangePasswordRequest request = new ChangePasswordRequest("OldPassword@123", "NewPassword@123");
            authService.changePassword("user@elearning.com", request);

            assertThat(account.getPasswordHash()).isEqualTo("hashedNewPassword");
            assertThat(account.getAuthorizationVersion()).isEqualTo(2L);
            verify(accountRepository).save(account);
        }

        @Test
        @DisplayName("GIVEN incorrect current password WHEN changePassword THEN throws BAD_REQUEST")
        void testChangePasswordIncorrectCurrentPassword() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setPasswordHash("hashedOldPassword");

            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("WrongPassword", "hashedOldPassword")).thenReturn(false);

            ChangePasswordRequest request = new ChangePasswordRequest("WrongPassword", "NewPassword@123");

            assertThatThrownBy(() -> authService.changePassword("user@elearning.com", request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));

            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN new password same as current password WHEN changePassword THEN throws BAD_REQUEST")
        void testChangePasswordSameAsOldPassword() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setPasswordHash("hashedOldPassword");

            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("SamePassword@123", "hashedOldPassword")).thenReturn(true);

            ChangePasswordRequest request = new ChangePasswordRequest("SamePassword@123", "SamePassword@123");

            assertThatThrownBy(() -> authService.changePassword("user@elearning.com", request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));

            verify(accountRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("ForgotPassword Tests (Real Email + Brevo OTP)")
    class ForgotPasswordTests {

        @Test
        @DisplayName("GIVEN existing account and email delivery succeeds WHEN forgotPassword THEN hashes 6-digit OTP, saves token, and omits devCode")
        void testForgotPassword_success() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.empty());
            when(emailService.sendPasswordResetCode(anyString(), anyString())).thenReturn(true);

            ForgotPasswordRequest request = new ForgotPasswordRequest("user@elearning.com");
            ForgotPasswordResponse response = authService.forgotPassword(request);

            assertThat(response.getDevCode()).isNull();
            assertThat(response.isEmailSent()).isTrue();

            ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
            verify(emailService).sendPasswordResetCode(org.mockito.ArgumentMatchers.eq("user@elearning.com"), codeCaptor.capture());
            assertThat(codeCaptor.getValue()).matches("\\d{6}");

            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());
            PasswordResetToken savedToken = tokenCaptor.getValue();
            assertThat(savedToken.getEmail()).isEqualTo("user@elearning.com");
            assertThat(savedToken.getPurpose()).isEqualTo(PasswordResetToken.PURPOSE_PASSWORD_RESET);
            assertThat(savedToken.getCodeHash()).doesNotContain(codeCaptor.getValue());
            assertThat(savedToken.getFailedAttempts()).isZero();
        }

        @Test
        @DisplayName("GIVEN non-existent account WHEN forgotPassword THEN returns identical anti-enumeration response without sending email")
        void testForgotPassword_nonExistentEmail_silentSuccess() {
            when(accountRepository.findByEmailOrPhone("unknown@elearning.com")).thenReturn(Optional.empty());

            ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@elearning.com");
            ForgotPasswordResponse response = authService.forgotPassword(request);

            assertThat(response.getDevCode()).isNull();
            assertThat(response.isEmailSent()).isTrue();
            verify(emailService, never()).sendPasswordResetCode(anyString(), anyString());
            verify(passwordResetTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN email dispatch fails in production mode WHEN forgotPassword THEN throws INTERNAL_ERROR without saving token or leaking devCode")
        void testForgotPassword_emailDispatchFails_throwsError() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.empty());
            when(emailService.sendPasswordResetCode(anyString(), anyString())).thenReturn(false);

            ForgotPasswordRequest request = new ForgotPasswordRequest("user@elearning.com");

            assertThatThrownBy(() -> authService.forgotPassword(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.INTERNAL_ERROR));

            verify(passwordResetTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN repeated request within 60s cooldown WHEN forgotPassword THEN throws TOO_MANY_REQUESTS")
        void testForgotPassword_cooldownEnforced() {
            PasswordResetToken existing = new PasswordResetToken();
            existing.setEmail("user@elearning.com");
            existing.setPurpose(PasswordResetToken.PURPOSE_PASSWORD_RESET);
            existing.setLastSentAt(java.time.LocalDateTime.now().minusSeconds(10));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.of(existing));

            ForgotPasswordRequest request = new ForgotPasswordRequest("user@elearning.com");

            assertThatThrownBy(() -> authService.forgotPassword(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.TOO_MANY_REQUESTS));

            verify(emailService, never()).sendPasswordResetCode(anyString(), anyString());
        }

        @Test
        @DisplayName("GIVEN blank email WHEN forgotPassword THEN throws VALIDATION_ERROR")
        void testForgotPassword_blankEmail_throwsValidationError() {
            ForgotPasswordRequest request = new ForgotPasswordRequest("");

            assertThatThrownBy(() -> authService.forgotPassword(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR));
        }
    }

    @Nested
    @DisplayName("Registration Email OTP Verification Tests")
    class RegistrationOtpTests {

        @Test
        @DisplayName("GIVEN valid real email WHEN sendRegistrationOtp THEN dispatches OTP via EmailService and saves REGISTRATION token")
        void testSendRegistrationOtp_success() {
            when(accountRepository.existsByEmailOrPhone("realuser@gmail.com")).thenReturn(false);
            when(passwordResetTokenRepository.findByEmailAndPurpose("realuser@gmail.com", PasswordResetToken.PURPOSE_REGISTRATION))
                    .thenReturn(Optional.empty());
            when(emailService.sendRegistrationVerificationCode(anyString(), anyString(), anyString())).thenReturn(true);

            RegisterSendOtpRequest request = new RegisterSendOtpRequest("realuser@gmail.com", "Secret@123", "Nguyen Van A");
            RegistrationOtpResponse response = authService.sendRegistrationOtp(request);

            assertThat(response.isEmailSent()).isTrue();
            verify(emailService).sendRegistrationVerificationCode(
                    org.mockito.ArgumentMatchers.eq("realuser@gmail.com"),
                    anyString(),
                    org.mockito.ArgumentMatchers.eq("Nguyen Van A")
            );
            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        }

        @Test
        @DisplayName("GIVEN fake or non-MX email domain WHEN sendRegistrationOtp THEN throws VALIDATION_ERROR without sending email")
        void testSendRegistrationOtp_invalidMxDomain_rejected() {
            EmailDomainValidator strictValidator = new EmailDomainValidator() {
                @Override
                protected boolean lookupMxRecord(String asciiDomain) {
                    return false;
                }
            };
            org.springframework.test.util.ReflectionTestUtils.setField(strictValidator, "verifyMxRecord", true);
            org.springframework.test.util.ReflectionTestUtils.setField(authService, "emailDomainValidator", strictValidator);

            RegisterSendOtpRequest request = new RegisterSendOtpRequest("user@gmial-fake-domain.invalid", "Secret@123", "Nguyen Van A");

            assertThatThrownBy(() -> authService.sendRegistrationOtp(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR));

            verify(emailService, never()).sendRegistrationVerificationCode(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("GIVEN valid OTP WHEN verifyRegistrationOtpAndRegister THEN creates account and deletes OTP token")
        void testVerifyRegistrationOtpAndRegister_success() {
            String email = "realuser@gmail.com";
            PasswordResetToken token = new PasswordResetToken();
            token.setEmail(email);
            token.setPurpose(PasswordResetToken.PURPOSE_REGISTRATION);
            token.setCodeHash(AuthServiceImpl.hashOtp(AuthServiceImpl.scopedEmailKey(email, PasswordResetToken.PURPOSE_REGISTRATION), "482915"));
            token.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
            token.setLastSentAt(java.time.LocalDateTime.now().minusMinutes(2));

            when(accountRepository.existsByEmailOrPhone(email)).thenReturn(false);
            when(passwordResetTokenRepository.findByEmailAndPurpose(email, PasswordResetToken.PURPOSE_REGISTRATION))
                    .thenReturn(Optional.of(token));
            when(roleRepository.findByRoleName("Learner")).thenReturn(Optional.of(learnerRole));
            when(passwordEncoder.encode("Secret@123")).thenReturn("$2a$10$hashed");
            when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtUtil.generateToken(email, List.of("Learner"), 1L)).thenReturn("jwt.token.val");

            RegisterVerifyOtpRequest request = new RegisterVerifyOtpRequest(email, "Secret@123", "Nguyen Van A", "482915");
            AuthResponse response = authService.verifyRegistrationOtpAndRegister(request);

            assertThat(response.getToken()).isEqualTo("jwt.token.val");
            assertThat(response.getEmailOrPhone()).isEqualTo(email);
            verify(passwordResetTokenRepository).deleteByEmailAndPurpose(email, PasswordResetToken.PURPOSE_REGISTRATION);
        }
    }

    @Nested
    @DisplayName("ResetPassword & VerifyResetCode Tests")
    class ResetPasswordTests {

        private PasswordResetToken createToken(String email, String code, int failedAttempts, java.time.LocalDateTime expiresAt) {
            PasswordResetToken token = new PasswordResetToken();
            token.setEmail(email);
            token.setPurpose(PasswordResetToken.PURPOSE_PASSWORD_RESET);
            token.setCodeHash(AuthServiceImpl.hashOtp(AuthServiceImpl.scopedEmailKey(email, PasswordResetToken.PURPOSE_PASSWORD_RESET), code));
            token.setExpiresAt(expiresAt);
            token.setLastSentAt(java.time.LocalDateTime.now().minusMinutes(2));
            token.setFailedAttempts(failedAttempts);
            return token;
        }

        @Test
        @DisplayName("GIVEN valid verification code WHEN resetPassword THEN updates password hash, revokes sessions, and deletes token")
        void testResetPassword_success() {
            Account account = new Account();
            account.setEmailOrPhone("user@elearning.com");
            account.setPasswordHash("oldHashed");
            account.setAuthorizationVersion(1L);

            PasswordResetToken token = createToken("user@elearning.com", "654321", 0, java.time.LocalDateTime.now().plusMinutes(10));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.of(token));
            when(accountRepository.findByEmailOrPhone("user@elearning.com")).thenReturn(Optional.of(account));
            when(passwordEncoder.encode("NewSecret@123")).thenReturn("newHashed@123");

            ResetPasswordRequest request = new ResetPasswordRequest("user@elearning.com", "654321", "NewSecret@123");
            authService.resetPassword(request);

            assertThat(account.getPasswordHash()).isEqualTo("newHashed@123");
            assertThat(account.getAuthorizationVersion()).isEqualTo(2L);
            verify(accountRepository).save(account);
            verify(passwordResetTokenRepository).deleteByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET);
        }

        @Test
        @DisplayName("GIVEN legacy backdoor code 123456 when real OTP is 654321 WHEN verifyResetCode THEN throws BAD_REQUEST and increments attempts")
        void testVerifyResetCode_rejectsHardcoded123456() {
            PasswordResetToken token = createToken("user@elearning.com", "654321", 0, java.time.LocalDateTime.now().plusMinutes(10));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.of(token));

            VerifyResetCodeRequest request = new VerifyResetCodeRequest("user@elearning.com", "123456");

            assertThatThrownBy(() -> authService.verifyResetCode(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));

            assertThat(token.getFailedAttempts()).isEqualTo(1);
            verify(passwordResetTokenRepository).save(token);
        }

        @Test
        @DisplayName("GIVEN 5th wrong OTP attempt WHEN verifyResetCode THEN deletes token and throws TOO_MANY_REQUESTS")
        void testVerifyResetCode_locksOutAfterFiveFailures() {
            PasswordResetToken token = createToken("user@elearning.com", "654321", 4, java.time.LocalDateTime.now().plusMinutes(10));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.of(token));

            VerifyResetCodeRequest request = new VerifyResetCodeRequest("user@elearning.com", "999999");

            assertThatThrownBy(() -> authService.verifyResetCode(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.TOO_MANY_REQUESTS));

            verify(passwordResetTokenRepository).deleteByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET);
        }

        @Test
        @DisplayName("GIVEN incorrect verification code WHEN resetPassword THEN throws BAD_REQUEST without updating account")
        void testResetPassword_invalidCode_throwsBadRequest() {
            PasswordResetToken token = createToken("user@elearning.com", "654321", 0, java.time.LocalDateTime.now().plusMinutes(10));
            when(passwordResetTokenRepository.findByEmailAndPurpose("user@elearning.com", PasswordResetToken.PURPOSE_PASSWORD_RESET))
                    .thenReturn(Optional.of(token));

            ResetPasswordRequest request = new ResetPasswordRequest("user@elearning.com", "999999", "NewSecret@123");

            assertThatThrownBy(() -> authService.resetPassword(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST));

            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN invalid new password length WHEN resetPassword THEN throws VALIDATION_ERROR")
        void testResetPassword_shortPassword_throwsValidationError() {
            ResetPasswordRequest request = new ResetPasswordRequest("user@elearning.com", "654321", "123");

            assertThatThrownBy(() -> authService.resetPassword(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_ERROR));
        }
    }
}
