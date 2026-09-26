import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  ShieldAlert,
  Play,
  Pause,
  Download,
  FileText,
  Image as ImageIcon,
  Clock,
  User,
  ArrowLeft,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { ChatAttachmentModal } from '../../components/chat/ChatAttachmentModal';
import { ReportModal } from '../../components/chat/ReportModal';
import { connectSocket, getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const MOCK_THREADS = [
  {
    _id: 'th-01',
    participant: {
      _id: 'm-101',
      fullName: 'Dr. Venkat Rao Garu',
      title: 'APPSC Group-1 Ranker (2018)',
      role: 'MENTOR',
      isOnline: true,
    },
    subject: 'Indian Polity & Constitution',
    lastMessage: 'Review Article 371-D Presidential Orders and high court decisions.',
    updatedAt: '12:45 PM',
    unreadCount: 0,
  },
  {
    _id: 'th-02',
    participant: {
      _id: 'm-102',
      fullName: 'Smt. Lakshmi Prasanna',
      title: 'Deputy Tahsildar (Rank 14)',
      role: 'MENTOR',
      isOnline: true,
    },
    subject: 'AP Socio-Economic History',
    lastMessage: 'Good structure! Add 2 points on Satavahana maritime trade ports like Motupalli.',
    updatedAt: '10:15 AM',
    unreadCount: 1,
  },
  {
    _id: 'th-03',
    participant: {
      _id: 'm-103',
      fullName: 'Prof. K. R. Charyulu',
      title: 'Senior Faculty in Macroeconomics',
      role: 'MENTOR',
      isOnline: false,
    },
    subject: 'Indian Economy',
    lastMessage: 'The 16th Finance Commission horizontal devolution share is 41%.',
    updatedAt: 'Yesterday',
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES = {
  'th-01': [
    {
      _id: 'm-1',
      senderId: 'user-self',
      content: 'Good morning Sir, I have a doubt regarding Article 371-D special provisions in Andhra Pradesh.',
      createdAt: '12:30 PM',
      isDelivered: true,
      isRead: true,
    },
    {
      _id: 'm-2',
      senderId: 'm-101',
      content: 'Hello! Article 371-D was inserted by the 32nd Constitutional Amendment Act, 1973 to safeguard equitable opportunities in public employment and education across distinct administrative zones.',
      createdAt: '12:35 PM',
      isDelivered: true,
      isRead: true,
    },
    {
      _id: 'm-3',
      senderId: 'm-101',
      content: 'I am also sharing an audio breakdown summarizing the Presidential Orders of 1975.',
      createdAt: '12:40 PM',
      messageType: 'audio',
      attachments: [
        {
          type: 'audio',
          url: 'https://r2.appsc-prep.com/voice/article-371d-explanation.mp3',
          duration: 38,
          caption: 'Article 371-D Audio Overview (38s)',
        },
      ],
      isDelivered: true,
      isRead: true,
    },
    {
      _id: 'm-4',
      senderId: 'm-101',
      content: 'Review Article 371-D Presidential Orders and high court decisions.',
      createdAt: '12:45 PM',
      isDelivered: true,
      isRead: true,
    },
  ],
};

export const ChatRoomPage = () => {
  const { threadId: paramThreadId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [threads, setThreads] = useState(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState(
    paramThreadId || MOCK_THREADS[0]._id
  );
  const [messages, setMessages] = useState(
    INITIAL_MESSAGES[activeThreadId] || []
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const messagesEndRef = useRef(null);

  const activeThread =
    threads.find((t) => t._id === activeThreadId) || threads[0];

  useEffect(() => {
    if (paramThreadId) {
      setActiveThreadId(paramThreadId);
    }
  }, [paramThreadId]);

  useEffect(() => {
    // Load messages for current thread
    if (INITIAL_MESSAGES[activeThreadId]) {
      setMessages(INITIAL_MESSAGES[activeThreadId]);
    } else {
      setMessages([
        {
          _id: `m-init-${Date.now()}`,
          senderId: activeThread?.participant?._id || 'mentor',
          content: 'Hello! Feel free to ask any doubt or submit your Mains answers for evaluation.',
          createdAt: 'Just now',
          isDelivered: true,
          isRead: true,
        },
      ]);
    }
  }, [activeThreadId]);

  useEffect(() => {
    // Auto scroll down
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  // Socket.IO Listener Setup
  useEffect(() => {
    const socket = connectSocket();

    socket.emit('join_thread', { threadId: activeThreadId });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setIsPeerTyping(false);
    });

    socket.on('user_typing', (data) => {
      if (data.threadId === activeThreadId) {
        setIsPeerTyping(true);
        setTimeout(() => setIsPeerTyping(false), 3000);
      }
    });

    return () => {
      socket.emit('leave_thread', { threadId: activeThreadId });
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [activeThreadId]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      _id: `msg-${Date.now()}`,
      threadId: activeThreadId,
      senderId: user?.id || 'user-self',
      content: inputText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDelivered: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    const socket = getSocket();
    socket.emit('send_message', {
      threadId: activeThreadId,
      content: newMsg.content,
      clientMessageId: newMsg._id,
    });

    // Simulate mentor reply if offline demo
    setTimeout(() => {
      setIsPeerTyping(true);
      setTimeout(() => {
        setIsPeerTyping(false);
        const reply = {
          _id: `msg-${Date.now() + 1}`,
          threadId: activeThreadId,
          senderId: activeThread?.participant?._id,
          content: 'Noted! I am reviewing your query and cross-referencing with previous APPSC question trends.',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDelivered: true,
          isRead: true,
        };
        setMessages((prev) => [...prev, reply]);
      }, 2000);
    }, 1500);
  };

  const handleSendAttachment = (attachment) => {
    const newMsg = {
      _id: `msg-${Date.now()}`,
      threadId: activeThreadId,
      senderId: user?.id || 'user-self',
      content: attachment.caption || 'Attached File',
      messageType: attachment.type,
      attachments: [attachment],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDelivered: true,
      isRead: false,
    };

    setMessages((prev) => [...prev, newMsg]);

    const socket = getSocket();
    socket.emit('send_message', {
      threadId: activeThreadId,
      content: newMsg.content,
      messageType: attachment.type,
      attachments: [attachment],
      clientMessageId: newMsg._id,
    });
  };

  const filteredThreads = threads.filter((t) =>
    t.participant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 overflow-hidden shadow-2xl h-[calc(100vh-140px)] flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Left Pane: Conversation Threads List */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col bg-neutral-950/60">
        {/* Search header */}
        <div className="p-4 border-b border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              1-on-1 Mentorship
            </h2>
            <Badge variant="accent" size="sm" className="font-mono text-[10px]">
              Issue #58
            </Badge>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Thread list scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
          {filteredThreads.map((thread) => {
            const isActive = thread._id === activeThreadId;
            return (
              <div
                key={thread._id}
                onClick={() => {
                  setActiveThreadId(thread._id);
                  navigate(`/chat/${thread._id}`);
                }}
                className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                  isActive
                    ? 'bg-amber-500/[0.08] border-l-4 border-amber-500'
                    : 'hover:bg-neutral-900/40'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-amber-400">
                    {thread.participant.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  {thread.participant.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-bold text-white truncate">
                      {thread.participant.fullName}
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {thread.updatedAt}
                    </span>
                  </div>

                  <span className="text-[10px] text-amber-400/90 font-medium block truncate">
                    {thread.subject}
                  </span>

                  <p className="text-[11px] text-neutral-400 truncate mt-1">
                    {thread.lastMessage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Active Chat Room */}
      <div className="flex-1 flex flex-col bg-neutral-900/30">
        {/* Chat Room Header */}
        <div className="px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-amber-400">
                {activeThread?.participant?.fullName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              {activeThread?.participant?.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-950" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {activeThread?.participant?.fullName}
                </h3>
                <Badge variant="accent" size="sm" className="text-[9px]">
                  {activeThread?.participant?.role}
                </Badge>
              </div>
              <span className="text-[11px] text-neutral-400">
                {activeThread?.subject}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Issue #65 Report Modal trigger */}
            <Button
              variant="ghost"
              size="sm"
              icon={ShieldAlert}
              onClick={() => setIsReportOpen(true)}
              className="text-neutral-400 hover:text-red-400 text-xs"
            >
              <span className="hidden sm:inline">Report</span>
            </Button>
          </div>
        </div>

        {/* Message Feed Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === (user?.id || 'user-self');

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md sm:max-w-lg rounded-2xl p-4 text-xs shadow-md ${
                    isMe
                      ? 'bg-amber-500/10 border border-amber-500/30 text-neutral-100 rounded-br-xs'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs'
                  }`}
                >
                  {/* Photo / Image Attachment */}
                  {msg.messageType === 'image' && msg.attachments?.[0] && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                      <img
                        src={msg.attachments[0].url}
                        alt="Handwritten solution"
                        className="max-h-60 w-full object-cover cursor-zoom-in"
                        onClick={() => window.open(msg.attachments[0].url, '_blank')}
                      />
                    </div>
                  )}

                  {/* Document Attachment */}
                  {msg.messageType === 'document' && msg.attachments?.[0] && (
                    <div className="mb-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-400" />
                        <span className="font-medium text-white truncate max-w-[200px]">
                          {msg.attachments[0].caption || 'Document.pdf'}
                        </span>
                      </div>
                      <a
                        href={msg.attachments[0].url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-amber-400 hover:text-amber-300"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Voice Note Audio Attachment */}
                  {msg.messageType === 'audio' && msg.attachments?.[0] && (
                    <div className="mb-2 p-3 rounded-xl bg-neutral-950/80 border border-amber-500/20 flex items-center gap-3">
                      <button
                        onClick={() =>
                          setPlayingAudioId(
                            playingAudioId === msg._id ? null : msg._id
                          )
                        }
                        className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0"
                      >
                        {playingAudioId === msg._id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                          <span>{msg.attachments[0].caption || 'Voice Note'}</span>
                          <span>{msg.attachments[0].duration || 15}s</span>
                        </div>
                        {/* Audio Waveform visualizer bars */}
                        <div className="flex items-center gap-0.5 h-3">
                          {[40, 70, 20, 90, 60, 30, 80, 50, 100, 30, 70, 45, 85, 25].map(
                            (val, i) => (
                              <div
                                key={i}
                                className={`w-1 rounded-full ${
                                  playingAudioId === msg._id
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-neutral-700'
                                }`}
                                style={{ height: `${val}%` }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Text Content */}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={`flex items-center gap-1.5 mt-2 text-[10px] text-neutral-400 font-mono ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.createdAt}</span>
                    {isMe && (
                      <span>
                        {msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                        ) : msg.isDelivered ? (
                          <CheckCheck className="w-3.5 h-3.5 text-neutral-400 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-neutral-500 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isPeerTyping && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 italic font-mono bg-neutral-900/60 w-fit px-3 py-1.5 rounded-full border border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{activeThread?.participant?.fullName} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Action Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center gap-2.5"
        >
          {/* Issue #61: Multimedia R2 Uploader */}
          <button
            type="button"
            onClick={() => setIsAttachmentOpen(true)}
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors shrink-0"
            title="Attach handwritten photo, PDF, or voice note"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type your doubt or question (Press Enter to send)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />

          <Button
            type="submit"
            variant="accent"
            size="sm"
            icon={Send}
            disabled={!inputText.trim()}
          >
            Send
          </Button>
        </form>
      </div>

      {/* Cloudflare R2 Attachment Modal (Issue #61) */}
      <ChatAttachmentModal
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onSendAttachment={handleSendAttachment}
      />

      {/* Moderation Report Modal (Issue #65) */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        threadId={activeThreadId}
        reportedUserId={activeThread?.participant?._id}
        reportedUserName={activeThread?.participant?.fullName}
      />
    </div>
  );
};
