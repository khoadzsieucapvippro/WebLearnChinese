package com.elearning.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.util.AbstractSet;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Objects;
import java.util.Set;

/**
 * JPA Entity mapping table VOCABULARY.
 * Preserves independent pinyin (with tone marks) and pinyin_raw (toneless).
 */
@Entity
@Table(name = "vocabulary", uniqueConstraints = {
        @UniqueConstraint(name = "uk_vocab_hanzi_pinyin_raw", columnNames = {"hanzi", "pinyin_raw"})
})
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocab_id")
    private Long vocabId;

    @Column(name = "hanzi", nullable = false, length = 50)
    private String hanzi;

    @Column(name = "pinyin", nullable = false, length = 100)
    private String pinyin;

    @Column(name = "pinyin_raw", nullable = false, length = 100)
    private String pinyinRaw;

    @Column(name = "meaning_han_viet", nullable = false, length = 100)
    private String meaningHanViet;

    @Column(name = "meaning_vi", nullable = false, length = 255)
    private String meaningVi;

    @Column(name = "hsk_level", columnDefinition = "TINYINT UNSIGNED")
    private Integer hskLevel;

    @Column(name = "hsk_standard", length = 20)
    private String hskStandard = "HSK 3.0";

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "video_writing_url", length = 500)
    private String videoWritingUrl;

    @Column(name = "example_sentence", length = 500)
    private String exampleSentence;

    @Column(name = "example_translation", length = 500)
    private String exampleTranslation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "vocabulary", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<VocabRadical> vocabRadicals = new HashSet<>();

    public Vocabulary() {
    }

    public Vocabulary(String hanzi, String pinyin, String pinyinRaw, String meaningHanViet, String meaningVi) {
        this.hanzi = hanzi;
        this.pinyin = pinyin;
        this.pinyinRaw = pinyinRaw;
        this.meaningHanViet = meaningHanViet;
        this.meaningVi = meaningVi;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addRadical(Radical radical) {
        addRadical(radical, this.hanzi != null && this.hanzi.length() == 1 ? this.hanzi : null);
    }

    public void addRadical(Radical radical, String hanziChar) {
        if (radical != null) {
            for (VocabRadical existingVr : this.vocabRadicals) {
                if (Objects.equals(existingVr.getRadical(), radical)) {
                    if (hanziChar != null) {
                        existingVr.setHanziChar(hanziChar);
                    }
                    return;
                }
            }
            VocabRadical vr = new VocabRadical(this, radical, hanziChar);
            this.vocabRadicals.add(vr);
            if (radical.getVocabRadicals() != null) {
                radical.getVocabRadicals().add(vr);
            }
            if (this.vocabId != null && vr.getId() != null) {
                vr.getId().setVocabId(this.vocabId);
            }
        }
    }

    public void removeRadical(Radical radical) {
        if (radical != null) {
            Iterator<VocabRadical> it = this.vocabRadicals.iterator();
            while (it.hasNext()) {
                VocabRadical vr = it.next();
                if (Objects.equals(vr.getRadical(), radical)) {
                    it.remove();
                    if (radical.getVocabRadicals() != null) {
                        radical.getVocabRadicals().remove(vr);
                    }
                }
            }
        }
    }

    public Long getVocabId() {
        return vocabId;
    }

    public void setVocabId(Long vocabId) {
        this.vocabId = vocabId;
        if (vocabId != null && this.vocabRadicals != null) {
            for (VocabRadical vr : this.vocabRadicals) {
                if (vr.getId() != null) {
                    vr.getId().setVocabId(vocabId);
                }
            }
        }
    }

    public String getHanzi() {
        return hanzi;
    }

    public void setHanzi(String hanzi) {
        this.hanzi = hanzi;
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin;
    }

    public String getPinyinRaw() {
        return pinyinRaw;
    }

    public void setPinyinRaw(String pinyinRaw) {
        this.pinyinRaw = pinyinRaw;
    }

    public String getMeaningHanViet() {
        return meaningHanViet;
    }

    public void setMeaningHanViet(String meaningHanViet) {
        this.meaningHanViet = meaningHanViet;
    }

    public String getMeaningVi() {
        return meaningVi;
    }

    public void setMeaningVi(String meaningVi) {
        this.meaningVi = meaningVi;
    }

    public Integer getHskLevel() {
        return hskLevel;
    }

    public void setHskLevel(Integer hskLevel) {
        this.hskLevel = hskLevel;
    }

    public String getHskStandard() {
        return hskStandard;
    }

    public void setHskStandard(String hskStandard) {
        this.hskStandard = hskStandard;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getVideoWritingUrl() {
        return videoWritingUrl;
    }

    public void setVideoWritingUrl(String videoWritingUrl) {
        this.videoWritingUrl = videoWritingUrl;
    }

    public String getExampleSentence() {
        return exampleSentence;
    }

    public void setExampleSentence(String exampleSentence) {
        this.exampleSentence = exampleSentence;
    }

    public String getExampleTranslation() {
        return exampleTranslation;
    }

    public void setExampleTranslation(String exampleTranslation) {
        this.exampleTranslation = exampleTranslation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Set<VocabRadical> getVocabRadicals() {
        if (vocabRadicals != null && this.vocabId != null) {
            for (VocabRadical vr : vocabRadicals) {
                if (vr.getId() != null && vr.getId().getVocabId() == null) {
                    vr.getId().setVocabId(this.vocabId);
                }
            }
        }
        return vocabRadicals;
    }

    public void setVocabRadicals(Set<VocabRadical> vocabRadicals) {
        this.vocabRadicals = vocabRadicals != null ? vocabRadicals : new HashSet<>();
    }

    public Set<Radical> getRadicals() {
        return new AbstractSet<Radical>() {
            @Override
            public Iterator<Radical> iterator() {
                Iterator<VocabRadical> it = vocabRadicals.iterator();
                return new Iterator<Radical>() {
                    @Override
                    public boolean hasNext() {
                        return it.hasNext();
                    }

                    @Override
                    public Radical next() {
                        return it.next().getRadical();
                    }

                    @Override
                    public void remove() {
                        it.remove();
                    }
                };
            }

            @Override
            public int size() {
                return vocabRadicals.size();
            }

            @Override
            public boolean add(Radical radical) {
                if (radical == null) return false;
                for (VocabRadical vr : vocabRadicals) {
                    if (Objects.equals(vr.getRadical(), radical)) {
                        return false;
                    }
                }
                addRadical(radical);
                return true;
            }

            @Override
            public boolean remove(Object o) {
                if (!(o instanceof Radical r)) return false;
                Iterator<VocabRadical> it = vocabRadicals.iterator();
                while (it.hasNext()) {
                    VocabRadical vr = it.next();
                    if (Objects.equals(vr.getRadical(), r)) {
                        it.remove();
                        if (r.getVocabRadicals() != null) {
                            r.getVocabRadicals().remove(vr);
                        }
                        return true;
                    }
                }
                return false;
            }

            @Override
            public boolean contains(Object o) {
                if (!(o instanceof Radical r)) return false;
                for (VocabRadical vr : vocabRadicals) {
                    if (Objects.equals(vr.getRadical(), r)) {
                        return true;
                    }
                }
                return false;
            }

            @Override
            public void clear() {
                for (VocabRadical vr : vocabRadicals) {
                    if (vr.getRadical() != null && vr.getRadical().getVocabRadicals() != null) {
                        vr.getRadical().getVocabRadicals().remove(vr);
                    }
                }
                vocabRadicals.clear();
            }
        };
    }

    public void setRadicals(Set<Radical> radicals) {
        getRadicals().clear();
        if (radicals != null) {
            for (Radical radical : radicals) {
                getRadicals().add(radical);
            }
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Vocabulary other)) return false;
        return vocabId != null && vocabId.equals(other.vocabId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
