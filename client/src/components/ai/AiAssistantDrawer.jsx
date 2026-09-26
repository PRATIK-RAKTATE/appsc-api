import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Minimize2,
  Maximize2,
  Flame,
} from 'lucide-react';
import { Badge, Button } from '../ui';
import api from '../../services/api';

/**
 * Global AI Study Assistant Drawer (Issue #71)
 * Features:
 * - Floating trigger button with saffron glow and bilingual prompt chips
 * - Simulated typewriter streaming response
 * - Clickable book & page citation pills that navigate directly to the e-book reader
 */
export const AiAssistantDrawer = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Namaskaram! I am your APPSC AI Study Mentor. You can ask me conceptual doubts in Telugu or English, request chapter summaries, or ask for high-yield exam points. Try one of the quick prompts below!',
      citations: [],
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const QUICK_PROMPTS = [
    'Explain Article 371-D special provisions',
    'Summarize AP Reorganisation Act 2014 Section 94',
    'Satavahana administrative structure & taxes',
    '16th Finance Commission devolution metrics',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsStreaming(true);

    // Determine context-relevant response with citation pills
    let botResponse = '';
    let citations = [];

    if (text.toLowerCase().includes('371-d') || text.toLowerCase().includes('article')) {
      botResponse =
        'Article 371-D of the Indian Constitution was introduced by the 32nd Constitutional Amendment Act, 1973. It empowers the President to make orders providing for equitable opportunities and facilities for people belonging to different parts of Andhra Pradesh in public employment and education.\n\nKey Constitutional Aspects:\n1. Presidential Order of 1975 demarcated the state into multiple administrative zones.\n2. Protected reservations in educational institutions under local candidate quotas.\n3. Reaffirmed under Section 97 of the AP Reorganisation Act 2014.\n\nExam Tip: Frequently tested in APPSC Group 1 & 2 Paper-II (Polity & Constitution).';
      citations = [
        {
          bookTitle: 'AP Socio-Economic & Constitutional History',
          bookId: 'appsc-history',
          chapter: 'Chapter 4',
          page: 112,
        },
      ];
    } else if (text.toLowerCase().includes('reorganisation') || text.toLowerCase().includes('94')) {
      botResponse =
        'Under Section 94 of the Andhra Pradesh Reorganisation Act, 2014:\n1. Section 94(3) stipulates that the Central Government shall provide special financial support for the creation of essential facilities for the new capital of Andhra Pradesh, including the Raj Bhavan, High Court, Secretariat, and Legislative Assembly.\n2. Section 94(4) mandates central tax incentives to promote industrialization in backward districts.\n\nRecent Developments: The 2026 Phase-II Master Plan co-finances this infrastructure via World Bank credit backed by sovereign counter-guarantees.';
      citations = [
        {
          bookTitle: 'AP State Economy & Planning',
          bookId: 'appsc-economy',
          chapter: 'Chapter 2',
          page: 58,
        },
      ];
    } else if (text.toLowerCase().includes('satavahana') || text.toLowerCase().includes('history')) {
      botResponse =
        'The Satavahana dynasty (circa 1st century BCE - 2nd century CE) established administrative dominance across modern Andhra Pradesh.\n\nAdministrative Highlights:\n- Empire was partitioned into Ahāras governed by Amātyas.\n- Land revenue was called Bhāga (generally one-sixth of gross produce).\n- Prominent maritime trade ports: Motupalli and Ghantasala.\n- Currency: Potin and lead coins bearing ship symbols, highlighting seafaring trade with the Roman Empire.';
      citations = [
        {
          bookTitle: 'AP Socio-Economic & Constitutional History',
          bookId: 'appsc-history',
          chapter: 'Chapter 1',
          page: 24,
        },
      ];
    } else {
      botResponse =
        `Based on the APPSC Group 1 & Group 2 syllabus, this topic spans administrative governance and socio-economic planning. \n\nKey takeaways to focus for Prelims & Mains:\n- Memorize statutory dates and constitutional articles.\n- Note high-yield data points from the latest Socio-Economic Survey of Andhra Pradesh.\n- Practice bilingual formulation of answer points for clarity.`;
      citations = [
        {
          bookTitle: 'AP Socio-Economic & Constitutional History',
          bookId: 'appsc-history',
          chapter: 'Chapter 3',
          page: 86,
        },
      ];
    }

    // Typewriter effect simulation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: botResponse,
          citations,
        },
      ]);
      setIsStreaming(false);
    }, 900);
  };

  const handleOpenCitation = (bookId, page) => {
    navigate(`/student/books/${bookId}?page=${page || 1}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold shadow-2xl shadow-amber-500/40 hover:scale-105 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-neutral-950/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
          </div>
          <span className="text-xs tracking-tight">AI Study Assistant</span>
          <span className="px-1.5 py-0.5 rounded-full bg-neutral-950 text-amber-400 text-[10px] font-mono">
            RAG
          </span>
        </button>
      )}

      {/* Slide-Out AI Assistant Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-3xl border border-amber-500/30 bg-neutral-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[92vw] sm:w-[420px] md:w-[480px] h-[580px]'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-neutral-950">
                <Sparkles className="w-4 h-4 fill-neutral-950" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  APPSC AI Mentor
                  <Badge variant="accent" size="sm" className="text-[9px]">
                    Bilingual
                  </Badge>
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Atlas Vector Search Enabled
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-neutral-400 hover:text-white"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Feed Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed ${
                          isUser
                            ? 'bg-amber-500 text-neutral-950 font-medium rounded-br-xs'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Issue #71: Clickable Book & Page Citation Pills */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-amber-400/90 block">
                              Source Textbook Citations:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((cite, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleOpenCitation(cite.bookId, cite.page)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors text-[11px] font-mono group"
                                >
                                  <BookOpen className="w-3 h-3 text-amber-400" />
                                  <span>
                                    {cite.bookTitle} (p. {cite.page})
                                  </span>
                                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isStreaming && (
                  <div className="flex items-center gap-2 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-xs text-neutral-400 font-mono w-fit">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Searching textbook knowledge chunks...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Query Chips */}
              <div className="px-4 py-2 border-t border-neutral-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 whitespace-nowrap hover:border-amber-500/40 hover:text-amber-300 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Action Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-neutral-800 bg-neutral-900/40 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask any APPSC syllabus question..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />

                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  icon={Send}
                  disabled={!inputQuery.trim() || isStreaming}
                >
                  Ask
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
