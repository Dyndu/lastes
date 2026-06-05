import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
    let interceptor: ResponseInterceptor;

    beforeEach(() => {
        interceptor = new ResponseInterceptor();
    });

    it('should call responseHandler with response data and context', (done) => {
        const mockResponseData = { foo: 'bar' };
        const mockStatusCode = 200;

        const mockContext: Partial<ExecutionContext> = {
            switchToHttp: () =>
                ({
                    getResponse: () => ({
                        statusCode: mockStatusCode,
                    }),
                }) as any,
        };

        const mockCallHandler: Partial<CallHandler> = {
            handle: () => of(mockResponseData),
        };

        interceptor
            .intercept(mockContext as ExecutionContext, mockCallHandler as CallHandler)
            .subscribe({
                next: (result) => {
                    expect(result).toEqual(
                        Object.freeze({
                            statusCode: mockStatusCode,
                            data: mockResponseData,
                        }),
                    );
                    done();
                },
                error: done.fail,
            });
    });

    it('responseHandler should return frozen object with statusCode and data', () => {
        const mockData = { key: 'value' };
        const mockStatusCode = 201;

        const mockContext: Partial<ExecutionContext> = {
            switchToHttp: () =>
                ({
                    getResponse: () => ({
                        statusCode: mockStatusCode,
                    }),
                }) as any,
        };

        const result = interceptor.responseHandler(mockData, mockContext as ExecutionContext);

        expect(result).toEqual({
            statusCode: mockStatusCode,
            data: mockData,
        });
        expect(Object.isFrozen(result)).toBe(true);
    });
});
