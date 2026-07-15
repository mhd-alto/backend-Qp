import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignBenefitOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { BranchOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { CategoryOrmEntity } from '../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';

export interface SmartSearchIntent {
  category: string | null;
  location: string | null;
  availability: string | null;
  budgetPreference: string | null;
  groupSize: number | null;
}

export interface SmartSearchResponseOffer {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  imageUrl: string | null;
  description: string;
  businessName: string;
  branchName: string;
  discountDescription: string;
  whyMatches: string[];
  score: number;
}

export interface SmartSearchResponseDto {
  interpretedIntent: SmartSearchIntent;
  offers: SmartSearchResponseOffer[];
  explanation: string;
}

@Injectable()
export class SmartOfferSearchService {
  private readonly logger = new Logger(SmartOfferSearchService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
  ) {
    this.apiKey = this.configService.get<string>('features.geminiApiKey') || '';
  }

  /**
   * Processes natural language search queries using Gemini to extract filters
   * and queries the database with rule-based ranking.
   */
  async search(queryText: string): Promise<SmartSearchResponseDto> {
    const intent = await this.parseQueryWithGemini(queryText);

    // Fetch active and searchable campaigns with their branches, benefits, and categories
    const campaigns = await this.campaignRepository
      .createQueryBuilder('campaign')
      .innerJoinAndSelect(
        BusinessOrmEntity,
        'business',
        'business.id = campaign.business_id AND business.status = :activeStatus',
        { activeStatus: 'ACTIVE' },
      )
      .innerJoinAndSelect(
        CampaignBenefitOrmEntity,
        'benefit',
        'benefit.campaign_id = campaign.id',
      )
      .innerJoinAndSelect(
        CategoryOrmEntity,
        'category',
        'category.id = campaign.primary_category_id',
      )
      .leftJoinAndSelect(
        'campaign_branches',
        'cb',
        'cb.campaign_id = campaign.id',
      )
      .leftJoinAndMapMany(
        'campaign.branches',
        BranchOrmEntity,
        'branch',
        'branch.id = cb.branch_id AND branch.deleted_at IS NULL AND branch.status = :activeStatus',
        { activeStatus: 'ACTIVE' },
      )
      .where('campaign.status = :activeStatus', { activeStatus: 'ACTIVE' })
      .andWhere('campaign.is_searchable = true')
      .andWhere('campaign.start_at <= :now', { now: new Date() })
      .andWhere('campaign.end_at >= :now', { now: new Date() })
      .getRawMany();

    const ranked: SmartSearchResponseOffer[] = [];

    for (const raw of campaigns) {
      let score = 0;
      const whyMatches: string[] = [];

      const campaignTitle = raw.campaign_title || '';
      const campaignDescription = raw.campaign_description || '';
      const categoryNameAr = raw.category_name_ar || '';
      const categoryNameEn = raw.category_name_en || '';
      const categorySlug = raw.category_slug || '';
      const branchName = raw.branch_name || '';
      const addressLine = raw.branch_address_line || '';

      // 1. Category Matching
      let categoryMatched = true;
      if (intent.category) {
        const cat = intent.category.toLowerCase();
        if (
          categorySlug.includes(cat) ||
          categoryNameAr.includes(cat) ||
          categoryNameEn.toLowerCase().includes(cat)
        ) {
          score += 10;
          whyMatches.push(
            `Matches your interest in ${intent.category} category.`,
          );
        } else {
          categoryMatched = false;
        }
      }

      // 2. Location Matching
      let locationMatched = true;
      if (intent.location) {
        const loc = intent.location.toLowerCase();
        if (
          branchName.toLowerCase().includes(loc) ||
          addressLine.toLowerCase().includes(loc) ||
          campaignDescription.toLowerCase().includes(loc)
        ) {
          score += 15;
          whyMatches.push(`Located in your requested area: ${intent.location}.`);
        } else {
          locationMatched = false;
        }
      }

      // If category or location was specified but not matched, filter this offer out
      if (!categoryMatched || !locationMatched) {
        continue;
      }

      // 3. Availability Match
      if (intent.availability) {
        const av = intent.availability.toLowerCase();
        if (av.includes('today') || av.includes('now')) {
          score += 5;
          whyMatches.push('Valid and active to use today.');
        }
      }

      // Default match if no specific matches but active
      if (whyMatches.length === 0) {
        score += 1;
        whyMatches.push('Active offer matching basic criteria.');
      }

      // Format benefit description
      const bType = raw.benefit_benefit_type;
      let discountDesc = '';
      if (bType === 'PERCENTAGE') {
        discountDesc = `${Math.round(Number(raw.benefit_percentage_value))}% Off`;
      } else if (bType === 'FIXED_AMOUNT') {
        discountDesc = `${Math.round(Number(raw.benefit_fixed_amount))} ${raw.benefit_currency} Off`;
      } else {
        discountDesc = 'Special Offer';
      }

      ranked.push({
        id: raw.campaign_id,
        slug: raw.campaign_campaign_slug || raw.campaign_public_slug,
        title: raw.campaign_title,
        titleEn: raw.campaign_title_en || null,
        imageUrl: raw.campaign_image_url || null,
        description: raw.campaign_description,
        businessName: raw.business_display_name,
        branchName: raw.branch_name || 'All Branches',
        discountDescription: discountDesc,
        whyMatches,
        score,
      });
    }

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);

    const matchCount = ranked.filter((o) => o.score > 1).length;
    let explanation = '';
    if (intent.location && intent.category) {
      explanation = `Found ${matchCount} offers matching '${intent.category}' in '${intent.location}'.`;
    } else if (intent.location) {
      explanation = `Found ${matchCount} offers located near '${intent.location}'.`;
    } else if (intent.category) {
      explanation = `Found ${matchCount} offers matching your interest in '${intent.category}'.`;
    } else {
      explanation = `Browse active offers matching your request.`;
    }

    return {
      interpretedIntent: intent,
      offers: ranked,
      explanation,
    };
  }

  private async parseQueryWithGemini(queryText: string): Promise<SmartSearchIntent> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Parsing intent locally.');
      return this.localParseIntent(queryText);
    }

    const systemInstruction = `You are a natural language search assistant for Qpon in Syria.
Analyze the user's search query (written in English, Modern Standard Arabic, or Syrian Colloquial Arabic) and extract search parameters.
Return ONLY a JSON object matching this schema, no markdown codeblocks, no extra texts:
{
  "category": "restaurants | retail | services | fashion | grocery | sweet | default or null",
  "location": "Mezzeh | Mezze | Bab Touma | Shaalan | Damascus | Homs | Aleppo | null",
  "availability": "today | weekend | future | null",
  "budgetPreference": "cheap | medium | luxury | null",
  "groupSize": number or null
}
Ensure colloquial Arabic terms (e.g., "بالمزة", "عشا", "أكل", "فطور") are correctly interpreted (e.g. "بالمزة" -> location: Mezzeh, "عشا" -> category: restaurants).`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Query: "${queryText}"` }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty search intent response.');
      }

      const intent: SmartSearchIntent = JSON.parse(text.trim());
      return intent;
    } catch (err: any) {
      this.logger.error(`Failed to parse search query via Gemini: ${err.message}. Using local parser.`);
      return this.localParseIntent(queryText);
    }
  }

  private localParseIntent(queryText: string): SmartSearchIntent {
    const text = queryText.toLowerCase();
    const intent: SmartSearchIntent = {
      category: null,
      location: null,
      availability: null,
      budgetPreference: null,
      groupSize: null,
    };

    // Category fallbacks
    if (text.includes('عشا') || text.includes('أكل') || text.includes('مطعم') || text.includes('food') || text.includes('eat') || text.includes('restaurant')) {
      intent.category = 'restaurants';
    } else if (text.includes('لبس') || text.includes('ثياب') || text.includes('fashion') || text.includes('clothes')) {
      intent.category = 'fashion';
    }

    // Location fallbacks
    if (text.includes('مزة') || text.includes('mezze')) {
      intent.location = 'Mezzeh';
    } else if (text.includes('شعلان') || text.includes('shaalan')) {
      intent.location = 'Shaalan';
    } else if (text.includes('شام') || text.includes('دمشق') || text.includes('damascus')) {
      intent.location = 'Damascus';
    }

    // Availability fallbacks
    if (text.includes('يوم') || text.includes('today')) {
      intent.availability = 'today';
    }

    return intent;
  }
}
