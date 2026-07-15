import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { ManualCouponCode } from '../value-objects/manual-coupon-code';
import { CouponCodeGenerator } from './coupon-code-generator';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

@Injectable()
export class RandomCouponCodeGeneratorService implements CouponCodeGenerator {
  generate(): string {
    let value = '';

    for (let index = 0; index < CODE_LENGTH; index += 1) {
      value += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }

    return ManualCouponCode.normalize(value);
  }
}
