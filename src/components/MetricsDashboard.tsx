import React from 'react';
import { MetricData, ServiceStatus } from '../types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, HardDrive, Network, Layers, RefreshCw } from 'lucide-react';

interface MetricsDashboardProps {
  data: MetricData;
  services: Record<string, ServiceStatus>;
  history: Array<{ time: string; cpu: number; memory: number; networkIn: number; networkOut: number }>;
}

export default function MetricsDashboard({ data, services, history }: MetricsDashboardProps) {
  const serviceList = Object.values(services);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">Infrastructure & Application Metrics</h2>
        <p className="text-sm text-slate-500">Live profiling of container resources, disk levels, network egress, and application queues.</p>
      </div>

      {/* Main resource stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Util Card */}
        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700">Node CPU Utilization</span>
            <Cpu className="w-5 h-5 text-[#800020]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#800020]">{data.cpu.toFixed(1)}%</span>
            <span className="text-xs font-semibold text-slate-400">of 32 logical cores</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-[#800020] h-full transition-all duration-500" 
              style={{ width: `${data.cpu}%` }}
            />
          </div>
        </div>

        {/* Memory Heap Card */}
        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700">Memory Allocation</span>
            <Layers className="w-5 h-5 text-[#800020]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#800020]">{data.memory.toFixed(1)}%</span>
            <span className="text-xs font-semibold text-slate-400">19.2 GB / 32.0 GB used</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-[#A52A2A] h-full transition-all duration-500" 
              style={{ width: `${data.memory}%` }}
            />
          </div>
        </div>

        {/* Disk Usage Card */}
        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700">Disk Volume Volume</span>
            <HardDrive className="w-5 h-5 text-[#800020]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#800020]">{data.disk.toFixed(2)}%</span>
            <span className="text-xs font-semibold text-slate-400">540 GB of 1.0 TB allocated</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-slate-700 h-full transition-all duration-500" 
              style={{ width: `${data.disk}%` }}
            />
          </div>
        </div>
      </div>

      {/* Resource Utilization Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU/Mem Chart */}
        <div className="bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-[#800020] mb-4">Resource Utilization History</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E5E5" />
                <XAxis dataKey="time" stroke="#B8A2A2" fontSize={10} tickLine={false} />
                <YAxis stroke="#B8A2A2" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFF8F8', borderColor: '#D4A5A5', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#800020" strokeWidth={2} fillOpacity={0.1} fill="#800020" name="CPU (%)" />
                <Area type="monotone" dataKey="memory" stroke="#A52A2A" strokeWidth={2} fillOpacity={0.1} fill="#A52A2A" name="Memory (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network In/Out */}
        <div className="bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-[#800020] mb-4">Network Egress/Ingress Traffic</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E5E5" />
                <XAxis dataKey="time" stroke="#B8A2A2" fontSize={10} tickLine={false} />
                <YAxis stroke="#B8A2A2" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFF8F8', borderColor: '#D4A5A5', borderRadius: '12px' }}
                />
                <Bar dataKey="networkIn" fill="#800020" radius={[4, 4, 0, 0]} name="Network In (KB/s)" />
                <Bar dataKey="networkOut" fill="#D4A5A5" radius={[4, 4, 0, 0]} name="Network Out (KB/s)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Service Profile List */}
      <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D4A5A5]/20 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#800020]">Active Services Operational Profile</h3>
          <span className="text-xs text-slate-400 font-semibold">{serviceList.length} services indexed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#D4A5A5]/20 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Service Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Throughput</th>
                <th className="px-6 py-3 text-right">Latency</th>
                <th className="px-6 py-3 text-right">Error Rate</th>
                <th className="px-6 py-3 text-right">CPU</th>
                <th className="px-6 py-3 text-right">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
              {serviceList.map(service => (
                <tr key={service.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900 font-mono">{service.name}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      service.status === 'HEALTHY' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : service.status === 'DEGRADED' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono">{service.requestCount} rps</td>
                  <td className="px-6 py-3.5 text-right font-mono">{service.latency.toFixed(0)} ms</td>
                  <td className={`px-6 py-3.5 text-right font-mono ${service.errorRate > 2 ? 'text-rose-500' : 'text-slate-600'}`}>
                    {service.errorRate}%
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono">{service.cpu.toFixed(1)}%</td>
                  <td className="px-6 py-3.5 text-right font-mono">{service.memory.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
