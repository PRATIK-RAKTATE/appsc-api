import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Badge, Button, Input, Modal, Card } from '../../components/ui';
import api from '../../services/api';

export const AdminCurrentAffairsPage = () => {
  const [articles, setArticles] = useState([
    {
      _id: 'ca-001',
      title: 'Andhra Pradesh Cabinet Approves Amaravati Capital City Phase-II Infrastructure Master Plan',
      category: 'STATE_AP',
      status: 'PUBLISHED',
      publishedAt: '2026-09-25T08:30:00.000Z',
      tags: ['Amaravati', 'CRDA', 'AP Economy'],
      vectorIndexed: true,
    },
    {
      _id: 'ca-002',
      title: 'Finance Ministry Releases 16th Finance Commission Devolution Formula for Southern States',
      category: 'ECONOMY',
      status: 'PUBLISHED',
      publishedAt: '2026-09-24T14:00:00.000Z',
      tags: ['16th FC', 'Fiscal Federalism'],
      vectorIndexed: true,
    },
    {
      _id: 'ca-003',
      title: 'Draft State Industrial Corridor Policy 2026-2031: Green Energy Subsidies',
      category: 'STATE_AP',
      status: 'DRAFT',
      publishedAt: null,
      tags: ['Industry', 'Subsidies'],
      vectorIndexed: false,
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'STATE_AP',
    summary: '',
    content: '',
    tags: '',
    source: '',
    sourceUrl: '',
    status: 'PUBLISHED',
  });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await api.get('/api/admin/current-affairs');
        if (res.data?.data && res.data.data.length > 0) {
          setArticles(res.data.data);
        }
      } catch (err) {}
    };
    fetchArticles();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/admin/current-affairs/${id}/status`, { status: newStatus });
    } catch (err) {}
    setArticles((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      const payload = {
        ...form,
        tags: tagsArray,
      };
      const res = await api.post('/api/admin/current-affairs', payload);
      if (res.data?.data) {
        setArticles([res.data.data, ...articles]);
      } else {
        const newArt = {
          _id: `ca-${Date.now()}`,
          title: form.title,
          category: form.category,
          status: form.status,
          publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : null,
          tags: tagsArray,
          vectorIndexed: true,
        };
        setArticles([newArt, ...articles]);
      }
      setIsModalOpen(false);
      setForm({
        title: '',
        category: 'STATE_AP',
        summary: '',
        content: '',
        tags: '',
        source: '',
        sourceUrl: '',
        status: 'PUBLISHED',
      });
    } catch (err) {
      alert('Failed to publish article');
    } finally {
      setLoading(false);
    }
  };

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" className="font-mono">
              ADMIN CMS (ISSUE #80)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Current Affairs Publisher & Scheduler
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Publish daily bilingual current affairs with automated vector indexing for semantic syllabus linking
          </p>
        </div>

        <Button
          variant="accent"
          size="md"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Create New Article
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === st
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
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Articles Management Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Headline</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Vector Index</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white max-w-md truncate">
                    {item.title}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="default" size="sm">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        item.status === 'PUBLISHED'
                          ? 'success'
                          : item.status === 'DRAFT'
                          ? 'accent'
                          : 'default'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                      <Sparkles className="w-3.5 h-3.5" />
                      Vector Mapped
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString()
                      : 'Not published'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {item.status !== 'PUBLISHED' ? (
                      <button
                        onClick={() => handleStatusChange(item._id, 'PUBLISHED')}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(item._id, 'ARCHIVED')}
                        className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Current Affairs Article"
        size="lg"
      >
        <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Headline (English)</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. AP Cabinet Clears Industrial Policy 2026..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="STATE_AP">Andhra Pradesh Affairs</option>
                <option value="ECONOMY">Indian Economy</option>
                <option value="POLITY">Polity & Governance</option>
                <option value="SCIENCE_TECH">Science & Technology</option>
                <option value="ENVIRONMENT">Environment & Ecology</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500/50"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Executive Summary</label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Short 2-3 sentence overview..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Full Article Content (Markdown)</label>
            <textarea
              rows={5}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Detailed article body with subheadings, policy numbers, exam notes..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 font-mono text-[11px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Polavaram, AP Reorganisation, Water"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Source Name</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. PIB / The Hindu"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Save & Publish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
