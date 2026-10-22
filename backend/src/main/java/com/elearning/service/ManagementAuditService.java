package com.elearning.service;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.dto.response.AuditLogDetailResponse;
import com.elearning.dto.response.AuditLogResponse;
import com.elearning.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service managing centralized management audit log entries and queries.
 */
public interface ManagementAuditService {

    /**
     * Queries management audit logs with dynamic multi-criteria filtering and pagination.
     */
    PageResponse<AuditLogResponse> getAuditLogs(AuditLogSearchCriteria criteria, Pageable pageable);

    /**
     * Retrieves detailed audit log record by ID including sanitized before/after payload snapshots.
     */
    AuditLogDetailResponse getAuditLogById(Long logId);

    /**
     * Records a successful management audit action.
     */
    void logSuccess(AuditActionType actionType,
                    AuditResourceType resourceType,
                    String resourceId,
                    String details,
                    Object payloadBefore,
                    Object payloadAfter);

    /**
     * Convenience overload accepting String action and resource types.
     */
    void logSuccess(String actionType,
                    String resourceType,
                    String resourceId,
                    String details,
                    Object payloadBefore,
                    Object payloadAfter);

    /**
     * Records a failed management audit action.
     */
    void logFailure(AuditActionType actionType,
                    AuditResourceType resourceType,
                    String resourceId,
                    String errorMessage,
                    Object payloadBefore);

    /**
     * Convenience overload accepting String action and resource types.
     */
    void logFailure(String actionType,
                    String resourceType,
                    String resourceId,
                    String errorMessage,
                    Object payloadBefore);
}
