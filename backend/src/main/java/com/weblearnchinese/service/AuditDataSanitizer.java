package com.weblearnchinese.service;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * AuditDataSanitizer alias for com.elearning.service.AuditDataSanitizer.
 */
public class AuditDataSanitizer extends com.elearning.service.AuditDataSanitizer {
    public AuditDataSanitizer() {
        super();
    }

    public AuditDataSanitizer(ObjectMapper objectMapper) {
        super(objectMapper);
    }
}
