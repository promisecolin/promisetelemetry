import React from 'react';
import { MetricData, ServiceStatus } from '../types';
import { HardDrive, Server, ShieldCheck, Cpu, Database, AlertCircle } from 'lucide-react';

interface InfrastructureDashboardProps {
  data: MetricData;
  services: Record<string, ServiceStatus>;
}

export default function InfrastructureDashboard({ data, services }: InfrastructureDashboardProps) {
  const serviceList = Object.values(services);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">AWS Fargate ECS Cluster Metrics</h2>
        <p className="text-sm text-slate-500">Physical resources, container host CPU utilization, memory thresholds, and disk boundaries.</p>
      </div>

      {/* Cluster summary gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Container Tasks</span>
          <span className="text-3xl font-black text-[#800020]">{data.containerCount} Running</span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">across 17 active services</span>
        </div>

        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Node Health Status</span>
          <span className="text-3xl font-black text-[#800020]">{data.nodeHealth}% Excellent</span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">all AWS EC2 zones active</span>
        </div>

        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cluster CPU Core Utilization</span>
          <span className="text-3xl font-black text-[#800020]">{data.cpu}%</span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">across 32 logical threads</span>
        </div>

        <div className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Host Memory Pressure</span>
          <span className="text-3xl font-black text-[#800020]">{data.memory}%</span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">heap limits normal</span>
        </div>
      </div>

      {/* Grid of Task Clusters */}
      <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#800020] mb-4">ECS Task Cluster Orchestrator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {serviceList.map(svc => {
            const isStorage = svc.name === 'postgres' || svc.name === 'redis';
            return (
              <div 
                key={svc.name} 
                className="p-4 rounded-xl border border-slate-100 hover:border-[#D4A5A5]/40 transition-colors shadow-xs relative overflow-hidden flex flex-col justify-between h-[150px] bg-slate-50/40"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 truncate">
                    {isStorage ? (
                      <Database className="w-4 h-4 text-[#800020]" />
                    ) : (
                      <Server className="w-4 h-4 text-[#800020]" />
                    )}
                    <span className="text-xs font-bold text-slate-800 font-mono truncate">{svc.name}</span>
                  </div>

                  <span className={`w-2 h-2 rounded-full ${
                    svc.status === 'HEALTHY' ? 'bg-emerald-500' : svc.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-rose-500'
                  }`} />
                </div>

                <div className="space-y-2 mt-4 text-[11px] font-semibold text-slate-500">
                  <div className="flex justify-between items-center">
                    <span>Task CPU</span>
                    <span className="font-bold text-slate-800 font-mono">{svc.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Task Memory</span>
                    <span className="font-bold text-slate-800 font-mono">{svc.memory.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Task Restarts</span>
                    <span className="font-bold text-slate-800 font-mono">0</span>
                  </div>
                </div>

                <div className="h-1 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full ${svc.status === 'HEALTHY' ? 'bg-[#800020]' : 'bg-rose-500'}`} 
                    style={{ width: `${svc.cpu}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
