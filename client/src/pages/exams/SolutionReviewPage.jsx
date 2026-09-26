import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, MinusCircle, Languages, Clock, BookOpen, ArrowLeft, BarChart2 } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';

const SAMPLE_REVIEW_DATA = [
  {
    questionId: 'q1',
    topic: 'Andhra Pradesh History',
    questionEn: 'Which Satavahana ruler assumed the title "Dakshinapathapati" and performed the Rajasuya and Ashvamedha sacrifices as recorded in the Naneghat inscription?',
    questionTe: 'నానాఘాట్ శాసనంలో నమోదు చేయబడిన విధంగా "దక్షిణాపథపతి" బిరుదును ధరించి, రాజసూయ మరియు అశ్వమేధ యాగాలను నిర్వహించిన శాతవాహన రాజు ఎవరు?',
    optionsEn: ['Simukha', 'Satakarni I', 'Gautamiputra Satakarni', 'Yajna Sri Satakarni'],
    optionsTe: ['సిముఖుడు', 'మొదటి శాతకర్ణి', 'గౌతమీపుత్ర శాతకర్ణి', 'యజ్ఞశ్రీ శాతకర్ణి'],
    selectedOption: 2,
    correctOption: 2,
    status: 'CORRECT',
    marksObtained: 1.0,
    timeSpentSeconds: 42,
    explanationEn: 'Satakarni I was the third king of the Satavahana dynasty. The Naneghat inscription issued by his queen Naganika describes him as "Dakshinapathapati" (Lord of the Southern Region) and highlights his performance of two Ashvamedha and one Rajasuya sacrifice.',
    explanationTe: 'మొదటి శాతకర్ణి శాతవాహన వంశంలో మూడవ రాజు. అతని రాణి నాగానిక జారీ చేసిన నానాఘాట్ శాసనం అతన్ని "దక్షిణాపథపతి"గా వర్ణిస్తుంది మరియు అతను రెండు అశ్వమేధ మరియు ఒక రాజసూయ యాగాలను నిర్వహించినట్లు తెలియజేస్తుంది.',
  },
  {
    questionId: 'q2',
    topic: 'Indian Polity & Constitution',
    questionEn: 'Under which Article of the Constitution of India is the Governor empowered to promulgate Ordinances during the recess of the State Legislature?',
    questionTe: 'భారత రాజ్యాంగంలోని ఏ ఆర్టికల్ ప్రకారం రాష్ట్ర శాసనసభ సమావేశాలు జరగనప్పుడు గవర్నర్ ఆర్డినెన్స్‌లను జారీ చేసే అధికారాన్ని కలిగి ఉంటారు?',
    optionsEn: ['Article 123', 'Article 213', 'Article 217', 'Article 226'],
    optionsTe: ['ఆర్టికల్ 123', 'ఆర్టికల్ 213', 'ఆర్టికల్ 217', 'ఆర్టికల్ 226'],
    selectedOption: 1, // Student picked 1 (President's Ordinance power)
    correctOption: 2, // Correct is 213
    status: 'INCORRECT',
    marksObtained: -0.33,
    timeSpentSeconds: 78,
    explanationEn: 'Article 213 of the Constitution empowers the Governor of a state to promulgate Ordinances when the state legislature is not in session. Article 123 provides identical power to the President of India for national laws.',
    explanationTe: 'రాజ్యాంగంలోని ఆర్టికల్ 213 ప్రకారం రాష్ట్ర శాసనసభ సమావేశాలు లేనప్పుడు గవర్నర్‌కు ఆర్డినెన్స్‌లను జారీ చేసే అధికారం ఉంది. ఆర్టికల్ 123 భారత రాష్ట్రపతి ఆర్డినెన్స్ అధికారాలను సూచిస్తుంది.',
  },
  {
    questionId: 'q3',
    topic: 'Andhra Pradesh Economy',
    questionEn: 'Under the Andhra Pradesh Reorganisation Act 2014, the Polavaram Irrigation Project was officially declared as which of the following?',
    questionTe: 'ఆంధ్రప్రదేశ్ పునర్వ్యవస్థీకరణ చట్టం 2014 ప్రకారం పోలవరం సాగునీటి ప్రాజెక్ట్ అధికారికంగా క్రింది వాటిలో ఏదిగా ప్రకటించబడింది?',
    optionsEn: ['State Multi-Purpose Scheme', 'National Project', 'Public-Private Partnership (PPP)', 'Inter-State Hydel Venture'],
    optionsTe: ['రాష్ట్ర బహుళార్థసాధక పథకం', 'జాతీయ ప్రాజెక్టు', 'ప్రభుత్వ-ప్రైవేట్ భాగస్వామ్యం (పీపీపీ)', 'అంతర్రాష్ట్ర జలవిద్యుత్ ప్రాజెక్టు'],
    selectedOption: 2,
    correctOption: 2,
    status: 'CORRECT',
    marksObtained: 1.0,
    timeSpentSeconds: 35,
    explanationEn: 'Section 90 of the Andhra Pradesh Reorganisation Act, 2014 declared the Polavaram Irrigation Project to be a National Project, making its execution and funding the responsibility of the Central Government.',
    explanationTe: 'ఆంధ్రప్రదేశ్ పునర్వ్యవస్థీకరణ చట్టం 2014 లోని సెక్షన్ 90 ప్రకారం పోలవరం ప్రాజెక్ట్ జాతీయ ప్రాజెక్టుగా ప్రకటించబడింది.',
  },
  {
    questionId: 'q4',
    topic: 'General Science & Environment',
    questionEn: 'Which coastal wetland in Andhra Pradesh is designated as a Ramsar site of international importance and is a prominent habitat for migratory birds like spot-billed pelicans?',
    questionTe: 'ఆంధ్రప్రదేశ్‌లోని ఏ తీరప్రాంత చిత్తడి నేల అంతర్జాతీయ ప్రాముఖ్యత కలిగిన రామ్‌సార్ ప్రదేశంగా గుర్తించబడింది మరియు వలస పక్షులకు ముఖ్యమైన ఆవాసంగా ఉంది?',
    optionsEn: ['Kolleru Lake', 'Pulicat Lake', 'Kondakarla Ava', 'Coringa Mangroves'],
    optionsTe: ['కొల్లేరు సరస్సు', 'పులికాట్ సరస్సు', 'కొండకర్ల ఆవ', 'కోరింగ మడ అడవులు'],
    selectedOption: null, // Student skipped
    correctOption: 1,
    status: 'UNATTEMPTED',
    marksObtained: 0,
    timeSpentSeconds: 15,
    explanationEn: 'Kolleru Lake is one of the largest freshwater lakes in India located between the Krishna and Godavari deltas. It was designated as a Ramsar site in November 2002 under the Ramsar Convention.',
    explanationTe: 'కొల్లేరు సరస్సు కృష్ణా మరియు గోదావరి డెల్టాల మధ్య ఉన్న భారతదేశంలోని అతిపెద్ద మంచినీటి సరస్సులలో ఒకటి. ఇది నవంబర్ 2002 లో రామ్‌సార్ ప్రదేశంగా గుర్తించబడింది.',
  },
];

