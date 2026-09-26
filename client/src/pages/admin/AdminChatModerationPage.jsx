import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  UserX,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Badge, Button, Modal } from '../../components/ui';
import api from '../../services/api';

export const AdminChatModerationPage = () => {
  const [reports, setReports] = useState([
    {
      _id: 'rep-01',
      threadId: 'th-01',
      reporterName: 'Suresh Varma (Student)',
      reportedUserName: 'Anil Kumar (Student)',
      reason: 'ACADEMIC_DISHONESTY',
      description: 'User repeatedly offering to share paid test solutions and Telegram links.',
      status: 'PENDING',
      createdAt: '2026-09-25T11:20:00.000Z',
    },
    {
      _id: 'rep-02',
      threadId: 'th-02',
      reporterName: 'Smt. Lakshmi Prasanna (Mentor)',
      reportedUserName: 'Manoj Krishna (Student)',
      reason: 'HARASSMENT',
      description: 'Persistent spam messages outside scheduled doubt hours with aggressive tone.',
      status: 'PENDING',
      createdAt: '2026-09-24T18:40:00.000Z',
    },
    {
      _id: 'rep-03',
      threadId: 'th-03',
      reporterName: 'Divya Sri (Student)',
      reportedUserName: 'Ramesh Babu (Student)',
      reason: 'SPAM_SCAM',
      description: 'Unsolicited links to external coaching institute registration forms.',
      status: 'RESOLVED',
      createdAt: '2026-09-22T09:15:00.000Z',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/api/admin/chat/reports');
        if (res.data?.data && res.data.data.length > 0) {
          setReports(res.data.data);
        }
      } catch (err) {}
    };
    fetchReports();
  }, []);

  const handleResolveReport = async (reportId, action) => {
    try {
      await api.patch(`/api/admin/chat/reports/${reportId}`, {
        resolutionAction: action,
        status: 'RESOLVED',
      });
    } catch (err) {}

    setReports((prev) =>
      prev.map((r) =>
        r._id === reportId ? { ...r, status: 'RESOLVED' } : r
      )
    );
    setSelectedReport(null);
  };

  const filtered = reports.filter((r) => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      r.reportedUserName.toLowerCase().includes(search.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            TRUST & SAFETY (ISSUE #65)
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Chat Moderation & Safety Queue
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Review reported conversations, evaluate harassment or academic misconduct, and apply account sanctions
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PENDING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Reported Party</th>
                <th className="py-3 px-4">Flagged By</th>
                <th className="py-3 px-4">Violation Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Report Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {item.reportedUserName}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400">
                    {item.reporterName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px]">
                      {item.reason}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={item.status === 'RESOLVED' ? 'success' : 'accent'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(item)}
                      className="text-xs"
                    >
                      Evaluate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title="Moderation Case Evaluation"
          size="md"
        >
          <div className="space-y-4 text-xs text-neutral-300">
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-mono">Reported User</span>
                <span className="font-bold text-white">
                  {selectedReport.reportedUserName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-mono">Flagged Reason</span>
                <span className="text-red-400 font-mono font-medium">
                  {selectedReport.reason}
                </span>
              </div>
            </div>

            <div>
              <span className="text-neutral-400 font-mono block mb-1">
                Reporter Context & Description
              </span>
              <p className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-200 leading-relaxed italic">
                "{selectedReport.description}"
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResolveReport(selectedReport._id, 'DISMISSED')}
              >
                Dismiss Case
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveReport(selectedReport._id, 'WARNING_SENT')}
                className="border-amber-500/40 text-amber-300"
              >
                Issue Formal Warning
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={UserX}
                onClick={() => handleResolveReport(selectedReport._id, 'USER_SUSPENDED')}
              >
                Suspend Account
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
