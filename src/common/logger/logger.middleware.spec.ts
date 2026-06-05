import { LoggerMiddleware } from './logger.middleware';
import { Logger } from 'winston';
import { Request, Response } from 'express';

describe('LoggerMiddleware', () => {
    let middleware: LoggerMiddleware;
    let loggerMock: jest.Mocked<Logger>;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        loggerMock = {
            info: jest.fn(),
        } as any;

        middleware = new LoggerMiddleware(loggerMock);

        req = {
            method: 'GET',
            originalUrl: '/api/test',
            body: { foo: 'bar' },
        };

        res = {
            on: jest.fn((event, callback) => {
                // simulate `finish` event immediately
                if (event === 'finish') callback();
                return res as Response;
            }),
            statusCode: 200,
        };

        next = jest.fn();
    });

    it('should call next()', () => {
        middleware.use(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    it('should log request information when response finishes', () => {
        middleware.use(req as Request, res as Response, next);

        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/GET \/api\/test 200 - \d+ms/),
                method: 'GET',
                url: '/api/test',
                statusCode: 200,
                responseTime: expect.any(Number),
            }),
        );
    });

    it('should include body when method is POST', () => {
        req.method = 'POST';

        middleware.use(req as Request, res as Response, next);

        const logArg = loggerMock.info.mock.calls[0][0] as any;
        expect(logArg.body).toEqual(req.body);
    });

    it('should not include body when method is not POST', () => {
        req.method = 'GET';

        middleware.use(req as Request, res as Response, next);

        const logArg = loggerMock.info.mock.calls[0][0] as any;
        expect(logArg.body).toBeUndefined();
    });
});
