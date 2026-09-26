import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Bookmark,
  Highlighter,
  Sliders,
  Sun,
  Moon,
  Coffee,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Sparkles,
  Trash2,
  List
} from 'lucide-react';
import { useReaderStore } from '../../stores/readerStore';
import { Button, Input, Card, Badge, Modal } from '../../components/ui';
import { ContentProtectionWrapper } from '../../components/security/ContentProtectionWrapper';

// Sample bilingual content blocks for APPSC History & Constitution
const SAMPLE_BLOCKS = [
  {
    blockIndex: 0,
    pageNumber: 1,
    chapterTitle: 'Chapter 1: Physical Features & Historical Geography of Andhra',
    en: 'Andhra Pradesh occupies a prime geographical location on the south-eastern coast of India. The state is blessed with fertile deltas formed by two major perennial rivers, the Godavari and the Krishna, which have shaped its agrarian economy, maritime trade, and cultural evolution since ancient times.',
    te: 'ఆంధ్రప్రదేశ్ భారతదేశ ఆగ్నేయ తీరంలో అత్యంత ప్రాముఖ్యమైన భౌగోళిక స్థానాన్ని కలిగి ఉంది. పురాతన కాలం నుండి వ్యవసాయ ఆర్థిక వ్యవస్థను, సముద్ర వాణిజ్యాన్ని, సాంస్కృతిక పరిణామాన్ని తీర్చిదిద్దిన గోదావరి మరియు కృష్ణా అనే రెండు ప్రధాన జీవనదుల సారవంతమైన డెల్టాలను ఈ రాష్ట్రం కలిగి ఉంది.',
  },
  {
    blockIndex: 1,
    pageNumber: 2,
    chapterTitle: 'Chapter 1: Physical Features & Historical Geography of Andhra',
    en: 'The Eastern Ghats, stretching diagonally across the state, act as a natural watershed and house rich mineral resources and tribal communities. The coastline extending over 974 kilometers provides immense strategic advantage for maritime commerce, connecting ancient port towns like Motupalli and Machilipatnam to Southeast Asian empires.',
    te: 'రాష్ట్రం గుండా విస్తరించి ఉన్న తూర్పు కనుమలు సహజ నీటి పరీవాహక ప్రాంతంగా పనిచేస్తూ విలువైన ఖనిజ వనరులకు మరియు గిరిజన సమాజాలకు నిలయంగా ఉన్నాయి. 974 కిలోమీటర్ల మేర విస్తరించి ఉన్న తీరప్రాంతం సముద్ర వాణిజ్యానికి వ్యూహాత్మక ప్రయోజనాన్ని చేకూర్చింది, మోటుపల్లి మరియు మచిలీపట్నం వంటి పురాతన ఓడరేవులను ఆగ్నేయాసియా సామ్రాజ్యాలతో అనుసంధానించింది.',
  },
  {
    blockIndex: 2,
    pageNumber: 3,
    chapterTitle: 'Chapter 2: The Satavahana Dynasty and Administrative Framework',
    en: 'The Satavahanas (also known as Andhrabhrityas in Puranic texts) established the first major sovereign empire in the Deccan with their early capital at Kotilingala and later at Amaravati (Dharanikota). King Simukha laid the foundation of the empire, while Gautamiputra Satakarni revived its paramount glory.',
    te: 'శాతవాహనులు (పురాణాలలో ఆంధ్రభృత్యులుగా పిలువబడ్డారు) దక్కన్ పీఠభూమిలో తమ మొదటి సార్వభౌమ సామ్రాజ్యాన్ని స్థాపించారు. వీరి ప్రారంభ రాజధాని కోటిలింగాల కాగా, తరువాతి కాలంలో అమరావతి (ధరణికోట) రాజధానిగా మారింది. సిముఖుడు ఈ సామ్రాజ్యానికి పునాది వేయగా, గౌతమీపుత్ర శాతకర్ణి దాని వైభవాన్ని తిరిగి ఉచ్ఛస్థితికి చేర్చాడు.',
  },
  {
    blockIndex: 3,
    pageNumber: 4,
    chapterTitle: 'Chapter 2: The Satavahana Dynasty and Administrative Framework',
    en: 'The administration was decentralized with royal provinces known as Aharas governed by Amatyas. Land grants inscribed on copper plates and stone edicts (such as the Nasik and Karle inscriptions) reveal the earliest recorded royal endowments to Buddhist Sanghas and Brahmin scholars, establishing a tolerant socio-religious framework.',
    te: 'పరిపాలన వికేంద్రీకరించబడింది, ఆహారాలు అని పిలువబడే రాజ ప్రావిన్సులను అమాత్యులు పాలించేవారు. రాగి రేకులు మరియు రాతి శాసనాలలో (నాసిక్ మరియు కార్లే శాసనాలు వంటివి) లిఖించబడిన భూదానాలు బౌద్ధ సంఘాలకు మరియు బ్రాహ్మణ పండితులకు రాజరిక విరాళాలను తెలియజేస్తాయి, ఇది సహనంతో కూడిన సామాజిక-మత నిర్మాణాన్ని నెలకొల్పింది.',
  },
  {
    blockIndex: 4,
    pageNumber: 5,
    chapterTitle: 'Chapter 3: Constitutional Framework & State Reorganisation',
    en: 'The demand for a separate Andhra state on linguistic grounds gained national prominence through Potti Sreeramulu’s historic fast-unto-death in 1952. Consequently, Andhra State was inaugurated on October 1, 1953, with Kurnool as capital, leading to the enactment of the States Reorganisation Act in 1956.',
    te: 'భాషా ప్రాతిపదికన ప్రత్యేక ఆంధ్ర రాష్ట్రాన్ని ఏర్పాటు చేయాలనే డిమాండ్ 1952లో పొట్టి శ్రీరాములు చేపట్టిన చారిత్రాత్మక ఆమరణ నిరాహారదీక్షతో జాతీయ ప్రాధాన్యతను సంతరించుకుంది. ఫలితంగా, అక్టోబర్ 1, 1953న కర్నూలు రాజధానిగా ఆంధ్ర రాష్ట్రం ఆవిర్భవించింది, ఇది 1956లో రాష్ట్రాల పునర్వ్యవస్థీకరణ చట్టానికి దారితీసింది.',
  },
];

