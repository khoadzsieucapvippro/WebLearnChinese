package com.elearning;

import com.elearning.entity.Radical;
import com.elearning.entity.Vocabulary;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
@DisplayName("Dictionary Persistence Mapping Tests (RADICAL, VOCABULARY, VOCAB_RADICAL)")
class DictionaryPersistenceTests {

    @Autowired
    private TestEntityManager entityManager;

    @Nested
    @DisplayName("Radical Persistence Tests")
    class RadicalTests {

        @Test
        @DisplayName("GIVEN valid Radical data WHEN persisted and reloaded THEN all columns retain correct values")
        void testPersistAndReloadRadical() {
            Radical radical = new Radical();
            radical.setCharacter("水");
            radical.setPinyin("shuǐ");
            radical.setMeaningHanViet("Thủy");
            radical.setMeaningVi("Nước");
            radical.setStrokeCount(4);
            radical.setAudioUrl("https://storage.example.com/audio/shui.mp3");
            radical.setVideoWritingUrl("https://storage.example.com/video/shui.mp4");

            Radical saved = entityManager.persistAndFlush(radical);
            Integer radicalId = saved.getRadicalId();
            entityManager.clear();

            Radical reloaded = entityManager.find(Radical.class, radicalId);
            assertThat(reloaded).isNotNull();
            assertThat(reloaded.getRadicalId()).isEqualTo(radicalId);
            assertThat(reloaded.getCharacter()).isEqualTo("水");
            assertThat(reloaded.getPinyin()).isEqualTo("shuǐ");
            assertThat(reloaded.getMeaningHanViet()).isEqualTo("Thủy");
            assertThat(reloaded.getMeaningVi()).isEqualTo("Nước");
            assertThat(reloaded.getStrokeCount()).isEqualTo(4);
            assertThat(reloaded.getAudioUrl()).isEqualTo("https://storage.example.com/audio/shui.mp3");
            assertThat(reloaded.getVideoWritingUrl()).isEqualTo("https://storage.example.com/video/shui.mp4");
            assertThat(reloaded.getCreatedAt()).isNotNull();
            assertThat(reloaded.getUpdatedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Vocabulary Persistence Tests")
    class VocabularyTests {

        @Test
        @DisplayName("GIVEN Vocabulary with distinct pinyin and pinyin_raw WHEN persisted THEN both values are preserved independently")
        void testPersistAndReloadVocabularyWithDistinctPinyin() {
            Vocabulary vocab = new Vocabulary();
            vocab.setHanzi("德语");
            vocab.setPinyin("déyǔ");
            vocab.setPinyinRaw("deyu");
            vocab.setMeaningHanViet("Đức ngữ");
            vocab.setMeaningVi("Tiếng Đức");
            vocab.setAudioUrl("https://storage.example.com/audio/deyu.mp3");
            vocab.setExampleSentence("我学习德语。");
            vocab.setExampleTranslation("Tôi học tiếng Đức.");

            Vocabulary saved = entityManager.persistAndFlush(vocab);
            Long vocabId = saved.getVocabId();
            entityManager.clear();

            Vocabulary reloaded = entityManager.find(Vocabulary.class, vocabId);
            assertThat(reloaded).isNotNull();
            assertThat(reloaded.getVocabId()).isEqualTo(vocabId);
            assertThat(reloaded.getHanzi()).isEqualTo("德语");
            assertThat(reloaded.getPinyin()).isEqualTo("déyǔ");
            assertThat(reloaded.getPinyinRaw()).isEqualTo("deyu");
            assertThat(reloaded.getPinyin()).isNotEqualTo(reloaded.getPinyinRaw());
            assertThat(reloaded.getMeaningHanViet()).isEqualTo("Đức ngữ");
            assertThat(reloaded.getMeaningVi()).isEqualTo("Tiếng Đức");
            assertThat(reloaded.getExampleSentence()).isEqualTo("我学习德语。");
            assertThat(reloaded.getExampleTranslation()).isEqualTo("Tôi học tiếng Đức.");
            assertThat(reloaded.getCreatedAt()).isNotNull();
            assertThat(reloaded.getUpdatedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Vocabulary ↔ Radical Many-to-Many Association Tests")
    class AssociationTests {

        @Test
        @DisplayName("GIVEN Vocabulary linked to multiple Radicals WHEN persisted THEN VOCAB_RADICAL rows are created and associations reloaded")
        void testVocabularyMultipleRadicalsAssociation() {
            // GIVEN: Obtain seeded radicals from database (seeded via V3__seed_radicals.sql)
            Radical radKou = entityManager.find(Radical.class, 30);
            Radical radMu = entityManager.find(Radical.class, 75);

            Vocabulary vocabXing = new Vocabulary();
            vocabXing.setHanzi("杏");
            vocabXing.setPinyin("xìng");
            vocabXing.setPinyinRaw("xing");
            vocabXing.setMeaningHanViet("Hạnh");
            vocabXing.setMeaningVi("Quả mơ, hạnh nhân");
            vocabXing.addRadical(radKou);
            vocabXing.addRadical(radMu);

            Vocabulary savedVocab = entityManager.persistAndFlush(vocabXing);
            Long vocabId = savedVocab.getVocabId();
            entityManager.clear();

            Vocabulary reloadedVocab = entityManager.find(Vocabulary.class, vocabId);
            assertThat(reloadedVocab).isNotNull();
            assertThat(reloadedVocab.getRadicals()).hasSize(2);
            assertThat(reloadedVocab.getRadicals())
                    .extracting(Radical::getCharacter)
                    .containsExactlyInAnyOrder("口", "木");

            // Verify physical composite key in VOCAB_RADICAL table
            @SuppressWarnings("unchecked")
            List<Object[]> junctionRows = entityManager.getEntityManager()
                    .createNativeQuery("SELECT vocab_id, radical_id FROM vocab_radical WHERE vocab_id = :vId")
                    .setParameter("vId", vocabId)
                    .getResultList();

            assertThat(junctionRows).hasSize(2);
        }

        @Test
        @DisplayName("GIVEN Radical linked to multiple Vocabularies WHEN reloaded from reverse side THEN associations are correct")
        void testReverseAssociationFromRadicalToVocabularies() {
            // GIVEN: Obtain seeded radical from database (seeded via V3__seed_radicals.sql)
            Radical radMu = entityManager.find(Radical.class, 75);

            Vocabulary vocabLin = new Vocabulary();
            vocabLin.setHanzi("林");
            vocabLin.setPinyin("lín");
            vocabLin.setPinyinRaw("lin");
            vocabLin.setMeaningHanViet("Lâm");
            vocabLin.setMeaningVi("Rừng nhỏ");
            vocabLin.addRadical(radMu);
            entityManager.persist(vocabLin);

            Vocabulary vocabSen = new Vocabulary();
            vocabSen.setHanzi("森");
            vocabSen.setPinyin("sēn");
            vocabSen.setPinyinRaw("sen");
            vocabSen.setMeaningHanViet("Sâm");
            vocabSen.setMeaningVi("Rừng rậm");
            vocabSen.addRadical(radMu);
            entityManager.persist(vocabSen);
            entityManager.flush();

            Integer radicalId = radMu.getRadicalId();
            entityManager.clear();

            Radical reloadedRadical = entityManager.find(Radical.class, radicalId);
            assertThat(reloadedRadical).isNotNull();
            assertThat(reloadedRadical.getVocabularies())
                    .extracting(Vocabulary::getHanzi)
                    .contains("林", "森");
        }

        @Test
        @DisplayName("GIVEN duplicate Radical added in memory WHEN persisted THEN Set semantics prevent duplicate junction rows")
        void testSetSemanticsPreventDuplicateJunctionRows() {
            Radical radHuo = new Radical();
            radHuo.setCharacter("火");
            radHuo.setPinyin("huǒ");
            radHuo.setMeaningHanViet("Hỏa");
            radHuo.setMeaningVi("Lửa");
            radHuo.setStrokeCount(4);
            entityManager.persist(radHuo);
            entityManager.flush();

            Vocabulary vocabYan = new Vocabulary();
            vocabYan.setHanzi("炎");
            vocabYan.setPinyin("yán");
            vocabYan.setPinyinRaw("yan");
            vocabYan.setMeaningHanViet("Viêm");
            vocabYan.setMeaningVi("Nóng, viêm sưng");
            vocabYan.addRadical(radHuo);
            vocabYan.addRadical(radHuo); // duplicate add

            Vocabulary saved = entityManager.persistAndFlush(vocabYan);
            Long vocabId = saved.getVocabId();
            entityManager.clear();

            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.getEntityManager()
                    .createNativeQuery("SELECT vocab_id, radical_id FROM vocab_radical WHERE vocab_id = :vId")
                    .setParameter("vId", vocabId)
                    .getResultList();

            assertThat(rows).hasSize(1);
        }

        @Test
        @DisplayName("GIVEN multi-character Vocabulary with repeated radical across characters WHEN persisted THEN separate rows are created with respective hanzi_char")
        void testMultiCharacterRepeatedRadicalsAssociation() {
            Radical radRen = entityManager.find(Radical.class, 9); // 亻 (Nhân)

            Vocabulary vocabNiMen = new Vocabulary();
            vocabNiMen.setHanzi("你们");
            vocabNiMen.setPinyin("nǐmen");
            vocabNiMen.setPinyinRaw("nimen");
            vocabNiMen.setMeaningHanViet("Nhĩ môn");
            vocabNiMen.setMeaningVi("Các bạn");
            vocabNiMen.addRadical(radRen, "你");
            vocabNiMen.addRadical(radRen, "们");

            Vocabulary savedVocab = entityManager.persistAndFlush(vocabNiMen);
            Long vocabId = savedVocab.getVocabId();
            entityManager.clear();

            Vocabulary reloadedVocab = entityManager.find(Vocabulary.class, vocabId);
            assertThat(reloadedVocab).isNotNull();
            assertThat(reloadedVocab.getVocabRadicals()).hasSize(2);
            assertThat(reloadedVocab.getVocabRadicals())
                    .extracting(com.elearning.entity.VocabRadical::getHanziChar)
                    .containsExactlyInAnyOrder("你", "们");

            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.getEntityManager()
                    .createNativeQuery("SELECT vocab_id, radical_id, hanzi_char FROM vocab_radical WHERE vocab_id = :vId")
                    .setParameter("vId", vocabId)
                    .getResultList();

            assertThat(rows).hasSize(2);
        }

        @Test
        @DisplayName("GIVEN seeded vocabulary from V25 WHEN querying VOCAB_RADICAL THEN component_type differentiates kangxi_radical from structural_component")
        void testSeededVocabRadicalComponentTypeClassification() {
            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.getEntityManager()
                    .createNativeQuery("SELECT vr.component_type, r.character, vr.hanzi_char FROM vocab_radical vr " +
                            "JOIN radical r ON vr.radical_id = r.radical_id " +
                            "WHERE vr.component_type IN ('kangxi_radical', 'structural_component')")
                    .setMaxResults(100)
                    .getResultList();

            assertThat(rows).isNotEmpty();
            boolean hasKangxi = rows.stream().anyMatch(r -> "kangxi_radical".equals(r[0]));
            boolean hasComponent = rows.stream().anyMatch(r -> "structural_component".equals(r[0]));
            assertThat(hasKangxi).as("Database must contain classified kangxi_radical entries").isTrue();
            assertThat(hasComponent).as("Database must contain classified structural_component entries").isTrue();

            // Verify specific character '你' has primary radical 9 (亻) classified as kangxi_radical
            @SuppressWarnings("unchecked")
            List<Object[]> niRows = entityManager.getEntityManager()
                    .createNativeQuery("SELECT vr.component_type, vr.hanzi_char FROM vocab_radical vr " +
                            "WHERE vr.hanzi_char = '你' AND vr.radical_id = 9")
                    .getResultList();

            if (!niRows.isEmpty()) {
                assertThat(niRows.get(0)[0]).isEqualTo("kangxi_radical");
                assertThat(niRows.get(0)[1]).isEqualTo("你");
            }
        }
    }
}
