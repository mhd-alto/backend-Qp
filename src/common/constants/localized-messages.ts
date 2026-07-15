export type SupportedLocale = 'ar' | 'en';

export type LocalizedMessage = Record<SupportedLocale, string>;

export const FRIENDLY_MESSAGES: Record<string, LocalizedMessage> = {
  VALIDATION_ERROR: {
    ar: 'بعض البيانات المدخلة غير صحيحة. يرجى التحقق منها ثم المحاولة مرة أخرى.',
    en: 'Some information is invalid. Please review the fields and try again.',
  },
  FORBIDDEN: {
    ar: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
    en: 'You do not have permission to perform this action.',
  },
  RESOURCE_NOT_FOUND: {
    ar: 'تعذر العثور على العنصر المطلوب.',
    en: 'We could not find the requested resource.',
  },
  INTERNAL_SERVER_ERROR: {
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى بعد قليل.',
    en: 'Something went wrong. Please try again in a moment.',
  },
  SERVICE_NOT_READY: {
    ar: 'الخدمة غير جاهزة حالياً. يرجى المحاولة بعد قليل.',
    en: 'The service is not ready yet. Please try again shortly.',
  },
  REQUEST_FAILED: {
    ar: 'تعذر إكمال الطلب حالياً.',
    en: 'The request could not be completed right now.',
  },
  IDENTIFIER_ALREADY_IN_USE: {
    ar: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل.',
    en: 'The email address or phone number is already in use.',
  },
  INVALID_CREDENTIALS: {
    ar: 'بيانات تسجيل الدخول غير صحيحة.',
    en: 'The login details are not correct.',
  },
  ACCOUNT_NOT_ACTIVE: {
    ar: 'هذا الحساب غير متاح لتسجيل الدخول حالياً.',
    en: 'This account is not available for sign-in right now.',
  },
  AUTH_SECRET_MISCONFIGURED: {
    ar: 'إعدادات التوثيق غير مكتملة حالياً.',
    en: 'Authentication is not configured correctly right now.',
  },
};
