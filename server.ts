import {
  httpRequestDuration,
  httpRequestCount,
  activeConnectionsGauge,
  telemetryTickCounter,
  businessOrdersCounter,
  businessRevenueCounter,
  activeUsersGauge,
  platformCpuGauge,
  platformMemoryGauge,
  platformErrorRateGauge,
  platformLatencyGauge,
  activeAlertsGauge,
  serviceLatencyHistogram,
  serviceErrorRateGauge,
  getTracer,
} from './src/instrumentation';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { runSimulationTick, getLatestTelemetry, MICROSERVICES } from './src/telemetryGenerator';

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client initialized successfully.');
  } catch (err) {
    console.error('Error initializing Gemini API Client:', err);
  }
} else {
  console.log('No valid GEMINI_API_KEY found in environment variables. Falling back to rule-based fallback analytics.');
}

// Global active client set for Server-Sent Events (SSE)
const sseClients = new Set<express.Response>();

// Run telemetry simulation every 2 seconds
setInterval(() => {
  runSimulationTick();
  telemetryTickCounter.add(1);
  const latestData = getLatestTelemetry();

  // Export simulated metrics to OTel
  const gm = latestData.globalMetrics;
  platformCpuGauge.record(gm.cpu);
  platformMemoryGauge.record(gm.memory);
  platformErrorRateGauge.record(gm.errorRate);
  platformLatencyGauge.record(gm.responseTime);
  activeUsersGauge.record(gm.activeUsers);
  activeAlertsGauge.record(latestData.alerts.length);
  businessOrdersCounter.add(gm.ordersPerMinute);
  businessRevenueCounter.add(gm.revenuePerMinute);

  // Per-service metrics
  for (const [name, svc] of Object.entries(latestData.services)) {
    const attrs = { service: name };
    serviceLatencyHistogram.record(svc.latency, attrs);
    serviceErrorRateGauge.record(svc.errorRate, attrs);
  }

  // Broadcast to all active SSE clients
  const sseData = `data: ${JSON.stringify(latestData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(sseData);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}, 2000);

// SSE connection endpoint for live telemetry streaming
app.get('/api/telemetry/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify(getLatestTelemetry())}\n\n`);

  sseClients.add(res);
  activeConnectionsGauge.add(1);

  req.on('close', () => {
    sseClients.delete(res);
    activeConnectionsGauge.add(-1);
  });
});

// Single point metrics query
app.get('/api/telemetry/latest', (req, res) => {
  httpRequestCount.add(1, { method: 'GET', route: '/api/telemetry/latest' });
  const start = Date.now();
  res.json(getLatestTelemetry());
  httpRequestDuration.record(Date.now() - start, { method: 'GET', route: '/api/telemetry/latest' });
});

