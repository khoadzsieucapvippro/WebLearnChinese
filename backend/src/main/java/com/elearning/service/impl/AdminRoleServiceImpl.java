package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.UpdateAccountRolesRequest;
import com.elearning.dto.response.AccountResponse;
import com.elearning.dto.response.RoleResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.service.AdminRoleService;
import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.service.ManagementAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementation of {@link AdminRoleService} managing system roles and account role assignments (Task 8D.2).
 */
@Service
public class AdminRoleServiceImpl implements AdminRoleService {

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final ManagementAuditService managementAuditService;

    @Autowired
    public AdminRoleServiceImpl(RoleRepository roleRepository,
                                AccountRepository accountRepository,
                                ManagementAuditService managementAuditService) {
        this.roleRepository = roleRepository;
        this.accountRepository = accountRepository;
        this.managementAuditService = managementAuditService;
    }

    public AdminRoleServiceImpl(RoleRepository roleRepository, AccountRepository accountRepository) {
        this(roleRepository, accountRepository, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles() {
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getRoleId))
                .map(RoleResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public AccountResponse updateAccountRoles(Long accountId, UpdateAccountRolesRequest request, String currentAdminEmail) {
        if (request == null || request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Danh sách vai trò không được để trống");
        }

        // 1. Fetch system roles and build lookup map
        List<Role> allSystemRoles = roleRepository.findAll();
        Map<String, Role> roleByNameMap = allSystemRoles.stream()
                .collect(Collectors.toMap(
                        r -> r.getRoleName().toLowerCase(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));

        // 2. Resolve and deduplicate requested roles
        Set<Role> resolvedRoles = new HashSet<>();
        for (String rawRole : request.getRoles()) {
            if (rawRole == null || rawRole.isBlank()) {
                continue;
            }
            String cleanRole = rawRole.trim();
            if (cleanRole.toUpperCase().startsWith("ROLE_")) {
                cleanRole = cleanRole.substring(5);
            }

            Role matchedRole = roleByNameMap.get(cleanRole.toLowerCase());
            if (matchedRole == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Vai trò không hợp lệ: " + rawRole);
            }
            resolvedRoles.add(matchedRole);
        }

        if (resolvedRoles.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Danh sách vai trò không được để trống");
        }

        // 3. Concurrency-safe lookup with row-level lock on target account
        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + accountId));

        // 4. Self-demotion protection (POL-8D-02)
        boolean isModifyingSelf = currentAdminEmail != null && currentAdminEmail.equalsIgnoreCase(account.getEmailOrPhone());
        boolean hasAdminRole = resolvedRoles.stream().anyMatch(r -> "Admin".equalsIgnoreCase(r.getRoleName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getRoleName()));
        if (isModifyingSelf && !hasAdminRole) {
            throw new BusinessException(
                    ErrorCode.BAD_REQUEST,
                    "Không thể tự tước quyền Quản trị viên (Admin) của chính mình"
            );
        }

        // 5. Last Active Admin Invariant: prevent demoting the last active administrator
        boolean currentIsActiveAdmin = "Active".equalsIgnoreCase(account.getStatus()) &&
                account.getRoles().stream().anyMatch(r -> "Admin".equalsIgnoreCase(r.getRoleName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getRoleName()));
        if (currentIsActiveAdmin && !hasAdminRole) {
            // Demoting an active admin: acquire pessimistic write lock on Admin role row to ensure concurrency safety
            roleRepository.findByRoleNameForUpdate("Admin");
            long activeAdmins = accountRepository.countActiveAdmins();
            if (activeAdmins <= 1) {
                throw new BusinessException(
                        ErrorCode.BAD_REQUEST,
                        "Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống"
                );
            }
        }

        // 5. Check if effective roles changed
        Set<Integer> currentRoleIds = account.getRoles().stream()
                .map(Role::getRoleId)
                .collect(Collectors.toSet());
        Set<Integer> newRoleIds = resolvedRoles.stream()
                .map(Role::getRoleId)
                .collect(Collectors.toSet());

        List<String> oldRoles = account.getRoles().stream()
                .map(Role::getRoleName)
                .sorted()
                .toList();

        if (!currentRoleIds.equals(newRoleIds)) {
            account.getRoles().clear();
            account.getRoles().addAll(resolvedRoles);
            account.incrementAuthorizationVersion();
            accountRepository.save(account);
        }

        List<String> newRoles = resolvedRoles.stream()
                .map(Role::getRoleName)
                .sorted()
                .toList();

        if (managementAuditService != null) {
            String details = String.format("Cập nhật phân quyền tài khoản %s (#%d): từ %s thành %s",
                    account.getEmailOrPhone(), accountId, oldRoles, newRoles);
            managementAuditService.logSuccess(
                    AuditActionType.USER_ROLE_UPDATE,
                    AuditResourceType.USER,
                    String.valueOf(accountId),
                    details,
                    oldRoles,
                    newRoles
            );
        }

        return AccountResponse.fromEntity(account);
    }
}
