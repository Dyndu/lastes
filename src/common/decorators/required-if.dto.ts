import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsRequiredIf(
    condition: (object: any) => boolean,
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isRequiredIf',
            target: object.constructor,
            propertyName,
            options: {
                ...validationOptions,
                always: true,
            },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const obj = args.object as any;

                    if (condition(obj)) {
                        if (value === undefined || value === null) return false;

                        if (typeof value === 'string') return value.trim().length > 0;
                        return true;
                    }

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return validationOptions?.message?.toString() || `${args.property} is required`;
                },
            },
        });
    };
}