export const SolutionReviewPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'INCORRECT' | 'CORRECT' | 'UNATTEMPTED'
  const [language, setLanguage] = useState('en');

  const filteredData = SAMPLE_REVIEW_DATA.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <button
              onClick={() => navigate(`/student/exams/${attemptId}/scorecard`)}
              className="hover:text-amber-400 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Scorecard</span>
            </button>
            <span>/</span>
            <span>Question Review</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Question-by-Question Solution Review
          </h1>
        </div>

        {/* Bilingual Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:border-amber-500/50"
        >
          <Languages className="w-4 h-4 text-amber-400" />
          <span>{language === 'en' ? 'Telugu (తెలుగు)' : 'English (EN)'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl border-neutral-800 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Questions', count: SAMPLE_REVIEW_DATA.length },
          { id: 'CORRECT', label: 'Correct', count: SAMPLE_REVIEW_DATA.filter(i => i.status === 'CORRECT').length },
          { id: 'INCORRECT', label: 'Incorrect', count: SAMPLE_REVIEW_DATA.filter(i => i.status === 'INCORRECT').length },
          { id: 'UNATTEMPTED', label: 'Unattempted', count: SAMPLE_REVIEW_DATA.filter(i => i.status === 'UNATTEMPTED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Questions Review List */}
      <div className="space-y-6">
        {filteredData.map((item, idx) => {
          const isCorrect = item.status === 'CORRECT';
          const isIncorrect = item.status === 'INCORRECT';
          const isUnattempted = item.status === 'UNATTEMPTED';

          return (
            <Card
              key={item.questionId}
              className={`glass-panel border p-6 space-y-4 ${
                isCorrect ? 'border-emerald-500/30' : isIncorrect ? 'border-red-500/30' : 'border-neutral-800'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <Badge variant={isCorrect ? 'success' : isIncorrect ? 'danger' : 'neutral'} size="sm">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-neutral-400 font-mono">{item.topic}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {item.timeSpentSeconds}s
                  </span>
                  <span>•</span>
                  <span className={`font-bold ${isCorrect ? 'text-emerald-400' : isIncorrect ? 'text-red-400' : 'text-neutral-400'}`}>
                    {item.marksObtained > 0 ? `+${item.marksObtained}` : item.marksObtained} Marks
                  </span>
                </div>
              </div>

              {/* Question Stem */}
              <p className="text-base font-medium text-white leading-relaxed">
                {language === 'en' ? item.questionEn : <span className="font-telugu">{item.questionTe}</span>}
              </p>

              {/* Options Breakdown */}
              <div className="space-y-2">
                {(language === 'en' ? item.optionsEn : item.optionsTe).map((optText, optIdx) => {
                  const optNumber = optIdx + 1;
                  const isUserSelection = item.selectedOption === optNumber;
                  const isAnswerKey = item.correctOption === optNumber;

                  let borderClass = 'border-neutral-800 bg-neutral-900/40 text-neutral-300';
                  let icon = null;

                  if (isAnswerKey) {
                    borderClass = 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200 font-semibold';
                    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                  } else if (isUserSelection && !isCorrect) {
                    borderClass = 'border-red-500/80 bg-red-500/10 text-red-200 font-semibold';
                    icon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                          {String.fromCharCode(64 + optNumber)}
                        </span>
                        <span className={language === 'te' ? 'font-telugu' : ''}>{optText}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUserSelection && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            Your Choice
                          </span>
                        )}
                        {isAnswerKey && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Correct Answer
                          </span>
                        )}
                        {icon}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bilingual Explanation Box (Issue #52) */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide text-[11px] font-mono">
                  <BookOpen className="w-3.5 h-3.5" />
                  Detailed Explanation & Concept Note
                </span>
                <p className="text-neutral-300 leading-relaxed font-sans">
                  {item.explanationEn}
                </p>
                <p className="text-neutral-400 leading-relaxed font-telugu pt-1">
                  {item.explanationTe}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
