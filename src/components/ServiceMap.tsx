import React, { useState } from 'react';
import { ServiceStatus } from '../types';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Database, Play, AlertCircle } from 'lucide-react';

interface ServiceMapProps {
  services: Record<string, ServiceStatus>;
}

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'frontend' | 'logic' | 'storage' | 'external';
}

export default function ServiceMap({ services }: ServiceMapProps) {
  const [selectedService, setSelectedService] = useState<string>('frontend');

  // Service nodes layout positions on SVG canvas (relative grid)
  const nodes: Node[] = [
    { id: 'frontend', name: 'frontend', x: 80, y: 180, type: 'frontend' },
    
    { id: 'searchservice', name: 'searchservice', x: 260, y: 70, type: 'logic' },
    { id: 'productcatalogservice', name: 'productcatalogservice', x: 260, y: 180, type: 'logic' },
    { id: 'cartservice', name: 'cartservice', x: 260, y: 290, type: 'logic' },
    
    { id: 'userservice', name: 'userservice', x: 440, y: 70, type: 'logic' },
    { id: 'recommendationservice', name: 'recommendationservice', x: 440, y: 180, type: 'logic' },
    { id: 'checkoutservice', name: 'checkoutservice', x: 440, y: 290, type: 'logic' },

    { id: 'paymentservice', name: 'paymentservice', x: 620, y: 180, type: 'logic' },
    { id: 'inventoryservice', name: 'inventoryservice', x: 620, y: 290, type: 'logic' },
    { id: 'shippingservice', name: 'shippingservice', x: 620, y: 400, type: 'logic' },
    
    { id: 'postgres', name: 'postgres', x: 800, y: 120, type: 'storage' },
    { id: 'redis', name: 'redis', x: 800, y: 220, type: 'storage' },
    { id: 'emailservice', name: 'emailservice', x: 800, y: 320, type: 'external' },
    { id: 'notificationservice', name: 'notificationservice', x: 800, y: 410, type: 'external' },
  ];

  // Defined flow paths
  const connections = [
    { from: 'frontend', to: 'searchservice' },
    { from: 'frontend', to: 'productcatalogservice' },
    { from: 'frontend', to: 'cartservice' },
    { from: 'searchservice', to: 'userservice' },
    { from: 'productcatalogservice', to: 'recommendationservice' },
    { from: 'cartservice', to: 'checkoutservice' },
    { from: 'checkoutservice', to: 'paymentservice' },
    { from: 'checkoutservice', to: 'inventoryservice' },
    { from: 'checkoutservice', to: 'shippingservice' },
    { from: 'paymentservice', to: 'postgres' },
    { from: 'inventoryservice', to: 'postgres' },
    { from: 'userservice', to: 'redis' },
    { from: 'shippingservice', to: 'emailservice' },
    { from: 'checkoutservice', to: 'notificationservice' },
  ];

  const getServiceColor = (status?: string) => {
    switch (status) {
      case 'DEGRADED':
        return '#f59e0b'; // Amber
      case 'DOWN':
        return '#ef4444'; // Red
      default:
        return '#800020'; // Burgundy
    }
  };

  const currentServiceDetails = services[selectedService] || {
    name: selectedService,
    status: 'HEALTHY',
    cpu: 10,
    memory: 20,
    latency: 5,
    errorRate: 0,
    requestCount: 0,
    connections: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#D4A5A5]/20 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#800020] tracking-tight">E-Commerce Service Topology</h2>
          <p className="text-sm text-slate-500">Live request paths, error rates, and latency flows between systems.</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#800020]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
            <span>Healthy / Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Degraded</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Downtime / Slow</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Interactive SVG Diagram */}
        <div className="xl:col-span-3 bg-[#FFF8F8] border border-[#D4A5A5]/30 rounded-2xl p-4 relative overflow-hidden h-[500px] shadow-sm select-none">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#800020" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#D4A5A5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#800020" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Render lines first */}
            {connections.map((conn, idx) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              // Color based on source status
              const fromStatus = services[conn.from]?.status;
              const isDegraded = fromStatus === 'DEGRADED' || fromStatus === 'DOWN';
              const strokeColor = isDegraded ? '#D97706' : '#E5C4C4';

              return (
                <g key={`conn-${idx}`}>
                  {/* Static Connection Line */}
                  <path
                    d={`M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x) / 2} ${fromNode.y}, ${(fromNode.x + toNode.x) / 2} ${toNode.y}, ${toNode.x} ${toNode.y}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isDegraded ? 2.5 : 1.5}
                    className="transition-colors duration-500"
                  />

                  {/* Flow Animation (Slightly staggered flowing circles) */}
                  <motion.circle
                    r="3.5"
                    fill={isDegraded ? '#F59E0B' : '#800020'}
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{
                      duration: isDegraded ? 3.5 : 2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: (idx * 0.15) % 1
                    }}
                    style={{
                      motionPath: `path('M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x) / 2} ${fromNode.y}, ${(fromNode.x + toNode.x) / 2} ${toNode.y}, ${toNode.x} ${toNode.y}')`,
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Node Overlays */}
          {nodes.map(node => {
            const status = services[node.name]?.status || 'HEALTHY';
            const latency = services[node.name]?.latency || 0;
            const errorRate = services[node.name]?.errorRate || 0;
            const isSelected = selectedService === node.id;

            return (
              <motion.button
                id={`node-${node.id}`}
                key={node.id}
                style={{ left: node.x - 45, top: node.y - 25 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedService(node.id)}
                className={`absolute w-[100px] h-[55px] rounded-xl flex flex-col justify-center items-center px-2 cursor-pointer transition-all duration-300 border shadow-sm ${
                  isSelected 
                    ? 'bg-white border-[#800020] ring-2 ring-[#800020]/20' 
                    : 'bg-white border-[#D4A5A5]/30 hover:border-[#800020]'
                }`}
              >
                {/* Node Status ring */}
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  {status !== 'HEALTHY' && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      status === 'DOWN' ? 'bg-rose-400' : 'bg-amber-400'
                    }`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === 'HEALTHY' ? 'bg-[#800020]' : status === 'DOWN' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                </div>

                <span className="text-[9px] font-black tracking-tight text-slate-800 uppercase truncate w-full text-center">
                  {node.name.replace('service', '')}
                </span>

                <div className="flex justify-between items-center w-full mt-1 px-1 text-[8px] font-semibold text-slate-500">
                  <span>{latency.toFixed(0)}ms</span>
                  <span className={errorRate > 1 ? 'text-rose-500' : 'text-emerald-500'}>
                    {errorRate}%
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Service Detailed Sidebar */}
        <div className="bg-white border border-[#D4A5A5]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-[#D4A5A5]/20 pb-3">
              <div className="w-8 h-8 rounded bg-[#FFF8F8] flex items-center justify-center border border-[#D4A5A5]/30">
                {currentServiceDetails.name.includes('postgres') || currentServiceDetails.name.includes('redis') ? (
                  <Database className="w-4 h-4 text-[#800020]" />
                ) : (
                  <Activity className="w-4 h-4 text-[#800020]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#800020] leading-none uppercase truncate max-w-[150px]">
                  {currentServiceDetails.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Microservice Instance</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Status</span>
                  <span className={`font-bold ${
                    currentServiceDetails.status === 'HEALTHY' ? 'text-emerald-600' : 'text-amber-500'
                  }`}>{currentServiceDetails.status}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      currentServiceDetails.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: currentServiceDetails.status === 'HEALTHY' ? '100%' : '60%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-[#FFF8F8] border border-[#D4A5A5]/10 p-3 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">P99 Latency</span>
                  <span className="text-lg font-black text-[#800020]">{currentServiceDetails.latency.toFixed(0)}ms</span>
                </div>
                <div className="bg-[#FFF8F8] border border-[#D4A5A5]/10 p-3 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Error Rate</span>
                  <span className={`text-lg font-black ${currentServiceDetails.errorRate > 2 ? 'text-rose-500' : 'text-slate-800'}`}>
                    {currentServiceDetails.errorRate}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FFF8F8] border border-[#D4A5A5]/10 p-3 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">CPU Load</span>
                  <span className="text-lg font-black text-slate-800">{currentServiceDetails.cpu.toFixed(1)}%</span>
                </div>
                <div className="bg-[#FFF8F8] border border-[#D4A5A5]/10 p-3 rounded-lg text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Memory</span>
                  <span className="text-lg font-black text-slate-800">{currentServiceDetails.memory.toFixed(1)}%</span>
                </div>
              </div>

              <div className="border-t border-[#D4A5A5]/20 pt-4">
                <div className="flex justify-between items-center text-xs text-slate-600 mb-2 font-semibold">
                  <span>Throughput (RPS)</span>
                  <span className="font-bold text-slate-800">{currentServiceDetails.requestCount} rps</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                  <span>Connections</span>
                  <span className="font-bold text-slate-800">{currentServiceDetails.connections}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center text-xs text-slate-500 font-medium mt-4">
            Flow tracks live OpenTelemetry distributed context injection/propagation.
          </div>
        </div>
      </div>
    </div>
  );
}
