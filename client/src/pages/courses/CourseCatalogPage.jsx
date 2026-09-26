import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Video, FileCheck, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';
import { Button, Input, Card, Badge } from '../../components/ui';

// Mock sample courses if database has none yet, ensuring immediate interactive demo
const DEFAULT_COURSES = [
  {
    _id: 'appsc-group1-prelims-2026',
    title: 'APPSC Group 1 Comprehensive Prelims Bundle',
    description: 'Complete bilingual syllabus coverage for General Studies & Mental Ability with 10 mock test series and full textbook modules.',
    targetExam: 'Group 1',
    validityInDays: 365,
    basePrice: 7999,
    discountedPrice: 3999,
    status: 'PUBLISHED',
    curriculum: [
      { type: 'BOOK', title: 'Andhra Pradesh History & Culture (Bilingual)' },
      { type: 'BOOK', title: 'Indian Economy & AP State Budget Analysis' },
      { type: 'VIDEO', title: 'Polity & Constitutional Framework by Ex-Civil Servants' },
      { type: 'TEST', title: 'Full Length APPSC Mock Test 1 (150 Marks)' },
      { type: 'TEST', title: 'Full Length APPSC Mock Test 2 (150 Marks)' },
    ],
  },
  {
    _id: 'appsc-group2-mains-special',
    title: 'APPSC Group 2 Mains & Screening Masterclass',
    description: 'In-depth focus on AP Reorganisation Act, General Studies, and Bilingual Telugu-English technical reference material.',
    targetExam: 'Group 2',
    validityInDays: 180,
    basePrice: 5999,
    discountedPrice: 2499,
    status: 'PUBLISHED',
    curriculum: [
      { type: 'BOOK', title: 'AP Reorganisation Act 2014 Bare Act & Analysis' },
      { type: 'VIDEO', title: 'Quantitative Aptitude & Logical Reasoning Masterclass' },
      { type: 'TEST', title: 'Sectional Test: Indian Constitution & Governance' },
    ],
  },
  {
    _id: 'appsc-bilingual-ebook-test-pack',
    title: 'APPSC Bilingual E-Book & Online Test Series Pack',
    description: 'Unlimited access to all digitized bilingual textbooks with synchronized dual-pane reading, in-book search, and timed exam simulators.',
    targetExam: 'Group 1 & 2',
    validityInDays: 90,
    basePrice: 2999,
    discountedPrice: 1499,
    status: 'PUBLISHED',
    curriculum: [
      { type: 'BOOK', title: 'General Science & Technology (EN / TE)' },
      { type: 'BOOK', title: 'Geography of India & Andhra Pradesh' },
      { type: 'TEST', title: '50 Sectional Practice Quizzes with Bilingual Explanations' },
    ],
  },
];

export const CourseCatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const { courses, fetchCourses, isLoading } = useCourseStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const displayCourses = courses && courses.length > 0 ? courses : DEFAULT_COURSES;

  const filteredCourses = displayCourses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'ALL' ||
      course.targetExam?.toLowerCase().includes(selectedFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 py-4">
      {/* Hero Header - Sarvam AI Inspired Clean Tech Look */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Andhra Pradesh Public Service Commission • Structured Prep</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Master APPSC Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">Bilingual Excellence</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          High-yield video lectures, synchronized Telugu-English digital textbooks, and timed mock tests built precisely for APPSC Group 1, Group 2, and Group 3 examination standards.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 glass-panel rounded-2xl border-neutral-800/80">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search syllabus, subjects, mock tests..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-950/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'Group 1', 'Group 2', 'Prelims'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === filter
                  ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const discountPercent = course.basePrice && course.discountedPrice
            ? Math.round(((course.basePrice - course.discountedPrice) / course.basePrice) * 100)
            : 0;

          const booksCount = course.curriculum?.filter((c) => c.type === 'BOOK').length || 1;
          const videosCount = course.curriculum?.filter((c) => c.type === 'VIDEO').length || 1;
          const testsCount = course.curriculum?.filter((c) => c.type === 'TEST').length || 2;

          return (
            <Card
              key={course._id}
              hoverEffect
              className="flex flex-col justify-between border-neutral-800/80 hover:border-amber-500/30 group"
            >
              <div className="space-y-4">
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="accent" size="sm">
                    {course.targetExam || 'APPSC Special'}
                  </Badge>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{course.validityInDays || 180} Days Validity</span>
                  </div>
                </div>

                {/* Course Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-3 mt-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Curriculum Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900">
                  <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-center">
                    <BookOpen className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[10px] text-neutral-400">E-Books</span>
                    <span className="text-xs font-bold text-neutral-200">{booksCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-center">
                    <Video className="w-4 h-4 text-sky-400 mb-1" />
                    <span className="text-[10px] text-neutral-400">Videos</span>
                    <span className="text-xs font-bold text-neutral-200">{videosCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-center">
                    <FileCheck className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] text-neutral-400">Tests</span>
                    <span className="text-xs font-bold text-neutral-200">{testsCount}</span>
                  </div>
                </div>
              </div>

              {/* Price & CTA Footer */}
              <div className="pt-6 mt-6 border-t border-neutral-800/60 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      ₹{course.discountedPrice || course.basePrice || 1999}
                    </span>
                    {course.basePrice && course.basePrice > (course.discountedPrice || 0) && (
                      <span className="text-xs text-neutral-500 line-through">
                        ₹{course.basePrice}
                      </span>
                    )}
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Save {discountPercent}% Special Discount
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    Curriculum
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate(`/checkout/${course._id}`)}
                  >
                    Enroll Now
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
