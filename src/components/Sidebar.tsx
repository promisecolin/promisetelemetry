import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Layers, 
  Terminal, 
  DollarSign, 
  Server, 
  AlertTriangle, 
  Brain, 
  Cloud 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLive: boolean;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export default function Sidebar({ currentTab, setCurrentTab, isLive, overallHealth }: SidebarProps) {
  const menuItems = [
    { id: 'executive', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'services', label: 'Service Topology', icon: Layers },
    { id: 'metrics', label: 'System Metrics', icon: Activity },
    { id: 'tracing', label: 'Trace Waterfall', icon: Server },
    { id: 'logging', label: 'Structured Logs', icon: Terminal },
    { id: 'business', label: 'Business KPIs', icon: DollarSign },
    { id: 'alerts', label: 'Incident Alerter', icon: AlertTriangle },
    { id: 'ai-insights', label: 'AI SRE Assistant', icon: Brain },
    { id: 'aws-export', label: 'AWS CloudWatch', icon: Cloud },
  ];

  const getHealthBadge = () => {
    switch (overallHealth) {
      case 'HEALTHY':
        return 'bg-emerald-500';
      case 'DEGRADED':
        return 'bg-amber-500 animate-pulse';
      case 'CRITICAL':
        return 'bg-rose-500 animate-pulse';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-burgundy text-white border-r border-black/10 flex flex-col z-30 font-sans shadow-xl">
      {/* Geometric Logo branding */}
      <div className="h-20 px-6 border-b border-white/10 flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-lg">
          <div className="w-5 h-5 bg-burgundy rotate-45 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full -rotate-45" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tighter leading-none">PROMISE</h1>
          <span className="text-[10px] font-light text-white/50 tracking-widest block mt-0.5">TELEMETRY</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-tab-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white/15 text-white border-l-4 border-accent-pink shadow-md' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-pink' : 'text-white/40'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Connection Status */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center justify-between mb-3 text-[10px] font-bold tracking-wider">
          <span className="text-white/50 uppercase">Sync Stream</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-ping' : 'bg-rose-500'}`} />
            <span className={isLive ? 'text-green-400' : 'text-rose-400'}>{isLive ? 'STREAMING' : 'DISCONNECTED'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
          <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">State</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getHealthBadge()}`} />
            <span className="text-xs font-black text-white">{overallHealth}</span>
          </div>
        </div>
        
        <div className="mt-3 text-center flex flex-col gap-0.5 select-none">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest font-mono">PROD-US-EAST-1</span>
          <span className="text-[8px] font-light text-white/20 tracking-wider font-mono">v2.4.0-STABLE</span>
        </div>
      </div>
    </aside>
  );
}

