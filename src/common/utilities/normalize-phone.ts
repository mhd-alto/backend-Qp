export function normalizePhone(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return null;
  }

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}
