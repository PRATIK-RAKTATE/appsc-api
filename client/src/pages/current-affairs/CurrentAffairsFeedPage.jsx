import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Bookmark,
  BookmarkCheck,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Badge, Button, Input } from '../../components/ui';
import api from '../../services/api';

const MOCK_ARTICLES = [
  {
    _id: 'ca-001',
    title: 'Andhra Pradesh Cabinet Approves Amaravati Capital City Phase-II Infrastructure Master Plan',
    titleTe: 'అమరావతి రాజధాని ఫేజ్-2 మౌలిక వసతుల మాస్టర్ ప్లాన్‌కు ఏపీ కేబినెట్ ఆమోదం',
    category: 'STATE_AP',
    categoryName: 'Andhra Pradesh',
    date: '2026-09-25T08:30:00.000Z',
    readTime: '4 min read',
    summary:
      'The AP State Cabinet has sanctioned an allocation of ₹15,000 crores for the completion of inner ring road trunk infrastructure and water supply pipelines in the capital region under CRDA supervision.',
    tags: ['Amaravati', 'CRDA', 'AP Economy', 'Infrastructure', 'Cabinet Decisions'],
    source: 'The Hindu / Eenadu',
    isBookmarked: false,
    syllabusLinkCount: 2,
  },
  {
    _id: 'ca-002',
    title: 'Finance Ministry Releases 16th Finance Commission Devolution Formula for Southern States',
    titleTe: 'దక్షిణాది రాష్ట్రాల కోసం 16వ ఆర్థిక సంఘం నిధుల కేటాయింపు ఫార్ములా విడుదల',
    category: 'ECONOMY',
    categoryName: 'Indian Economy',
    date: '2026-09-24T14:00:00.000Z',
    readTime: '6 min read',
    summary:
      'The devolution criteria assign 15% weightage to demographic performance, 45% to income distance, and 12.5% to tax effort, triggering constitutional fiscal policy debates across states.',
    tags: ['16th FC', 'Fiscal Federalism', 'Devolution', 'Article 280'],
    source: 'Business Standard',
    isBookmarked: true,
    syllabusLinkCount: 3,
  },
  {
    _id: 'ca-003',
    title: 'Polavaram Irrigation Project: Revised Spillway Hydrological Assessment & Central Grant Update',
    titleTe: 'పోలవరం ప్రాజెక్ట్: సవరించిన స్పిల్‌వే హైడ్రోలాజికల్ అంచనా మరియు కేంద్ర నిధుల వివరాలు',
    category: 'STATE_AP',
    categoryName: 'Andhra Pradesh',
    date: '2026-09-23T10:15:00.000Z',
    readTime: '5 min read',
    summary:
      'Union Jal Shakti Ministry releases tranche of ₹2,800 crore under the national project status provisions of the AP Reorganisation Act 2014 following PPA board approval.',
    tags: ['Polavaram', 'AP Reorganisation Act 2014', 'Godavari River', 'Irrigation'],
    source: 'Press Information Bureau (PIB)',
    isBookmarked: false,
    syllabusLinkCount: 4,
  },
  {
    _id: 'ca-004',
    title: 'Supreme Court 5-Judge Constitution Bench Verdict on Electoral Roll Adjudication & Article 324',
    titleTe: 'ఓటర్ల జాబితా మరియు ఆర్టికల్ 324పై సుప్రీంకోర్టు 5-న్యాయమూర్తుల రాజ్యాంగ ధర్మాసనం తీర్పు',
    category: 'POLITY',
    categoryName: 'Indian Polity',
    date: '2026-09-22T16:45:00.000Z',
    readTime: '7 min read',
    summary:
      'Apex court reaffirms independent supervisory powers of the Election Commission of India while mandating strict statutory judicial review over arbitrary voter disqualifications.',
    tags: ['Constitution', 'Article 324', 'Judicial Review', 'ECI', 'Polity'],
    source: 'LiveLaw',
    isBookmarked: false,
    syllabusLinkCount: 2,
  },
  {
    _id: 'ca-005',
    title: 'ISRO Successfully Launches NVS-02 Navigation Satellite via GSLV-F14 from Sriharikota',
    titleTe: 'శ్రీహరికోట నుంచి జీఎస్‌ఎల్‌వీ-ఎఫ్14 ద్వారా ఎన్‌విఎస్-02 ఉపగ్రహాన్ని విజయవంతంగా ప్రయోగించిన ఇస్రో',
    category: 'SCIENCE_TECH',
    categoryName: 'Science & Technology',
    date: '2026-09-21T11:20:00.000Z',
    readTime: '3 min read',
    summary:
      'Second-generation NavIC satellite with indigenously developed rubidium atomic clock enhances regional positioning precision and civilian L1 band mobile connectivity.',
    tags: ['ISRO', 'NavIC', 'Sriharikota', 'Space Technology', 'AP Geography'],
    source: 'ISRO Press Release',
    isBookmarked: true,
    syllabusLinkCount: 1,
  },
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Topics' },
  { id: 'STATE_AP', label: 'Andhra Pradesh' },
  { id: 'ECONOMY', label: 'Economy & Planning' },
  { id: 'POLITY', label: 'Polity & Governance' },
  { id: 'SCIENCE_TECH', label: 'Science & Tech' },
  { id: 'ENVIRONMENT', label: 'Environment' },
];

