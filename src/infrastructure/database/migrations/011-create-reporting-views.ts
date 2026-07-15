import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportingViews0110000000000011
  implements MigrationInterface
{
  name = 'CreateReportingViews0110000000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE VIEW campaign_performance_summary AS
      WITH visit_stats AS (
        SELECT
          campaign_id,
          count(*) AS total_visits,
          count(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS known_unique_users,
          count(DISTINCT visitor_hash) FILTER (WHERE visitor_hash IS NOT NULL) AS anonymous_unique_visitors
        FROM campaign_visits
        GROUP BY campaign_id
      ),
      coupon_stats AS (
        SELECT
          campaign_id,
          count(*) AS issued_coupons,
          count(*) FILTER (WHERE status = 'AVAILABLE') AS available_coupons,
          count(*) FILTER (WHERE status = 'REDEEMED') AS redeemed_coupons,
          count(*) FILTER (WHERE status = 'EXPIRED') AS expired_coupons,
          count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_coupons
        FROM coupons
        GROUP BY campaign_id
      ),
      redemption_stats AS (
        SELECT
          campaign_id,
          count(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_redemptions,
          count(*) FILTER (WHERE status = 'REVERSED') AS reversed_redemptions,
          coalesce(sum(invoice_amount) FILTER (WHERE status = 'CONFIRMED'), 0) AS recorded_sales,
          coalesce(sum(discount_amount) FILTER (WHERE status = 'CONFIRMED'), 0) AS recorded_discount
        FROM redemptions
        GROUP BY campaign_id
      )
      SELECT
        c.id AS campaign_id,
        c.business_id,
        c.title,
        c.status,
        cl.total_claim_limit,
        coalesce(v.total_visits, 0) AS total_visits,
        coalesce(v.known_unique_users, 0) AS known_unique_users,
        coalesce(v.anonymous_unique_visitors, 0) AS anonymous_unique_visitors,
        coalesce(cs.issued_coupons, 0) AS issued_coupons,
        greatest(cl.total_claim_limit - coalesce(cs.issued_coupons, 0), 0) AS remaining_quota,
        coalesce(cs.available_coupons, 0) AS available_coupons,
        coalesce(cs.redeemed_coupons, 0) AS redeemed_coupons,
        coalesce(cs.expired_coupons, 0) AS expired_coupons,
        coalesce(cs.cancelled_coupons, 0) AS cancelled_coupons,
        coalesce(rs.confirmed_redemptions, 0) AS confirmed_redemptions,
        coalesce(rs.reversed_redemptions, 0) AS reversed_redemptions,
        coalesce(rs.recorded_sales, 0) AS recorded_sales,
        coalesce(rs.recorded_discount, 0) AS recorded_discount,
        CASE
          WHEN coalesce(v.total_visits, 0) = 0 THEN 0::numeric
          ELSE round(
            coalesce(cs.issued_coupons, 0)::numeric
            / v.total_visits::numeric * 100,
            2
          )
        END AS claim_rate_percent,
        CASE
          WHEN coalesce(cs.issued_coupons, 0) = 0 THEN 0::numeric
          ELSE round(
            coalesce(rs.confirmed_redemptions, 0)::numeric
            / cs.issued_coupons::numeric * 100,
            2
          )
        END AS redemption_rate_percent
      FROM campaigns c
      JOIN campaign_limits cl ON cl.campaign_id = c.id
      LEFT JOIN visit_stats v ON v.campaign_id = c.id
      LEFT JOIN coupon_stats cs ON cs.campaign_id = c.id
      LEFT JOIN redemption_stats rs ON rs.campaign_id = c.id;

      CREATE VIEW campaign_source_performance AS
      WITH visit_stats AS (
        SELECT
          campaign_id,
          source_id,
          count(*) AS total_visits
        FROM campaign_visits
        GROUP BY campaign_id, source_id
      ),
      coupon_stats AS (
        SELECT
          campaign_id,
          source_id,
          count(*) AS issued_coupons,
          count(*) FILTER (WHERE status = 'REDEEMED') AS redeemed_coupons
        FROM coupons
        GROUP BY campaign_id, source_id
      ),
      redemption_stats AS (
        SELECT
          c.campaign_id,
          c.source_id,
          count(r.id) FILTER (WHERE r.status = 'CONFIRMED') AS confirmed_redemptions
        FROM coupons c
        LEFT JOIN redemptions r ON r.coupon_id = c.id
        GROUP BY c.campaign_id, c.source_id
      )
      SELECT
        s.id AS source_id,
        s.campaign_id,
        s.business_id,
        s.source_type,
        s.label,
        s.status,
        coalesce(v.total_visits, 0) AS total_visits,
        coalesce(cs.issued_coupons, 0) AS issued_coupons,
        coalesce(rs.confirmed_redemptions, 0) AS confirmed_redemptions,
        CASE
          WHEN coalesce(v.total_visits, 0) = 0 THEN 0::numeric
          ELSE round(
            coalesce(cs.issued_coupons, 0)::numeric
            / v.total_visits::numeric * 100,
            2
          )
        END AS claim_rate_percent,
        CASE
          WHEN coalesce(cs.issued_coupons, 0) = 0 THEN 0::numeric
          ELSE round(
            coalesce(rs.confirmed_redemptions, 0)::numeric
            / cs.issued_coupons::numeric * 100,
            2
          )
        END AS redemption_rate_percent
      FROM campaign_sources s
      LEFT JOIN visit_stats v
        ON v.campaign_id = s.campaign_id AND v.source_id = s.id
      LEFT JOIN coupon_stats cs
        ON cs.campaign_id = s.campaign_id AND cs.source_id = s.id
      LEFT JOIN redemption_stats rs
        ON rs.campaign_id = s.campaign_id AND rs.source_id = s.id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW IF EXISTS campaign_source_performance;
      DROP VIEW IF EXISTS campaign_performance_summary;
    `);
  }
}
