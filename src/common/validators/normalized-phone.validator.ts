import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const NORMALIZED_PHONE_REGEX = /^\+?[0-9]{8,20}$/;

export function IsNormalizedPhone(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isNormalizedPhone',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value?: string | null) {
          if (value === undefined || value === null || value === '') {
            return true;
          }

          return NORMALIZED_PHONE_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}
