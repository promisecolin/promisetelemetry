import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions';
import { metrics, trace, DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const resource = new Resource({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'promisetelemetry',
  [ATTR_SERVICE_VERSION]: '1.0.0',
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` }),
    exportIntervalMillis: 10000,
  }),
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` })
  ),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
    }),
  ],
});

sdk.start();
console.log('OpenTelemetry SDK initialized. Exporting to:', otlpEndpoint);

process.on('SIGTERM', () => {
  sdk.shutdown().then(() => process.exit(0));
});

// Custom application metrics
const meter = metrics.getMeter('promisetelemetry');

export const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'Duration of HTTP requests in milliseconds',
  unit: 'ms',
});

export const httpRequestCount = meter.createCounter('http_request_total', {
  description: 'Total number of HTTP requests',
});

export const activeConnectionsGauge = meter.createUpDownCounter('sse_active_connections', {
  description: 'Number of active SSE client connections',
});

export const telemetryTickCounter = meter.createCounter('telemetry_simulation_ticks', {
  description: 'Number of telemetry simulation ticks executed',
});

export const businessOrdersCounter = meter.createCounter('business_orders_total', {
  description: 'Total orders processed',
});

export const businessRevenueCounter = meter.createCounter('business_revenue_usd', {
  description: 'Total revenue in USD',
  unit: 'usd',
});

export const activeUsersGauge = meter.createGauge('business_active_users', {
  description: 'Current number of active user sessions',
});

export const platformCpuGauge = meter.createGauge('platform_cpu_percent', {
  description: 'Platform average CPU utilization',
  unit: '%',
});

export const platformMemoryGauge = meter.createGauge('platform_memory_percent', {
  description: 'Platform average memory utilization',
  unit: '%',
});

export const platformErrorRateGauge = meter.createGauge('platform_error_rate_percent', {
  description: 'Platform error rate',
  unit: '%',
});

export const platformLatencyGauge = meter.createGauge('platform_response_time_ms', {
  description: 'Platform average response time',
  unit: 'ms',
});

export const activeAlertsGauge = meter.createGauge('alerts_active_count', {
  description: 'Number of currently active alerts',
});

export const serviceLatencyHistogram = meter.createHistogram('service_latency_ms', {
  description: 'Per-service latency in milliseconds',
  unit: 'ms',
});

export const serviceErrorRateGauge = meter.createGauge('service_error_rate_percent', {
  description: 'Per-service error rate',
  unit: '%',
});

export const getTracer = () => trace.getTracer('promisetelemetry');
