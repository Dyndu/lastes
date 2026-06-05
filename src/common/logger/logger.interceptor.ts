import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const { method, originalUrl, body, params, query } = req;
        const start = Date.now();

        return next.handle().pipe(
            tap((responseBody) => {
                const responseTime = Date.now() - start;
                const res = context.switchToHttp().getResponse<Response>();
                this.logger.info({
                    message: `${method} ${originalUrl} ${res.statusCode} - ${responseTime}ms`,
                    method,
                    url: originalUrl,
                    statusCode: res.statusCode,
                    responseTime,
                    requestBody: method === 'POST' ? body : undefined,
                    requestParams: Object.keys(params).length ? params : undefined,
                    requestQuery: Object.keys(query).length ? query : undefined,
                    responseBody,
                });
            }),
            catchError((err) => {
                const responseTime = Date.now() - start;
                const status = err?.getStatus?.() || err?.status || 500;

                this.logger.error(
                    `${method} ${originalUrl} ${status} - ${responseTime}ms | Error: ${err.message}`,
                    {
                        stack: err.stack,
                        requestBody: method === 'POST' ? body : undefined,
                        requestParams: Object.keys(params).length ? params : undefined,
                        requestQuery: Object.keys(query).length ? query : undefined,
                    },
                );

                return throwError(() => err);
            }),
        );
    }
}
