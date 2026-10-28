package com.elearning.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO returned to administrator after executing temporary password reset.
 * Displays the newly generated temporary password ONCE so admin can transmit to user.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminResetPasswordResponse {

    private Long accountId;
    private String emailOrPhone;
    private String temporaryPassword;

    public AdminResetPasswordResponse() {
    }

    public AdminResetPasswordResponse(Long accountId, String emailOrPhone, String temporaryPassword) {
        this.accountId = accountId;
        this.emailOrPhone = emailOrPhone;
        this.temporaryPassword = temporaryPassword;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getEmailOrPhone() {
        return emailOrPhone;
    }

    public void setEmailOrPhone(String emailOrPhone) {
        this.emailOrPhone = emailOrPhone;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }
}
