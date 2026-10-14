package com.elearning.config;

import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Seeds and reconciles standard demo accounts for Cloud environments (Railway/Render)
 * when app.demo.seed-accounts=true.
 * Ensures Learner, Creator, Moderator, and Admin accounts and their aliases exist
 * with encoded credentials, assigned roles, UserProfile, and default UserSrsSetting.
 */
@Component
@ConditionalOnProperty(name = "app.demo.seed-accounts", havingValue = "true")
public class DemoAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountSeeder.class);

    private static final String DEFAULT_DEMO_PASSWORD = "Password@123";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserSrsSettingRepository userSrsSettingRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountSeeder(AccountRepository accountRepository,
                             RoleRepository roleRepository,
                             UserProfileRepository userProfileRepository,
                             UserSrsSettingRepository userSrsSettingRepository,
                             PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.userProfileRepository = userProfileRepository;
        this.userSrsSettingRepository = userSrsSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private record DemoAccountSpec(String emailOrPhone, String fullName, Set<Role> roles) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Starting demo accounts seeding (app.demo.seed-accounts=true)...");

        Role learnerRole = getOrCreateRole(1, "Learner");
        Role creatorRole = getOrCreateRole(2, "Creator");
        Role moderatorRole = getOrCreateRole(3, "Moderator");
        Role adminRole = getOrCreateRole(4, "Admin");

        Set<Role> learnerRoles = Set.of(learnerRole);
        Set<Role> creatorRoles = Set.of(creatorRole, learnerRole);
        Set<Role> moderatorRoles = Set.of(moderatorRole, learnerRole);
        Set<Role> adminRoles = Set.of(adminRole, learnerRole);

        String encodedPassword = passwordEncoder.encode(DEFAULT_DEMO_PASSWORD);

        List<DemoAccountSpec> specs = List.of(
                // 1. Learner
                new DemoAccountSpec("learner@elearning.local", "Học Viên Mẫu", learnerRoles),
                new DemoAccountSpec("learner@gmail.com", "Học Viên Mẫu", learnerRoles),

                // 2. Creator
                new DemoAccountSpec("creator@elearning.local", "Biên Soạn Mẫu", creatorRoles),
                new DemoAccountSpec("creator@gmail.com", "Biên Soạn Mẫu", creatorRoles),

                // 3. Moderator
                new DemoAccountSpec("moderator@elearning.local", "Kiểm Duyệt Mẫu", moderatorRoles),
                new DemoAccountSpec("moderator@gmail.com", "Kiểm Duyệt Mẫu", moderatorRoles),

                // 4. Admin
                new DemoAccountSpec("admin@elearning.local", "Quản Trị Viên Mẫu", adminRoles),
                new DemoAccountSpec("admin@gmail.com", "Quản Trị Viên Mẫu", adminRoles)
        );

        for (DemoAccountSpec spec : specs) {
            seedAccount(spec.emailOrPhone(), spec.fullName(), spec.roles(), encodedPassword);
        }

        log.info("Demo accounts seeding completed successfully for {} accounts.", specs.size());
    }

    private Role getOrCreateRole(Integer roleId, String roleName) {
        return roleRepository.findById(roleId)
                .orElseGet(() -> roleRepository.findByRoleName(roleName)
                        .orElseGet(() -> roleRepository.save(new Role(roleId, roleName))));
    }

    private void seedAccount(String emailOrPhone, String fullName, Set<Role> roles, String encodedPassword) {
        Account account = accountRepository.findByEmailOrPhone(emailOrPhone)
                .orElseGet(() -> {
                    Account newAcc = new Account();
                    newAcc.setEmailOrPhone(emailOrPhone);
                    return newAcc;
                });

        account.setPasswordHash(encodedPassword);
        account.setStatus("Active");
        if (account.getAuthorizationVersion() == null) {
            account.setAuthorizationVersion(1L);
        }

        for (Role role : roles) {
            account.addRole(role);
        }

        Account savedAccount = accountRepository.save(account);

        UserProfile userProfile = userProfileRepository.findByAccount(savedAccount)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setAccount(savedAccount);
                    newProfile.setFullName(fullName);
                    return userProfileRepository.save(newProfile);
                });

        if (userProfile.getFullName() == null || userProfile.getFullName().isBlank()) {
            userProfile.setFullName(fullName);
            userProfile = userProfileRepository.save(userProfile);
        }

        savedAccount.setUserProfile(userProfile);

        if (!userSrsSettingRepository.existsByUser(userProfile)) {
            UserSrsSetting srsSetting = new UserSrsSetting(userProfile, 20, 100);
            userSrsSettingRepository.save(srsSetting);
        }
    }
}
