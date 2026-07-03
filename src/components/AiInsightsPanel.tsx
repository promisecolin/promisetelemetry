import React, { useState } from 'react';
import { AiDiagnostic, Alert, MetricData, ServiceStatus } from '../types';
import { BrainCircuit, Play, Sparkles, CheckCircle2, HelpCircle, AlertTriangle, ArrowRight, CornerDownRight, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiInsightsPanelProps {
  activeAlerts: Alert[];
  globalMetrics: MetricData;
  services: Record<string, ServiceStatus>;
  activeIssue: string;
  onDiagnose: (params: { alert?: Alert; serviceName?: string }) => Promise<AiDiagnostic>;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function AiInsightsPanel({ activeAlerts, globalMetrics, services, activeIssue, onDiagnose }: AiInsightsPanelProps) {
  const [selectedAlertId, setSelectedAlertId] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [activeDiagnostic, setActiveDiagnostic] = useState<AiDiagnostic | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { 
      sender: 'assistant', 
      text: 'Hello, I am your PromiseTelemetry AI SRE Assistant. I have continuous server-side context of your 18 microservices and database transaction parameters. Ask me any diagnostic or architecture questions (e.g., "Why is Payments service latency peaking?", "How can I resolve Postgres connections limit?").', 
      timestamp: new Date().toLocaleTimeString() 
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleRunDiagnosis = async () => {
    setLoading(true);
    try {
      const alert = selectedAlertId !== 'all' ? activeAlerts.find(a => a.id === selectedAlertId) : undefined;
      const serviceName = selectedService !== 'all' ? selectedService : undefined;
      const result = await onDiagnose({ alert, serviceName });
      setActiveDiagnostic(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString() }]);
    setChatLoading(true);

    try {
      // Direct POST API fetch to server-side Gemini assistant
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeIssue,
          alert: { message: `User Question: "${userMsg}"` },
          globalMetrics,
          serviceMetrics: services
        })
      });
      const data = await response.json();
      
      const reply = data.success 
        ? `${data.diagnostic.summary}\n\n**Root Cause:** ${data.diagnostic.rootCause}\n\n**Recommended SRE Action:** ${data.diagnostic.suggestedFix}`
        : data.diagnostic.summary || 'I analyzed the system parameters but could not isolate a threshold breach. Overall system operating constraints are normal.';

      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Error querying SRE agent. Please ensure the full-stack server is running and online.', timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="bg-[#800020] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-[#D4A5A5] animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight">AI SRE Autonomous Diagnosis Engine</h2>
        </div>
        <p className="text-sm text-[#D4A5A5] mt-1 max-w-2xl leading-relaxed">
          Leverages server-side Gemini 3.5 models to ingest multi-service distributed traces, logs, and connection parameters to compile zero-touch root cause analyses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-demand Diagnostics Control */}
        <div className="bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#800020] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Triage Operational State
            </h3>

            {/* Select Target Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Isolate Active Incident</label>
              <select
                value={selectedAlertId}
                onChange={(e) => setSelectedAlertId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#800020]"
              >
                <option value="all">Active Incident: {activeIssue !== 'NONE' ? `Detected ${activeIssue}` : 'None (Baseline)'}</option>
                {activeAlerts.map(alert => (
                  <option key={alert.id} value={alert.id}>Firing: {alert.service} - {alert.metric}</option>
                ))}
              </select>
            </div>

            {/* Select Target Service */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Filter Scope to Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#800020]"
              >
                <option value="all">All Microservices (Full Trace Context)</option>
                {Object.keys(services).map(svcName => (
                  <option key={svcName} value={svcName}>{svcName}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRunDiagnosis}
            disabled={loading}
            className="w-full bg-[#800020] hover:bg-[#A52A2A] text-white font-black text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin" />
                <span>Generating Diagnostic...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Deep Diagnostics</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Results Box */}
        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm min-h-[350px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeDiagnostic ? (
              <motion.div
                key={activeDiagnostic.id || 'diag'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5 flex-1"
              >
                <div className="flex justify-between items-start border-b border-[#D4A5A5]/20 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-800">{activeDiagnostic.incidentType}</h3>
                    <span className="text-[10px] font-bold text-[#A52A2A] uppercase">Autonomous SRE Brief</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Confidence</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{(activeDiagnostic.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Operational Summary</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-[#D4A5A5]/10">{activeDiagnostic.summary}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Technical Root Cause</span>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed font-mono bg-white p-3 rounded-lg border border-[#D4A5A5]/10 whitespace-pre-line">{activeDiagnostic.rootCause}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Suggested Mitigation Action</span>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed bg-emerald-50/50 border border-emerald-200 text-slate-900 p-3 rounded-lg flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />
                      <span>{activeDiagnostic.suggestedFix}</span>
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Affected Infrastructure Mapping</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeDiagnostic.affectedServices.map((svc, i) => (
                        <div key={svc} className="flex items-center gap-1">
                          {i > 0 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                          <span className="text-[10px] font-bold bg-[#800020] text-white px-2 py-0.5 rounded font-mono">
                            {svc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 flex-1">
                <BrainCircuit className="w-12 h-12 text-[#800020]/20 mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-700 text-sm">No Active Diagnosis Selected</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">Select an incident or microservice scope and execute deepest autonomous diagnosis above.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SRE Assistant Interactive chat */}
      <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MessageSquare className="w-5 h-5 text-[#800020]" />
          <h3 className="text-base font-bold text-[#800020]">SRE Interactive Q&A Console</h3>
        </div>

        {/* Message feed */}
        <div className="h-64 overflow-y-auto space-y-3.5 pr-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed shadow-xs ${
                msg.sender === 'user' 
                  ? 'bg-[#800020] text-white rounded-br-none' 
                  : 'bg-white text-slate-700 border border-[#D4A5A5]/20 rounded-bl-none'
              }`}>
                {/* Format markdown bold slightly */}
                <p className="whitespace-pre-line font-medium">
                  {msg.text.split('**').map((chunk, index) => index % 2 === 1 ? <strong key={index} className="font-bold text-rose-800">{chunk}</strong> : chunk)}
                </p>
                <span className="text-[9px] opacity-40 font-bold block mt-1.5 text-right font-mono">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 border border-slate-150 p-3.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 shadow-xs">
                <BrainCircuit className="w-4 h-4 animate-spin text-[#800020]" />
                <span className="font-semibold">AI SRE agent formulating diagnostics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input form */}
        <form onSubmit={handleSendChat} className="flex gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about cluster performance (e.g., 'What metrics trigger the Payments alert?')"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#800020] placeholder-slate-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="bg-[#800020] hover:bg-[#A52A2A] text-white p-3 rounded-xl shadow-md transition-colors shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
