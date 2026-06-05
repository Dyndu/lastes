import pino from 'pino';
import { trace } from '@opentelemetry/api';

function resourceLogFields(): Record<string, string> {
    const out: Record<string, string> = {};
    const name = process.env.OTEL_SERVICE_NAME;
    const env = process.env.DEPLOYMENT_ENVIRONMENT;
    const ver = process.env.SERVICE_VERSION;
    if (name) out['service.name'] = name;
    if (env) out['deployment.environment'] = env;
    if (ver) out['service.version'] = ver;
    return out;
}

export const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    mixin() {
        const base = resourceLogFields();
        const ctx = trace.getActiveSpan()?.spanContext();
        if (!ctx?.traceId) return base;
        return {
            ...base,
            trace_id: ctx.traceId,
            span_id: ctx.spanId,
        };
    },
});
