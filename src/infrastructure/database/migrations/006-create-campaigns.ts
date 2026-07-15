import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaigns0060000000000006 implements MigrationInterface {
  name = 'CreateCampaigns0060000000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE campaigns (
        id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id               uuid NOT NULL,
        primary_category_id       uuid NOT NULL,
        created_by_membership_id  uuid NOT NULL,
        submitted_by_membership_id uuid NULL,
        reviewed_by_user_id       uuid NULL,
        suspended_by_user_id      uuid NULL,
        title                     varchar(180) NOT NULL,
        title_en                  varchar(180) NULL,
        public_slug               varchar(200) NOT NULL,
        description               text NOT NULL,
        description_en            text NULL,
        image_url                 text NULL,
        terms_text                text NOT NULL,
        terms_text_en             text NULL,
        status                    varchar(30) NOT NULL DEFAULT 'DRAFT',
        start_at                  timestamptz NOT NULL,
        end_at                    timestamptz NOT NULL,
        is_searchable             boolean NOT NULL DEFAULT true,
        submitted_at              timestamptz NULL,
        reviewed_at               timestamptz NULL,
        rejection_reason          text NULL,
        published_at              timestamptz NULL,
        suspended_at              timestamptz NULL,
        suspension_reason         text NULL,
        created_at                timestamptz NOT NULL DEFAULT now(),
        updated_at                timestamptz NOT NULL DEFAULT now(),
        deleted_at                timestamptz NULL,

        CONSTRAINT campaigns_public_slug_uq UNIQUE (public_slug),
        CONSTRAINT campaigns_id_business_uq UNIQUE (id, business_id),

        CONSTRAINT campaigns_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaigns_primary_category_fk
          FOREIGN KEY (primary_category_id) REFERENCES categories(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaigns_creator_business_fk
          FOREIGN KEY (created_by_membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaigns_submitter_business_fk
          FOREIGN KEY (submitted_by_membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaigns_reviewer_fk
          FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT campaigns_suspender_fk
          FOREIGN KEY (suspended_by_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT campaigns_date_range_ck
          CHECK (end_at > start_at),

        CONSTRAINT campaigns_status_ck
          CHECK (status IN (
            'DRAFT',
            'PENDING_REVIEW',
            'SCHEDULED',
            'ACTIVE',
            'PAUSED',
            'REJECTED',
            'SUSPENDED',
            'EXPIRED',
            'CANCELLED'
          )),

        CONSTRAINT campaigns_submission_ck
          CHECK (
            status NOT IN ('PENDING_REVIEW', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'REJECTED', 'SUSPENDED', 'EXPIRED')
            OR (submitted_at IS NOT NULL AND submitted_by_membership_id IS NOT NULL)
          ),

        CONSTRAINT campaigns_review_ck
          CHECK (
            status NOT IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'REJECTED', 'SUSPENDED', 'EXPIRED')
            OR (reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL)
          ),

        CONSTRAINT campaigns_rejection_reason_ck
          CHECK (
            status <> 'REJECTED'
            OR (rejection_reason IS NOT NULL AND btrim(rejection_reason) <> '')
          ),

        CONSTRAINT campaigns_published_at_ck
          CHECK (
            status NOT IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'EXPIRED')
            OR published_at IS NOT NULL
          ),

        CONSTRAINT campaigns_suspension_ck
          CHECK (
            status <> 'SUSPENDED'
            OR (
              suspended_at IS NOT NULL
              AND suspended_by_user_id IS NOT NULL
              AND suspension_reason IS NOT NULL
              AND btrim(suspension_reason) <> ''
            )
          ),

        CONSTRAINT campaigns_title_not_blank_ck
          CHECK (btrim(title) <> ''),

        CONSTRAINT campaigns_slug_not_blank_ck
          CHECK (btrim(public_slug) <> ''),

        CONSTRAINT campaigns_description_not_blank_ck
          CHECK (btrim(description) <> ''),

        CONSTRAINT campaigns_terms_not_blank_ck
          CHECK (btrim(terms_text) <> '')
      );

      CREATE INDEX campaigns_business_status_idx
        ON campaigns(business_id, status);

      CREATE INDEX campaigns_public_active_idx
        ON campaigns(status, start_at, end_at)
        WHERE deleted_at IS NULL;

      CREATE INDEX campaigns_active_window_idx
        ON campaigns(start_at, end_at)
        WHERE status IN ('SCHEDULED', 'ACTIVE')
          AND deleted_at IS NULL;

      CREATE INDEX campaigns_title_trgm_idx
        ON campaigns USING gin (title gin_trgm_ops);
      CREATE INDEX campaigns_title_en_trgm_idx
        ON campaigns USING gin (title_en gin_trgm_ops);

      CREATE INDEX campaigns_description_trgm_idx
        ON campaigns USING gin (description gin_trgm_ops);
      CREATE INDEX campaigns_description_en_trgm_idx
        ON campaigns USING gin (description_en gin_trgm_ops);

      CREATE TRIGGER campaigns_set_updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE campaign_benefits (
        campaign_id          uuid PRIMARY KEY,
        benefit_type         varchar(30) NOT NULL,
        percentage_value     numeric(5,2) NULL,
        fixed_amount         numeric(18,2) NULL,
        max_discount_amount  numeric(18,2) NULL,
        currency             char(3) NOT NULL DEFAULT 'SYP',
        description          text NULL,
        description_en       text NULL,
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT campaign_benefits_campaign_fk
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
          ON UPDATE RESTRICT ON DELETE CASCADE,

        CONSTRAINT campaign_benefits_type_ck
          CHECK (benefit_type IN (
            'PERCENTAGE',
            'FIXED_AMOUNT',
            'FREE_ITEM',
            'BUY_X_GET_Y',
            'FREE_SERVICE',
            'CUSTOM'
          )),

        CONSTRAINT campaign_benefits_values_ck
          CHECK (
            (
              benefit_type = 'PERCENTAGE'
              AND percentage_value > 0
              AND percentage_value <= 100
              AND fixed_amount IS NULL
            )
            OR
            (
              benefit_type = 'FIXED_AMOUNT'
              AND fixed_amount > 0
              AND percentage_value IS NULL
            )
            OR
            (
              benefit_type IN ('FREE_ITEM', 'BUY_X_GET_Y', 'FREE_SERVICE', 'CUSTOM')
              AND percentage_value IS NULL
              AND fixed_amount IS NULL
              AND description IS NOT NULL
              AND btrim(description) <> ''
            )
          ),

        CONSTRAINT campaign_benefits_max_discount_ck
          CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),

        CONSTRAINT campaign_benefits_currency_ck
          CHECK (currency ~ '^[A-Z]{3}$')
      );

      CREATE TRIGGER campaign_benefits_set_updated_at
      BEFORE UPDATE ON campaign_benefits
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE campaign_limits (
        campaign_id                   uuid PRIMARY KEY,
        total_claim_limit             integer NOT NULL,
        per_user_claim_limit          integer NOT NULL DEFAULT 1,
        max_redemptions_per_coupon    integer NOT NULL DEFAULT 1,
        budget_amount                 numeric(18,2) NULL,
        currency                      char(3) NULL,
        coupon_validity_type          varchar(30) NOT NULL DEFAULT 'CAMPAIGN_END',
        coupon_validity_minutes       integer NULL,
        coupon_absolute_expires_at    timestamptz NULL,
        created_at                    timestamptz NOT NULL DEFAULT now(),
        updated_at                    timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT campaign_limits_campaign_fk
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
          ON UPDATE RESTRICT ON DELETE CASCADE,

        CONSTRAINT campaign_limits_total_claim_ck
          CHECK (total_claim_limit > 0),

        CONSTRAINT campaign_limits_per_user_ck
          CHECK (per_user_claim_limit > 0),

        CONSTRAINT campaign_limits_redemptions_per_coupon_ck
          CHECK (max_redemptions_per_coupon > 0),

        CONSTRAINT campaign_limits_budget_ck
          CHECK (budget_amount IS NULL OR budget_amount > 0),

        CONSTRAINT campaign_limits_currency_ck
          CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),

        CONSTRAINT campaign_limits_budget_currency_ck
          CHECK (
            (budget_amount IS NULL AND currency IS NULL)
            OR
            (budget_amount IS NOT NULL AND currency IS NOT NULL)
          ),

        CONSTRAINT campaign_limits_validity_type_ck
          CHECK (coupon_validity_type IN (
            'CAMPAIGN_END',
            'FIXED_DURATION',
            'ABSOLUTE_DATE'
          )),

        CONSTRAINT campaign_limits_validity_values_ck
          CHECK (
            (
              coupon_validity_type = 'CAMPAIGN_END'
              AND coupon_validity_minutes IS NULL
              AND coupon_absolute_expires_at IS NULL
            )
            OR
            (
              coupon_validity_type = 'FIXED_DURATION'
              AND coupon_validity_minutes > 0
              AND coupon_absolute_expires_at IS NULL
            )
            OR
            (
              coupon_validity_type = 'ABSOLUTE_DATE'
              AND coupon_absolute_expires_at IS NOT NULL
              AND coupon_validity_minutes IS NULL
            )
          )
      );

      CREATE TRIGGER campaign_limits_set_updated_at
      BEFORE UPDATE ON campaign_limits
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE campaign_branches (
        campaign_id  uuid NOT NULL,
        branch_id    uuid NOT NULL,
        business_id  uuid NOT NULL,
        created_at   timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT campaign_branches_pk
          PRIMARY KEY (campaign_id, branch_id),

        CONSTRAINT campaign_branches_campaign_business_fk
          FOREIGN KEY (campaign_id, business_id)
          REFERENCES campaigns(id, business_id)
          ON UPDATE RESTRICT ON DELETE CASCADE,

        CONSTRAINT campaign_branches_branch_business_fk
          FOREIGN KEY (branch_id, business_id)
          REFERENCES branches(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT
      );

      CREATE INDEX campaign_branches_branch_idx
        ON campaign_branches(branch_id, campaign_id);

      CREATE TABLE campaign_sources (
        id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id               uuid NOT NULL,
        business_id               uuid NOT NULL,
        created_by_membership_id  uuid NULL,
        source_type               varchar(30) NOT NULL,
        label                     varchar(150) NOT NULL,
        label_en                  varchar(150) NULL,
        tracking_token            varchar(64) NOT NULL,
        status                    varchar(20) NOT NULL DEFAULT 'ACTIVE',
        is_system_generated       boolean NOT NULL DEFAULT false,
        created_at                timestamptz NOT NULL DEFAULT now(),
        updated_at                timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT campaign_sources_tracking_token_uq UNIQUE (tracking_token),
        CONSTRAINT campaign_sources_campaign_label_uq UNIQUE (campaign_id, label),
        CONSTRAINT campaign_sources_id_campaign_uq UNIQUE (id, campaign_id),
        CONSTRAINT campaign_sources_id_campaign_business_uq
          UNIQUE (id, campaign_id, business_id),

        CONSTRAINT campaign_sources_campaign_business_fk
          FOREIGN KEY (campaign_id, business_id)
          REFERENCES campaigns(id, business_id)
          ON UPDATE RESTRICT ON DELETE CASCADE,

        CONSTRAINT campaign_sources_creator_business_fk
          FOREIGN KEY (created_by_membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaign_sources_type_ck
          CHECK (source_type IN (
            'DIRECT',
            'COUPONHUB_SEARCH',
            'FACEBOOK',
            'INSTAGRAM',
            'WHATSAPP',
            'INFLUENCER',
            'PAID_AD',
            'OTHER'
          )),

        CONSTRAINT campaign_sources_status_ck
          CHECK (status IN ('ACTIVE', 'INACTIVE')),

        CONSTRAINT campaign_sources_label_not_blank_ck
          CHECK (btrim(label) <> ''),

        CONSTRAINT campaign_sources_tracking_token_not_blank_ck
          CHECK (btrim(tracking_token) <> ''),

        CONSTRAINT campaign_sources_system_type_ck
          CHECK (
            is_system_generated = false
            OR source_type IN ('DIRECT', 'COUPONHUB_SEARCH')
          )
      );

      CREATE UNIQUE INDEX campaign_sources_one_direct_per_campaign_uq
        ON campaign_sources(campaign_id)
        WHERE source_type = 'DIRECT';

      CREATE UNIQUE INDEX campaign_sources_campaign_label_en_uq
        ON campaign_sources(campaign_id, label_en)
        WHERE label_en IS NOT NULL;

      CREATE UNIQUE INDEX campaign_sources_one_search_per_campaign_uq
        ON campaign_sources(campaign_id)
        WHERE source_type = 'COUPONHUB_SEARCH';

      CREATE INDEX campaign_sources_campaign_type_status_idx
        ON campaign_sources(campaign_id, source_type, status);

      CREATE INDEX campaign_sources_business_idx
        ON campaign_sources(business_id, campaign_id);

      CREATE TRIGGER campaign_sources_set_updated_at
      BEFORE UPDATE ON campaign_sources
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE OR REPLACE FUNCTION create_default_campaign_sources()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        INSERT INTO campaign_sources (
          campaign_id,
          business_id,
        created_by_membership_id,
        source_type,
        label,
        label_en,
        tracking_token,
        status,
        is_system_generated
        )
        VALUES
          (
            NEW.id,
            NEW.business_id,
            NULL,
            'DIRECT',
            'Direct',
            'Direct',
            'direct-' || replace(NEW.id::text, '-', ''),
            'ACTIVE',
            true
          ),
          (
            NEW.id,
            NEW.business_id,
            NULL,
            'COUPONHUB_SEARCH',
            'CouponHub Search',
            'CouponHub Search',
            'search-' || replace(NEW.id::text, '-', ''),
            'ACTIVE',
            true
          );

        RETURN NEW;
      END;
      $$;

      CREATE TRIGGER campaigns_create_default_sources
      AFTER INSERT ON campaigns
      FOR EACH ROW EXECUTE FUNCTION create_default_campaign_sources();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS campaigns_create_default_sources ON campaigns;
      DROP FUNCTION IF EXISTS create_default_campaign_sources();
      DROP TRIGGER IF EXISTS campaign_sources_set_updated_at ON campaign_sources;
      DROP TABLE IF EXISTS campaign_sources;
      DROP TABLE IF EXISTS campaign_branches;
      DROP TRIGGER IF EXISTS campaign_limits_set_updated_at ON campaign_limits;
      DROP TABLE IF EXISTS campaign_limits;
      DROP TRIGGER IF EXISTS campaign_benefits_set_updated_at ON campaign_benefits;
      DROP TABLE IF EXISTS campaign_benefits;
      DROP TRIGGER IF EXISTS campaigns_set_updated_at ON campaigns;
      DROP TABLE IF EXISTS campaigns;
    `);
  }
}
