export interface MetricData {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  requestRate: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
  activeUsers: number;
  ordersPerMinute: number;
  revenuePerMinute: number;
  paymentSuccessRate: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  productViews: number;
  checkoutRate: number;
  sessionDuration: number;
  clickRate: number;
  pageViews: number;
  bounceRate: number;
  loginSuccessRate: number;
  podRestarts: number;
  containerCount: number;
  nodeHealth: number;
  queueLength: number;
  databaseConnections: number;
}

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  severity: Severity;
  message: string;
  traceId?: string;
  spanId?: string;
}

export interface Span {
  spanId: string;
  parentSpanId: string | null;
  serviceName: string;
  operationName: string;
  startTime: number; // relative ms offset
  duration: number; // in ms
  status: 'OK' | 'ERROR';
  errorMessage?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface Trace {
  traceId: string;
  rootServiceName: string;
  rootOperation: string;
  timestamp: string;
  duration: number; // total duration
  spans: Span[];
  status: 'OK' | 'ERROR';
}

export interface ServiceStatus {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  requestCount: number;
  connections: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  service: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AiDiagnostic {
  id: string;
  timestamp: string;
  incidentType: string;
  severity: Severity;
  summary: string;
  rootCause: string;
  suggestedFix: string;
  confidenceScore: number;
  affectedServices: string[];
  metricsContext: Record<string, number>;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  namespace: string;
  exportMetrics: boolean;
  exportLogs: boolean;
  exportTraces: boolean;
}

export interface TelemetryPayload {
  timestamp: string;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  globalMetrics: MetricData;
  services: Record<string, ServiceStatus>;
  traces: Trace[];
  logs: LogEntry[];
  alerts: Alert[];
  aiInsights: AiDiagnostic[];
}
