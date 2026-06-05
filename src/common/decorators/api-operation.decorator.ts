import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '../index';

export function ApiOperationDecorator(summary: string, description: string) {
    return applyDecorators(
        ApiOperation({
            summary,
            description,
        }),
    );
}
