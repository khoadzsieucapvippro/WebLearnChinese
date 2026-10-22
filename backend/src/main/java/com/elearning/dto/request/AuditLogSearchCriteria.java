package com.elearning.dto.request;

import java.time.LocalDateTime;

/**
 * Filter criteria for administrative audit log queries.
 */
public class AuditLogSearchCriteria {

    private String actionType;
    private String resourceType;
    private String actor;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public AuditLogSearchCriteria() {
    }

    public AuditLogSearchCriteria(String actionType, String resourceType, String actor, String status, LocalDateTime startDate, LocalDateTime endDate) {
        this.actionType = actionType;
        this.resourceType = resourceType;
        this.actor = actor;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public boolean isEmpty() {
        return isBlank(actionType) && isBlank(resourceType) && isBlank(actor) && isBlank(status)
                && startDate == null && endDate == null;
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
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

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }
}
