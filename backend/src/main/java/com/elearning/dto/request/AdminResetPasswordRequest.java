package com.elearning.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Request payload for administrative password reset.
 * If newPassword is provided, it must be between 6 and 128 characters.
 * If null or blank, the server automatically generates a secure temporary password.
 */
public class AdminResetPasswordRequest {

    @Size(min = 6, max = 128, message = "Mật khẩu mới phải có độ dài từ 6 đến 128 ký tự")
    private String newPassword;

    public AdminResetPasswordRequest() {
    }

    public AdminResetPasswordRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
