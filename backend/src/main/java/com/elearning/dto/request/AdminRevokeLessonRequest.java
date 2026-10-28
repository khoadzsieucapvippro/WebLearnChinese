package com.elearning.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for administrative emergency lesson revocation (POST /api/v1/admin/lessons/{id}/revoke).
 * Requires non-blank violation reason (<= 500 characters).
 * Recorded in MODERATION_LOG and MANAGEMENT_AUDIT_LOG.
 */
public class AdminRevokeLessonRequest {

    @NotBlank(message = "Lý do thu hồi không được để trống")
    @Size(max = 500, message = "Lý do thu hồi không được vượt quá 500 ký tự")
    private String reason;

    public AdminRevokeLessonRequest() {
    }

    public AdminRevokeLessonRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
