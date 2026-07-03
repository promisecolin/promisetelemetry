import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ServiceMap from './components/ServiceMap';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import MetricsDashboard from './components/MetricsDashboard';
import TracingDashboard from './components/TracingDashboard';
import LoggingDashboard from './components/LoggingDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import InfrastructureDashboard from './components/InfrastructureDashboard';
import AlertingPanel from './components/AlertingPanel';
import AiInsightsPanel from './components/AiInsightsPanel';
import AwsExportPanel from './components/AwsExportPanel';
import { TelemetryPayload, AiDiagnostic, Alert } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('executive');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);

  // Sliding history for Recharts graphs
  const [chartsHistory, setChartsHistory] = useState<Array<{
    time: string;
    rate: number;
    latency: number;
    cpu: number;
    memory: number;
    networkIn: number;
    networkOut: number;
    revenue: number;
    orders: number;
    conversion: number;
  }>>([]);

  useEffect(() => {
    // Connect to full-stack Express SSE stream
    console.log('Opening EventSource stream...');
    const eventSource = new EventSource('/api/telemetry/stream');

    eventSource.onopen = () => {
      setIsLive(true);
      console.log('EventSource stream connection opened.');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload: TelemetryPayload = JSON.parse(event.data);
        setTelemetry(payload);

        // Update sliding charts history
        const timestamp = new Date(payload.timestamp).toLocaleTimeString();
        setChartsHistory(prev => {
          const next = [
            ...prev,
            {
              time: timestamp,
              rate: payload.globalMetrics.requestRate,
              latency: payload.globalMetrics.responseTime,
              cpu: payload.globalMetrics.cpu,
              memory: payload.globalMetrics.memory,
              networkIn: payload.globalMetrics.networkIn,
              networkOut: payload.globalMetrics.networkOut,
              revenue: payload.globalMetrics.revenuePerMinute,
              orders: payload.globalMetrics.ordersPerMinute,
              conversion: payload.globalMetrics.conversionRate,
            }
          ];
          // Limit to last 15 points
          return next.slice(-15);
        });
      } catch (err) {
        console.error('Error parsing SSE telemetry chunk:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource connection lost. Attempting auto-reconnect...', err);
      setIsLive(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Drilldown: Go to trace list view with trace ID preset selected
  const handleNavigateToTrace = (traceId: string) => {
    setCurrentTab('tracing');
    // We can pass or signal state to select this trace ID in TracingDashboard
  };

  // Callback to trigger server-side Gemini RCA analysis on selected alert or trace
  const handleDiagnose = async (params: { alert?: Alert; serviceName?: string }): Promise<AiDiagnostic> => {
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: params.alert,
          serviceName: params.serviceName,
          activeIssue: telemetry?.activeIssue || 'NONE',
          globalMetrics: telemetry?.globalMetrics,
          serviceMetrics: telemetry?.services
        })
      });
      const data = await response.json();
      return data.diagnostic;
    } catch (err) {
      console.error('Failed to trigger SRE diagnosis API:', err);
      throw err;
    }
  };

  // Quick Action SRE Diagnose Trace
  const handleDiagnoseTrace = async (trace: any) => {
    setCurrentTab('ai-insights');
    // Perform diagnosis logic triggers on SRE console
  };

  const renderActiveTab = () => {
    if (!telemetry) {
      return (
        <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 font-sans">
          <BrainCircuit className="w-12 h-12 text-[#800020] animate-spin mb-4" />
          <span className="text-sm font-semibold text-slate-700">Connecting to PromiseTelemetry live sync stream...</span>
          <p className="text-xs text-slate-400 mt-1">Bootstrapping e-commerce services state engines</p>
        </div>
      );
    }

    switch (currentTab) {
      case 'executive':
        return (
          <ExecutiveDashboard
            data={telemetry.globalMetrics}
            history={chartsHistory}
            overallHealth={telemetry.overallHealth}
            activeAlerts={telemetry.alerts}
          />
        );
      case 'services':
        return <ServiceMap services={telemetry.services} />;
      case 'metrics':
        return (
          <MetricsDashboard
            data={telemetry.globalMetrics}
            services={telemetry.services}
            history={chartsHistory}
          />
        );
      case 'tracing':
        return (
          <TracingDashboard
            traces={telemetry.traces}
            onDiagnoseTrace={handleDiagnoseTrace}
          />
        );
      case 'logging':
        return (
          <LoggingDashboard
            logs={telemetry.logs}
            onNavigateToTrace={handleNavigateToTrace}
          />
        );
      case 'business':
        return (
          <BusinessDashboard
            data={telemetry.globalMetrics}
            history={chartsHistory}
          />
        );
      case 'alerts':
        return (
          <AlertingPanel
            activeAlerts={telemetry.alerts}
            historicAlerts={(telemetry as any).historicAlerts || []}
          />
        );
      case 'ai-insights':
        return (
          <AiInsightsPanel
            activeAlerts={telemetry.alerts}
            globalMetrics={telemetry.globalMetrics}
            services={telemetry.services}
            activeIssue={(telemetry as any).activeIssue || 'NONE'}
            onDiagnose={handleDiagnose}
          />
        );
      case 'aws-export':
        return (
          <AwsExportPanel
            payload={telemetry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex">
      {/* Dynamic APM Navigation Rail */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isLive={isLive}
        overallHealth={telemetry?.overallHealth || 'HEALTHY'}
      />

      {/* Main viewport */}
      <main className="flex-1 pl-64 min-h-screen relative bg-slate-50/50">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 geometric-grid opacity-15 pointer-events-none z-0" />

        {/* Dynamic content viewport */}
        <div className="p-8 relative z-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
