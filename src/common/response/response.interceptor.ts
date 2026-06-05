import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(map((res: unknown) => this.responseHandler(res, context)));
    }

    responseHandler(res: any, context: ExecutionContext) {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        const statusCode = response.statusCode;

        const result = {
            statusCode,
            data: res,
        };
        return Object.freeze(result);
    }
}
