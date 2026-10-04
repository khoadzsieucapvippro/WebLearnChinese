package com.elearning;

import com.elearning.entity.Radical;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.VocabularyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=validate"
})
@DisplayName("Dictionary Spring Data JPA Repository Tests (RadicalRepository, VocabularyRepository)")
class DictionaryRepositoryTests {

    @Autowired
    private RadicalRepository radicalRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Nested
    @DisplayName("RadicalRepository Tests")
    class RadicalRepositoryTests {

        @Test
        @DisplayName("GIVEN existing Radical WHEN findByCharacter THEN returns correct Radical in Optional")
        void testFindByCharacterExisting() {
            Radical radical = new Radical();
            radical.setCharacter("水");
            radical.setPinyin("shuǐ");
            radical.setMeaningHanViet("Thủy");
            radical.setMeaningVi("Nước");
            entityManager.persistAndFlush(radical);
            entityManager.clear();

            Optional<Radical> found = radicalRepository.findByCharacter("水");

            assertThat(found).isPresent();
            assertThat(found.get().getCharacter()).isEqualTo("水");
            assertThat(found.get().getPinyin()).isEqualTo("shuǐ");
            assertThat(found.get().getMeaningHanViet()).isEqualTo("Thủy");
        }

        @Test
        @DisplayName("GIVEN nonexistent character WHEN findByCharacter THEN returns Optional.empty()")
        void testFindByCharacterNotFound() {
            Optional<Radical> found = radicalRepository.findByCharacter("龘");

            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("GIVEN character WHEN existsByCharacter THEN returns true for existing and false for missing")
        void testExistsByCharacter() {
            Radical radical = new Radical();
            radical.setCharacter("火");
            radical.setPinyin("huǒ");
            radical.setMeaningHanViet("Hỏa");
            radical.setMeaningVi("Lửa");
            entityManager.persistAndFlush(radical);
            entityManager.clear();

            assertThat(radicalRepository.existsByCharacter("火")).isTrue();
            assertThat(radicalRepository.existsByCharacter("無")).isFalse();
        }
    }

    @Nested
    @DisplayName("VocabularyRepository Search and Pagination Tests")
    class VocabularyRepositoryTests {

        @Test
        @DisplayName("GIVEN hanzi and pinyinRaw matching unique constraint WHEN findByHanziAndPinyinRaw THEN returns correct Vocabulary")
        void testFindByHanziAndPinyinRaw() {
            Optional<Vocabulary> found = vocabularyRepository.findByHanziAndPinyinRaw("学", "xue");
            assertThat(found).isPresent();
            assertThat(found.get().getHanzi()).isEqualTo("学");
            assertThat(found.get().getPinyinRaw()).isEqualTo("xue");

            Optional<Vocabulary> missing = vocabularyRepository.findByHanziAndPinyinRaw("学", "wrong_raw");
            assertThat(missing).isEmpty();
        }

        @Test
        @DisplayName("GIVEN multiple records WHEN findByHanzi with Pageable THEN returns paginated results")
        void testFindByHanziWithPagination() {
            Vocabulary v1 = new Vocabulary("朝", "cháo", "chao", "Triều", "Triều đại");
            Vocabulary v2 = new Vocabulary("朝", "zhāo", "zhao", "Triêu", "Sáng sớm");
            entityManager.persist(v1);
            entityManager.persist(v2);
            entityManager.flush();
            entityManager.clear();

            Page<Vocabulary> page = vocabularyRepository.findByHanzi("朝", PageRequest.of(0, 10));

            assertThat(page).isNotNull();
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent()).extracting(Vocabulary::getPinyinRaw)
                    .containsExactlyInAnyOrder("chao", "zhao");
        }

        @Test
        @DisplayName("GIVEN multiple records WHEN findByPinyinRaw with Pageable THEN returns paginated results")
        void testFindByPinyinRawWithPagination() {
            Vocabulary v1 = new Vocabulary("埋", "mái", "mai_test", "Mai", "Chôn cất");
            Vocabulary v2 = new Vocabulary("脉", "mài", "mai_test", "Mạch", "Mạch máu");
            entityManager.persist(v1);
            entityManager.persist(v2);
            entityManager.flush();
            entityManager.clear();

            Page<Vocabulary> page = vocabularyRepository.findByPinyinRaw("mai_test", PageRequest.of(0, 10));

            assertThat(page).isNotNull();
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent()).extracting(Vocabulary::getHanzi)
                    .containsExactlyInAnyOrder("埋", "脉");
        }

