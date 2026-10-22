package com.weblearnchinese.repository;

import com.elearning.entity.ManagementAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * ManagementAuditLogRepository alias for com.elearning.repository.ManagementAuditLogRepository.
 */
@Repository
public interface ManagementAuditLogRepository extends JpaRepository<ManagementAuditLog, Long>, JpaSpecificationExecutor<ManagementAuditLog> {
}
