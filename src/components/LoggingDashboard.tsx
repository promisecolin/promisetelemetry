import React, { useState, useMemo } from 'react';
import { LogEntry, Severity } from '../types';
import { Search, Filter, Trash2, SlidersHorizontal, Terminal, ArrowDown } from 'lucide-react';
const SERVICES = [
  'frontend', 'productcatalogservice', 'cartservice', 'checkoutservice', 
  'paymentservice', 'shippingservice', 'currencyservice', 'recommendationservice', 
  'emailservice', 'adservice', 'inventoryservice', 'searchservice', 
  'userservice', 'notificationservice', 'analyticsservice', 'redis', 'postgres'
];

interface LoggingDashboardProps {
  logs: LogEntry[];
  onNavigateToTrace: (traceId: string) => void;
  onClearLogs?: () => void;
}

export default function LoggingDashboard({ logs, onNavigateToTrace, onClearLogs }: LoggingDashboardProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [showAutoScroll, setShowAutoScroll] = useState(true);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchText.toLowerCase()) || 
                            log.service.toLowerCase().includes(searchText.toLowerCase()) ||
                            (log.traceId && log.traceId.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
      const matchesService = selectedService === 'ALL' || log.service === selectedService;

      return matchesSearch && matchesSeverity && matchesService;
    });
  }, [logs, searchText, selectedSeverity, selectedService]);

  const getSeverityStyle = (severity: Severity) => {
    switch (severity) {
      case 'INFO':
        return 'text-blue-400 font-bold';
      case 'WARNING':
        return 'text-amber-500 font-bold';
      case 'ERROR':
        return 'text-rose-500 font-bold';
      case 'CRITICAL':
        return 'text-white bg-rose-600 px-1.5 py-0.5 rounded font-black animate-pulse';
    }
  };

  const getLogContainerStyle = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/20 border-l-4 border-rose-600';
      case 'ERROR':
        return 'bg-rose-950/5 border-l-4 border-rose-500';
      case 'WARNING':
        return 'bg-amber-500/5 border-l-4 border-amber-500';
      default:
        return 'border-l-4 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">Structured Application Logging</h2>
        <p className="text-sm text-slate-500">Searchable, multi-service indexed JSON logs featuring OpenTelemetry trace links.</p>
      </div>

      {/* Filter and controls bar */}
      <div className="bg-white border border-[#D4A5A5]/30 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by log contents, service, or trace ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#800020] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Service dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Services</option>
                {SERVICES.map(svc => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>

            {/* Clear button */}
            {onClearLogs && (
              <button 
                onClick={onClearLogs}
                className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-rose-500 rounded-xl transition-colors border border-slate-200"
                title="Clear Logs Buffer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-3">
          <div className="flex gap-2.5">
            {['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSeverity === sev
                    ? 'bg-[#800020] text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing {filteredLogs.length} of {logs.length} indexed records
          </span>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#1c1414] border border-[#2a1a1a] rounded-2xl p-5 shadow-inner flex flex-col h-[500px]">
        {/* Terminal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#3d2626] mb-4 text-slate-400 select-none">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-[#D4A5A5]">PROMISE_TELEMETRY_LOGS_STREAM</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>STREAM_ONLINE</span>
          </div>
        </div>

        {/* Console logs */}
        <div className="flex-1 overflow-y-auto pr-2 font-mono text-xs space-y-2 max-h-[420px]">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#D4A5A5]/40 text-center">
              No telemetry matches selected query parameters.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div 
                key={log.id} 
                className={`p-3 rounded-lg text-[#F5E5E5] transition-all hover:bg-white/5 ${getLogContainerStyle(log.severity)}`}
              >
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#D4A5A5]/70 mb-1.5 select-none font-bold">
                  <span>{new Date(log.timestamp).toISOString()}</span>
                  <span className="text-white bg-[#800020] px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px]">
                    {log.service}
                  </span>
                  <span>LEVEL: <span className={getSeverityStyle(log.severity)}>{log.severity}</span></span>
                  
                  {log.traceId && (
                    <button 
                      onClick={() => onNavigateToTrace(log.traceId!)}
                      className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer hover:text-amber-300 font-bold"
                    >
                      <span>TRACE:{log.traceId}</span>
                    </button>
                  )}
                </div>

                {/* Log message */}
                <p className="text-[#FFF2F2] leading-relaxed font-medium break-all">{log.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
