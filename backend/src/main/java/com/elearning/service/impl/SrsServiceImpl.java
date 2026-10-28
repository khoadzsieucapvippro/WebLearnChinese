package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.CurriculumProgressResponse;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.entity.CardProgress;
import com.elearning.entity.Radical;
import com.elearning.entity.ReviewLog;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.entity.Vocabulary;
import com.elearning.exception.BusinessException;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.SrsService;
import com.elearning.service.srs.ReviewRating;
import com.elearning.service.srs.SrsCalculationResult;
import com.elearning.service.srs.SrsCalculator;
import com.elearning.service.srs.TwoMinuteTestSrsCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.elearning.config.TimeConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;

/**
 * Production implementation of {@link SrsService}.
 * Orchestrates Spaced Repetition reviews, card progress lifecycles, and study sessions
 * using pure mathematical calculation engine {@link SrsCalculator}.
 */
@Service
public class SrsServiceImpl implements SrsService {

    private static final Logger log = LoggerFactory.getLogger(SrsServiceImpl.class);

    private final CardProgressRepository cardProgressRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final UserSrsSettingRepository userSrsSettingRepository;
    private final VocabularyRepository vocabularyRepository;
    private final RadicalRepository radicalRepository;
    private final UserProfileRepository userProfileRepository;
    private final LessonRepository lessonRepository;
    private final LessonVocabularyRepository lessonVocabularyRepository;
    private final SrsCalculator srsCalculator;
    private final Clock businessClock;

    @Value("${app.srs.test-mode.enabled:true}")
    private boolean testModeEnabled = true;

    @Value("${app.srs.test-mode.interval-minutes:2}")
    private int testIntervalMinutes = 2;

    private final TwoMinuteTestSrsCalculator testCalculator = new TwoMinuteTestSrsCalculator();

