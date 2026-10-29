package com.elearning.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for validating self-service password reset code (Step 2 of Model A).
 */
public class VerifyResetCodeRequest {

    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mã xác thực không được để trống")
    private String resetCode;

    public VerifyResetCodeRequest() {
    }

    public VerifyResetCodeRequest(String email, String resetCode) {
        this.email = email;
        this.resetCode = resetCode;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getResetCode() {
        return resetCode;
    }

    public void setResetCode(String resetCode) {
        this.resetCode = resetCode;
    }
}
