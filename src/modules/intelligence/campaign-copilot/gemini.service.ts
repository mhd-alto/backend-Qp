import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiCampaignContent {
  reason: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  termsOfUseAr: string;
  termsOfUseEn: string;
  callToActionAr: string;
  callToActionEn: string;
  imagePrompt: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('features.geminiApiKey') || '';
  }

  /**
   * Calls Gemini to generate bilingual campaign copy and explanation.
   */
  async generateCampaignContent(
    recommendationJson: any,
    businessCategory: string,
    goal: string,
  ): Promise<GeminiCampaignContent> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Using fallback templates.');
      return this.getFallbackContent(recommendationJson, businessCategory, goal);
    }

    const systemInstruction = `You are an expert campaign copywriter for Qpon, an intelligent promotion platform in Syria.
You will be given the output of a rule-based campaign recommendation engine as JSON, along with the business category and goal.
Your task is to generate marketing copy and campaign parameters.
CRITICAL RULES:
1. Do not calculate, invent, or alter any numeric estimates or numbers you are given (e.g. discount percent, quota). Only explain and write copy around the provided numbers.
2. Return ONLY a valid JSON object matching the requested schema. No markdown formatting outside the JSON, no backticks, no wrap.
3. Generate high-quality copy in both Arabic and English. Ensure the Arabic sounds professional, natural, and appealing for Syrian colloquial or modern standard settings.
4. Keep the reason concise (1 paragraph).`;

    const prompt = `Business Category: ${businessCategory}
Campaign Goal: ${goal}
Recommendation Data: ${JSON.stringify(recommendationJson)}

Generate JSON following this exact schema:
{
  "reason": "A one-paragraph explanation of why this campaign is recommended for the goal",
  "titleAr": "Catchy campaign title in Arabic",
  "titleEn": "Catchy campaign title in English",
  "descriptionAr": "Short description of the offer in Arabic",
  "descriptionEn": "Short description of the offer in English",
  "termsOfUseAr": "Terms of use (e.g. valid for 1 claim, cannot be combined) in Arabic",
  "termsOfUseEn": "Terms of use in English",
  "callToActionAr": "Call to action line (e.g. احصل على كوبونك الآن) in Arabic",
  "callToActionEn": "Call to action line (e.g. Claim your coupon now!) in English",
  "imagePrompt": "Detailed English image prompt to generate a high-quality banner for this campaign"
}`;

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        const parsed: GeminiCampaignContent = JSON.parse(text.trim());
        return parsed;
      } catch (err: any) {
        this.logger.error(`Attempt ${attempts} failed to generate content from Gemini: ${err.message}`);
        if (attempts >= maxAttempts) {
          this.logger.warn('Both Gemini attempts failed. Using fallback templates.');
          return this.getFallbackContent(recommendationJson, businessCategory, goal);
        }
      }
    }

    return this.getFallbackContent(recommendationJson, businessCategory, goal);
  }

  private getFallbackContent(
    rec: any,
    businessCategory: string,
    goal: string,
  ): GeminiCampaignContent {
    const discount = rec.discountPercent;
    return {
      reason: `This campaign is recommended to address your goal of '${goal}' in the ${businessCategory} category by leveraging a targeted ${discount}% discount to attract customer interest.`,
      titleAr: `خصم ${discount}% مميز من كيو بون`,
      titleEn: `Special ${discount}% Discount Offer`,
      descriptionAr: `احصل على خصم بقيمة ${discount}% على جميع خدماتنا ومنتجاتنا لفترة محدودة.`,
      descriptionEn: `Enjoy a ${discount}% discount on all products and services for a limited time.`,
      termsOfUseAr: `الكوبون صالح لمرة واحدة فقط. لا يمكن دمجه مع عروض أخرى.`,
      termsOfUseEn: `Valid for one-time redemption. Cannot be combined with other offers.`,
      callToActionAr: `احصل على العرض الآن!`,
      callToActionEn: `Claim the offer now!`,
      imagePrompt: `Minimalist banner showcasing a discount badge of ${discount}% with clean modern typography on a warm background.`,
    };
  }
}
