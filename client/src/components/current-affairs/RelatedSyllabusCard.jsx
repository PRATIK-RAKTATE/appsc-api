import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ExternalLink, Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { Badge, Button } from '../ui';

/**
 * RelatedSyllabusCard (Issue #82)
 * Renders semantic syllabus links mapped to Current Affairs articles via vector search embeddings.
 * Provides 1-click navigation directly to relevant textbook chapters in the Bilingual E-Book Reader.
 */
export const RelatedSyllabusCard = ({
  syllabusLinks = [
    {
      paper: 'APPSC Prelims - Paper II',
      subject: 'AP Socio-Economic & Cultural History',
      chapter: 'Chapter 4: Amaravati Capital Development & Bifurcation Provisions',
      bookId: 'appsc-history',
      page: 112,
      relevanceScore: 94,
    },
    {
      paper: 'APPSC Mains - Paper III',
      subject: 'Indian Economy & AP Planning',
      chapter: 'Chapter 2: State Fiscal Deficits & Centrally Sponsored Schemes',
      bookId: 'appsc-economy',
      page: 58,
      relevanceScore: 88,
    },
  ],
}) => {
  const navigate = useNavigate();

  const handleOpenReader = (bookId, chapter, page) => {
    navigate(`/student/books/${bookId}?page=${page || 1}`);
  };

  if (!syllabusLinks || syllabusLinks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-neutral-900/40 p-5 mt-8 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              Related APPSC Syllabus Concepts
              <Badge variant="accent" size="sm">
                AI Vector Mapped
              </Badge>
            </h4>
            <p className="text-xs text-neutral-400">
              Exam topics and textbook chapters semantically linked to this article
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
          Issue #82 Engine
        </span>
      </div>

      {/* Concept Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
        {syllabusLinks.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-amber-500/40 hover:bg-neutral-900/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="default" size="sm" className="text-[10px]">
                  {item.paper}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{item.relevanceScore}% match</span>
                </div>
              </div>

              <div className="text-xs font-medium text-amber-400/90 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                {item.subject}
              </div>

              <h5 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors line-clamp-2">
                {item.chapter}
              </h5>
            </div>

            <div className="pt-3 mt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                Page {item.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={BookOpen}
                onClick={() => handleOpenReader(item.bookId, item.chapter, item.page)}
                className="text-xs py-1.5 px-3 border-amber-500/30 hover:border-amber-400 text-amber-300"
              >
                Read in E-Book
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
