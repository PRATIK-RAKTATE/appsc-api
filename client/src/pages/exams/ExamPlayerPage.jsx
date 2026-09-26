import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Languages,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { useExamStore } from '../../stores/examStore';
import { Button, Badge, Modal, Card } from '../../components/ui';
import { ContentProtectionWrapper } from '../../components/security/ContentProtectionWrapper';

// Sample bilingual questions for testing the full examination engine
const DEMO_QUESTIONS = [
  {
    _id: 'q1',
    topic: 'Andhra Pradesh History',
    questionEn: 'Which Satavahana ruler assumed the title "Dakshinapathapati" and performed the Rajasuya and Ashvamedha sacrifices as recorded in the Naneghat inscription?',
    questionTe: 'నానాఘాట్ శాసనంలో నమోదు చేయబడిన విధంగా "దక్షిణాFreeze/దక్షిణాపథపతి" బిరుదును ధరించి, రాజసూయ మరియు అశ్వమేధ యాగాలను నిర్వహించిన శాతవాహన రాజు ఎవరు?',
    options: [
      { id: 1, textEn: 'Simukha', textTe: 'సిముఖుడు' },
      { id: 2, textEn: 'Satakarni I', textTe: 'మొదటి శాతకర్ణి' },
      { id: 3, textEn: 'Gautamiputra Satakarni', textTe: 'గౌతమీపుత్ర శాతకర్ణి' },
      { id: 4, textEn: 'Yajna Sri Satakarni', textTe: 'యజ్ఞశ్రీ శాతకర్ణి' },
    ],
  },
  {
    _id: 'q2',
    topic: 'Indian Polity & Constitution',
    questionEn: 'Under which Article of the Constitution of India is the Governor empowered to promulgate Ordinances during the recess of the State Legislature?',
    questionTe: 'భారత రాజ్యాంగంలోని ఏ ఆర్టికల్ ప్రకారం రాష్ట్ర శాసనసభ సమావేశాలు జరగనప్పుడు గవర్నర్ ఆర్డినెన్స్‌లను జారీ చేసే అధికారాన్ని కలిగి ఉంటారు?',
    options: [
      { id: 1, textEn: 'Article 123', textTe: 'ఆర్టికల్ 123' },
      { id: 2, textEn: 'Article 213', textTe: 'ఆర్టికల్ 213' },
      { id: 3, textEn: 'Article 217', textTe: 'ఆర్టికల్ 217' },
      { id: 4, textEn: 'Article 226', textTe: 'ఆర్టికల్ 226' },
    ],
  },
  {
    _id: 'q3',
    topic: 'Andhra Pradesh Economy',
    questionEn: 'Under the Andhra Pradesh Reorganisation Act 2014, the Polavaram Irrigation Project was officially declared as which of the following?',
    questionTe: 'ఆంధ్రప్రదేశ్ పునర్వ్యవస్థీకరణ చట్టం 2014 ప్రకారం పోలవరం సాగునీటి ప్రాజెక్ట్ అధికారికంగా క్రింది వాటిలో ఏదిగా ప్రకటించబడింది?',
    options: [
      { id: 1, textEn: 'State Multi-Purpose Scheme', textTe: 'రాష్ట్ర బహుళార్థసాధక పథకం' },
      { id: 2, textEn: 'National Project', textTe: 'జాతీయ ప్రాజెక్టు' },
      { id: 3, textEn: 'Public-Private Partnership (PPP)', textTe: 'ప్రభుత్వ-ప్రైవేట్ భాగస్వామ్యం (పీపీపీ)' },
      { id: 4, textEn: 'Inter-State Hydel Venture', textTe: 'అంతర్రాష్ట్ర జలవిద్యుత్ ప్రాజెక్టు' },
    ],
  },
  {
    _id: 'q4',
    topic: 'General Science & Environment',
    questionEn: 'Which coastal wetland in Andhra Pradesh is designated as a Ramsar site of international importance and is a prominent habitat for migratory birds like spot-billed pelicans?',
    questionTe: 'ఆంధ్రప్రదేశ్‌లోని ఏ తీరప్రాంత చిత్తడి నేల అంతర్జాతీయ ప్రాముఖ్యత కలిగిన రామ్‌సార్ ప్రదేశంగా గుర్తించబడింది మరియు వలస పక్షులకు ముఖ్యమైన ఆవాసంగా ఉంది?',
    options: [
      { id: 1, textEn: 'Kolleru Lake', textTe: 'కొల్లేరు సరస్సు' },
      { id: 2, textEn: 'Pulicat Lake', textTe: 'పులికాట్ సరస్సు' },
      { id: 3, textEn: 'Kondakarla Ava', textTe: 'కొండకర్ల ఆవ' },
      { id: 4, textEn: 'Coringa Mangroves', textTe: 'కోరింగ మడ అడవులు' },
    ],
  },
  {
    _id: 'q5',
    topic: 'Mental Ability & Logical Reasoning',
    questionEn: 'In a code language, if "ANDHRA" is coded as "BPEISB", what will be the code for "VIJAY"?',
    questionTe: 'ఒక కోడ్ భాషలో "ANDHRA"ను "BPEISB"గా కోడ్ చేస్తే, "VIJAY" కి కోడ్ ఏమిటి?',
    options: [
      { id: 1, textEn: 'WJKBZ', textTe: 'WJKBZ' },
      { id: 2, textEn: 'WJLBA', textTe: 'WJLBA' },
      { id: 3, textEn: 'WKKCA', textTe: 'WKKCA' },
      { id: 4, textEn: 'VILBZ', textTe: 'VILBZ' },
    ],
  },
];

