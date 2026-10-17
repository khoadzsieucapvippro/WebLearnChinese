package com.elearning.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.util.Objects;

/**
 * JPA Entity mapping table VOCAB_RADICAL.
 * Represents association between Vocabulary and Kangxi Radical with Hanzi character attribution (hanzi_char).
 */
@Entity
@Table(name = "vocab_radical")
public class VocabRadical {

    @EmbeddedId
    private VocabRadicalId id = new VocabRadicalId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("vocabId")
    @JoinColumn(name = "vocab_id", nullable = false)
    private Vocabulary vocabulary;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("radicalId")
    @JoinColumn(name = "radical_id", nullable = false)
    private Radical radical;

    @Column(name = "hanzi_char", length = 10)
    private String hanziChar;

    public VocabRadical() {
    }

    public VocabRadical(Vocabulary vocabulary, Radical radical, String hanziChar) {
        this.vocabulary = vocabulary;
        this.radical = radical;
        this.hanziChar = hanziChar;
        Long vId = vocabulary != null ? vocabulary.getVocabId() : null;
        Integer rId = radical != null ? radical.getRadicalId() : null;
        this.id = new VocabRadicalId(vId, rId);
    }

    public VocabRadicalId getId() {
        if (id == null) {
            id = new VocabRadicalId();
        }
        if (id.getVocabId() == null && vocabulary != null && vocabulary.getVocabId() != null) {
            id.setVocabId(vocabulary.getVocabId());
        }
        if (id.getRadicalId() == null && radical != null && radical.getRadicalId() != null) {
            id.setRadicalId(radical.getRadicalId());
        }
        return id;
    }

    public void setId(VocabRadicalId id) {
        this.id = id;
    }

    public Vocabulary getVocabulary() {
        return vocabulary;
    }

    public void setVocabulary(Vocabulary vocabulary) {
        this.vocabulary = vocabulary;
        if (this.id != null) {
            this.id.setVocabId(vocabulary != null ? vocabulary.getVocabId() : null);
        }
    }

    public Radical getRadical() {
        return radical;
    }

    public void setRadical(Radical radical) {
        this.radical = radical;
        if (this.id != null) {
            this.id.setRadicalId(radical != null ? radical.getRadicalId() : null);
        }
    }

    public String getHanziChar() {
        return hanziChar;
    }

    public void setHanziChar(String hanziChar) {
        this.hanziChar = hanziChar;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VocabRadical that)) return false;
        VocabRadicalId thisId = this.getId();
        VocabRadicalId thatId = that.getId();
        if (thisId != null && thatId != null
                && thisId.getVocabId() != null && thatId.getVocabId() != null
                && thisId.getRadicalId() != null && thatId.getRadicalId() != null) {
            return Objects.equals(thisId, thatId);
        }
        return Objects.equals(this.vocabulary, that.vocabulary) && Objects.equals(this.radical, that.radical);
    }

    @Override
    public int hashCode() {
        return Objects.hash(radical != null ? radical.getRadicalId() : null);
    }
}
