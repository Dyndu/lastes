import { ApiQuery } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { QueryParamConfigInterface } from '../../interface';

export function ApiQueryDecorator(params: QueryParamConfigInterface | QueryParamConfigInterface[]) {
    const queries = Array.isArray(params) ? params : [params];

    const decorators = queries.map((param) => {
        const config: any = {
            name: param.name,
            required: param.required ?? false,
            description: param.description,
        };

        if (param.enum) config.enum = param.enum;
        else if (param.type) {
            switch (param.type) {
                case 'string':
                    config.type = String;
                    break;
                case 'number':
                    config.type = Number;
                    break;
                case 'boolean':
                    config.type = Boolean;
                    break;
            }
        }

        if (param.isArray) config.isArray = true;
        return ApiQuery(config);
    });

    return applyDecorators(...decorators);
}