export const ExamPlayerPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(DEMO_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState('en'); // 'en' | 'te'
  const [responses, setResponses] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(150 * 60); // 150 minutes
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  // Initialize responses
  useEffect(() => {
    const initial = {};
    DEMO_QUESTIONS.forEach((q, idx) => {
      initial[q._id] = {
        selectedOption: null,
        status: idx === 0 ? 'UNANSWERED' : 'NOT_VISITED',
      };
    });
    setResponses(initial);
  }, []);

  // Timer Tick (auto-submit on 00:00)
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const currentQ = questions[currentIndex] || questions[0];
  const currentResp = responses[currentQ?._id] || {};

  // Select Option
  const handleSelectOption = (optionId) => {
    setResponses((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: optionId,
        status: 'ANSWERED',
      },
    }));
  };

  // Clear Response
  const handleClearResponse = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        selectedOption: null,
        status: 'UNANSWERED',
      },
    }));
  };

  // Mark for Review & Next
  const handleMarkReview = () => {
    setResponses((prev) => ({
      ...prev,
      [currentQ._id]: {
        ...prev[currentQ._id],
        status: 'REVIEW',
      },
    }));
    if (currentIndex < questions.length - 1) {
      handleJumpTo(currentIndex + 1);
    }
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleJumpTo(currentIndex + 1);
    }
  };

  const handleJumpTo = (index) => {
    setCurrentIndex(index);
    const q = questions[index];
    if (responses[q?._id]?.status === 'NOT_VISITED') {
      setResponses((prev) => ({
        ...prev,
        [q._id]: {
          ...prev[q._id],
          status: 'UNANSWERED',
        },
      }));
    }
  };

  const handleSubmitExam = () => {
    setIsSubmitModalOpen(false);
    navigate(`/student/exams/${attemptId || 'demo'}/scorecard`);
  };

  // Counts for palette
  const answeredCount = Object.values(responses).filter((r) => r.status === 'ANSWERED').length;
  const reviewCount = Object.values(responses).filter((r) => r.status === 'REVIEW').length;
  const unattemptedCount = Object.values(responses).filter(
    (r) => r.status === 'UNANSWERED' || r.status === 'NOT_VISITED'
  ).length;

  const isLowTime = remainingSeconds < 300; // < 5 mins

  return (
    <ContentProtectionWrapper enabled={true}>
      <div className="fixed inset-0 z-50 bg-[#090a0f] text-neutral-100 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 glass-panel border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              APPSC Group 1 Prelims Grand Mock Exam
            </span>
            <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
              150 Marks
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* 1-Click Bilingual Language Switcher (Issue #43) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/80 hover:border-amber-500/50 text-xs font-semibold text-neutral-200 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'Switch to తెలుగు (TE)' : 'Switch to English (EN)'}</span>
            </button>

            {/* Countdown Timer with Alert (Issue #43) */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                isLowTime
                  ? 'bg-red-500/20 border-red-500/60 text-red-300 animate-pulse'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-400' : 'text-amber-400'}`} />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Toggle Palette Sidebar on Mobile */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            >
              {isPaletteOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            {/* Submit Exam Button */}
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Test
            </Button>
          </div>
        </header>

        {/* Main Exam Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Viewport */}
          <main className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl w-full mx-auto space-y-6">
              {/* Question Metadata */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-amber-400 font-mono">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-xs text-neutral-500">of {questions.length}</span>
                  <Badge variant="neutral" size="sm">{currentQ?.topic}</Badge>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Marks: <span className="text-emerald-400">+1.0</span> | Negative: <span className="text-red-400">-0.33</span>
                </div>
              </div>

              {/* Question Stem */}
              <div className="text-base sm:text-lg font-medium text-neutral-100 leading-relaxed font-sans">
                {language === 'en' ? (
                  <p>{currentQ?.questionEn}</p>
                ) : (
                  <p className="font-telugu leading-loose">{currentQ?.questionTe}</p>
                )}
              </div>

              {/* Options Radio List */}
              <div className="space-y-3 pt-2">
                {currentQ?.options?.map((opt) => {
                  const isSelected = currentResp.selectedOption === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/5'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 border-amber-500'
                            : 'border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {String.fromCharCode(64 + opt.id)}
                      </div>

                      <div className="flex-1 text-sm sm:text-base font-normal text-neutral-200">
                        {language === 'en' ? opt.textEn : <span className="font-telugu">{opt.textTe}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="max-w-4xl w-full mx-auto pt-6 mt-8 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  disabled={currentIndex === 0}
                  icon={ArrowLeft}
                  onClick={() => handleJumpTo(currentIndex - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleClearResponse}
                >
                  Clear Response
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={Bookmark}
                  onClick={handleMarkReview}
                >
                  Mark for Review & Next
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  icon={ArrowRight}
                  onClick={handleSaveAndNext}
                >
                  {currentIndex === questions.length - 1 ? 'Save Response' : 'Save & Next'}
                </Button>
              </div>
            </div>
          </main>

          {/* Question Palette Sidebar (Issue #43) */}
          <aside
            className={`w-80 glass-panel border-l border-neutral-800 p-6 flex flex-col justify-between shrink-0 transition-all ${
              isPaletteOpen ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="space-y-6">
              {/* Palette Legend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 font-mono">
                  Question Palette
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500 shrink-0" />
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-500 shrink-0" />
                    <span>Review ({reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-neutral-700 shrink-0" />
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>

              {/* Numbered Palette Grid */}
              <div className="overflow-y-auto max-h-[50vh] pr-1">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const status = responses[q._id]?.status || 'NOT_VISITED';
                    const isCurrent = currentIndex === idx;

                    let bg = 'bg-neutral-800 text-neutral-400 border-neutral-700';
                    if (status === 'ANSWERED') bg = 'bg-emerald-500 text-white font-bold border-emerald-400';
                    if (status === 'UNANSWERED') bg = 'bg-red-500 text-white font-bold border-red-400';
                    if (status === 'REVIEW') bg = 'bg-purple-500 text-white font-bold border-purple-400';

                    return (
                      <button
                        key={q._id}
                        onClick={() => handleJumpTo(idx)}
                        className={`h-10 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${bg} ${
                          isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950 scale-105' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Emergency Autosave Indicator */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-center gap-2 mt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Answers backed up to local storage & autosaved</span>
            </div>
          </aside>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit Examination"
          subtitle="Are you sure you want to end and submit your exam attempt?"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-xl bg-neutral-900 border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Answered</span>
                <span className="text-base font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Review</span>
                <span className="text-base font-bold text-purple-400">{reviewCount}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Unattempted</span>
                <span className="text-base font-bold text-neutral-300">{unattemptedCount}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Once submitted, your answers will be evaluated with negative marking and your scorecard and rank leaderboard will be computed immediately.
            </p>

            <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800">
              <Button variant="ghost" size="md" onClick={() => setIsSubmitModalOpen(false)}>
                Continue Exam
              </Button>
              <Button variant="accent" size="md" onClick={handleSubmitExam}>
                Confirm & Submit
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ContentProtectionWrapper>
  );
};
