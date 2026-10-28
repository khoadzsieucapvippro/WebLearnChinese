package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.AdminResetPasswordRequest;
import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.dto.response.AccountResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.entity.Account;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.service.AdminAccountService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.dto.response.AdminResetPasswordResponse;
import com.elearning.service.ManagementAuditService;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Set;

/**
 * Implementation of {@link AdminAccountService} for administrative account management (Task 8D.1).
 */
@Service
public class AdminAccountServiceImpl implements AdminAccountService {

    private static final Set<String> VALID_STATUSES = Set.of("Active", "Inactive", "Banned");

    private final AccountRepository accountRepository;
    private final com.elearning.repository.RoleRepository roleRepository;
    private final ManagementAuditService managementAuditService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Autowired
    public AdminAccountServiceImpl(AccountRepository accountRepository,
                                  com.elearning.repository.RoleRepository roleRepository,
                                  ManagementAuditService managementAuditService,
                                  org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.managementAuditService = managementAuditService;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminAccountServiceImpl(AccountRepository accountRepository,
                                  com.elearning.repository.RoleRepository roleRepository,
                                  ManagementAuditService managementAuditService) {
        this(accountRepository, roleRepository, managementAuditService, null);
    }

    public AdminAccountServiceImpl(AccountRepository accountRepository, com.elearning.repository.RoleRepository roleRepository) {
        this(accountRepository, roleRepository, null, null);
    }

    public AdminAccountServiceImpl(AccountRepository accountRepository) {
        this(accountRepository, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AccountResponse> getAccounts(String status, String search, Pageable pageable) {
        String normalizedStatus = null;
        if (status != null && !status.isBlank()) {
            normalizedStatus = normalizeStatus(status);
        }

        String searchPattern = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Account> accountPage = accountRepository.findAllWithFilters(normalizedStatus, searchPattern, pageable);
        return PageResponse.from(accountPage.map(AccountResponse::fromEntity));
    }

    @Override
    @Transactional
    public AccountResponse updateAccountStatus(Long accountId, UpdateAccountStatusRequest request, String currentAdminEmail) {
        if (request == null || request.getStatus() == null || request.getStatus().isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Trạng thái tài khoản không được để trống");
        }

        String normalizedStatus = normalizeStatus(request.getStatus());

        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + accountId));

        // Self-deactivation protection (POL-8D-01)
        if (currentAdminEmail != null && currentAdminEmail.equalsIgnoreCase(account.getEmailOrPhone())
                && !normalizedStatus.equalsIgnoreCase("Active")) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    "Không thể tự vô hiệu hóa hoặc khóa tài khoản đang đăng nhập"
            );
        }

        // Last Active Admin Invariant: prevent deactivating or locking the last active administrator
        boolean isTargetAdmin = account.getRoles().stream()
                .anyMatch(r -> "Admin".equalsIgnoreCase(r.getRoleName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getRoleName()));
        boolean isCurrentlyActive = "Active".equalsIgnoreCase(account.getStatus());
        boolean isDeactivating = !normalizedStatus.equalsIgnoreCase("Active");

        if (isTargetAdmin && isCurrentlyActive && isDeactivating) {
            // Deactivating/locking an active admin: acquire pessimistic write lock on Admin role row to ensure concurrency safety
            if (roleRepository != null) {
                roleRepository.findByRoleNameForUpdate("Admin");
            }
            long activeAdmins = accountRepository.countActiveAdmins();
            if (activeAdmins <= 1) {
                throw new BusinessException(
                        ErrorCode.BAD_REQUEST,
                        "Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống"
                );
            }
        }

        String previousStatus = account.getStatus();
        if (!account.getStatus().equalsIgnoreCase(normalizedStatus)) {
            account.setStatus(normalizedStatus);
            account.incrementAuthorizationVersion();
            account = accountRepository.save(account);
        }

