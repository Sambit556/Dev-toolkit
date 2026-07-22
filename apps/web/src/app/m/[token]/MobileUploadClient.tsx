'use client';

import React, { useEffect, useState } from 'react';
import { Upload, CheckCircle, XCircle, ShieldCheck, File as FileIcon, Image as ImageIcon, Video as VideoIcon, Pause, Play } from 'lucide-react';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function fileTypeMeta(mime: string) {
  if (mime.startsWith('image/')) return { Icon: ImageIcon, color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/30' };
  if (mime.startsWith('video/')) return { Icon: VideoIcon, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' };
  return { Icon: FileIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' };
}

// This page is reached by scanning a QR code from another device (a phone, most of the
// time), so a hardcoded/localhost API URL would point the request back at that device
// instead of the machine actually running the API. Follow whatever host was used to
// reach this page unless NEXT_PUBLIC_API_URL explicitly points somewhere non-local.
function getApiBase() {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const envIsLocalOrUnset = !envUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(envUrl);
  return envIsLocalOrUnset ? `${window.location.protocol}//${window.location.hostname}:3001` : envUrl;
}

export default function MobileUploadClient({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // Lifted out of uploadFile() so the Pause/Continue buttons (rendered separately)
  // can reach the in-progress session — this is the same session row the desktop
  // Upload Queue polls, so pausing here is what the desktop sees too, and vice versa.
  const [uploadSession, setUploadSession] = useState<{ uploadId: string; s3Key: string } | null>(null);

  // Announce this device to the desktop the moment the link is opened — scanning
  // the QR is the "connect" moment, not waiting until a file is actually picked.
  useEffect(() => {
    fetch(`${getApiBase()}/api/storage/mobile/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [token]);

  const pickFile = (f: File) => {
    setFile(f);
    setStatus('idle');
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) pickFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) pickFile(e.dataTransfer.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    const apiBase = getApiBase();
    try {
      const totalParts = Math.ceil(file.size / CHUNK_SIZE);

      // 1. Start Upload
      const startRes = await fetch(`${apiBase}/api/storage/mobile/upload/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, totalParts })
      });
      const startData = await startRes.json();
      if (!startData.success) throw new Error(startData.message || 'Failed to start upload');

      const { uploadId, s3Key } = startData.data;
      setUploadSession({ uploadId, s3Key });

      // 2. Upload Parts
      const uploadedParts = [];

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        let partData: any;
        // The desktop Upload Queue can pause this session mid-transfer (it's polling
        // the same upload_sessions row) — poll-retry until resumed instead of failing,
        // since the file bytes only ever live in this tab's memory.
        while (true) {
          const partRes = await fetch(`${apiBase}/api/storage/mobile/upload/part`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ uploadId, s3Key, partNumber })
          });
          partData = await partRes.json();
          if (partData.success) break;
          if (partData.code === 'UPLOAD_PAUSED') {
            setStatus('paused');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error(partData.message || 'Failed to get part URL');
        }
        setStatus('uploading');

        const putRes = await fetch(partData.data.url, {
          method: 'PUT',
          body: chunk
        });
        if (!putRes.ok) throw new Error(`Failed to upload part ${partNumber}`);

        const etag = putRes.headers.get('ETag') || putRes.headers.get('etag');
        if (!etag) throw new Error('No ETag in S3 response');

        uploadedParts.push({ PartNumber: partNumber, ETag: etag.replace(/"/g, '') });
        setProgress(Math.round((partNumber / totalParts) * 100));
      }

      // 3. Complete Upload
      const completeRes = await fetch(`${apiBase}/api/storage/mobile/upload/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uploadId, s3Key, parts: uploadedParts, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size })
      });
      const completeData = await completeRes.json();
      if (!completeData.success) throw new Error(completeData.message || 'Failed to complete upload');

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An unknown error occurred');
    }
  };

  const pauseUpload = () => {
    if (!uploadSession) return;
    setStatus('paused'); // instant local feedback — the loop's own retry-wait picks up the server flip
    fetch(`${getApiBase()}/api/storage/mobile/upload/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadId: uploadSession.uploadId }),
    }).catch(() => {});
  };

  const resumeUpload = () => {
    if (!uploadSession) return;
    setStatus('uploading');
    fetch(`${getApiBase()}/api/storage/mobile/upload/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadId: uploadSession.uploadId }),
    }).catch(() => {});
  };

  const typeMeta = file ? fileTypeMeta(file.type || '') : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient premium background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-24 w-72 h-72 bg-indigo-600/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.10),transparent_60%)]" />
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center gap-7 bg-slate-900/70 p-8 rounded-[2rem] border border-slate-800/80 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Secure Mobile Upload</h1>
            <p className="text-slate-400 text-xs mt-1.5 tracking-wide">Encrypted transfer &middot; direct to your vault</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-emerald-400 font-bold text-xl">Upload Complete</h2>
            <p className="text-slate-400 text-sm text-center">File is now safely stored in your vault.</p>
            <button onClick={() => { setFile(null); setStatus('idle'); }} className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-colors cursor-pointer">
              Upload Another
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            {!file ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full aspect-square flex flex-col items-center justify-center gap-4 rounded-3xl cursor-pointer border-2 border-dashed transition-all duration-200 group ${
                  isDragging
                    ? 'bg-indigo-900/50 border-indigo-400 scale-[1.02] shadow-[0_0_30px_rgba(99,102,241,0.25)]'
                    : 'bg-indigo-950/30 border-indigo-500/50 hover:bg-indigo-900/40 hover:border-indigo-400'
                }`}
              >
                <div className={`p-4 bg-indigo-500/20 rounded-full transition-transform ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}>
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="text-center px-6">
                  <span className="font-semibold text-indigo-300 block">{isDragging ? 'Drop it here' : 'Tap to select, or drag a file in'}</span>
                  <span className="text-slate-500 text-xs mt-1 block">Any file type, large files supported</span>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="w-full flex flex-col gap-4">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center gap-3">
                  {typeMeta && (
                    <div className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center ${typeMeta.bg}`}>
                      <typeMeta.Icon className={`w-5 h-5 ${typeMeta.color}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{file.name}</div>
                    <div className="text-xs text-slate-400">{formatBytes(file.size)}</div>
                  </div>
                  {status === 'idle' && (
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {status === 'uploading' || status === 'paused' ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-300 relative overflow-hidden ${status === 'paused' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`}
                        style={{ width: `${progress}%` }}
                      >
                        {status === 'uploading' && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span className={status === 'paused' ? 'text-amber-400' : ''}>
                        {status === 'paused' ? 'Paused — synced across your devices' : 'Uploading securely...'}
                      </span>
                      <span className={status === 'paused' ? 'text-amber-300 font-bold' : 'text-indigo-300 font-bold'}>{progress}%</span>
                    </div>
                    {status === 'uploading' ? (
                      <button onClick={pauseUpload} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    ) : (
                      <button onClick={resumeUpload} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30">
                        <Play className="w-3.5 h-3.5" /> Continue
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={uploadFile} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" /> Start Upload
                  </button>
                )}
              </div>
            )}
            {status === 'error' && (
              <div className="w-full p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium tracking-wide uppercase">
          <ShieldCheck className="w-3 h-3" /> AES-GCM-256 &middot; This link expires automatically
        </div>
      </div>
    </div>
  );
}
