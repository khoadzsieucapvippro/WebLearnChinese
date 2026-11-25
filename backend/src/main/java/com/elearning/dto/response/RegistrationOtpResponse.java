package com.elearning.dto.response;

/**
 * Response DTO for registration email OTP dispatch (/api/v1/auth/register/send-otp).
 */
public class RegistrationOtpResponse {

    private String message;
    private boolean emailSent;

    public RegistrationOtpResponse() {
    }

    public RegistrationOtpResponse(String message, boolean emailSent) {
        this.message = message;
        this.emailSent = emailSent;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEmailSent() {
        return emailSent;
    }

    public void setEmailSent(boolean emailSent) {
        this.emailSent = emailSent;
    }
}
