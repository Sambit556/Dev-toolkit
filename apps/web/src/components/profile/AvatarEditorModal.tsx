'use client';

import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { X, Upload, Sparkles, Loader2, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PERSONA_AVATARS } from '@/lib/personaAvatars';
import { getCroppedImageBlob, rasterizeImageBlob } from '@/lib/cropImage';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface AvatarEditorModalProps {
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
  isSaving: boolean;
}

export function AvatarEditorModal({ onClose, onSave, isSaving }: AvatarEditorModalProps) {
  const [tab, setTab] = useState<'upload' | 'persona'>('upload');
  const [error, setError] = useState('');

  // Upload & crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Persona picker state
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, GIF, or WEBP image');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image exceeds the 5MB size limit');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleUseUploadedPhoto = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setError('');
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onSave(blob);
    } catch {
      setError('Could not process that image — try a different file');
    }
  };

  const handleUsePersona = async () => {
    const persona = PERSONA_AVATARS.find(p => p.key === selectedPersona);
    if (!persona) return;
    setError('');
    try {
      const blob = await rasterizeImageBlob(persona.dataUri);
      await onSave(blob);
    } catch {
      setError('Could not use that avatar — please try again');
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#0d1526] border border-slate-300/60 dark:border-slate-700/60 rounded-2xl w-[30rem] max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Profile Picture</h3>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-6 mb-4 shrink-0">
          <button
            onClick={() => setTab('upload')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors",
              tab === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            )}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Photo
          </button>
          <button
            onClick={() => setTab('persona')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors",
              tab === 'persona' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Pick a Character
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {tab === 'upload' ? (
            !imageSrc ? (
              <label className="flex flex-col items-center justify-center gap-3 h-56 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/60 bg-slate-50/60 dark:bg-slate-900/40 cursor-pointer transition-colors">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Upload className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to choose a photo</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">JPEG, PNG, GIF or WEBP · max 5MB</div>
                </div>
                <input type="file" accept={ALLOWED_TYPES.join(',')} className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-900">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <ZoomIn className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input
                    type="range" min={1} max={3} step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageSrc(null)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    Choose Different Photo
                  </button>
                  <button
                    onClick={handleUseUploadedPhoto}
                    disabled={isSaving || !croppedAreaPixels}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Picture'}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-2.5">
                {PERSONA_AVATARS.map((persona) => (
                  <button
                    key={persona.key}
                    onClick={() => setSelectedPersona(persona.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all cursor-pointer",
                      selectedPersona === persona.key
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.03]'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={persona.dataUri} alt={persona.label} className="h-14 w-14 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight">{persona.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleUsePersona}
                disabled={isSaving || !selectedPersona}
                className="w-full py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Use This Avatar'}
              </button>
              <p className="text-[9px] text-slate-400 dark:text-slate-600 text-center leading-relaxed">
                Procedurally generated avatars (DiceBear, MIT-licensed) — not affiliated with or depicting any copyrighted character.
              </p>
            </div>
          )}
          {error && (
            <div className="mt-3 text-[10px] text-red-600 dark:text-red-400 font-semibold text-center">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
