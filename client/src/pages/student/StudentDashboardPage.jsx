import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Video, FileCheck, Clock, AlertTriangle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import { Button, Card, Badge } from '../../components/ui';

export const StudentDashboardPage = () => {
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Demo active enrolled courses representing entitlements with varying validity countdowns
  const enrolledCourses = [
    {
      _id: 'appsc-group1-prelims-2026',
      title: 'APPSC Group 1 Comprehensive Prelims Bundle',
      startsAt: '2026-01-15T00:00:00.000Z',
      expiresAt: '2026-10-15T00:00:00.000Z',
      daysRemaining: 19, // > 14 days (Green)
      lastReadChapter: 'Chapter 4: Satavahana Dynasty & Cultural Legacy',
      lastWatchedVideo: 'Polity: Preamble and Fundamental Rights',
      progressPercent: 48,
    },
    {
      _id: 'appsc-group2-mains-special',
      title: 'APPSC Group 2 Mains & Screening Masterclass',
      startsAt: '2026-03-01T00:00:00.000Z',
      expiresAt: '2026-10-02T00:00:00.000Z',
      daysRemaining: 6, // < 7 days (Red Alert Warning)
      lastReadChapter: 'Chapter 2: Bifurcation of Andhra Pradesh',
      lastWatchedVideo: 'Economy: AP Industrial Policy 2023-27',
      progressPercent: 82,
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border-neutral-800/80 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider">
              Student Workspace
            </span>
            <span className="text-xs text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">APPSC 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName || user?.email?.split('@')[0] || 'Aspirant'}
          </h1>
          <p className="text-xs text-neutral-400">
            Track your course access validity, resume digital reader progress, and attempt mock tests.
          </p>
        </div>

        <div className="flex gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/courses')}
          >
            Explore Catalog
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate('/student/invoices')}
          >
            Billing & Invoices
          </Button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      </div>

      {/* Enrolled Courses Section (TASK-07.4.3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>My Enrolled Courses & Validity Countdown</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            {enrolledCourses.length} Active Entitlements
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map((course) => {
            const isExpiringSoon = course.daysRemaining <= 7;
            const isWarning = course.daysRemaining > 7 && course.daysRemaining <= 14;

            return (
              <Card
                key={course._id}
                className={`glass-panel border transition-all ${
                  isExpiringSoon
                    ? 'border-red-500/40 bg-red-950/10'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-neutral-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Header & Countdown Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Syllabus Progress: {course.progressPercent}% completed
                      </p>
                    </div>

                    {/* Validity Countdown Pill */}
                    <div className="shrink-0 text-right">
                      {isExpiringSoon ? (
                        <Badge variant="danger" size="md" dot>
                          {course.daysRemaining} Days Left (Renew Soon)
                        </Badge>
                      ) : isWarning ? (
                        <Badge variant="warning" size="md" dot>
                          {course.daysRemaining} Days Remaining
                        </Badge>
                      ) : (
                        <Badge variant="success" size="md" dot>
                          {course.daysRemaining} Days Remaining
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>

                  {/* Resume Learning Quick Links */}
                  <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        Last Read E-Book:
                      </span>
                      <span className="font-medium truncate max-w-[200px] text-right">
                        {course.lastReadChapter}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-sky-400" />
                        Last Video Lecture:
                      </span>
                      <span className="font-medium truncate max-w-[200px] text-right">
                        {course.lastWatchedVideo}
                      </span>
                    </div>
                  </div>

                  {/* Expiring Soon Alert Notice */}
                  {isExpiringSoon && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Course access expires in {course.daysRemaining} days. Historical test scores will remain read-only.</span>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        className="shrink-0"
                        onClick={() => navigate(`/checkout/${course._id}`)}
                      >
                        Renew
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-neutral-900">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      icon={BookOpen}
                      onClick={() => alert(`Launching Bilingual Dual-Pane Reader for ${course.title}`)}
                    >
                      Bilingual Reader
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      icon={Video}
                      onClick={() => alert(`Launching Video Player for ${course.title}`)}
                    >
                      Video Player
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      icon={FileCheck}
                      onClick={() => alert(`Opening Mock Tests for ${course.title}`)}
                    >
                      Take Tests
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