        @Test
        @DisplayName("GIVEN search keyword WHEN searchByKeyword THEN matches hanzi, pinyin, or pinyinRaw")
        void testSearchByKeywordCombined() {
            Vocabulary v1 = new Vocabulary("测中A", "cèzhōng_a", "cezhong_a", "Trắc Trung A", "Mô tả A");
            Vocabulary v2 = new Vocabulary("测北B", "cèběi_b", "cebei_b", "Trắc Bắc B", "Mô tả B");
            Vocabulary v3 = new Vocabulary("测中C", "cèzhōng_c", "cezhong_c", "Trắc Trung C", "Mô tả C");
            entityManager.persist(v1);
            entityManager.persist(v2);
            entityManager.persist(v3);
            entityManager.flush();
            entityManager.clear();

            // Match by Hanzi substring
            Page<Vocabulary> hanziMatches = vocabularyRepository.searchByKeyword("测中", PageRequest.of(0, 10));
            assertThat(hanziMatches.getContent()).extracting(Vocabulary::getHanzi)
                    .containsExactlyInAnyOrder("测中A", "测中C");

            // Match by pinyin substring
            Page<Vocabulary> pinyinMatches = vocabularyRepository.searchByKeyword("cèběi", PageRequest.of(0, 10));
            assertThat(pinyinMatches.getContent()).extracting(Vocabulary::getHanzi)
                    .containsExactly("测北B");

            // Match by pinyin_raw substring (tone-less search)
            Page<Vocabulary> pinyinRawMatches = vocabularyRepository.searchByKeyword("cezhong", PageRequest.of(0, 10));
            assertThat(pinyinRawMatches.getContent()).extracting(Vocabulary::getHanzi)
                    .containsExactlyInAnyOrder("测中A", "测中C");

            // Non-matching keyword
            Page<Vocabulary> noMatches = vocabularyRepository.searchByKeyword("nonexistent_vocab", PageRequest.of(0, 10));
            assertThat(noMatches.getTotalElements()).isZero();
            assertThat(noMatches.getContent()).isEmpty();
        }

        @Test
        @DisplayName("GIVEN N records WHEN querying pages THEN pagination metadata is completely accurate")
        void testPaginationMetadata() {
            for (int i = 1; i <= 5; i++) {
                Vocabulary v = new Vocabulary("测" + i, "cè" + i, "pagtest" + i, "Trắc" + i, "Nghĩa " + i);
                entityManager.persist(v);
            }
            entityManager.flush();
            entityManager.clear();

            // Page 0 (size 2) -> items 1, 2
            Page<Vocabulary> page0 = vocabularyRepository.searchByKeyword("pagtest", PageRequest.of(0, 2, Sort.by("vocabId").ascending()));
            assertThat(page0.getNumber()).isEqualTo(0);
            assertThat(page0.getSize()).isEqualTo(2);
            assertThat(page0.getNumberOfElements()).isEqualTo(2);
            assertThat(page0.getTotalElements()).isEqualTo(5);
            assertThat(page0.getTotalPages()).isEqualTo(3);
            assertThat(page0.hasNext()).isTrue();

            // Page 2 (size 2) -> item 5 (last page)
            Page<Vocabulary> page2 = vocabularyRepository.searchByKeyword("pagtest", PageRequest.of(2, 2, Sort.by("vocabId").ascending()));
            assertThat(page2.getNumber()).isEqualTo(2);
            assertThat(page2.getNumberOfElements()).isEqualTo(1);
            assertThat(page2.hasNext()).isFalse();

            // Page 3 (size 2) -> empty page
            Page<Vocabulary> page3 = vocabularyRepository.searchByKeyword("pagtest", PageRequest.of(3, 2, Sort.by("vocabId").ascending()));
            assertThat(page3.getNumber()).isEqualTo(3);
            assertThat(page3.getNumberOfElements()).isZero();
            assertThat(page3.getContent()).isEmpty();
            assertThat(page3.getTotalElements()).isEqualTo(5);
        }
    }
}
