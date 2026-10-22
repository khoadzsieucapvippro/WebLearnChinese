package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
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
import com.elearning.service.ManagementAuditService;

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

    @org.springframework.beans.factory.annotation.Autowired
    public AdminAccountServiceImpl(AccountRepository accountRepository,
                                  com.elearning.repository.RoleRepository roleRepository,
                                  ManagementAuditService managementAuditService) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.managementAuditService = managementAuditService;
    }

    public AdminAccountServiceImpl(AccountRepository accountRepository, com.elearning.repository.RoleRepository roleRepository) {
        this(accountRepository, roleRepository, null);
    }

    public AdminAccountServiceImpl(AccountRepository accountRepository) {
        this(accountRepository, null, null);
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
