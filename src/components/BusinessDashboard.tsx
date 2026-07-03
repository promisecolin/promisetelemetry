import React from 'react';
import { MetricData } from '../types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Percent, ShoppingBag, Eye, UserCheck, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface BusinessDashboardProps {
  data: MetricData;
  history: Array<{ time: string; revenue: number; orders: number; conversion: number }>;
}

export default function BusinessDashboard({ data, history }: BusinessDashboardProps) {
  const cards = [
    { label: 'Revenue Generated', val: `$${data.revenuePerMinute.toFixed(2)}/min`, sub: 'Sales transactions', icon: DollarSign },
    { label: 'Checkout Success', val: `${data.paymentSuccessRate.toFixed(1)}%`, sub: 'Stripe transaction status', icon: UserCheck, color: data.paymentSuccessRate < 80 ? 'text-rose-500 font-bold' : 'text-[#800020]' },
    { label: 'Cart Abandonment', val: `${data.cartAbandonmentRate.toFixed(1)}%`, sub: 'Items left in cart', icon: ShoppingBag },
    { label: 'Conversion Ratio', val: `${data.conversionRate.toFixed(1)}%`, sub: 'Sessions with order', icon: Percent },
  ];

  // Simulated conversion funnel data
  const funnelData = [
    { step: '1. Product Catalog Views', users: data.productViews, percent: 100 },
    { step: '2. Items Added to Cart', users: Math.floor(data.productViews * 0.45), percent: 45 },
    { step: '3. Initiated Checkout', users: Math.floor(data.productViews * 0.22), percent: 22 },
    { step: '4. Completed Payment', users: data.ordersPerMinute * 10, percent: Math.floor((data.ordersPerMinute * 10 / data.productViews) * 100) },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#800020] tracking-tight">Business KPI Diagnostics</h2>
        <p className="text-sm text-slate-500">Live profiling of e-commerce funnel completion, checkout speed, and order health.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#FFF8F8] border border-[#D4A5A5]/30 p-5 rounded-2xl shadow-sm"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{c.label}</span>
                <div className="w-8 h-8 rounded-lg bg-white border border-[#D4A5A5]/20 flex items-center justify-center shadow-xs">
                  <Icon className="w-4.5 h-4.5 text-[#800020]" />
                </div>
              </div>
              <h3 className={`text-2xl font-black mt-2 ${c.color || 'text-[#800020]'}`}>{c.val}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">{c.sub}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live revenue per minute */}
        <div className="bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-[#800020] mb-4">Live Business Sales Stream ($)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1E5E5" />
                <XAxis dataKey="time" stroke="#B8A2A2" fontSize={10} tickLine={false} />
                <YAxis stroke="#B8A2A2" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF8F8', borderColor: '#D4A5A5', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#800020" strokeWidth={2} fillOpacity={0.15} fill="#800020" name="Revenue ($/min)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel conversion conversion */}
        <div className="bg-white border border-[#D4A5A5]/30 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-[#800020] mb-4">E-Commerce Checkout Funnel conversion</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1E5E5" />
                <XAxis type="number" stroke="#B8A2A2" fontSize={10} tickLine={false} />
                <YAxis dataKey="step" type="category" stroke="#B8A2A2" fontSize={10} tickLine={false} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#FFF8F8', borderColor: '#D4A5A5', borderRadius: '12px' }} />
                <Bar dataKey="percent" fill="#800020" radius={[0, 4, 4, 0]} name="Funnel Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
