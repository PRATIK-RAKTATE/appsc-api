import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Star,
  Award,
  MessageSquare,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import api from '../../services/api';

const MOCK_MENTORS = [
  {
    _id: 'm-101',
    fullName: 'Dr. Venkat Rao Garu',
    title: 'Ex-Additional Secretary & APPSC Group-1 Ranker (2018)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    subjects: ['Polity & Constitution', 'AP Reorganisation Act', 'Public Admin'],
    rating: 4.9,
    reviewsCount: 142,
    activeStudents: 38,
    hourlyRate: 0, // Free 1-on-1 doubt credit with course
    isAvailable: true,
    bio: '12+ years mentoring civil service aspirants across Andhra Pradesh. Specialist in Article 371-D interpretations and administrative jurisprudence.',
  },
  {
    _id: 'm-102',
    fullName: 'Smt. Lakshmi Prasanna',
    title: 'APPSC Group-2 Deputy Tahsildar (Rank 14, 2021 Batch)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300',
    subjects: ['AP Socio-Economic History', 'Telugu Culture & Literature'],
    rating: 4.8,
    reviewsCount: 98,
    activeStudents: 24,
    hourlyRate: 0,
    isAvailable: true,
    bio: 'Author of high-yield revision charts on Satavahanas, Ikshvakus, and Vijayanagara administrative taxation structures.',
  },
  {
    _id: 'm-103',
    fullName: 'Prof. K. R. Charyulu',
    title: 'Senior Faculty in Macroeconomics & AP State Planning',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    subjects: ['Indian Economy', 'State Budget & FRBM Act', 'Planning Schemes'],
    rating: 4.95,
    reviewsCount: 210,
    activeStudents: 52,
    hourlyRate: 0,
    isAvailable: false,
    bio: 'Specialist in 16th Finance Commission devolution metrics, central tax shares, and AP capital expenditure allocations.',
  },
  {
    _id: 'm-104',
    fullName: 'Sri P. Suresh Kumar',
    title: 'Former District Revenue Officer (DRO) & Prelims Evaluator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    subjects: ['Science & Technology', 'Disaster Management', 'AP Geography'],
    rating: 4.75,
    reviewsCount: 76,
    activeStudents: 19,
    hourlyRate: 0,
    isAvailable: true,
    bio: 'Guiding candidates on high-frequency map questions, Godavari-Krishna river basin water agreements, and regional geo-morphology.',
  },
];

const SUBJECT_FILTERS = [
  'All Subjects',
  'Polity & Constitution',
  'AP Socio-Economic History',
  'Indian Economy',
  'Science & Technology',
];

export const MentorDirectoryPage = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState(MOCK_MENTORS);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await api.get('/api/mentors');
        if (res.data?.data && res.data.data.length > 0) {
          setMentors(res.data.data);
        }
      } catch (err) {}
    };
    fetchMentors();
  }, []);

  const handleStartChat = async (mentor) => {
    try {
      const res = await api.post(`/api/mentors/${mentor._id}/connect`);
      if (res.data?.threadId) {
        navigate(`/chat/${res.data.threadId}`);
        return;
      }
    } catch (err) {}
    // Navigate to chat
    navigate(`/chat?mentor=${mentor._id}`);
  };

  const filteredMentors = mentors.filter((m) => {
    const matchesSubject =
      selectedSubject === 'All Subjects' ||
      m.subjects.some((s) => s.toLowerCase().includes(selectedSubject.toLowerCase()));
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.bio.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm" className="font-mono">
                1-ON-1 FACULTY & RANKERS
              </Badge>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Mentors
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Get Personalized Doubt Guidance
            </h1>
            <p className="text-sm text-neutral-300">
              Connect directly with verified APPSC rankers and subject specialists for private 1-on-1 doubt resolution, answer writing reviews, and study guidance.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={GraduationCap}
            onClick={() => navigate('/mentor/apply')}
            className="border-amber-500/40 text-amber-300 hover:border-amber-400 self-start md:self-auto"
          >
            Apply as Mentor
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {SUBJECT_FILTERS.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === subj
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mentor or rank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Mentors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMentors.map((mentor) => (
          <div
            key={mentor._id}
            className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 flex flex-col justify-between hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all shadow-xl group"
          >
            <div>
              {/* Mentor Header Info */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-lg font-bold text-amber-400">
                    {mentor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  {mentor.isAvailable && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {mentor.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{mentor.rating}</span>
                      <span className="text-neutral-500">({mentor.reviewsCount})</span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{mentor.title}</span>
                  </p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-neutral-300 mt-4 leading-relaxed line-clamp-3">
                {mentor.bio}
              </p>

              {/* Subject Badges */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {mentor.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Meta & Action */}
            <div className="pt-5 mt-5 border-t border-neutral-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-mono">
                  Included in Enrollment
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Free 1-on-1 Sessions
                </span>
              </div>

              <Button
                variant="accent"
                size="sm"
                icon={MessageSquare}
                onClick={() => handleStartChat(mentor)}
              >
                Message Mentor
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
