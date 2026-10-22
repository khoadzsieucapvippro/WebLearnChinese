package com.elearning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * JPA Entity mapping the MANAGEMENT_AUDIT_LOG table.
 * Immutable centralized audit trail recording sensitive administrative, moderation,
 * user management, and dictionary catalog changes.
 */
@Entity
@Table(name = "MANAGEMENT_AUDIT_LOG")
public class ManagementAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id", updatable = false)
    private Long logId;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_username", nullable = false, length = 191, updatable = false)
    private String actorUsername;

    @Column(name = "actor_roles", length = 100, updatable = false)
    private String actorRoles;

    @Column(name = "action_type", nullable = false, length = 50, updatable = false)
    private String actionType;

    @Column(name = "resource_type", nullable = false, length = 50, updatable = false)
    private String resourceType;

    @Column(name = "resource_id", length = 100, updatable = false)
    private String resourceId;

    @Column(name = "status", nullable = false, length = 20, updatable = false)
    private String status = "SUCCESS";

    @Column(name = "error_message", length = 500, updatable = false)
    private String errorMessage;

    @Column(name = "details", columnDefinition = "TEXT", updatable = false)
    private String details;

    @Column(name = "payload_before", columnDefinition = "LONGTEXT", updatable = false)
    private String payloadBefore;

    @Column(name = "payload_after", columnDefinition = "LONGTEXT", updatable = false)
    private String payloadAfter;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 255, updatable = false)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ManagementAuditLog() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "SUCCESS";
        }
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
