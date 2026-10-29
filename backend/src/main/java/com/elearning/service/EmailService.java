package com.elearning.service;

/**
 * Service boundary for transactional email delivery.
 * Supports multiple outbound dispatchers (Resend API, Brevo API, Webhook relay)
 * with graceful fallback for offline / test environments.
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
}
