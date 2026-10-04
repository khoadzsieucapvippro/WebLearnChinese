package com.elearning.dto.request;

/**
 * Encapsulates search and filtering criteria for the Vocabulary catalog.
 * Supports multi-criteria querying by:
 * - hanzi: Chinese word characters
 * - pinyin: Accented pinyin
 * - pinyinRaw: Toneless pinyin
 * - radicalId: Filter by constituent Kangxi radical ID
 * - search: Unified search keyword across hanzi, pinyin, and pinyin_raw (matching API.md section 2.2)
 *
 * Pagination and sorting are handled orthogonally via Spring Data {@link org.springframework.data.domain.Pageable}.
 */
public class VocabularySearchCriteria {

    private String hanzi;
    private String pinyin;
    private String pinyinRaw;
    private Integer radicalId;
    private String search;
    private Integer hskLevel;

    public VocabularySearchCriteria() {
    }

    public VocabularySearchCriteria(String hanzi, String pinyin, String pinyinRaw, Integer radicalId, String search) {
        this(hanzi, pinyin, pinyinRaw, radicalId, search, null);
    }

    public VocabularySearchCriteria(String hanzi, String pinyin, String pinyinRaw, Integer radicalId, String search, Integer hskLevel) {
        this.hanzi = hanzi;
        this.pinyin = pinyin;
        this.pinyinRaw = pinyinRaw;
        this.radicalId = radicalId;
        this.search = search;
        this.hskLevel = hskLevel;
    }

    public static VocabularySearchCriteria byKeyword(String search) {
        VocabularySearchCriteria criteria = new VocabularySearchCriteria();
        criteria.setSearch(search);
        return criteria;
    }

    public static VocabularySearchCriteria byKeywordAndHsk(String search, Integer hskLevel) {
        VocabularySearchCriteria criteria = new VocabularySearchCriteria();
        criteria.setSearch(search);
        criteria.setHskLevel(hskLevel);
        return criteria;
    }

    public boolean isEmpty() {
        return isBlank(hanzi) && isBlank(pinyin) && isBlank(pinyinRaw) && radicalId == null && isBlank(search) && hskLevel == null;
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
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

    public Integer getRadicalId() {
        return radicalId;
    }

    public void setRadicalId(Integer radicalId) {
        this.radicalId = radicalId;
    }

    public String getSearch() {
        return search;
    }

    public void setSearch(String search) {
        this.search = search;
    }

    public Integer getHskLevel() {
        return hskLevel;
    }

    public void setHskLevel(Integer hskLevel) {
        this.hskLevel = hskLevel;
    }

    @Override
    public String toString() {
        return "VocabularySearchCriteria{" +
                "hanzi='" + hanzi + '\'' +
                ", pinyin='" + pinyin + '\'' +
                ", pinyinRaw='" + pinyinRaw + '\'' +
                ", radicalId=" + radicalId +
                ", search='" + search + '\'' +
                ", hskLevel=" + hskLevel +
                '}';
    }
}
