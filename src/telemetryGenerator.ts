import { MetricData, LogEntry, Trace, ServiceStatus, Alert, Severity, Span, AiDiagnostic } from './types';

// List of e-commerce microservices to simulate
export const MICROSERVICES = [
  'frontend',
  'productcatalogservice',
  'cartservice',
  'checkoutservice',
  'paymentservice',
  'shippingservice',
  'currencyservice',
  'recommendationservice',
  'emailservice',
  'adservice',
  'inventoryservice',
  'searchservice',
  'userservice',
  'notificationservice',
  'analyticsservice',
  'redis',
  'postgres'
];

// Rolling state buffers
let currentMetrics: MetricData = createInitialMetrics();
let serviceStates: Record<string, ServiceStatus> = initializeServiceStates();
let logsBuffer: LogEntry[] = [];
const maxLogs = 200;
let tracesBuffer: Trace[] = [];
const maxTraces = 100;
let activeAlerts: Alert[] = [];
let historicAlerts: Alert[] = [];
const maxAlerts = 50;

// Current active issue simulation state
let activeIssue: 'NONE' | 'PAYMENT_LATENCY' | 'DB_TIMEOUT' | 'HIGH_CPU_FRONTEND' = 'NONE';
let issueTimer = 0;

function createInitialMetrics(): MetricData {
  return {
    cpu: 45,
    memory: 62,
    disk: 54,
    networkIn: 120,
    networkOut: 150,
    requestRate: 85,
    responseTime: 180,
    errorRate: 0.8,
    throughput: 1250,
    availability: 99.8,
    activeUsers: 1450,
    ordersPerMinute: 8,
    revenuePerMinute: 320,
    paymentSuccessRate: 99.2,
    conversionRate: 2.8,
    cartAbandonmentRate: 68.5,
    productViews: 450,
    checkoutRate: 12.5,
    sessionDuration: 340,
    clickRate: 5.2,
    pageViews: 1200,
    bounceRate: 41.2,
    loginSuccessRate: 99.5,
    podRestarts: 0,
    containerCount: 34,
    nodeHealth: 100,
    queueLength: 2,
    databaseConnections: 35
  };
}

function initializeServiceStates(): Record<string, ServiceStatus> {
  const states: Record<string, ServiceStatus> = {};
  MICROSERVICES.forEach(service => {
    states[service] = {
      name: service,
      status: 'HEALTHY',
      cpu: 15 + Math.random() * 20,
      memory: 40 + Math.random() * 30,
      latency: service === 'postgres' || service === 'redis' ? 5 + Math.random() * 5 : 80 + Math.random() * 60,
      errorRate: Math.random() * 0.5,
      requestCount: service === 'frontend' ? 85 : 40 + Math.random() * 60,
      connections: service === 'postgres' ? 35 : service === 'redis' ? 120 : 15 + Math.floor(Math.random() * 10)
    };
  });
  return states;
}

// Generates logs based on a severity and service
export function generateLog(service: string, severity: Severity, message: string, traceId?: string, spanId?: string): LogEntry {
  const log: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    service,
    severity,
    message,
    traceId,
    spanId
  };
  logsBuffer.unshift(log);
  if (logsBuffer.length > maxLogs) {
    logsBuffer.pop();
  }
  return log;
}

