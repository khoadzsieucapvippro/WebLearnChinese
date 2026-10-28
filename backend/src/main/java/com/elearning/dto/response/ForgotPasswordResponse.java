package com.elearning.dto.response;

/**
 * Response DTO for forgot-password initiation (/api/v1/auth/forgot-password).
 * Provides delivery status and an optional development verification code when
 * an external SMTP server has not yet been configured in the environment.
 */
public class ForgotPasswordResponse {

    private String message;
    private String devCode;
    private boolean emailSent;

    public ForgotPasswordResponse() {
    }

    public ForgotPasswordResponse(String message, String devCode, boolean emailSent) {
        this.message = message;
        this.devCode = devCode;
        this.emailSent = emailSent;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDevCode() {
        return devCode;
    }

    public void setDevCode(String devCode) {
        this.devCode = devCode;
    }

    public boolean isEmailSent() {
        return emailSent;
    }

    public void setEmailSent(boolean emailSent) {
        this.emailSent = emailSent;
    }
}
