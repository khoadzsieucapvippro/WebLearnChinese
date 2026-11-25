package com.elearning.service;

/**
 * Service boundary for transactional email delivery.
 */
public interface EmailService {

    /**
     * Sends a 6-digit password reset verification code to a user's real email address.
     *
     * @param toEmail   Recipient email address
     * @param resetCode 6-digit numeric verification code
     * @return true if email dispatch succeeded via an external provider, false otherwise
     */
    boolean sendPasswordResetCode(String toEmail, String resetCode);

    /**
     * Sends a 6-digit registration verification code to prove ownership of a real email address.
     *
     * @param toEmail          Recipient email address
     * @param verificationCode 6-digit numeric verification code
     * @param fullName         Recipient's display name
     * @return true if email dispatch succeeded via an external provider, false otherwise
     */
    default boolean sendRegistrationVerificationCode(String toEmail, String verificationCode, String fullName) {
        return sendPasswordResetCode(toEmail, verificationCode);
    }
}
