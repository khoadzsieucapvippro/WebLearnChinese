package com.elearning.dto.response;

import com.elearning.entity.ManagementAuditLog;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Summary DTO for audit log queries in admin portal.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {

    private Long logId;
    private Long actorId;
    private String actorUsername;
    private String actorRoles;
    private String actionType;
    private String resourceType;
    private String resourceId;
    private String status;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;

    public AuditLogResponse() {
    }

    public AuditLogResponse(Long logId, Long actorId, String actorUsername, String actorRoles,
                            String actionType, String resourceType, String resourceId,
                            String status, String details, String ipAddress, LocalDateTime createdAt) {
        this.logId = logId;
        this.actorId = actorId;
        this.actorUsername = actorUsername;
        this.actorRoles = actorRoles;
        this.actionType = actionType;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.status = status;
        this.details = details;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public static AuditLogResponse fromEntity(ManagementAuditLog entity) {
        if (entity == null) {
            return null;
        }
        return new AuditLogResponse(
                entity.getLogId(),
                entity.getActorId(),
                entity.getActorUsername(),
                entity.getActorRoles(),
                entity.getActionType(),
                entity.getResourceType(),
                entity.getResourceId(),
                entity.getStatus(),
                entity.getDetails(),
                entity.getIpAddress(),
                entity.getCreatedAt()
        );
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public String getActorRoles() {
        return actorRoles;
    }

    public void setActorRoles(String actorRoles) {
        this.actorRoles = actorRoles;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
