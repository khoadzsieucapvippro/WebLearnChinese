package com.elearning;

import com.elearning.service.AuditDataSanitizer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Unit Tests: AuditDataSanitizer")
class AuditDataSanitizerTests {

    private AuditDataSanitizer sanitizer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        sanitizer = new AuditDataSanitizer();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Returns null when input is null")
    void testNullInputReturnsNull() {
        assertThat(sanitizer.sanitizeToString(null)).isNull();
    }

    @Test
    @DisplayName("Redacts direct sensitive keys: password, token, jwt, secret, hash")
    void testDirectSensitiveKeysRedacted() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("username", "admin@elearning.com");
        payload.put("password", "SuperSecret123!");
        payload.put("newPassword", "NewP@ssword456");
        payload.put("accessToken", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc");
        payload.put("refreshToken", "rt_987654321");
        payload.put("jwt", "raw_jwt_token");
        payload.put("clientSecret", "my_secret_key");
        payload.put("passwordHash", "$2a$10$abcdef123456");
        payload.put("authorization", "Bearer xyz789");

        String sanitized = sanitizer.sanitizeToString(payload);
        assertThat(sanitized).isNotNull();

        JsonNode root = objectMapper.readTree(sanitized);
        assertThat(root.get("username").asText()).isEqualTo("admin@elearning.com");
        assertThat(root.get("password").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("newPassword").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("accessToken").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("refreshToken").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("jwt").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("clientSecret").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("passwordHash").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("authorization").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
    }

    @Test
    @DisplayName("Redacts nested sensitive fields inside objects and arrays")
    void testNestedSensitiveKeysRedacted() throws Exception {
        Map<String, Object> innerUser = new HashMap<>();
        innerUser.put("id", 100);
        innerUser.put("password", "SecretInner!");
        innerUser.put("email", "nested@example.com");

        Map<String, Object> tokenItem = new HashMap<>();
        tokenItem.put("type", "OAUTH");
        tokenItem.put("token", "secret_oauth_token");

        Map<String, Object> payload = new HashMap<>();
        payload.put("user", innerUser);
        payload.put("items", List.of(tokenItem));

        String sanitized = sanitizer.sanitizeToString(payload);
        JsonNode root = objectMapper.readTree(sanitized);

        assertThat(root.get("user").get("id").asInt()).isEqualTo(100);
        assertThat(root.get("user").get("email").asText()).isEqualTo("nested@example.com");
        assertThat(root.get("user").get("password").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);

        JsonNode itemsArray = root.get("items");
        assertThat(itemsArray.isArray()).isTrue();
        assertThat(itemsArray.get(0).get("type").asText()).isEqualTo("OAUTH");
        assertThat(itemsArray.get(0).get("token").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
    }

    @Test
    @DisplayName("Matches sensitive keys case-insensitively")
    void testCaseInsensitiveMatching() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("PASSWORD", "P@ss1");
        payload.put("PassWord_Hash", "hash1");
        payload.put("JWT_TOKEN", "jwt1");
        payload.put("SECRET_KEY", "sec1");

        String sanitized = sanitizer.sanitizeToString(payload);
        JsonNode root = objectMapper.readTree(sanitized);

        assertThat(root.get("PASSWORD").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("PassWord_Hash").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("JWT_TOKEN").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("SECRET_KEY").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
    }

    @Test
    @DisplayName("Truncates oversized payload exceeding 64000 characters")
    void testOversizedPayloadTruncation() {
        String largeData = "A".repeat(70000);
        Map<String, Object> payload = Map.of("content", largeData);

        String sanitized = sanitizer.sanitizeToString(payload);
        assertThat(sanitized).isNotNull();
        assertThat(sanitized.length()).isLessThan(70000);
        assertThat(sanitized).endsWith(AuditDataSanitizer.TRUNCATED_MARKER);
    }

    @Test
    @DisplayName("Preserves non-sensitive data correctly")
    void testNonSensitiveDataPreserved() throws Exception {
        Map<String, Object> payload = Map.of(
                "lessonId", 12,
                "title", "Bài học số 1",
                "hskLevel", 2,
                "status", "Approved"
        );

        String sanitized = sanitizer.sanitizeToString(payload);
        JsonNode root = objectMapper.readTree(sanitized);

        assertThat(root.get("lessonId").asInt()).isEqualTo(12);
        assertThat(root.get("title").asText()).isEqualTo("Bài học số 1");
        assertThat(root.get("hskLevel").asInt()).isEqualTo(2);
        assertThat(root.get("status").asText()).isEqualTo("Approved");
    }
}
