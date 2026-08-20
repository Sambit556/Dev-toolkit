'use client';

import React, { useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Lock,
  Download,
  Code2,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCloudIdeStore } from '../../store/useCloudIdeStore';
import JSZip from 'jszip';

export const ShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setShareModalOpen,
    files,
    currentLanguage,
  } = useCloudIdeStore();

  const [isReadOnly, setIsReadOnly] = useState(true);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isShareModalOpen) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sandbox/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${currentLanguage.toUpperCase()} Workspace`,
          files,
          language: currentLanguage,
          isReadOnly,
          expiresInHours,
          password: password || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}${data.url}`;
        setGeneratedLink(fullUrl);
      } else {
        // Fallback local share URL
        const shareId = Math.random().toString(36).substring(2, 9);
        setGeneratedLink(`${window.location.origin}/cloud-ide?share=${shareId}`);
      }
    } catch {
      const shareId = Math.random().toString(36).substring(2, 9);
      setGeneratedLink(`${window.location.origin}/cloud-ide?share=${shareId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${generatedLink || window.location.href}" width="100%" height="600" frameborder="0" allow="clipboard-write; encrypted-media"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => {
      if (!f.name.endsWith('/.gitkeep')) {
        zip.file(f.name, f.content);
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devkits-${currentLanguage}-workspace.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Share Project & Workspace</h2>
              <p className="text-xs text-slate-400">Generate secure share links or export ZIP bundle</p>
            </div>
          </div>
          <button
            onClick={() => setShareModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Permission Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Access Permission</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsReadOnly(true)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isReadOnly
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Read-Only View</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReadOnly(false)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  !isReadOnly
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Collaborative Fork</span>
              </button>
            </div>
          </div>

          {/* Expiration & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Link Expiration
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 Hour</option>
                <option value={24}>24 Hours (1 Day)</option>
                <option value={168}>7 Days</option>
                <option value={0}>Never Expire</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Password Protection (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank for public link..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            <span>Generate Shareable Workspace Link</span>
          </button>

          {/* Generated Result Link */}
          {generatedLink && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmbed}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{copiedEmbed ? 'Embed Code Copied!' : 'Copy Embed Snippet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick ZIP Export */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleExportZip}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Complete Project as ZIP Archive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
