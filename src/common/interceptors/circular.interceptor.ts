import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { stringify, parse } from 'flatted';

@Injectable()
export class CircularInterceptor implements NestInterceptor {
    intercept<T>(_context: ExecutionContext, next: CallHandler): Observable<T> {
        return next.handle().pipe(
            map((data) => {
                const safeJson = stringify(data);
                return parse(safeJson) as T;
            }),
        );
    }
}
