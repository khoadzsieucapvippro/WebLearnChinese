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
import java.util.HashSet;
import java.util.Iterator;
import java.util.Objects;
import java.util.Set;

/**
 * JPA Entity mapping table RADICAL (214 Kangxi radicals).
 */
@Entity
@Table(name = "radical", uniqueConstraints = {
        @UniqueConstraint(name = "uk_radical_character", columnNames = {"character"})
})
public class Radical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "radical_id")
    private Integer radicalId;

    @Column(name = "`character`", nullable = false, length = 10, unique = true)
    private String character;

    @Column(name = "pinyin", nullable = false, length = 50)
    private String pinyin;

    @Column(name = "meaning_han_viet", nullable = false, length = 100)
    private String meaningHanViet;

    @Column(name = "meaning_vi", nullable = false, length = 255)
    private String meaningVi;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "video_writing_url", length = 500)
    private String videoWritingUrl;

    @Column(name = "explanation_vi", length = 1000)
    private String explanationVi;

    @Column(name = "common_rank", columnDefinition = "TINYINT UNSIGNED")
    private Integer commonRank;

    @Column(name = "stroke_count", columnDefinition = "TINYINT UNSIGNED", nullable = false)
    private Integer strokeCount = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "radical", fetch = FetchType.LAZY)
    private Set<VocabRadical> vocabRadicals = new HashSet<>();

    public Radical() {
    }

    public Radical(Integer radicalId, String character, String pinyin, String meaningHanViet, String meaningVi) {
        this(radicalId, character, pinyin, meaningHanViet, meaningVi, null);
    }

    public Radical(Integer radicalId, String character, String pinyin, String meaningHanViet, String meaningVi, Integer strokeCount) {
        this.radicalId = radicalId;
        this.character = character;
        this.pinyin = pinyin;
        this.meaningHanViet = meaningHanViet;
        this.meaningVi = meaningVi;
        this.strokeCount = strokeCount != null ? strokeCount : 1;
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
        if (this.strokeCount == null) {
            this.strokeCount = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Integer getRadicalId() {
        return radicalId;
    }

    public void setRadicalId(Integer radicalId) {
        this.radicalId = radicalId;
    }

    public String getCharacter() {
        return character;
    }

    public void setCharacter(String character) {
        this.character = character;
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin;
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

    public String getExplanationVi() {
        return explanationVi;
    }

    public void setExplanationVi(String explanationVi) {
        this.explanationVi = explanationVi;
    }

    public Integer getCommonRank() {
        return commonRank;
    }

    public void setCommonRank(Integer commonRank) {
        this.commonRank = commonRank;
    }

    public Integer getStrokeCount() {
        return strokeCount;
    }

    public void setStrokeCount(Integer strokeCount) {
        this.strokeCount = strokeCount;
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
        return vocabRadicals;
    }

    public void setVocabRadicals(Set<VocabRadical> vocabRadicals) {
        this.vocabRadicals = vocabRadicals != null ? vocabRadicals : new HashSet<>();
    }

    public Set<Vocabulary> getVocabularies() {
        return new AbstractSet<Vocabulary>() {
            @Override
            public Iterator<Vocabulary> iterator() {
                Iterator<VocabRadical> it = vocabRadicals.iterator();
                return new Iterator<Vocabulary>() {
                    @Override
                    public boolean hasNext() {
                        return it.hasNext();
                    }

                    @Override
                    public Vocabulary next() {
                        return it.next().getVocabulary();
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
            public boolean add(Vocabulary vocabulary) {
                if (vocabulary == null) return false;
                for (VocabRadical vr : vocabRadicals) {
                    if (Objects.equals(vr.getVocabulary(), vocabulary)) {
                        return false;
                    }
                }
                VocabRadical vr = new VocabRadical(vocabulary, Radical.this, null);
                vocabRadicals.add(vr);
                if (vocabulary.getVocabRadicals() != null) {
                    vocabulary.getVocabRadicals().add(vr);
                }
                return true;
            }

            @Override
            public boolean remove(Object o) {
                if (!(o instanceof Vocabulary v)) return false;
                Iterator<VocabRadical> it = vocabRadicals.iterator();
                while (it.hasNext()) {
                    VocabRadical vr = it.next();
                    if (Objects.equals(vr.getVocabulary(), v)) {
                        it.remove();
                        if (v.getVocabRadicals() != null) {
                            v.getVocabRadicals().remove(vr);
                        }
                        return true;
                    }
                }
                return false;
            }

            @Override
            public boolean contains(Object o) {
                if (!(o instanceof Vocabulary v)) return false;
                for (VocabRadical vr : vocabRadicals) {
                    if (Objects.equals(vr.getVocabulary(), v)) {
                        return true;
                    }
                }
                return false;
            }

            @Override
            public void clear() {
                for (VocabRadical vr : vocabRadicals) {
                    if (vr.getVocabulary() != null && vr.getVocabulary().getVocabRadicals() != null) {
                        vr.getVocabulary().getVocabRadicals().remove(vr);
                    }
                }
                vocabRadicals.clear();
            }
        };
    }

    public void addVocabulary(Vocabulary vocab) {
        if (vocab != null) {
            getVocabularies().add(vocab);
        }
    }

    public void removeVocabulary(Vocabulary vocab) {
        if (vocab != null) {
            getVocabularies().remove(vocab);
        }
    }

    public void setVocabularies(Set<Vocabulary> vocabularies) {
        getVocabularies().clear();
        if (vocabularies != null) {
            for (Vocabulary vocab : vocabularies) {
                getVocabularies().add(vocab);
            }
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Radical other)) return false;
        return radicalId != null && radicalId.equals(other.radicalId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
