package com.elearning.config;

import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BootstrapAdminRunner Unit Tests")
class BootstrapAdminRunnerTests {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserSrsSettingRepository userSrsSettingRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private BootstrapAdminRunner bootstrapAdminRunner;

    private Role adminRole;
    private Role learnerRole;

    @BeforeEach
    void setUp() {
        adminRole = new Role(4, "Admin");
        learnerRole = new Role(1, "Learner");
    }

    private void mockStandardRoles() {
        when(roleRepository.findById(4)).thenReturn(Optional.of(adminRole));
        when(roleRepository.findById(1)).thenReturn(Optional.of(learnerRole));
    }

    @Nested
    @DisplayName("Active Administrator Already Exists Tests")
    class ActiveAdminExistsTests {

        @Test
        @DisplayName("GIVEN at least one active admin exists WHEN runner executes THEN completely skips bootstrap creation")
        void testRun_activeAdminExists_doesNothing() {
            when(accountRepository.countActiveAdmins()).thenReturn(1L);

            bootstrapAdminRunner.run(null);

            verify(accountRepository).countActiveAdmins();
            verifyNoMoreInteractions(accountRepository);
            verifyNoInteractions(roleRepository);
            verifyNoInteractions(userProfileRepository);
            verifyNoInteractions(userSrsSettingRepository);
            verifyNoInteractions(passwordEncoder);
        }

        @Test
        @DisplayName("GIVEN multiple active admins exist WHEN runner executes THEN skips bootstrap creation")
        void testRun_multipleActiveAdmins_doesNothing() {
            when(accountRepository.countActiveAdmins()).thenReturn(3L);

            bootstrapAdminRunner.run(null);

            verify(accountRepository).countActiveAdmins();
            verifyNoInteractions(roleRepository);
            verifyNoInteractions(passwordEncoder);
        }
    }

    @Nested
    @DisplayName("Zero Active Administrator Bootstrap Tests")
    class ZeroActiveAdminBootstrapTests {