        if (managementAuditService != null) {
            String details = String.format("Cập nhật trạng thái tài khoản %s (#%d): từ %s thành %s",
                    account.getEmailOrPhone(), accountId, previousStatus, normalizedStatus);
            managementAuditService.logSuccess(
                    AuditActionType.ACCOUNT_STATUS_UPDATE,
                    AuditResourceType.USER,
                    String.valueOf(accountId),
                    details,
                    Map.of("status", previousStatus),
                    Map.of("status", normalizedStatus)
            );
        }

        return AccountResponse.fromEntity(account);
    }

    private static final String PWD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String PWD_LOWER = "abcdefghijkmnpqrstuvwxyz";
    private static final String PWD_DIGITS = "23456789";
    private static final String PWD_SPECIAL = "@#$%&*!?";
    private static final String PWD_ALL = PWD_UPPER + PWD_LOWER + PWD_DIGITS + PWD_SPECIAL;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    @Transactional
    public AdminResetPasswordResponse resetPassword(Long accountId, AdminResetPasswordRequest request, String currentAdminEmail) {
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + accountId));

        // Self-Reset Defense: Admin cannot reset own password via admin endpoint
        if (currentAdminEmail != null && currentAdminEmail.equalsIgnoreCase(account.getEmailOrPhone())) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    "Không thể tự đặt lại mật khẩu của chính mình qua tính năng quản trị. Vui lòng đổi mật khẩu tại trang Hồ sơ cá nhân."
            );
        }

        String finalPassword;
        if (request != null && request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            finalPassword = request.getNewPassword().trim();
            if (finalPassword.length() < 6 || finalPassword.length() > 128) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mật khẩu mới phải có độ dài từ 6 đến 128 ký tự");
            }
        } else {
            finalPassword = generateTemporaryPassword();
        }

        if (passwordEncoder != null) {
            account.setPasswordHash(passwordEncoder.encode(finalPassword));
        } else {
            account.setPasswordHash(finalPassword);
        }

        account.incrementAuthorizationVersion();
        account = accountRepository.save(account);

        if (managementAuditService != null) {
            String details = String.format("Đặt lại mật khẩu cho tài khoản %s (#%d)", account.getEmailOrPhone(), accountId);
            managementAuditService.logSuccess(
                    AuditActionType.PASSWORD_RESET,
                    AuditResourceType.USER,
                    String.valueOf(accountId),
                    details,
                    null,
                    Map.of("targetAccountId", accountId, "emailOrPhone", account.getEmailOrPhone())
            );
        }

        return new AdminResetPasswordResponse(account.getAccountId(), account.getEmailOrPhone(), finalPassword);
    }

    @Override
    @Transactional
    public AdminResetPasswordResponse resetPassword(Long accountId, String currentAdminEmail) {
        return resetPassword(accountId, null, currentAdminEmail);
    }

    public static String generateTemporaryPassword() {
        char[] password = new char[12];
        password[0] = PWD_UPPER.charAt(SECURE_RANDOM.nextInt(PWD_UPPER.length()));
        password[1] = PWD_LOWER.charAt(SECURE_RANDOM.nextInt(PWD_LOWER.length()));
        password[2] = PWD_DIGITS.charAt(SECURE_RANDOM.nextInt(PWD_DIGITS.length()));
        password[3] = PWD_SPECIAL.charAt(SECURE_RANDOM.nextInt(PWD_SPECIAL.length()));
        for (int i = 4; i < 12; i++) {
            password[i] = PWD_ALL.charAt(SECURE_RANDOM.nextInt(PWD_ALL.length()));
        }
        for (int i = password.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char temp = password[i];
            password[i] = password[j];
            password[j] = temp;
        }
        return new String(password);
    }

    private String normalizeStatus(String rawStatus) {
        for (String validStatus : VALID_STATUSES) {
            if (validStatus.equalsIgnoreCase(rawStatus.trim())) {
                return validStatus;
            }
        }
        throw new BusinessException(
                ErrorCode.VALIDATION_ERROR,
                "Trạng thái tài khoản phải là Active, Inactive hoặc Banned"
        );
    }
}
