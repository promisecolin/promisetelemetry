import React, { useState } from 'react';
import { TelemetryPayload, AwsConfig } from '../types';
import { Cloud, Save, CheckCircle, ShieldAlert, Play, Terminal, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AwsExportPanelProps {
  payload: TelemetryPayload;
}

interface ExportLog {
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  message: string;
}

export default function AwsExportPanel({ payload }: AwsExportPanelProps) {
  const [config, setConfig] = useState<AwsConfig>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    namespace: 'PromiseTelemetry',
    exportMetrics: true,
    exportLogs: true,
    exportTraces: true,
  });

  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(false);
  const [exportLogsList, setExportLogsList] = useState<ExportLog[]>([
    { time: new Date().toLocaleTimeString(), type: 'INFO', message: 'AWS telemetry forwarder engine initialized.' }
  ]);
  const [exportActive, setExportActive] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSynced(true);
      addLog('SUCCESS', `AWS target configuration saved. Target: ${config.namespace}/${config.region}`);
    }, 1200);
  };

  const addLog = (type: 'INFO' | 'SUCCESS' | 'WARNING', message: string) => {
    setExportLogsList(prev => [
      { time: new Date().toLocaleTimeString(), type, message },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  const handleToggleExport = () => {
    const nextState = !exportActive;
    setExportActive(nextState);
    if (nextState) {
      addLog('SUCCESS', 'Real-time telemetry forwarding daemon initiated.');
      runExportIteration();
    } else {
      addLog('WARNING', 'Telemetry forwarding daemon paused.');
    }
  };

  // Run a mock forwarding interval when active
  const runExportIteration = async () => {
    if (!exportActive) return;

    try {
      const response = await fetch('/api/aws/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, payload })
      });
      const data = await response.json();
      
      if (data.success) {
        addLog('INFO', `Forwarded ${data.details.metricsExported} metrics into AWS CloudWatch Namespace: ${data.details.namespace}`);
        if (config.exportLogs) {
          addLog('INFO', `Successfully streamed ${data.details.logsExported} raw structured JSON logs to CloudWatch LogGroup: ${data.details.namespace}-Logs`);
        }
        if (config.exportTraces) {
          addLog('INFO', `Exported ${data.details.tracesExported} traces to AWS X-Ray Segment maps.`);
        }
      }
    } catch (err) {
      addLog('WARNING', 'Failed to communicate with full-stack AWS forwarder API.');
    }
  };

  // Trigger iteration when payload updates if export is active
  React.useEffect(() => {
    if (exportActive) {
      runExportIteration();
    }
  }, [payload.timestamp, exportActive]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">AWS CloudWatch & X-Ray forwarder</h2>
        <p className="text-sm text-slate-500">Securely forward local OpenTelemetry metrics, log streams, and child traces directly to Amazon Cloud APIs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Configuration form */}
        <div className="xl:col-span-2 bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#800020] uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#800020]" />
              Configuration Parameters
            </h3>
            {synced && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>SAVED</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">AWS Region</label>
                <input
                  type="text"
                  required
                  value={config.region}
                  onChange={(e) => setConfig({ ...config, region: e.target.value })}
                  placeholder="us-east-1"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">CloudWatch Namespace</label>
                <input
                  type="text"
                  required
                  value={config.namespace}
                  onChange={(e) => setConfig({ ...config, namespace: e.target.value })}
                  placeholder="PromiseTelemetry"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#800020]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">AWS Access Key ID (Optional)</label>
                <input
                  type="text"
                  value={config.accessKeyId}
                  onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">AWS Secret Access Key (Optional)</label>
                <input
                  type="password"
                  value={config.secretAccessKey}
                  onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-[#800020]"
                />
              </div>
            </div>

            {/* Sync Toggles */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Scope Sync Parameters</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                {/* Metrics */}
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, exportMetrics: !config.exportMetrics })}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    config.exportMetrics 
                      ? 'bg-[#FFF8F8] border-[#800020] text-[#800020]' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span>Metrics Forwarding</span>
                  <span className="text-[10px] uppercase font-black">{config.exportMetrics ? 'ON' : 'OFF'}</span>
                </button>

                {/* Logs */}
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, exportLogs: !config.exportLogs })}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    config.exportLogs 
                      ? 'bg-[#FFF8F8] border-[#800020] text-[#800020]' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span>Logs Forwarding</span>
                  <span className="text-[10px] uppercase font-black">{config.exportLogs ? 'ON' : 'OFF'}</span>
                </button>

                {/* Traces */}
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, exportTraces: !config.exportTraces })}
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    config.exportTraces 
                      ? 'bg-[#FFF8F8] border-[#800020] text-[#800020]' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <span>AWS X-Ray Traces</span>
                  <span className="text-[10px] uppercase font-black">{config.exportTraces ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#800020] hover:bg-[#A52A2A] text-white font-black text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleExport}
                className={`px-6 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all ${
                  exportActive 
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Play className={`w-4 h-4 ${exportActive ? 'animate-spin' : ''}`} />
                <span>{exportActive ? 'Pause Sync Stream' : 'Save and Initiate AWS Sync'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Log console */}
        <div className="bg-[#181111] border border-[#271b1b] rounded-2xl p-5 flex flex-col h-[480px]">
          <div className="flex justify-between items-center border-b border-[#3c2525] pb-3 text-[#D4A5A5] mb-4 select-none">
            <span className="text-xs font-mono font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-rose-400" />
              AWS_SYNC_DAEMON
            </span>
            <span className={`text-[9px] font-black font-mono bg-[#800020] text-white px-1.5 py-0.5 rounded ${
              exportActive ? 'animate-pulse' : ''
            }`}>
              {exportActive ? 'STREAMING' : 'IDLE'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10px]">
            {exportLogsList.map((log, idx) => (
              <div key={idx} className="text-[#F1E5E5] leading-normal flex items-start gap-2">
                <span className="text-[#D4A5A5]/60 select-none shrink-0">[{log.time}]</span>
                <span className={
                  log.type === 'SUCCESS' ? 'text-emerald-400 font-bold' : log.type === 'WARNING' ? 'text-amber-500 font-bold' : 'text-blue-400'
                }>
                  {log.type}
                </span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
