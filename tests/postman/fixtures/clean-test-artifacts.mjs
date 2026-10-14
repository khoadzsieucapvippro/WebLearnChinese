/**
 * Automated Test Artifacts Cleanup Utility.
 * Safety gates enforced:
 * - Requires explicit opt-in via ALLOW_TEST_CLEANUP=true or ALLOW_TEST_SEED=true
 * - Host must be local (localhost / 127.0.0.1 / ::1)
 * - Database must match approved test whitelist (elearning_test_db, elearning_db, elearning_dev)
 * - Refuses production
 * Scope:
 * - Only cleans up transient test artifacts matching strict test prefixes:
 *     - Accounts matching 'learner_pm_%' (and dependent user_profile, account_role)
 *     - Lessons matching 'Bài học Creator Postman #%' (and dependent moderation_log, lesson_vocabulary)
 * - Never touches standard seed accounts (admin, creator, moderator, learner) or baseline curriculum lessons
 */

import { spawnSync } from 'node:child_process';

const ALLOWED_DATABASES = new Set(['elearning_test_db', 'elearning_db', 'elearning_dev']);
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function cleanTestArtifacts({
  host = process.env.DB_HOST || 'localhost',
  user = process.env.DB_USER || 'root',
  password = process.env.DB_PASSWORD || '',
  database = process.env.DB_NAME || 'elearning_test_db'
} = {}) {
  const isOptedIn = process.env.ALLOW_TEST_CLEANUP === 'true'
    || process.env.ALLOW_TEST_SEED === 'true'
    || process.env.NODE_ENV === 'test';

  if (!isOptedIn) {
    throw new Error(
      '[SECURITY GUARD] Cleanup execution denied. Opt-in required: set ALLOW_TEST_CLEANUP=true or ALLOW_TEST_SEED=true to authorize test artifact cleanup.'
    );
  }

  if (process.env.NODE_ENV === 'production'
    || process.env.SPRING_PROFILES_ACTIVE === 'prod'
    || host.toLowerCase().includes('prod')
    || database.toLowerCase().includes('prod')) {
    throw new Error('[SECURITY GUARD] Production marker detected. Artifact cleanup is strictly forbidden.');
  }

  if (!ALLOWED_HOSTS.has(host.toLowerCase())) {
    throw new Error(`[SECURITY GUARD] Cleanup is restricted to local test hosts. Refused host: ${host}`);
  }

  if (!ALLOWED_DATABASES.has(database.toLowerCase())) {
    throw new Error(`[SECURITY GUARD] Database '${database}' is not in approved test whitelist: [${Array.from(ALLOWED_DATABASES).join(', ')}]`);
  }

  const cleanupSql = [
    "DELETE FROM personal_note WHERE user_id IN (SELECT user_id FROM user_profile WHERE account_id IN (SELECT account_id FROM account WHERE email_or_phone LIKE 'learner_pm_%'));",
    "DELETE FROM card_progress WHERE user_id IN (SELECT user_id FROM user_profile WHERE account_id IN (SELECT account_id FROM account WHERE email_or_phone LIKE 'learner_pm_%'));",
    "DELETE FROM review_log WHERE user_id IN (SELECT user_id FROM user_profile WHERE account_id IN (SELECT account_id FROM account WHERE email_or_phone LIKE 'learner_pm_%'));",
    "DELETE FROM user_profile WHERE account_id IN (SELECT account_id FROM account WHERE email_or_phone LIKE 'learner_pm_%');",
    "DELETE FROM account_role WHERE account_id IN (SELECT account_id FROM account WHERE email_or_phone LIKE 'learner_pm_%');",
    "DELETE FROM account WHERE email_or_phone LIKE 'learner_pm_%';",
    "DELETE FROM moderation_log WHERE lesson_id IN (SELECT lesson_id FROM lesson WHERE title LIKE 'Bài học Creator Postman #%');",
    "DELETE FROM lesson_vocabulary WHERE lesson_id IN (SELECT lesson_id FROM lesson WHERE title LIKE 'Bài học Creator Postman #%');",
    "DELETE FROM lesson WHERE title LIKE 'Bài học Creator Postman #%';"
  ].join(' ');

  const args = ['-h', host, '-u', user];
  if (password) {
    args.push(`-p${password}`);
  }
  args.push(database, '-e', cleanupSql);

  const fallbackBinary = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe';
  const result = spawnSync(fallbackBinary, args, { stdio: 'pipe', encoding: 'utf-8' });

  if (result.status !== 0) {
    const fallbackResult = spawnSync('mysql', args, { stdio: 'pipe', encoding: 'utf-8' });
    if (fallbackResult.status !== 0) {
      throw new Error(`[CLEANUP ERROR] Failed to clean test artifacts: ${result.stderr || fallbackResult.stderr}`);
    }
  }

  console.log(`[CLEANUP SUCCESS] Transient test artifacts cleaned from ${database}.`);
  return true;
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    cleanTestArtifacts();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
