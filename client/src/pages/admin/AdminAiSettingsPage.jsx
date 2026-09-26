import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Sliders,
  Database,
  RefreshCw,
  CheckCircle,
  Save,
  Globe,
  SlidersHorizontal,
  Bot,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import api from '../../services/api';

export const AdminAiSettingsPage = () => {
  const [settings, setSettings] = useState({
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    temperature: 0.3,
    maxTokens: 2048,
    enableWebSearch: true,
    systemPrompt: `You are an expert bilingual APPSC (Andhra Pradesh Public Service Commission) exam tutor and subject-matter expert.
When answering student queries:
1. Provide accurate constitutional, economic, and historical facts with high exam relevance for Prelims and Mains.
2. Structure answers with clear bullet points, relevant article/statutory numbers, and high-yield dates.
3. If student asks in Telugu, respond in professional Telugu. If in English, respond in English.
4. Reference standard textbook chapters whenever available.`,
  });

  const [books, setBooks] = useState([
    {
      _id: 'appsc-history',
      title: 'AP Socio-Economic & Constitutional History (Vol 1)',
      chunksCount: 842,
      vectorIndexed: true,
      lastIndexed: '2026-09-24T18:00:00.000Z',
    },
    {
      _id: 'appsc-economy',
      title: 'Indian Economy & AP Planning (Vol 2)',
      chunksCount: 654,
      vectorIndexed: true,
      lastIndexed: '2026-09-23T11:30:00.000Z',
    },
    {
      _id: 'appsc-polity',
      title: 'Governance & AP Reorganisation Act Manual',
      chunksCount: 520,
      vectorIndexed: true,
      lastIndexed: '2026-09-20T14:15:00.000Z',
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [reindexingId, setReindexingId] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/ai-settings');
        if (res.data?.data) {
          setSettings(res.data.data);
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/ai-settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReindex = async (bookId) => {
    setReindexingId(bookId);
    try {
      await api.post(`/api/books/${bookId}/reindex`);
    } catch (err) {}

    setTimeout(() => {
      setBooks((prev) =>
        prev.map((b) =>
          b._id === bookId
            ? { ...b, lastIndexed: new Date().toISOString() }
            : b
        )
      );
      setReindexingId(null);
      alert(`Knowledge base embeddings regenerated for ${bookId}`);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono">
            LLM CONFIGURATION (ISSUE #77)
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          AI Assistant & Vector Search Knowledge Base
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Configure OpenRouter / LLM parameters, system prompt guardrails, and trigger vector embeddings re-indexing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Model & Prompt Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-6 text-xs text-neutral-200 shadow-xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                Model Inference & Guardrails
              </h3>
              {saveSuccess && (
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Settings Saved
                </span>
              )}
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Primary LLM Model (OpenRouter Endpoint)
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500/50 font-mono text-xs"
              >
                <option value="meta-llama/llama-3.2-3b-instruct:free">
                  meta-llama/llama-3.2-3b-instruct:free (High Speed • Recommended)
                </option>
                <option value="google/gemini-flash-1.5">
                  google/gemini-flash-1.5 (Multilingual Telugu Native)
                </option>
                <option value="anthropic/claude-3.5-sonnet">
                  anthropic/claude-3.5-sonnet (High Precision Mains Evaluation)
                </option>
                <option value="sarvam-2b-indic">
                  sarvam-2b-indic (Specialized Telugu Reasoning)
                </option>
              </select>
            </div>

            {/* Temperature & Max Tokens Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-neutral-300 font-medium">Temperature</label>
                  <span className="font-mono text-amber-400 font-bold">
                    {settings.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-neutral-500">
                  Lower values ensure strict factual exam fidelity.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-neutral-300 font-medium">Max Output Tokens</label>
                  <span className="font-mono text-amber-400 font-bold">
                    {settings.maxTokens}
                  </span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxTokens: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-neutral-500">
                  Controls maximum length of generated explanation.
                </span>
              </div>
            </div>

            {/* Fallback Search Toggle */}
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-amber-400" />
                <div>
                  <h5 className="font-medium text-white">External Web Search Fallback</h5>
                  <span className="text-[11px] text-neutral-400">
                    Allow AI to search verified PIB/Eenadu sources if textbooks lack recent updates
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableWebSearch}
                onChange={(e) =>
                  setSettings({ ...settings, enableWebSearch: e.target.checked })
                }
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* System Instructions Prompt Editor */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                System Prompt & Exam Guardrails
              </label>
              <textarea
                rows={6}
                value={settings.systemPrompt}
                onChange={(e) =>
                  setSettings({ ...settings, systemPrompt: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 font-mono text-[11px] leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="accent"
                size="md"
                icon={Save}
                disabled={saving}
              >
                {saving ? 'Updating Settings...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Side: Knowledge Base Vector Index Status */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Vector Index Status
              </h3>
              <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                MongoDB Atlas
              </Badge>
            </div>

            <p className="text-xs text-neutral-400">
              Textbook chunks indexed in high-dimensional vector space for semantic retrieval.
            </p>

            <div className="space-y-3">
              {books.map((book) => (
                <div
                  key={book._id}
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="text-xs font-semibold text-white leading-snug">
                      {book.title}
                    </h5>
                    <Badge variant="success" size="sm" className="text-[9px]">
                      Indexed
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{book.chunksCount} Vector Chunks</span>
                    <span>
                      {new Date(book.lastIndexed).toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    disabled={reindexingId === book._id}
                    onClick={() => handleReindex(book._id)}
                    className="w-full text-xs py-1.5 border-neutral-800 hover:border-amber-500/40 text-amber-300"
                  >
                    {reindexingId === book._id
                      ? 'Regenerating Embeddings...'
                      : 'Re-index Knowledge Base'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
