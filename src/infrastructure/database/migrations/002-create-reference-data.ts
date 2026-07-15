import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReferenceData0020000000000002
  implements MigrationInterface
{
  name = 'CreateReferenceData0020000000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE locations (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id   uuid NULL,
        type        varchar(20) NOT NULL,
        name_ar     varchar(120) NOT NULL,
        name_en     varchar(120) NULL,
        slug        varchar(150) NOT NULL,
        status      varchar(20) NOT NULL DEFAULT 'ACTIVE',
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT locations_parent_fk
          FOREIGN KEY (parent_id) REFERENCES locations(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT locations_not_self_parent_ck
          CHECK (parent_id IS NULL OR parent_id <> id),

        CONSTRAINT locations_type_ck
          CHECK (type IN ('COUNTRY', 'GOVERNORATE', 'CITY', 'AREA')),

        CONSTRAINT locations_status_ck
          CHECK (status IN ('ACTIVE', 'INACTIVE')),

        CONSTRAINT locations_slug_not_blank_ck
          CHECK (btrim(slug) <> ''),

        CONSTRAINT locations_name_ar_not_blank_ck
          CHECK (btrim(name_ar) <> '')
      );

      CREATE UNIQUE INDEX locations_root_slug_uq
        ON locations (slug)
        WHERE parent_id IS NULL;

      CREATE UNIQUE INDEX locations_child_slug_uq
        ON locations (parent_id, slug)
        WHERE parent_id IS NOT NULL;

      CREATE INDEX locations_parent_idx ON locations(parent_id);
      CREATE INDEX locations_type_status_idx ON locations(type, status);

      CREATE TRIGGER locations_set_updated_at
      BEFORE UPDATE ON locations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE categories (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id   uuid NULL,
        name_ar     varchar(100) NOT NULL,
        name_en     varchar(100) NULL,
        slug        varchar(120) NOT NULL,
        icon_url    text NULL,
        sort_order  integer NOT NULL DEFAULT 0,
        status      varchar(20) NOT NULL DEFAULT 'ACTIVE',
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT categories_parent_fk
          FOREIGN KEY (parent_id) REFERENCES categories(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT categories_slug_uq UNIQUE (slug),

        CONSTRAINT categories_not_self_parent_ck
          CHECK (parent_id IS NULL OR parent_id <> id),

        CONSTRAINT categories_status_ck
          CHECK (status IN ('ACTIVE', 'INACTIVE')),

        CONSTRAINT categories_sort_order_ck
          CHECK (sort_order >= 0),

        CONSTRAINT categories_slug_not_blank_ck
          CHECK (btrim(slug) <> ''),

        CONSTRAINT categories_name_ar_not_blank_ck
          CHECK (btrim(name_ar) <> '')
      );

      CREATE UNIQUE INDEX categories_root_name_ar_uq
        ON categories (lower(btrim(name_ar)))
        WHERE parent_id IS NULL;

      CREATE UNIQUE INDEX categories_child_name_ar_uq
        ON categories (parent_id, lower(btrim(name_ar)))
        WHERE parent_id IS NOT NULL;

      CREATE INDEX categories_parent_idx ON categories(parent_id);
      CREATE INDEX categories_status_sort_idx ON categories(status, sort_order, name_ar);

      CREATE TRIGGER categories_set_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
      DROP TABLE IF EXISTS categories;
      DROP TRIGGER IF EXISTS locations_set_updated_at ON locations;
      DROP TABLE IF EXISTS locations;
    `);
  }
}