// Generate an individual trace flow
function generateTraceFlow(): Trace {
  const traceId = `tr-${Math.random().toString(36).substring(2, 11)}`;
  const timestamp = new Date().toISOString();
  const spans: Span[] = [];
  const flowType = Math.random();

  let totalDuration = 0;
  
  if (flowType < 0.3) {
    // Flow 1: Frontend -> Product Catalog -> Recommendations
    const rootSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
    const catalogSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
    const recSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
    
    const catalogLatency = 40 + Math.random() * 30;
    const recLatency = 50 + Math.random() * 40;
    const rootLatency = catalogLatency + recLatency + 15 + Math.random() * 10;
    
    totalDuration = rootLatency;

    spans.push({
      spanId: rootSpanId,
      parentSpanId: null,
      serviceName: 'frontend',
      operationName: 'GET /product',
      startTime: 0,
      duration: rootLatency,
      status: 'OK',
      attributes: { 'http.status_code': 200, 'http.method': 'GET', 'product.id': 'prod-9382' }
    });

    spans.push({
      spanId: catalogSpanId,
      parentSpanId: rootSpanId,
      serviceName: 'productcatalogservice',
      operationName: 'GetProduct',
      startTime: 5,
      duration: catalogLatency,
      status: 'OK',
      attributes: { 'product.id': 'prod-9382', 'db.cached': true }
    });

    spans.push({
      spanId: recSpanId,
      parentSpanId: rootSpanId,
      serviceName: 'recommendationservice',
      operationName: 'ListRecommendations',
      startTime: catalogLatency + 8,
      duration: recLatency,
      status: 'OK',
      attributes: { 'user.segment': 'returning', 'results.count': 4 }
    });
  } else if (flowType < 0.6) {
    // Flow 2: Frontend -> Search Service -> Postgres DB
    const rootSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
    const searchSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;
    const dbSpanId = `sp-${Math.random().toString(36).substring(2, 9)}`;

    const isDbSlow = activeIssue === 'DB_TIMEOUT';
    const dbLatency = isDbSlow ? 450 + Math.random() * 200 : 15 + Math.random() * 15;
    const searchLatency = dbLatency + 30 + Math.random() * 20;
    const rootLatency = searchLatency + 10 + Math.random() * 10;
    
    totalDuration = rootLatency;

    spans.push({
      spanId: rootSpanId,
      parentSpanId: null,
      serviceName: 'frontend',
      operationName: 'GET /search',
      startTime: 0,
      duration: rootLatency,
      status: isDbSlow ? 'ERROR' : 'OK',
      attributes: { 'http.status_code': isDbSlow ? 504 : 200, 'query': 'burgundy jacket' }
    });

    spans.push({
      spanId: searchSpanId,
      parentSpanId: rootSpanId,
      serviceName: 'searchservice',
      operationName: 'SearchProducts',
      startTime: 5,
      duration: searchLatency,
      status: isDbSlow ? 'ERROR' : 'OK',
      attributes: { 'search.query': 'burgundy jacket', 'search.results_count': isDbSlow ? 0 : 12 }
    });

    spans.push({
      spanId: dbSpanId,
      parentSpanId: searchSpanId,
      serviceName: 'postgres',
      operationName: 'SELECT FROM products',
      startTime: 15,
      duration: dbLatency,
      status: isDbSlow ? 'ERROR' : 'OK',
      errorMessage: isDbSlow ? 'Query timeout: connection pool exhausted' : undefined,
      attributes: { 'db.statement': 'SELECT * FROM products WHERE tags ANY IN ($1) LIMIT 20' }
    });

    if (isDbSlow) {
      generateLog('postgres', 'ERROR', `Connection pool exhausted. Active connections: ${currentMetrics.databaseConnections}. Max: 50.`, traceId, dbSpanId);
      generateLog('searchservice', 'ERROR', `Failed to search products due to database timeout. Trace ID: ${traceId}`, traceId, searchSpanId);
    }
  } else {
    // Flow 3: Complete E-Commerce Transaction: Frontend -> Cart -> Checkout -> Payment -> Inventory -> Shipping -> Email
    const rootSpanId = `sp-fe-${Math.random().toString(36).substring(2, 6)}`;
    const cartSpanId = `sp-ca-${Math.random().toString(36).substring(2, 6)}`;
    const checkoutSpanId = `sp-co-${Math.random().toString(36).substring(2, 6)}`;
    const paymentSpanId = `sp-pa-${Math.random().toString(36).substring(2, 6)}`;
    const invSpanId = `sp-in-${Math.random().toString(36).substring(2, 6)}`;
    const shipSpanId = `sp-sh-${Math.random().toString(36).substring(2, 6)}`;
    const emailSpanId = `sp-em-${Math.random().toString(36).substring(2, 6)}`;

    const isPaymentSlow = activeIssue === 'PAYMENT_LATENCY';
    
    const cartDuration = 30 + Math.random() * 20;
    const paymentDuration = isPaymentSlow ? 600 + Math.random() * 400 : 80 + Math.random() * 50;
    const invDuration = 45 + Math.random() * 25;
    const shipDuration = 60 + Math.random() * 30;
    const emailDuration = 40 + Math.random() * 20;
    
    const checkoutDuration = paymentDuration + invDuration + shipDuration + emailDuration + 20;
    const rootDuration = cartDuration + checkoutDuration + 25;

    totalDuration = rootDuration;

    spans.push({
      spanId: rootSpanId,
      parentSpanId: null,
      serviceName: 'frontend',
      operationName: 'POST /checkout',
      startTime: 0,
      duration: rootDuration,
      status: isPaymentSlow ? 'ERROR' : 'OK',
      attributes: { 'http.status_code': isPaymentSlow ? 500 : 200 }
    });

    spans.push({
      spanId: cartSpanId,
      parentSpanId: rootSpanId,
      serviceName: 'cartservice',
      operationName: 'GetCart',
      startTime: 5,
      duration: cartDuration,
      status: 'OK',
      attributes: { 'cart.items_count': 3 }
    });

    spans.push({
      spanId: checkoutSpanId,
      parentSpanId: rootSpanId,
      serviceName: 'checkoutservice',
      operationName: 'ProcessCheckout',
      startTime: cartDuration + 10,
      duration: checkoutDuration,
      status: isPaymentSlow ? 'ERROR' : 'OK',
      attributes: { 'order.amount': 189.50 }
    });

    spans.push({
      spanId: paymentSpanId,
      parentSpanId: checkoutSpanId,
      serviceName: 'paymentservice',
      operationName: 'ChargeCreditCard',
      startTime: cartDuration + 20,
      duration: paymentDuration,
      status: isPaymentSlow ? 'ERROR' : 'OK',
      errorMessage: isPaymentSlow ? 'Gateway response code: 504 Gateway Timeout' : undefined,
      attributes: { 'payment.gateway': 'stripe_connect', 'payment.currency': 'USD' }
    });

    spans.push({
      spanId: invSpanId,
      parentSpanId: checkoutSpanId,
      serviceName: 'inventoryservice',
      operationName: 'CheckAndReserveStock',
      startTime: cartDuration + paymentDuration + 25,
      duration: invDuration,
      status: 'OK',
      attributes: { 'inventory.reserved_items': 3 }
    });

    spans.push({
      spanId: shipSpanId,
      parentSpanId: checkoutSpanId,
      serviceName: 'shippingservice',
      operationName: 'CreateShippingLabel',
      startTime: cartDuration + paymentDuration + invDuration + 30,
      duration: shipDuration,
      status: 'OK',
      attributes: { 'shipping.carrier': 'usps', 'shipping.speed': 'priority' }
    });

    spans.push({
      spanId: emailSpanId,
      parentSpanId: checkoutSpanId,
      serviceName: 'emailservice',
      operationName: 'SendConfirmationEmail',
      startTime: cartDuration + paymentDuration + invDuration + shipDuration + 35,
      duration: emailDuration,
      status: 'OK',
      attributes: { 'email.template': 'order_confirmed' }
    });

    if (isPaymentSlow) {
      generateLog('paymentservice', 'ERROR', `Stripe checkout endpoint timed out after ${paymentDuration.toFixed(0)}ms. API Gateway error 504.`, traceId, paymentSpanId);
      generateLog('checkoutservice', 'ERROR', `Checkout transaction failed for cart cart_9421. Triggering fallback rollback.`, traceId, checkoutSpanId);
    } else {
      if (Math.random() > 0.8) {
        generateLog('frontend', 'INFO', `User checked out successfully. Revenue generated: $189.50.`, traceId, rootSpanId);
      }
    }
  }

  const trace: Trace = {
    traceId,
    rootServiceName: spans[0].serviceName,
    rootOperation: spans[0].operationName,
    timestamp,
    duration: totalDuration,
    spans,
    status: spans.some(s => s.status === 'ERROR') ? 'ERROR' : 'OK'
  };

  tracesBuffer.unshift(trace);
  if (tracesBuffer.length > maxTraces) {
    tracesBuffer.pop();
  }

  return trace;
}

