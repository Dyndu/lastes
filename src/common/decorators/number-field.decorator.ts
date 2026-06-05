import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Creates a reusable decorator for numeric dto fields, configuring Swagger documentation,
 * required or optional validation, numeric constraints, and minimum value rules with optional
 * support for negative numbers.
 */
export function NumberFieldDecorator(
    description = 'Numeric field',
    example = 100,
    {
        required = true,
        min = 0,
        max,
        allowNegative = false,
    }: {
        required?: boolean;
        min?: number;
        max?: number;
        allowNegative?: boolean;
    } = {},
) {
    return function (target: any, propertyKey: string) {
        ApiProperty({
            description,
            example,
            required,
            type: Number,
        })(target, propertyKey);

        if (required) IsNotEmpty({ message: `${description} is required` })(target, propertyKey);
        else IsOptional()(target, propertyKey);

        IsNumber(
            { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
            { message: `${description} must be a valid number` },
        )(target, propertyKey);

        Min(allowNegative ? min : Math.max(min, 0), {
            message: `${description} must be greater than or equal to ${allowNegative ? min : Math.max(min, 0)}`,
        })(target, propertyKey);

        if (max)
            Max(max, {
                message: `${description} must be less than or equal to ${max}`,
            })(target, propertyKey);
    };
}
