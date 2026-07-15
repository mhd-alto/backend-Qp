import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../domain/services/password-hasher';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(value, salt, 64).toString('hex');
    return `scrypt$${salt}$${derivedKey}`;
  }

  async verify(value: string, hash: string): Promise<boolean> {
    const [algorithm, salt, derivedKey] = hash.split('$');

    if (algorithm !== 'scrypt' || !salt || !derivedKey) {
      return false;
    }

    const computed = scryptSync(value, salt, 64);
    const original = Buffer.from(derivedKey, 'hex');

    if (computed.length !== original.length) {
      return false;
    }

    return timingSafeEqual(computed, original);
  }
}
