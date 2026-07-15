export interface CalculateDiscountInput {
  originalAmount: number;
  benefitType: string;
  percentageValue?: number | null;
  fixedAmount?: number | null;
  maxDiscountAmount?: number | null;
}

export interface CalculateDiscountResult {
  discountAmount: number;
  finalAmount: number;
}

/**
 * Calculates the discount and final amount based on percentage or fixed rules, including rounding.
 */
export function calculateDiscount(
  input: CalculateDiscountInput,
): CalculateDiscountResult {
  let discount = 0;
  const original = input.originalAmount;

  if (input.benefitType === 'PERCENTAGE' && input.percentageValue) {
    const pct = input.percentageValue / 100;
    discount = original * pct;
    if (input.maxDiscountAmount) {
      discount = Math.min(discount, input.maxDiscountAmount);
    }
  } else if (input.benefitType === 'FIXED_AMOUNT' && input.fixedAmount) {
    discount = input.fixedAmount;
    if (discount > original) {
      discount = original;
    }
  }

  const discountAmount = Math.round(discount * 100) / 100;
  const finalAmount = Math.round((original - discountAmount) * 100) / 100;

  return {
    discountAmount,
    finalAmount,
  };
}
