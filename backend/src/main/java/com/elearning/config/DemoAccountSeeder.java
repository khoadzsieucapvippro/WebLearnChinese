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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
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
    private final Environment env;

    @Autowired
    public DemoAccountSeeder(AccountRepository accountRepository,
                             RoleRepository roleRepository,
                             UserProfileRepository userProfileRepository,
                             UserSrsSettingRepository userSrsSettingRepository,
                             PasswordEncoder passwordEncoder,
                             @Autowired(required = false) Environment env) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.userProfileRepository = userProfileRepository;
        this.userSrsSettingRepository = userSrsSettingRepository;
        this.passwordEncoder = passwordEncoder;
        this.env = env;
    }

    public DemoAccountSeeder(AccountRepository accountRepository,
                             RoleRepository roleRepository,
                             UserProfileRepository userProfileRepository,
                             UserSrsSettingRepository userSrsSettingRepository,
                             PasswordEncoder passwordEncoder) {
        this(accountRepository, roleRepository, userProfileRepository, userSrsSettingRepository, passwordEncoder, null);
    }

    private record DemoAccountSpec(String emailOrPhone, String fullName, Set<Role> roles) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (isProductionProfile()) {
            log.warn("Demo account seeding is strictly forbidden in production profile. Skipping.");
            return;
        }

        if (env != null) {
            String seedProperty = env.getProperty("app.demo.seed-accounts", "false");
            if (!"true".equalsIgnoreCase(seedProperty)) {
                log.info("app.demo.seed-accounts is not explicitly true; skipping demo account seeding.");
                return;
            }
        }

        log.info("Starting demo accounts seeding (app.demo.seed-accounts=true)...");

        Role learnerRole = getOrCreateRole(1, "Learner");
        Role creatorRole = getOrCreateRole(2, "Creator");
        Role moderatorRole = getOrCreateRole(3, "Moderator");
        Role adminRole = getOrCreateRole(4, "Admin");

        Set<Role> learnerRoles = Set.of(learnerRole);
        Set<Role> creatorRoles = Set.of(creatorRole);
        Set<Role> moderatorRoles = Set.of(moderatorRole);
        Set<Role> adminRoles = Set.of(adminRole);

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
        Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(emailOrPhone);
        if (accountOpt.isPresent()) {
            log.info("Demo account {} already exists; skipping password reset to preserve security", emailOrPhone);
            return;
        }

        Account account = new Account();
        account.setEmailOrPhone(emailOrPhone);
        account.setPasswordHash(encodedPassword);
        account.setStatus("Active");
        account.setAuthorizationVersion(1L);

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

    private boolean isProductionProfile() {
        if (env == null) {
            return false;
        }
        if (env.acceptsProfiles(Profiles.of("prod", "production"))) {
            return true;
        }
        String[] activeProfiles = env.getActiveProfiles();
        if (activeProfiles != null) {
            for (String profile : activeProfiles) {
                if (profile != null) {
                    String p = profile.trim().toLowerCase();
                    if ("prod".equals(p) || "production".equals(p)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
