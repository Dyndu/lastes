import { ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logger.interceptor';

describe('LoggingInterceptor', () => {
    let interceptor: LoggingInterceptor;
    let loggerMock: any;
    let contextMock: any;
    let nextMock: any;

    beforeEach(() => {
        loggerMock = {
            info: jest.fn(),
            error: jest.fn(),
        };

        interceptor = new LoggingInterceptor(loggerMock);

        contextMock = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue({
                    method: 'GET',
                    originalUrl: '/api/test',
                    body: { foo: 'bar' },
                    params: {},
                    query: {},
                }),
                getResponse: jest.fn().mockReturnValue({
                    statusCode: 200,
                }),
            }),
        };

        nextMock = {
            handle: jest.fn(),
        };
    });

    it('should log request info on success', (done) => {
        const fakeResponse = { message: 'ok' };
        nextMock.handle.mockReturnValue(of(fakeResponse));

        interceptor.intercept(contextMock as unknown as ExecutionContext, nextMock).subscribe({
            next: () => {
                expect(loggerMock.info).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: expect.stringContaining('GET /api/test 200'),
                        method: 'GET',
                        url: '/api/test',
                        statusCode: 200,
                        responseBody: fakeResponse,
                    }),
                );
                done();
            },
        });
    });

    it('should log error details on failure', (done) => {
        const error = new Error('Something failed');
        (error as any).status = 400;
        nextMock.handle.mockReturnValue(throwError(() => error));

        interceptor.intercept(contextMock as unknown as ExecutionContext, nextMock).subscribe({
            error: () => {
                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining('GET /api/test 400'),
                    expect.objectContaining({
                        stack: error.stack,
                    }),
                );
                done();
            },
        });
    });

    it('should omit request params and query if empty', (done) => {
        nextMock.handle.mockReturnValue(of({ ok: true }));

        interceptor.intercept(contextMock as unknown as ExecutionContext, nextMock).subscribe({
            next: () => {
                const logArg = loggerMock.info.mock.calls[0][0];
                expect(logArg.requestParams).toBeUndefined();
                expect(logArg.requestQuery).toBeUndefined();
                done();
            },
        });
    });
});
