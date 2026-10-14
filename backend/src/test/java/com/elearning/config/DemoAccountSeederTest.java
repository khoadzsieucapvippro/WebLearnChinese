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

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DemoAccountSeeder Unit Tests")
class DemoAccountSeederTest {

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
    private DemoAccountSeeder demoAccountSeeder;

    private Role learnerRole;
    private Role creatorRole;
    private Role moderatorRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        learnerRole = new Role(1, "Learner");
        creatorRole = new Role(2, "Creator");
        moderatorRole = new Role(3, "Moderator");
        adminRole = new Role(4, "Admin");
    }

    private void mockStandardRoles() {
        when(roleRepository.findById(1)).thenReturn(Optional.of(learnerRole));
        when(roleRepository.findById(2)).thenReturn(Optional.of(creatorRole));
        when(roleRepository.findById(3)).thenReturn(Optional.of(moderatorRole));
        when(roleRepository.findById(4)).thenReturn(Optional.of(adminRole));
    }

    @Nested
    @DisplayName("Fresh Database Seeding Tests")
    class FreshSeedingTests {

        @Test
        @DisplayName("GIVEN no existing accounts WHEN seeder runs THEN seeds 8 accounts, profiles, and SRS settings")
        void testRun_freshSeeding() {
            mockStandardRoles();
            when(passwordEncoder.encode("Password@123")).thenReturn("$2a$10$encodedHash123");
            when(accountRepository.findByEmailOrPhone(anyString())).thenReturn(Optional.empty());
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userProfileRepository.findByAccount(any(Account.class))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(any(UserProfile.class))).thenReturn(false);
            when(userSrsSettingRepository.save(any(UserSrsSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

            demoAccountSeeder.run(null);

            verify(passwordEncoder).encode("Password@123");

            // Verify 8 accounts saved
            ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
            verify(accountRepository, times(8)).save(accountCaptor.capture());
            List<Account> savedAccounts = accountCaptor.getAllValues();

            List<String> emails = savedAccounts.stream().map(Account::getEmailOrPhone).toList();
            assertThat(emails).containsExactlyInAnyOrder(
                    "learner@elearning.local", "learner@gmail.com",
                    "creator@elearning.local", "creator@gmail.com",
                    "moderator@elearning.local", "moderator@gmail.com",
                    "admin@elearning.local", "admin@gmail.com"
            );

            for (Account account : savedAccounts) {
                assertThat(account.getPasswordHash()).isEqualTo("$2a$10$encodedHash123");
                assertThat(account.getStatus()).isEqualTo("Active");
                assertThat(account.getAuthorizationVersion()).isEqualTo(1L);
                assertThat(account.getUserProfile()).isNotNull();

                Set<String> roleNames = account.getRoles().stream().map(Role::getRoleName).collect(Collectors.toSet());
                if (account.getEmailOrPhone().startsWith("learner")) {
                    assertThat(roleNames).containsExactly("Learner");
                } else if (account.getEmailOrPhone().startsWith("creator")) {
                    assertThat(roleNames).containsExactlyInAnyOrder("Creator", "Learner");
                } else if (account.getEmailOrPhone().startsWith("moderator")) {
                    assertThat(roleNames).containsExactlyInAnyOrder("Moderator", "Learner");
                } else if (account.getEmailOrPhone().startsWith("admin")) {
                    assertThat(roleNames).containsExactlyInAnyOrder("Admin", "Learner");
                }
            }

            // Verify UserProfile saving
            ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
            verify(userProfileRepository, atLeast(8)).save(profileCaptor.capture());
            List<UserProfile> savedProfiles = profileCaptor.getAllValues();
            List<String> fullNames = savedProfiles.stream().map(UserProfile::getFullName).distinct().toList();
            assertThat(fullNames).contains("Học Viên Mẫu", "Biên Soạn Mẫu", "Kiểm Duyệt Mẫu", "Quản Trị Viên Mẫu");

            // Verify UserSrsSetting saving (20 new cards, 100 max review)
            ArgumentCaptor<UserSrsSetting> srsCaptor = ArgumentCaptor.forClass(UserSrsSetting.class);
            verify(userSrsSettingRepository, times(8)).save(srsCaptor.capture());
            for (UserSrsSetting srs : srsCaptor.getAllValues()) {
                assertThat(srs.getNewCardsPerDay()).isEqualTo(20);
                assertThat(srs.getMaxReviewPerDay()).isEqualTo(100);
                assertThat(srs.getUser()).isNotNull();
            }
        }
    }

    @Nested
    @DisplayName("Idempotent Existing Accounts Tests")
    class IdempotentExistingAccountsTests {

        @Test
        @DisplayName("GIVEN existing accounts, profiles, and SRS settings WHEN seeder runs THEN updates credentials and does not re-create settings")
        void testRun_existingAccountsIdempotency() {
            mockStandardRoles();
            when(passwordEncoder.encode("Password@123")).thenReturn("$2a$10$newHash123");

            Account existingLearner = new Account();
            existingLearner.setEmailOrPhone("learner@elearning.local");
            existingLearner.setPasswordHash("$2a$10$oldHash");
            existingLearner.setStatus("Inactive");

            UserProfile existingProfile = new UserProfile();
            existingProfile.setFullName("Học Viên Mẫu");
            existingProfile.setAccount(existingLearner);

            when(accountRepository.findByEmailOrPhone("learner@elearning.local")).thenReturn(Optional.of(existingLearner));
            when(accountRepository.findByEmailOrPhone(argThat(email -> !email.equals("learner@elearning.local"))))
                    .thenReturn(Optional.empty());

            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

            when(userProfileRepository.findByAccount(existingLearner)).thenReturn(Optional.of(existingProfile));
            when(userProfileRepository.findByAccount(argThat(acc -> acc != existingLearner))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

            when(userSrsSettingRepository.existsByUser(existingProfile)).thenReturn(true);
            when(userSrsSettingRepository.existsByUser(argThat(p -> p != existingProfile))).thenReturn(false);

            demoAccountSeeder.run(null);

            // Verify learner account was updated to Active and new password
            assertThat(existingLearner.getStatus()).isEqualTo("Active");
            assertThat(existingLearner.getPasswordHash()).isEqualTo("$2a$10$newHash123");
            assertThat(existingLearner.getAuthorizationVersion()).isEqualTo(1L);

            // SRS setting was only saved 7 times (for the newly seeded ones, not for existing learner)
            verify(userSrsSettingRepository, times(7)).save(any(UserSrsSetting.class));
        }
    }

    @Nested
    @DisplayName("Missing Roles Provisioning Tests")
    class MissingRolesTests {

        @Test
        @DisplayName("GIVEN roles do not exist in DB WHEN seeder runs THEN creates missing roles")
        void testRun_createsMissingRoles() {
            when(roleRepository.findById(anyInt())).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Learner")).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Creator")).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Moderator")).thenReturn(Optional.empty());
            when(roleRepository.findByRoleName("Admin")).thenReturn(Optional.empty());

            when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hash");
            when(accountRepository.findByEmailOrPhone(anyString())).thenReturn(Optional.empty());
            when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userProfileRepository.findByAccount(any(Account.class))).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(userSrsSettingRepository.existsByUser(any(UserProfile.class))).thenReturn(false);

            demoAccountSeeder.run(null);

            ArgumentCaptor<Role> roleCaptor = ArgumentCaptor.forClass(Role.class);
            verify(roleRepository, times(4)).save(roleCaptor.capture());
            List<Role> savedRoles = roleCaptor.getAllValues();
            assertThat(savedRoles.stream().map(Role::getRoleName).toList())
                    .containsExactly("Learner", "Creator", "Moderator", "Admin");
        }
    }
}
