import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Compass,
  FileCheck,
  GraduationCap,
  MessageSquare,
  Shield,
  Layers,
  ChevronRight,
  Bookmark,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import api from '../../services/api';

const LATEST_CURRENT_AFFAIRS = [
  {
    _id: 'ca-001',
    title: 'Andhra Pradesh Cabinet Approves Amaravati Capital City Phase-II Infrastructure Master Plan',
    titleTe: 'అమరావతి రాజధాని ఫేజ్-2 మౌలిక వసతుల మాస్టర్ ప్లాన్‌కు ఏపీ కేబినెట్ ఆమోదం',
    category: 'Andhra Pradesh',
    date: 'Today, 8:30 AM',
    readTime: '4 min read',
    tags: ['Amaravati', 'CRDA', 'AP Economy', 'Infrastructure'],
    syllabusLinks: '2 Syllabus Chapters Mapped',
    summary:
      'State Cabinet sanctions ₹15,000 crores for inner ring road trunk infrastructure and water supply under APCRDA supervision with World Bank & ADB co-financing.',
  },
  {
    _id: 'ca-002',
    title: 'Finance Ministry Releases 16th Finance Commission Devolution Formula for Southern States',
    titleTe: 'దక్షిణాది రాష్ట్రాల కోసం 16వ ఆర్థిక సంఘం నిధుల కేటాయింపు ఫార్ములా విడుదల',
    category: 'Indian Economy',
    date: 'Yesterday',
    readTime: '6 min read',
    tags: ['16th FC', 'Fiscal Federalism', 'Article 280'],
    syllabusLinks: '3 Syllabus Chapters Mapped',
    summary:
      'Devolution criteria weightage triggers key fiscal federalism debates across states with demographic performance and tax effort adjustments.',
  },
  {
    _id: 'ca-003',
    title: 'Polavaram Irrigation Project: Revised Spillway Hydrological Assessment & Central Grant Update',
    titleTe: 'పోలవరం ప్రాజెక్ట్: సవరించిన స్పిల్‌వే హైడ్రోలాజికల్ అంచనా మరియు కేంద్ర నిధుల వివరాలు',
    category: 'Andhra Pradesh',
    date: '23 Sep 2026',
    readTime: '5 min read',
    tags: ['Polavaram', 'AP Reorganisation Act', 'Godavari'],
    syllabusLinks: '4 Syllabus Chapters Mapped',
    summary:
      'Tranche of ₹2,800 crore released under national project status provisions of the AP Reorganisation Act 2014 following PPA approval.',
  },
];

