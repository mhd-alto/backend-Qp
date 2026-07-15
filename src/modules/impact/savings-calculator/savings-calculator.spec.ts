import { calculateDiscount } from './savings-calculator';

describe('SavingsCalculator - calculateDiscount', () => {
  it('should calculate percentage discount correctly', () => {
    const result = calculateDiscount({
      originalAmount: 1000,
      benefitType: 'PERCENTAGE',
      percentageValue: 15, // 15%
    });

    expect(result.discountAmount).toBe(150);
    expect(result.finalAmount).toBe(850);
  });

  it('should apply max discount amount on percentage benefit', () => {
    const result = calculateDiscount({
      originalAmount: 10000,
      benefitType: 'PERCENTAGE',
      percentageValue: 10, // 10% of 10000 is 1000
      maxDiscountAmount: 500, // but capped at 500
    });

    expect(result.discountAmount).toBe(500);
    expect(result.finalAmount).toBe(9500);
  });

  it('should calculate fixed discount correctly', () => {
    const result = calculateDiscount({
      originalAmount: 2500,
      benefitType: 'FIXED_AMOUNT',
      fixedAmount: 400,
    });

    expect(result.discountAmount).toBe(400);
    expect(result.finalAmount).toBe(2100);
  });

  it('should cap fixed discount at original amount if it exceeds it', () => {
    const result = calculateDiscount({
      originalAmount: 300,
      benefitType: 'FIXED_AMOUNT',
      fixedAmount: 500,
    });

    expect(result.discountAmount).toBe(300);
    expect(result.finalAmount).toBe(0);
  });

  it('should handle rounding of percentage discount properly', () => {
    const result = calculateDiscount({
      originalAmount: 105.5,
      benefitType: 'PERCENTAGE',
      percentageValue: 12.5, // 12.5% of 105.5 is 13.1875 -> rounded to 13.19
    });

    expect(result.discountAmount).toBe(13.19);
    expect(result.finalAmount).toBe(92.31);
  });
});
