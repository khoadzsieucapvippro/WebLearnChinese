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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

/**
 * Ensures at least one active Administrator exists in the system upon application startup.
 * Runs in all environments including production, strictly guarded by the invariant:
 * Only creates a bootstrap administrator IF AND ONLY IF zero active administrators exist.
 * If at least one active administrator already exists, this runner safely does nothing.
 */
@Component
@Order(100)
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserSrsSettingRepository userSrsSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.email:${APP_BOOTSTRAP_ADMIN_EMAIL:admin@elearning.local}}")
    private String bootstrapEmail = "admin@elearning.local";

    @Value("${app.bootstrap.admin.password:${APP_BOOTSTRAP_ADMIN_PASSWORD:}}")
    private String bootstrapPassword = "";

    @Autowired
    public BootstrapAdminRunner(AccountRepository accountRepository,
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

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long activeAdmins = accountRepository.countActiveAdmins();
        if (activeAdmins > 0) {
            log.info("System has {} active administrator(s). Bootstrap admin creation skipped.", activeAdmins);
            return;
        }

        log.warn("CRITICAL: Zero active administrators detected in database! Initiating secure bootstrap admin setup...");

        Role adminRole = getOrCreateRole(4, "Admin");
        Role learnerRole = getOrCreateRole(1, "Learner");

        String rawPassword = bootstrapPassword;
        boolean isGenerated = false;

        if (rawPassword == null || rawPassword.trim().length() < 12) {
            // Generate high-entropy 16-byte base64url temporary password prefixed with "Admin!"
            byte[] randomBytes = new byte[12];
            new SecureRandom().nextBytes(randomBytes);
            rawPassword = "Admin!" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
            isGenerated = true;
        }

        String targetEmail = (bootstrapEmail != null && !bootstrapEmail.isBlank())
                ? bootstrapEmail.trim()
                : "admin@elearning.local";

        Account adminAccount = accountRepository.findByEmailOrPhone(targetEmail)
                .orElseGet(Account::new);

        adminAccount.setEmailOrPhone(targetEmail);
        adminAccount.setPasswordHash(passwordEncoder.encode(rawPassword));
        adminAccount.setStatus("Active");
        adminAccount.setAuthorizationVersion(1L);
        adminAccount.setRoles(Set.of(adminRole, learnerRole));

        Account saved = accountRepository.save(adminAccount);

        UserProfile profile = userProfileRepository.findByAccount(saved).orElseGet(() -> {
            UserProfile newProfile = new UserProfile();
            newProfile.setAccount(saved);
            return newProfile;
        });
        profile.setAccount(saved);
        if (profile.getFullName() == null || profile.getFullName().isBlank()) {
            profile.setFullName("Quản Trị Viên Khởi Tạo");
        }
        userProfileRepository.save(profile);
        saved.setUserProfile(profile);

        if (!userSrsSettingRepository.existsByUser(profile)) {
            userSrsSettingRepository.save(new UserSrsSetting(profile, 20, 100));
        }

        log.info("================================================================================");
        log.info("BOOTSTRAP ADMINISTRATOR SUCCESSFULLY INITIALIZED");
        log.info("Identifier : {}", targetEmail);
        if (isGenerated) {
            log.warn("Generated Temporary Password : {}", rawPassword);
            log.warn("MANDATORY: Please log in immediately and rotate this password via POST /api/v1/auth/change-password!");
        } else {
            log.info("Password initialized from environment configuration.");
            log.info("RECOMMENDED: Rotate this password via POST /api/v1/auth/change-password after initial login.");
        }
        log.info("================================================================================");
    }

    private Role getOrCreateRole(Integer roleId, String roleName) {
        return roleRepository.findById(roleId)
                .orElseGet(() -> roleRepository.findByRoleName(roleName)
                        .orElseGet(() -> roleRepository.save(new Role(roleId, roleName))));
    }

    public void setBootstrapEmail(String bootstrapEmail) {
        this.bootstrapEmail = bootstrapEmail;
    }

    public void setBootstrapPassword(String bootstrapPassword) {
        this.bootstrapPassword = bootstrapPassword;
    }

    public String getBootstrapEmail() {
        return bootstrapEmail;
    }

    public String getBootstrapPassword() {
        return bootstrapPassword;
    }
}