export const BilingualReaderPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const {
    theme,
    fontSize,
    setTheme,
    setFontSize,
    saveProgress,
    annotations,
    createAnnotation,
    deleteAnnotation,
  } = useReaderStore();

  const [blocks, setBlocks] = useState(SAMPLE_BLOCKS);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [popoverPos, setPopoverPos] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [activeColor, setActiveColor] = useState('YELLOW');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isSyncingScroll = useRef(false);

  // Synchronized Scrolling Controller (Issue #26)
  const handleScroll = (sourcePane, targetPane) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    const scrollPercentage =
      sourcePane.scrollTop / (sourcePane.scrollHeight - sourcePane.clientHeight);
    targetPane.scrollTop =
      scrollPercentage * (targetPane.scrollHeight - targetPane.clientHeight);

    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 40);
  };

  // Listen to text selection for Study Annotation Popover (Issue #31)
  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();

    if (text && text.length > 2) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setSelectionRange({ text });
      setPopoverPos({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2,
      });
    } else {
      if (!noteModalOpen) {
        setPopoverPos(null);
      }
    }
  };

  // Add Annotation Highlight
  const handleAddHighlight = (color) => {
    createAnnotation({
      bookId: bookId || 'appsc-history',
      text: selectedText,
      color,
      createdAt: new Date().toISOString(),
    });
    setPopoverPos(null);
  };

  // Save Study Note
  const handleSaveNote = () => {
    if (!noteInput.trim()) return;
    createAnnotation({
      bookId: bookId || 'appsc-history',
      text: selectedText,
      noteText: noteInput,
      color: activeColor,
      createdAt: new Date().toISOString(),
    });
    setNoteInput('');
    setNoteModalOpen(false);
    setPopoverPos(null);
  };

  // In-Reader Text Search (Issue #34)
  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results = [];
    blocks.forEach((b) => {
      if (b.en.toLowerCase().includes(q) || b.te.toLowerCase().includes(q)) {
        results.push({
          blockIndex: b.blockIndex,
          pageNumber: b.pageNumber,
          chapterTitle: b.chapterTitle,
          snippetEn: b.en,
          snippetTe: b.te,
        });
      }
    });
    setSearchResults(results);
  };

  const scrollToBlock = (blockIndex) => {
    const targetElement = document.getElementById(`block-${blockIndex}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsSearchOpen(false);
    }
  };

  // Theme styling configurations
  const themeClasses = {
    dark: 'bg-[#090a0f] text-neutral-200 border-neutral-800',
    light: 'bg-white text-neutral-900 border-neutral-200',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#e8d7be]',
  };

  const paneThemeClasses = {
    dark: 'bg-neutral-950/70 border-neutral-800/80',
    light: 'bg-neutral-50/90 border-neutral-200',
    sepia: 'bg-[#f7ebd4] border-[#e5d4bb]',
  };

  return (
    <ContentProtectionWrapper enabled={true}>
      <div
        className={`min-h-screen flex flex-col transition-colors duration-300 ${themeClasses[theme]}`}
        onMouseUp={handleMouseUp}
      >
        {/* Top Control Bar */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/student/dashboard')}
            >
              Exit Reader
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight truncate max-w-xs">
                Andhra Pradesh History & Polity (Bilingual)
              </span>
              <Badge variant="accent" size="sm">Dual-Pane Sync</Badge>
            </div>
          </div>

          {/* Reader Preferences & Tools */}
          <div className="flex items-center gap-2">
            {/* Outline / Chapters Button */}
            <Button
              variant="ghost"
              size="sm"
              icon={List}
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              title="Table of Contents"
            >
              <span className="hidden md:inline">Outline</span>
            </Button>

            {/* In-Reader Search Button (Issue #34) */}
            <Button
              variant="ghost"
              size="sm"
              icon={Search}
              onClick={() => setIsSearchOpen(true)}
              title="Search Book"
            >
              <span className="hidden md:inline">Search</span>
            </Button>

            {/* My Notes Drawer Trigger (Issue #31) */}
            <Button
              variant="ghost"
              size="sm"
              icon={Bookmark}
              onClick={() => setIsNotesDrawerOpen(true)}
              title="My Notes & Bookmarks"
            >
              <span className="hidden md:inline">Notes ({annotations.length})</span>
            </Button>

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-neutral-900/60 border border-neutral-800 rounded-xl px-2 py-1 gap-2 text-xs">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                className="hover:text-amber-400 font-bold px-1"
                title="Decrease Font"
              >
                A-
              </button>
              <span className="font-mono text-[11px] text-neutral-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(26, fontSize + 1))}
                className="hover:text-amber-400 font-bold px-1"
                title="Increase Font"
              >
                A+
              </button>
            </div>

            {/* Theme Toggle (Light / Dark / Sepia) */}
            <div className="flex p-0.5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'sepia' ? 'bg-[#d8c39f] text-[#332211] font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Sepia Eye-Care Mode"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'light' ? 'bg-white text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dual-Pane Synchronized Reading Interface (Issue #26) */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-4.5rem)] overflow-hidden">
          {/* Left Column: English Pane */}
          <div className="flex flex-col h-full rounded-2xl glass-panel overflow-hidden border">
            <div className="p-3 border-b border-inherit bg-black/10 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                English Original Edition
              </span>
              <span className="text-[11px] font-mono opacity-60">Source Literature</span>
            </div>

            <div
              ref={leftPaneRef}
              onScroll={() => handleScroll(leftPaneRef.current, rightPaneRef.current)}
              className="flex-1 p-6 overflow-y-auto space-y-6 leading-relaxed select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {blocks.map((block) => (
                <div
                  key={block.blockIndex}
                  id={`block-${block.blockIndex}`}
                  className="p-4 rounded-xl border border-transparent hover:border-amber-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-50 mb-1.5">
                    <span>{block.chapterTitle}</span>
                    <span>Page {block.pageNumber}</span>
                  </div>
                  <p className="leading-relaxed font-sans">{block.en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Telugu Translated Pane */}
          <div className="flex flex-col h-full rounded-2xl glass-panel overflow-hidden border">
            <div className="p-3 border-b border-inherit bg-black/10 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                తెలుగు అనువాద పాఠం (Telugu Translation)
              </span>
              <span className="text-[11px] font-mono opacity-60">Synchronized View</span>
            </div>

            <div
              ref={rightPaneRef}
              onScroll={() => handleScroll(rightPaneRef.current, leftPaneRef.current)}
              className="flex-1 p-6 overflow-y-auto space-y-6 leading-relaxed select-text font-telugu"
              style={{ fontSize: `${fontSize + 1}px` }}
            >
              {blocks.map((block) => (
                <div
                  key={block.blockIndex}
                  className="p-4 rounded-xl border border-transparent hover:border-orange-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-50 mb-1.5">
                    <span>{block.chapterTitle}</span>
                    <span>పేజీ {block.pageNumber}</span>
                  </div>
                  <p className="leading-relaxed font-telugu text-[1.05em]">{block.te}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Text Selection Annotation Popover (Issue #31) */}
        {popoverPos && (
          <div
            className="fixed z-50 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
          >
            {/* Color Swatches */}
            <button
              onClick={() => handleAddHighlight('YELLOW')}
              className="w-6 h-6 rounded-full bg-amber-400 hover:scale-110 transition-transform shadow"
              title="Yellow Highlight"
            />
            <button
              onClick={() => handleAddHighlight('GREEN')}
              className="w-6 h-6 rounded-full bg-emerald-400 hover:scale-110 transition-transform shadow"
              title="Green Highlight"
            />
            <button
              onClick={() => handleAddHighlight('BLUE')}
              className="w-6 h-6 rounded-full bg-sky-400 hover:scale-110 transition-transform shadow"
              title="Blue Highlight"
            />
            <button
              onClick={() => handleAddHighlight('PINK')}
              className="w-6 h-6 rounded-full bg-pink-400 hover:scale-110 transition-transform shadow"
              title="Pink Highlight"
            />

            <div className="w-[1px] h-4 bg-neutral-700 mx-1" />

            {/* Note & Bookmark Buttons */}
            <button
              onClick={() => {
                setActiveColor('YELLOW');
                setNoteModalOpen(true);
              }}
              className="px-2 py-1 text-xs rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Note</span>
            </button>
            <button
              onClick={() => handleAddHighlight('BOOKMARK')}
              className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800"
              title="Bookmark Selected Passage"
            >
              <Bookmark className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>
        )}

        {/* Study Note Modal */}
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title="Add Study Annotation Note"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 italic line-clamp-3">
              "{selectedText}"
            </div>

            <textarea
              rows={4}
              placeholder="Write your study revision notes, exam mnemonics, or thoughts..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 outline-none"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" size="sm" onClick={handleSaveNote}>
                Save Annotation
              </Button>
            </div>
          </div>
        </Modal>

        {/* In-Reader Full-Text Search Drawer (Issue #34) */}
        {isSearchOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-neutral-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Search in Book</span>
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search English or Telugu terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="accent" size="md">
                Find
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  {searchQuery ? 'No matching passages found.' : 'Enter keyword to search across all chapters.'}
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => scrollToBlock(res.blockIndex)}
                    className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-1 text-xs"
                  >
                    <div className="flex justify-between font-mono text-[10px] text-amber-400">
                      <span>Page {res.pageNumber}</span>
                      <span>{res.chapterTitle}</span>
                    </div>
                    <p className="line-clamp-2 text-neutral-300 font-sans">{res.snippetEn}</p>
                    <p className="line-clamp-2 text-neutral-400 font-telugu text-[11px]">{res.snippetTe}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* My Notes & Bookmarks Drawer (Issue #31) */}
        {isNotesDrawerOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-neutral-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>My Notes & Highlights</span>
              </h3>
              <button
                onClick={() => setIsNotesDrawerOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {annotations.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500">
                  No annotations yet. Select any text to highlight or add study revision notes.
                </div>
              ) : (
                annotations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400 font-mono">
                        {item.color || 'HIGHLIGHT'}
                      </span>
                      <button
                        onClick={() => deleteAnnotation(item._id)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="italic text-neutral-300 border-l-2 border-amber-400 pl-2 line-clamp-3">
                      "{item.text}"
                    </p>
                    {item.noteText && (
                      <p className="text-amber-200 font-medium bg-amber-500/10 p-2 rounded-lg">
                        {item.noteText}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ContentProtectionWrapper>
  );
};
