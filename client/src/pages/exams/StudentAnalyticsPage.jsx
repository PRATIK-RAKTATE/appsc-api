import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, Clock, AlertTriangle, ArrowRight, BookOpen, Target, Sparkles, TrendingUp } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';

export const StudentAnalyticsPage = () => {
  const navigate = useNavigate();

  // Metrics from GET /api/exams/attempts/:id/analytics
  const analyticsData = {
    summary: {
      totalScore: 118.67,
      totalQuestions: 150,
      attemptedCount: 140,
      correctCount: 124,
      incorrectCount: 16,
      skippedCount: 10,
      accuracyPercentage: 88.5,
    },
    timeAnalysis: {
      totalTimeSpentMinutes: 114,
      avgTimeCorrectSeconds: 42,
      avgTimeIncorrectSeconds: 78, // Notice student spent longer on wrong questions!
      avgTimeSkippedSeconds: 15,
    },
    topicBreakdown: [
      { name: 'Andhra Pradesh History & Culture', accuracy: 92, questions: 35, status: 'STRONG' },
      { name: 'General Studies & Mental Ability', accuracy: 86, questions: 40, status: 'GOOD' },
      { name: 'Indian Constitution & State Governance', accuracy: 78, questions: 45, status: 'MODERATE' },
      { name: 'Andhra Pradesh Economy & Bifurcation Act', accuracy: 44, questions: 30, status: 'WEAK' },
    ],
    weakTopics: [
      {
        topicName: 'Andhra Pradesh Economy & Bifurcation Act',
        accuracy: 44,
        recommendation: 'Your accuracy in AP Economy and Bifurcation Bare Act provisions is below 50%. You spent an average of 78s on questions in this section resulting in negative marking deductions.',
        bookLink: '/student/books/appsc-history',
        bookChapter: 'Chapter 3: Constitutional Framework & State Reorganisation',
      },
    ],
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">Performance Analytics Engine</Badge>
            <span className="text-xs text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">Diagnosis & Revision Guidance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Student Performance & Weak Topic Diagnosis
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-neutral-800 p-6 space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
            <Target className="w-6 h-6" />
          </div>
          <span className="text-xs text-neutral-400">Overall Accuracy</span>
          <div className="text-3xl font-extrabold text-white">
            {analyticsData.summary.accuracyPercentage}%
          </div>
          <p className="text-[11px] text-emerald-400">Above 85% competitive benchmark</p>
        </Card>

        <Card className="glass-panel border-neutral-800 p-6 space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-xs text-neutral-400">Avg Time on Correct vs Incorrect</span>
          <div className="text-xl font-bold text-white font-mono">
            <span className="text-emerald-400">{analyticsData.timeAnalysis.avgTimeCorrectSeconds}s</span> vs{' '}
            <span className="text-red-400">{analyticsData.timeAnalysis.avgTimeIncorrectSeconds}s</span>
          </div>
          <p className="text-[11px] text-neutral-400">Longer deliberations led to errors</p>
        </Card>

        <Card className="glass-panel border-neutral-800 p-6 space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-2">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-xs text-neutral-400">State Percentile Standing</span>
          <div className="text-3xl font-extrabold text-purple-400">
            98.7%
          </div>
          <p className="text-[11px] text-neutral-400">Top 1.3% among statewide test takers</p>
        </Card>
      </div>

      {/* Weak Topic Diagnosis Alert (Issue #51) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>Diagnostic Weak-Topic Alerts & Prescription</span>
        </h2>

        {analyticsData.weakTopics.map((weak, idx) => (
          <Card
            key={idx}
            className="border border-red-500/30 bg-red-950/10 p-6 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger" size="sm">Accuracy: {weak.accuracy}%</Badge>
                  <h3 className="text-base font-bold text-white">{weak.topicName}</h3>
                </div>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed max-w-2xl">
                  {weak.recommendation}
                </p>
              </div>

              <Button
                variant="accent"
                size="sm"
                icon={BookOpen}
                className="shrink-0"
                onClick={() => navigate('/student/books/appsc-history')}
              >
                Open Revision Chapter
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Recommended Textbook: <strong>{weak.bookChapter}</strong></span>
              </span>
              <span className="text-amber-400 font-mono text-[11px]">Bilingual Dual-Pane Available</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Topic Mastery Progress Bars */}
      <Card className="glass-panel border-neutral-800 p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Syllabus Topic Mastery Breakdown</span>
        </h3>

        <div className="space-y-5">
          {analyticsData.topicBreakdown.map((t, idx) => {
            const isWeak = t.accuracy < 50;
            const isGood = t.accuracy >= 80;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-200">{t.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-500">{t.questions} Questions</span>
                    <span className={`font-bold ${isWeak ? 'text-red-400' : isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {t.accuracy}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isWeak ? 'bg-red-500' : isGood ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
