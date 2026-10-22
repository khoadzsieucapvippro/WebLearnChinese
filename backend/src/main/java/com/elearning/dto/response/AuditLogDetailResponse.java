package com.elearning.dto.response;

import com.elearning.entity.ManagementAuditLog;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Detailed response DTO for audit log record including before and after payload diffs.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogDetailResponse {

    private Long logId;
    private Long actorId;
    private String actorUsername;
    private String actorRoles;
    private String actionType;
    private String resourceType;
    private String resourceId;
    private String status;
    private String errorMessage;
    private String details;
    private String payloadBefore;
    private String payloadAfter;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    public AuditLogDetailResponse() {
    }

    public static AuditLogDetailResponse fromEntity(ManagementAuditLog entity) {
        if (entity == null) {
            return null;
        }
        AuditLogDetailResponse response = new AuditLogDetailResponse();
        response.setLogId(entity.getLogId());
        response.setActorId(entity.getActorId());
        response.setActorUsername(entity.getActorUsername());
        response.setActorRoles(entity.getActorRoles());
        response.setActionType(entity.getActionType());
        response.setResourceType(entity.getResourceType());
        response.setResourceId(entity.getResourceId());
        response.setStatus(entity.getStatus());
        response.setErrorMessage(entity.getErrorMessage());
        response.setDetails(entity.getDetails());
        response.setPayloadBefore(entity.getPayloadBefore());
        response.setPayloadAfter(entity.getPayloadAfter());
        response.setIpAddress(entity.getIpAddress());
        response.setUserAgent(entity.getUserAgent());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
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

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getPayloadBefore() {
        return payloadBefore;
    }

    public void setPayloadBefore(String payloadBefore) {
        this.payloadBefore = payloadBefore;
    }

    public String getPayloadAfter() {
        return payloadAfter;
    }

    public void setPayloadAfter(String payloadAfter) {
        this.payloadAfter = payloadAfter;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
