-- =============================================================================
-- Migration: V36__remove_creator_and_moderator_roles.sql
-- Description: Transition completely to Single-Admin + Learner RBAC model.
--              1. Increments authorization_version for any account holding
--                 Creator (role_id = 2) or Moderator (role_id = 3) so stale
--                 tokens are immediately invalidated.
--              2. Removes Creator and Moderator assignments from ACCOUNT_ROLE.
--              3. Assigns Learner (role_id = 1) to any account left without roles.
--              4. Removes Creator and Moderator from the ROLE catalog table.
-- Database: TiDB Cloud Serverless / MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 1. Invalidate active sessions/tokens for accounts that hold Creator or Moderator roles
UPDATE `ACCOUNT` a
SET a.`authorization_version` = a.`authorization_version` + 1
WHERE EXISTS (
    SELECT 1
    FROM `ACCOUNT_ROLE` ar
    JOIN `ROLE` r ON r.`role_id` = ar.`role_id`
    WHERE ar.`account_id` = a.`account_id`
      AND (r.`role_id` IN (2, 3) OR LOWER(r.`role_name`) IN ('creator', 'moderator'))
);

-- 2. Remove all Creator and Moderator role assignments
DELETE ar FROM `ACCOUNT_ROLE` ar
JOIN `ROLE` r ON r.`role_id` = ar.`role_id`
WHERE r.`role_id` IN (2, 3)
   OR LOWER(r.`role_name`) IN ('creator', 'moderator');

-- 3. Reassign affected accounts (that now have zero roles) to Learner (role_id = 1)
INSERT INTO `ACCOUNT_ROLE` (`account_id`, `role_id`)
SELECT a.`account_id`, r_learner.`role_id`
FROM `ACCOUNT` a
JOIN `ROLE` r_learner ON r_learner.`role_id` = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM `ACCOUNT_ROLE` ar
    WHERE ar.`account_id` = a.`account_id`
);

-- 4. Remove Creator and Moderator from ROLE catalog
DELETE FROM `ROLE`
WHERE `role_id` IN (2, 3)
   OR LOWER(`role_name`) IN ('creator', 'moderator');
