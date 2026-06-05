import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export function StringArrayFieldDecorator(
    description = 'Array of strings',
    example: string[] = ['example'],
    minLength = 1,
    required = true,
    maxItems?: number,
) {
    return function (target: any, propertyKey: string) {
        ApiProperty({
            description,
            example,
            type: [String],
            required,
            maxItems,
        })(target, propertyKey);

        if (required)
            ArrayNotEmpty({ message: `${description} should not be empty` })(target, propertyKey);
        else IsOptional()(target, propertyKey);

        ArrayUnique({
            message: `${description} must not contain duplicate values`,
        })(target, propertyKey);
        IsArray({ message: `${description} must be an array` })(target, propertyKey);
        IsString({
            each: true,
            message: `${description} elements must be strings`,
        })(target, propertyKey);
        MinLength(minLength, {
            each: true,
            message: `${description} elements must be at least ${minLength} characters long`,
        })(target, propertyKey);

        if (maxItems !== undefined)
            ArrayMaxSize(maxItems, {
                message: `${description} must contain at most ${maxItems} items`,
            })(target, propertyKey);
    };
}
