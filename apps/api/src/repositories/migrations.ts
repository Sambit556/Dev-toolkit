import { PoolClient } from 'pg';
import { logger } from '../utils/logger';

export const TABLES = {
  USERS: "users",
  STORAGE_ITEMS: "storage_items",
  UPLOAD_SESSIONS: "upload_sessions",
  REFRESH_TOKENS: "refresh_tokens",
  ACTIVITY_LOGS: "activity_logs",
  MOBILE_UPLOAD_LINKS: "mobile_upload_links",
};

const TABLE_DEFINITIONS = [
  {
    name: TABLES.USERS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      last_login TIMESTAMP WITH TIME ZONE
    )`
  },
  {
    name: TABLES.STORAGE_ITEMS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.STORAGE_ITEMS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES ${TABLES.STORAGE_ITEMS}(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(255),
      size BIGINT,
      s3_key VARCHAR(512),
      description TEXT,
      is_deleted BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )`
  },
  {
    name: TABLES.UPLOAD_SESSIONS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.UPLOAD_SESSIONS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
      upload_id VARCHAR(255) NOT NULL,
      s3_key VARCHAR(512) NOT NULL,
      status VARCHAR(50) DEFAULT 'uploading' NOT NULL,
      parts_uploaded JSONB DEFAULT '[]'::jsonb NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )`
  },
  {
    name: TABLES.REFRESH_TOKENS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.REFRESH_TOKENS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      revoked BOOLEAN DEFAULT false NOT NULL
    )`
  },
  {
    name: TABLES.ACTIVITY_LOGS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.ACTIVITY_LOGS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      resource VARCHAR(255),
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )`
  },
  {
    name: TABLES.MOBILE_UPLOAD_LINKS,
    sql: `CREATE TABLE IF NOT EXISTS ${TABLES.MOBILE_UPLOAD_LINKS} (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
      folder_id UUID REFERENCES ${TABLES.STORAGE_ITEMS}(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_revoked BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )`
  }
];

const FK_AND_INDEX_DEFINITIONS = [
  {
    name: `idx_${TABLES.USERS}_email`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.USERS}_email ON ${TABLES.USERS}(email)`
  },
  {
    name: `idx_${TABLES.STORAGE_ITEMS}_user_id`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.STORAGE_ITEMS}_user_id ON ${TABLES.STORAGE_ITEMS}(user_id)`
  },
  {
    name: `idx_${TABLES.STORAGE_ITEMS}_parent_id`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.STORAGE_ITEMS}_parent_id ON ${TABLES.STORAGE_ITEMS}(parent_id)`
  },
  {
    name: `idx_${TABLES.UPLOAD_SESSIONS}_user_id`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.UPLOAD_SESSIONS}_user_id ON ${TABLES.UPLOAD_SESSIONS}(user_id)`
  },
  {
    name: `idx_${TABLES.REFRESH_TOKENS}_token_hash`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.REFRESH_TOKENS}_token_hash ON ${TABLES.REFRESH_TOKENS}(token_hash)`
  },
  {
    name: `idx_${TABLES.ACTIVITY_LOGS}_user_id`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.ACTIVITY_LOGS}_user_id ON ${TABLES.ACTIVITY_LOGS}(user_id)`
  },
  {
    name: `idx_${TABLES.STORAGE_ITEMS}_composite_list`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.STORAGE_ITEMS}_composite_list ON ${TABLES.STORAGE_ITEMS}(user_id, parent_id, is_deleted)`
  },
  {
    // At most one row may hold role='superadmin' — a partial unique index over the
    // constant matching column enforces this at the database level, not just in app code.
    name: `idx_${TABLES.USERS}_single_superadmin`,
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_${TABLES.USERS}_single_superadmin ON ${TABLES.USERS}(role) WHERE role = 'superadmin'`
  },
  {
    name: `idx_${TABLES.USERS}_is_active`,
    sql: `CREATE INDEX IF NOT EXISTS idx_${TABLES.USERS}_is_active ON ${TABLES.USERS}(is_active)`
  }
];

const MIGRATIONS = [
  {
    name: `add_role_column_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' NOT NULL`
  },
  {
    name: `add_tags_to_${TABLES.STORAGE_ITEMS}`,
    sql: `ALTER TABLE ${TABLES.STORAGE_ITEMS} ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'`
  },
  {
    name: `add_shared_at_to_${TABLES.STORAGE_ITEMS}`,
    sql: `ALTER TABLE ${TABLES.STORAGE_ITEMS} ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE`
  },
  {
    name: `add_description_to_${TABLES.STORAGE_ITEMS}`,
    sql: `ALTER TABLE ${TABLES.STORAGE_ITEMS} ADD COLUMN IF NOT EXISTS description TEXT`
  },
  {
    name: `add_is_active_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`
  },
  {
    // Referenced by auth routes/middleware (change-password, reset-password, session
    // invalidation-on-password-change checks) but was never actually migrated.
    name: `add_password_changed_at_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE`
  },
  {
    name: `add_storage_quota_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS storage_quota_bytes BIGINT DEFAULT ${1024 ** 4} NOT NULL`
  },
  {
    name: `add_avatar_s3_key_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS avatar_s3_key VARCHAR(512)`
  },
  {
    name: `add_mobile_number_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) UNIQUE`
  },
  {
    // Google-authenticated users have no password of their own — safe to re-run
    // every boot, Postgres no-ops if the column is already nullable.
    name: `make_password_hash_nullable_on_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ALTER COLUMN password_hash DROP NOT NULL`
  },
  {
    name: `add_google_id_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`
  },
  {
    name: `add_auth_provider_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local' NOT NULL`
  },
  {
    // 'mobile' | 'tablet' | 'desktop' | 'other' — detected server-side from the
    // uploading request's User-Agent (see utils/deviceDetect.ts), never client-supplied.
    name: `add_device_type_to_${TABLES.STORAGE_ITEMS}`,
    sql: `ALTER TABLE ${TABLES.STORAGE_ITEMS} ADD COLUMN IF NOT EXISTS device_type VARCHAR(20)`
  },
  {
    // VARCHAR(45) accommodates the longest possible IPv6 text representation.
    name: `add_ip_address_to_${TABLES.MOBILE_UPLOAD_LINKS}`,
    sql: `ALTER TABLE ${TABLES.MOBILE_UPLOAD_LINKS} ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`
  },
  {
    name: `add_ip_address_to_${TABLES.ACTIVITY_LOGS}`,
    sql: `ALTER TABLE ${TABLES.ACTIVITY_LOGS} ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`
  },
  {
    name: `add_country_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS country VARCHAR(100)`
  },
  {
    name: `add_last_ip_to_${TABLES.USERS}`,
    sql: `ALTER TABLE ${TABLES.USERS} ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45)`
  }
];

