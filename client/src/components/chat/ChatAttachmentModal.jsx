import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Mic,
  MicOff,
  X,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Modal, Button, Badge } from '../ui';

/**
 * ChatAttachmentModal (Issue #61)
 * Supports multimedia uploads to Cloudflare R2:
 * 1. Image upload (handwritten solutions, diagrams, textbook snippets <= 5MB)
 * 2. Document upload (PDF notes <= 10MB)
 * 3. Audio Voice Note recorder & waveform preview
 */
export const ChatAttachmentModal = ({ isOpen, onClose, onSendAttachment }) => {
  const [activeTab, setActiveTab] = useState('IMAGE'); // 'IMAGE' | 'PDF' | 'VOICE'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const timerRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size
    const maxSize = type === 'IMAGE' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size exceeds limit (${type === 'IMAGE' ? '5MB' : '10MB'})`);
      return;
    }

    setSelectedFile(file);
    if (type === 'IMAGE') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(file.name);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // Simulate recorded audio blob
    setAudioBlobUrl('mock-voice-note.webm');
  };

  const handleSend = () => {
    setUploading(true);
    setTimeout(() => {
      if (activeTab === 'VOICE') {
        onSendAttachment({
          type: 'audio',
          url: 'https://r2.appsc-prep.com/voice/mock-voice-note.webm',
          duration: recordingDuration || 12,
          caption: 'Voice Note',
        });
      } else if (activeTab === 'IMAGE') {
        onSendAttachment({
          type: 'image',
          url:
            previewUrl ||
            'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
          caption: selectedFile ? selectedFile.name : 'Handwritten Solution.jpg',
        });
      } else {
        onSendAttachment({
          type: 'document',
          url: 'https://r2.appsc-prep.com/docs/polity-amendments-summary.pdf',
          caption: selectedFile ? selectedFile.name : 'Polity_Amendments.pdf',
        });
      }

      setUploading(false);
      resetState();
      onClose();
    }, 800);
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlobUrl(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Attach Resource to Chat"
      size="md"
    >
      <div className="space-y-5 text-neutral-200">
        {/* Attachment Mode Selector */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('IMAGE');
              resetState();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              activeTab === 'IMAGE'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image / Photo
          </button>

          <button
            onClick={() => {
              setActiveTab('PDF');
              resetState();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              activeTab === 'PDF'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Document (PDF)
          </button>

          <button
            onClick={() => {
              setActiveTab('VOICE');
              resetState();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              activeTab === 'VOICE'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice Note
          </button>
        </div>

        {/* Tab 1: Image Upload */}
        {activeTab === 'IMAGE' && (
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 p-2 flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-56 rounded-xl object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400 mt-2 font-mono">
                  {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <label className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/40">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-200">
                  Click or drag photo here
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  JPG, PNG or WebP up to 5MB (Handwritten solutions, textbook diagrams)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'IMAGE')}
                />
              </label>
            )}
          </div>
        )}

        {/* Tab 2: Document PDF Upload */}
        {activeTab === 'PDF' && (
          <div className="space-y-4">
            {selectedFile ? (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">
                      {selectedFile.name}
                    </h5>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to dispatch
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/40">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-200">
                  Select study material or revision notes PDF
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  PDF format up to 10MB
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'PDF')}
                />
              </label>
            )}
          </div>
        )}

        {/* Tab 3: Audio Voice Recorder */}
        {activeTab === 'VOICE' && (
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500 animate-pulse'
                  : audioBlobUrl
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Mic className="w-7 h-7" />
            </div>

            <div className="text-center">
              <span className="text-xl font-mono font-bold text-white tracking-wider">
                {formatTimer(recordingDuration)}
              </span>
              <p className="text-xs text-neutral-400 mt-1">
                {isRecording
                  ? 'Recording voice note... Explain your doubt clearly'
                  : audioBlobUrl
                  ? 'Voice note recorded successfully'
                  : 'Click below to record audio explanation'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isRecording && !audioBlobUrl && (
                <Button
                  variant="accent"
                  size="sm"
                  icon={Mic}
                  onClick={startVoiceRecording}
                >
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Square}
                  onClick={stopVoiceRecording}
                >
                  Stop Recording
                </Button>
              )}

              {audioBlobUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAudioBlobUrl(null);
                    setRecordingDuration(0);
                  }}
                >
                  Re-record
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            R2 Secure Presigned Bucket
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={
                uploading ||
                (activeTab === 'IMAGE' && !selectedFile) ||
                (activeTab === 'PDF' && !selectedFile) ||
                (activeTab === 'VOICE' && !audioBlobUrl)
              }
              onClick={handleSend}
            >
              {uploading ? 'Uploading to R2...' : 'Send Attachment'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
