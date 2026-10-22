package com.elearning;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.dto.response.AuditLogDetailResponse;
import com.elearning.dto.response.AuditLogResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.entity.ManagementAuditLog;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.ManagementAuditLogRepository;
import com.elearning.service.AuditDataSanitizer;
import com.elearning.service.impl.ManagementAuditServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests: ManagementAuditServiceImpl")
class ManagementAuditServiceTests {

    @Mock
    private ManagementAuditLogRepository repository;

    @Mock
    private AccountRepository accountRepository;

    private AuditDataSanitizer sanitizer;
    private ManagementAuditServiceImpl service;

    @BeforeEach
    void setUp() {
        sanitizer = new AuditDataSanitizer();
        service = new ManagementAuditServiceImpl(repository, accountRepository, sanitizer);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@elearning.com",
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_Admin"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("logSuccess sanitizes payloads and saves audit log with SUCCESS status")
    void testLogSuccess_persistsSanitizedRecord() {
        Map<String, Object> before = Map.of("password", "Secret123!", "role", "Learner");
        Map<String, Object> after = Map.of("password", "NewSecret456!", "role", "Admin");

        service.logSuccess(
                AuditActionType.USER_ROLE_UPDATE,
                AuditResourceType.USER,
                "50",
                "Phân quyền quản trị viên",
                before,
                after
        );

        ArgumentCaptor<ManagementAuditLog> captor = ArgumentCaptor.forClass(ManagementAuditLog.class);
        verify(repository).save(captor.capture());

        ManagementAuditLog saved = captor.getValue();
        assertThat(saved.getActorUsername()).isEqualTo("admin@elearning.com");
        assertThat(saved.getActorRoles()).isEqualTo("Admin");
        assertThat(saved.getActionType()).isEqualTo("USER_ROLE_UPDATE");
        assertThat(saved.getResourceType()).isEqualTo("USER");
        assertThat(saved.getResourceId()).isEqualTo("50");
        assertThat(saved.getStatus()).isEqualTo("SUCCESS");
        assertThat(saved.getPayloadBefore()).contains("[REDACTED]").doesNotContain("Secret123!");
        assertThat(saved.getPayloadAfter()).contains("[REDACTED]").doesNotContain("NewSecret456!");
    }

    @Test
    @DisplayName("logFailure saves audit log with FAILED status and error message")
    void testLogFailure_persistsFailureRecord() {
        Map<String, Object> before = Map.of("email", "fail@example.com", "token", "tok_xyz");

        service.logFailure(
                AuditActionType.ACCOUNT_STATUS_UPDATE,
                AuditResourceType.USER,
                "51",
                "Tài khoản không tồn tại",
                before
        );

        ArgumentCaptor<ManagementAuditLog> captor = ArgumentCaptor.forClass(ManagementAuditLog.class);
        verify(repository).save(captor.capture());

        ManagementAuditLog saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo("FAILED");
        assertThat(saved.getErrorMessage()).isEqualTo("Tài khoản không tồn tại");
        assertThat(saved.getPayloadBefore()).contains("[REDACTED]").doesNotContain("tok_xyz");
    }

    @Test
    @DisplayName("getAuditLogs throws validation error if startDate is after endDate")
    void testGetAuditLogs_invalidDates() {
        AuditLogSearchCriteria criteria = new AuditLogSearchCriteria();
        criteria.setStartDate(LocalDateTime.of(2026, 10, 25, 0, 0));
        criteria.setEndDate(LocalDateTime.of(2026, 10, 20, 0, 0));

        assertThatThrownBy(() -> service.getAuditLogs(criteria, PageRequest.of(0, 10)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ngày bắt đầu không được lớn hơn ngày kết thúc");
    }

    @Test
    @DisplayName("getAuditLogById returns detail response or throws 404")
    void testGetAuditLogById() {
        ManagementAuditLog log = new ManagementAuditLog();
        log.setLogId(77L);
        log.setActorUsername("admin@elearning.com");
        log.setActionType("LESSON_CREATE");
        log.setStatus("SUCCESS");

        when(repository.findById(77L)).thenReturn(Optional.of(log));
        when(repository.findById(999L)).thenReturn(Optional.empty());

        AuditLogDetailResponse res = service.getAuditLogById(77L);
        assertThat(res.getLogId()).isEqualTo(77L);
        assertThat(res.getActionType()).isEqualTo("LESSON_CREATE");

        assertThatThrownBy(() -> service.getAuditLogById(999L))
                .isInstanceOf(BusinessException.class);
    }
}
