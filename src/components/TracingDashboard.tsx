import React, { useState } from 'react';
import { Trace, Span } from '../types';
import { Clock, CheckCircle, AlertTriangle, ChevronRight, BrainCircuit, Tag } from 'lucide-react';

interface TracingDashboardProps {
  traces: Trace[];
  onDiagnoseTrace: (trace: Trace) => void;
}

export default function TracingDashboard({ traces, onDiagnoseTrace }: TracingDashboardProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  const selectedTrace = traces.find(t => t.traceId === selectedTraceId) || traces[0];

  React.useEffect(() => {
    if (traces.length > 0 && !selectedTraceId) {
      setSelectedTraceId(traces[0].traceId);
    }
  }, [traces, selectedTraceId]);

  const renderWaterfall = (trace: Trace) => {
    const totalDuration = trace.duration;
    
    // Sort spans by startTime to render chronological order
    const sortedSpans = [...trace.spans].sort((a, b) => a.startTime - b.startTime);

    // Calculate nesting levels for indentation
    const spanLevels: Record<string, number> = {};
    const calculateLevels = (spanId: string, currentLevel: number) => {
      spanLevels[spanId] = currentLevel;
      sortedSpans
        .filter(s => s.parentSpanId === spanId)
        .forEach(child => calculateLevels(child.spanId, currentLevel + 1));
    };

    // Find root spans
    const rootSpans = sortedSpans.filter(s => !s.parentSpanId);
    rootSpans.forEach(root => calculateLevels(root.spanId, 0));

    return (
      <div className="space-y-3.5 pt-4">
        {sortedSpans.map(span => {
          const level = spanLevels[span.spanId] || 0;
          const leftPercent = totalDuration > 0 ? (span.startTime / totalDuration) * 100 : 0;
          const widthPercent = totalDuration > 0 ? (span.duration / totalDuration) * 100 : 100;
          const isSpanSelected = selectedSpanId === span.spanId;

          return (
            <div key={span.spanId} className="space-y-1.5">
              <div 
                onClick={() => setSelectedSpanId(isSpanSelected ? null : span.spanId)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSpanSelected 
                    ? 'bg-[#FFF8F8] border-[#800020] ring-1 ring-[#800020]/10' 
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Span info on left */}
                <div 
                  className="flex items-center gap-2 truncate text-xs font-semibold text-slate-700 select-none"
                  style={{ paddingLeft: `${level * 16}px` }}
                >
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSpanSelected ? 'rotate-90 text-[#800020]' : ''}`} />
                  <span className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] uppercase ${
                    span.status === 'ERROR' 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {span.serviceName}
                  </span>
                  <span className="truncate font-bold font-mono text-slate-800 text-[11px]">{span.operationName}</span>
                </div>

                {/* Duration bar on right */}
                <div className="w-1/2 flex items-center gap-3">
                  <div className="flex-1 bg-slate-50 h-5.5 rounded-md relative overflow-hidden border border-slate-100">
                    <div 
                      className={`h-full rounded-md transition-all duration-300 ${
                        span.status === 'ERROR' ? 'bg-rose-500' : 'bg-[#800020]'
                      }`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${Math.max(2, widthPercent)}%`,
                        position: 'absolute'
                      }}
                    />
                    <span className="absolute right-2 top-0.5 text-[10px] font-bold text-slate-600 font-mono">
                      {span.duration.toFixed(1)} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Span Attributes Accordion */}
              {isSpanSelected && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 ml-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#800020]" />
                      Span Metadata Attributes
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-400">ID: {span.spanId}</span>
                  </div>
                  
                  {span.errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono p-3 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Error Exception:</span>
                        <p className="mt-1">{span.errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    {Object.entries(span.attributes).map(([key, val]) => (
                      <div key={key} className="flex justify-between bg-white p-2 rounded-lg border border-slate-100 overflow-hidden">
                        <span className="text-slate-400 select-all truncate mr-2">{key}</span>
                        <span className="text-slate-700 font-bold select-all truncate max-w-[150px]" title={String(val)}>
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">OpenTelemetry Distributed Tracing</h2>
        <p className="text-sm text-slate-500">Trace request lifecycles, inspect call chains, and pinpoint microservice lag bottlenecks.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Trace List */}
        <div className="xl:col-span-1 bg-white border border-[#D4A5A5]/30 rounded-2xl flex flex-col h-[550px] shadow-sm">
          <div className="px-5 py-4 border-b border-[#D4A5A5]/20 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Traces Stream</h3>
            <span className="text-[10px] font-bold bg-[#FFF8F8] text-[#800020] px-2 py-0.5 rounded border border-[#D4A5A5]/30">
              BUFFER: {traces.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {traces.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Waiting for trace stream data...</div>
            ) : (
              traces.map(trace => {
                const isSelected = selectedTrace?.traceId === trace.traceId;
                return (
                  <button
                    key={trace.traceId}
                    onClick={() => {
                      setSelectedTraceId(trace.traceId);
                      setSelectedSpanId(null);
                    }}
                    className={`w-full p-4 text-left transition-all hover:bg-slate-50 flex items-start gap-3 border-l-4 ${
                      isSelected 
                        ? 'bg-[#FFF8F8]/55 border-[#800020]' 
                        : 'border-transparent'
                    }`}
                  >
                    {trace.status === 'ERROR' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                        <span className="font-mono text-slate-500">ID: {trace.traceId}</span>
                        <span>{new Date(trace.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {trace.rootServiceName} <span className="font-mono text-slate-500 text-[10px]">{trace.rootOperation}</span>
                      </h4>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 mt-1">
                        <span className="font-mono font-bold text-slate-500">{trace.spans.length} spans</span>
                        <span className="font-mono font-black text-[#800020]">{trace.duration.toFixed(0)} ms</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Trace Detail & Waterfall */}
        <div className="xl:col-span-2 bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[550px]">
          {selectedTrace ? (
            <div className="space-y-6">
              {/* Trace details head */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800 font-mono">Trace ID: {selectedTrace.traceId}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedTrace.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedTrace.status === 'OK' ? 'NOMINAL' : 'ERROR BOUNDARY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Initiated on {new Date(selectedTrace.timestamp).toLocaleString()}</span>
                  </p>
                </div>

                <button
                  onClick={() => onDiagnoseTrace(selectedTrace)}
                  className="flex items-center gap-2 text-xs bg-[#800020] hover:bg-[#A52A2A] text-white font-black px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI RCA Diagnosis</span>
                </button>
              </div>

              {/* Waterfall chart */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Span Execution Flow Waterfall</h4>
                {renderWaterfall(selectedTrace)}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-slate-400">
              Select a trace from the left to inspect distributed spans.
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center text-[11px] text-slate-500 font-semibold mt-6">
            Waterfall rendering follows W3C Trace Context spec standards using span relative parent offsets.
          </div>
        </div>
      </div>
    </div>
  );
}
