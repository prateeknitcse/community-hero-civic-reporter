import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, ShieldAlert, CheckCircle, Clock, Shield, Building2, AlertCircle } from 'lucide-react';
import { StatsOverview, IssueCategory } from '../types';

interface ImpactDashboardProps {
  stats: StatsOverview | null;
  isLoading: boolean;
}

export default function ImpactDashboard({ stats, isLoading }: ImpactDashboardProps) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-6 fade-in animate-pulse">
        {/* Title Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="h-6 bg-slate-850 rounded w-64" />
            <div className="h-3 bg-slate-800 rounded w-96 max-w-full" />
          </div>
          <div className="h-8 bg-slate-850 border border-slate-800 rounded-lg w-48" />
        </div>

        {/* Aggregate KPI Summary Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              <div className="flex items-baseline space-x-2">
                <div className="h-7 bg-slate-855 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-1/4" />
              </div>
              <div className="h-2 bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Main Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ward Comparison Bar Chart Skeleton */}
          <div className="lg:col-span-2 bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="space-y-2">
              <div className="h-4 bg-slate-850 rounded w-48" />
              <div className="h-3 bg-slate-800 rounded w-80 max-w-full" />
            </div>
            
            {/* Mock Skeleton Bar Chart */}
            <div className="h-64 sm:h-72 w-full flex items-end justify-between px-6 pb-2 pt-6 border-b border-l border-slate-800/60 relative">
              <div className="absolute left-4 top-4 h-full w-full flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-t border-slate-600 w-full" />
                <div className="border-t border-slate-600 w-full" />
                <div className="border-t border-slate-600 w-full" />
                <div className="border-t border-slate-600 w-full" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-end space-x-1.5 w-1/6 justify-center">
                  <div className="bg-slate-850 rounded-t-sm w-4" style={{ height: `${20 + i * 15}%` }} />
                  <div className="bg-slate-800 rounded-t-sm w-4" style={{ height: `${10 + i * 12}%` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Category Share Pie Chart Skeleton */}
          <div className="lg:col-span-1 bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-slate-850 rounded w-36" />
              <div className="h-3 bg-slate-800 rounded w-48" />
            </div>

            {/* Mock donut wheel */}
            <div className="h-44 sm:h-48 w-full flex items-center justify-center relative">
              <div className="w-28 h-28 rounded-full border-8 border-slate-800 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-1">
                  <div className="h-3 bg-slate-800 rounded w-8" />
                  <div className="h-2 bg-slate-800 rounded w-10" />
                </div>
              </div>
            </div>

            {/* Color Key Indicators Skeleton */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-850 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 shrink-0" />
                  <div className="h-3 bg-slate-800 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Predictive Trend Engine Skeleton */}
        <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-850 rounded w-64" />
            <div className="h-5 bg-slate-800 rounded w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="h-3 bg-slate-850 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-5/6" />
              </div>
            ))}
          </div>

          <div className="h-2 bg-slate-800 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  // Formatting Category Data for Recharts Pie Chart
  const categoryColors: Record<IssueCategory, string> = {
    pothole: '#f43f5e', // rose
    garbage: '#d97706', // amber
    streetlight: '#eab308', // yellow
    'water leak': '#06b6d4', // cyan
    'illegal dumping': '#d946ef', // fuchsia
    other: '#64748b' // slate
  };

  const categoryData = Object.entries(stats.byCategory)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.toUpperCase(),
      value,
      color: categoryColors[key as IssueCategory] || '#10b981'
    }));

  // Formatting Ward Data for Recharts Bar Chart
  const wardData = Object.entries(stats.byWard).map(([key, info]) => ({
    name: key,
    Reported: info.reported,
    Resolved: info.resolved
  }));

  // Custom Tooltip for dark mode visual sync
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-100">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="font-mono">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Hyperlocal Impact Portal</h1>
          <p className="text-xs text-slate-400 mt-0.5">Aggregate city statistics, contractor performance SLAs, and predictive trend analysis.</p>
        </div>
        <div className="bg-brand-primary/10 text-brand-primary text-xs px-3 py-1.5 rounded-lg border border-brand-primary/20 font-mono font-semibold flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Mumbai Municipal Command
        </div>
      </div>

      {/* Aggregate KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Total Reported</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{stats.totalIssues}</span>
            <span className="text-[10px] text-red-400/80 font-mono">+{stats.pendingVerification} pending</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-500" /> Across all local wards
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Resolved Fixes</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-brand-primary">
              {stats.resolvedIssues}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[9px] text-brand-primary flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-brand-primary" /> Closed with visual audit
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Response SLA</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-brand-accent">{stats.avgResolutionHours}h</span>
            <span className="text-[10px] text-slate-400 font-mono">avg speed</span>
          </div>
          <div className="text-[9px] text-brand-accent flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-accent" /> Under 24h average SLA
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Active Wards</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{Object.keys(stats.byWard).length}</span>
            <span className="text-[10px] text-brand-primary font-mono">5 seed</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1">
            📍 Mumbai Corporation
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-200">Ward Volume Breakdown</h3>
            <p className="text-[11px] text-slate-500">Comparing total reported issues versus successfully resolved fixes per ward.</p>
          </div>
          <div className="h-64 sm:h-72 w-full">
            {wardData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Reported" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Resolved" fill="#0e8e6d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-600">No data available</div>
            )}
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="lg:col-span-1 bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-200">Category Share</h3>
            <p className="text-[11px] text-slate-500">Distribution of reports by civic category.</p>
          </div>
          
          <div className="h-44 sm:h-48 w-full relative flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-600">No category share data</div>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold text-slate-200 font-mono">{stats.totalIssues}</span>
              <span className="text-[8px] text-slate-500 uppercase font-mono">Reports</span>
            </div>
          </div>

          {/* Color Key Indicators */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-slate-850 pt-3">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="truncate">{cat.name}: <span className="font-semibold text-slate-200 font-mono">{cat.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Predictive Trend Engine */}
      <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-primary" />
            AI Spatial Analytics & Trends
          </h3>
          <span className="text-[9px] font-mono text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
            Active Prediction
          </span>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.predictiveInsights.map((insight, index) => (
            <div
              key={index}
              className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors text-xs text-slate-300 leading-relaxed shadow-sm relative overflow-hidden"
            >
              {/* Highlight accent on each card */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-primary" />
              {insight}
            </div>
          ))}
        </div>
        
        <div className="text-[10px] text-slate-500 italic text-center">
          * Predictions are dynamically compiled on the server using real-time spatial density algorithms and historic seasonal averages.
        </div>
      </div>
    </div>
  );
}
