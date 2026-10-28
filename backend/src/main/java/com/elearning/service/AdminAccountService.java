package com.elearning.service;

import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.dto.response.AccountResponse;
import com.elearning.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for administrative account management operations (Module 8D.1).
 */
public interface AdminAccountService {

    /**
     * Retrieves paginated accounts with optional status and search filters.
     *
     * @param status   optional status filter (Active, Inactive, Banned)
     * @param search   optional search query (email/phone or full name)
     * @param pageable pagination parameters
     * @return paginated AccountResponse
     */
    PageResponse<AccountResponse> getAccounts(String status, String search, Pageable pageable);

    /**
     * Updates an account's status with self-deactivation protection.
     *
     * @param accountId         target account ID
     * @param request           status update payload
     * @param currentAdminEmail identifier of currently authenticated admin
     * @return updated AccountResponse
     */
    AccountResponse updateAccountStatus(Long accountId, UpdateAccountStatusRequest request, String currentAdminEmail);

    /**
     * Resets target account password with server-generated secure temporary password.
     * Enforces self-reset defense, token invalidation via authorization_version, and audit logging.
     *
     * @param accountId         target account ID
     * @param currentAdminEmail identifier of currently authenticated admin
     * @return AdminResetPasswordResponse containing target identity and temporary password
     */
    com.elearning.dto.response.AdminResetPasswordResponse resetPassword(Long accountId, com.elearning.dto.request.AdminResetPasswordRequest request, String currentAdminEmail);

    com.elearning.dto.response.AdminResetPasswordResponse resetPassword(Long accountId, String currentAdminEmail);
}
