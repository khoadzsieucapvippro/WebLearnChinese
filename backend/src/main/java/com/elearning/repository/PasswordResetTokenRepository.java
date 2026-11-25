package com.elearning.repository;

import com.elearning.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for persisting and querying email verification / password reset OTP tokens.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByEmailAndPurpose(String email, String purpose);

    void deleteByEmailAndPurpose(String email, String purpose);
}
