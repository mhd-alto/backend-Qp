import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nameAr!: string;

  @ApiPropertyOptional({ nullable: true })
  nameEn!: string | null;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  status!: string;
}

export class BranchSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  nameEn!: string | null;

  @ApiProperty()
  addressLine!: string;

  @ApiPropertyOptional({ nullable: true })
  addressLineEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
}

export class MemberUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  platformRole!: string;

  @ApiProperty()
  status!: string;
}

export class BusinessMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ type: MemberUserResponseDto })
  user!: MemberUserResponseDto;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;
}

export class BusinessSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  displayNameEn!: string | null;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: BranchSummaryResponseDto })
  primaryBranch!: BranchSummaryResponseDto;
}

export class BusinessDetailsResponseDto extends BusinessSummaryResponseDto {
  @ApiPropertyOptional({ nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  descriptionEn!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiProperty({ type: OrganizationCategoryResponseDto })
  primaryCategory!: OrganizationCategoryResponseDto;

  @ApiProperty({ type: BusinessMemberResponseDto, isArray: true })
  members!: BusinessMemberResponseDto[];
}

export class BusinessPageMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pageCount!: number;
}

export class BusinessPageResponseDto {
  @ApiProperty({ type: BusinessSummaryResponseDto, isArray: true })
  items!: BusinessSummaryResponseDto[];

  @ApiProperty({ type: BusinessPageMetaDto })
  meta!: BusinessPageMetaDto;
}
