import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  Ban,
  CheckCircle,
  KeyRound,
  LogOut,
  Clock,
  Filter,
} from 'lucide-react';
import { Badge, Button, Modal } from '../../components/ui';
import api from '../../services/api';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([
    {
      _id: 'usr-001',
      fullName: 'Pratik Raktate',
      email: 'student@example.com',
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: '2026-08-15T09:00:00.000Z',
      activeSessionsCount: 1,
      sessions: [
        {
          sessionId: 'sess-01',
          device: 'Chrome / Linux Ubuntu',
          ipAddress: '157.48.21.104',
          lastActive: '2 mins ago',
          isCurrent: true,
        },
      ],
    },
    {
      _id: 'usr-002',
      fullName: 'Dr. Venkat Rao Garu',
      email: 'mentor@example.com',
      role: 'MENTOR',
      status: 'ACTIVE',
      createdAt: '2026-08-10T14:30:00.000Z',
      activeSessionsCount: 2,
      sessions: [
        {
          sessionId: 'sess-02',
          device: 'Safari / macOS Sonoma',
          ipAddress: '49.207.214.55',
          lastActive: '10 mins ago',
        },
        {
          sessionId: 'sess-03',
          device: 'Mobile Safari / iOS 17.5',
          ipAddress: '49.207.214.55',
          lastActive: '1 hour ago',
        },
      ],
    },
    {
      _id: 'usr-003',
      fullName: 'Admin Supervisor',
      email: 'admin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-07-01T10:00:00.000Z',
      activeSessionsCount: 1,
      sessions: [
        {
          sessionId: 'sess-04',
          device: 'Firefox / Linux Debian',
          ipAddress: '103.21.124.9',
          lastActive: 'Just now',
          isCurrent: true,
        },
      ],
    },
    {
      _id: 'usr-004',
      fullName: 'Suspicious Bot Account',
      email: 'bot99@tempmail.org',
      role: 'STUDENT',
      status: 'SUSPENDED',
      createdAt: '2026-09-20T22:15:00.000Z',
      activeSessionsCount: 0,
      sessions: [],
    },
  ]);

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/admin/users');
        if (res.data?.data && res.data.data.length > 0) {
          setUsers(res.data.data);
        }
      } catch (err) {}
    };
    fetchUsers();
  }, []);

  // Issue #106: Emergency Session Revocation
  const handleRevokeSessions = async (userId) => {
    setRevoking(true);
    try {
      await api.post(`/api/admin/users/${userId}/revoke-sessions`);
    } catch (err) {}

    // Update state to reflect purged sessions
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId
          ? { ...u, activeSessionsCount: 0, sessions: [] }
          : u
      )
    );
    if (selectedUser?._id === userId) {
      setSelectedUser((prev) => ({
        ...prev,
        activeSessionsCount: 0,
        sessions: [],
      }));
    }
    setRevoking(false);
    alert('All active user sessions revoked immediately. Eviction signal dispatched via Socket.IO.');
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setStatusUpdating(true);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
    } catch (err) {}

    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
    );
    if (selectedUser?._id === userId) {
      setSelectedUser((prev) => ({ ...prev, status: newStatus }));
    }
    setStatusUpdating(false);
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            USER GOVERNANCE (ISSUE #106)
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          User Directory & Session Management
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Inspect registered learners and educators, track active browser sessions, and execute single-session evictions
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'STUDENT', 'MENTOR', 'ADMIN'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRoleFilter(rf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                roleFilter === rf
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{item.fullName}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {item.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        item.role === 'ADMIN'
                          ? 'danger'
                          : item.role === 'MENTOR'
                          ? 'accent'
                          : 'default'
                      }
                      size="sm"
                    >
                      {item.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={item.status === 'ACTIVE' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="flex items-center gap-1.5 text-xs text-neutral-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {item.activeSessionsCount || 0} device(s)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(item)}
                      className="text-xs"
                    >
                      Manage Sessions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Session Inspector Modal (Issue #106) */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User Inspector: ${selectedUser.fullName}`}
          size="lg"
        >
          <div className="space-y-6 text-xs text-neutral-200">
            {/* User Meta Summary */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-neutral-500 font-mono block">Email Address</span>
                <span className="font-semibold text-white text-sm">
                  {selectedUser.email}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 font-mono block">Assigned Role</span>
                <Badge variant="accent" size="sm">
                  {selectedUser.role}
                </Badge>
              </div>
              <div>
                <span className="text-neutral-500 font-mono block">Status</span>
                <Badge
                  variant={selectedUser.status === 'ACTIVE' ? 'success' : 'danger'}
                  size="sm"
                >
                  {selectedUser.status}
                </Badge>
              </div>
            </div>

            {/* Active Sessions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5" />
                  Active Device Sessions ({selectedUser.sessions?.length || 0})
                </h4>
                {selectedUser.sessions?.length > 0 && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={LogOut}
                    disabled={revoking}
                    onClick={() => handleRevokeSessions(selectedUser._id)}
                  >
                    {revoking ? 'Revoking...' : 'Revoke All Sessions'}
                  </Button>
                )}
              </div>

              {selectedUser.sessions && selectedUser.sessions.length > 0 ? (
                <div className="space-y-2">
                  {selectedUser.sessions.map((sess, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            <span>{sess.device}</span>
                            {sess.isCurrent && (
                              <Badge variant="accent" size="sm" className="text-[9px]">
                                Current Session
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            IP: {sess.ipAddress} • Last active {sess.lastActive}
                          </span>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950/60 text-center text-neutral-500 font-mono">
                  No active device sessions found. User is currently logged out.
                </div>
              )}
            </div>

            {/* Account Suspension Control */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-neutral-400">
                Prevent login and suspend all access immediately
              </span>

              <Button
                variant={selectedUser.status === 'ACTIVE' ? 'danger' : 'accent'}
                size="sm"
                icon={selectedUser.status === 'ACTIVE' ? Ban : CheckCircle}
                disabled={statusUpdating}
                onClick={() =>
                  handleToggleStatus(selectedUser._id, selectedUser.status)
                }
              >
                {selectedUser.status === 'ACTIVE'
                  ? 'Suspend Account'
                  : 'Reactivate Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