    @Autowired
    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            LessonRepository lessonRepository,
            LessonVocabularyRepository lessonVocabularyRepository,
            @Value("${app.srs.test-mode.enabled:true}") boolean testModeEnabled,
            @Value("${app.srs.test-mode.interval-minutes:2}") int testIntervalMinutes,
            Clock businessClock) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                lessonRepository, lessonVocabularyRepository, new SrsCalculator(), businessClock);
        this.testModeEnabled = testModeEnabled;
        this.testIntervalMinutes = testIntervalMinutes;
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            LessonRepository lessonRepository,
            LessonVocabularyRepository lessonVocabularyRepository,
            Clock businessClock) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                lessonRepository, lessonVocabularyRepository, false, 2, businessClock);
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            LessonRepository lessonRepository,
            LessonVocabularyRepository lessonVocabularyRepository,
            SrsCalculator srsCalculator,
            Clock businessClock) {
        this.cardProgressRepository = cardProgressRepository;
        this.reviewLogRepository = reviewLogRepository;
        this.userSrsSettingRepository = userSrsSettingRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.radicalRepository = radicalRepository;
        this.userProfileRepository = userProfileRepository;
        this.lessonRepository = lessonRepository;
        this.lessonVocabularyRepository = lessonVocabularyRepository;
        this.srsCalculator = srsCalculator != null ? srsCalculator : new SrsCalculator();
        this.businessClock = businessClock != null ? businessClock : Clock.system(ZoneId.of(TimeConfig.DEFAULT_BUSINESS_TIMEZONE));
        this.testModeEnabled = false;
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            Clock businessClock) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                null, null, new SrsCalculator(), businessClock);
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            SrsCalculator srsCalculator,
            Clock businessClock) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                null, null, srsCalculator, businessClock);
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                null, null, new SrsCalculator(), Clock.system(ZoneId.of(TimeConfig.DEFAULT_BUSINESS_TIMEZONE)));
    }

    public SrsServiceImpl(
            CardProgressRepository cardProgressRepository,
            ReviewLogRepository reviewLogRepository,
            UserSrsSettingRepository userSrsSettingRepository,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            UserProfileRepository userProfileRepository,
            SrsCalculator srsCalculator) {
        this(cardProgressRepository, reviewLogRepository, userSrsSettingRepository,
                vocabularyRepository, radicalRepository, userProfileRepository,
                null, null, srsCalculator, Clock.system(ZoneId.of(TimeConfig.DEFAULT_BUSINESS_TIMEZONE)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getDueCards(String itemTypeFilter, Integer limit) {
        return getDueCards(itemTypeFilter, null, null, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getDueCards(String itemTypeFilter, String cardTypeFilter, Integer limit) {
        return getDueCards(itemTypeFilter, cardTypeFilter, null, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getDueCards(String itemTypeFilter, String cardTypeFilter, Long lessonId, Integer limit) {
        UserProfile user = resolveCurrentUserProfile();

        Pageable pageable = (limit != null && limit > 0) ? PageRequest.of(0, limit) : Pageable.unpaged();
        LocalDateTime now = LocalDateTime.now(businessClock);

        boolean hasItemType = itemTypeFilter != null && !itemTypeFilter.trim().isEmpty();
        boolean hasCardType = cardTypeFilter != null && !cardTypeFilter.trim().isEmpty();

        List<CardProgress> dueProgressList;

        if (lessonId != null) {
            // Lessons only contain VOCABULARY items
            if (hasItemType && !"VOCABULARY".equalsIgnoreCase(itemTypeFilter.trim())) {
                return Collections.emptyList();
            }

            // 1. Validate lesson existence and access permission
            if (lessonRepository != null) {
                Lesson lesson = lessonRepository.findById(lessonId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));
                if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    boolean isAdmin = auth != null && auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN") || a.getAuthority().equalsIgnoreCase("Admin"));
                    boolean isCreator = user != null && user.getAccount() != null && lesson.getCreatedBy() != null
                            && lesson.getCreatedBy().getAccountId().equals(user.getAccount().getAccountId());
                    if (!isAdmin && !isCreator) {
                        throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
                    }
                }
            }

            if (hasCardType) {
                dueProgressList = cardProgressRepository.findDueCardsByLessonAndCardType(
                        user, lessonId, cardTypeFilter.trim().toUpperCase(), now, pageable);
            } else {
                dueProgressList = cardProgressRepository.findDueCardsByLesson(
                        user, lessonId, now, pageable);
            }
        } else {
            if (hasItemType && hasCardType) {
                dueProgressList = cardProgressRepository.findByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        user, itemTypeFilter.trim().toUpperCase(), cardTypeFilter.trim().toUpperCase(), now, pageable);
            } else if (hasCardType) {
                dueProgressList = cardProgressRepository.findByUserAndCardTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        user, cardTypeFilter.trim().toUpperCase(), now, pageable);
            } else if (hasItemType) {
                dueProgressList = cardProgressRepository.findByUserAndItemTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        user, itemTypeFilter.trim().toUpperCase(), now, pageable);
            } else {
                dueProgressList = cardProgressRepository.findByUserAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        user, now, pageable);
            }
        }

        // 5. Hydrate polymorphic content in bulk (BE-PERF-001: eliminate N+1 queries)
        if (dueProgressList == null || dueProgressList.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> vocabIds = new HashSet<>();
        Set<Integer> radicalIds = new HashSet<>();

        for (CardProgress progress : dueProgressList) {
            if ("VOCABULARY".equalsIgnoreCase(progress.getItemType()) && progress.getItemId() != null) {
                vocabIds.add(progress.getItemId());
            } else if ("RADICAL".equalsIgnoreCase(progress.getItemType()) && progress.getItemId() != null) {
                radicalIds.add(progress.getItemId().intValue());
            }
        }

        Map<Long, Vocabulary> vocabMap = vocabIds.isEmpty()
                ? Collections.emptyMap()
                : vocabularyRepository.findAllById(vocabIds).stream()
                        .collect(Collectors.toMap(Vocabulary::getVocabId, Function.identity(), (a, b) -> a));

        Map<Integer, Radical> radicalMap = radicalIds.isEmpty()
                ? Collections.emptyMap()
                : radicalRepository.findAllById(radicalIds).stream()
                        .collect(Collectors.toMap(Radical::getRadicalId, Function.identity(), (a, b) -> a));

        List<DueCardResponse> results = new ArrayList<>(dueProgressList.size());
        for (CardProgress progress : dueProgressList) {
            if ("VOCABULARY".equalsIgnoreCase(progress.getItemType()) && progress.getItemId() != null) {
                Vocabulary v = vocabMap.get(progress.getItemId());
                if (v != null) {
                    results.add(DueCardResponse.fromVocabulary(v, progress));
                }
            } else if ("RADICAL".equalsIgnoreCase(progress.getItemType()) && progress.getItemId() != null) {
                Radical r = radicalMap.get(progress.getItemId().intValue());
                if (r != null) {
                    results.add(DueCardResponse.fromRadical(r, progress));
                }
            }
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getNewCardCandidates(Long lessonId, Integer limit) {
        return getNewCardCandidates(lessonId, null, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getNewCardCandidates(Long lessonId, String cardType, Integer limit) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bài học không được để trống");
        }

        UserProfile user = resolveCurrentUserProfile();

        // 1. Validate lesson existence and approved status (R1-DEC-02, R1-DEC-03)
        if (lessonRepository != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));
            if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
            }
        }

        // 2. Resolve daily new-card limits (R1-DEC-04)
        UserSrsSetting setting = userSrsSettingRepository.findByUser(user).orElse(null);
        int newCardsLimit = setting != null ? setting.getNewCardsPerDay() : 20;

        if (newCardsLimit <= 0) {
            log.info("Learner user_id={} has newCardsPerDay set to 0", user.getUserId());
            return Collections.emptyList();
        }

        // 3. Count unique new items introduced today (R1-DEC-04)
        LocalDateTime startOfDay = LocalDate.now(businessClock).atStartOfDay();
        long newCardsIntroducedToday = reviewLogRepository.countNewItemsIntroducedToday(user, "VOCABULARY", startOfDay);
        int remainingNewQuota = (int) Math.max(0, newCardsLimit - newCardsIntroducedToday);

        if (remainingNewQuota == 0) {
            log.info("Learner user_id={} has reached daily new-card limit ({}/{})", user.getUserId(), newCardsIntroducedToday, newCardsLimit);
            return Collections.emptyList();
        }

        // 4. Apply limit
        int effectiveLimit = (limit != null && limit > 0) ? Math.min(limit, remainingNewQuota) : remainingNewQuota;
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        // 5. Query candidate LessonVocabulary associations
        if (lessonVocabularyRepository == null) {
            return Collections.emptyList();
        }

        List<LessonVocabulary> candidateList;
        String targetSkill = (cardType != null && !cardType.trim().isEmpty()) ? cardType.trim().toUpperCase() : null;
        if (targetSkill != null) {
            candidateList = lessonVocabularyRepository.findNewCardCandidatesBySkill(lessonId, user, targetSkill, pageable);
        } else {
            candidateList = lessonVocabularyRepository.findNewCardCandidates(lessonId, user, pageable);
        }
        if (candidateList == null || candidateList.isEmpty()) {
            return Collections.emptyList();
        }

        // 6. Map to DueCardResponse with isNew = true (preview only, creates zero CardProgress)
        List<DueCardResponse> results = new ArrayList<>(candidateList.size());
        for (LessonVocabulary lv : candidateList) {
            if (lv.getVocabulary() != null) {
                DueCardResponse dcr = DueCardResponse.fromVocabulary(lv.getVocabulary(), null);
                if (targetSkill != null) {
                    dcr.setCardType(targetSkill);
                }
                results.add(dcr);
            }
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getPracticeCards(Long lessonId) {
        return getPracticeCards(lessonId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DueCardResponse> getPracticeCards(Long lessonId, String cardType) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bài học không được để trống");
        }

        UserProfile user = resolveCurrentUserProfile();

        // 1. Validate lesson existence and approved status (ADR-01)
        if (lessonRepository != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));
            if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
            }
        }

        if (lessonVocabularyRepository == null) {
            return Collections.emptyList();
        }

        // 2. Fetch all lesson vocabularies strictly ordered by order_index ASC
        List<LessonVocabulary> lessonVocabList = lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(lessonId);
        if (lessonVocabList == null || lessonVocabList.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. Hydrate existing CardProgress if available (informational only, does not alter intervals)
        Set<Long> vocabIds = lessonVocabList.stream()
                .filter(lv -> lv.getVocabulary() != null)
                .map(lv -> lv.getVocabulary().getVocabId())
                .collect(Collectors.toSet());

        Map<Long, CardProgress> progressMap = Collections.emptyMap();
        String targetSkill = (cardType != null && !cardType.trim().isEmpty()) ? cardType.trim().toUpperCase() : null;

        if (!vocabIds.isEmpty() && cardProgressRepository != null) {
            List<CardProgress> userProgressList;
            if (targetSkill != null) {
                userProgressList = cardProgressRepository.findByUserAndItemTypeAndItemIdInAndCardType(
                        user, "VOCABULARY", vocabIds, targetSkill);
            } else {
                userProgressList = cardProgressRepository.findByUserAndItemTypeAndItemIdIn(
                        user, "VOCABULARY", vocabIds);
            }
            if (userProgressList != null && !userProgressList.isEmpty()) {
                progressMap = userProgressList.stream()
                        .collect(Collectors.toMap(CardProgress::getItemId, Function.identity(), (a, b) -> a));
            }
        }

        // 4. Map to DueCardResponse
        List<DueCardResponse> results = new ArrayList<>(lessonVocabList.size());
        for (LessonVocabulary lv : lessonVocabList) {
            if (lv.getVocabulary() != null) {
                CardProgress cp = progressMap.get(lv.getVocabulary().getVocabId());
                DueCardResponse dcr = DueCardResponse.fromVocabulary(lv.getVocabulary(), cp);
                if (targetSkill != null) {
                    dcr.setCardType(targetSkill);
                }
                results.add(dcr);
            }
        }

        return results;
    }

    @Override
    @Transactional
    public DueCardResponse reviewCard(ReviewCardRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Yêu cầu đánh giá thẻ không được để null");
        }

        // 1. Validate itemType
        if (request.getItemType() == null || request.getItemType().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại thẻ (itemType) không được để trống");
        }
        String itemTypeUpper = request.getItemType().trim().toUpperCase();
        if (!"VOCABULARY".equals(itemTypeUpper) && !"RADICAL".equals(itemTypeUpper)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại thẻ phải là VOCABULARY hoặc RADICAL");
        }

        // 2. Validate rating
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 4) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Điểm đánh giá phải từ 1 đến 4 (1=Again, 2=Hard, 3=Good, 4=Easy)");
        }

        // 3. Validate reviewTimeSeconds
        if (request.getReviewTimeSeconds() == null || request.getReviewTimeSeconds() < 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Thời gian phản xạ không được âm");
        }

        // 4. Validate item existence in catalog (polymorphic referential integrity & concurrency serialization R3.1A)
        Vocabulary vocab = null;
        Radical radical = null;
        if ("VOCABULARY".equals(itemTypeUpper)) {
            vocab = vocabularyRepository.findByIdWithLock(request.getItemId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng với ID: " + request.getItemId()));
        } else {
            radical = radicalRepository.findById(request.getItemId().intValue())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ID: " + request.getItemId()));
        }

        // 5. Resolve user profile with pessimistic lock to serialize quota-consuming reviews for this user (BE-CONC-002)
        UserProfile user = resolveCurrentUserProfileWithLock();

        // 6. Resolve user SRS settings and business calendar for new-card quota enforcement
        UserSrsSetting setting = userSrsSettingRepository.findByUser(user).orElse(null);
        LocalDateTime startOfDay = LocalDate.now(businessClock).atStartOfDay();

        // 7. Resolve cardType (defaults to READING if omitted for backward-compatibility with V19 migration)
        String rawCardType = request.getCardType();
        String cardTypeUpper = (rawCardType != null && !rawCardType.trim().isEmpty())
                ? rawCardType.trim().toUpperCase()
                : "READING";
        if (!"FLASHCARD".equals(cardTypeUpper) && !"LISTENING".equals(cardTypeUpper) && !"WRITING".equals(cardTypeUpper) && !"READING".equals(cardTypeUpper)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại thẻ (cardType) phải là FLASHCARD, LISTENING, WRITING hoặc READING");
        }

        // 8. Load existing progress or initialize new card progress (protected by @Version optimistic locking)
        Optional<CardProgress> optProgress;
        if (rawCardType != null && !rawCardType.trim().isEmpty()) {
            optProgress = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                    user, itemTypeUpper, request.getItemId(), cardTypeUpper);
        } else {
            // Safe lookup when cardType is omitted: start with READING (V19 legacy default)
            // to avoid NonUniqueResultException if multiple card types exist for this item.
            optProgress = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                    user, itemTypeUpper, request.getItemId(), "READING");
            if (optProgress.isEmpty()) {
                // Fallback to LISTENING
                optProgress = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                        user, itemTypeUpper, request.getItemId(), "LISTENING");
            }
            if (optProgress.isEmpty()) {
                // Fallback to WRITING
                optProgress = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                        user, itemTypeUpper, request.getItemId(), "WRITING");
            }
            if (optProgress.isEmpty()) {
                // Backward-compatibility fallback for legacy/unit tests mocking findByUserAndItemTypeAndItemId
                try {
                    optProgress = cardProgressRepository.findByUserAndItemTypeAndItemId(
                            user, itemTypeUpper, request.getItemId());
                } catch (Exception e) {
                    log.warn("Multiple card progress records found for user_id={}, itemType={}, itemId={} without cardType specified",
                            user.getUserId(), itemTypeUpper, request.getItemId());
                }
            }
        }
        boolean isNewCard = optProgress.isEmpty();

        // Enforce Due-Only policy on existing cards for Standard SRS mode (R2 Review Policy)
        // Scientific refinement: If an existing card is reviewed before its due date and the user rates AGAIN (1),
        // authoritative SM-2 / Anki principles mandate recording an immediate memory lapse (reset interval to 0).
        // Only early successful recall (Hard, Good, Easy) is blocked to prevent review-farming ahead of schedule.
        if (!isNewCard) {
            CardProgress existing = optProgress.get();
            if ((rawCardType == null || rawCardType.trim().isEmpty()) && existing.getCardType() != null) {
                cardTypeUpper = existing.getCardType();
            }
            LocalDateTime now = LocalDateTime.now(businessClock);
            if (existing.getIntervalDays() > 0 && existing.getNextReviewAt() != null && existing.getNextReviewAt().isAfter(now)) {
                if (request.getRating() != null && request.getRating() == 1) {
                    log.info("Early review lapse (Again) permitted for user_id={}, itemType={}, itemId={}, cardType={}",
                            user.getUserId(), itemTypeUpper, request.getItemId(), cardTypeUpper);
                } else {
                    log.warn("Card is not due yet for user_id={}, itemType={}, itemId={}, cardType={}, nextReviewAt={}",
                            user.getUserId(), itemTypeUpper, request.getItemId(), cardTypeUpper, existing.getNextReviewAt());
                    throw new BusinessException(ErrorCode.CONFLICT, "Thẻ chưa đến hạn ôn tập");
                }
            }
        }

        // Authoritative new-card eligibility & daily quota enforcement on first-ever review (R1-DEC-01..04 & R2.1)
        if (isNewCard && "VOCABULARY".equals(itemTypeUpper)) {
            // R2.1: Invariant — A vocabulary may only be introduced as a new card if it belongs to at least one Approved lesson
            boolean hasApprovedLesson = lessonVocabularyRepository.existsApprovedLessonForVocabulary(request.getItemId());
            if (!hasApprovedLesson) {
                log.warn("Vocabulary item_id={} does not belong to any Approved lesson, rejected new card creation for user_id={}",
                        request.getItemId(), user.getUserId());
                throw new BusinessException(ErrorCode.UNPROCESSABLE_ENTITY, "Từ vựng chưa thuộc bất kỳ bài học nào đã được phê duyệt để học mới");
            }

            int newCardsLimit = setting != null ? setting.getNewCardsPerDay() : 20;
            long newCardsIntroducedToday = countNewCardsIntroducedTodayWithLock(user, "VOCABULARY", startOfDay);
            if (newCardsIntroducedToday >= newCardsLimit) {
                log.warn("Learner user_id={} has reached daily new-card limit ({}/{})", user.getUserId(), newCardsIntroducedToday, newCardsLimit);
                throw new BusinessException(ErrorCode.CONFLICT, "Bạn đã đạt giới hạn học từ mới tối đa trong ngày (" + newCardsLimit + " từ)");
            }
        }

        CardProgress progress;
        int intervalBefore;
        BigDecimal currentEf;
        int currentRepetitions;

        if (!isNewCard) {
            progress = optProgress.get();
            if ((rawCardType == null || rawCardType.trim().isEmpty()) && progress.getCardType() != null) {
                cardTypeUpper = progress.getCardType();
            } else if (progress.getCardType() == null) {
                progress.setCardType(cardTypeUpper);
            }
            intervalBefore = progress.getIntervalDays();
            currentEf = progress.getEaseFactor();
            currentRepetitions = progress.getRepetitions();
        } else {
            progress = new CardProgress();
            progress.setUser(user);
            progress.setItemType(itemTypeUpper);
            progress.setItemId(request.getItemId());
            progress.setCardType(cardTypeUpper);
            progress.setEaseFactor(SrsCalculator.DEFAULT_EASE_FACTOR);
            progress.setIntervalDays(0);
            progress.setRepetitions(0);
            intervalBefore = 0;
            currentEf = SrsCalculator.DEFAULT_EASE_FACTOR;
            currentRepetitions = 0;
        }

        // 9. Delegate to pure mathematical SrsCalculator
        ReviewRating ratingEnum = ReviewRating.fromValue(request.getRating());
        LocalDateTime reviewedAt = LocalDateTime.now(businessClock);

        SrsCalculationResult calcResult;
        LocalDateTime nextReviewTime;

        if (testModeEnabled) {
            // =========================================================================
            // [CHẾ ĐỘ TEST SRS 2 PHÚT] TẠM THỜI KHÓA THUẬT TOÁN GỐC SM-2
            // Sử dụng thuật toán kiểm thử: Thẻ đến hạn sau khoảng 2 phút để kiểm tra và ôn lại ngay.
            // Để mở khóa lại thuật toán gốc SM-2, cấu hình: app.srs.test-mode.enabled=false
            // =========================================================================
            calcResult = testCalculator.calculate(currentEf, intervalBefore, currentRepetitions, ratingEnum, testIntervalMinutes);
            if (ratingEnum == ReviewRating.AGAIN) {
                nextReviewTime = reviewedAt; // Học lại ngay
            } else {
                nextReviewTime = reviewedAt.plusMinutes(testIntervalMinutes); // Đến hạn sau khoảng 2 phút!
            }
            log.info("[SRS TEST-MODE 2 PHÚT] Tạm thời khóa thuật toán gốc SM-2 để test SRS: " +
                            "user_id={}, itemType={}, itemId={}, cardType={}, rating={}, nextReviewAt sau {} phút: {}",
                    user.getUserId(), itemTypeUpper, request.getItemId(), cardTypeUpper, ratingEnum, testIntervalMinutes, nextReviewTime);
        } else {
            // =========================================================================
            // [THUẬT TOÁN GỐC SM-2] ĐƯỢC LƯU GIỮ NGUYÊN VẸN 100% (Tính theo ngày)
            // =========================================================================
            calcResult = srsCalculator.calculate(currentEf, intervalBefore, currentRepetitions, ratingEnum);
            if (calcResult.intervalDays() == 0) {
                nextReviewTime = reviewedAt; // due immediately for relearning today
            } else {
                nextReviewTime = reviewedAt.plusDays(calcResult.intervalDays());
            }
        }

        // 10. Gán next_review_at
        progress.setNextReviewAt(nextReviewTime);

        // 11. Update CardProgress state
        progress.setEaseFactor(calcResult.easeFactor());
        progress.setIntervalDays(calcResult.intervalDays());
        progress.setRepetitions(calcResult.repetitions());
        CardProgress savedProgress = cardProgressRepository.save(progress);

        // 12. Append immutable ReviewLog audit entry
        ReviewLog logEntry = new ReviewLog(
                user,
                itemTypeUpper,
                request.getItemId(),
                cardTypeUpper,
                request.getRating().byteValue(),
                intervalBefore,
                calcResult.intervalDays(),
                request.getReviewTimeSeconds()
        );
        logEntry.setReviewedAt(reviewedAt);
        reviewLogRepository.save(logEntry);

        log.info("SRS review processed: user_id={}, itemType={}, itemId={}, cardType={}, rating={}, interval: {} -> {}, EF: {} -> {}, isNewCard={}",
                user.getUserId(), itemTypeUpper, request.getItemId(), cardTypeUpper, request.getRating(),
                intervalBefore, calcResult.intervalDays(), currentEf, calcResult.easeFactor(), isNewCard);

        // 13. Return updated DueCardResponse
        if (vocab != null) {
            return DueCardResponse.fromVocabulary(vocab, savedProgress);
        } else {
            return DueCardResponse.fromRadical(radical, savedProgress);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StudyStatsResponse getStudyStats() {
        UserProfile user = resolveCurrentUserProfile();

        UserSrsSetting setting = userSrsSettingRepository.findByUser(user).orElse(null);
        int newLimit = setting != null ? setting.getNewCardsPerDay() : 20;
        int maxReviewLimit = setting != null ? setting.getMaxReviewPerDay() : 100;

        LocalDateTime now = LocalDateTime.now(businessClock);
        long cardsDue = cardProgressRepository.countByUserAndNextReviewAtLessThanEqual(user, now);
        long cardsDueListening = cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(user, "VOCABULARY", "LISTENING", now);
        long cardsDueWriting = cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(user, "VOCABULARY", "WRITING", now);
        long cardsDueReading = cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(user, "VOCABULARY", "READING", now);
        long cardsDueFlashcard = cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(user, "VOCABULARY", "FLASHCARD", now);

        LocalDateTime startOfDay = LocalDate.now(businessClock).atStartOfDay();
        long reviewsToday = reviewLogRepository.countByUserAndReviewedAtGreaterThanEqual(user, startOfDay);
        long newCardsToday = reviewLogRepository.countNewItemsIntroducedToday(user, "VOCABULARY", startOfDay);

        return new StudyStatsResponse(cardsDue, cardsDueListening, cardsDueWriting, cardsDueReading, cardsDueFlashcard, reviewsToday, newLimit, maxReviewLimit, newCardsToday);
    }

    @Override
    @Transactional(readOnly = true)
    public LessonSrsStatsResponse getLessonSrsStats(Long lessonId) {
        if (lessonId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bài học không được để trống");
        }
        UserProfile user = resolveCurrentUserProfile();

        // 1. Validate lesson existence and access permission
        if (lessonRepository != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId));
            if (!"Approved".equalsIgnoreCase(lesson.getStatus())) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                boolean isAdmin = auth != null && auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN") || a.getAuthority().equalsIgnoreCase("Admin"));
                boolean isCreator = user != null && user.getAccount() != null && lesson.getCreatedBy() != null
                        && lesson.getCreatedBy().getAccountId().equals(user.getAccount().getAccountId());
                if (!isAdmin && !isCreator) {
                    throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: " + lessonId);
                }
            }
        }

        LocalDateTime now = LocalDateTime.now(businessClock);
        int totalVocab = lessonVocabularyRepository != null
                ? (int) lessonVocabularyRepository.countByLesson_LessonId(lessonId)
                : 0;
        long newWordsCount = lessonVocabularyRepository != null
                ? lessonVocabularyRepository.countNewCardCandidates(lessonId, user)
                : 0L;
        long dueCount = cardProgressRepository != null
                ? cardProgressRepository.countDueCardsByLesson(user, lessonId, now)
                : 0L;
        long dueListening = cardProgressRepository != null
                ? cardProgressRepository.countDueCardsByLessonAndCardType(user, lessonId, "LISTENING", now)
                : 0L;
        long dueWriting = cardProgressRepository != null
                ? cardProgressRepository.countDueCardsByLessonAndCardType(user, lessonId, "WRITING", now)
                : 0L;
        long dueReading = cardProgressRepository != null
                ? cardProgressRepository.countDueCardsByLessonAndCardType(user, lessonId, "READING", now)
                : 0L;
        long dueFlashcard = cardProgressRepository != null
                ? cardProgressRepository.countDueCardsByLessonAndCardType(user, lessonId, "FLASHCARD", now)
                : 0L;

        return new LessonSrsStatsResponse(lessonId, totalVocab, newWordsCount, dueCount, dueListening, dueWriting, dueReading, dueFlashcard);
    }

    @Override
    @Transactional(readOnly = true)
    public CurriculumProgressResponse getCurriculumProgress() {
        UserProfile user = resolveCurrentUserProfile();

        List<Object[]> lessonCounts = cardProgressRepository != null
                ? cardProgressRepository.countLearnedVocabulariesByLessonForUser(user)
                : Collections.emptyList();
        Map<Long, Integer> lessonProgress = new HashMap<>();
        for (Object[] row : lessonCounts) {
            Long lessonId = ((Number) row[0]).longValue();
            Integer count = ((Number) row[1]).intValue();
            lessonProgress.put(lessonId, count);
        }

        List<Long> learnedRadicalIds = cardProgressRepository != null
                ? cardProgressRepository.findLearnedRadicalIdsForUser(user)
                : Collections.emptyList();
        List<Long> learnedVocabIds = cardProgressRepository != null
                ? cardProgressRepository.findLearnedVocabIdsForUser(user)
                : Collections.emptyList();

        Map<String, Integer> chapterProgress = new HashMap<>();
        Set<Long> radSet = new HashSet<>(learnedRadicalIds);

        // Radicals 214 chapters (11 stages of 20 items: 1..20, 21..40, ..., 201..214)
        for (int i = 0; i < 11; i++) {
            long start = i * 20L + 1L;
            long end = Math.min((i + 1) * 20L, 214L);
            int count = 0;
            for (long id = start; id <= end; id++) {
                if (radSet.contains(id)) {
                    count++;
                }
            }
            chapterProgress.put("radicals214_chapter_" + i, count);
        }

        // Radicals 50 stages (5 stages of 10 items mapped by commonRank)
        List<com.elearning.entity.Radical> commonRadicals = radicalRepository != null
                ? radicalRepository.findByCommonRankIsNotNullOrderByCommonRankAsc()
                : Collections.emptyList();

        for (int i = 0; i < 5; i++) {
            int count = 0;
            if (commonRadicals != null && !commonRadicals.isEmpty()) {
                int start = i * 10;
                int end = Math.min((i + 1) * 10, commonRadicals.size());
                for (int j = start; j < end; j++) {
                    com.elearning.entity.Radical r = commonRadicals.get(j);
                    if (r != null && r.getRadicalId() != null && radSet.contains(r.getRadicalId().longValue())) {
                        count++;
                    }
                }
            } else {
                long start = i * 10L + 1L;
                long end = Math.min((i + 1) * 10L, 50L);
                for (long id = start; id <= end; id++) {
                    if (radSet.contains(id)) {
                        count++;
                    }
                }
            }
            chapterProgress.put("radicals50_chapter_" + i, count);
        }

        return new CurriculumProgressResponse(
                lessonProgress,
                chapterProgress,
                learnedVocabIds.size(),
                learnedRadicalIds.size(),
                learnedVocabIds,
                learnedRadicalIds
        );
    }

    private UserProfile resolveCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        String emailOrPhone = authentication.getName();
        return userProfileRepository.findByAccountEmailOrPhone(emailOrPhone)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Không tìm thấy thông tin người dùng cho tài khoản: " + emailOrPhone));
    }

    private UserProfile resolveCurrentUserProfileWithLock() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn");
        }
        String emailOrPhone = authentication.getName();
        return userProfileRepository.findByAccountEmailOrPhoneWithLock(emailOrPhone)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Không tìm thấy thông tin người dùng cho tài khoản: " + emailOrPhone));
    }

    private long countNewCardsIntroducedTodayWithLock(UserProfile user, String itemType, LocalDateTime startOfDay) {
        return reviewLogRepository.countNewItemsIntroducedToday(user, itemType, startOfDay);
    }

    public boolean isTestModeEnabled() {
        return testModeEnabled;
    }

    public void setTestModeEnabled(boolean testModeEnabled) {
        this.testModeEnabled = testModeEnabled;
    }

    public int getTestIntervalMinutes() {
        return testIntervalMinutes;
    }

    public void setTestIntervalMinutes(int testIntervalMinutes) {
        this.testIntervalMinutes = testIntervalMinutes;
    }
}
