package com.elearning.specification;

import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.entity.ManagementAuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Specification for filtering {@link ManagementAuditLog} entities.
 */
public final class ManagementAuditLogSpecification {

    private ManagementAuditLogSpecification() {
    }

    public static Specification<ManagementAuditLog> fromCriteria(AuditLogSearchCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null) {
                return null;
            }

            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getActionType() != null && !criteria.getActionType().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("actionType")), criteria.getActionType().trim().toUpperCase()));
            }

            if (criteria.getResourceType() != null && !criteria.getResourceType().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("resourceType")), criteria.getResourceType().trim().toUpperCase()));
            }

            if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), criteria.getStatus().trim().toUpperCase()));
            }

            if (criteria.getActor() != null && !criteria.getActor().isBlank()) {
                String actorPattern = "%" + criteria.getActor().trim().toLowerCase() + "%";
                Predicate matchUsername = cb.like(cb.lower(root.get("actorUsername")), actorPattern);
                
                // If numeric, also match actorId or resourceId
                if (criteria.getActor().trim().matches("^\\d+$")) {
                    try {
                        Long actorId = Long.parseLong(criteria.getActor().trim());
                        Predicate matchId = cb.equal(root.get("actorId"), actorId);
                        predicates.add(cb.or(matchUsername, matchId));
                    } catch (NumberFormatException ignored) {
                        predicates.add(matchUsername);
                    }
                } else {
                    predicates.add(matchUsername);
                }
            }

            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getStartDate()));
            }

            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
