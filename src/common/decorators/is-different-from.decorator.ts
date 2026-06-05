import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDifferentFrom(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isDifferentFrom',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];

                    if (
                        (value === undefined || value === null) &&
                        (relatedValue === undefined || relatedValue === null)
                    )
                        return true;

                    if (
                        value === undefined ||
                        value === null ||
                        relatedValue === undefined ||
                        relatedValue === null
                    )
                        return true;

                    return value !== relatedValue;
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${propertyName} must be different from ${relatedPropertyName}`;
                },
            },
        });
    };
}
