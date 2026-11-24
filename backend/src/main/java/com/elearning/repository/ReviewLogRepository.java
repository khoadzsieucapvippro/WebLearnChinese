package com.elearning.repository;

import com.elearning.entity.ReviewLog;
import com.elearning.entity.UserProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewLogRepository extends JpaRepository<ReviewLog, Long> {

    List<ReviewLog> findByUserOrderByReviewedAtDesc(UserProfile user);

    Page<ReviewLog> findByUserOrderByReviewedAtDesc(UserProfile user, Pageable pageable);

    List<ReviewLog> findByUserAndItemTypeAndItemIdOrderByReviewedAtDesc(UserProfile user, String itemType, Long itemId);

    boolean existsByUserAndItemTypeAndItemId(UserProfile user, String itemType, Long itemId);

    long countByUserAndReviewedAtGreaterThanEqual(UserProfile user, LocalDateTime startOfDay);

    long countByUserAndItemTypeAndReviewedAtGreaterThanEqual(UserProfile user, String itemType, LocalDateTime startOfDay);

    /**
     * Finds list of ReviewLog IDs for the user created on or after startOfDay with pessimistic write lock (SELECT ... FOR UPDATE).
     * Used in reviewCard() to bypass MySQL REPEATABLE READ transaction snapshot and read the authoritative latest count (BE-CONC-002).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r.logId FROM ReviewLog r WHERE r.user = :user AND r.reviewedAt >= :startOfDay")
    List<Long> findTodayLogIdsWithLock(@Param("user") UserProfile user, @Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Counts the number of unique items (item_id) first introduced today by the user.
     * An item is defined as first introduced today if it has at least one ReviewLog on or after startOfDay
     * and zero ReviewLog records before startOfDay (R1-DEC-04).
     *
     * @param user the user profile
     * @param itemType the item type filter (e.g. "VOCABULARY")
     * @param startOfDay start of the current business day
     * @return count of unique items first reviewed today
     */
    @Query("SELECT COUNT(DISTINCT r.itemId) FROM ReviewLog r " +
           "WHERE r.user = :user " +
           "  AND r.itemType = :itemType " +
           "  AND r.reviewedAt >= :startOfDay " +
           "  AND NOT EXISTS (" +
           "      SELECT 1 FROM ReviewLog r2 " +
           "      WHERE r2.user = :user " +
           "        AND r2.itemType = :itemType " +
           "        AND r2.itemId = r.itemId " +
           "        AND r2.reviewedAt < :startOfDay" +
           "  )")
    long countNewItemsIntroducedToday(
            @Param("user") UserProfile user,
            @Param("itemType") String itemType,
            @Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Finds list of ReviewLog entries for the user created on or after startOfDay with pessimistic write lock (SELECT ... FOR UPDATE).
     * Used in reviewCard() to bypass MySQL REPEATABLE READ transaction snapshot and read authoritative latest logs (BE-CONC-002).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ReviewLog r WHERE r.user = :user AND r.reviewedAt >= :startOfDay")
    List<ReviewLog> findTodayReviewLogsWithLock(@Param("user") UserProfile user, @Param("startOfDay") LocalDateTime startOfDay);

    boolean existsByUserAndItemTypeAndItemIdAndReviewedAtLessThan(UserProfile user, String itemType, Long itemId, LocalDateTime startOfDay);

    /**
     * Checks whether any review log entries exist for the given polymorphic item pair (R3.1).
     * Used during vocabulary deletion to prevent orphaning immutable study history.
     *
     * @param itemType polymorphic item type (e.g. "VOCABULARY")
     * @param itemId the item primary key ID
     * @return true if review logs exist, false otherwise
     */
    boolean existsByItemTypeAndItemId(String itemType, Long itemId);

    /**
     * Finds the earliest review timestamp per distinct item ID for a user and item type.
     * Used to determine when each vocabulary item was first learned without double-counting
     * across subsequent review days, months, or quarters.
     *
     * @param user the user profile
     * @param itemType polymorphic item type (e.g. "VOCABULARY")
     * @return list of [itemId, firstReviewedAt] pairs
     */
    @Query("SELECT r.itemId, MIN(r.reviewedAt) FROM ReviewLog r " +
           "WHERE r.user = :user AND r.itemType = :itemType " +
           "GROUP BY r.itemId")
    List<Object[]> findFirstReviewedAtByUserAndItemType(
            @Param("user") UserProfile user,
            @Param("itemType") String itemType);

    /**
     * Finds [itemId, reviewedAt] pairs for the user and item type within [start, end).
     * Leverages idx_review_log_user_date (user_id, reviewed_at) for periodic aggregation.
     *
     * @param user the user profile
     * @param itemType polymorphic item type (e.g. "VOCABULARY")
     * @param start inclusive window start timestamp
     * @param end exclusive window end timestamp
     * @return list of [itemId, reviewedAt] pairs
     */
    @Query("SELECT r.itemId, r.reviewedAt, r.cardType FROM ReviewLog r " +
           "WHERE r.user = :user AND r.itemType = :itemType " +
           "  AND r.reviewedAt >= :start AND r.reviewedAt < :end")
    List<Object[]> findItemReviewedAtInRange(
            @Param("user") UserProfile user,
            @Param("itemType") String itemType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Finds the earliest review timestamp per distinct (itemType, itemId) across all study items
     * (both VOCABULARY and RADICAL) for a user.
     *
     * @param user the user profile
     * @return list of [itemType, itemId, firstReviewedAt] tuples
     */
    @Query("SELECT r.itemType, r.itemId, MIN(r.reviewedAt) FROM ReviewLog r " +
           "WHERE r.user = :user " +
           "GROUP BY r.itemType, r.itemId")
    List<Object[]> findFirstReviewedAtByUser(@Param("user") UserProfile user);

    /**
     * Finds the earliest review timestamp per distinct (itemType, itemId) across all study items
     * filtered by skill cardType.
     *
     * @param user the user profile
     * @param cardType skill card type ("FLASHCARD", "READING", "LISTENING", "WRITING")
     * @return list of [itemType, itemId, firstReviewedAt] tuples
     */
    @Query("SELECT r.itemType, r.itemId, MIN(r.reviewedAt) FROM ReviewLog r " +
           "WHERE r.user = :user AND r.cardType = :cardType " +
           "GROUP BY r.itemType, r.itemId")
    List<Object[]> findFirstReviewedAtByUserAndCardType(
            @Param("user") UserProfile user,
            @Param("cardType") String cardType);

    /**
     * Finds [itemType, itemId, reviewedAt, cardType] tuples for the user within [start, end)
     * across both VOCABULARY and RADICAL items.
     */
    @Query("SELECT r.itemType, r.itemId, r.reviewedAt, r.cardType FROM ReviewLog r " +
           "WHERE r.user = :user " +
           "  AND r.reviewedAt >= :start AND r.reviewedAt < :end")
    List<Object[]> findActivityInRangeByUser(
            @Param("user") UserProfile user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Finds [itemType, itemId, reviewedAt, cardType] tuples for the user and skill cardType within [start, end).
     */
    @Query("SELECT r.itemType, r.itemId, r.reviewedAt, r.cardType FROM ReviewLog r " +
           "WHERE r.user = :user AND r.cardType = :cardType " +
           "  AND r.reviewedAt >= :start AND r.reviewedAt < :end")
    List<Object[]> findActivityInRangeByUserAndCardType(
            @Param("user") UserProfile user,
            @Param("cardType") String cardType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Finds the earliest review timestamp per distinct item ID for a specific skill cardType.
     *
     * @param user the user profile
     * @param itemType polymorphic item type (e.g. "VOCABULARY")
     * @param cardType skill card type ("FLASHCARD", "READING", "LISTENING", "WRITING")
     * @return list of [itemId, firstReviewedAt] pairs
     */
    @Query("SELECT r.itemId, MIN(r.reviewedAt) FROM ReviewLog r " +
           "WHERE r.user = :user AND r.itemType = :itemType AND r.cardType = :cardType " +
           "GROUP BY r.itemId")
    List<Object[]> findFirstReviewedAtByUserAndItemTypeAndCardType(
            @Param("user") UserProfile user,
            @Param("itemType") String itemType,
            @Param("cardType") String cardType);

    /**
     * Finds [itemId, reviewedAt, cardType] pairs for the user, item type, and skill within [start, end).
     * Leverages idx_review_log_user_skill_date (user_id, card_type, reviewed_at).
     *
     * @param user the user profile
     * @param itemType polymorphic item type (e.g. "VOCABULARY")
     * @param cardType skill card type ("FLASHCARD", "READING", "LISTENING", "WRITING")
     * @param start inclusive window start timestamp
     * @param end exclusive window end timestamp
     * @return list of [itemId, reviewedAt, cardType] tuples
     */
    @Query("SELECT r.itemId, r.reviewedAt, r.cardType FROM ReviewLog r " +
           "WHERE r.user = :user AND r.itemType = :itemType AND r.cardType = :cardType " +
           "  AND r.reviewedAt >= :start AND r.reviewedAt < :end")
    List<Object[]> findItemReviewedAtInRangeAndCardType(
            @Param("user") UserProfile user,
            @Param("itemType") String itemType,
            @Param("cardType") String cardType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
