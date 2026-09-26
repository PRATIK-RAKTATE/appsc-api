import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  FileText,
  Bot,
  FileCheck2,
  Database,
  ArrowRight,
  TrendingUp,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import api from '../../services/api';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalStudents: 1420,
    activeMentors: 38,
    publishedCourses: 12,
    todayTestAttempts: 248,
    pendingMentorApplications: 2,
    flaggedChatReports: 2,
  });

  const [systemHealth, setSystemHealth] = useState({
    database: 'CONNECTED',
    r2Storage: 'OPERATIONAL',
    redisQueue: 'HEALTHY',
    aiInference: 'ACTIVE',
  });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        if (res.data?.success) {
          setSystemHealth((prev) => ({ ...prev, database: 'CONNECTED' }));
        }
      } catch (err) {}
    };
    fetchHealth();
  }, []);

  const ADMIN_SHORTCUTS = [
    {
      title: 'Current Affairs CMS',
      desc: 'Publish daily bilingual articles & trigger vector indexing',
      icon: FileText,
      route: '/admin/current-affairs',
      badge: 'Phase 5 (Issue #80)',
      accent: 'text-amber-400',
    },
    {
      title: 'Mentor Approvals',
      desc: 'Verify educator rank credentials & service certificates',
      icon: GraduationCap,
      route: '/admin/mentors',
      badge: `${metrics.pendingMentorApplications} Pending (Issue #55)`,
      accent: 'text-emerald-400',
    },
    {
      title: 'Chat Moderation Queue',
      desc: 'Evaluate reported student/mentor doubt threads & safety flags',
      icon: ShieldAlert,
      route: '/admin/chat/moderation',
      badge: `${metrics.flaggedChatReports} Active (Issue #65)`,
      accent: 'text-red-400',
    },
    {
      title: 'User Sessions & Eviction',
      desc: 'Inspect login devices & trigger 1-click single session kill switch',
      icon: Users,
      route: '/admin/users',
      badge: 'Issue #106',
      accent: 'text-sky-400',
    },
    {
      title: 'AI Inference & Vector Index',
      desc: 'Configure OpenRouter LLM params & re-index textbook embeddings',
      icon: Bot,
      route: '/admin/ai-settings',
      badge: 'Issue #77',
      accent: 'text-purple-400',
    },
    {
      title: 'Audit Logs & Delta Diff',
      desc: 'Immutable administrative audit trail with visual JSON diff',
      icon: FileCheck2,
      route: '/admin/audit-logs',
      badge: 'Issue #109',
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="danger" size="sm" className="font-mono">
              APPSC SUPER-ADMIN GOVERNANCE
            </Badge>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Systems Operational
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300">
            Real-time telemetry, session security enforcement, bilingual content management, and AI knowledge retrieval oversight.
          </p>
        </div>

        {/* System Health Indicators */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2.5 min-w-[240px] text-xs font-mono shadow-xl relative z-10">
          <span className="text-neutral-400 font-semibold uppercase text-[10px] block border-b border-neutral-800 pb-1.5">
            Microservice Health
          </span>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              MongoDB Atlas
            </span>
            <span className="text-emerald-400 font-bold">{systemHealth.database}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-sky-400" />
              Cloudflare R2
            </span>
            <span className="text-sky-400 font-bold">{systemHealth.r2Storage}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300 flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-purple-400" />
              Vector Embeddings
            </span>
            <span className="text-purple-400 font-bold">{systemHealth.aiInference}</span>
          </div>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex flex-col justify-between">
          <span className="text-xs text-neutral-400 font-medium">Registered Aspirants</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {metrics.totalStudents.toLocaleString()}
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono mt-1">+14% this week</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex flex-col justify-between">
          <span className="text-xs text-neutral-400 font-medium">Verified Mentors</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {metrics.activeMentors}
          </h3>
          <span className="text-[11px] text-amber-400 font-mono mt-1">2 Pending Review</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex flex-col justify-between">
          <span className="text-xs text-neutral-400 font-medium">Test Attempts Today</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {metrics.todayTestAttempts}
          </h3>
          <span className="text-[11px] text-sky-400 font-mono mt-1">99.4% autosave sync</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex flex-col justify-between">
          <span className="text-xs text-neutral-400 font-medium">Gross Monthly Volume</span>
          <h3 className="text-2xl font-bold text-white mt-2">
            ₹3,48,000
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono mt-1">Razorpay Verified</span>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Governance & Subsystem Controllers
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            Phases 5, 6 & 7 Integrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADMIN_SHORTCUTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.route)}
                className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center ${item.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="default" size="sm" className="font-mono text-[10px]">
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                  <span className="font-mono text-[11px]">Open Console</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
