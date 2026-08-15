// src/components/admin/SystemHealthTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, HardDrive, Zap, Mail, CheckCircle2, Clock, 
  ShieldCheck, Activity, RefreshCw, Users, Package, FolderTree, 
  Image as ImageIcon, Inbox, AlertTriangle, Server, Cpu, Layers
} from "lucide-react";

interface HealthData {
  databaseStatus: string;
  databaseLatencyMs: string;
  storageStatus: string;
  apiStatus: string;
  emailStatus: string;
  buildVersion: string;
  environment: string;
  lastBackup: string;
  lastDeployment: string;
  totalProducts: number;
  totalCategories: number;
  totalMedia: number;
  totalInquiries: number;
  activeUsers: number;
  diskUsage: string;
  failedJobs: number;
  recentActivity: Array<{
    id: string;
    action: string;
    username: string;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

export default function SystemHealthTab() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/system-health", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.health) {
          setHealth(json.health);
          setError(null);
        }
      } else {
        setError("Failed to load system diagnostics.");
      }
    } catch (e) {
      console.error("System health fetch error:", e);
      setError("Network error connecting to system diagnostics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-[#C2DFE3] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-8 h-8 text-[#0a5c67] animate-spin" />
        <span className="font-mono text-xs font-bold text-[#0a5c67] uppercase tracking-wider">
          DIAGNOSING SYSTEM HEALTH & INFRASTRUCTURE...
        </span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex flex-col items-center gap-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <p className="font-semibold">{error || "Health check unavailable"}</p>
        <button 
          onClick={fetchHealth}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
        >
          Retry Health Diagnostics
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#253237] via-[#1a2529] to-[#0a5c67] text-white rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
            <Activity className="w-8 h-8 text-[#9DB4C0]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans uppercase tracking-tight">SYSTEM HEALTH DASHBOARD</h2>
            <p className="text-xs text-[#9DB4C0] font-mono mt-1">Real-time status of PostgreSQL, Supabase Storage, APIs, Email & System Services</p>
          </div>
        </div>

        <button 
          onClick={fetchHealth} 
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0a5c67] hover:bg-[#084852] text-white rounded-xl text-xs font-bold font-mono tracking-wider transition shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "REFRESHING..." : "LIVE DIAGNOSIS"}
        </button>
      </div>

      {/* 4 Infrastructure Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Database Connection */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#C2DFE3] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#5C6B73] uppercase">CENTRAL DATA STORE</span>
            <Database className="w-5 h-5 text-[#0a5c67]" />
          </div>
          <div className="my-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health.databaseStatus}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#5C6B73]">Speed: <strong className="text-[#253237]">{health.databaseLatencyMs}</strong></span>
        </div>

        {/* Supabase Storage Status */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#C2DFE3] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#5C6B73] uppercase">MEDIA ASSET VAULT</span>
            <HardDrive className="w-5 h-5 text-[#0a5c67]" />
          </div>
          <div className="my-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health.storageStatus}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#5C6B73]">Media Vault: <strong className="text-[#253237]">orivence-media</strong></span>
        </div>

        {/* API Gateway Status */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#C2DFE3] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#5C6B73] uppercase">LIVE WEBSITE SYNC</span>
            <Zap className="w-5 h-5 text-[#0a5c67]" />
          </div>
          <div className="my-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health.apiStatus}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#5C6B73]">Sync Status: <strong className="text-[#253237]">100% Operational</strong></span>
        </div>

        {/* Email / SMTP Status */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#C2DFE3] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#5C6B73] uppercase">B2B INQUIRY SERVICE</span>
            <Mail className="w-5 h-5 text-[#0a5c67]" />
          </div>
          <div className="my-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health.emailStatus}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#5C6B73]">Notifications: <strong className="text-[#253237]">Instant Alert Active</strong></span>
        </div>

      </div>

      {/* 8 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <Package className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-lg text-[#253237]">{health.totalProducts}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Products</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <FolderTree className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-lg text-[#253237]">{health.totalCategories}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <ImageIcon className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-lg text-[#253237]">{health.totalMedia}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Media Assets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <Inbox className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-lg text-[#253237]">{health.totalInquiries}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Inquiries</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <Users className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-lg text-[#253237]">{health.activeUsers}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Active Users</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <HardDrive className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-base text-[#253237]">{health.diskUsage}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Disk Usage</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
          <span className="block font-extrabold text-lg text-emerald-700">{health.failedJobs}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Failed Jobs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C2DFE3] shadow-sm text-center">
          <Cpu className="w-5 h-5 mx-auto text-[#0a5c67] mb-1" />
          <span className="block font-extrabold text-xs text-[#253237] mt-1">{health.buildVersion}</span>
          <span className="font-mono text-[10px] text-[#5C6B73] uppercase">Build</span>
        </div>

      </div>

      {/* System Details & Environment Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl border border-[#C2DFE3] p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm font-mono uppercase tracking-wider text-[#253237] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0a5c67]" />
            ENVIRONMENT & DEPLOYMENT METADATA
          </h3>

          <div className="divide-y divide-gray-100 font-mono text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-[#5C6B73]">Environment:</span>
              <span className="font-bold text-[#253237] uppercase">{health.environment}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#5C6B73]">Build Version:</span>
              <span className="font-bold text-[#0a5c67]">{health.buildVersion}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#5C6B73]">Last Backup:</span>
              <span className="font-bold text-[#253237]">{health.lastBackup}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#5C6B73]">Last Deployment:</span>
              <span className="font-bold text-[#253237]">{health.lastDeployment}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Log Preview */}
        <div className="bg-white rounded-2xl border border-[#C2DFE3] p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-sm font-mono uppercase tracking-wider text-[#253237] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0a5c67]" />
            RECENT SYSTEM ACTIVITY LOG
          </h3>

          <div className="flex flex-col gap-3 font-mono text-xs">
            {health.recentActivity.length === 0 ? (
              <span className="text-gray-400 py-4 text-center">No recent audit log activity.</span>
            ) : (
              health.recentActivity.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[#253237]">{log.action}</span>
                    <span className="text-[10px] text-[#5C6B73]">User: {log.username} {log.ipAddress ? `(${log.ipAddress})` : ""}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
