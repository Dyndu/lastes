import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export function DateFieldDecorator(
    description = 'Date field',
    example = '2024-12-01T00:00:00.000Z',
    options?: {
        required?: boolean;
        strict?: boolean;
        useISO8601?: boolean;
    },
) {
    const { required = true, strict = true, useISO8601 = true } = options || {};

    return function (target: any, propertyKey: string) {
        ApiProperty({
            description,
            example,
            required,
        })(target, propertyKey);

        if (required) IsNotEmpty({ message: `${description} is required` })(target, propertyKey);
        else IsOptional()(target, propertyKey);

        if (useISO8601) {
            IsISO8601({ strict }, { message: `${description} must be a valid ISO 8601 string` })(
                target,
                propertyKey,
            );
        } else {
            IsDateString({}, { message: `${description} must be a valid date string` })(
                target,
                propertyKey,
            );
        }
    };
}
