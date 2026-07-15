import { MigrationInterface } from 'typeorm';
import { EnablePostgresExtensions0010000000000001 } from './001-enable-postgres-extensions';
import { CreateReferenceData0020000000000002 } from './002-create-reference-data';
import { CreateIdentity0030000000000003 } from './003-create-identity';
import { CreateAuth0040000000000004 } from './004-create-auth';
import { CreateOrganizations0050000000000005 } from './005-create-organizations';
import { CreateCampaigns0060000000000006 } from './006-create-campaigns';
import { CreateDiscovery0070000000000007 } from './007-create-discovery';
import { CreateCoupons0080000000000008 } from './008-create-coupons';
import { CreateRedemptions0090000000000009 } from './009-create-redemptions';
import { CreateAudit0100000000000010 } from './010-create-audit';
import { CreateReportingViews0110000000000011 } from './011-create-reporting-views';
import { AlignOrganizationBilingualColumns0120000000000012 } from './012-align-organization-bilingual-columns';
import { AlignCampaignBilingualColumns0130000000000013 } from './013-align-campaign-bilingual-columns';
import { AddRedemptionImpactFields0140000000000014 } from './014-add-redemption-impact-fields';

export const databaseMigrations: Array<new () => MigrationInterface> = [
  EnablePostgresExtensions0010000000000001,
  CreateReferenceData0020000000000002,
  CreateIdentity0030000000000003,
  CreateAuth0040000000000004,
  CreateOrganizations0050000000000005,
  CreateCampaigns0060000000000006,
  CreateDiscovery0070000000000007,
  CreateCoupons0080000000000008,
  CreateRedemptions0090000000000009,
  CreateAudit0100000000000010,
  CreateReportingViews0110000000000011,
  AlignOrganizationBilingualColumns0120000000000012,
  AlignCampaignBilingualColumns0130000000000013,
  AddRedemptionImpactFields0140000000000014,
];
