import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function AtLeastOneField(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'atLeastOneField',
      target: target.constructor,
      propertyName,
      constraints: fields,
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const object = args.object as Record<string, unknown>;
          const properties = args.constraints as string[];

          return properties.some((property) => {
            const value = object[property];
            return (
              value !== undefined &&
              value !== null &&
              String(value).trim().length > 0
            );
          });
        },
      },
    });
  };
}
