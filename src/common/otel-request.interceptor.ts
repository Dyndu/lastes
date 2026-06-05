import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

@Injectable()
export class OtelRequestInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
        res.setHeader('x-request-id', requestId);

        const active = trace.getActiveSpan();
        active?.setAttribute('http.request_id', requestId);
        active?.setAttribute('http.route', req.route?.path ?? req.path);
        return next.handle();
    }
}
