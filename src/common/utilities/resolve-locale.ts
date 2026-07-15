import { SupportedLocale } from '../constants/localized-messages';

export function resolveLocale(headerValue: string | undefined): SupportedLocale {
  if (!headerValue) {
    return 'ar';
  }

  const normalized = headerValue.toLowerCase();

  if (normalized.startsWith('en')) {
    return 'en';
  }

  return 'ar';
}
