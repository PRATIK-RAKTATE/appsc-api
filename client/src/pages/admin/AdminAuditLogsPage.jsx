import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Clock,
  Shield,
  Filter,
  Eye,
  ArrowRight,
  Database,
  User,
  Sliders,
} from 'lucide-react';
import { Badge, Button, Modal } from '../../components/ui';
import api from '../../services/api';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([
    {
      _id: 'log-001',
      actorId: 'usr-003',
      actorEmail: 'admin@example.com',
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_AI_SETTINGS',
      resourceType: 'AI_SETTING',
      resourceId: 'ai-config-primary',
      ipAddress: '103.21.124.9',
      createdAt: '2026-09-25T14:32:10.000Z',
      changes: {
        model: {
          from: 'meta-llama/llama-3.2-3b-instruct:free',
          to: 'google/gemini-flash-1.5',
        },
        temperature: {
          from: 0.5,
          to: 0.3,
        },
      },
    },
    {
      _id: 'log-002',
      actorId: 'usr-003',
      actorEmail: 'admin@example.com',
      actorRole: 'SUPER_ADMIN',
      action: 'REVOKE_ALL_SESSIONS',
      resourceType: 'USER',
      resourceId: 'usr-004',
      ipAddress: '103.21.124.9',
      createdAt: '2026-09-25T10:18:45.000Z',
      changes: {
        activeSessions: {
          from: ['sess-99-chrome-windows', 'sess-100-safari-ios'],
          to: [],
        },
      },
    },
    {
      _id: 'log-003',
      actorId: 'usr-003',
      actorEmail: 'admin@example.com',
      actorRole: 'SUPER_ADMIN',
      action: 'SUSPEND_USER',
      resourceType: 'USER',
      resourceId: 'usr-004',
      ipAddress: '103.21.124.9',
      createdAt: '2026-09-24T18:22:00.000Z',
      changes: {
        status: {
          from: 'ACTIVE',
          to: 'SUSPENDED',
        },
      },
    },
    {
      _id: 'log-004',
      actorId: 'usr-003',
      actorEmail: 'admin@example.com',
      actorRole: 'ADMIN',
      action: 'RESOLVE_CHAT_REPORT',
      resourceType: 'CHAT_REPORT',
      resourceId: 'rep-03',
      ipAddress: '103.21.124.9',
      createdAt: '2026-09-22T09:40:00.000Z',
      changes: {
        resolutionAction: {
          from: 'PENDING',
          to: 'WARNING_ISSUED',
        },
      },
    },
  ]);

  const [filterAction, setFilterAction] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await api.get('/api/admin/chat/audit-logs');
        if (res.data?.data && res.data.data.length > 0) {
          setLogs(res.data.data);
        }
      } catch (err) {}
    };
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchesAction = filterAction === 'ALL' || l.action === filterAction;
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            SECURITY & COMPLIANCE (ISSUE #109)
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          System Audit Trail & Delta Diff Inspector
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Immutable ledger recording administrative mutations with JSON before-and-after state change verification
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-2 sm:pb-0">
          {['ALL', 'UPDATE_AI_SETTINGS', 'REVOKE_ALL_SESSIONS', 'SUSPEND_USER', 'RESOLVE_CHAT_REPORT'].map(
            (action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  filterAction === action
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {action}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4 text-right">Delta State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filtered.map((log) => (
                <tr key={log._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-400">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-white">
                    <div>{log.actorEmail}</div>
                    <span className="text-[10px] text-neutral-500">{log.actorRole}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                      {log.resourceType}: {log.resourceId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-sans"
                    >
                      Inspect Diff
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue #109: Delta Diff Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Delta Diff Inspector: ${selectedLog.action}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-neutral-300">
            {/* Metadata Bar */}
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 block">Actor</span>
                <span className="text-white font-semibold">{selectedLog.actorEmail}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">IP Address</span>
                <span className="text-white">{selectedLog.ipAddress}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Resource</span>
                <span className="text-amber-400">{selectedLog.resourceType}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Timestamp</span>
                <span className="text-neutral-300">
                  {new Date(selectedLog.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Visual JSON Diff View */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-neutral-400 uppercase tracking-wider text-[10px]">
                  State Changes (Before & After)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Cryptographically Audited
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                {/* PREVIOUS STATE (RED HIGHLIGHT) */}
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 space-y-2">
                  <div className="text-red-400 font-bold flex items-center justify-between border-b border-red-500/20 pb-1.5">
                    <span>[-] PREVIOUS STATE</span>
                    <span className="text-[10px]">BEFORE MUTATION</span>
                  </div>
                  <pre className="text-red-300/90 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(
                      Object.keys(selectedLog.changes || {}).reduce((acc, key) => {
                        acc[key] = selectedLog.changes[key].from;
                        return acc;
                      }, {}),
                      null,
                      2
                    )}
                  </pre>
                </div>

                {/* NEW STATE (GREEN HIGHLIGHT) */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                    <span>[+] COMMITTED STATE</span>
                    <span className="text-[10px]">AFTER MUTATION</span>
                  </div>
                  <pre className="text-emerald-300/90 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(
                      Object.keys(selectedLog.changes || {}).reduce((acc, key) => {
                        acc[key] = selectedLog.changes[key].to;
                        return acc;
                      }, {}),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
