import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Clock, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { useExamStore } from '../../stores/examStore';
import { Button, Card, Badge, Modal } from '../../components/ui';

const SAMPLE_TESTS = [
  {
    _id: 'test_appsc_group1_mock1',
    title: 'APPSC Group 1 Prelims Grand Mock Examination 1',
    description: 'Full-length 150-question mock exam modeled on the exact latest APPSC Group 1 syllabus: General Studies, Mental Ability, AP History, and Economy.',
    targetExam: 'Group 1 Prelims',
    durationMinutes: 150,
    totalQuestions: 150,
    totalMarks: 150,
    negativeMarking: '0.33 (1/3rd)',
    status: 'AVAILABLE',
  },
  {
    _id: 'test_appsc_group2_sectional_polity',
    title: 'APPSC Group 2 Sectional Mock: Indian Constitution & AP Governance',
    description: 'Specialized 50-question sectional test evaluating constitutional amendments, 73rd/74th amendments, and AP State Administrative reforms.',
    targetExam: 'Group 2 Screening',
    durationMinutes: 50,
    totalQuestions: 50,
    totalMarks: 50,
    negativeMarking: '0.33 (1/3rd)',
    status: 'AVAILABLE',
  },
  {
    _id: 'test_appsc_ap_history_mastery',
    title: 'Andhra Pradesh History & Bifurcation Act Comprehensive Quiz',
    description: 'Focus test covering Satavahanas, Kakatiyas, Vijayanagara empire, Freedom struggle in Andhra, and AP Reorganisation Act 2014 provisions.',
    targetExam: 'General Studies',
    durationMinutes: 60,
    totalQuestions: 60,
    totalMarks: 60,
    negativeMarking: '0.33 (1/3rd)',
    status: 'AVAILABLE',
  },
];

export const StudentTestsCatalogPage = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { startExam } = useExamStore();
  const navigate = useNavigate();

  const handleOpenInstructions = (test) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const handleStartExam = async () => {
    if (!selectedTest) return;
    setIsModalOpen(false);
    navigate(`/student/exams/${selectedTest._id}`);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">Online Assessment Engine</Badge>
            <span className="text-xs text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">Negative Marking Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Mock Tests & Examination Series
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Simulate realistic exam conditions with countdown timers, question palettes, and bilingual switching.
          </p>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_TESTS.map((test) => (
          <Card
            key={test._id}
            hoverEffect
            className="flex flex-col justify-between border-neutral-800 p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="accent" size="sm">{test.targetExam}</Badge>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{test.durationMinutes} Mins</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                  {test.description}
                </p>
              </div>

              {/* Specs Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 text-center">
                <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Questions</span>
                  <span className="text-xs font-bold text-neutral-200">{test.totalQuestions}</span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Total Marks</span>
                  <span className="text-xs font-bold text-neutral-200">{test.totalMarks}</span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Negative</span>
                  <span className="text-xs font-bold text-red-400">{test.negativeMarking}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-800/80">
              <Button
                variant="accent"
                size="md"
                className="w-full"
                icon={FileCheck}
                onClick={() => handleOpenInstructions(test)}
              >
                Attempt Test Now
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Instructions Modal (Issue #41, #43) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTest?.title}
        subtitle="Please review examination instructions carefully before launching"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs text-neutral-300 py-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              Standard Examination Rules
            </span>
            <p className="text-[11px] leading-relaxed">
              Once you click "Start Exam", the countdown timer will begin immediately. The test will auto-submit when the timer expires.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white">Marking Scheme:</h4>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>Each correct answer awards <strong>+1.0 mark</strong>.</li>
              <li>Each incorrect answer deducts <strong>0.33 marks (1/3rd negative marking)</strong>.</li>
              <li>Unattempted questions receive 0 marks.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-white">Player Navigation & Palette:</h4>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li><strong>1-Click Bilingual Switch:</strong> You can switch question language between English and Telugu at any time.</li>
              <li><strong>Question Palette:</strong> Gray = Not Visited, Red = Unanswered, Green = Answered, Purple = Marked for Review.</li>
              <li><strong>Autosave:</strong> Responses are autosaved periodically with local offline state backup.</li>
            </ul>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="md" icon={ArrowRight} onClick={handleStartExam}>
              I Understand, Start Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
