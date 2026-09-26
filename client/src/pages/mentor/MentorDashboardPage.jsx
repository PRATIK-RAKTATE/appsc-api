import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import api from '../../services/api';

const MOCK_THREADS = [
  {
    threadId: 'th-01',
    studentName: 'Ravi Teja',
    subject: 'Indian Polity & Constitution',
    lastMessage: 'Sir, how should I structure the answer for Article 371-D special provisions?',
    updatedAt: '10 mins ago',
    unreadCount: 2,
    status: 'PENDING',
  },
  {
    threadId: 'th-02',
    studentName: 'Divya Sri',
    subject: 'AP Socio-Economic History',
    lastMessage: 'Attached my handwritten answer on Satavahana coinage and trade guilds.',
    updatedAt: '35 mins ago',
    unreadCount: 1,
    status: 'PENDING',
  },
  {
    threadId: 'th-03',
    studentName: 'Kalyan Chakravarthy',
    subject: 'AP Reorganisation Act',
    lastMessage: 'Thank you for the clarification on the Schedule 9 & 10 asset division!',
    updatedAt: '2 hours ago',
    unreadCount: 0,
    status: 'RESOLVED',
  },
];

export const MentorDashboardPage = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState(MOCK_THREADS);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await api.get('/api/chat/threads');
        if (res.data?.data && res.data.data.length > 0) {
          setThreads(res.data.data);
        }
      } catch (err) {}
    };
    fetchThreads();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" className="font-mono">
              MENTOR ADVISORY PORTAL
            </Badge>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Faculty Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Doubt Resolution & Student Guidance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Review student doubt submissions, evaluate handwritten Mains answers, and provide voice note feedback.
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          icon={MessageSquare}
          onClick={() => navigate('/chat')}
        >
          Open Chat Inbox
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Pending Doubts</span>
            <h4 className="text-2xl font-bold text-white mt-1">
              {threads.filter((t) => t.status === 'PENDING').length}
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Resolved This Month</span>
            <h4 className="text-2xl font-bold text-white mt-1">86</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Student Rating</span>
            <h4 className="text-2xl font-bold text-white mt-1">4.92 / 5.0</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-medium">Avg Response Time</span>
            <h4 className="text-2xl font-bold text-white mt-1">18 mins</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Doubt Threads Queue */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Student Doubt Queries</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {threads.length} Total Conversations
          </span>
        </div>

        <div className="divide-y divide-neutral-800/60">
          {threads.map((item) => (
            <div
              key={item.threadId}
              onClick={() => navigate(`/chat/${item.threadId}`)}
              className="p-4 sm:p-5 hover:bg-neutral-900/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {item.studentName}
                  </h4>
                  <Badge variant="default" size="sm" className="text-[10px]">
                    {item.subject}
                  </Badge>
                  {item.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950">
                      {item.unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-1 max-w-2xl">
                  {item.lastMessage}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-xs text-neutral-500 font-mono">
                  {item.updatedAt}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowRight}
                  className="text-xs border-neutral-800 group-hover:border-amber-500/40 text-neutral-300 group-hover:text-amber-300"
                >
                  Reply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
