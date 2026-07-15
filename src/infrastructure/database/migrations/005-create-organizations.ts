import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizations0050000000000005
  implements MigrationInterface
{
  name = 'CreateOrganizations0050000000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE businesses (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        legal_name          varchar(180) NULL,
        display_name        varchar(180) NOT NULL,
        display_name_en     varchar(180) NULL,
        slug                varchar(180) NOT NULL,
        description         text NULL,
        description_en      text NULL,
        logo_url            text NULL,
        cover_url           text NULL,
        email               citext NULL,
        phone               varchar(20) NOT NULL,
        status              varchar(20) NOT NULL DEFAULT 'ACTIVE',
        created_by_user_id  uuid NOT NULL,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now(),
        deleted_at          timestamptz NULL,

        CONSTRAINT businesses_slug_uq UNIQUE (slug),

        CONSTRAINT businesses_creator_fk
          FOREIGN KEY (created_by_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT businesses_status_ck
          CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),

        CONSTRAINT businesses_display_name_not_blank_ck
          CHECK (btrim(display_name) <> ''),

        CONSTRAINT businesses_slug_not_blank_ck
          CHECK (btrim(slug) <> ''),

        CONSTRAINT businesses_email_not_blank_ck
          CHECK (email IS NULL OR btrim(email::text) <> ''),

        CONSTRAINT businesses_phone_not_blank_ck
          CHECK (btrim(phone) <> '')
      );

      CREATE INDEX businesses_status_idx ON businesses(status);
      CREATE INDEX businesses_creator_idx ON businesses(created_by_user_id);
      CREATE INDEX businesses_name_trgm_idx
        ON businesses USING gin (display_name gin_trgm_ops);
      CREATE INDEX businesses_name_en_trgm_idx
        ON businesses USING gin (display_name_en gin_trgm_ops);

      CREATE TRIGGER businesses_set_updated_at
      BEFORE UPDATE ON businesses
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE business_categories (
        business_id  uuid NOT NULL,
        category_id  uuid NOT NULL,
        is_primary   boolean NOT NULL DEFAULT false,
        created_at   timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT business_categories_pk
          PRIMARY KEY (business_id, category_id),

        CONSTRAINT business_categories_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT business_categories_category_fk
          FOREIGN KEY (category_id) REFERENCES categories(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT
      );

      CREATE UNIQUE INDEX one_primary_category_per_business_uq
        ON business_categories(business_id)
        WHERE is_primary = true;

      CREATE INDEX business_categories_category_idx
        ON business_categories(category_id, business_id);

      CREATE TABLE branches (
        id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id    uuid NOT NULL,
        name           varchar(150) NOT NULL,
        name_en        varchar(150) NULL,
        slug           varchar(150) NOT NULL,
        address_line   text NOT NULL,
        address_line_en text NULL,
        location_id    uuid NULL,
        latitude       numeric(9,6) NULL,
        longitude      numeric(9,6) NULL,
        phone          varchar(20) NULL,
        is_primary     boolean NOT NULL DEFAULT false,
        status         varchar(20) NOT NULL DEFAULT 'ACTIVE',
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now(),
        deleted_at     timestamptz NULL,

        CONSTRAINT branches_business_slug_uq UNIQUE (business_id, slug),
        CONSTRAINT branches_id_business_uq UNIQUE (id, business_id),

        CONSTRAINT branches_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT branches_location_fk
          FOREIGN KEY (location_id) REFERENCES locations(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT branches_status_ck
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),

        CONSTRAINT branches_latitude_ck
          CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

        CONSTRAINT branches_longitude_ck
          CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

        CONSTRAINT branches_name_not_blank_ck
          CHECK (btrim(name) <> ''),

        CONSTRAINT branches_slug_not_blank_ck
          CHECK (btrim(slug) <> ''),

        CONSTRAINT branches_address_not_blank_ck
          CHECK (btrim(address_line) <> '')
      );

      CREATE UNIQUE INDEX one_primary_branch_per_business_uq
        ON branches(business_id)
        WHERE is_primary = true AND deleted_at IS NULL;

      CREATE INDEX branches_business_status_idx
        ON branches(business_id, status)
        WHERE deleted_at IS NULL;

      CREATE INDEX branches_location_idx ON branches(location_id);

      CREATE TRIGGER branches_set_updated_at
      BEFORE UPDATE ON branches
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE business_memberships (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id         uuid NOT NULL,
        user_id             uuid NOT NULL,
        role                varchar(20) NOT NULL,
        status              varchar(20) NOT NULL DEFAULT 'INVITED',
        invited_by_user_id  uuid NULL,
        joined_at           timestamptz NULL,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT business_memberships_business_user_uq
          UNIQUE (business_id, user_id),

        CONSTRAINT business_memberships_id_business_uq
          UNIQUE (id, business_id),

        CONSTRAINT business_memberships_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT business_memberships_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT business_memberships_inviter_fk
          FOREIGN KEY (invited_by_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT business_memberships_role_ck
          CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')),

        CONSTRAINT business_memberships_status_ck
          CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED')),

        CONSTRAINT business_memberships_joined_at_ck
          CHECK (status <> 'ACTIVE' OR joined_at IS NOT NULL)
      );

      CREATE UNIQUE INDEX one_active_owner_per_business_uq
        ON business_memberships(business_id)
        WHERE role = 'OWNER' AND status = 'ACTIVE';

      CREATE INDEX business_memberships_user_status_idx
        ON business_memberships(user_id, status);

      CREATE INDEX business_memberships_business_role_status_idx
        ON business_memberships(business_id, role, status);

      CREATE TRIGGER business_memberships_set_updated_at
      BEFORE UPDATE ON business_memberships
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE membership_branches (
        membership_id  uuid NOT NULL,
        branch_id      uuid NOT NULL,
        business_id    uuid NOT NULL,
        created_at     timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT membership_branches_pk
          PRIMARY KEY (membership_id, branch_id),

        CONSTRAINT membership_branches_membership_business_fk
          FOREIGN KEY (membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE CASCADE,

        CONSTRAINT membership_branches_branch_business_fk
          FOREIGN KEY (branch_id, business_id)
          REFERENCES branches(id, business_id)
          ON UPDATE RESTRICT ON DELETE CASCADE
      );

      CREATE INDEX membership_branches_branch_idx
        ON membership_branches(branch_id, membership_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS membership_branches;
      DROP TRIGGER IF EXISTS business_memberships_set_updated_at ON business_memberships;
      DROP TABLE IF EXISTS business_memberships;
      DROP TRIGGER IF EXISTS branches_set_updated_at ON branches;
      DROP TABLE IF EXISTS branches;
      DROP TABLE IF EXISTS business_categories;
      DROP TRIGGER IF EXISTS businesses_set_updated_at ON businesses;
      DROP TABLE IF EXISTS businesses;
    `);
  }
}
