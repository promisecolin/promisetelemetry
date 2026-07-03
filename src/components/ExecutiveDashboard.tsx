import React from 'react';
import { MetricData, Alert } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  AlertCircle, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ExecutiveDashboardProps {
  data: MetricData;
  history: Array<{ time: string; rate: number; latency: number }>;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  activeAlerts: Alert[];
}

export default function ExecutiveDashboard({ data, history, overallHealth, activeAlerts }: ExecutiveDashboardProps) {
  
  const getHealthBadge = () => {
    switch (overallHealth) {
      case 'HEALTHY':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>NOMINAL</span>
          </div>
        );
      case 'DEGRADED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>DEGRADED</span>
          </div>
        );
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 animate-bounce" />
            <span>CRITICAL INCIDENT</span>
          </div>
        );
    }
  };

  const kpis = [
    {
      id: 'revenue',
      label: 'Live Revenue',
      value: `$${data.revenuePerMinute.toFixed(2)}/min`,
      icon: DollarSign,
      color: 'text-[#800020]',
      desc: 'Active sales volume',
      trend: '+14% vs hourly baseline'
    },
    {
      id: 'orders',
      label: 'Orders Processed',
      value: `${data.ordersPerMinute}/min`,
      icon: ShoppingCart,
      color: 'text-[#800020]',
      desc: 'Completed checkouts',
      trend: `${data.paymentSuccessRate.toFixed(1)}% payment success`
    },
    {
      id: 'users',
      label: 'Active Users',
      value: data.activeUsers.toLocaleString(),
      icon: Users,
      color: 'text-slate-800',
      desc: 'Current online sessions',
      trend: `Click rate: ${data.clickRate.toFixed(1)}/sec`
    },
    {
      id: 'latency',
      label: 'P99 Response',
      value: `${data.responseTime.toFixed(0)}ms`,
      icon: Activity,
      color: data.responseTime > 400 ? 'text-amber-500' : 'text-slate-800',
      desc: 'Global service latency',
      trend: `Throughput: ${data.throughput} req/sec`
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Overview Card */}
      <div className="bg-[#FFF8F8] border border-[#D4A5A5]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[#800020] tracking-tight">PromiseTelemetry Control Center</h2>
            {getHealthBadge()}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time APM telemetry for AWS Fargate container nodes & Stripe checkout services.
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-white border border-[#D4A5A5]/20 px-4 py-2 rounded-xl shadow-sm">
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Uptime Ratio</span>
            <span className="text-slate-800 text-sm font-black">{data.availability}%</span>
          </div>
          <div className="w-px h-8 bg-[#D4A5A5]/20" />
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Pod Restarts</span>
            <span className="text-slate-800 text-sm font-black text-rose-500">{data.podRestarts}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              id={`kpi-${kpi.id}`}
              key={kpi.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-[#D4A5A5]/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <h3 className={`text-2xl font-black ${kpi.color} mt-1`}>{kpi.value}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF8F8] flex items-center justify-center border border-[#D4A5A5]/20 shadow-sm">
                  <Icon className="w-5 h-5 text-[#800020]" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D4A5A5]/10 flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-600">{kpi.trend}</span>
                <span className="text-[10px] font-medium text-slate-400">{kpi.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Primary Chart Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Throughput / Error Rate */}
        <div className="lg:col-span-2 bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-[#800020]">Platform Live Traffic Throughput</h3>
              <p className="text-xs text-slate-400">Request Rates and p99 Response latency offsets.</p>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <div className="flex items-center gap-1 text-[#800020]">
                <span className="w-2.5 h-2.5 rounded bg-[#800020]" />
                <span>Requests/sec</span>
              </div>
              <div className="flex items-center gap-1 text-[#D4A5A5]">
                <span className="w-2.5 h-2.5 rounded bg-[#D4A5A5]" />
                <span>P99 Latency (ms)</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#800020" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#800020" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A5A5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D4A5A5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E5E5" />
                <XAxis dataKey="time" stroke="#B8A2A2" fontSize={10} tickLine={false} />
                <YAxis stroke="#B8A2A2" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFF8F8', borderColor: '#D4A5A5', borderRadius: '12px' }}
                  labelClassName="text-slate-500 text-xs font-bold font-mono"
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#800020" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" name="Requests/s" />
                <Area type="monotone" dataKey="latency" stroke="#D4A5A5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLatency)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alert Feed */}
        <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#800020] mb-4">Active Incidents / Alerting</h3>
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                <span className="text-sm font-bold text-slate-800">No active alerts</span>
                <p className="text-xs text-slate-400 mt-1">Platform is operating within standard parameters.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {activeAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3.5 rounded-xl border flex gap-3 ${
                      alert.severity === 'CRITICAL' 
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <AlertCircle className={`w-5 h-5 shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'
                    }`} />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase bg-white/80 px-1.5 py-0.5 rounded border">
                          {alert.service}
                        </span>
                        <span className="text-[10px] font-bold opacity-60">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-snug mt-1">{alert.message}</p>
                      <span className="text-[10px] font-black underline block mt-1">
                        Current: {alert.value} (Limit: {alert.threshold})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Overall Error Rate</span>
              <span className={`font-black ${data.errorRate > 2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {data.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-500 ${
                  data.errorRate > 2 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, data.errorRate * 10))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
