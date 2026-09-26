import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Video, FileCheck, Clock, CheckCircle2, Shield, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { useCourseStore } from '../../stores/courseStore';
import { Button, Card, Badge } from '../../components/ui';

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { fetchCourseById, currentCourse, isLoading } = useCourseStore();
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [courseId, fetchCourseById]);

  // Fallback demo course if backend hasn't populated this ID yet
  const course = currentCourse || {
    _id: courseId,
    title: 'APPSC Group 1 Comprehensive Bilingual Prelims & Mains Bundle',
    description: 'Master the complete syllabus with authentic Telugu and English dual-pane study materials, video lectures hosted on high-speed CDN, and automated scoring simulators with negative marking.',
    targetExam: 'APPSC Group 1',
    validityInDays: 365,
    basePrice: 7999,
    discountedPrice: 3999,
    features: [
      'Synchronized Dual-Pane E-Book Reader with scroll lock',
      'High-Definition video lectures streaming via Cloudflare R2',
      'Realistic online test simulator with negative marking (-0.33)',
      'Question-by-question bilingual solution review & weak-topic diagnosis',
      '1-on-1 Real-time educator doubt resolution & voice notes',
      'Official GST Tax Invoice with instant PDF download',
    ],
    curriculum: [
      {
        type: 'BOOK',
        title: 'Andhra Pradesh History & Culture from Satavahanas to Modern Era',
        details: '28 Chapters • Full Bilingual Translation • In-Book Text Search Supported',
      },
      {
        type: 'BOOK',
        title: 'Indian Polity & Constitutional Dynamics with AP State Governance Amendments',
        details: '34 Chapters • Keyword Highlights • Integrated Study Annotations',
      },
      {
        type: 'VIDEO',
        title: 'Complete General Science & Technological Developments Master Series',
        details: '42 Video Lectures • 1080p Stream • Playback Speed (0.75x - 2x)',
      },
      {
        type: 'VIDEO',
        title: 'Economy & Planning in India with specific reference to Andhra Pradesh',
        details: '30 Video Lectures • Budget 2026 Analysis • Socio-Economic Survey',
      },
      {
        type: 'TEST',
        title: 'APPSC Group 1 Prelims Grand Mock Exam 1 (General Studies)',
        details: '150 Questions • 150 Minutes • Bilingual Toggle • Rank Leaderboard',
      },
      {
        type: 'TEST',
        title: 'APPSC Group 1 Prelims Grand Mock Exam 2 (General Studies)',
        details: '150 Questions • 150 Minutes • Bilingual Toggle • Rank Leaderboard',
      },
    ],
  };

  const discountPercent = course.basePrice && course.discountedPrice
    ? Math.round(((course.basePrice - course.discountedPrice) / course.basePrice) * 100)
    : 0;

  return (
    <div className="space-y-8 py-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <Link to="/courses" className="hover:text-amber-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>
        <span>/</span>
        <span className="text-neutral-200 truncate max-w-sm">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Course Information & Curriculum */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" size="md">
                {course.targetExam || 'APPSC Examination'}
              </Badge>
              <Badge variant="neutral" size="md" dot>
                {course.validityInDays} Days Active Entitlement
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Included Features Grid */}
          <Card className="glass-panel border-neutral-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>What is Included in this Package</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(course.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Curriculum Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Curriculum & Syllabus Breakdown</h2>
              <span className="text-xs text-neutral-400 font-mono">
                {course.curriculum?.length || 0} Learning Modules
              </span>
            </div>

            <div className="space-y-3">
              {(course.curriculum || []).map((item, idx) => {
                const isBook = item.type === 'BOOK';
                const isVideo = item.type === 'VIDEO';
                const isTest = item.type === 'TEST';

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl glass-panel border border-neutral-800/80 hover:border-neutral-700 flex items-start justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isBook
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : isVideo
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {isBook && <BookOpen className="w-4 h-4" />}
                        {isVideo && <Video className="w-4 h-4" />}
                        {isTest && <FileCheck className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                            {item.type}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-neutral-100 mt-0.5">
                          {item.title}
                        </h4>
                        {item.details && (
                          <p className="text-xs text-neutral-400 mt-1">{item.details}</p>
                        )}
                      </div>
                    </div>

                    <Badge variant="neutral" size="sm" className="shrink-0">
                      Included
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Enrollment Pricing Card */}
        <div className="sticky top-24">
          <Card className="glass-panel border-neutral-800 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

            <div className="space-y-6">
              <div>
                <span className="text-xs text-neutral-400 font-medium">One-Time Enrollment</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-extrabold text-white">
                    ₹{course.discountedPrice || course.basePrice || 1999}
                  </span>
                  {course.basePrice && course.basePrice > (course.discountedPrice || 0) && (
                    <span className="text-sm text-neutral-500 line-through">
                      ₹{course.basePrice}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <Badge variant="success" size="sm" className="mt-2">
                    {discountPercent}% Limited Time Discount Applied
                  </Badge>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-800/80 text-xs text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Course Validity
                  </span>
                  <span className="font-semibold text-white">{course.validityInDays} Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Access Mode
                  </span>
                  <span className="font-semibold text-white">Bilingual (English & Telugu)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    Post-Expiry Access
                  </span>
                  <span className="font-semibold text-white">Read-Only Score Records</span>
                </div>
              </div>

              <Button
                variant="accent"
                size="lg"
                className="w-full shadow-lg shadow-amber-500/20"
                icon={ArrowRight}
                onClick={() => navigate(`/checkout/${course._id}`)}
              >
                Enroll Now • Instant Activation
              </Button>

              <p className="text-[11px] text-center text-neutral-500">
                Instant access activated upon successful payment via Razorpay. GST invoice generated automatically.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
