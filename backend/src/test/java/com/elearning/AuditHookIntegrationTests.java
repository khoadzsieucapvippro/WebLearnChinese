package com.elearning;

import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.request.CreateRadicalRequest;
import com.elearning.dto.request.CreateVocabularyRequest;
import com.elearning.dto.request.RejectLessonRequest;
import com.elearning.dto.request.UpdateAccountRolesRequest;
import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.dto.request.UpdateRadicalRequest;
import com.elearning.dto.request.UpdateVocabularyRequest;
import com.elearning.entity.Account;
import com.elearning.entity.Lesson;
import com.elearning.entity.Radical;
import com.elearning.entity.Role;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.ModerationLogRepository;
import com.elearning.repository.PersonalNoteRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.ManagementAuditService;
import com.elearning.service.impl.AdminAccountServiceImpl;
import com.elearning.service.impl.AdminRoleServiceImpl;
import com.elearning.service.impl.ModerationServiceImpl;
import com.elearning.service.impl.RadicalServiceImpl;
import com.elearning.service.impl.VocabularyServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Audit Hook Integration Tests for 5 Admin Services")
class AuditHookIntegrationTests {

    @Mock
    private ManagementAuditService managementAuditService;

    // Repositories
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private LessonVocabularyRepository lessonVocabularyRepository;
    @Mock
    private ModerationLogRepository moderationLogRepository;
    @Mock
    private VocabularyRepository vocabularyRepository;
    @Mock
    private RadicalRepository radicalRepository;
    @Mock
    private PersonalNoteRepository personalNoteRepository;
    @Mock
    private CardProgressRepository cardProgressRepository;
    @Mock
    private ReviewLogRepository reviewLogRepository;