// AI Observability Diagnostics Endpoint using Gemini API
app.post('/api/ai/diagnose', async (req, res) => {
  httpRequestCount.add(1, { method: 'POST', route: '/api/ai/diagnose' });
  const start = Date.now();
  const tracer = getTracer();
  const { alert, serviceName, activeIssue, globalMetrics, serviceMetrics } = req.body;

  const prompt = `You are the lead AI SRE and chief operations diagnostics engine for PromiseTelemetry.
Perform a critical root-cause analysis (RCA) and anomaly explanation for the following e-commerce microservices state:

Active Issue Category: ${activeIssue || 'UNKNOWN_ANOMALY'}
Selected Component/Alert Context: ${alert ? JSON.stringify(alert) : (serviceName || 'Global Platform Alert')}

Global Platform Metrics:
- CPU: ${globalMetrics?.cpu}%
- Memory: ${globalMetrics?.memory}%
- Average Latency: ${globalMetrics?.responseTime}ms
- Platform Error Rate: ${globalMetrics?.errorRate}%
- Active Sessions: ${globalMetrics?.activeUsers}

Microservice metrics: ${JSON.stringify(serviceMetrics || {})}

Provide a professional, highly readable JSON response with the following fields:
- incidentType: Short distinct incident label (e.g., Stripe Timeout, Postgres Connection Spike, Thread Starvation)
- severity: INFO, WARNING, or CRITICAL
- summary: High-level overview of the incident (1-2 sentences)
- rootCause: Detailed technical root cause explanation
- suggestedFix: Actionable recommendations for immediate resolution or auto-recovery
- confidenceScore: Number from 0.0 to 1.0
- affectedServices: Array of strings of microservice names impacted by this chain

IMPORTANT: Ensure your output is purely JSON. No markdown wrappings (e.g., no \`\`\`json tags). Do not add any conversational text before or after the JSON.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              incidentType: { type: Type.STRING },
              severity: { type: Type.STRING },
              summary: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              suggestedFix: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              affectedServices: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['incidentType', 'severity', 'summary', 'rootCause', 'suggestedFix', 'confidenceScore', 'affectedServices'],
          },
        },
      });

      const responseText = response.text || '';
      try {
        const result = JSON.parse(responseText.trim());
        httpRequestDuration.record(Date.now() - start, { method: 'POST', route: '/api/ai/diagnose' });
        return res.json({ success: true, diagnostic: result });
      } catch (parseErr) {
        console.error('Failed to parse Gemini output as JSON:', responseText, parseErr);
        // Fallback inside catch
      }
    } catch (apiErr) {
      console.error('Error invoking Gemini model:', apiErr);
    }
  }

  // Fallback Rule-Based Diagnostic Generation (if Gemini API key is missing or model request fails)
  console.log('Using simulated analytical fallback SRE engine...');
  let fallbackDiagnostic = {
    incidentType: 'Stripe API Gateway Latency Spike',
    severity: 'CRITICAL' as const,
    summary: 'Stripe payment verification endpoint responded with a 504 Gateway Timeout, backing up processing queues.',
    rootCause: 'The `paymentservice` made downstream external HTTP post calls which blocked local event loops, causing cascading response delays in checkouts.',
    suggestedFix: '1. Scale Payments Service. 2. Verify Stripe Webhook API token keys. 3. Adjust connection pool sizes on Postgres databases.',
    confidenceScore: 0.94,
    affectedServices: ['paymentservice', 'checkoutservice', 'frontend'],
  };

  if (activeIssue === 'DB_TIMEOUT') {
    fallbackDiagnostic = {
      incidentType: 'Postgres Connection Pool Exhaustion',
      severity: 'CRITICAL',
      summary: 'SQL connection Pool limits reached (48/50) causing cascading search delays and transaction errors.',
      rootCause: 'Unindexed pattern match queries in catalog searches on `postgres` DB resulted in long-lived query times, tying up standard connections.',
      suggestedFix: '1. Provision secondary Read replica on AWS RDS. 2. Run EXPLAIN ANALYZE on catalog SELECT statement to configure composite indexes.',
      confidenceScore: 0.89,
      affectedServices: ['postgres', 'searchservice', 'frontend'],
    };
  } else if (activeIssue === 'HIGH_CPU_FRONTEND') {
    fallbackDiagnostic = {
      incidentType: 'Frontend Pod Thread Starvation',
      severity: 'CRITICAL',
      summary: 'Vite/Node frontend server core CPU utilization exceeded 90%, causing high latency on user clicks.',
      rootCause: 'High concurrent visual updates on tracking segments triggered massive websocket and script cycles, saturating event-loops.',
      suggestedFix: '1. Trigger horizontal scaling group on Amazon ECS. 2. Throttle user activity tracking queues.',
      confidenceScore: 0.85,
      affectedServices: ['frontend'],
    };
  } else if (alert) {
    fallbackDiagnostic = {
      incidentType: `${alert.service.toUpperCase()} Metric Breach`,
      severity: alert.severity,
      summary: `Alert active: ${alert.message}. Current: ${alert.value}`,
      rootCause: `The microservice metric ${alert.metric} crossed the critical threshold ${alert.threshold}, causing operational degredation.`,
      suggestedFix: `Review logs and scale the ${alert.service} cluster to accommodate the traffic burst. Check memory heap profiles if memory is leaking.`,
      confidenceScore: 0.80,
      affectedServices: [alert.service],
    };
  }

  httpRequestDuration.record(Date.now() - start, { method: 'POST', route: '/api/ai/diagnose' });
  res.json({ success: false, note: 'Simulated SRE diagnostic', diagnostic: fallbackDiagnostic });
});

// AWS CloudWatch, Logs & X-Ray Export simulator
app.post('/api/aws/export', (req, res) => {
  httpRequestCount.add(1, { method: 'POST', route: '/api/aws/export' });
  const exportStart = Date.now();
  const { config, payload } = req.body;
  
  const timestamp = new Date().toISOString();
  const logsExported = config.exportLogs ? payload.logs?.length || 0 : 0;
  const metricsExported = config.exportMetrics ? Object.keys(payload.services || {}).length * 8 : 0;
  const tracesExported = config.exportTraces ? payload.traces?.length || 0 : 0;

  res.json({
    success: true,
    message: 'Telemetry successfully pushed to Amazon CloudWatch & AWS X-Ray.',
    details: {
      timestamp,
      region: config.region || 'us-east-1',
      namespace: config.namespace || 'PromiseTelemetry',
      metricsExported,
      logsExported,
      tracesExported,
      arn: `arn:aws:cloudwatch:${config.region || 'us-east-1'}:123456789012:namespace/${config.namespace || 'PromiseTelemetry'}`
    }
  });
  httpRequestDuration.record(Date.now() - exportStart, { method: 'POST', route: '/api/aws/export' });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PromiseTelemetry full-stack server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
