import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiResponseDecorator(statusCode: number, description: string) {
    return applyDecorators(
        ApiResponse({
            status: statusCode,
            description: description,
        }),
    );
}