export async function createContainers(client: PoolClient): Promise<void> {
  logger.info('Verifying database schemas and tables (createContainers)...');

  // Ensure UUID extension is loaded
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // 1. Process Table Definitions
  for (const def of TABLE_DEFINITIONS) {
    logger.info(`Checking/creating table: ${def.name}`);
    await client.query(def.sql);
  }

  // 2. Process Migrations (e.g. Alter Table additions)
  for (const mig of MIGRATIONS) {
    logger.info(`Applying database migration check: ${mig.name}`);
    await client.query(mig.sql);
  }

  // 3. Process Index & Constraint Definitions
  for (const fki of FK_AND_INDEX_DEFINITIONS) {
    logger.info(`Verifying index/constraint: ${fki.name}`);
    await client.query(fki.sql);
  }

  // 4. Setup Auto-Update Timestamp Trigger Function
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  // 5. Apply Triggers to Tables
  const tablesWithTriggers = [TABLES.USERS, TABLES.STORAGE_ITEMS, TABLES.UPLOAD_SESSIONS];
  for (const tbl of tablesWithTriggers) {
    await client.query(`DROP TRIGGER IF EXISTS trg_${tbl}_updated_at ON ${tbl}`);
    await client.query(`
      CREATE TRIGGER trg_${tbl}_updated_at
      BEFORE UPDATE ON ${tbl}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  // 5b. Guard against deleting the superadmin account, or demoting/deactivating it
  // via a direct role/is_active change (defense in depth beyond the app-layer checks).
  await client.query(`
    CREATE OR REPLACE FUNCTION protect_superadmin_account()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'superadmin' THEN
          RAISE EXCEPTION 'The superadmin account cannot be deleted';
        END IF;
        RETURN OLD;
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.role = 'superadmin' AND NEW.role <> 'superadmin' THEN
          RAISE EXCEPTION 'The superadmin account role cannot be changed';
        END IF;
        IF OLD.role = 'superadmin' AND NEW.is_active = false THEN
          RAISE EXCEPTION 'The superadmin account cannot be deactivated';
        END IF;
        RETURN NEW;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
  await client.query(`DROP TRIGGER IF EXISTS trg_protect_superadmin ON ${TABLES.USERS}`);
  await client.query(`
    CREATE TRIGGER trg_protect_superadmin
    BEFORE DELETE OR UPDATE ON ${TABLES.USERS}
    FOR EACH ROW
    EXECUTE FUNCTION protect_superadmin_account()
  `);

  // 6. Default Developer Seed User Setup
  const email = 'developer@space.io';
  const userCheck = await client.query(`SELECT id FROM ${TABLES.USERS} WHERE email = $1`, [email]);
  if (userCheck.rows.length === 0) {
    logger.info(`Seeding default developer user: ${email}`);
    // password is: password123
    // Hashed with the current PASSWORD_PEPPER + BCRYPT_SALT_ROUNDS (see services/password.service.ts).
    // Regenerate via that service if the pepper is ever rotated.
    const passwordHash = '$2b$12$F/K34H57po1vP3cKtjWJOOMDWyTYqfrT62rQUZYD9knHPKWc9NLrS';
    await client.query(
      `INSERT INTO ${TABLES.USERS} (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, 'Lead Developer', 'superadmin', NOW(), NOW())`,
      [email, passwordHash]
    );
  } else {
    // Ensure existing developer user has superadmin role and valid password hash assigned
    // Hashed with the current PASSWORD_PEPPER + BCRYPT_SALT_ROUNDS (see services/password.service.ts).
    // Regenerate via that service if the pepper is ever rotated.
    const passwordHash = '$2b$12$F/K34H57po1vP3cKtjWJOOMDWyTYqfrT62rQUZYD9knHPKWc9NLrS';
    await client.query(
      `UPDATE ${TABLES.USERS} SET role = 'superadmin', password_hash = $2 WHERE email = $1`,
      [email, passwordHash]
    );
  }

  logger.info('Database container checks completed successfully.');
}
