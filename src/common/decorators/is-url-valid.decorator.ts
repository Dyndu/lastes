import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidUrl(keyword?: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidUrl',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [keyword],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value || typeof value !== 'string') return false;

                    if (!value.startsWith('https://')) return false;

                    const [keyword] = args.constraints;
                    if (keyword) {
                        const lowerCaseValue = value.toLowerCase();
                        const lowerCaseKeyword = keyword.toLowerCase();

                        if (!lowerCaseValue.includes(lowerCaseKeyword)) return false;
                    }

                    try {
                        new URL(value);
                        return true;
                    } catch {
                        return false;
                    }
                },
                defaultMessage(args: ValidationArguments) {
                    const [keyword] = args.constraints;
                    if (keyword) {
                        return `${args.property} must be a valid HTTPS URL containing "${keyword}"`;
                    }
                    return `${args.property} must be a valid HTTPS URL`;
                },
            },
        });
    };
}
