import { CreateSwaggerConfig } from './documentation.config';

describe('CreateSwaggerConfig', () => {
    it('should return a valid swagger configuration and custom options', () => {
        const { config, customOptions } = CreateSwaggerConfig();

        expect(config).toBeDefined();
        expect(config.info).toBeDefined();
        expect(config.info.title).toBe('Rent Roi API');
        expect(config.info.version).toBe('1.0');
        expect(config.info.description).toBe('The Rent Roi API description');
        expect(config.info.license?.name).toBe('MIT');
        expect(config.info.contact?.email).toBe('softvodooz@gmail.com');

        expect(config.components?.securitySchemes?.JWT).toEqual({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        });

        expect(customOptions).toBeDefined();
        expect(customOptions.swaggerOptions).toBeDefined();
        expect(customOptions.swaggerOptions?.url).toBe('/docs-json');
        expect(customOptions.swaggerOptions?.filter).toBe(true);
        expect(customOptions.swaggerOptions?.tagsSorter).toBe('alpha');
        expect(customOptions.swaggerOptions?.docExpansion).toBe('none');

        const sorter = customOptions.swaggerOptions?.operationsSorter;

        const makeOp = (method: string, path: string) =>
            new Map([
                ['method', method],
                ['path', path],
            ]);

        const getOp = makeOp('get', '/users');
        const postOp = makeOp('post', '/users');
        const deleteOp = makeOp('delete', '/users');
        const patchOp = makeOp('patch', '/users');

        expect(sorter(getOp, postOp)).toBeLessThan(0);
        expect(sorter(postOp, patchOp)).toBeLessThan(0);
        expect(sorter(patchOp, deleteOp)).toBeLessThan(0);

        const opA = makeOp('get', '/aaa');
        const opB = makeOp('get', '/bbb');
        expect(sorter(opA, opB)).toBeLessThan(0);
    });

    it('should be reproducible — calling twice returns same structure', () => {
        const result1 = CreateSwaggerConfig();
        const result2 = CreateSwaggerConfig();

        const normalize = (obj: any) => ({
            ...obj,
            customOptions: {
                ...obj.customOptions,
                swaggerOptions: {
                    ...obj.customOptions.swaggerOptions,
                    operationsSorter: 'function',
                },
            },
        });

        expect(normalize(result1)).toEqual(normalize(result2));
    });
});
