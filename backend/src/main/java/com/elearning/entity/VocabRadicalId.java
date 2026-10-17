package com.elearning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite primary key for {@link VocabRadical} entity.
 * Maps to physical composite primary key (vocab_id, radical_id).
 */
@Embeddable
public class VocabRadicalId implements Serializable {

    @Column(name = "vocab_id")
    private Long vocabId;

    @Column(name = "radical_id")
    private Integer radicalId;

    public VocabRadicalId() {
    }

    public VocabRadicalId(Long vocabId, Integer radicalId) {
        this.vocabId = vocabId;
        this.radicalId = radicalId;
    }

    public Long getVocabId() {
        return vocabId;
    }

    public void setVocabId(Long vocabId) {
        this.vocabId = vocabId;
    }

    public Integer getRadicalId() {
        return radicalId;
    }

    public void setRadicalId(Integer radicalId) {
        this.radicalId = radicalId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VocabRadicalId that)) return false;
        return Objects.equals(vocabId, that.vocabId) && Objects.equals(radicalId, that.radicalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(vocabId, radicalId);
    }
}
