package com.elearning.service.impl;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.CreateRadicalRequest;
import com.elearning.dto.request.UpdateRadicalRequest;
import com.elearning.dto.response.RadicalDetailResponse;
import com.elearning.dto.response.RadicalResponse;
import com.elearning.entity.Radical;
import com.elearning.exception.BusinessException;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.service.RadicalService;
import com.elearning.common.AuditActionType;
import com.elearning.common.AuditResourceType;
import com.elearning.service.ManagementAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of {@link RadicalService} managing catalog and lookup operations for 214 Kangxi radicals.
 * Fully decoupled from Vocabulary domain (vocabulary operations belong to Module 4B).
 */
@Service
@Transactional(readOnly = true)
public class RadicalServiceImpl implements RadicalService {

    private final RadicalRepository radicalRepository;
    private final CardProgressRepository cardProgressRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final ManagementAuditService managementAuditService;

    @Autowired
    public RadicalServiceImpl(RadicalRepository radicalRepository,
                              CardProgressRepository cardProgressRepository,
                              ReviewLogRepository reviewLogRepository,
                              ManagementAuditService managementAuditService) {
        this.radicalRepository = radicalRepository;
        this.cardProgressRepository = cardProgressRepository;
        this.reviewLogRepository = reviewLogRepository;
        this.managementAuditService = managementAuditService;
    }

    public RadicalServiceImpl(RadicalRepository radicalRepository,
                              CardProgressRepository cardProgressRepository,
                              ReviewLogRepository reviewLogRepository) {
        this(radicalRepository, cardProgressRepository, reviewLogRepository, null);
    }

