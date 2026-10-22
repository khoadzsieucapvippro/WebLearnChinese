package com.elearning;

import com.elearning.service.AuditDataSanitizer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Adversarial Tests: AuditDataSanitizer Redaction Engine")
public class AuditDataSanitizerAdversarialTests {

    private AuditDataSanitizer sanitizer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        sanitizer = new AuditDataSanitizer();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("ADV-01: Deeply nested JSON (10 levels) redacts passwords, bearer tokens, API secrets, and JWTs")
    void testDeeplyNestedPayloadsRedacted() throws Exception {
        Map<String, Object> l10 = new HashMap<>();
        l10.put("targetPassword", "P@ssw0rdLevel10!");
        l10.put("bearerToken", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def");
        l10.put("apiSecret", "sec_live_999888777666");
        l10.put("rawJwt", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig");
        l10.put("safeField", "public_lesson_123");

        Map<String, Object> current = l10;
        for (int i = 9; i >= 1; i--) {
            Map<String, Object> parent = new HashMap<>();
            parent.put("level" + i, current);
            parent.put("intermediate_token_" + i, "token_val_" + i);
            current = parent;
        }

        String sanitizedJson = sanitizer.sanitizeToString(current);
        assertThat(sanitizedJson).isNotNull();

        // Verify that raw secrets DO NOT appear anywhere in the sanitized output
        assertThat(sanitizedJson).doesNotContain("P@ssw0rdLevel10!");
        assertThat(sanitizedJson).doesNotContain("sec_live_999888777666");
        assertThat(sanitizedJson).doesNotContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig");
        assertThat(sanitizedJson).doesNotContain("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def");

        // Verify that safe field is preserved
        assertThat(sanitizedJson).contains("public_lesson_123");

        // Navigate down and verify REDACTED markers
        JsonNode node = objectMapper.readTree(sanitizedJson);
        for (int i = 1; i <= 9; i++) {
            assertThat(node.get("intermediate_token_" + i).asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
            node = node.get("level" + i);
        }
        assertThat(node.get("targetPassword").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(node.get("bearerToken").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(node.get("apiSecret").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(node.get("rawJwt").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(node.get("safeField").asText()).isEqualTo("public_lesson_123");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "password", "Password", "PASSWORD", "PassWord", "pAsSwOrD",
            "user_password", "oldPassword", "newPassword", "currentPassword", "confirm_password",
            "token", "accessToken", "refreshToken", "api_token", "AUTH_TOKEN", "csrf_token",
            "jwt", "jwtToken", "raw_jwt", "JWT_SECRET", "user_jwt",
            "secret", "clientSecret", "api_secret", "SHARED_SECRET", "oauth_secret",
            "bearer", "bearer_token", "BEARER_AUTH", "bearerToken",
            "authorization", "AUTHORIZATION", "hash", "password_hash"
    })
    @DisplayName("ADV-02: Adversarial case-variations, prefixes, suffixes of sensitive keys are ALL redacted")
    void testSensitiveKeyVariationsAllRedacted(String sensitiveKey) throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put(sensitiveKey, "CRITICAL_VALUE_" + sensitiveKey);
        map.put("non_sensitive", "safe_val");

        String result = sanitizer.sanitizeToString(map);
        assertThat(result).doesNotContain("CRITICAL_VALUE_" + sensitiveKey);

        JsonNode root = objectMapper.readTree(result);
        assertThat(root.get(sensitiveKey).asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("non_sensitive").asText()).isEqualTo("safe_val");
    }

    @Test
    @DisplayName("ADV-03: Arrays containing objects with mixed sensitive credentials at multiple nesting depths")
    void testComplexArrayAndObjectTrees() throws Exception {
        Map<String, Object> user1 = Map.of(
                "id", 1,
                "password", "pass1",
                "jwt", "jwt1"
        );
        Map<String, Object> user2 = Map.of(
                "id", 2,
                "bearer_token", "bearer2",
                "apiSecret", "secret2"
        );
        Map<String, Object> root = Map.of(
                "batchId", "batch-99",
                "users", List.of(user1, user2),
                "nestedArrays", List.of(
                        List.of(
                                Map.of("token", "nested_tok", "status", "OK")
                        )
                )
        );

        String result = sanitizer.sanitizeToString(root);
        assertThat(result).doesNotContain("pass1");
        assertThat(result).doesNotContain("jwt1");
        assertThat(result).doesNotContain("bearer2");
        assertThat(result).doesNotContain("secret2");
        assertThat(result).doesNotContain("nested_tok");

        JsonNode tree = objectMapper.readTree(result);
        assertThat(tree.get("batchId").asText()).isEqualTo("batch-99");
        assertThat(tree.get("users").get(0).get("password").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(tree.get("users").get(1).get("apiSecret").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(tree.get("nestedArrays").get(0).get(0).get("token").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(tree.get("nestedArrays").get(0).get(0).get("status").asText()).isEqualTo("OK");
    }

    @Test
    @DisplayName("ADV-04: Sanitizing JSON string input directly (from raw JSON string)")
    void testRawJsonStringSanitization() throws Exception {
        String rawJson = "{\"auth\":{\"password\":\"SecretString123\",\"jwt\":\"header.body.sig\"},\"name\":\"Admin\"}";
        String sanitized = sanitizer.sanitizeToString(rawJson);

        assertThat(sanitized).doesNotContain("SecretString123");
        assertThat(sanitized).doesNotContain("header.body.sig");

        JsonNode root = objectMapper.readTree(sanitized);
        assertThat(root.get("auth").get("password").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("auth").get("jwt").asText()).isEqualTo(AuditDataSanitizer.REDACTED_MARKER);
        assertThat(root.get("name").asText()).isEqualTo("Admin");
    }

    @Test
    @DisplayName("ADV-05: Non-JSON plain strings and edge cases (null, empty, malformed)")
    void testEdgeCasesAndMalformedInputs() {
        assertThat(sanitizer.sanitizeToString(null)).isNull();
        assertThat(sanitizer.sanitizeToString("   ")).isEqualTo("");
        assertThat(sanitizer.sanitizeToString("plain non-json text")).isEqualTo("plain non-json text");
        assertThat(sanitizer.sanitizeToString("{ unclosed: 123, broken: { }")).isEqualTo("[UNPARSABLE_DATA]");
    }
}
