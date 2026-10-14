-- =============================================================================
-- TEST FIXTURE: seed-test-accounts.sql
-- Description: Idempotent initialization & reconciliation of standard test
--              accounts for local/test environments (Learner, Creator, Moderator, Admin).
-- Environment: Local / Test only (elearning_test_db, elearning_db). DO NOT run in production.
-- Password:    Password123! (BCrypt $2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm)
-- Invariant:   100% idempotent; never deletes or alters non-test user data.
-- =============================================================================

-- 1. Ensure Roles exist (Roles 1..4 seeded by V2 migration)
INSERT INTO `role` (`role_id`, `role_name`)
SELECT 1, 'Learner' WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_id` = 1);

INSERT INTO `role` (`role_id`, `role_name`)
SELECT 2, 'Creator' WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_id` = 2);

INSERT INTO `role` (`role_id`, `role_name`)
SELECT 3, 'Moderator' WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_id` = 3);

INSERT INTO `role` (`role_id`, `role_name`)
SELECT 4, 'Admin' WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `role_id` = 4);

-- -----------------------------------------------------------------------------
-- 2. Seed / Reconcile Admin Account (admin@test.com)
-- -----------------------------------------------------------------------------
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `authorization_version`, `created_at`, `updated_at`)
SELECT 'admin@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'admin@test.com');

SET @admin_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'admin@test.com' LIMIT 1);

INSERT INTO `user_profile` (`account_id`, `full_name`, `created_at`, `updated_at`)
SELECT @admin_id, 'Quản Trị Viên Test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `user_profile` WHERE `account_id` = @admin_id);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @admin_id, 4 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @admin_id AND `role_id` = 4);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @admin_id, 1 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @admin_id AND `role_id` = 1);

-- -----------------------------------------------------------------------------
-- 3. Seed / Reconcile Moderator Account (moderator@test.com)
-- -----------------------------------------------------------------------------
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `authorization_version`, `created_at`, `updated_at`)
SELECT 'moderator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'moderator@test.com');

SET @mod_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'moderator@test.com' LIMIT 1);

INSERT INTO `user_profile` (`account_id`, `full_name`, `created_at`, `updated_at`)
SELECT @mod_id, 'Kiểm Duyệt Viên Test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `user_profile` WHERE `account_id` = @mod_id);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @mod_id, 3 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @mod_id AND `role_id` = 3);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @mod_id, 1 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @mod_id AND `role_id` = 1);

-- -----------------------------------------------------------------------------
-- 4. Seed / Reconcile Creator Account (creator@test.com)
-- -----------------------------------------------------------------------------
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `authorization_version`, `created_at`, `updated_at`)
SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'creator@test.com');

SET @creator_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'creator@test.com' LIMIT 1);

INSERT INTO `user_profile` (`account_id`, `full_name`, `created_at`, `updated_at`)
SELECT @creator_id, 'Tác Giả Khóa Học Test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `user_profile` WHERE `account_id` = @creator_id);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @creator_id, 2 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @creator_id AND `role_id` = 2);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @creator_id, 1 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @creator_id AND `role_id` = 1);

-- -----------------------------------------------------------------------------
-- 5. Seed / Reconcile Learner Account (learner@test.com)
-- -----------------------------------------------------------------------------
INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `authorization_version`, `created_at`, `updated_at`)
SELECT 'learner@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'learner@test.com');

SET @learner_id = (SELECT `account_id` FROM `account` WHERE `email_or_phone` = 'learner@test.com' LIMIT 1);

INSERT INTO `user_profile` (`account_id`, `full_name`, `created_at`, `updated_at`)
SELECT @learner_id, 'Học Viên Tiêu Chuẩn Test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `user_profile` WHERE `account_id` = @learner_id);

INSERT INTO `account_role` (`account_id`, `role_id`)
SELECT @learner_id, 1 WHERE NOT EXISTS (SELECT 1 FROM `account_role` WHERE `account_id` = @learner_id AND `role_id` = 1);

-- -----------------------------------------------------------------------------
-- 6. Reconcile Test Accounts State (Active status & valid hash guarantee)
-- -----------------------------------------------------------------------------
UPDATE `account`
SET `status` = 'Active',
    `password_hash` = '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm'
WHERE `email_or_phone` IN ('admin@test.com', 'moderator@test.com', 'creator@test.com', 'learner@test.com')
  AND (`status` != 'Active' OR `password_hash` != '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm');
