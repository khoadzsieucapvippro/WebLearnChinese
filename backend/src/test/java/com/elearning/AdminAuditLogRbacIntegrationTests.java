package com.elearning;

import com.elearning.entity.Account;
import com.elearning.repository.AccountRepository;
import com.elearning.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Adversarial RBAC Tests: GET /api/v1/admin/audit-logs (Requirement R5 / Feature F12)")
class AdminAuditLogRbacIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AccountRepository accountRepository;

    private String learnerToken;
    private String creatorToken;
    private String moderatorToken;
    private String dualCreatorModToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        ensureAccountExists("audit.learner@elearning.com");
        ensureAccountExists("audit.creator@elearning.com");
        ensureAccountExists("audit.moderator@elearning.com");
        ensureAccountExists("audit.dual@elearning.com");
        ensureAccountExists("audit.admin@elearning.com");

        learnerToken = jwtUtil.generateToken("audit.learner@elearning.com", List.of("Learner"));
        creatorToken = jwtUtil.generateToken("audit.creator@elearning.com", List.of("Creator"));
        moderatorToken = jwtUtil.generateToken("audit.moderator@elearning.com", List.of("Moderator"));
        dualCreatorModToken = jwtUtil.generateToken("audit.dual@elearning.com", List.of("Creator", "Moderator"));
        adminToken = jwtUtil.generateToken("audit.admin@elearning.com", List.of("Admin"));
    }

    private void ensureAccountExists(String email) {
        accountRepository.findByEmailOrPhone(email)
                .orElseGet(() -> {
                    Account acc = new Account();
                    acc.setEmailOrPhone(email);
                    acc.setPasswordHash("dummy_hash_12345678");
                    acc.setStatus("Active");
                    return accountRepository.save(acc);
                });
    }

    @Test
    @DisplayName("RBAC-01: Unauthenticated request to /api/v1/admin/audit-logs returns 401 Unauthorized")
    void testUnauthenticatedAuditLogsAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("RBAC-02: Learner token is strictly FORBIDDEN (403) from reading audit logs")
    void testLearnerAuditLogsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + learnerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("RBAC-03: Creator token is strictly FORBIDDEN (403) from reading audit logs")
    void testCreatorAuditLogsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + creatorToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("RBAC-04: Moderator token is strictly FORBIDDEN (403) from reading audit logs")
    void testModeratorAuditLogsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + moderatorToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("RBAC-05: Dual Creator+Moderator token is strictly FORBIDDEN (403) from reading audit logs")
    void testDualCreatorModeratorAuditLogsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + dualCreatorModToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("RBAC-06: Admin token is ACCEPTED (200 OK) with paginated audit logs")
    void testAdminAuditLogsAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    @DisplayName("RBAC-07: Detail endpoint /api/v1/admin/audit-logs/{id} forbids non-admin roles")
    void testAuditLogDetailEndpointRbac() throws Exception {
        // Unauthenticated
        mockMvc.perform(get("/api/v1/admin/audit-logs/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        // Learner
        mockMvc.perform(get("/api/v1/admin/audit-logs/1")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Creator
        mockMvc.perform(get("/api/v1/admin/audit-logs/1")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Moderator
        mockMvc.perform(get("/api/v1/admin/audit-logs/1")
                        .header("Authorization", "Bearer " + moderatorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Dual Creator+Moderator
        mockMvc.perform(get("/api/v1/admin/audit-logs/1")
                        .header("Authorization", "Bearer " + dualCreatorModToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}
