package com.elearning.service;

import com.elearning.dto.request.ChangePasswordRequest;
import com.elearning.dto.request.ForgotPasswordRequest;
import com.elearning.dto.request.LoginRequest;
import com.elearning.dto.request.RegisterRequest;
import com.elearning.dto.request.ResetPasswordRequest;
import com.elearning.dto.request.VerifyResetCodeRequest;
import com.elearning.dto.response.AuthResponse;
import com.elearning.dto.response.ForgotPasswordResponse;

/**
 * Service interface for user registration and authentication workflows.
 */
public interface AuthService {

    /**
     * Registers a new user account with default Learner role and associated profile.
     *
     * @param request registration request containing emailOrPhone, password, and fullName
     * @return AuthResponse containing token and user identity details
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticates an existing user and issues a JWT token.
     *
     * @param request login request containing emailOrPhone and password
     * @return AuthResponse containing token and user identity details
     */
    AuthResponse login(LoginRequest request);

    /**
     * Invalidates all active tokens for the user account by incrementing authorization_version.
     *
     * @param emailOrPhone user's email or phone identifier
     */
    void logout(String emailOrPhone);

    /**
     * Changes user's password after validating current password, updates BCrypt hash,
     * and increments authorization_version to revoke tokens on all sessions.
     *
     * @param emailOrPhone user's email or phone identifier
     * @param request change password payload containing oldPassword and newPassword
     */
    void changePassword(String emailOrPhone, ChangePasswordRequest request);

    /**
     * Initiates self-service password reset process (Model A).
     * Generates a 6-digit verification code with 15-minute TTL.
     * Prevents account enumeration by always completing normally even if email is not found.
     *
     * @param request forgot password request containing target email
     * @return ForgotPasswordResponse with delivery status and testing code if SMTP is unconfigured
     */
    ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request);

    /**
     * Verifies whether the 6-digit verification code is valid and unexpired without resetting the password yet.
     *
     * @param request verify reset code payload containing email and resetCode
     */
    void verifyResetCode(VerifyResetCodeRequest request);

    /**
     * Completes self-service password reset by validating 6-digit verification code,
     * hashing new password with BCrypt, and incrementing authorization_version to revoke sessions.
     *
     * @param request reset password request containing email, resetCode, and newPassword
     */
    void resetPassword(ResetPasswordRequest request);
}
