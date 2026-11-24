package com.elearning.service.impl;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.common.ErrorCode;
import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.request.CreateLessonRequest;
import com.elearning.dto.request.ReorderVocabRequest;
import com.elearning.dto.request.UpdateLessonRequest;
import com.elearning.dto.response.ImportValidationReport;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.dto.response.ParsedVocabularyItem;
import com.elearning.entity.Account;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.LessonVocabularyId;
import com.elearning.entity.ModerationLog;
import com.elearning.entity.Vocabulary;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.ModerationLogRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.ExcelParserService;
import com.elearning.service.LessonService;
import com.elearning.service.ManagementAuditService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Implementation of {@link LessonService} providing public lesson exploration capabilities
 * and full administrative lesson management.
 * In the simplified model, all lessons published by Admin are directly in 'Approved' state.
 */
@Service
@Transactional(readOnly = true)
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final LessonVocabularyRepository lessonVocabularyRepository;
    private final AccountRepository accountRepository;
    private final VocabularyRepository vocabularyRepository;
    private final ExcelParserService excelParserService;
    private final ModerationLogRepository moderationLogRepository;
    private final ManagementAuditService managementAuditService;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public LessonServiceImpl(LessonRepository lessonRepository,
                             LessonVocabularyRepository lessonVocabularyRepository,
                             AccountRepository accountRepository,
                             VocabularyRepository vocabularyRepository,
                             ExcelParserService excelParserService,
                             ModerationLogRepository moderationLogRepository,
                             ManagementAuditService managementAuditService) {
        this.lessonRepository = lessonRepository;
        this.lessonVocabularyRepository = lessonVocabularyRepository;
        this.accountRepository = accountRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.excelParserService = excelParserService;
        this.moderationLogRepository = moderationLogRepository;
        this.managementAuditService = managementAuditService;
    }

    public LessonServiceImpl(LessonRepository lessonRepository,
                             LessonVocabularyRepository lessonVocabularyRepository) {
        this(lessonRepository, lessonVocabularyRepository, null, null, null, null, null);
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

        if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
        }

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

        String currentStatus = lesson.getStatus();
        if (!"Approved".equalsIgnoreCase(currentStatus)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Chỉ có thể thu hồi bài học đang ở trạng thái Approved (hiện tại: " + currentStatus + ")");
        }

        lesson.setStatus("Rejected");
        lesson = lessonRepository.save(lesson);

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

        String currentStatus = lesson.getStatus();
        if ("Approved".equalsIgnoreCase(currentStatus)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Bài học đã được phê duyệt trước đó");
        }

        lesson.setStatus("Approved");
        lesson = lessonRepository.save(lesson);

        String note = (request != null && request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim()
                : "Quản trị viên phê duyệt trực tiếp";

        if (moderationLogRepository != null) {
            ModerationLog log = new ModerationLog(lesson, admin, "Approve", note, null);
            moderationLogRepository.save(log);
        }

        if (managementAuditService != null) {
            String details = String.format("Phê duyệt bài học #%d (%s): %s",
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

    @Override
    @Transactional
    public LessonDetailResponse createAdminLesson(CreateLessonRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tiêu đề bài học không được để trống");
        }

        Account admin = resolveCurrentAdmin();

        Lesson lesson = new Lesson(request.getTitle().trim(), admin);
        lesson.setStatus("Approved"); // Auto-published immediately
        lesson.setExcelFileUrl(request.getExcelFileUrl());

        lesson = lessonRepository.save(lesson);

        if (request.getVocabularyIds() != null && !request.getVocabularyIds().isEmpty()) {
            if (request.getVocabularyIds().size() > 20) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Bài học không được vượt quá 20 từ vựng theo quy chuẩn giáo trình");
            }
            int order = 1;
            for (Long vocabId : request.getVocabularyIds()) {
                Vocabulary vocabulary = vocabularyRepository.findByIdWithLock(vocabId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng với ID: " + vocabId));
                LessonVocabulary lv = new LessonVocabulary(lesson, vocabulary, order++);
                lessonVocabularyRepository.save(lv);
            }
        }

        if (managementAuditService != null) {
            managementAuditService.logSuccess(
                    AuditActionType.LESSON_CREATE,
                    AuditResourceType.LESSON,
                    String.valueOf(lesson.getLessonId()),
                    "Admin tạo mới bài học xuất bản trực tiếp: " + lesson.getTitle(),
                    null,
                    Map.of("lessonId", lesson.getLessonId(), "title", lesson.getTitle(), "status", "Approved")
            );
        }

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lesson.getLessonId());
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    public ImportValidationReport previewAdminLessonImport(MultipartFile file) {
        if (excelParserService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Dịch vụ đọc Excel không khả dụng");
        }
        return excelParserService.parseAndValidate(file);
    }

    @Override
    @Transactional
    public LessonDetailResponse importAdminLessonFromExcel(String title, MultipartFile file) {
        if (title == null || title.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tiêu đề bài học không được để trống");
        }
        if (excelParserService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Dịch vụ đọc Excel không khả dụng");
        }

        ImportValidationReport report = excelParserService.parseAndValidate(file);
        if (!Boolean.TRUE.equals(report.getIsValid())) {
            throw new BusinessException(ErrorCode.UNPROCESSABLE_ENTITY,
                    "File Excel không hợp lệ hoặc chứa lỗi dữ liệu: " + report.getSummaryMessage());
        }

        List<ParsedVocabularyItem> rows = report.getRows();
        if (rows == null || rows.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "File Excel không chứa bất kỳ dòng từ vựng nào");
        }

        Account admin = resolveCurrentAdmin();

        // 1. Create Lesson directly in Approved state
        Lesson lesson = new Lesson(title.trim(), admin);
        lesson.setStatus("Approved");
        lesson.setExcelFileUrl(file.getOriginalFilename());
        lesson = lessonRepository.save(lesson);

        // 2. Persist or retrieve vocabularies and associate with Lesson
        int order = 1;
        for (ParsedVocabularyItem item : rows) {
            Vocabulary vocabulary = null;
            if (Boolean.TRUE.equals(item.getIsExisting()) && item.getExistingVocabId() != null) {
                vocabulary = vocabularyRepository.findById(item.getExistingVocabId()).orElse(null);
            }

            if (vocabulary == null) {
                Optional<Vocabulary> existingOpt = vocabularyRepository.findByHanziAndPinyinRaw(
                        item.getHanzi(), item.getPinyinRaw());
                if (existingOpt.isPresent()) {
                    vocabulary = existingOpt.get();
                } else {
                    Vocabulary newVocab = new Vocabulary();
                    newVocab.setHanzi(item.getHanzi());
                    newVocab.setPinyin(item.getPinyin());
                    newVocab.setPinyinRaw(item.getPinyinRaw());
                    newVocab.setMeaningHanViet(item.getMeaningHanViet());
                    newVocab.setMeaningVi(item.getMeaningVi());
                    newVocab.setExampleSentence(item.getExampleSentence());
                    newVocab.setExampleTranslation(item.getExampleTranslation());
                    if (item.getAudioUrl() != null && !item.getAudioUrl().isBlank()) {
                        newVocab.setAudioUrl(item.getAudioUrl());
                    }
                    vocabulary = vocabularyRepository.save(newVocab);
                }
            }

            LessonVocabulary lv = new LessonVocabulary(lesson, vocabulary, order++);
            lessonVocabularyRepository.save(lv);
        }

        if (managementAuditService != null) {
            managementAuditService.logSuccess(
                    AuditActionType.LESSON_CREATE,
                    AuditResourceType.LESSON,
                    String.valueOf(lesson.getLessonId()),
                    "Admin nhập bài học từ Excel xuất bản trực tiếp: " + lesson.getTitle(),
                    null,
                    Map.of("lessonId", lesson.getLessonId(), "title", lesson.getTitle(), "status", "Approved", "vocabCount", rows.size())
            );
        }

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lesson.getLessonId());
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public LessonDetailResponse updateAdminLesson(Long lessonId, UpdateLessonRequest request) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        if (request != null) {
            if (request.getTitle() != null) {
                if (request.getTitle().trim().isEmpty()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Tiêu đề bài học không được để trống");
                }
                lesson.setTitle(request.getTitle().trim());
            }
            if (request.getExcelFileUrl() != null) {
                lesson.setExcelFileUrl(request.getExcelFileUrl());
            }
        }

        lesson = lessonRepository.save(lesson);

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public void deleteAdminLesson(Long lessonId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        List<LessonVocabulary> items = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonId);
        if (!items.isEmpty()) {
            lessonVocabularyRepository.deleteAll(items);
        }
        if (moderationLogRepository != null) {
            List<ModerationLog> moderationLogs = moderationLogRepository.findByLesson_LessonIdOrderByLogIdDesc(lessonId);
            if (!moderationLogs.isEmpty()) {
                moderationLogRepository.deleteAll(moderationLogs);
            }
        }
        lessonRepository.delete(lesson);
        if (entityManager != null) {
            entityManager.flush();
        }

        if (managementAuditService != null) {
            managementAuditService.logSuccess(
                    AuditActionType.LESSON_REVOKE,
                    AuditResourceType.LESSON,
                    String.valueOf(lessonId),
                    "Admin xóa bài học: #" + lessonId + " (" + lesson.getTitle() + ")",
                    Map.of("lessonId", lessonId, "title", lesson.getTitle()),
                    null
            );
        }
    }

    @Override
    @Transactional
    public LessonDetailResponse addVocabularyToAdminLesson(Long lessonId, Long vocabId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }
        if (vocabId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID từ vựng không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        long currentCount = lessonVocabularyRepository.countByLesson_LessonId(lessonId);
        if (currentCount >= 20) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Bài học đã đạt giới hạn tối đa 20 từ vựng theo quy chuẩn giáo trình");
        }

        if (lessonVocabularyRepository.existsByLesson_LessonIdAndVocabulary_VocabId(lessonId, vocabId)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Từ vựng đã tồn tại trong bài học");
        }

        Vocabulary vocabulary = vocabularyRepository.findByIdWithLock(vocabId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng với ID: " + vocabId));

        List<LessonVocabulary> existingItems = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonId);
        int maxOrderIndex = existingItems.stream()
                .mapToInt(lvItem -> lvItem.getOrderIndex() != null ? lvItem.getOrderIndex() : 0)
                .max()
                .orElse((int) currentCount);
        int nextOrderIndex = Math.max((int) currentCount, maxOrderIndex) + 1;
        LessonVocabulary lv = new LessonVocabulary(lesson, vocabulary, nextOrderIndex);
        lessonVocabularyRepository.save(lv);

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public LessonDetailResponse removeVocabularyFromAdminLesson(Long lessonId, Long vocabId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }
        if (vocabId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID từ vựng không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        LessonVocabularyId id = new LessonVocabularyId(lessonId, vocabId);
        LessonVocabulary lv = lessonVocabularyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Từ vựng không tồn tại trong bài học này"));

        lessonVocabularyRepository.delete(lv);
        if (entityManager != null) {
            entityManager.flush();
        }

        // Re-index remaining vocabulary items to ensure contiguous 1, 2, 3...
        List<LessonVocabulary> remaining = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i + 1);
        }
        lessonVocabularyRepository.saveAll(remaining);
        if (entityManager != null) {
            entityManager.flush();
        }

        List<LessonVocabulary> vocabularies = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        return LessonDetailResponse.fromEntity(lesson, vocabularies);
    }

    @Override
    @Transactional
    public LessonDetailResponse reorderVocabularyInAdminLesson(Long lessonId, ReorderVocabRequest request) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "ID bài học không được để trống");
        }
        if (request == null || request.getResolvedVocabIds() == null || request.getResolvedVocabIds().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Danh sách thứ tự từ vựng không được để trống");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));

        List<Long> orderedIds = request.getResolvedVocabIds();
        List<LessonVocabulary> currentItems = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonId);

        if (orderedIds.size() != currentItems.size()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Số lượng từ vựng sắp xếp không khớp với bài học");
        }

        Set<Long> currentIdSet = currentItems.stream()
                .map(lv -> lv.getVocabulary().getVocabId())
                .collect(java.util.stream.Collectors.toSet());

        Set<Long> orderedIdSet = new HashSet<>(orderedIds);
        if (!currentIdSet.equals(orderedIdSet)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Danh sách ID từ vựng không khớp với danh sách hiện tại của bài học");
        }

        Map<Long, LessonVocabulary> lvMap = currentItems.stream()
                .collect(java.util.stream.Collectors.toMap(lv -> lv.getVocabulary().getVocabId(), lv -> lv));

        final int TEMP_OFFSET = 1_000_000;

        // Phase 1: Set temporary offset orderIndex to avoid unique constraint collision
        for (int i = 0; i < orderedIds.size(); i++) {
            LessonVocabulary lv = lvMap.get(orderedIds.get(i));
            lv.setOrderIndex(TEMP_OFFSET + i + 1);
        }
        lessonVocabularyRepository.saveAll(currentItems);
        if (entityManager != null) {
            entityManager.flush();
        }

        // Phase 2: Set target positive orderIndex (1, 2, 3...)
        for (int i = 0; i < orderedIds.size(); i++) {
            LessonVocabulary lv = lvMap.get(orderedIds.get(i));
            lv.setOrderIndex(i + 1);
        }
        lessonVocabularyRepository.saveAll(currentItems);
        if (entityManager != null) {
            entityManager.flush();
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
