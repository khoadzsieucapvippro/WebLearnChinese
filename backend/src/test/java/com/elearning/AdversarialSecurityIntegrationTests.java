package com.elearning;

import com.elearning.dto.request.UpdateAccountRolesRequest;
import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.entity.Account;
import com.elearning.entity.Role;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Adversarial Security & Invariant Integration Tests")
class AdversarialSecurityIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private Account legacyTokenAccount;
    private String legacyCreatorModToken;

    @BeforeEach
    void setUp() {
        Role roleLearner = roleRepository.findByRoleName("Learner").orElseGet(() -> roleRepository.save(new Role(1, "Learner")));

        legacyTokenAccount = new Account();
        legacyTokenAccount.setEmailOrPhone("legacy_creator_mod_" + System.currentTimeMillis() + "@example.com");
        legacyTokenAccount.setPasswordHash("$2a$12$dummyhashadversarial1234567890123");
        legacyTokenAccount.setStatus("Active");
        legacyTokenAccount.setAuthorizationVersion(1L);
        legacyTokenAccount.addRole(roleLearner);
        legacyTokenAccount = accountRepository.save(legacyTokenAccount);

        legacyCreatorModToken = jwtUtil.generateToken(
                legacyTokenAccount.getEmailOrPhone(),
                List.of("Creator", "Moderator"),
                legacyTokenAccount.getAuthorizationVersion()
        );
    }

    @Test
    @DisplayName("ADV-INTEG-01: Deprecated /api/v1/moderator/** endpoints are permanently denyAll (403 FORBIDDEN)")
    void testLegacyModeratorEndpoints_permanentlyDenied() throws Exception {
        mockMvc.perform(post("/api/v1/moderator/lessons/1/approve")
                        .header("Authorization", "Bearer " + legacyCreatorModToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("ADV-INTEG-02: Deprecated /api/v1/creator/** endpoints and legacy role tokens on /api/v1/admin/** are strictly FORBIDDEN (403)")
    void testLegacyCreatorEndpoints_andAdminEscalation_permanentlyDenied() throws Exception {
        mockMvc.perform(get("/api/v1/creator/lessons")
                        .header("Authorization", "Bearer " + legacyCreatorModToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        mockMvc.perform(get("/api/v1/admin/lessons")
                        .header("Authorization", "Bearer " + legacyCreatorModToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("ADV-INTEG-03: Demoting or locking the last active administrator is strictly REJECTED with HTTP 400 BAD_REQUEST")
    void testLastAdminDemotion_rejectedWith400BadRequest() throws Exception {
        Role roleAdmin = roleRepository.findByRoleName("Admin").orElseGet(() -> roleRepository.save(new Role(4, "Admin")));

        // Find or create an admin account
        Account singleAdmin = accountRepository.findByEmailOrPhone("sole_admin_test@example.com")
                .orElseGet(() -> {
                    Account a = new Account();
                    a.setEmailOrPhone("sole_admin_test@example.com");
                    a.setPasswordHash("$2a$12$dummyhashsoleadmin12345678901234");
                    a.setStatus("Active");
                    a.setAuthorizationVersion(1L);
                    a.addRole(roleAdmin);
                    return accountRepository.save(a);
                });

        // Set all other admin accounts to INACTIVE for this test so active count is exactly 1
        accountRepository.findAll().forEach(acc -> {
            if (!acc.getAccountId().equals(singleAdmin.getAccountId()) && acc.getRoles().contains(roleAdmin)) {
                acc.setStatus("Inactive");
                accountRepository.save(acc);
            }
        });

        assertThat(accountRepository.countActiveAdmins()).isEqualTo(1L);

        String adminToken = jwtUtil.generateToken(singleAdmin.getEmailOrPhone(), List.of("Admin"), singleAdmin.getAuthorizationVersion());

        // Create a secondary caller whose account in DB is Active (with Learner role)
        // but whose JWT has Admin authority to simulate an administrative request targeting singleAdmin
        Account callerAdmin = new Account();
        callerAdmin.setEmailOrPhone("caller_admin_" + System.currentTimeMillis() + "@example.com");
        callerAdmin.setPasswordHash("$2a$12$dummyhashcalleradmin1234567890123");
        callerAdmin.setStatus("Active"); // Must be Active to pass JwtAuthenticationFilter
        callerAdmin.setAuthorizationVersion(1L);
        Role roleLearner = roleRepository.findByRoleName("Learner").orElseGet(() -> roleRepository.save(new Role(1, "Learner")));
        callerAdmin.addRole(roleLearner); // Not an Admin in DB, so DB activeAdmins count remains strictly 1
        callerAdmin = accountRepository.save(callerAdmin);
        String callerToken = jwtUtil.generateToken(callerAdmin.getEmailOrPhone(), List.of("Admin"), callerAdmin.getAuthorizationVersion());

        // Attempt to demote singleAdmin
        UpdateAccountRolesRequest roleRequest = new UpdateAccountRolesRequest(List.of("Learner"));
        mockMvc.perform(put("/api/v1/admin/accounts/{id}/roles", singleAdmin.getAccountId())
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", is("Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống")));

        // Attempt to deactivate singleAdmin
        UpdateAccountStatusRequest statusRequest = new UpdateAccountStatusRequest("Inactive");
        mockMvc.perform(put("/api/v1/admin/accounts/{id}/status", singleAdmin.getAccountId())
                        .header("Authorization", "Bearer " + callerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", is("Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống")));
    }

    @Test
    @DisplayName("ADV-INTEG-04: Spring Boot context fail-fast when JWT secret is invalid on non-dev profile")
    void testSpringBootContextFailsFastOnMissingOrShortSecret() {
        // Missing secret on non-dev profile
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
                .withUserConfiguration(JwtUtil.class)
                .withPropertyValues("jwt.secret=")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalArgumentException.class);
                });

        // 31 bytes secret (< 32 bytes)
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
                .withUserConfiguration(JwtUtil.class)
                .withPropertyValues("jwt.secret=1234567890123456789012345678901")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalArgumentException.class)
                            .getRootCause().hasMessageContaining("at least 32 bytes");
                });
    }
}
