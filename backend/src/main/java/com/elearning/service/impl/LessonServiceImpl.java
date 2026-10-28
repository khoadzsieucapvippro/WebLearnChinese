package com.elearning.service.impl;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.common.ErrorCode;
import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.ModerationLog;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.ModerationLogRepository;
import com.elearning.service.LessonService;
import com.elearning.service.ManagementAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Implementation of {@link LessonService} providing public lesson exploration capabilities
 * and supervisory administrative oversight (TASK-7.2).
 * Guarantees zero entity leak, strict 'Approved' status filtering for public exploration,
 * self-review prohibition, and management audit logging.
 */
@Service
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final LessonVocabularyRepository lessonVocabularyRepository;
    private final AccountRepository accountRepository;
    private final ModerationLogRepository moderationLogRepository;
    private final ManagementAuditService managementAuditService;

    @Autowired
    public LessonServiceImpl(LessonRepository lessonRepository,
                             LessonVocabularyRepository lessonVocabularyRepository,
                             AccountRepository accountRepository,
                             ModerationLogRepository moderationLogRepository,
                             ManagementAuditService managementAuditService) {
        this.lessonRepository = lessonRepository;
        this.lessonVocabularyRepository = lessonVocabularyRepository;
        this.accountRepository = accountRepository;
        this.moderationLogRepository = moderationLogRepository;
        this.managementAuditService = managementAuditService;
    }

    public LessonServiceImpl(LessonRepository lessonRepository,
                             LessonVocabularyRepository lessonVocabularyRepository) {
        this(lessonRepository, lessonVocabularyRepository, null, null, null);
    }

    @Override
    public Page<LessonSummaryResponse> getApprovedLessons(Pageable pageable) {
        Pageable resolvedPageable = (pageable != null) ? pageable : PageRequest.of(0, 20);
        return lessonRepository.findApprovedLessonSummaries(resolvedPageable);
    }

    @Override
    public LessonDetailResponse getApprovedLessonById(Long lessonId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        // Enforce public discovery rule: non-approved lessons (Draft, Pending, Rejected) are hidden (404)
        if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
        }

        // Fetch vocabularies with JOIN FETCH to prevent N+1 queries, sorted by order_index ASC
        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);

        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    public Page<LessonSummaryResponse> getAdminLessons(String status, Pageable pageable) {
        Pageable resolvedPageable = (pageable != null) ? pageable : PageRequest.of(0, 20);
        String normalizedStatus = null;
        if (status != null && !status.isBlank()) {
            normalizedStatus = status.trim();
        }
        return lessonRepository.findAdminLessonSummaries(normalizedStatus, resolvedPageable);
    }

    @Override
    public LessonDetailResponse getAdminLessonById(Long lessonId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);

        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public LessonDetailResponse revokeLesson(Long lessonId, AdminRevokeLessonRequest request) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }
        if (request == null || request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Lý do thu hồi không được để trống");
        }

        Account admin = resolveCurrentAdmin();

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        // Enforce Self-Review Invariant (Invariant 6): Admin cannot revoke their own created lesson
        if (lesson.getCreatedBy() != null && admin.getAccountId() != null
                && lesson.getCreatedBy().getAccountId().equals(admin.getAccountId())) {
            throw new BusinessException(
                    ErrorCode.FORBIDDEN,
                    "Bạn không thể tự thu hồi bài học do chính mình tạo ra"
            );
        }

        String currentStatus = lesson.getStatus();
        if (!"Approved".equalsIgnoreCase(currentStatus)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Chỉ có thể thu hồi bài học đang ở trạng thái Approved (hiện tại: " + currentStatus + ")");
        }

        lesson.setStatus("Rejected");
        lesson = lessonRepository.save(lesson);

        // Record immutable audit trail in MODERATION_LOG
        if (moderationLogRepository != null) {
            ModerationLog log = new ModerationLog(lesson, admin, "Revoke", request.getReason().trim(), null);
            moderationLogRepository.save(log);
        }

        if (managementAuditService != null) {
            String details = String.format("Thu hồi bài học vi phạm khẩn cấp #%d (%s): %s",
                    lesson.getLessonId(), lesson.getTitle(), request.getReason().trim());
            managementAuditService.logSuccess(
                    AuditActionType.LESSON_REVOKE,
                    AuditResourceType.LESSON,
                    String.valueOf(lessonId),
                    details,
                    Map.of("status", currentStatus, "lessonId", lessonId),
                    Map.of("status", "Rejected", "lessonId", lessonId, "reason", request.getReason().trim())
            );
        }

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public LessonDetailResponse supervisoryApproveLesson(Long lessonId, ApproveLessonRequest request) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }

        Account admin = resolveCurrentAdmin();

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        // Enforce Self-Review Invariant (Invariant 6): Admin cannot approve their own created lesson
        if (lesson.getCreatedBy() != null && admin.getAccountId() != null
                && lesson.getCreatedBy().getAccountId().equals(admin.getAccountId())) {
            throw new BusinessException(
                    ErrorCode.FORBIDDEN,
                    "Bạn không thể tự phê duyệt bài học do chính mình tạo ra"
            );
        }

        String currentStatus = lesson.getStatus();
        if ("Approved".equalsIgnoreCase(currentStatus)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Bài học đã được phê duyệt trước đó");
        }

        lesson.setStatus("Approved");
        lesson = lessonRepository.save(lesson);

        String note = (request != null && request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Trọng tài tối cao phê duyệt";

        // Record immutable audit trail in MODERATION_LOG
        if (moderationLogRepository != null) {
            ModerationLog log = new ModerationLog(lesson, admin, "Approve", note, null);
            moderationLogRepository.save(log);
        }

        if (managementAuditService != null) {
            String details = String.format("Phê duyệt trọng tài bài học #%d (%s): %s",
                    lesson.getLessonId(), lesson.getTitle(), note);
            managementAuditService.logSuccess(
                    AuditActionType.LESSON_APPROVE,
                    AuditResourceType.LESSON,
                    String.valueOf(lessonId),
                    details,
                    Map.of("status", currentStatus, "lessonId", lessonId),
                    Map.of("status", "Approved", "lessonId", lessonId, "note", note)
            );
        }

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    private Account resolveCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        String emailOrPhone = authentication.getName();
        if (accountRepository == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Account repository is unavailable");
        }
        return accountRepository.findByEmailOrPhone(emailOrPhone)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Tài khoản người dùng không tồn tại"));
    }
}