        @Test
        @DisplayName("GIVEN 0 active admins and configured password WHEN runner executes THEN bootstraps admin with configured password")
        void testRun_configuredPassword_bootstrapsAdmin() {
            when(accountRepository.countActiveAdmins()).thenReturn(0L);
            mockStandardRoles();
            when(passwordEncoder.encode("CustomSecretPass123")).thenReturn("$2a$10$hashedCustomPassword");
            when(accountRepository.findByEmailOrPhone("admin@elearning.local")).thenReturn(Optional.empty());
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userProfileRepository.findByAccount(any(Account.class))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(any(UserProfile.class))).thenReturn(false);
            when(userSrsSettingRepository.save(any(UserSrsSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

            bootstrapAdminRunner.setBootstrapEmail("admin@elearning.local");
            bootstrapAdminRunner.setBootstrapPassword("CustomSecretPass123");

            bootstrapAdminRunner.run(null);

            ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(accountCaptor.capture());
            Account saved = accountCaptor.getValue();

            assertThat(saved.getEmailOrPhone()).isEqualTo("admin@elearning.local");
            assertThat(saved.getPasswordHash()).isEqualTo("$2a$10$hashedCustomPassword");
            assertThat(saved.getStatus()).isEqualTo("Active");
            assertThat(saved.getAuthorizationVersion()).isEqualTo(1L);

            Set<String> roleNames = saved.getRoles().stream().map(Role::getRoleName).collect(Collectors.toSet());
            assertThat(roleNames).containsExactlyInAnyOrder("Admin", "Learner");

            ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
            verify(userProfileRepository).save(profileCaptor.capture());
            UserProfile savedProfile = profileCaptor.getValue();
            assertThat(savedProfile.getFullName()).isEqualTo("Quản Trị Viên Khởi Tạo");
            assertThat(savedProfile.getAccount()).isEqualTo(saved);

            ArgumentCaptor<UserSrsSetting> srsCaptor = ArgumentCaptor.forClass(UserSrsSetting.class);
            verify(userSrsSettingRepository).save(srsCaptor.capture());
            UserSrsSetting srs = srsCaptor.getValue();
            assertThat(srs.getNewCardsPerDay()).isEqualTo(20);
            assertThat(srs.getMaxReviewPerDay()).isEqualTo(100);
            assertThat(srs.getUser()).isEqualTo(savedProfile);
        }

        @Test
        @DisplayName("GIVEN 0 active admins and blank password WHEN runner executes THEN generates secure random password starting with Admin!")
        void testRun_blankPassword_generatesSecurePassword() {
            when(accountRepository.countActiveAdmins()).thenReturn(0L);
            mockStandardRoles();
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedRandomPassword");
            when(accountRepository.findByEmailOrPhone("admin@custom.com")).thenReturn(Optional.empty());
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userProfileRepository.findByAccount(any(Account.class))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(any(UserProfile.class))).thenReturn(false);
            when(userSrsSettingRepository.save(any(UserSrsSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

            bootstrapAdminRunner.setBootstrapEmail("admin@custom.com");
            bootstrapAdminRunner.setBootstrapPassword(""); // empty password triggers auto-generation

            bootstrapAdminRunner.run(null);

            ArgumentCaptor<String> rawPasswordCaptor = ArgumentCaptor.forClass(String.class);
            verify(passwordEncoder).encode(rawPasswordCaptor.capture());
            String generatedPassword = rawPasswordCaptor.getValue();

            assertThat(generatedPassword).startsWith("Admin!");
            assertThat(generatedPassword.length()).isGreaterThanOrEqualTo(16);

            ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(accountCaptor.capture());
            Account saved = accountCaptor.getValue();
            assertThat(saved.getEmailOrPhone()).isEqualTo("admin@custom.com");
            assertThat(saved.getStatus()).isEqualTo("Active");
        }

        @Test
        @DisplayName("GIVEN 0 active admins and existing account entity WHEN runner executes THEN updates existing account to active admin")
        void testRun_existingAccount_promotesToActiveAdmin() {
            when(accountRepository.countActiveAdmins()).thenReturn(0L);
            mockStandardRoles();

            Account existingAccount = new Account();
            existingAccount.setEmailOrPhone("admin@elearning.local");
            existingAccount.setPasswordHash("$2a$10$oldExpiredHash");
            existingAccount.setStatus("Inactive");
            existingAccount.setAuthorizationVersion(5L);

            when(accountRepository.findByEmailOrPhone("admin@elearning.local")).thenReturn(Optional.of(existingAccount));
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$newRebootHash");
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UserProfile existingProfile = new UserProfile();
            existingProfile.setFullName("Existing Admin Name");
            existingProfile.setAccount(existingAccount);
            when(userProfileRepository.findByAccount(existingAccount)).thenReturn(Optional.of(existingProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(existingProfile)).thenReturn(true); // already has settings

            bootstrapAdminRunner.setBootstrapEmail("admin@elearning.local");
            bootstrapAdminRunner.setBootstrapPassword("ValidPassword123!");

            bootstrapAdminRunner.run(null);

            assertThat(existingAccount.getStatus()).isEqualTo("Active");
            assertThat(existingAccount.getPasswordHash()).isEqualTo("$2a$10$newRebootHash");
            Set<String> roles = existingAccount.getRoles().stream().map(Role::getRoleName).collect(Collectors.toSet());
            assertThat(roles).containsExactlyInAnyOrder("Admin", "Learner");

            // SRS setting was already present, so save should not be called
            verify(userSrsSettingRepository, never()).save(any(UserSrsSetting.class));
            // Profile full name is preserved
            assertThat(existingProfile.getFullName()).isEqualTo("Existing Admin Name");
        }
    }

    @Nested
    @DisplayName("Role Provisioning Edge Cases")
    class RoleProvisioningTests {

        @Test
        @DisplayName("GIVEN roles not in DB WHEN runner executes THEN creates missing Admin and Learner roles")
        void testRun_missingRoles_createsRoles() {
            when(accountRepository.countActiveAdmins()).thenReturn(0L);
            when(roleRepository.findById(anyInt())).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Admin")).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Learner")).thenReturn(Optional.empty());
            when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));

            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encoded");
            when(accountRepository.findByEmailOrPhone(anyString())).thenReturn(Optional.empty());
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userProfileRepository.findByAccount(any(Account.class))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(any(UserProfile.class))).thenReturn(false);

            bootstrapAdminRunner.setBootstrapPassword("SecurePassword2026!");
            bootstrapAdminRunner.run(null);

            ArgumentCaptor<Role> roleCaptor = ArgumentCaptor.forClass(Role.class);
            verify(roleRepository, times(2)).save(roleCaptor.capture());
            assertThat(roleCaptor.getAllValues().stream().map(Role::getRoleName).toList())
                    .containsExactly("Admin", "Learner");
        }
    }
}
