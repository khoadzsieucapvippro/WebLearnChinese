-- =============================================================================
-- Migration: V35__enforce_single_role_exclusivity_data_cleanup.sql
-- Description: Enforce Single-Role Exclusivity: An account holds exactly 1 role.
--              Cleans up historical data where accounts held multiple roles.
-- Database: TiDB Cloud Serverless / MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 1. If an account has Admin (role_id = 4), remove all other roles (1, 2, 3)
DELETE ar FROM `ACCOUNT_ROLE` ar
JOIN `ACCOUNT_ROLE` ar_admin ON ar.account_id = ar_admin.account_id AND ar_admin.role_id = 4
WHERE ar.role_id <> 4;

-- 2. If an account has Moderator (role_id = 3), remove other roles (1, 2)
DELETE ar FROM `ACCOUNT_ROLE` ar
JOIN `ACCOUNT_ROLE` ar_mod ON ar.account_id = ar_mod.account_id AND ar_mod.role_id = 3
WHERE ar.role_id <> 3;

-- 3. If an account has Creator (role_id = 2), remove Learner (1)
DELETE ar FROM `ACCOUNT_ROLE` ar
JOIN `ACCOUNT_ROLE` ar_creator ON ar.account_id = ar_creator.account_id AND ar_creator.role_id = 2
WHERE ar.role_id <> 2;