const FEATURED_COURSES = [
  {
    id: 'appsc-group-1-prelims-mains',
    title: 'APPSC Group 1 (Prelims + Mains) Complete Master Prep',
    titleTe: 'గ్రూప్ 1 ప్రిలిమ్స్ + మెయిన్స్ సమగ్ర శిక్షణ',
    badge: 'Flagship 2026',
    price: '₹14,999',
    originalPrice: '₹24,999',
    validity: '365 Days Validity',
    booksCount: 8,
    testsCount: 45,
    videosCount: 120,
    tags: ['Bilingual', 'Full Syllabus', '1-on-1 Mentorship'],
  },
  {
    id: 'appsc-group-2-executive',
    title: 'APPSC Group 2 Executive & Non-Executive Officers Batch',
    titleTe: 'గ్రూప్ 2 ఎగ్జిక్యూటివ్ మరియు నాన్-ఎగ్జిక్యూటివ్ బ్యాచ్',
    badge: 'Most Popular',
    price: '₹7,999',
    originalPrice: '₹12,999',
    validity: '180 Days Validity',
    booksCount: 5,
    testsCount: 30,
    videosCount: 80,
    tags: ['Bilingual', 'Prelims & Mains', 'Weekly Mocks'],
  },
  {
    id: 'ap-history-economy-special',
    title: 'AP Socio-Economic History & State Planning Special Module',
    titleTe: 'ఆంధ్రప్రదేశ్ సామాజిక ఆర్థిక చరిత్ర & ప్రణాళికలు',
    badge: 'High Yield',
    price: '₹3,499',
    originalPrice: '₹5,999',
    validity: '90 Days Validity',
    booksCount: 2,
    testsCount: 15,
    videosCount: 35,
    tags: ['Topic Specialist', 'Bilingual Reader', 'PYQ Analysis'],
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('CURRENT_AFFAIRS'); // 'CURRENT_AFFAIRS' | 'COURSES' | 'READER'
  const [langToggle, setLangToggle] = useState('EN'); // 'EN' | 'TE'
  const [currentAffairs, setCurrentAffairs] = useState(LATEST_CURRENT_AFFAIRS);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const res = await api.get('/api/current-affairs');
        if (res.data?.data && res.data.data.length > 0) {
          setCurrentAffairs(res.data.data.slice(0, 3));
        }
      } catch (err) {}
    };
    fetchLatestNews();
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-300 pb-20">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-[#090a0f] p-6 sm:p-12 lg:p-16 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>Next-Gen Bilingual APPSC Examination Platform</span>
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="text-white font-medium">Group 1 & Group 2</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Master the APPSC Syllabus with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Bilingual Precision
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Synchronized English-Telugu e-books, daily current affairs semantically linked to textbook chapters, negative-marking mock tests, and 1-on-1 verified ranker mentorship.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Button
              variant="accent"
              size="lg"
              icon={ArrowRight}
              onClick={() => navigate('/current-affairs')}
              className="shadow-xl shadow-amber-500/20 text-sm px-6"
            >
              Read Today's Current Affairs
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={BookOpen}
              onClick={() => navigate('/student/books/appsc-history')}
              className="text-sm px-6 border-neutral-700 hover:border-amber-500/50 text-neutral-200 hover:text-white"
            >
              Launch Bilingual Reader
            </Button>
            <Button
              variant="ghost"
              size="lg"
              icon={Compass}
              onClick={() => navigate('/courses')}
              className="text-sm px-5 text-neutral-400 hover:text-white"
            >
              Explore All Courses
            </Button>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="pt-8 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                100%
              </span>
              <span className="block text-[11px] text-neutral-400 font-medium mt-0.5">
                Bilingual (EN & TE)
              </span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                Daily 8 AM
              </span>
              <span className="block text-[11px] text-neutral-400 font-medium mt-0.5">
                Current Affairs & Quiz
              </span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                50+
              </span>
              <span className="block text-[11px] text-neutral-400 font-medium mt-0.5">
                Ranker Mentors
              </span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                AI Vector
              </span>
              <span className="block text-[11px] text-neutral-400 font-medium mt-0.5">
                Syllabus Deep Linking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Tabs: CURRENT AFFAIRS (Default) | COURSES | BILINGUAL READER */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm" className="font-mono">
                LIVE KNOWLEDGE FEED
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Exam-Ready Learning Modules
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('CURRENT_AFFAIRS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'CURRENT_AFFAIRS'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Daily Current Affairs
            </button>

            <button
              onClick={() => setActiveTab('COURSES')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'COURSES'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Courses & Bundles
            </button>

            <button
              onClick={() => setActiveTab('READER')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'READER'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Bilingual Reader Demo
            </button>
          </div>
        </div>

        {/* Tab 1: Current Affairs (Default) */}
        {activeTab === 'CURRENT_AFFAIRS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Updated with high-yield syllabus cross-references (Issue #82)
              </span>

              <Link
                to="/current-affairs"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group"
              >
                <span>View All Articles & Daily Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentAffairs.map((article) => (
                <div
                  key={article._id}
                  onClick={() => navigate(`/current-affairs/${article._id}`)}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 flex flex-col justify-between hover:border-amber-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="accent" size="sm">
                        {article.category || 'Andhra Pradesh'}
                      </Badge>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {article.date || 'Today'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-800/80 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{article.syllabusLinks || 'Syllabus Mapped'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                      <span className="font-mono text-[11px]">{article.readTime}</span>
                      <span className="flex items-center font-medium">
                        Read Analysis <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Courses & Bundles */}
        {activeTab === 'COURSES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                Curated packages featuring bilingual e-books, videos, and full-length test series
              </span>
              <Link
                to="/courses"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                Browse Full Catalog <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 flex flex-col justify-between hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="accent" size="sm">
                        {course.badge}
                      </Badge>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {course.validity}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {course.titleTe}
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-800/80 text-center font-mono text-xs">
                      <div>
                        <span className="text-white font-bold block">{course.booksCount}</span>
                        <span className="text-[10px] text-neutral-500">Books</span>
                      </div>
                      <div>
                        <span className="text-white font-bold block">{course.testsCount}</span>
                        <span className="text-[10px] text-neutral-500">Mocks</span>
                      </div>
                      <div>
                        <span className="text-white font-bold block">{course.videosCount}</span>
                        <span className="text-[10px] text-neutral-500">Lectures</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-white font-mono">
                        {course.price}
                      </span>
                      <span className="text-xs text-neutral-500 line-through ml-2 font-mono">
                        {course.originalPrice}
                      </span>
                    </div>

                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Bilingual Reader Demo */}
        {activeTab === 'READER' && (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Synchronized Dual-Pane Reader Engine
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Side-by-side English & Telugu paragraphs with synchronized scroll-lock and text annotations
                </p>
              </div>

              <Button
                variant="accent"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/student/books/appsc-history')}
              >
                Open Fullscreen Reader
              </Button>
            </div>

            {/* Split Screen Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
              <div className="space-y-3 pr-0 md:pr-4 md:border-r border-neutral-800">
                <Badge variant="default" size="sm" className="font-mono text-[10px]">
                  ENGLISH ORIGINAL
                </Badge>
                <h4 className="text-sm font-semibold text-white">
                  Chapter 4: The 1956 States Reorganisation Act & Andhra State
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Following the martyrdom of Potti Sreeramulu on 15 December 1952, the linguistic Andhra State was formed on 1 October 1953 with Kurnool as capital. Later, under the States Reorganisation Act of 1956, Telangana was merged with Andhra State following the Gentlemen's Agreement to form Andhra Pradesh.
                </p>
              </div>

              <div className="space-y-3 pl-0 md:pl-2">
                <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                  తెలుగు అనువాదం
                </Badge>
                <h4 className="text-sm font-semibold text-white">
                  అధ్యాయం 4: 1956 రాష్ట్రాల పునర్వ్యవస్థీకరణ చట్టం & ఆంధ్ర రాష్ట్రం
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  1952 డిసెంబర్ 15న అమరజీవి పొట్టి శ్రీరాములు బలిదానం అనంతరం, 1953 అక్టోబర్ 1న కర్నూలు రాజధానిగా తొలి భాషా ప్రయుక్త ఆంధ్ర రాష్ట్రం ఏర్పాటయింది. తదనంతరం 1956 పెద్దమనుషుల ఒప్పందం ఆధారంగా తెలంగాణ ప్రాంతంతో కలిపి సమైక్య ఆంధ్రప్రదేశ్ అవతరించింది.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Feature Pillars: MENTORS, MOCK TESTS, AI ASSISTANT */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/mentors')}
          className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            1-on-1 Ranker Mentors
          </h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Private doubt resolution and Mains answer evaluation with verified APPSC Deputy Collectors and Tahsildars.
          </p>
          <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span>Browse Mentors</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/tests')}
          className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            Exam Simulation & Mocks
          </h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            Full-length Prelims mocks with -0.33 negative marking, periodic autosave, bilingual toggle, and state rank percentiles.
          </p>
          <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-sky-400 font-mono">
            <span>Attempt Tests</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/analytics')}
          className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all cursor-pointer group shadow-xl"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            Weak Topic Diagnosis
          </h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            AI analytics engine diagnoses low-scoring syllabus domains and generates 1-click jump links directly to textbook chapters.
          </p>
          <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-purple-400 font-mono">
            <span>View Analytics</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-amber-950/30 to-neutral-900 p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <Badge variant="accent" size="sm" className="font-mono">
            START PREPARING TODAY
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Join Thousands of Serious APPSC Aspirants
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300">
            Sign in with email OTP to unlock enrolled courses, save highlights in bilingual e-books, and attend 1-on-1 mentor doubt sessions.
          </p>
          <div className="pt-3 flex justify-center gap-3">
            <Button
              variant="accent"
              size="md"
              onClick={() => navigate('/login')}
            >
              Sign In with OTP
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/courses')}
            >
              View Course Catalog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
