import React from 'react';
import { Alert } from '../types';
import { AlertCircle, CheckCircle, Flame, ShieldAlert, Clock, BellRing } from 'lucide-react';
import { motion } from 'motion/react';

interface AlertingPanelProps {
  activeAlerts: Alert[];
  historicAlerts: Alert[];
}

export default function AlertingPanel({ activeAlerts, historicAlerts }: AlertingPanelProps) {
  
  const rules = [
    { service: 'frontend', metric: 'cpu', threshold: '85%', description: 'Triggered when the core HTTP client-facing service experiences process exhaustion.', severity: 'CRITICAL' },
    { service: 'paymentservice', metric: 'latency', threshold: '500ms', description: 'Triggered when downstream payment processor verification latency limits degrade checkout experience.', severity: 'CRITICAL' },
    { service: 'postgres', metric: 'connections', threshold: '45 active', description: 'Triggered when the central transaction relational database pool reaches critical limits.', severity: 'WARNING' },
    { service: 'checkoutservice', metric: 'errorRate', threshold: '5.0%', description: 'Triggered when completed order transactions experience failures.', severity: 'CRITICAL' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">Active Incidents & Alert Routing</h2>
        <p className="text-sm text-slate-500">Configure alert channels, review threshold warnings, and manage resolution pipelines.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Alerts List */}
        <div className="xl:col-span-2 bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BellRing className="w-5 h-5 text-[#800020]" />
            <h3 className="text-base font-bold text-[#800020]">Currently Firing Triggers ({activeAlerts.length})</h3>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <h4 className="font-bold text-slate-800">No Firing Incidents</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">All container instances and databases are operating safely below telemetry thresholds.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border flex gap-4 items-start ${
                    alert.severity === 'CRITICAL' 
                      ? 'bg-rose-50 border-rose-200 text-rose-950' 
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {alert.severity === 'CRITICAL' ? <Flame className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-white px-2 py-0.5 rounded border shadow-xs">
                          {alert.service}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 leading-snug mt-1.5">{alert.message}</h4>
                    
                    <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <span>Threshold limit: <span className="font-bold text-slate-700">{alert.threshold}</span></span>
                      <span>Trigger value: <span className="font-bold text-rose-600 underline">{alert.value}</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Historical alerts */}
          {historicAlerts.length > 0 && (
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recently Resolved Events ({historicAlerts.length})</h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {historicAlerts.map(hist => (
                  <div key={hist.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-mono text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-700 uppercase mr-2">{hist.service}</span>
                        <span className="text-slate-800 font-bold">{hist.message}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{hist.resolvedAt ? new Date(hist.resolvedAt).toLocaleTimeString() : 'Recently'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerting Rules Table */}
        <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#800020] mb-4">Configured Threshold Rules</h3>
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.service + rule.metric} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black text-[#800020] uppercase bg-[#FFF8F8] border border-[#D4A5A5]/20 px-2 py-0.5 rounded">
                      {rule.service}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rule.severity}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-700">
                    <span>When <span className="font-mono font-bold underline text-slate-800">{rule.metric}</span> is above <span className="font-mono font-black text-rose-600">{rule.threshold}</span></span>
                  </div>

                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FFF8F8] border border-[#D4A5A5]/20 p-4 rounded-xl text-xs font-semibold text-slate-600 text-center leading-relaxed mt-4">
            Alert targets are configured to route via Amazon SNS topic to PagerDuty and Slack integrations.
          </div>
        </div>
      </div>
    </div>
  );
}