    @BeforeEach
    void setUpSecurity() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "moderator@elearning.com",
                "N/A",
                List.of(new SimpleGrantedAuthority("ROLE_Moderator"), new SimpleGrantedAuthority("ROLE_Admin"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("AdminRoleServiceImpl.updateAccountRoles invokes managementAuditService.logSuccess with USER_ROLE_UPDATE")
    void testAdminRoleService_emitsAuditLog() {
        AdminRoleServiceImpl roleService = new AdminRoleServiceImpl(roleRepository, accountRepository, managementAuditService);

        Role learnerRole = new Role(1, "Learner");
        Role moderatorRole = new Role(3, "Moderator");
        when(roleRepository.findAll()).thenReturn(List.of(learnerRole, moderatorRole));

        Account targetAccount = new Account();
        targetAccount.setAccountId(10L);
        targetAccount.setEmailOrPhone("user10@example.com");
        targetAccount.setStatus("Active");
        targetAccount.setRoles(new HashSet<>(Set.of(learnerRole)));

        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(targetAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(targetAccount);

        UpdateAccountRolesRequest request = new UpdateAccountRolesRequest();
        request.setRoles(List.of("Learner", "Moderator"));

        roleService.updateAccountRoles(10L, request, "admin@elearning.com");

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.USER_ROLE_UPDATE),
                eq(AuditResourceType.USER),
                eq("10"),
                anyString(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("AdminAccountServiceImpl.updateAccountStatus invokes managementAuditService.logSuccess with ACCOUNT_STATUS_UPDATE")
    void testAdminAccountService_emitsAuditLog() {
        AdminAccountServiceImpl accountService = new AdminAccountServiceImpl(accountRepository, roleRepository, managementAuditService);

        Account targetAccount = new Account();
        targetAccount.setAccountId(20L);
        targetAccount.setEmailOrPhone("user20@example.com");
        targetAccount.setStatus("Active");
        targetAccount.setRoles(Collections.emptySet());

        when(accountRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(targetAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(targetAccount);

        UpdateAccountStatusRequest request = new UpdateAccountStatusRequest();
        request.setStatus("Banned");

        accountService.updateAccountStatus(20L, request, "admin@elearning.com");

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.ACCOUNT_STATUS_UPDATE),
                eq(AuditResourceType.USER),
                eq("20"),
                anyString(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("ModerationServiceImpl.approveLesson invokes managementAuditService.logSuccess with LESSON_APPROVE")
    void testModerationService_approveEmitsAuditLog() {
        ModerationServiceImpl moderationService = new ModerationServiceImpl(
                lessonRepository, lessonVocabularyRepository, accountRepository, moderationLogRepository, managementAuditService);

        Account moderator = new Account();
        moderator.setAccountId(1L);
        moderator.setEmailOrPhone("moderator@elearning.com");
        when(accountRepository.findByEmailOrPhone("moderator@elearning.com")).thenReturn(Optional.of(moderator));

        Account creator = new Account();
        creator.setAccountId(2L);
        creator.setEmailOrPhone("creator@elearning.com");

        Lesson lesson = new Lesson();
        lesson.setLessonId(30L);
        lesson.setTitle("Bài 1");
        lesson.setStatus("Pending");
        lesson.setCreatedBy(creator);

        when(lessonRepository.findById(30L)).thenReturn(Optional.of(lesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(lesson);
        when(lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(30L)).thenReturn(Collections.emptyList());

        moderationService.approveLesson(30L, new ApproveLessonRequest());

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.LESSON_APPROVE),
                eq(AuditResourceType.LESSON),
                eq("30"),
                anyString(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("ModerationServiceImpl.rejectLesson invokes managementAuditService.logSuccess with LESSON_REJECT")
    void testModerationService_rejectEmitsAuditLog() {
        ModerationServiceImpl moderationService = new ModerationServiceImpl(
                lessonRepository, lessonVocabularyRepository, accountRepository, moderationLogRepository, managementAuditService);

        Account moderator = new Account();
        moderator.setAccountId(1L);
        moderator.setEmailOrPhone("moderator@elearning.com");
        when(accountRepository.findByEmailOrPhone("moderator@elearning.com")).thenReturn(Optional.of(moderator));

        Account creator = new Account();
        creator.setAccountId(2L);
        creator.setEmailOrPhone("creator@elearning.com");

        Lesson lesson = new Lesson();
        lesson.setLessonId(31L);
        lesson.setTitle("Bài 2");
        lesson.setStatus("Pending");
        lesson.setCreatedBy(creator);

        when(lessonRepository.findById(31L)).thenReturn(Optional.of(lesson));
        when(lessonRepository.save(any(Lesson.class))).thenReturn(lesson);
        when(lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(31L)).thenReturn(Collections.emptyList());

        RejectLessonRequest rejectRequest = new RejectLessonRequest();
        rejectRequest.setRejectionReason("Nội dung chưa đạt chuẩn HSK");
        rejectRequest.setFlaggedFields("title,description");

        moderationService.rejectLesson(31L, rejectRequest);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.LESSON_REJECT),
                eq(AuditResourceType.LESSON),
                eq("31"),
                anyString(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("VocabularyServiceImpl CRUD operations invoke managementAuditService.logSuccess")
    void testVocabularyService_emitsAuditLogs() {
        VocabularyServiceImpl vocabService = new VocabularyServiceImpl(
                vocabularyRepository, radicalRepository, lessonVocabularyRepository,
                personalNoteRepository, cardProgressRepository, reviewLogRepository, managementAuditService);

        // 1. Create
        CreateVocabularyRequest createReq = new CreateVocabularyRequest();
        createReq.setHanzi("学");
        createReq.setPinyin("xué");
        createReq.setMeaningVi("học");

        Vocabulary created = new Vocabulary();
        created.setVocabId(101L);
        created.setHanzi("学");
        created.setPinyin("xué");
        created.setPinyinRaw("xue");
        created.setMeaningVi("học");

        when(vocabularyRepository.findByHanziAndPinyinRaw("学", "xue")).thenReturn(Optional.empty());
        when(vocabularyRepository.save(any(Vocabulary.class))).thenReturn(created);

        vocabService.createVocabulary(createReq);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.VOCABULARY_CREATE),
                eq(AuditResourceType.VOCABULARY),
                eq("101"),
                anyString(),
                any(),
                any()
        );

        // 2. Update
        when(vocabularyRepository.findByIdWithLock(101L)).thenReturn(Optional.of(created));
        UpdateVocabularyRequest updateReq = new UpdateVocabularyRequest();
        updateReq.setHanzi("学");
        updateReq.setPinyin("xué");
        updateReq.setMeaningVi("học tập");

        vocabService.updateVocabulary(101L, updateReq);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.VOCABULARY_UPDATE),
                eq(AuditResourceType.VOCABULARY),
                eq("101"),
                anyString(),
                any(),
                any()
        );

        // 3. Delete
        vocabService.deleteVocabulary(101L);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.VOCABULARY_DELETE),
                eq(AuditResourceType.VOCABULARY),
                eq("101"),
                anyString(),
                any(),
                any()
        );
    }

    @Test
    @DisplayName("RadicalServiceImpl CRUD operations invoke managementAuditService.logSuccess")
    void testRadicalService_emitsAuditLogs() {
        RadicalServiceImpl radicalService = new RadicalServiceImpl(
                radicalRepository, cardProgressRepository, reviewLogRepository, managementAuditService);

        // 1. Create
        CreateRadicalRequest createReq = new CreateRadicalRequest();
        createReq.setCharacter("木");
        createReq.setPinyin("mù");
        createReq.setMeaningHanViet("Mộc");
        createReq.setMeaningVi("cây, gỗ");

        Radical savedRadical = new Radical();
        savedRadical.setRadicalId(75);
        savedRadical.setCharacter("木");
        savedRadical.setPinyin("mù");
        savedRadical.setMeaningHanViet("Mộc");
        savedRadical.setMeaningVi("cây, gỗ");

        when(radicalRepository.existsByCharacter("木")).thenReturn(false);
        when(radicalRepository.save(any(Radical.class))).thenReturn(savedRadical);

        radicalService.createRadical(createReq);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.RADICAL_CREATE),
                eq(AuditResourceType.RADICAL),
                eq("75"),
                anyString(),
                any(),
                any()
        );

        // 2. Update
        when(radicalRepository.findById(75)).thenReturn(Optional.of(savedRadical));
        UpdateRadicalRequest updateReq = new UpdateRadicalRequest();
        updateReq.setCharacter("木");
        updateReq.setPinyin("mù");
        updateReq.setMeaningHanViet("Mộc");
        updateReq.setMeaningVi("cây gỗ");

        radicalService.updateRadical(75, updateReq);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.RADICAL_UPDATE),
                eq(AuditResourceType.RADICAL),
                eq("75"),
                anyString(),
                any(),
                any()
        );

        // 3. Delete
        radicalService.deleteRadical(75);

        verify(managementAuditService).logSuccess(
                eq(AuditActionType.RADICAL_DELETE),
                eq(AuditResourceType.RADICAL),
                eq("75"),
                anyString(),
                any(),
                any()
        );
    }
}
