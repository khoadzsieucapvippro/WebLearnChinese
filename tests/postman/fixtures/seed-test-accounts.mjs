/**
 * Gated Seed Runner for Postman test accounts fixture.
 * Safety gates enforced:
 * - Requires explicit opt-in via ALLOW_TEST_SEED=true or NODE_ENV=test/local
 * - Host must be local (localhost / 127.0.0.1 / ::1)
 * - Database must match approved test whitelist (elearning_db, elearning_test_db, elearning_dev)
 * - Explicit fail-closed rejection on any production markers
 * - Zero secrets, passwords, or tokens printed to stdout/stderr
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlFixturePath = path.join(__dirname, 'seed-test-accounts.sql');

// Primary allowlist: dedicated test databases (elearning_test_db, elearning_test) and dev schema
const ALLOWED_DATABASES = new Set(['elearning_test_db', 'elearning_test', 'elearning_db']);
const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function seedTestAccounts({
  host = process.env.DB_HOST || 'localhost',
  user = process.env.DB_USER || 'root',
  password = process.env.DB_PASSWORD || '',
  database = process.env.DB_NAME || 'elearning_test_db'
} = {}) {
  // 1. Mandatory Opt-in gate: strictly requires ALLOW_TEST_SEED=true
  if (process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error(
      '[SECURITY GUARD] Seed execution denied. Mandatory opt-in missing: environment variable ALLOW_TEST_SEED=true is strictly required to authorize fixture seeding.'
    );
  }

  // 2. Production rejection gate
  if (process.env.NODE_ENV === 'production'
    || process.env.SPRING_PROFILES_ACTIVE === 'prod'
    || host.toLowerCase().includes('prod')
    || database.toLowerCase().includes('prod')) {
    throw new Error('[SECURITY GUARD] Production marker detected. Seeding test accounts is strictly forbidden.');
  }

  // 3. Localhost restriction gate
  if (!ALLOWED_HOSTS.has(host.toLowerCase())) {
    throw new Error(`[SECURITY GUARD] Seed fixture is restricted to local test hosts. Refused host: ${host}`);
  }

  // 4. Database whitelist gate
  if (!ALLOWED_DATABASES.has(database.toLowerCase())) {
    throw new Error(`[SECURITY GUARD] Target database '${database}' is not in the approved test database whitelist: [${Array.from(ALLOWED_DATABASES).join(', ')}]`);
  }

  console.log(`[SEED AUDIT] Environment: LOCAL/TEST`);
  console.log(`[SEED AUDIT] Target Host: ${host}`);
  console.log(`[SEED AUDIT] Target Database: ${database}`);
  console.log(`[SEED AUDIT] Target Users: admin@test.com, moderator@test.com, creator@test.com, learner@test.com`);
  console.log(`[SEED AUDIT] (Zero credentials logged)`);

  const args = ['-h', host, '-u', user];
  if (password) {
    args.push(`-p${password}`);
  }
  args.push(database, '-e', `source ${sqlFixturePath.replace(/\\/g, '/')}`);

  const fallbackBinary = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe';
  const result = spawnSync(fallbackBinary, args, { stdio: 'pipe', encoding: 'utf-8' });

  if (result.status !== 0) {
    const fallbackResult = spawnSync('mysql', args, { stdio: 'pipe', encoding: 'utf-8' });
    if (fallbackResult.status !== 0) {
      throw new Error(`[SEED ERROR] Failed to seed test accounts: ${result.stderr || fallbackResult.stderr}`);
    }
  }

  console.log(`[SEED SUCCESS] Standard test accounts seeded & reconciled in ${database}.`);
  return true;
}

// Direct execution support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    seedTestAccounts();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
