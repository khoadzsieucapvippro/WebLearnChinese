package com.elearning.service.impl;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.common.ErrorCode;
import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.dto.response.AuditLogDetailResponse;
import com.elearning.dto.response.AuditLogResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.entity.Account;
import com.elearning.entity.ManagementAuditLog;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.ManagementAuditLogRepository;
import com.elearning.security.CustomUserDetails;
import com.elearning.service.AuditDataSanitizer;
import com.elearning.service.ManagementAuditService;
import com.elearning.specification.ManagementAuditLogSpecification;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ManagementAuditService} providing audit trail persistence,
 * dynamic querying, and sensitive data sanitization.
 */
@Service
public class ManagementAuditServiceImpl implements ManagementAuditService {

    private static final Logger log = LoggerFactory.getLogger(ManagementAuditServiceImpl.class);

    private final ManagementAuditLogRepository managementAuditLogRepository;
    private final AccountRepository accountRepository;
    private final AuditDataSanitizer auditDataSanitizer;

    @Autowired
    public ManagementAuditServiceImpl(ManagementAuditLogRepository managementAuditLogRepository,
                                     AccountRepository accountRepository,
                                     AuditDataSanitizer auditDataSanitizer) {
        this.managementAuditLogRepository = managementAuditLogRepository;
        this.accountRepository = accountRepository;
        this.auditDataSanitizer = auditDataSanitizer;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(AuditLogSearchCriteria criteria, Pageable pageable) {
        if (criteria != null && criteria.getStartDate() != null && criteria.getEndDate() != null) {
            if (criteria.getStartDate().isAfter(criteria.getEndDate())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ngày bắt đầu không được lớn hơn ngày kết thúc");
            }
        }

        Pageable effectivePageable = resolveEffectivePageable(pageable);
        Specification<ManagementAuditLog> spec = ManagementAuditLogSpecification.fromCriteria(criteria);

        Page<ManagementAuditLog> page = managementAuditLogRepository.findAll(spec, effectivePageable);
        return PageResponse.from(page.map(AuditLogResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogDetailResponse getAuditLogById(Long logId) {
        if (logId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID nhật ký kiểm toán không được để trống");
        }

        ManagementAuditLog auditLog = managementAuditLogRepository.findById(logId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND,
                        "Không tìm thấy bản ghi nhật ký kiểm toán với ID: " + logId));

        return AuditLogDetailResponse.fromEntity(auditLog);
    }

    @Override
    @Transactional
    public void logSuccess(AuditActionType actionType,
                           AuditResourceType resourceType,
                           String resourceId,
                           String details,
                           Object payloadBefore,
                           Object payloadAfter) {
        String actionStr = actionType != null ? actionType.name() : "UNKNOWN_ACTION";
        String resourceStr = resourceType != null ? resourceType.name() : "UNKNOWN_RESOURCE";
        logSuccess(actionStr, resourceStr, resourceId, details, payloadBefore, payloadAfter);
    }

    @Override
    @Transactional
    public void logSuccess(String actionType,
                           String resourceType,
                           String resourceId,
                           String details,
                           Object payloadBefore,
                           Object payloadAfter) {
        try {
            ActorContext actor = resolveCurrentActor();
            HttpServletRequest request = getCurrentHttpRequest();
            String ipAddress = resolveClientIp(request);
            String userAgent = resolveUserAgent(request);

            String sanitizedBefore = auditDataSanitizer.sanitizeToString(payloadBefore);
            String sanitizedAfter = auditDataSanitizer.sanitizeToString(payloadAfter);

            ManagementAuditLog auditLog = new ManagementAuditLog();
            auditLog.setActorId(actor.accountId());
            auditLog.setActorUsername(actor.username());
            auditLog.setActorRoles(actor.roles());
            auditLog.setActionType(actionType);
            auditLog.setResourceType(resourceType);
            auditLog.setResourceId(resourceId);
            auditLog.setStatus("SUCCESS");
            auditLog.setDetails(details);
            auditLog.setPayloadBefore(sanitizedBefore);
            auditLog.setPayloadAfter(sanitizedAfter);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setCreatedAt(LocalDateTime.now());

            managementAuditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to persist success management audit log: action={}, resourceId={}", actionType, resourceId, ex);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(AuditActionType actionType,
                           AuditResourceType resourceType,
                           String resourceId,
                           String errorMessage,
                           Object payloadBefore) {
        String actionStr = actionType != null ? actionType.name() : "UNKNOWN_ACTION";
        String resourceStr = resourceType != null ? resourceType.name() : "UNKNOWN_RESOURCE";
        logFailure(actionStr, resourceStr, resourceId, errorMessage, payloadBefore);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(String actionType,
                           String resourceType,
                           String resourceId,
                           String errorMessage,
                           Object payloadBefore) {
        try {
            ActorContext actor = resolveCurrentActor();
            HttpServletRequest request = getCurrentHttpRequest();
            String ipAddress = resolveClientIp(request);
            String userAgent = resolveUserAgent(request);

            String sanitizedBefore = auditDataSanitizer.sanitizeToString(payloadBefore);

            ManagementAuditLog auditLog = new ManagementAuditLog();
            auditLog.setActorId(actor.accountId());
            auditLog.setActorUsername(actor.username());
            auditLog.setActorRoles(actor.roles());
            auditLog.setActionType(actionType);
            auditLog.setResourceType(resourceType);
            auditLog.setResourceId(resourceId);
            auditLog.setStatus("FAILED");
            auditLog.setErrorMessage(errorMessage);
            auditLog.setPayloadBefore(sanitizedBefore);
            auditLog.setIpAddress(ipAddress);
            auditLog.setUserAgent(userAgent);
            auditLog.setCreatedAt(LocalDateTime.now());

            managementAuditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to persist failure management audit log: action={}, resourceId={}", actionType, resourceId, ex);
        }
    }

    private ActorContext resolveCurrentActor() {
        Authentication auth = (SecurityContextHolder.getContext() != null)
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return new ActorContext(null, "SYSTEM", "SYSTEM");
        }

        Object principal = auth.getPrincipal();
        Long accountId = null;
        String username = auth.getName();
        String roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
                .collect(Collectors.joining(","));

        if (principal instanceof CustomUserDetails userDetails) {
            accountId = userDetails.getAccountId();
            username = userDetails.getUsername();
        } else if (accountRepository != null && username != null) {
            Optional<Account> accountOpt = accountRepository.findByEmailOrPhone(username);
            if (accountOpt.isPresent()) {
                accountId = accountOpt.get().getAccountId();
            }
        }

        return new ActorContext(accountId, (username != null && !username.isBlank()) ? username : "SYSTEM", roles);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest();
        }
        return null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String resolveUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 255) {
            return ua.substring(0, 255);
        }
        return ua;
    }

    private Pageable resolveEffectivePageable(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, 20, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("logId")));
        }
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("logId")));
        }
        return pageable;
    }

    public record ActorContext(Long accountId, String username, String roles) {}
}
