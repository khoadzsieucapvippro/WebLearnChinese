package com.elearning;

import com.elearning.entity.Radical;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.impl.ExcelParserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("Task R3.3: Chinese Domain, Kangxi Radicals & Linguistic Data Integrity Audit")
class ChineseDomainDataAuditTests {

    @Autowired
    private RadicalRepository radicalRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Nested
    @DisplayName("1. 214 Kangxi Radicals Database Integrity Audit")
    class KangxiRadicalsIntegrityTests {

        @Test
        @DisplayName("GIVEN database seed WHEN querying all radicals THEN exactly 214 records exist with contiguous IDs 1..214")
        void testRadicalCountAndIds() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));

            assertThat(radicals).hasSize(214);

            for (int i = 0; i < 214; i++) {
                int expectedId = i + 1;
                assertThat(radicals.get(i).getRadicalId()).isEqualTo(expectedId);
            }
        }

        @Test
        @DisplayName("GIVEN 214 radicals WHEN auditing character field THEN all 214 characters are unique and non-blank")
        void testRadicalCharactersUniqueAndNonBlank() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));
            Set<String> uniqueCharacters = new HashSet<>();

            for (Radical radical : radicals) {
                String character = radical.getCharacter();
                assertThat(character).isNotNull().isNotBlank();
                assertThat(uniqueCharacters.add(character))
                        .withFailMessage("Duplicate radical character found: %s at ID %d", character, radical.getRadicalId())
                        .isTrue();
            }
            assertThat(uniqueCharacters).hasSize(214);
        }

        @Test
        @DisplayName("GIVEN 214 radicals WHEN auditing Unicode code points THEN identify CJK Unified Ideographs vs Radical Symbols vs Supplements")
        void testRadicalUnicodeCodePointsAudit() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));

            int unifiedIdeographCount = 0;
            int compoundDisplayCount = 0;
            List<String> compoundList = new ArrayList<>();

            for (Radical radical : radicals) {
                String character = radical.getCharacter();
                if (character.contains("(") && character.contains(")")) {
                    compoundDisplayCount++;
                    compoundList.add(String.format("ID %d: %s", radical.getRadicalId(), character));
                } else {
                    int firstCodePoint = character.codePointAt(0);
                    // CJK Unified Ideographs block: 0x4E00 - 0x9FFF
                    if (firstCodePoint >= 0x4E00 && firstCodePoint <= 0x9FFF) {
                        unifiedIdeographCount++;
                    }
                }
            }

            // Verify empirical findings:
            // Exactly 43 radicals in the seed data use compound display strings with parentheses e.g. 人(亻), 刀(刂)
            // The remaining 171 are single CJK Unified Ideographs (43 + 171 = 214)
            assertThat(compoundDisplayCount).isEqualTo(43);
            assertThat(unifiedIdeographCount).isEqualTo(171);
            assertThat(compoundDisplayCount + unifiedIdeographCount).isEqualTo(214);
        }

        @Test
        @DisplayName("GIVEN 214 radicals WHEN auditing Pinyin data THEN verify zero missing Pinyin records after R3.8 correction")
        void testRadicalPinyinAudit() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));

            List<Integer> missingPinyinIds = new ArrayList<>();
            List<Integer> polyphoneSlashPinyinIds = new ArrayList<>();

            for (Radical radical : radicals) {
                String pinyin = radical.getPinyin();
                if (pinyin == null || pinyin.isBlank()) {
                    missingPinyinIds.add(radical.getRadicalId());
                } else if (pinyin.contains("/")) {
                    polyphoneSlashPinyinIds.add(radical.getRadicalId());
                }
            }

            // R3.8: All 214 radicals now have valid Pinyin; missingPinyinIds must be empty
            assertThat(missingPinyinIds).isEmpty();

            // Explicit verification of corrected radicals 49 (己 -> jǐ) and 172 (隹 -> zhuī)
            Radical radical49 = radicalRepository.findById(49)
                    .orElseThrow(() -> new AssertionError("Radical 49 not found"));
            assertThat(radical49.getCharacter()).isEqualTo("己");
            assertThat(radical49.getPinyin()).isEqualTo("jǐ");
            assertThat(radical49.getMeaningHanViet()).isEqualTo("Kỷ");
            assertThat(radical49.getMeaningVi()).isEqualTo("Bản thân mình");

            Radical radical172 = radicalRepository.findById(172)
                    .orElseThrow(() -> new AssertionError("Radical 172 not found"));
            assertThat(radical172.getCharacter()).isEqualTo("隹");
            assertThat(radical172.getPinyin()).isEqualTo("zhuī");
            assertThat(radical172.getMeaningHanViet()).isEqualTo("Chuy");
            assertThat(radical172.getMeaningVi()).isEqualTo("Chim đuôi ngắn");

            // Record 23 (匸) has slash 'xǐ/xì'
            assertThat(polyphoneSlashPinyinIds).contains(23);
        }

        @Test
        @DisplayName("GIVEN 214 radicals WHEN auditing Vietnamese meaning fields THEN meaning_han_viet and meaning_vi are 100% present")
        void testRadicalVietnameseMeaningAudit() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));

            int emptyHanVietCount = 0;
            int emptyMeaningViCount = 0;

            for (Radical radical : radicals) {
                if (radical.getMeaningHanViet() == null || radical.getMeaningHanViet().isBlank()) {
                    emptyHanVietCount++;
                }
                if (radical.getMeaningVi() == null || radical.getMeaningVi().isBlank()) {
                    emptyMeaningViCount++;
                }
            }

            // Han-Viet transliteration is 100% complete (214/214)
            assertThat(emptyHanVietCount).isEqualTo(0);

            // meaning_vi is seeded for all 214 records via V9
            assertThat(emptyMeaningViCount).isEqualTo(0);
        }

        @Test
        @DisplayName("GIVEN 214 radicals WHEN auditing pedagogical explanation fields THEN explanation_vi is 100% present, unique, and complies with schema limits")
        void testRadicalPedagogicalExplanationAudit() {
            List<Radical> radicals = radicalRepository.findAll(Sort.by(Sort.Direction.ASC, "radicalId"));

            assertThat(radicals).hasSize(214);
            Set<String> uniqueExplanations = new HashSet<>();
            List<Integer> invalidExplanationIds = new ArrayList<>();

            for (Radical radical : radicals) {
                String explanation = radical.getExplanationVi();
                if (explanation == null || explanation.isBlank() || explanation.length() > 1000) {
                    invalidExplanationIds.add(radical.getRadicalId());
                } else {
                    assertThat(explanation)
                            .withFailMessage("Radical ID %d missing 'Ví dụ:'", radical.getRadicalId())
                            .contains("Ví dụ:");
                    assertThat(explanation)
                            .withFailMessage("Radical ID %d missing 'Mẹo nhớ:'", radical.getRadicalId())
                            .contains("Mẹo nhớ:");
                    uniqueExplanations.add(explanation);
                }
            }

            // All 214 radicals have valid explanation_vi (214/214)
            assertThat(invalidExplanationIds).isEmpty();

            // All 214 explanations are strictly unique (no duplicate generic placeholders)
            assertThat(uniqueExplanations).hasSize(214);

            // Invariant: common_rank remains 1..50 for exactly 50 common radicals and null for 164
            long commonRankCount = radicals.stream().filter(r -> r.getCommonRank() != null).count();
            assertThat(commonRankCount).isEqualTo(50);

            // Regression assertions for Hanzi character decomposition correctness (no false component associations)
            // Radical 189 (高): must not reference 亮 or 亭 (they do not contain 高)
            String exp189 = radicals.get(188).getExplanationVi();
            assertThat(exp189).doesNotContain("亮").doesNotContain("亭").containsAnyOf("篙", "槁");

            // Radical 209 (鼻): must not reference 嗅 (contains 臭, not 鼻)
            String exp209 = radicals.get(208).getExplanationVi();
            assertThat(exp209).doesNotContain("嗅").contains("齁");

            // Radical 205 (黽): must not reference 勉 (contains 免, not 黾)
            String exp205 = radicals.get(204).getExplanationVi();
            assertThat(exp205).doesNotContain("勉").containsAnyOf("蝇", "黾", "黽");

            // Radical 139 (色): must not reference 爸 (contains 巴, not 色)
            String exp139 = radicals.get(138).getExplanationVi();
            assertThat(exp139).doesNotContain("爸").containsAnyOf("艴", "艳", "色");

            // Radical 143 (血): must not reference 众 (contains 人+人+人, not 血)
            String exp143 = radicals.get(142).getExplanationVi();
            assertThat(exp143).doesNotContain("众").containsAnyOf("恤", "衄");

            // Radical 144 (行): must not reference 律 or 术 (neither has radical 行)
            String exp144 = radicals.get(143).getExplanationVi();
            assertThat(exp144).doesNotContain("律").doesNotContain("术").containsAnyOf("衙", "衡", "街");

            // Radical 171 (隶): must not reference 康 (contains 氺, not 隶)
            String exp171 = radicals.get(170).getExplanationVi();
            assertThat(exp171).doesNotContain("康").containsAnyOf("肄", "隶");

            // Radical 214 (龠): must not reference simplified 钥 or 吁 (which simplified away from 龠)
            String exp214 = radicals.get(213).getExplanationVi();
            assertThat(exp214).doesNotContain("钥").doesNotContain("吁").containsAnyOf("鑰", "籲", "瀹");
        }
    }


    @Nested
    @DisplayName("2. Pinyin Raw Conversion & Search Semantics Audit")
    class PinyinRawSemanticsTests {

        @Test
        @DisplayName("GIVEN various pinyin tone representations WHEN converting to pinyinRaw THEN verify toneless conversion")
        void testToPinyinRawConversion() {
            // Standard tone marks
            assertThat(ExcelParserServiceImpl.toPinyinRaw("hǎo")).isEqualTo("hao");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("xué")).isEqualTo("xue");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("zhōng")).isEqualTo("zhong");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("guó")).isEqualTo("guo");

            // Umlaut ü cases
            assertThat(ExcelParserServiceImpl.toPinyinRaw("nǚ")).isEqualTo("nu");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("lǜ")).isEqualTo("lu");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("lü")).isEqualTo("lu");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("nv")).isEqualTo("nu");

            // Neutral tone
            assertThat(ExcelParserServiceImpl.toPinyinRaw("de")).isEqualTo("de");
            assertThat(ExcelParserServiceImpl.toPinyinRaw("ma")).isEqualTo("ma");

            // Whitespace and casing
            assertThat(ExcelParserServiceImpl.toPinyinRaw(" Nǐ Hǎo ")).isEqualTo("ni hao");
        }
    }

    @Nested
    @DisplayName("3. Unicode Code Point & Radical Identity Classification Audit")
    class UnicodeIdentityClassificationTests {

        @Test
        @DisplayName("GIVEN Kangxi Radical 1 '一' WHEN distinguishing Unicode code points THEN prove U+4E00 vs U+2F00 distinctness")
        void testUnicodeCodePointDistinction() {
            int cjkUnifiedIdeographOne = "一".codePointAt(0); // U+4E00
            int kangxiRadicalSymbolOne = "\u2F00".codePointAt(0); // U+2F00

            assertThat(cjkUnifiedIdeographOne).isEqualTo(0x4E00);
            assertThat(kangxiRadicalSymbolOne).isEqualTo(0x2F00);
            assertThat(cjkUnifiedIdeographOne).isNotEqualTo(kangxiRadicalSymbolOne);

            // Radicals table seed uses U+4E00 (CJK Unified Ideograph), NOT U+2F00
            Radical radical1 = radicalRepository.findById(1).orElseThrow();
            assertThat(radical1.getCharacter().codePointAt(0)).isEqualTo(0x4E00);
        }

        @Test
        @DisplayName("GIVEN Kangxi Radical 9 '人(亻)' WHEN analyzing presentation string THEN identify primary ideograph and component variant")
        void testCompoundRadicalPresentationAnalysis() {
            Radical radical9 = radicalRepository.findById(9).orElseThrow();
            String charString = radical9.getCharacter();

            assertThat(charString).isEqualTo("人(亻)");

            int primaryChar = charString.codePointAt(0);
            int variantChar = charString.codePointAt(2); // index 0: '人', 1: '(', 2: '亻'

            // '人' is CJK Unified Ideograph U+4EBA
            assertThat(primaryChar).isEqualTo(0x4EBA);

            // '亻' is CJK Unified Ideograph U+4EBB (Standing person radical form)
            assertThat(variantChar).isEqualTo(0x4EBB);
        }

        @Test
        @DisplayName("GIVEN Kangxi Radical 157 '足(𧾷)' WHEN analyzing supplementary ideograph THEN verify 4-byte surrogate pair handling")
        void testSupplementaryIdeographSurrogatePair() {
            Radical radical157 = radicalRepository.findById(157).orElseThrow();
            String charString = radical157.getCharacter();

            assertThat(charString).startsWith("足(");

            // Extract the variant code point inside parentheses
            int openParen = charString.indexOf('(');
            int closeParen = charString.indexOf(')');
            String inside = charString.substring(openParen + 1, closeParen);

            // '𧾷' is CJK Unified Ideographs Extension B: U+27FB7 (Supplementary Plane 2, code point > 0xFFFF)
            int codePoint = inside.codePointAt(0);
            assertThat(codePoint).isEqualTo(0x27FB7);

            // In Java UTF-16, U+27FB7 occupies 2 char code units (surrogate pair)
            assertThat(inside.length()).isEqualTo(2);
            assertThat(Character.isSupplementaryCodePoint(codePoint)).isTrue();
        }
    }

    @Nested
    @DisplayName("4. Vocabulary Linguistic Domain & Relationship Integrity Audit")
    class VocabularyDomainAndRelationshipAuditTests {

        @Test
        @DisplayName("GIVEN vocabulary creation WHEN testing polysemy vs homophones THEN verify composite uniqueness on (hanzi, pinyin_raw)")
        void testVocabularyUniquenessAndPolysemy() {
            // Case 1: Same hanzi, DIFFERENT pinyin_raw -> Allowed (e.g. 朝 cháo vs zhāo)
            Vocabulary vocab1 = new Vocabulary("朝", "cháo", "chao", "Triều", "Triều đại, hướng về");
            Vocabulary vocab2 = new Vocabulary("朝", "zhāo", "zhao", "Triêu", "Sáng sớm");

            vocabularyRepository.save(vocab1);
            vocabularyRepository.save(vocab2);
            vocabularyRepository.flush();

            assertThat(vocab1.getVocabId()).isNotNull();
            assertThat(vocab2.getVocabId()).isNotNull();
            assertThat(vocab1.getVocabId()).isNotEqualTo(vocab2.getVocabId());

            // Case 2: Different hanzi, SAME pinyin_raw -> Allowed (homophones e.g. 诗 shī vs 狮 shī)
            Vocabulary vocab3 = new Vocabulary("诗", "shī", "shi", "Thi", "Thơ ca");
            Vocabulary vocab4 = new Vocabulary("狮", "shī", "shi", "Sư", "Sư tử");

            vocabularyRepository.save(vocab3);
            vocabularyRepository.save(vocab4);
            vocabularyRepository.flush();

            assertThat(vocab3.getVocabId()).isNotNull();
            assertThat(vocab4.getVocabId()).isNotNull();
        }

        @Test
        @DisplayName("GIVEN vocabulary with linked radicals WHEN persisting VOCAB_RADICAL THEN verify composite PK and referential integrity")
        void testVocabRadicalRelationshipIntegrity() {
            Radical radHuman = radicalRepository.findById(9).orElseThrow(); // 人(亻)
            Radical radMouth = radicalRepository.findById(30).orElseThrow(); // 口

            Vocabulary vocab = new Vocabulary("保", "bǎo", "bao", "Bảo", "Bảo vệ, giữ gìn");
            vocab.addRadical(radHuman);

            Vocabulary saved = vocabularyRepository.save(vocab);
            vocabularyRepository.flush();

            assertThat(saved.getRadicals()).hasSize(1);
            assertThat(saved.getRadicals()).contains(radHuman);

            // Add second radical
            saved.addRadical(radMouth);
            vocabularyRepository.save(saved);
            vocabularyRepository.flush();

            assertThat(saved.getRadicals()).hasSize(2);
            assertThat(saved.getRadicals()).contains(radHuman, radMouth);
        }

        @Test
        @DisplayName("GIVEN database schema WHEN auditing HSK metadata THEN prove HSK level column is present in schema")
        void testHskMetadataImplemented() {
            // Documenting fact: HSK 3.0 metadata is present in Vocabulary entity and database table
            boolean hasHskField = false;
            for (java.lang.reflect.Field field : Vocabulary.class.getDeclaredFields()) {
                if (field.getName().toLowerCase().contains("hsk")) {
                    hasHskField = true;
                    break;
                }
            }
            assertThat(hasHskField).isTrue();

            Vocabulary vocab = new Vocabulary();
            vocab.setHskLevel(1);
            vocab.setHskStandard("HSK 3.0");
            assertThat(vocab.getHskLevel()).isEqualTo(1);
            assertThat(vocab.getHskStandard()).isEqualTo("HSK 3.0");
        }
    }
}
