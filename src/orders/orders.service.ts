import { Injectable } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from '../logger';

@Injectable()
export class OrdersService {
    private readonly tracer = trace.getTracer('orders-service');

    async getById(id: string) {
        return this.tracer.startActiveSpan('orders.get_by_id', async (span) => {
            span.setAttribute('app.order_id', id);
            try {
                const response = await fetch('https://httpbin.org/status/200');
                logger.info(
                    { route: '/orders/:id', order_id: id, upstream_status: response.status },
                    'order retrieved',
                );
                span.setStatus({ code: SpanStatusCode.OK });
                return { id, status: 'ok', upstream_status: response.status };
            } catch (error) {
                span.recordException(error as Error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: 'order lookup failed' });
                logger.error({ err: error, order_id: id }, 'order lookup failed');
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
