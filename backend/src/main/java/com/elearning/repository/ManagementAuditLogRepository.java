package com.elearning.repository;

import com.elearning.entity.ManagementAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link ManagementAuditLog}.
 */
@Repository
public interface ManagementAuditLogRepository extends JpaRepository<ManagementAuditLog, Long>, JpaSpecificationExecutor<ManagementAuditLog> {

    List<ManagementAuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, String resourceId);

    List<ManagementAuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername);

    Page<ManagementAuditLog> findAllByOrderByCreatedAtDescLogIdDesc(Pageable pageable);
}