export const CurrentAffairsFeedPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [languageToggle, setLanguageToggle] = useState('EN'); // 'EN' | 'TE'

  useEffect(() => {
    // Attempt fetch from backend, fallback to mock if unseeded
    const fetchArticles = async () => {
      try {
        const res = await api.get('/api/current-affairs');
        if (res.data?.data && res.data.data.length > 0) {
          // Merge with mock
          setArticles(res.data.data);
        }
      } catch (err) {
        // use default mock articles
      }
    };
    fetchArticles();
  }, []);

  const handleToggleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/api/current-affairs/bookmarks/${id}`);
    } catch (err) {
      // offline fallback
    }
    setArticles((prev) =>
      prev.map((art) =>
        art._id === id ? { ...art, isBookmarked: !art.isBookmarked } : art
      )
    );
  };

  const filteredArticles = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'ALL' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesBookmark = bookmarksOnly ? art.isBookmarked : true;
    return matchesCategory && matchesSearch && matchesBookmark;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner with Daily Digest Header */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm" className="font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-400 mr-1 inline" />
                DAILY CURRENT AFFAIRS
              </Badge>
              <span className="text-xs font-mono text-neutral-400">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              APPSC Exam Relevant Current Affairs
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Curated daily articles mapped semantically to APPSC Group 1 & Group 2 syllabus topics with direct bilingual textbook chapter cross-references.
            </p>
          </div>

          {/* Daily Quiz Challenge Widget */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 flex flex-col justify-between shadow-xl min-w-[260px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Daily Quick Quiz
                </span>
                <Badge variant="success" size="sm">
                  10 MCQs
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-neutral-200">
                Test today's current affairs retention
              </h3>
            </div>
            <Button
              variant="accent"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/student/tests')}
              className="mt-4 w-full"
            >
              Start Daily Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search, Bookmark & Language Toggles */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search headline or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={() => setBookmarksOnly(!bookmarksOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              bookmarksOnly
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved</span>
          </button>

          {/* Bilingual Quick Toggle */}
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900 p-0.5 text-xs font-mono">
            <button
              onClick={() => setLanguageToggle('EN')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                languageToggle === 'EN'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguageToggle('TE')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                languageToggle === 'TE'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              తె
            </button>
          </div>
        </div>
      </div>

      {/* Articles Feed Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-neutral-800/80 bg-neutral-900/30">
          <p className="text-neutral-400 text-sm">No articles found matching your active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article._id}
              onClick={() => navigate(`/student/current-affairs/${article._id}`)}
              className="group cursor-pointer rounded-2xl border border-neutral-800/90 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-amber-500/40 p-5 transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden"
            >
              <div>
                {/* Card Top Meta */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="accent" size="sm">
                    {article.categoryName || article.category}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>

                    <button
                      onClick={(e) => handleToggleBookmark(article._id, e)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        article.isBookmarked
                          ? 'border-amber-500/40 bg-amber-500/20 text-amber-400'
                          : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {article.isBookmarked ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Article Headline (Bilingual Display) */}
                <h3 className="text-base font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug mb-2">
                  {languageToggle === 'TE' && article.titleTe
                    ? article.titleTe
                    : article.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-4">
                  {article.summary}
                </p>
              </div>

              {/* Card Footer: Tags & Syllabus Link Badge */}
              <div className="space-y-3 pt-3 border-t border-neutral-800/80">
                <div className="flex flex-wrap gap-1.5">
                  {article.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{article.syllabusLinkCount || 2} Syllabus Links</span>
                  </div>

                  <span className="text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all flex items-center">
                    Read Article
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
