import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, MinusCircle, BarChart3, RotateCcw, ArrowRight, Clock, Award } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';

export const TestScorecardPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Evaluation summary with negative marking calculation
  const summary = {
    totalMarksObtained: 118.67,
    maxMarks: 150,
    rank: 14,
    totalAspirants: 4820,
    percentile: 98.7,
    correctCount: 124,
    incorrectCount: 16,
    unattemptedCount: 10,
    negativePenalty: 5.33,
    timeTakenMinutes: 114,
  };

  // Hourly peer leaderboard table (Issue #48)
  const leaderboard = [
    { rank: 1, name: 'Sravan Kumar V.', score: 139.33, percentile: 99.9, time: '122m' },
    { rank: 2, name: 'Deepika Reddy P.', score: 136.00, percentile: 99.8, time: '118m' },
    { rank: 3, name: 'Manoj Krishna K.', score: 132.67, percentile: 99.6, time: '130m' },
    { rank: 4, name: 'Anusha Rao G.', score: 130.33, percentile: 99.4, time: '125m' },
    { rank: 14, name: 'You (Current Student)', score: 118.67, percentile: 98.7, time: '114m', isCurrent: true },
  ];

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Scorecard Hero Banner */}
      <Card className="glass-panel border-amber-500/30 p-8 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        <Badge variant="accent" size="sm" className="mb-2">Official Exam Evaluation</Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Test Scorecard & Ranking
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          APPSC Group 1 Prelims Grand Mock Examination 1 • Completed on {new Date().toLocaleDateString()}
        </p>

        {/* Primary Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-xs text-neutral-500 block">Total Marks</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary.totalMarksObtained} <span className="text-xs text-neutral-400 font-normal">/ {summary.maxMarks}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-xs text-neutral-500 block">State Rank</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              #{summary.rank} <span className="text-xs text-neutral-400 font-normal">/ {summary.totalAspirants}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-xs text-neutral-500 block">Percentile</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {summary.percentile}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-xs text-neutral-500 block">Time Utilized</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
              {summary.timeTakenMinutes}m
            </span>
          </div>
        </div>

        {/* Breakdown Pills */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{summary.correctCount} Correct (+{summary.correctCount}m)</span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-2 text-red-300 font-medium">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{summary.incorrectCount} Wrong (-{summary.negativePenalty}m)</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center gap-2 text-neutral-300 font-medium">
            <MinusCircle className="w-4 h-4 text-neutral-400" />
            <span>{summary.unattemptedCount} Skipped (0m)</span>
          </div>
        </div>
      </Card>

      {/* Hourly Updated Leaderboard Table (Issue #48) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Hourly Peer Leaderboard Standings</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">
            Refreshes every 60 minutes
          </span>
        </div>

        <Card className="glass-panel border-neutral-800 p-0 overflow-hidden">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/80 text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Total Score</th>
                <th className="px-6 py-3.5">Percentile</th>
                <th className="px-6 py-3.5">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {leaderboard.map((row) => (
                <tr
                  key={row.rank}
                  className={`transition-colors ${
                    row.isCurrent
                      ? 'bg-amber-500/10 text-amber-200 font-bold border-l-4 border-l-amber-500'
                      : 'hover:bg-neutral-900/40'
                  }`}
                >
                  <td className="px-6 py-3.5 font-mono">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                      row.rank === 1 ? 'bg-amber-400 text-neutral-950 font-bold' :
                      row.rank === 2 ? 'bg-neutral-300 text-neutral-950 font-bold' :
                      row.rank === 3 ? 'bg-amber-700 text-white font-bold' : 'text-neutral-400'
                    }`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium">{row.name}</td>
                  <td className="px-6 py-3.5 font-bold font-mono">{row.score}</td>
                  <td className="px-6 py-3.5 text-emerald-400 font-semibold">{row.percentile}%</td>
                  <td className="px-6 py-3.5 text-neutral-400 font-mono">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button
          variant="outline"
          size="lg"
          icon={ArrowLeft}
          onClick={() => navigate('/student/tests')}
        >
          Back to Tests
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon={CheckCircle}
          onClick={() => navigate(`/student/exams/${attemptId}/review`)}
        >
          Review Question Solutions
        </Button>
        <Button
          variant="accent"
          size="lg"
          icon={BarChart3}
          onClick={() => navigate(`/student/analytics`)}
        >
          Weak Topic Diagnosis & Analytics
        </Button>
      </div>
    </div>
  );
};
