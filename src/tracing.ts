import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = defaultResource().merge(
    resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'nestjs-api',
        'deployment.environment': process.env.DEPLOYMENT_ENVIRONMENT ?? 'dev',
        'service.version': process.env.SERVICE_VERSION ?? '0.0.0',
    }),
);

const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
const globalForOtel = globalThis as typeof globalThis & {
    __godeyesOtelStarted?: boolean;
};

const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({ headers }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ headers }),
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(new OTLPLogExporter({ headers }))],
    instrumentations: [
        getNodeAutoInstrumentations({
            // ⚠️  CRITICAL — do NOT set disableIncomingRequestInstrumentation: true here.
            // Incoming HTTP instrumentation sets http.response.status_code on every server
            // span. The GodEyes collector tail-sampling policies use that attribute to keep
            // 4xx and 5xx traces. Without it, a 4xx/5xx response produces a log line with
            // a trace_id that resolves to a 404 in Tempo — the trace was dropped because
            // the collector had no status code to match on. Only disable OUTGOING to avoid
            // duplicate client metrics when Undici/fetch is also instrumented.
            '@opentelemetry/instrumentation-http': {
                disableOutgoingRequestInstrumentation: true,
            },
            '@opentelemetry/instrumentation-undici': { enabled: true },
        }),
        // Extracts the actual route template (/orders/:id) from NestJS guards,
        // interceptors and controllers and writes it as http.route on the server span.
        // Without this every request shows http.route="?" in the Top HTTP routes panel
        // and the keep-http-4xx/5xx tail-sampling policies may not fire correctly.
        new NestInstrumentation(),
    ],
});

if (!globalForOtel.__godeyesOtelStarted) {
    sdk.start();
    globalForOtel.__godeyesOtelStarted = true;
}

function parseHeaders(raw?: string): Record<string, string> {
    if (!raw) return {};
    return Object.fromEntries(
        raw.split(',').map((part) => {
            const i = part.indexOf('=');
            if (i === -1) return [part.trim(), ''];
            return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
        }),
    );
}

async function shutdown() {
    await sdk.shutdown();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
