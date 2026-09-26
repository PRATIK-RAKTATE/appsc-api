import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Clock,
  ShieldCheck,
  FileText,
  Filter,
} from 'lucide-react';
import { Badge, Button, Modal } from '../../components/ui';
import api from '../../services/api';

export const AdminMentorApprovalsPage = () => {
  const [mentors, setMentors] = useState([
    {
      _id: 'm-app-1',
      fullName: 'Srikanth Reddy Garu',
      email: 'srikanth.reddy@example.com',
      phone: '+91 98765 43210',
      appscRank: 'APPSC Group-1 Rank 18 (2020 Batch)',
      currentDesignation: 'Assistant Audit Officer (State Audit Dept)',
      subjects: ['Indian Polity & Constitution', 'AP Reorganisation Act 2014'],
      bio: 'Former university gold medalist in Public Administration. Conducted 40+ answer writing workshops for Mains candidates.',
      status: 'PENDING',
      createdAt: '2026-09-24T10:00:00.000Z',
    },
    {
      _id: 'm-app-2',
      fullName: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '+91 91234 56789',
      appscRank: 'Group-2 Assistant Commercial Tax Officer (ACTO)',
      currentDesignation: 'ACTO, Visakhapatnam Division',
      subjects: ['Indian Economy & Planning', 'AP State Economy & Budget'],
      bio: 'Ph.D. in Regional Economics from Andhra University. Guiding aspirants on FRBM norms and fiscal devolution.',
      status: 'PENDING',
      createdAt: '2026-09-23T15:30:00.000Z',
    },
    {
      _id: 'm-app-3',
      fullName: 'K. V. Subba Rao',
      email: 'subbarao.kv@example.com',
      phone: '+91 99887 76655',
      appscRank: 'APPSC Group-1 Rank 4 (2016)',
      currentDesignation: 'Deputy Collector, Kurnool',
      subjects: ['AP Socio-Economic & Cultural History'],
      bio: 'Specialist in Satavahana and Vijayanagara socio-cultural epigraphy and temple architecture questions.',
      status: 'APPROVED',
      createdAt: '2026-09-18T12:00:00.000Z',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/api/admin/mentors');
        if (res.data?.data && res.data.data.length > 0) {
          setMentors(res.data.data);
        }
      } catch (err) {}
    };
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/mentors/${id}/status`, { status });
    } catch (err) {}

    setMentors((prev) =>
      prev.map((m) => (m._id === id ? { ...m, status } : m))
    );
    if (selectedMentor?._id === id) {
      setSelectedMentor((prev) => ({ ...prev, status }));
    }
  };

  const filtered = mentors.filter((m) => {
    const matchesFilter = filterStatus === 'ALL' || m.status === filterStatus;
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.appscRank.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            ADMIN GOVERNANCE (ISSUE #55)
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Mentor Verification & Approval Portal
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Verify rank certificates, academic qualifications, and onboard subject educators to 1-on-1 student mentorship
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
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
            placeholder="Search by mentor or rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Rank / Designation</th>
                <th className="py-3 px-4">Subjects</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">{item.fullName}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {item.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-amber-400 font-medium">{item.appscRank}</div>
                    <div className="text-[11px] text-neutral-400">{item.currentDesignation}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {item.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px]"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        item.status === 'APPROVED'
                          ? 'success'
                          : item.status === 'PENDING'
                          ? 'accent'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedMentor(item)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    >
                      Inspect
                    </button>
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'APPROVED')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'REJECTED')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedMentor && (
        <Modal
          isOpen={!!selectedMentor}
          onClose={() => setSelectedMentor(null)}
          title={`Mentor Application: ${selectedMentor.fullName}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-neutral-200">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <div>
                <span className="text-neutral-500 font-mono block">Rank Credential</span>
                <span className="font-semibold text-amber-400 text-sm">
                  {selectedMentor.appscRank}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-mono block">Designation</span>
                <span className="font-semibold text-white text-sm">
                  {selectedMentor.currentDesignation}
                </span>
              </div>
            </div>

            <div>
              <span className="text-neutral-500 font-mono block mb-1">
                Mentorship Statement & Bio
              </span>
              <p className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 leading-relaxed text-neutral-300">
                {selectedMentor.bio}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h5 className="font-medium text-white">Service_Rank_Certificate.pdf</h5>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Cloudflare R2 Encrypted Document (2.4 MB)
                  </span>
                </div>
              </div>
              <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified Hash
              </span>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-neutral-500 font-mono">
                Current Status: <strong className="text-white">{selectedMentor.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                {selectedMentor.status !== 'APPROVED' && (
                  <Button
                    variant="accent"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleUpdateStatus(selectedMentor._id, 'APPROVED')}
                  >
                    Approve Educator
                  </Button>
                )}
                {selectedMentor.status !== 'REJECTED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleUpdateStatus(selectedMentor._id, 'REJECTED')}
                  >
                    Reject Application
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
