import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '../index';

export function ApiParamDecorator(
    entity: string,
    name = 'id',
    example = '30ac88d4-7ffe-418c-9551-66eeec2e6783',
) {
    return applyDecorators(
        ApiParam({
            name,
            description: `The ${name} parameter of the ${entity}`,
            example,
        }),
    );
}