// Check alert rules and generate alerts if thresholds crossed
function checkAlertRules() {
  const rules = [
    {
      service: 'frontend',
      metric: 'cpu',
      threshold: 85,
      severity: 'CRITICAL' as const,
      message: 'Frontend CPU Utilization is extremely high (> 85%)'
    },
    {
      service: 'postgres',
      metric: 'connections',
      threshold: 45,
      severity: 'WARNING' as const,
      message: 'Postgres DB active connection pool is near capacity (> 90%)'
    },
    {
      service: 'paymentservice',
      metric: 'latency',
      threshold: 500,
      severity: 'CRITICAL' as const,
      message: 'Payment Gateway latency spike detected (> 500ms)'
    },
    {
      service: 'checkoutservice',
      metric: 'errorRate',
      threshold: 5,
      severity: 'CRITICAL' as const,
      message: 'Checkout error rate is elevated (> 5%)'
    }
  ];

  rules.forEach(rule => {
    let currentVal = 0;
    if (rule.service === 'frontend' && rule.metric === 'cpu') {
      currentVal = serviceStates['frontend'].cpu;
    } else if (rule.service === 'postgres' && rule.metric === 'connections') {
      currentVal = serviceStates['postgres'].connections;
    } else if (rule.service === 'paymentservice' && rule.metric === 'latency') {
      currentVal = serviceStates['paymentservice'].latency;
    } else if (rule.service === 'checkoutservice' && rule.metric === 'errorRate') {
      currentVal = serviceStates['checkoutservice'].errorRate;
    }

    const alreadyActive = activeAlerts.find(a => a.service === rule.service && rule.metric === rule.metric);

    if (currentVal > rule.threshold) {
      if (!alreadyActive) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${rule.service}_${rule.metric}`,
          timestamp: new Date().toISOString(),
          severity: rule.severity,
          service: rule.service,
          metric: rule.metric,
          value: parseFloat(currentVal.toFixed(1)),
          threshold: rule.threshold,
          message: rule.message,
          resolved: false
        };
        activeAlerts.unshift(alert);
        generateLog(rule.service, rule.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', `[ALERT TRIGGERED] ${rule.message}. Current: ${currentVal.toFixed(1)}`);
      } else {
        alreadyActive.value = parseFloat(currentVal.toFixed(1));
      }
    } else {
      if (alreadyActive) {
        // Resolve alert
        activeAlerts = activeAlerts.filter(a => a.id !== alreadyActive.id);
        const resolved: Alert = {
          ...alreadyActive,
          resolved: true,
          resolvedAt: new Date().toISOString()
        };
        historicAlerts.unshift(resolved);
        if (historicAlerts.length > maxAlerts) {
          historicAlerts.pop();
        }
        generateLog(rule.service, 'INFO', `[ALERT RESOLVED] ${rule.message}. Current: ${currentVal.toFixed(1)}`);
      }
    }
  });
}

// Run simulation tick (every 2s) to advance metrics, trigger random issues, logs, and alerts
export function runSimulationTick() {
  issueTimer++;

  // 1. Manage active issue cycles
  if (activeIssue === 'NONE') {
    if (Math.random() > 0.94) {
      // Trigger a random issue
      const issues: ('PAYMENT_LATENCY' | 'DB_TIMEOUT' | 'HIGH_CPU_FRONTEND')[] = ['PAYMENT_LATENCY', 'DB_TIMEOUT', 'HIGH_CPU_FRONTEND'];
      activeIssue = issues[Math.floor(Math.random() * issues.length)];
      issueTimer = 0;
      generateLog('frontend', 'WARNING', `Observer system detected anomaly trend starting. Initializing triage...`);
    }
  } else {
    // Current issue lasts for about 30 seconds (15 ticks)
    if (issueTimer > 15) {
      const resolvedIssue = activeIssue;
      activeIssue = 'NONE';
      issueTimer = 0;
      generateLog('frontend', 'INFO', `Anomaly mitigation cycle executed. System returning to nominal state. Resolved: ${resolvedIssue}`);
    }
  }

  // 2. Adjust microservice states and metrics based on active issue
  MICROSERVICES.forEach(service => {
    const state = serviceStates[service];
    let baseCpu = 15 + Math.random() * 15;
    let baseMemory = 40 + Math.random() * 15;
    let baseLatency = service === 'postgres' || service === 'redis' ? 5 + Math.random() * 5 : 60 + Math.random() * 40;
    let baseErrorRate = Math.random() * 0.3;
    let baseReqCount = 30 + Math.random() * 40;
    let baseConnections = service === 'postgres' ? 25 : service === 'redis' ? 80 : 15;

    if (service === 'frontend') {
      baseReqCount = 100 + Math.sin(Date.now() / 60000) * 30; // Sine wave user traffic
    }

    if (activeIssue === 'HIGH_CPU_FRONTEND') {
      if (service === 'frontend') {
        baseCpu = 88 + Math.random() * 8;
        baseLatency = 350 + Math.random() * 100;
        baseErrorRate = 3.5 + Math.random() * 2;
        if (issueTimer === 1) {
          generateLog('frontend', 'CRITICAL', 'CPU utilization spikes above 90% due to thread pool starvation in request handler.', undefined, undefined);
        }
      }
    } else if (activeIssue === 'PAYMENT_LATENCY') {
      if (service === 'paymentservice') {
        baseLatency = 850 + Math.random() * 150;
        baseCpu = 45 + Math.random() * 10;
        baseErrorRate = 18 + Math.random() * 10;
      }
      if (service === 'checkoutservice') {
        baseErrorRate = 8 + Math.random() * 5;
        baseLatency = 950 + Math.random() * 200;
      }
    } else if (activeIssue === 'DB_TIMEOUT') {
      if (service === 'postgres') {
        baseConnections = 48 + Math.floor(Math.random() * 3);
        baseLatency = 550 + Math.random() * 150;
        baseCpu = 82 + Math.random() * 10;
      }
      if (service === 'searchservice') {
        baseErrorRate = 12 + Math.random() * 8;
        baseLatency = 600 + Math.random() * 100;
      }
    }

    state.cpu = Math.min(100, Math.max(0, baseCpu));
    state.memory = Math.min(100, Math.max(0, baseMemory));
    state.latency = Math.max(1, baseLatency);
    state.errorRate = parseFloat(baseErrorRate.toFixed(2));
    state.requestCount = Math.floor(baseReqCount);
    state.connections = Math.floor(baseConnections);

    // Update state badge
    if (state.errorRate > 10 || state.cpu > 85) {
      state.status = 'DEGRADED';
    } else if (state.errorRate > 25) {
      state.status = 'DOWN';
    } else {
      state.status = 'HEALTHY';
    }
  });

  // 3. Update global aggregated metrics
  const totalReq = Object.values(serviceStates).reduce((sum, s) => sum + s.requestCount, 0);
  const avgLatency = Object.values(serviceStates).reduce((sum, s) => sum + s.latency, 0) / MICROSERVICES.length;
  const avgCpu = Object.values(serviceStates).reduce((sum, s) => sum + s.cpu, 0) / MICROSERVICES.length;
  const avgMemory = Object.values(serviceStates).reduce((sum, s) => sum + s.memory, 0) / MICROSERVICES.length;

  const orderRateFactor = activeIssue === 'PAYMENT_LATENCY' ? 0.2 : activeIssue === 'DB_TIMEOUT' ? 0.4 : 1.0;
  const newRevenue = (5 + Math.random() * 15) * 20 * orderRateFactor;

  currentMetrics = {
    cpu: parseFloat(avgCpu.toFixed(1)),
    memory: parseFloat(avgMemory.toFixed(1)),
    disk: 54.2 + (Math.random() * 0.05),
    networkIn: Math.floor(totalReq * 1.5 + Math.random() * 20),
    networkOut: Math.floor(totalReq * 2.1 + Math.random() * 25),
    requestRate: Math.floor(serviceStates['frontend'].requestCount),
    responseTime: parseFloat(avgLatency.toFixed(1)),
    errorRate: parseFloat((activeIssue !== 'NONE' ? 4.5 + Math.random() * 3 : 0.4 + Math.random() * 0.5).toFixed(2)),
    throughput: Math.floor(totalReq),
    availability: activeIssue !== 'NONE' ? 98.2 : 99.95,
    activeUsers: 1400 + Math.floor(Math.sin(Date.now() / 120000) * 300) + (activeIssue !== 'NONE' ? -150 : 0),
    ordersPerMinute: Math.floor(8 * orderRateFactor + Math.random() * 3),
    revenuePerMinute: parseFloat((320 * orderRateFactor + Math.random() * 50).toFixed(2)),
    paymentSuccessRate: activeIssue === 'PAYMENT_LATENCY' ? 45.2 : 99.4,
    conversionRate: parseFloat((activeIssue === 'PAYMENT_LATENCY' ? 0.6 : 2.5 + Math.random() * 0.5).toFixed(2)),
    cartAbandonmentRate: parseFloat((activeIssue === 'PAYMENT_LATENCY' ? 88.5 : 67 + Math.random() * 3).toFixed(2)),
    productViews: Math.floor(450 + Math.random() * 50),
    checkoutRate: parseFloat((12.5 * orderRateFactor + Math.random() * 2).toFixed(2)),
    sessionDuration: 320 + Math.floor(Math.random() * 40),
    clickRate: 5.2 + (Math.random() * 0.4),
    pageViews: Math.floor(1200 + Math.random() * 100),
    bounceRate: activeIssue !== 'NONE' ? 52.3 : 40.5,
    loginSuccessRate: 99.5 + Math.random() * 0.3,
    podRestarts: activeIssue === 'HIGH_CPU_FRONTEND' && Math.random() > 0.8 ? currentMetrics.podRestarts + 1 : currentMetrics.podRestarts,
    containerCount: 34,
    nodeHealth: activeIssue === 'DB_TIMEOUT' ? 95 : 100,
    queueLength: activeIssue === 'PAYMENT_LATENCY' ? 12 : 2,
    databaseConnections: serviceStates['postgres'].connections
  };

  // 4. Generate some live traces
  for (let i = 0; i < 3; i++) {
    generateTraceFlow();
  }

  // 5. Generate regular INFO logs
  if (Math.random() > 0.5) {
    const infoMessages = [
      'Configuring dynamic segment recommendation matrix cache.',
      'Completed periodic telemetry flush to standard instrumentation exporter.',
      'Scheduled cleanup executor task completed successfully.',
      'User session sync token refreshed.'
    ];
    generateLog(MICROSERVICES[Math.floor(Math.random() * MICROSERVICES.length)], 'INFO', infoMessages[Math.floor(Math.random() * infoMessages.length)]);
  }

  // 6. Check alert boundaries
  checkAlertRules();
}

// Initialize some initial items
for (let i = 0; i < 20; i++) {
  generateTraceFlow();
  generateLog(MICROSERVICES[Math.floor(Math.random() * MICROSERVICES.length)], 'INFO', 'Cold start service initialization check completed.');
}

export function getLatestTelemetry() {
  const overallHealth = activeIssue === 'NONE' ? 'HEALTHY' : activeIssue === 'HIGH_CPU_FRONTEND' || activeIssue === 'PAYMENT_LATENCY' ? 'CRITICAL' : 'DEGRADED';
  return {
    timestamp: new Date().toISOString(),
    overallHealth,
    globalMetrics: currentMetrics,
    services: serviceStates,
    traces: tracesBuffer,
    logs: logsBuffer,
    alerts: activeAlerts,
    historicAlerts,
    activeIssue
  };
}