    @Override
    public Page<RadicalResponse> getAllRadicals(Pageable pageable) {
        Pageable effectivePageable = pageable;
        if (pageable != null && pageable.getSort().isUnsorted()) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("radicalId").ascending());
        }
        return radicalRepository.findAll(effectivePageable != null ? effectivePageable : PageRequest.of(0, 20, Sort.by("radicalId").ascending()))
                .map(RadicalResponse::fromEntity);
    }

    @Override
    public List<RadicalResponse> getAllRadicals() {
        return radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"))
                .stream()
                .map(RadicalResponse::fromEntity)
                .toList();
    }

    @Override
    public RadicalDetailResponse getRadicalById(Integer radicalId) {
        if (radicalId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bộ thủ không được để trống");
        }
        Radical radical = radicalRepository.findById(radicalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ID: " + radicalId));

        return RadicalDetailResponse.fromEntity(radical);
    }

    @Override
    public RadicalDetailResponse getRadicalByCharacter(String character) {
        if (character == null || character.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ký tự bộ thủ không được để trống");
        }
        Radical radical = radicalRepository.findByCharacter(character.trim())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ký tự: " + character));

        return RadicalDetailResponse.fromEntity(radical);
    }

    private void validateCommonRank(Integer commonRank) {
        if (commonRank != null && (commonRank < 1 || commonRank > 50)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Thứ hạng thông dụng phải từ 1 đến 50");
        }
    }

    @Override
    @Transactional
    public RadicalDetailResponse createRadical(CreateRadicalRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu tạo bộ thủ không được để trống");
        }
        String character = request.getCharacter() != null ? request.getCharacter().trim() : "";
        if (character.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ký tự bộ thủ không được để trống");
        }
        if (radicalRepository.existsByCharacter(character)) {
            throw new BusinessException(ErrorCode.CONFLICT, "Bộ thủ với ký tự '" + character + "' đã tồn tại");
        }

        validateCommonRank(request.getCommonRank());
        if (request.getCommonRank() != null && radicalRepository.existsByCommonRank(request.getCommonRank())) {
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Thứ hạng thông dụng '" + request.getCommonRank() + "' đã được gán cho bộ thủ khác");
        }

        Radical radical = new Radical();
        radical.setCharacter(character);
        radical.setPinyin(request.getPinyin() != null ? request.getPinyin().trim() : "");
        radical.setMeaningHanViet(request.getMeaningHanViet() != null ? request.getMeaningHanViet().trim() : "");
        radical.setMeaningVi(request.getMeaningVi() != null ? request.getMeaningVi().trim() : "");
        radical.setAudioUrl(request.getAudioUrl());
        radical.setVideoWritingUrl(request.getVideoWritingUrl());
        radical.setExplanationVi(request.getExplanationVi() != null && !request.getExplanationVi().trim().isEmpty()
                ? request.getExplanationVi().trim() : null);
        radical.setCommonRank(request.getCommonRank());

        Radical saved = radicalRepository.save(radical);
        RadicalDetailResponse response = RadicalDetailResponse.fromEntity(saved);

        if (managementAuditService != null) {
            String details = String.format("Thêm bộ thủ mới: %s (%s - %s)",
                    saved.getCharacter(), saved.getPinyin(), saved.getMeaningHanViet());
            managementAuditService.logSuccess(
                    AuditActionType.RADICAL_CREATE,
                    AuditResourceType.RADICAL,
                    String.valueOf(saved.getRadicalId()),
                    details,
                    null,
                    response
            );
        }

        return response;
    }

    @Override
    @Transactional
    public RadicalDetailResponse updateRadical(Integer radicalId, UpdateRadicalRequest request) {
        if (radicalId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bộ thủ không được để trống");
        }
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dữ liệu cập nhật bộ thủ không được để trống");
        }
        Radical radical = radicalRepository.findById(radicalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ID: " + radicalId));

        RadicalDetailResponse beforeSnapshot = RadicalDetailResponse.fromEntity(radical);

        String character = request.getCharacter() != null ? request.getCharacter().trim() : "";
        if (character.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Ký tự bộ thủ không được để trống");
        }

        if (!character.equals(radical.getCharacter())) {
            Optional<Radical> existing = radicalRepository.findByCharacter(character);
            if (existing.isPresent() && !existing.get().getRadicalId().equals(radicalId)) {
                throw new BusinessException(ErrorCode.CONFLICT, "Bộ thủ với ký tự '" + character + "' đã tồn tại");
            }
        }

        validateCommonRank(request.getCommonRank());
        if (request.getCommonRank() != null) {
            Optional<Radical> existingRank = radicalRepository.findByCommonRank(request.getCommonRank());
            if (existingRank.isPresent() && !existingRank.get().getRadicalId().equals(radicalId)) {
                throw new BusinessException(ErrorCode.CONFLICT,
                        "Thứ hạng thông dụng '" + request.getCommonRank() + "' đã được gán cho bộ thủ khác");
            }
        }

        radical.setCharacter(character);
        radical.setPinyin(request.getPinyin() != null ? request.getPinyin().trim() : "");
        radical.setMeaningHanViet(request.getMeaningHanViet() != null ? request.getMeaningHanViet().trim() : "");
        radical.setMeaningVi(request.getMeaningVi() != null ? request.getMeaningVi().trim() : "");
        radical.setAudioUrl(request.getAudioUrl());
        radical.setVideoWritingUrl(request.getVideoWritingUrl());
        radical.setExplanationVi(request.getExplanationVi() != null && !request.getExplanationVi().trim().isEmpty()
                ? request.getExplanationVi().trim() : null);
        radical.setCommonRank(request.getCommonRank());

        Radical updated = radicalRepository.save(radical);
        RadicalDetailResponse response = RadicalDetailResponse.fromEntity(updated);

        if (managementAuditService != null) {
            String details = String.format("Cập nhật bộ thủ #%d: %s (%s - %s)",
                    updated.getRadicalId(), updated.getCharacter(), updated.getPinyin(), updated.getMeaningHanViet());
            managementAuditService.logSuccess(
                    AuditActionType.RADICAL_UPDATE,
                    AuditResourceType.RADICAL,
                    String.valueOf(updated.getRadicalId()),
                    details,
                    beforeSnapshot,
                    response
            );
        }

        return response;
    }

    @Override
    @Transactional
    public void deleteRadical(Integer radicalId) {
        if (radicalId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "ID bộ thủ không được để trống");
        }
        Radical radical = radicalRepository.findById(radicalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ID: " + radicalId));

        RadicalDetailResponse beforeSnapshot = RadicalDetailResponse.fromEntity(radical);

        if (radical.getVocabularies() != null && !radical.getVocabularies().isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, "Không thể xóa bộ thủ đang được liên kết với " + radical.getVocabularies().size() + " từ vựng.");
        }

        boolean hasProgress = cardProgressRepository.existsByItemTypeAndItemId("RADICAL", Long.valueOf(radicalId));
        boolean hasReviews = reviewLogRepository.existsByItemTypeAndItemId("RADICAL", Long.valueOf(radicalId));
        if (hasProgress || hasReviews) {
            throw new BusinessException(ErrorCode.CONFLICT, "Không thể xóa bộ thủ vì đang có tiến độ học tập (SRS) của học viên");
        }

        try {
            radicalRepository.delete(radical);
            radicalRepository.flush();

            if (managementAuditService != null) {
                String details = String.format("Xóa bộ thủ #%d: %s (%s - %s)",
                        radicalId, radical.getCharacter(), radical.getPinyin(), radical.getMeaningHanViet());
                managementAuditService.logSuccess(
                        AuditActionType.RADICAL_DELETE,
                        AuditResourceType.RADICAL,
                        String.valueOf(radicalId),
                        details,
                        beforeSnapshot,
                        null
                );
            }
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BusinessException(ErrorCode.CONFLICT, "Không thể xóa bộ thủ do có dữ liệu liên kết ràng buộc");
        }
    }
}
