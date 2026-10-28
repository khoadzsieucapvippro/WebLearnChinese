package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.dto.response.AccountResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.service.impl.AdminAccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Task 8D.1: AdminAccountService Unit Tests")
class AdminAccountServiceTests {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private com.elearning.repository.RoleRepository roleRepository;

    @Mock
    private com.elearning.service.ManagementAuditService managementAuditService;

    @InjectMocks
    private AdminAccountServiceImpl adminAccountService;

    private Account testAccount;

    @BeforeEach
    void setUp() {
        testAccount = new Account();
        testAccount.setAccountId(10L);
        testAccount.setEmailOrPhone("user10@example.com");
        testAccount.setStatus("Active");

        UserProfile profile = new UserProfile();
        profile.setFullName("Nguyễn Văn A");
        testAccount.setUserProfile(profile);

        Role role = new Role(1, "Learner");
        testAccount.addRole(role);
    }

    @Nested
    @DisplayName("getAccounts Tests")
    class GetAccountsTests {

        @Test
        @DisplayName("GIVEN active status and search query WHEN getAccounts THEN returns mapped PageResponse")
        void testGetAccounts_withFilterAndSearch_success() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Account> page = new PageImpl<>(List.of(testAccount), pageable, 1);

            when(accountRepository.findAllWithFilters(eq("Active"), eq("user10"), any(Pageable.class))).thenReturn(page);

            PageResponse<AccountResponse> response = adminAccountService.getAccounts("Active", "user10", pageable);

            assertThat(response).isNotNull();
            assertThat(response.getItems()).hasSize(1);
            assertThat(response.getItems().get(0).getAccountId()).isEqualTo(10L);
            assertThat(response.getItems().get(0).getEmailOrPhone()).isEqualTo("user10@example.com");
            assertThat(response.getItems().get(0).getFullName()).isEqualTo("Nguyễn Văn A");
            assertThat(response.getTotalElements()).isEqualTo(1L);
        }

        @Test
        @DisplayName("GIVEN invalid status parameter WHEN getAccounts THEN throws VALIDATION_ERROR")
        void testGetAccounts_invalidStatus_throwsException() {
            Pageable pageable = PageRequest.of(0, 10);

            assertThatThrownBy(() -> adminAccountService.getAccounts("InvalidStatus", null, pageable))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VALIDATION_ERROR);
        }
    }

    @Nested
    @DisplayName("updateAccountStatus Tests")
    class UpdateAccountStatusTests {

        @Test
        @DisplayName("GIVEN valid status update WHEN target is learner THEN updates status, increments version and audits")
        void testUpdateAccountStatus_success() {
            when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testAccount));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("Inactive");
            AccountResponse response = adminAccountService.updateAccountStatus(10L, request, "admin@example.com");

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo("Inactive");
            assertThat(testAccount.getAuthorizationVersion()).isEqualTo(2L);
            verify(accountRepository).save(testAccount);
        }

        @Test
        @DisplayName("GIVEN admin deactivating self WHEN updateAccountStatus THEN throws BAD_REQUEST (POL-8D-01)")
        void testUpdateAccountStatus_selfDeactivation_throwsBadRequest() {
            when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testAccount));

            UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("Inactive");

            assertThatThrownBy(() -> adminAccountService.updateAccountStatus(10L, request, "user10@example.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST)
                    .hasMessage("Không thể tự vô hiệu hóa hoặc khóa tài khoản đang đăng nhập");
        }

        @Test
        @DisplayName("GIVEN target is last active admin WHEN deactivating THEN throws BAD_REQUEST (Last Admin Invariant)")
        void testUpdateAccountStatus_lastAdminInvariant_throwsBadRequest() {
            Role adminRole = new Role(4, "Admin");
            testAccount.getRoles().clear();
            testAccount.addRole(adminRole);

            when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testAccount));
            when(roleRepository.findByRoleNameForUpdate("Admin")).thenReturn(Optional.of(adminRole));
            when(accountRepository.countActiveAdmins()).thenReturn(1L);

            UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("Banned");

            assertThatThrownBy(() -> adminAccountService.updateAccountStatus(10L, request, "other_admin@example.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST)
                    .hasMessage("Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống");
        }

        @Test
        @DisplayName("GIVEN target is admin but multiple active admins exist WHEN deactivating THEN succeeds")
        void testUpdateAccountStatus_multipleAdmins_deactivationAllowed() {
            Role adminRole = new Role(4, "Admin");
            testAccount.getRoles().clear();
            testAccount.addRole(adminRole);

            when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(testAccount));
            when(roleRepository.findByRoleNameForUpdate("Admin")).thenReturn(Optional.of(adminRole));
            when(accountRepository.countActiveAdmins()).thenReturn(2L);
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("Inactive");
            AccountResponse response = adminAccountService.updateAccountStatus(10L, request, "other_admin@example.com");

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo("Inactive");
            assertThat(testAccount.getAuthorizationVersion()).isEqualTo(2L);
        }
    }
}
