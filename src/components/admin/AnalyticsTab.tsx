// src/components/admin/AnalyticsTab.tsx

import React, { useState, useEffect } from "react";
import { Eye, Search, ClipboardList, TrendingUp, Monitor, Globe, RefreshCw } from "lucide-react";

interface AnalyticsData {
  summary: {
    pageViews: number;
    searches: number;
    inquiries: number;
    pdfDownloads: number;
    conversionRate: number;
  };
  deviceStats: Array<{ name: string; value: number }>;
  countryStats: Array<{ name: string; value: number }>;
  topViewedProducts: Array<{ slug: string; views: number }>;
  topInquiryProducts: Array<{ name: string; inquiries: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  dailyViews: Array<{ date: string; count: number }>;
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 flex items-center justify-center">
        <span className="w-7 h-7 border-3 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-10 text-center text-zinc-400 font-mono">
        FAILED TO RETRIEVE PORTAL ANALYTICS ENGINE.
      </div>
    );
  }

  // Find max value in daily views for SVG scaling
  const maxDailyCount = data.dailyViews.length > 0
    ? Math.max(...data.dailyViews.map(v => v.count))
    : 1;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header coordinates */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4">
        <div>
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Real-Time Portal Metrics & Conversion Analytics:
          </span>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white rounded-lg transition-colors text-zinc-500 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-950"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Page views */}
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 bg-white dark:bg-zinc-950 flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Page Views</span>
            <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">{data.summary.pageViews}</span>
          </div>
        </div>

        {/* Search queries */}
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 bg-white dark:bg-zinc-950 flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Search Terms</span>
            <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">{data.summary.searches}</span>
          </div>
        </div>

        {/* RFQ inquiries */}
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 bg-white dark:bg-zinc-950 flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase block">RFQ Inquiries</span>
            <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">{data.summary.inquiries}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 bg-white dark:bg-zinc-950 flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Conversion Rate</span>
            <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">{data.summary.conversionRate}%</span>
          </div>
        </div>

      </div>

      {/* SVG Daily views trend bar chart */}
      <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
        <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-900">
          DAILY VISITORS TREND (LAST 7 DAYS)
        </h3>

        {data.dailyViews.length === 0 ? (
          <p className="text-center text-zinc-400 font-mono text-xs py-10">NO VISIT EVENTS RECORDED RECENTLY.</p>
        ) : (
          <div className="w-full">
            {/* Custom SVG chart */}
            <svg viewBox="0 0 700 200" className="w-full overflow-visible">
              {/* grid lines */}
              <line x1="0" y1="160" x2="700" y2="160" stroke="#E0E0E0" strokeWidth="0.5" className="dark:stroke-zinc-800" />
              <line x1="0" y1="100" x2="700" y2="100" stroke="#E0E0E0" strokeWidth="0.5" strokeDasharray="3" className="dark:stroke-zinc-800" />
              <line x1="0" y1="40" x2="700" y2="40" stroke="#E0E0E0" strokeWidth="0.5" strokeDasharray="3" className="dark:stroke-zinc-800" />

              {/* Bars */}
              {data.dailyViews.map((day, idx) => {
                const barWidth = 45;
                const gap = 55;
                const x = 50 + idx * (barWidth + gap);
                const height = (day.count / maxDailyCount) * 120;
                const y = 160 - height;
                const formattedDate = new Date(day.date).toLocaleDateString(undefined, { day: "numeric", month: "short" });

                return (
                  <g key={day.date} className="group">
                    {/* Hover tooltip background */}
                    <rect x={x - 10} y={y - 25} width={barWidth + 20} height="18" rx="4" fill="#000" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <text x={x + barWidth / 2} y={y - 13} fill="#fff" fontSize="9" textAnchor="middle" className="opacity-0 group-hover:opacity-100 font-mono transition-opacity">
                      {day.count}
                    </text>

                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      fill="url(#barGradient)"
                      rx="3"
                      className="transition-all duration-500 hover:fill-black dark:hover:fill-white"
                    />

                    {/* Label Date */}
                    <text x={x + barWidth / 2} y="180" fill="#999" fontSize="9" textAnchor="middle" className="font-mono">
                      {formattedDate}
                    </text>
                  </g>
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#222" className="dark:stop-color-white" />
                  <stop offset="100%" stopColor="#bbb" className="dark:stop-color-zinc-800" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>

      {/* Grid columns for stats list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Viewed Products */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900">
            Top Viewed Implements
          </h3>
          <div className="flex flex-col gap-3.5">
            {data.topViewedProducts.length === 0 ? (
              <span className="text-zinc-400 font-mono text-[10px] italic">No product views tracked yet.</span>
            ) : (
              data.topViewedProducts.map((p, idx) => (
                <div key={p.slug} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">#0{idx+1}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase truncate max-w-[200px]" title={p.slug}>
                      {p.slug.replace(/-/g, " ")}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500 font-bold">{p.views} Views</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Inquiry Products */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900">
            Top Inquiry RFQ Implements
          </h3>
          <div className="flex flex-col gap-3.5">
            {data.topInquiryProducts.length === 0 ? (
              <span className="text-zinc-400 font-mono text-[10px] italic">No product inquiries tracked yet.</span>
            ) : (
              data.topInquiryProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">#0{idx+1}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500 font-bold">{p.inquiries} RFQs</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Keywords */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm">
          <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900">
            Popular Search Keywords
          </h3>
          <div className="flex flex-col gap-3.5">
            {data.topKeywords.length === 0 ? (
              <span className="text-zinc-400 font-mono text-[10px] italic">No search terms logged yet.</span>
            ) : (
              data.topKeywords.map((k, idx) => (
                <div key={k.keyword} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                      {idx+1}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                      "{k.keyword}"
                    </span>
                  </div>
                  <span className="font-mono text-zinc-500">{k.count} times</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Country & Device breakdown */}
        <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 bg-white dark:bg-zinc-950 shadow-luxury-sm flex flex-col gap-5">
          {/* Countries */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-3.5 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-zinc-400" />
              Geographic Distribution
            </h3>
            <div className="flex flex-col gap-2.5">
              {data.countryStats.length === 0 ? (
                <span className="text-zinc-400 font-mono text-[10px] italic">No visitor geos tracked.</span>
              ) : (
                data.countryStats.slice(0, 3).map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{c.name}</span>
                    <span className="font-mono text-zinc-500 font-bold">{c.value} visits</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Devices */}
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-950 dark:text-white uppercase mb-3.5 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-zinc-400" />
              Device Breakdown
            </h3>
            <div className="flex flex-col gap-2.5">
              {data.deviceStats.length === 0 ? (
                <span className="text-zinc-400 font-mono text-[10px] italic">No device headers logged.</span>
              ) : (
                data.deviceStats.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{d.name}</span>
                    <span className="font-mono text-zinc-500 font-bold">{d.value} visits</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
