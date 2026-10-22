package com.elearning.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Sanitizer engine for audit log payloads.
 * Recursively redacts passwords, tokens, JWTs, hashes, and secrets from JSON objects/strings
 * and prevents denial of service by truncating oversized payloads.
 */
@Component
public class AuditDataSanitizer {

    public static final int MAX_PAYLOAD_LENGTH = 64000;
    public static final String REDACTED_MARKER = "[REDACTED]";
    public static final String TRUNCATED_MARKER = "... [TRUNCATED_DUE_TO_SIZE]";

    private static final Pattern SENSITIVE_KEY_PATTERN = Pattern.compile(
            "(?i).*(password|token|jwt|secret|hash|bearer|authorization).*"
    );

    private final ObjectMapper objectMapper;

    public AuditDataSanitizer() {
        this.objectMapper = createDefaultMapper();
    }

    public AuditDataSanitizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : createDefaultMapper();
    }

    private static ObjectMapper createDefaultMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        mapper.setSerializationInclusion(JsonInclude.Include.ALWAYS);
        return mapper;
    }

    /**
     * Converts any input data (Object, Map, List, or JSON String) into a sanitized JSON string.
     * Replaces any sensitive keys matching regex with [REDACTED].
     *
     * @param data source object
     * @return sanitized JSON string or null
     */
    public String sanitizeToString(Object data) {
        if (data == null) {
            return null;
        }

        try {
            JsonNode tree;
            if (data instanceof String str) {
                String trimmed = str.trim();
                if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                    tree = objectMapper.readTree(trimmed);
                } else {
                    return truncateIfNeeded(trimmed);
                }
            } else if (data instanceof JsonNode jsonNode) {
                tree = jsonNode.deepCopy();
            } else {
                tree = objectMapper.valueToTree(data);
            }

            JsonNode sanitizedTree = sanitizeNode(tree);
            String jsonResult = objectMapper.writeValueAsString(sanitizedTree);
            return truncateIfNeeded(jsonResult);
        } catch (Exception ex) {
            return "[UNPARSABLE_DATA]";
        }
    }

    /**
     * Recursively traverses and sanitizes a JsonNode.
     */
    public JsonNode sanitizeNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return node;
        }

        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String fieldName = entry.getKey();
                if (isSensitiveKey(fieldName)) {
                    entry.setValue(new TextNode(REDACTED_MARKER));
                } else {
                    sanitizeNode(entry.getValue());
                }
            }
        } else if (node.isArray()) {
            ArrayNode arrayNode = (ArrayNode) node;
            for (int i = 0; i < arrayNode.size(); i++) {
                sanitizeNode(arrayNode.get(i));
            }
        }
        return node;
    }

    /**
     * Checks whether a field name matches the sensitive keys pattern.
     */
    public boolean isSensitiveKey(String key) {
        if (key == null) return false;
        return SENSITIVE_KEY_PATTERN.matcher(key).matches();
    }

    private String truncateIfNeeded(String input) {
        if (input == null) return null;
        if (input.length() > MAX_PAYLOAD_LENGTH) {
            return input.substring(0, MAX_PAYLOAD_LENGTH) + TRUNCATED_MARKER;
        }
        return input;
    }
}
