package com.elearning.controller;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.AuditLogDetailResponse;
import com.elearning.dto.response.AuditLogResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.exception.BusinessException;
import com.elearning.service.ManagementAuditService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * REST Controller for centralized management audit log querying (Milestone M3 / Requirement R5).
 * Protected: Requires ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasAnyRole('Admin', 'ADMIN')")
public class AdminAuditLogController {

    private final ManagementAuditService managementAuditService;

    public AdminAuditLogController(ManagementAuditService managementAuditService) {
        this.managementAuditService = managementAuditService;
    }

    /**
     * Queries management audit logs with pagination and multi-criteria filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "createdAt,desc") String sort,
            @RequestParam(value = "actionType", required = false) String actionType,
            @RequestParam(value = "resourceType", required = false) String resourceType,
            @RequestParam(value = "actor", required = false) String actor,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "startDate", required = false) String startDateStr,
            @RequestParam(value = "endDate", required = false) String endDateStr) {

        int effectivePage = Math.max(0, page);
        int effectiveSize = Math.min(100, Math.max(1, size));

        LocalDateTime startDateTime = parseFlexibleDateTime(startDateStr, false);
        LocalDateTime endDateTime = parseFlexibleDateTime(endDateStr, true);

        if (startDateTime != null && endDateTime != null && startDateTime.isAfter(endDateTime)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ngày bắt đầu không được lớn hơn ngày kết thúc");
        }

        AuditLogSearchCriteria criteria = new AuditLogSearchCriteria();
        criteria.setActionType(actionType);
        criteria.setResourceType(resourceType);
        criteria.setActor(actor);
        criteria.setStatus(status);
        criteria.setStartDate(startDateTime);
        criteria.setEndDate(endDateTime);

        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(effectivePage, effectiveSize, sortObj);

        PageResponse<AuditLogResponse> response = managementAuditService.getAuditLogs(criteria, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves audit log details including before and after payload snapshots.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogDetailResponse>> getAuditLogById(@PathVariable("id") Long id) {
        AuditLogDetailResponse response = managementAuditService.getAuditLogById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private LocalDateTime parseFlexibleDateTime(String input, boolean isEndOfDay) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String trimmed = input.trim();
        try {
            if (trimmed.length() == 10) { // yyyy-MM-dd
                LocalDate date = LocalDate.parse(trimmed, DateTimeFormatter.ISO_LOCAL_DATE);
                return isEndOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
            }
            return LocalDateTime.parse(trimmed, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Định dạng ngày không hợp lệ: " + input);
        }
    }

    private Sort parseSortParameter(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("logId"));
        }

        List<Sort.Order> orders = new ArrayList<>();
        String[] clauses = sortParam.split(";");
        for (String clause : clauses) {
            String[] parts = clause.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            orders.add(new Sort.Order(direction, property));
        }

        if (orders.isEmpty()) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("logId"));
        }
        return Sort.by(orders);
    }
}
