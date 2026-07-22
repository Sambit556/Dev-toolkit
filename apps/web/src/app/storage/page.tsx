'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { notFound, useRouter } from 'next/navigation';
import {
  Filter,
  Folder,
  File as FileIcon,
  FileText,
  Trash2,
  LogOut,
  Upload,
  FolderPlus,
  Plus,
  Search,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Play,
  Pause,
  X,
  Check,
  RotateCw,
  RotateCcw,
  Save,
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  Minus,
  Eraser,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  User,
  Loader2,
  Trash,
  ChevronLeft,
  Eye,
  EyeOff,
  Share2,
  Tag,
  GripVertical,
  CheckSquare,
  Square as SquareIcon,
  FolderTree,
  Calendar,
  Sparkles,
  Shield,
  ShieldOff,
  ArrowLeft,
  Pencil,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Camera,
  KeyRound,
  Palette,
  PenTool,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
  Heading,
  Table,
  MonitorPlay,
  FileCode2,
  Smartphone,
  Link2,
  QrCode,
  Clock,
  Mail,
  Phone,
  Crown,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import dynamic from 'next/dynamic';

// Excalidraw ships its own stylesheet separately from the JS bundle (required
// since v0.17) — without it every panel/button renders with no sizing or
// positioning of its own, which is what made the whole diagram editor look
// giant, unstyled, and effectively unusable (icons untouchable/misaligned).
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);
import { QRCodeSVG } from 'qrcode.react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import { AvatarEditorModal } from '@/components/profile/AvatarEditorModal';
import { getFileColor } from '@/lib/fileColor';
import { FileViewerModal, type FileViewerItem } from '@/components/storage/FileViewerModal';
import { CopyButton } from '@/components/ui/copy-button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


const USAGE_CATEGORY_ICONS: Record<string, typeof FileIcon> = {
  images: ImageIcon, video: Video, audio: Music, archives: Archive, diagrams: Palette,
  pdf: FileText, word: FileText, excel: Table, powerpoint: MonitorPlay, text: Type, code: FileCode2, other: FileIcon,
};

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[\W_]/.test(password)) score += 20;
  return score;
};

const getStrengthColor = (score: number) => {
  if (score <= 20) return 'bg-red-500';
  if (score <= 40) return 'bg-orange-500';
  if (score <= 60) return 'bg-yellow-500';
  if (score <= 80) return 'bg-blue-500';
  return 'bg-emerald-500';
};

const getStrengthText = (score: number) => {
  if (score === 0) return '';
  if (score <= 20) return 'Very Weak';
  if (score <= 40) return 'Weak';
  if (score <= 60) return 'Fair';
  if (score <= 80) return 'Good';
  return 'Strong';
};

// Google's standard multi-color "G" mark, per their brand guidelines for
// "Continue with Google" buttons — https://developers.google.com/identity/branding-guidelines
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const PasswordStrengthBar = ({ password }: { password: string }) => {
  const score = calculatePasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
        <span className="text-slate-500 dark:text-slate-400">Password Strength</span>
        <span className={score === 100 ? "text-emerald-500" : "text-slate-500"}>{getStrengthText(score)}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
        <div className={`h-full transition-all duration-300 ${score >= 20 ? getStrengthColor(score) : 'bg-transparent'}`} style={{ width: '20%' }} />
        <div className={`h-full transition-all duration-300 ${score >= 40 ? getStrengthColor(score) : 'bg-transparent'}`} style={{ width: '20%' }} />
        <div className={`h-full transition-all duration-300 ${score >= 60 ? getStrengthColor(score) : 'bg-transparent'}`} style={{ width: '20%' }} />
        <div className={`h-full transition-all duration-300 ${score >= 80 ? getStrengthColor(score) : 'bg-transparent'}`} style={{ width: '20%' }} />
        <div className={`h-full transition-all duration-300 ${score >= 100 ? getStrengthColor(score) : 'bg-transparent'}`} style={{ width: '20%' }} />
      </div>
      <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
        Requires: 8+ chars, uppercase, lowercase, number, and symbol.
      </div>
    </div>
  );
};

interface StorageItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mime_type: string;
  size: number | null;
  s3_key: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  tags?: string[];
  shared_at?: string | null;
  description?: string | null;
}

interface UploadTracker {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  uploadId?: string;
  s3Key?: string;
  parentId: string | null;
  chunks: {
    partNumber: number;
    start: number;
    end: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    controller?: AbortController;
    etag?: string;
  }[];
  // 'mobile' trackers are driven by another device's browser (a scanned QR upload
  // link) — this desktop tab only observes/relays control via the API, since the
  // file bytes never pass through this tab. `chunks` stays empty for these.
  source?: 'desktop' | 'mobile';
  totalParts?: number;
}

const QUOTA_UNIT_BYTES: Record<'B' | 'KB' | 'MB' | 'GB', number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

// Maps the fixed, short error codes the /google/callback route redirects with (never
// Google-supplied or internal error text — see routes/auth.ts) to a friendly toast.
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAUTH_CANCELLED: 'Google sign-in was cancelled.',
  OAUTH_EMAIL_UNVERIFIED: 'That Google account\'s email is not verified.',
  ACCOUNT_INACTIVE: 'This account has been deactivated. Contact an administrator.',
  INVALID_OAUTH_STATE: 'That sign-in link expired. Please try again.',
  INVALID_OAUTH_CALLBACK: 'Google sign-in failed. Please try again.',
  OAUTH_CONFIG_ERROR: 'Google sign-in is not configured on this server.',
  OAUTH_TOKEN_EXCHANGE_FAILED: 'Google sign-in failed. Please try again.',
  OAUTH_USERINFO_FAILED: 'Google sign-in failed. Please try again.',
  OAUTH_FAILED: 'Google sign-in failed. Please try again.',
};

interface UsageCategory { key: string; label: string; bytes: number; color: string; }
interface UsageData { used: number; max: number; percent: string; files: number; folders: number; categories: UsageCategory[]; }

// TipTap/ProseMirror's schema requires the doc to always contain at least one
// block node — feeding editor.commands.setContent() a bare '' (rather than an
// empty paragraph) produces a doc with no valid block for the cursor to land
// in, which is what a freshly created (empty-content) note hit.
const EMPTY_NOTE_DOC = '<p></p>';

// Colors drawn from a validated categorical palette (adjacent pairs in this fixed
// order clear colorblind-safe and normal-vision separation floors — see the
// dataviz skill). The raw per-mime-type usage categories include several
// near-identical hues (e.g. two different reds, two different blues), so this
// groups them into up to 7 always-same-color buckets + a neutral "Other" that
// never rotates through the categorical slots. Order is fixed (never reassigned
// by rank/size) so a category's color never shifts as usage changes.
const USAGE_GROUP_ORDER: { key: string; label: string; icon: typeof FileIcon; sourceKeys: string[]; light: string; dark: string }[] = [
  { key: 'images', label: 'Images', icon: ImageIcon, sourceKeys: ['images'], light: '#2a78d6', dark: '#3987e5' },
  { key: 'video', label: 'Video', icon: Video, sourceKeys: ['video'], light: '#eb6834', dark: '#d95926' },
  { key: 'documents', label: 'Documents', icon: FileText, sourceKeys: ['pdf', 'word', 'excel', 'powerpoint', 'text'], light: '#1baf7a', dark: '#199e70' },
  { key: 'audio', label: 'Audio', icon: Music, sourceKeys: ['audio'], light: '#eda100', dark: '#c98500' },
  { key: 'diagrams', label: 'Diagrams', icon: Palette, sourceKeys: ['diagrams'], light: '#e87ba4', dark: '#d55181' },
  { key: 'code', label: 'Code', icon: FileCode2, sourceKeys: ['code'], light: '#008300', dark: '#008300' },
  { key: 'archives', label: 'Archives', icon: Archive, sourceKeys: ['archives'], light: '#4a3aa7', dark: '#9085e9' },
  { key: 'other', label: 'Other', icon: FileIcon, sourceKeys: ['other'], light: '#898781', dark: '#898781' },
];

function groupUsageCategories(categories: UsageCategory[], isDark: boolean) {
  const bytesByKey = new Map(categories.map(c => [c.key, c.bytes]));
  return USAGE_GROUP_ORDER
    .map(g => ({
      key: g.key,
      label: g.label,
      icon: g.icon,
      color: isDark ? g.dark : g.light,
      sourceKeys: g.sourceKeys,
      bytes: g.sourceKeys.reduce((sum, k) => sum + (bytesByKey.get(k) || 0), 0),
    }))
    .filter(g => g.bytes > 0);
}

export default function StoragePage() {
  const router = useRouter();
  const [isActivated, setIsActivated] = useState<boolean | null>(null);

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  // Profile section state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [previewItem, setPreviewItem] = useState<FileViewerItem | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileMobileInput, setProfileMobileInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showProfileCurrentPassword, setShowProfileCurrentPassword] = useState(false);
  const [showProfileNewPassword, setShowProfileNewPassword] = useState(false);
  const [showProfileConfirmPassword, setShowProfileConfirmPassword] = useState(false);
  // Superadmin-only OTP password-change flow — the regular current-password
  // flow above is rejected server-side for the superadmin account by design.
  const [profileOtp, setProfileOtp] = useState('');
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldownRemaining, setOtpCooldownRemaining] = useState(0);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // True for the brief window between landing back from Google and the exchange
  // call resolving — without this the login form (with its own "Continue with
  // Google" button) flashes on screen for a moment before the dashboard loads.
  const [isExchangingOAuth, setIsExchangingOAuth] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('oauth_exchange')
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [registerName, setRegisterName] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Mobile Scan Links
  const [showMobileScanModal, setShowMobileScanModal] = useState(false);
  const [showManageLinksModal, setShowManageLinksModal] = useState(false);
  const [activeMobileLinks, setActiveMobileLinks] = useState<any[]>([]);
  const [generatedMobileToken, setGeneratedMobileToken] = useState<string | null>(null);
  const [generatedMobileTTL, setGeneratedMobileTTL] = useState<string | null>(null);
  const [mobileLinkRemaining, setMobileLinkRemaining] = useState('');
  const [connectedMobileDevice, setConnectedMobileDevice] = useState<{ label: string; type: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Storage UI state
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarTab, setSidebarTab] = useState<'files' | 'notes' | 'uploads' | 'trash' | 'events' | 'admin' | 'diagrams'>('files');
  // Drives the "All Files" split-button tooltips imperatively — the diagonal-cut
  // segment relies on overflow-hidden for its clip-path, which would silently clip
  // a CSS group-hover tooltip nested inside it, so hover state is tracked here and
  // the tooltips render outside that clipped container instead.
  const [hoveredSplitSegment, setHoveredSplitSegment] = useState<'view' | 'upload' | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced filter state
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMimeCategories, setFilterMimeCategories] = useState<string[]>([]);
  
  const toggleMimeCategory = (cat: string) => {
    if (cat === 'all') {
      setFilterMimeCategories([]);
      return;
    }
    setFilterMimeCategories(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };
  const [filterTag, setFilterTag] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  // Events hierarchy state (auto date-clustered uploads)
  interface StorageEvent { start: string; end: string; count: number; totalBytes: number; sampleName: string; }
  interface EventMonth { month: string; events: StorageEvent[]; }
  interface EventYear { year: string; months: EventMonth[]; }
  const [eventsTree, setEventsTree] = useState<EventYear[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Usage analytics state
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [hoveredUsageCategory, setHoveredUsageCategory] = useState<string | null>(null);

  // Superadmin dashboard state
  interface AdminUser {
    id: string; email: string; name: string | null; mobileNumber?: string; avatarUrl?: string | null;
    role: string; isActive: boolean;
    createdAt: string; lastLogin: string | null; usedBytes: number; quotaBytes: number;
    percentUsed: number; fileCount: number; folderCount: number;
  }
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [quotaEditUserId, setQuotaEditUserId] = useState<string | null>(null);
  const [quotaEditValue, setQuotaEditValue] = useState('');
  const [quotaEditUnit, setQuotaEditUnit] = useState<'B' | 'KB' | 'MB' | 'GB'>('GB');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  
  // Admin Change Password State
  const [showAdminChangePasswordModal, setShowAdminChangePasswordModal] = useState(false);
  const [adminChangePasswordUserId, setAdminChangePasswordUserId] = useState('');
  const [adminChangePasswordEmail, setAdminChangePasswordEmail] = useState('');
  const [adminChangePasswordNew, setAdminChangePasswordNew] = useState('');
  const [isAdminChangingPassword, setIsAdminChangingPassword] = useState(false);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDraggingFileOverPage, setIsDraggingFileOverPage] = useState(false);
  const pageDragCounter = useRef(0);

  // Touch-based drag-to-move — the native HTML5 draggable/dragstart/dragover/drop
  // events above are mouse-only (no touch browser fires them from a finger drag),
  // so touchscreens need their own long-press-then-drag path onto the same
  // draggedItemId/dragOverFolderId state the mouse path uses (for shared highlight
  // styling) and the same moveItem() call for the actual API request.
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDragOverFolderIdRef = useRef<string | null>(null);
  const touchSuppressClickRef = useRef(false);
  const TOUCH_LONG_PRESS_MS = 350;
  const TOUCH_MOVE_CANCEL_PX = 10;

  // Modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetItems, setMoveTargetItems] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalItem, setTagModalItem] = useState<StorageItem | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<StorageItem[]>([]);
  const [moveDestId, setMoveDestId] = useState<string | null>(null);

  // Modal / Input state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [renameItemName, setRenameItemName] = useState('');

  // Note editor state
  const [editorNote, setEditorNote] = useState<StorageItem | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCharCount, setEditorCharCount] = useState(0);
  const [editorVersionTime, setEditorVersionTime] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: editorContent || EMPTY_NOTE_DOC,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
      setEditorCharCount(editor.getText().replace(/\n/g, '').length);
    },
  });

  useEffect(() => {
    if (editorNote && editor) {
      if (editor.getHTML() !== editorContent) {
        // A brand-new note's content is '' (both the DB row and this state) —
        // ProseMirror's schema requires at least one block node, so handing
        // setContent a bare empty string parses to a doc with no paragraph at
        // all, leaving no valid place for the cursor to land. That's what
        // showed up as an uneditable blank box right after creating a note.
        editor.commands.setContent(editorContent || EMPTY_NOTE_DOC);
      }
    }
  }, [editorNote, editor]);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const handleTriggerClearNote = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Note Content',
      description: 'Are you sure you want to erase all content from this note? This action cannot be undone.',
      confirmText: 'Clear Content',
      danger: true,
      onConfirm: () => {
        setEditorContent('');
        setEditorCharCount(0);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTriggerDelete = (item: StorageItem) => {
    setConfirmModal({
      isOpen: true,
      title: sidebarTab === 'trash' ? 'Delete Permanently' : 'Move to Trash',
      description: sidebarTab === 'trash'
        ? `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`
        : `Are you sure you want to move "${item.name}" to the trash?`,
      confirmText: sidebarTab === 'trash' ? 'Delete Permanently' : 'Move to Trash',
      danger: true,
      onConfirm: () => {
        deleteItem(item);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTriggerBulkDelete = () => {
    if (selectedItems.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: sidebarTab === 'trash' ? 'Delete Selected Permanently' : 'Move Selected to Trash',
      description: sidebarTab === 'trash'
        ? `Are you sure you want to permanently delete all ${selectedItems.size} selected items? This action cannot be undone.`
        : `Are you sure you want to move all ${selectedItems.size} selected items to the trash?`,
      confirmText: sidebarTab === 'trash' ? 'Delete Permanently' : 'Move to Trash',
      danger: true,
      onConfirm: async () => {
        await bulkDelete();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Excalidraw State (Diagrams)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [diagramName, setDiagramName] = useState('');
  const [editorDiagramId, setEditorDiagramId] = useState<string | null>(null);
  const [isDiagramEditing, setIsDiagramEditing] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const groupedUsageCategories = useMemo(
    () => usageData ? groupUsageCategories(usageData.categories, isDarkMode) : [],
    [usageData, isDarkMode]
  );
  // Excalidraw's own toolbar/icons are a fixed size regardless of screen — this scales the
  // whole widget's UI down via CSS zoom (not transform, which would misalign click/draw
  // coordinates from what's visually shown). Persisted so it's a one-time setup per browser.
  const [diagramUiScale, setDiagramUiScale] = useState(() => {
    if (typeof window === 'undefined') return 0.8;
    const stored = parseFloat(localStorage.getItem('storage_diagram_ui_scale') || '');
    return Number.isFinite(stored) && stored >= 0.5 && stored <= 1 ? stored : 0.8;
  });
  const adjustDiagramUiScale = (delta: number) => {
    setDiagramUiScale((prev) => {
      const next = Math.round(Math.min(1, Math.max(0.5, prev + delta)) * 100) / 100;
      localStorage.setItem('storage_diagram_ui_scale', String(next));
      return next;
    });
  };

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const openDiagramEditor = async (diagram: StorageItem) => {
    try {
      toast.loading('Loading diagram...', { id: 'diagram-load' });
      const res = await apiFetch(`${API_BASE}/api/storage/text/${diagram.id}`);
      const json = await res.json();
      
      if (json.success) {
        const text = json.data.content || '';
        try {
          const parsed = JSON.parse(text);
          if (excalidrawAPI) {
            excalidrawAPI.updateScene({
              elements: parsed.elements,
              appState: parsed.appState,
            });
            if (parsed.files) {
              excalidrawAPI.addFiles(Object.values(parsed.files));
            }
          }
          setEditorDiagramId(diagram.id);
          setIsDiagramEditing(false);
          setDiagramName(diagram.name.replace('.excalidraw', ''));
          setSidebarTab('diagrams');
          toast.dismiss('diagram-load');
        } catch (err) {
          toast.error('Invalid diagram file format', { id: 'diagram-load' });
        }
      } else {
        toast.error(json.message, { id: 'diagram-load' });
      }
    } catch (e) {
      toast.error('Could not fetch diagram content', { id: 'diagram-load' });
    }
  };

  const saveDiagramToVault = async () => {
    if (!excalidrawAPI) return;
    if (!diagramName.trim()) {
      toast.error('Please enter a name for your diagram');
      return;
    }

    const finalName = diagramName.trim().endsWith('.excalidraw') ? diagramName.trim() : `${diagramName.trim()}.excalidraw`;

    if (!editorDiagramId) {
      const isDuplicate = items.some(item =>
        item.parent_id === currentFolderId && item.name.toLowerCase() === finalName.toLowerCase()
      );

      if (isDuplicate) {
        toast.error(`A file named "${finalName}" already exists. Please choose a different name.`);
        return;
      }
    }

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const content = JSON.stringify({
        type: "excalidraw",
        version: 2,
        source: "antigravity-vault",
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemFontFamily: appState.currentItemFontFamily,
        },
        files
      });

      toast.info(`Saving "${finalName}"...`);
      
      if (editorDiagramId) {
        // Update existing
        const res = await apiFetch(`${API_BASE}/api/storage/text`, {
          method: 'PUT',
          body: JSON.stringify({ id: editorDiagramId, name: finalName, content, mimeType: 'application/excalidraw' }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        toast.success('Diagram updated successfully!');
        loadStorageItems(); // refresh list
      } else {
        const file = new File([content], finalName, { type: 'application/excalidraw' });
        await initiateMultipartUpload(file, currentFolderId);
        toast.success('Diagram uploaded and saved to secure vault!');
        setDiagramName('');
        excalidrawAPI.resetScene();
      }
    } catch (err) {
      toast.error('Failed to save diagram');
    }
  };

  // Upload state
  const [uploadsList, setUploadsList] = useState<UploadTracker[]>([]);
  const activeUploadsRef = useRef<UploadTracker[]>([]);
  // Guard against React StrictMode double-mount clearing the activation flag
  const hasVerified = useRef(false);
  // Same StrictMode-double-mount guard, for consuming a Google OAuth return exchange code
  const hasHandledOAuthReturn = useRef(false);
  const hasHandledResetLink = useRef(false);
  // Synchronous guard against a fast double-click/double-tap on either logout control
  // (the header's dedicated logout button and the separate "Exit Vault" back-arrow both
  // call handleLogout) — React state is batched/async, so relying on isLoggingOut state
  // alone still lets two near-simultaneous clicks both read "not logging out yet" before
  // either setState commits. A ref is checked/set synchronously, closing that window.
  const isLoggingOutRef = useRef(false);



  // Fetch API headers
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // Custom fetch wrapper to handle 401 token refresh automatically
  const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const currentToken = localStorage.getItem('storage_token');
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let res = await window.fetch(url, { ...options, headers });

    if (res.status === 401) {
      const refreshToken = localStorage.getItem('storage_refresh_token');
      if (!refreshToken) {
        silentLocalLogout();
        return res;
      }

      try {
        const refreshRes = await window.fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        const refreshJson = await refreshRes.json();

        if (refreshRes.ok && refreshJson.success) {
          const newAccess = refreshJson.data.accessToken;
          const newRefresh = refreshJson.data.refreshToken;
          localStorage.setItem('storage_token', newAccess);
          localStorage.setItem('storage_refresh_token', newRefresh);
          setToken(newAccess);
          
          headers.set('Authorization', `Bearer ${newAccess}`);
          res = await window.fetch(url, { ...options, headers });
        } else {
          silentLocalLogout();
        }
      } catch (err) {
        silentLocalLogout();
      }
    }

    return res;
  };

  // Prevent copy pasting on password fields
  const pasteLastToastRef = useRef<number>(0);
  const handlePreventPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (now - pasteLastToastRef.current > 5000) {
      toast.error('Security Protocol: Password pasting is disabled.');
      pasteLastToastRef.current = now;
    }
  };

  // Shared by password login, register, and the Google OAuth exchange handler —
  // stores the session the same way everywhere so every entry point behaves identically.
  const applyAuthSession = (data: { accessToken: string; refreshToken?: string; user: any }) => {
    const { accessToken, refreshToken, user } = data;
    localStorage.setItem('storage_token', accessToken);
    if (refreshToken) localStorage.setItem('storage_refresh_token', refreshToken);
    localStorage.setItem('storage_email', user.email);
    localStorage.setItem('storage_name', user.name || user.email);
    localStorage.setItem('storage_role', user.role || 'user');
    setToken(accessToken);
    setUserEmail(user.email);
    setUserName(user.name || user.email);
    setUserRole(user.role || 'user');
  };

  // Login callback
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!password) {
      toast.error('Password is required.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Login failed. Please check credentials.');
      }

      applyAuthSession(json.data);
      toast.success(`Welcome back, ${json.data.user.name || json.data.user.email}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register callback
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      toast.error('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!password) {
      toast.error('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: registerName.trim(), mobileNumber: registerMobile.trim() || undefined }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Registration failed.');
      }

      applyAuthSession(json.data);
      toast.success(`Registered successfully! Welcome, ${json.data.user.name || json.data.user.email}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Forgot Password callback
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Account Email is required.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Request failed.');
      }

      toast.success(json.message || 'Password reset requested!');
      setAuthMode('reset');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Reset Password callback
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Account Email is required.');
      return;
    }
    if (!resetToken.trim()) {
      toast.error('Reset Token is required.');
      return;
    }
    if (!newPassword) {
      toast.error('New Password is required.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Password reset failed.');
      }

      toast.success('Password reset successfully! Please login.');
      setAuthMode('login');
      setPassword('');
      setNewPassword('');
      setResetToken('');
      setGeneratedToken('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Silent local-only cleanup — used when token is already expired/invalid (no API call)
  const silentLocalLogout = () => {
    localStorage.removeItem('storage_token');
    localStorage.removeItem('storage_refresh_token');
    localStorage.removeItem('storage_email');
    localStorage.removeItem('storage_name');
    localStorage.removeItem('storage_role');
    setToken(null);
    setUserEmail('');
    setUserName('');
    setUserRole('');
    setItems([]);
    setFolderPath([]);
    setCurrentFolderId(null);
    setUsageData(null);
    setSelectedItems(new Set());
    // Everything below is per-session fetched data that must not survive into a
    // different user's session in the same tab — sidebarTab is plain UI state
    // (not re-derived from the server on login) and adminUsers in particular can
    // hold another account's email/quota/role data that was fetched while a
    // superadmin was logged in. See the sidebarTab==='admin' render guard too.
    setSidebarTab('files');
    setAvatarUrl(null);
    setAdminUsers([]);
    setEventsTree([]);
    setUploadsList([]);
    setActiveMobileLinks([]);
  };

  // Logout callback — calls API then cleans up locally
  const handleLogout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    try {
      await apiFetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      // Silently fall back to UI logout anyway
    }
    silentLocalLogout();
    toast.success('Logged out successfully');
    isLoggingOutRef.current = false;
    setIsLoggingOut(false);
  };

  // Refresh list (with advanced filters)
  const loadStorageItems = async () => {
    setIsLoadingItems(true);
    try {
      let url = `${API_BASE}/api/storage?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (currentFolderId && sidebarTab === 'files') url += `&parentId=${currentFolderId}`;
      if (sidebarTab === 'trash') url += '&trash=true';
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterDateFrom) url += `&dateFrom=${encodeURIComponent(filterDateFrom)}`;
      if (filterDateTo) url += `&dateTo=${encodeURIComponent(filterDateTo)}`;
      if (filterMimeCategories.length > 0) url += `&mimeCategory=${filterMimeCategories.join(',')}`;
      if (filterTag) url += `&tag=${encodeURIComponent(filterTag)}`;

      const res = await apiFetch(url, { headers: getHeaders() });
      const json = await res.json();

      if (res.status === 401) {
        silentLocalLogout();
        return;
      }

      if (json.success) {
        let itemsList = json.data.items as StorageItem[];
        if (sidebarTab === 'notes') {
          itemsList = itemsList.filter((item) => item.type === 'file' && item.mime_type === 'text/plain');
        }
        setItems(itemsList);
      }
    } catch (err: any) {
      console.error('Failed to load storage items', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Fetch usage analytics
  const fetchUsage = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/usage`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) setUsageData(json.data);
    } catch (e) { /* silent */ }
  };

  // Fetch auto-clustered event hierarchy (Year > Month > Event)
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/events`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setEventsTree(json.data.years);
        // Expand the most recent year/month by default
        if (json.data.years.length > 0) {
          setExpandedYears(new Set([json.data.years[0].year]));
          if (json.data.years[0].months.length > 0) {
            setExpandedMonths(new Set([`${json.data.years[0].year}-${json.data.years[0].months[0].month}`]));
          }
        }
      }
    } catch (e) { /* silent */ } finally {
      setIsLoadingEvents(false);
    }
  };

  // Drill into an event: filter the file view to that event's time range
  const openEvent = (ev: StorageEvent) => {
    setFilterDateFrom(ev.start.slice(0, 10));
    const endDate = new Date(ev.end);
    endDate.setDate(endDate.getDate() + 1); // dateTo filter is inclusive of the day
    setFilterDateTo(endDate.toISOString().slice(0, 10));
    setFilterMimeCategories([]);
    setFilterTag('');
    setCurrentFolderId(null);
    setFolderPath([]);
    setSidebarTab('files');
  };

  // --- Profile section ------------------------------------------------------
  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB — mirrors the server-side limit

  const fetchProfile = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/profile`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setAvatarUrl(json.data.avatarUrl);
        setProfileNameInput(json.data.name || '');
        setProfileMobileInput(json.data.mobileNumber || '');
      }
    } catch (e) { /* silent */ }
  };

  const openProfileModal = () => {
    setProfileNameInput(userName || '');
    setProfileMobileInput('');
    setProfileCurrentPassword('');
    setProfileNewPassword('');
    setProfileConfirmPassword('');
    setProfileOtp('');
    setOtpSentAt(null);
    setOtpCooldownRemaining(0);
    setShowProfileModal(true);
    fetchProfile();
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    // Client-side pre-check only — a UX convenience, not a security boundary.
    // The server re-validates size, declared type, magic bytes, and scans content
    // regardless of what the browser claims here.
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Profile picture must be a JPEG, PNG, GIF, or WEBP image');
      return false;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Profile picture exceeds the 5MB size limit');
      return false;
    }

    setIsUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await apiFetch(`${API_BASE}/api/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        setAvatarUrl(json.data.avatarUrl);
        toast.success('Profile picture updated');
        return true;
      } else {
        toast.error(json.message || 'Failed to upload profile picture');
        return false;
      }
    } catch (e) {
      toast.error('Failed to upload profile picture');
      return false;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveEditedAvatar = async (blob: Blob) => {
    const file = new File([blob], 'avatar.png', { type: 'image/png' });
    const success = await uploadAvatar(file);
    if (success) setShowAvatarEditor(false);
  };

  const removeAvatar = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/profile/avatar`, { method: 'DELETE', headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setAvatarUrl(null);
        toast.success('Profile picture removed');
      } else {
        toast.error(json.message || 'Failed to remove profile picture');
      }
    } catch (e) {
      toast.error('Failed to remove profile picture');
    }
  };

  const saveProfileName = async () => {
    if (!profileNameInput.trim()) { toast.error('Name cannot be empty'); return; }
    setIsSavingName(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: profileNameInput.trim(), mobileNumber: profileMobileInput.trim() || '' }),
      });
      const json = await res.json();
      if (json.success) {
        setUserName(json.data.name);
        localStorage.setItem('storage_name', json.data.name);
        toast.success('Profile updated');
      } else {
        toast.error(json.message || 'Failed to update profile');
      }
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingName(false);
    }
  };

  const changeProfilePassword = async () => {
    if (!profileCurrentPassword || !profileNewPassword) { toast.error('Fill in both password fields'); return; }
    if (profileNewPassword !== profileConfirmPassword) { toast.error('New passwords do not match'); return; }
    if (profileNewPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }

    setIsChangingPassword(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword: profileCurrentPassword, newPassword: profileNewPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Password updated. Please log in again.');
        setProfileCurrentPassword('');
        setProfileNewPassword('');
        setProfileConfirmPassword('');
        setShowProfileModal(false);
        silentLocalLogout();
      } else {
        toast.error(json.message || 'Failed to change password');
      }
    } catch (e) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const sendSuperadminPasswordOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/superadmin/request-password-otp`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Verification code sent to your email');
        setOtpSentAt(Date.now());
        setOtpCooldownRemaining(30);
      } else if (res.status === 429) {
        toast.error(json.message || 'Too many requests — please wait before trying again');
        setOtpCooldownRemaining(30);
      } else {
        toast.error(json.message || 'Failed to send verification code');
      }
    } catch (e) {
      toast.error('Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const changeSuperadminPasswordWithOtp = async () => {
    if (!profileOtp || profileOtp.length !== 6) { toast.error('Enter the 6-digit code from your email'); return; }
    if (!profileNewPassword) { toast.error('Enter a new password'); return; }
    if (profileNewPassword !== profileConfirmPassword) { toast.error('New passwords do not match'); return; }
    if (profileNewPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }

    setIsVerifyingOtp(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/superadmin/change-password-otp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ otp: profileOtp, newPassword: profileNewPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Password updated. Please log in again.');
        setProfileOtp('');
        setProfileNewPassword('');
        setProfileConfirmPassword('');
        setOtpSentAt(null);
        setShowProfileModal(false);
        silentLocalLogout();
      } else {
        toast.error(json.message || 'Failed to change password');
      }
    } catch (e) {
      toast.error('Failed to change password');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const deactivateOwnAccount = async () => {
    setIsDeactivating(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/profile/deactivate`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to deactivate account');
      toast.success('Your account has been deactivated.');
      silentLocalLogout();
      localStorage.removeItem('storage_refresh_token');
      setShowProfileModal(false);
      setShowDeactivateConfirm(false);
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  // --- Superadmin dashboard -----------------------------------------------
  const fetchAdminUsers = async () => {
    setIsLoadingAdminUsers(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/backoffice/users`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) setAdminUsers(json.data.users);
      else toast.error(json.message || 'Failed to load users');
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  const setUserActiveStatus = async (userId: string, isActive: boolean) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/backoffice/users/${userId}/active`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isActive ? 'User activated' : 'User deactivated');
        fetchAdminUsers();
      } else {
        toast.error(json.message || 'Failed to update user status');
      }
    } catch (e) {
      toast.error('Failed to update user status');
    }
  };

  // Client-side cooldown on the superadmin OTP "Resend code" button — the server
  // already rate-limits the endpoint itself (authRateLimit), this just keeps the
  // button from firing requests it knows will be rejected in the meantime.
  useEffect(() => {
    if (otpCooldownRemaining <= 0) return;
    const t = setTimeout(() => setOtpCooldownRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldownRemaining]);

  // Live countdown for the mobile-upload QR link's expiry, shown in the scan modal
  useEffect(() => {
    if (!showMobileScanModal || !generatedMobileTTL) return;

    const tick = () => {
      const msLeft = new Date(generatedMobileTTL).getTime() - Date.now();
      if (msLeft <= 0) {
        setMobileLinkRemaining('Expired');
        return;
      }
      const totalSeconds = Math.floor(msLeft / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setMobileLinkRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showMobileScanModal, generatedMobileTTL]);

  // While the QR scan modal is open, poll for the moment a phone actually opens the
  // link — flips the modal into a "connected" state and announces it with a toast,
  // the way a screen-mirroring app would when a device joins.
  useEffect(() => {
    if (!showMobileScanModal || !generatedMobileToken) return;

    const poll = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/api/storage/mobile-links`, { headers: getHeaders() });
        const json = await res.json();
        if (!json.success) return;
        const link = (json.data || []).find((l: any) => l.token === generatedMobileToken);
        if (link?.connected_at && link.device_label) {
          setConnectedMobileDevice((prev) => {
            if (prev) return prev;
            toast.success(`${link.device_label} connected`, { description: 'Ready to receive files' });
            return { label: link.device_label, type: link.device_type || 'mobile' };
          });
        }
      } catch (err) {
        // Silent — background poll
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [showMobileScanModal, generatedMobileToken]);

  // Mobile Scan Management
  const generateMobileUploadLink = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/mobile-links/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ folderId: currentFolderId })
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedMobileToken(json.data.token);
        setGeneratedMobileTTL(json.data.expiresAt);
        setConnectedMobileDevice(null);
        setShowMobileScanModal(true);
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error('Failed to generate mobile link');
    }
  };

  const loadActiveMobileLinks = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/mobile-links`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) setActiveMobileLinks(json.data);
    } catch (e) {}
  };

  const openManageLinksModal = () => {
    loadActiveMobileLinks();
    setShowManageLinksModal(true);
  };

  const revokeMobileLink = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/mobile-links/revoke/${id}`, { method: 'POST', headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        toast.success('Link revoked successfully');
        loadActiveMobileLinks();
      }
    } catch (e) {}
  };

  const saveUserQuota = async (userId: string) => {
    const amount = parseFloat(quotaEditValue);
    if (!amount || amount <= 0) { toast.error(`Enter a valid quota in ${quotaEditUnit}`); return; }
    try {
      const res = await apiFetch(`${API_BASE}/api/backoffice/users/${userId}/quota`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ quotaBytes: Math.round(amount * QUOTA_UNIT_BYTES[quotaEditUnit]) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Quota updated');
        setQuotaEditUserId(null);
        fetchAdminUsers();
      } else {
        toast.error(json.message || 'Failed to update quota');
      }
    } catch (e) {
      toast.error('Failed to update quota');
    }
  };

  const deleteUserAccount = async (userId: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/backoffice/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('User and all associated storage deleted');
        setDeleteConfirmUser(null);
        fetchAdminUsers();
      } else {
        toast.error(json.message || 'Failed to delete user');
      }
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  const openAdminChangePasswordModal = (user: AdminUser) => {
    setAdminChangePasswordUserId(user.id);
    setAdminChangePasswordEmail(user.email);
    setAdminChangePasswordNew('');
    setShowAdminChangePasswordModal(true);
  };

  const submitAdminChangePassword = async () => {
    if (!adminChangePasswordNew || adminChangePasswordNew.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsAdminChangingPassword(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/backoffice/users/${adminChangePasswordUserId}/password`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword: adminChangePasswordNew })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Password changed successfully');
        setShowAdminChangePasswordModal(false);
      } else {
        toast.error(json.message || 'Failed to change password');
      }
    } catch (e) {
      toast.error('Failed to change password');
    } finally {
      setIsAdminChangingPassword(false);
    }
  };

  // Share file — generate 10-min presigned URL
  const shareFile = async (item: StorageItem) => {
    setShareLoadingId(item.id);
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/share/${item.id}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        await navigator.clipboard.writeText(json.data.shareUrl);
        toast.success('Share link copied! Valid for 10 minutes.');
      } else {
        toast.error(json.message || 'Failed to generate share link');
      }
    } catch (e) {
      toast.error('Failed to generate share link');
    } finally {
      setShareLoadingId(null);
    }
  };

  // Move item to a new parent folder
  const moveItem = async (itemId: string, newParentId: string | null) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/move`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id: itemId, newParentId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Item moved successfully');
        loadStorageItems();
      } else {
        toast.error(json.message || 'Failed to move item');
      }
    } catch (e) {
      toast.error('Failed to move item');
    }
  };

  // Move multiple selected items
  const moveSelectedItems = async (newParentId: string | null) => {
    const ids = moveTargetItems.length > 0 ? moveTargetItems : Array.from(selectedItems);
    await Promise.all(ids.map(id => moveItem(id, newParentId)));
    setShowMoveModal(false);
    setMoveTargetItems([]);
    setSelectedItems(new Set());
    setIsSelecting(false);
  };

  // Tag item
  const saveTagsForItem = async (item: StorageItem, tags: string[]) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/tag`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id: item.id, tags }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Tags saved');
        setShowTagModal(false);
        setTagModalItem(null);
        loadStorageItems();
      } else {
        toast.error(json.message);
      }
    } catch (e) {
      toast.error('Failed to save tags');
    }
  };

  // Fetch all folders for move modal
  const fetchAllFolders = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage?sortBy=name&sortOrder=asc`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setAllFolders(json.data.items.filter((i: StorageItem) => i.type === 'folder'));
      }
    } catch (e) { /* silent */ }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: StorageItem) => {
    setDraggedItemId(item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    pageDragCounter.current = 0;
    setIsDraggingFileOverPage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // OS files dropped directly onto a folder card upload straight into that folder
      uploadFileList(e.dataTransfer.files, folderId);
    } else if (draggedItemId && draggedItemId !== folderId) {
      await moveItem(draggedItemId, folderId);
    }
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverFolderId(null);
  };

  // Touch drag-and-drop (long-press an item, drag onto a folder card, release to move)
  const cancelTouchLongPress = () => {
    if (touchLongPressTimerRef.current) {
      clearTimeout(touchLongPressTimerRef.current);
      touchLongPressTimerRef.current = null;
    }
  };

  const handleItemTouchStart = (e: React.TouchEvent, item: StorageItem) => {
    if (sidebarTab === 'trash' || isSelecting || e.touches.length === 0) return;
    const touch = e.touches[0];
    touchDragStartRef.current = { x: touch.clientX, y: touch.clientY };
    cancelTouchLongPress();
    touchLongPressTimerRef.current = setTimeout(() => {
      touchLongPressTimerRef.current = null;
      touchSuppressClickRef.current = true;
      setDraggedItemId(item.id);
      setIsTouchDragging(true);
    }, TOUCH_LONG_PRESS_MS);
  };

  // Cancels the pending long-press if the finger moves enough before it fires —
  // that reads as the start of a normal scroll/swipe, not a drag-hold, and a
  // scroll must not get eaten by an about-to-fire drag.
  const handleItemTouchMoveBeforeDrag = (e: React.TouchEvent) => {
    if (!touchLongPressTimerRef.current || e.touches.length === 0) return;
    const start = touchDragStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - start.x) > TOUCH_MOVE_CANCEL_PX || Math.abs(touch.clientY - start.y) > TOUCH_MOVE_CANCEL_PX) {
      cancelTouchLongPress();
    }
  };

  useEffect(() => {
    if (!isTouchDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      // Only takes over scrolling once a drag has actually engaged (after the
      // long-press fires) — by then the finger hasn't moved enough to have
      // started a native scroll gesture yet, so this is safe to suppress.
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const folderEl = target?.closest('[data-drop-folder-id]') as HTMLElement | null;
      const folderId = folderEl?.dataset.dropFolderId ?? null;
      const resolved = folderId && folderId !== draggedItemId ? folderId : null;
      touchDragOverFolderIdRef.current = resolved;
      setDragOverFolderId(resolved);
    };

    const finishTouchDrag = async () => {
      setIsTouchDragging(false);
      const targetFolderId = touchDragOverFolderIdRef.current;
      const itemId = draggedItemId;
      setDragOverFolderId(null);
      setDraggedItemId(null);
      touchDragOverFolderIdRef.current = null;
      if (targetFolderId && itemId && targetFolderId !== itemId) {
        await moveItem(itemId, targetFolderId);
      }
      // Clears just after this gesture's own synthetic click has had a chance
      // to fire and be suppressed, so the very next real tap isn't swallowed.
      setTimeout(() => { touchSuppressClickRef.current = false; }, 50);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', finishTouchDrag);
    window.addEventListener('touchcancel', finishTouchDrag);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', finishTouchDrag);
      window.removeEventListener('touchcancel', finishTouchDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTouchDragging]);

  // Swallows the phantom click a touchend fires right after a long-press drag
  // completes, so releasing on a folder doesn't also navigate into it.
  const consumeTouchDragClick = () => {
    if (touchSuppressClickRef.current) {
      touchSuppressClickRef.current = false;
      return true;
    }
    return false;
  };

  // OS-level drag-and-drop upload (dragging files from the desktop onto the page)
  const handlePageDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    pageDragCounter.current += 1;
    setIsDraggingFileOverPage(true);
  };

  const handlePageDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    pageDragCounter.current = Math.max(0, pageDragCounter.current - 1);
    if (pageDragCounter.current === 0) setIsDraggingFileOverPage(false);
  };

  const handlePageDrop = (e: React.DragEvent, targetParentId: string | null = currentFolderId) => {
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    pageDragCounter.current = 0;
    setIsDraggingFileOverPage(false);
    uploadFileList(e.dataTransfer.files, targetParentId);
  };

  // Toggle item selection
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Bulk delete selected items
  const bulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const ids = Array.from(selectedItems);
    await Promise.all(ids.map(id => {
      const item = items.find(i => i.id === id);
      if (item) return deleteItem(item);
    }));
    setSelectedItems(new Set());
    setIsSelecting(false);
  };

  // Create folder callback
  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const res = await apiFetch(`${API_BASE}/api/storage/folder`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Created folder "${newFolderName}"`);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        loadStorageItems();
      } else {
        toast.error(json.message);
      }
    } catch (err: any) {
      toast.error('Failed to create folder');
    }
  };

  // Rename callback
  const renameItem = async () => {
    if (!renameItemName.trim() || !renameItemId) return;

    try {
      const res = await apiFetch(`${API_BASE}/api/storage/folder`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          id: renameItemId,
          name: renameItemName,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Item renamed successfully');
        setRenameItemId(null);
        setRenameItemName('');
        loadStorageItems();
      } else {
        toast.error(json.message);
      }
    } catch (err: any) {
      toast.error('Failed to rename item');
    }
  };

  // Delete callback
  const deleteItem = async (item: StorageItem) => {
    try {
      const endpoint = item.type === 'folder' ? 'folder' : 'file';
      const idParam = item.type === 'folder' ? `?id=${item.id}` : `/${item.id}`;

      const res = await apiFetch(`${API_BASE}/api/storage/${endpoint}${idParam}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Item deleted successfully');
        loadStorageItems();
        fetchUsage();
      } else {
        toast.error(json.message);
      }
    } catch (err: any) {
      toast.error('Failed to delete item');
    }
  };

  // Restore callback
  const restoreItem = async (item: StorageItem) => {
    try {
      const res = await apiFetch(`${API_BASE}/api/storage/restore`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ id: item.id }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Item restored from trash');
        loadStorageItems();
        fetchUsage();
      } else {
        toast.error(json.message || 'Failed to restore item');
      }
    } catch (err: any) {
      toast.error('Failed to restore item');
    }
  };

  // Navigation callbacks
  const navigateToFolder = (folder: StorageItem) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const navigateBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const path = folderPath.slice(0, index + 1);
      setFolderPath(path);
      setCurrentFolderId(path[path.length - 1].id);
    }
  };

  // Create text/markdown note callback
  const triggerNewNote = () => {
    setNewNoteTitle('');
    setShowNewNoteModal(true);
  };

  const createNewNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('Note title is required');
      return;
    }
    const title = newNoteTitle.trim();
    const finalName = title.endsWith('.txt') ? title : `${title}.txt`;

    const isDuplicate = items.some(item =>
      item.parent_id === currentFolderId && item.name.toLowerCase() === finalName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`A file named "${finalName}" already exists. Please choose a different name.`);
      return;
    }

    setShowNewNoteModal(false);

    try {
      const res = await apiFetch(`${API_BASE}/api/storage/text`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: title.endsWith('.txt') ? title : `${title}.txt`,
          content: '',
          parentId: currentFolderId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Note created');
        loadStorageItems();
        // Automatically open the editor
        openNoteEditor(json.data);
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

  // Note editor control
  const openNoteEditor = async (note: StorageItem) => {
    try {
      toast.loading('Fetching note content...', { id: 'note-load' });
      const res = await apiFetch(`${API_BASE}/api/storage/text/${note.id}`, {
        headers: getHeaders(),
      });
      const json = await res.json();

      if (json.success) {
        // We now get the content directly from the backend
        const text = json.data.content || '';

        setEditorNote(note);
        setEditorTitle(note.name);
        setEditorContent(text);
        setEditorCharCount(text.replace(/<[^>]*>/g, '').length);
        setEditorVersionTime(new Date(note.updated_at).toLocaleString());
        editor?.commands.setContent(text || EMPTY_NOTE_DOC);
        toast.dismiss('note-load');
      } else {
        toast.error(json.message, { id: 'note-load' });
      }
    } catch (e) {
      toast.error('Could not fetch note content', { id: 'note-load' });
    }
  };

  const saveNoteContent = async (isAuto = false) => {
    if (!editorNote) return;
    setIsSavingNote(true);

    try {
      const res = await apiFetch(`${API_BASE}/api/storage/text`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          id: editorNote.id,
          content: editorContent,
          name: editorTitle,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditorVersionTime(new Date().toLocaleString());
        if (!isAuto) {
          toast.success('Note saved successfully');
        }
      }
    } catch (err) {
      if (!isAuto) {
        toast.error('Failed to save note');
      }
    } finally {
      setIsSavingNote(false);
    }
  };

  const closeNoteEditor = () => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    saveNoteContent(true); // Final save
    setEditorNote(null);
    loadStorageItems();
  };

  // AWS S3 Multipart Upload Center
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFileList(files, currentFolderId);
    // Clear selection
    e.target.value = '';
  };

  // Shared entrypoint for both the file picker and OS drag-and-drop uploads
  const uploadFileList = (files: FileList | File[], targetParentId: string | null) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      initiateMultipartUpload(file, targetParentId);
    }
  };

  const initiateMultipartUpload = async (file: File, targetParentId: string | null = currentFolderId) => {
    const id = uuidv4();
    // S3 allows at most 10,000 parts per upload, so the chunk size must scale
    // with file size to support files up to 1TB (a fixed 5MB chunk caps out ~48GB).
    const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB AWS minimum part size
    const MAX_PARTS = 10000;
    const CHUNK_SIZE = Math.max(MIN_CHUNK_SIZE, Math.ceil(file.size / MAX_PARTS));
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

    // Build chunks
    const chunks = [];
    for (let j = 0; j < totalChunks; j++) {
      const start = j * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        partNumber: j + 1,
        start,
        end,
        status: 'pending' as const,
        progress: 0,
      });
    }

    const tracker: UploadTracker = {
      id,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
      parentId: targetParentId,
      chunks,
    };

    setUploadsList((prev) => [tracker, ...prev]);

    try {
      // Step 1: Start Multipart Upload API
      const startRes = await apiFetch(`${API_BASE}/api/storage/upload/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          parentId: targetParentId,
        }),
      });

      const startJson = await startRes.json();
      if (!startJson.success) {
        throw new Error(startJson.message || 'Failed to start upload session');
      }

      const { uploadId, s3Key } = startJson.data;

      // Update tracker variables
      setUploadsList((prev) =>
        prev.map((up) => (up.id === id ? { ...up, uploadId, s3Key } : up))
      );

      // Start processing chunks
      processChunks(id, file, uploadId, s3Key, chunks);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
      setUploadsList((prev) =>
        prev.map((up) => (up.id === id ? { ...up, status: 'failed' } : up))
      );
    }
  };

  // Parallel Chunk Upload scheduler
  const processChunks = async (trackerId: string, file: File, uploadId: string, s3Key: string, chunks: UploadTracker['chunks']) => {
    const CONCURRENCY = 3; // Upload 3 chunks in parallel max

    // `chunks` is the single source of truth for control flow (claiming/completing
    // parts). It's a plain mutable array shared by closure across every concurrent
    // uploadNextChunk() call, so status changes are visible synchronously — unlike
    // activeUploadsRef, which only re-syncs after a React render + effect cycle and
    // would otherwise go stale mid-upload and stall the whole transfer forever.
    const updateUiChunks = () => {
      setUploadsList((prev) =>
        prev.map((up) => {
          if (up.id !== trackerId) return up;
          const snapshotChunks = chunks.map((c) => ({ ...c }));
          const sumProgress = snapshotChunks.reduce((acc, c) => acc + c.progress, 0);
          const totalProgress = Math.round(sumProgress / snapshotChunks.length);
          return { ...up, progress: totalProgress, chunks: snapshotChunks };
        })
      );
    };

    const uploadNextChunk = async () => {
      // Only the overall tracker status (paused/cancelled) needs the React-synced ref
      const tracker = activeUploadsRef.current.find((up) => up.id === trackerId);
      if (!tracker || tracker.status !== 'uploading') return;

      const nextPending = chunks.find((c) => c.status === 'pending');
      if (!nextPending) {
        // Check if all chunks completed
        const allDone = chunks.every((c) => c.status === 'completed');
        const anyFailed = chunks.some((c) => c.status === 'failed');

        if (allDone) {
          completeUpload(trackerId, file, uploadId, s3Key, chunks);
        } else if (anyFailed) {
          setUploadsList((prev) =>
            prev.map((up) => (up.id === trackerId ? { ...up, status: 'failed' } : up))
          );
        }
        return;
      }

      // Mark chunk as uploading
      nextPending.status = 'uploading';
      const controller = new AbortController();
      nextPending.controller = controller;
      updateUiChunks();

      try {
        // Step 2: Request presigned chunk upload URL
        const urlRes = await apiFetch(`${API_BASE}/api/storage/upload/part`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            uploadId,
            s3Key,
            partNumber: nextPending.partNumber,
          }),
        });

        const urlJson = await urlRes.json();
        if (!urlJson.success) throw new Error('Could not get part presigned URL');

        const uploadUrl = urlJson.data.url;
        const fileSlice = file.slice(nextPending.start, nextPending.end);

        // Upload slice with XMLHttp to monitor progress
        const etag = await uploadSliceWithProgress(uploadUrl, fileSlice, nextPending.partNumber, trackerId, controller.signal);
        if (!etag) throw new Error('S3 did not return an ETag for this part (check bucket CORS ExposeHeaders)');

        // Success - update state
        nextPending.status = 'completed';
        nextPending.progress = 100;
        nextPending.etag = etag;
        updateUiChunks();

        // Queue next chunk
        uploadNextChunk();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Upload chunk ${nextPending.partNumber} aborted.`);
          return;
        }
        console.error(`Chunk upload failed: Part ${nextPending.partNumber}`, err);
        nextPending.status = 'failed';
        nextPending.progress = 0;
        updateUiChunks();
        // Force overall tracker state to upload next chunk/handle failure
        setTimeout(uploadNextChunk, 1000);
      }
    };

    // Kickstart CONCURRENCY parallel threads
    for (let k = 0; k < CONCURRENCY; k++) {
      uploadNextChunk();
    }
  };

  // Chunk slice XHR wrapper
  const uploadSliceWithProgress = (
    url: string,
    slice: Blob,
    partNumber: number,
    trackerId: string,
    signal: AbortSignal
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);

      // Handle progress monitoring
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const chunkProgress = Math.round((event.loaded / event.total) * 100);
          setUploadsList((prev) =>
            prev.map((up) => {
              if (up.id !== trackerId) return up;
              const updatedChunks = up.chunks.map((c) =>
                c.partNumber === partNumber ? { ...c, progress: chunkProgress } : c
              );
              const sumProgress = updatedChunks.reduce((acc, c) => acc + c.progress, 0);
              const totalProgress = Math.round(sumProgress / updatedChunks.length);
              return { ...up, progress: totalProgress, chunks: updatedChunks };
            })
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const etag = xhr.getResponseHeader('ETag');
          if (etag) {
            resolve(etag.replace(/"/g, ''));
          } else {
            // Retrieve etag natively if header omitted
            resolve('');
          }
        } else {
          reject(new Error(`Server error: status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error uploading slice'));
      xhr.onabort = () => reject(new DOMException('Aborted slice upload', 'AbortError'));

      // Wire Abort Signal
      signal.addEventListener('abort', () => xhr.abort());

      xhr.send(slice);
    });
  };

  // Complete Multipart upload step
  const completeUpload = async (trackerId: string, file: File, uploadId: string, s3Key: string, chunks: UploadTracker['chunks']) => {
    const tracker = activeUploadsRef.current.find((up) => up.id === trackerId);
    if (!tracker) return;

    try {
      toast.loading(`Finalizing upload for ${file.name}...`, { id: trackerId });

      // Real ETags captured from each part's S3 PUT response (see uploadNextChunk)
      const parts = chunks.map((c) => ({
        PartNumber: c.partNumber,
        ETag: c.etag || '',
      }));

      // Call complete endpoint
      const res = await apiFetch(`${API_BASE}/api/storage/upload/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          uploadId,
          s3Key,
          parts,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          parentId: tracker.parentId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUploadsList((prev) =>
          prev.map((up) => (up.id === trackerId ? { ...up, status: 'completed' as const, progress: 100 } : up))
        );
        toast.success(`Completed upload: ${file.name}`, { id: trackerId });
        loadStorageItems();
        fetchUsage();
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      toast.error(`Finalization failed: ${err.message}`, { id: trackerId });
      setUploadsList((prev) =>
        prev.map((up) => (up.id === trackerId ? { ...up, status: 'failed' as const } : up))
      );
    }
  };

  // Pause Upload
  const pauseUpload = (trackerId: string) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker) return;

    // Abort active fetches
    tracker.chunks.forEach((c) => {
      if (c.status === 'uploading' && c.controller) {
        c.controller.abort();
      }
    });

    setUploadsList((prev) =>
      prev.map((up) => {
        if (up.id !== trackerId) return up;
        return {
          ...up,
          status: 'paused' as const,
          chunks: up.chunks.map((c) => (c.status === 'uploading' ? { ...c, status: 'pending' as const } : c)),
        };
      })
    );
    toast.info(`Paused upload: ${tracker.name}`);
  };

  // Resume Upload
  const resumeUpload = (trackerId: string, file: File) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker || !tracker.uploadId || !tracker.s3Key) return;

    setUploadsList((prev) =>
      prev.map((up) => (up.id === trackerId ? { ...up, status: 'uploading' as const } : up))
    );

    toast.info(`Resuming upload: ${tracker.name}`);
    // Fresh mutable snapshot for this resumed processChunks session's control flow
    processChunks(trackerId, file, tracker.uploadId, tracker.s3Key, tracker.chunks.map((c) => ({ ...c })));
  };

  // Cancel Upload
  const cancelUpload = async (trackerId: string) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker) return;

    // Abort active chunks
    tracker.chunks.forEach((c) => {
      if (c.status === 'uploading' && c.controller) {
        c.controller.abort();
      }
    });

    setUploadsList((prev) =>
      prev.map((up) => (up.id === trackerId ? { ...up, status: 'cancelled' as const } : up))
    );

    if (tracker.uploadId && tracker.s3Key) {
      try {
        await apiFetch(`${API_BASE}/api/storage/upload/cancel`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            uploadId: tracker.uploadId,
            s3Key: tracker.s3Key,
          }),
        });
      } catch (err) {
        console.error('Failed to report upload cancellation to API', err);
      }
    }
    toast.error(`Cancelled upload: ${tracker.name}`);
  };

  // --- Remote (cross-device) upload control ---------------------------------------
  // A "mobile" tracker's bytes only ever pass through the phone's browser — this tab
  // can only observe it (via polling) and relay pause/resume/cancel through the API.
  const mapRemoteStatus = (s: string): UploadTracker['status'] => (s === 'rejected' ? 'failed' : (s as UploadTracker['status']));

  const pauseRemoteUpload = async (trackerId: string) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker?.uploadId) return;
    setUploadsList((prev) => prev.map((up) => (up.id === trackerId ? { ...up, status: 'paused' as const } : up)));
    try {
      await apiFetch(`${API_BASE}/api/storage/upload/pause`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ uploadId: tracker.uploadId }),
      });
      toast.info(`Paused upload: ${tracker.name}`);
    } catch (err) {
      toast.error('Failed to pause upload');
    }
  };

  const resumeRemoteUpload = async (trackerId: string) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker?.uploadId) return;
    setUploadsList((prev) => prev.map((up) => (up.id === trackerId ? { ...up, status: 'uploading' as const } : up)));
    try {
      await apiFetch(`${API_BASE}/api/storage/upload/resume`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ uploadId: tracker.uploadId }),
      });
      toast.info(`Resumed upload: ${tracker.name}`);
    } catch (err) {
      toast.error('Failed to resume upload');
    }
  };

  const cancelRemoteUpload = async (trackerId: string) => {
    const tracker = uploadsList.find((up) => up.id === trackerId);
    if (!tracker?.uploadId || !tracker.s3Key) return;
    setUploadsList((prev) => prev.map((up) => (up.id === trackerId ? { ...up, status: 'cancelled' as const } : up)));
    try {
      await apiFetch(`${API_BASE}/api/storage/upload/cancel`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ uploadId: tracker.uploadId, s3Key: tracker.s3Key }),
      });
      toast.error(`Cancelled upload: ${tracker.name}`);
    } catch (err) {
      toast.error('Failed to cancel upload');
    }
  };

  // On-Demand File download presigned url resolver
  const downloadFile = async (item: StorageItem) => {
    try {
      toast.loading(`Resolving download for ${item.name}...`, { id: item.id });
      const res = await apiFetch(`${API_BASE}/api/storage/download/${item.id}`, {
        headers: getHeaders(),
      });
      const json = await res.json();

      if (json.success) {
        // Trigger download via native anchor
        const link = document.createElement('a');
        link.href = json.data.downloadUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Download ready: ${item.name}`, { id: item.id });
      } else {
        toast.error(json.message || 'Failed to download file', { id: item.id });
      }
    } catch (e) {
      toast.error('Download server issue', { id: item.id });
    }
  };

  // Format File Size helper
  const formatSize = (bytes: any) => {
    if (bytes === null || bytes === undefined || bytes === '') return '-';
    const num = Number(bytes);
    if (isNaN(num)) return '-';
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (iso: string | null | undefined) => {
    if (!iso) return null;
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Verify non-discoverability activation (guarded against StrictMode double-mount)
  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const active = sessionStorage.getItem('hidden_storage_activated');
    // A Google OAuth round trip navigates fully away to accounts.google.com and back,
    // landing here as a *fresh* page load — after the sessionStorage flag above was
    // already consumed on the very first pass (before the user clicked "Continue with
    // Google"). Without this, the legitimate return trip gets bounced straight back to
    // '/' by the else-branch below. Safe to trust: oauth_exchange is an unguessable,
    // single-use, server-issued code that only exists after a real state-verified round
    // trip through Google's own consent screen — it can't be manufactured, and a
    // replayed URL from browser history just gets a 400 on second use, not a bypass.
    const params = new URLSearchParams(window.location.search);
    const isOAuthReturn = params.has('oauth_exchange') || params.has('oauth_error');
    // Same reasoning as the OAuth case: a password-reset link lands here as a fresh
    // page load too, after the flag above was already consumed. A resetToken is only
    // ever mailed to an address that already requested it through this same gated
    // form, so its mere presence is an equally valid "you already unlocked this" signal.
    const isPasswordResetLink = params.has('resetToken');
    if (active === 'true' || isOAuthReturn || isPasswordResetLink) {
      setIsActivated(true);
      sessionStorage.removeItem('hidden_storage_activated');

      // Restore existing auth session if already logged in
      const storedToken = localStorage.getItem('storage_token');
      const storedEmail = localStorage.getItem('storage_email');
      const storedName = localStorage.getItem('storage_name');
      const storedRole = localStorage.getItem('storage_role');
      if (storedToken && storedEmail) {
        setToken(storedToken);
        setUserEmail(storedEmail);
        setUserName(storedName || storedEmail);
        setUserRole(storedRole || 'user');
      }
    } else {
      setIsActivated(false);
    }
  }, []);

  // Consume a Google OAuth return: trade the one-time exchange code the callback
  // redirected us with for a real session, the same shape login/register return.
  useEffect(() => {
    if (hasHandledOAuthReturn.current) return;
    hasHandledOAuthReturn.current = true;

    const params = new URLSearchParams(window.location.search);
    const exchangeCode = params.get('oauth_exchange');
    const oauthError = params.get('oauth_error');

    if (exchangeCode) {
      apiFetch(`${API_BASE}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: exchangeCode }),
      })
        .then(async (res) => {
          const json = await res.json();
          if (res.ok && json.success) {
            applyAuthSession(json.data);
            toast.success(`Welcome, ${json.data.user.name || json.data.user.email}`);
          } else {
            toast.error(json.message || 'Google sign-in link expired or was already used. Please try again.');
          }
        })
        .catch(() => toast.error('Google sign-in failed. Please try again.'))
        .finally(() => {
          window.history.replaceState(null, '', '/storage');
          setIsExchangingOAuth(false);
        });
    } else if (oauthError) {
      toast.error(OAUTH_ERROR_MESSAGES[oauthError] || 'Google sign-in failed.');
      window.history.replaceState(null, '', '/storage');
      setIsExchangingOAuth(false);
    }
  }, []);

  // Deep-link from a "Reset your password" email — pre-fills the existing reset form
  // instead of requiring the user to copy-paste the token in by hand.
  useEffect(() => {
    if (hasHandledResetLink.current) return;
    hasHandledResetLink.current = true;

    const params = new URLSearchParams(window.location.search);
    const resetTokenParam = params.get('resetToken');
    const emailParam = params.get('email');
    if (resetTokenParam) {
      setResetToken(resetTokenParam);
      if (emailParam) setEmail(emailParam);
      setAuthMode('reset');
      window.history.replaceState(null, '', '/storage');
    }
  }, []);

  // Sync activeUploadsRef
  useEffect(() => {
    activeUploadsRef.current = uploadsList;
  }, [uploadsList]);

  // Active Upload Sessions should only show transfers still in progress —
  // once one reaches 'completed' (100%, whether finished here or on a linked
  // mobile-upload session polled in above) it's cleared out shortly after
  // instead of sitting in the list indefinitely. The brief delay just lets
  // the completed state actually be seen before it disappears.
  const completedRemovalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    uploadsList.forEach((up) => {
      const isDone = up.status === 'completed' || up.progress >= 100;
      if (!isDone || completedRemovalTimers.current.has(up.id)) return;
      const timer = setTimeout(() => {
        completedRemovalTimers.current.delete(up.id);
        setUploadsList((prev) => prev.filter((p) => p.id !== up.id));
      }, 1500);
      completedRemovalTimers.current.set(up.id, timer);
    });
  }, [uploadsList]);

  useEffect(() => {
    const timers = completedRemovalTimers.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  // Load the item list whenever folder/tab/sort/filters change
  useEffect(() => {
    if (token) {
      loadStorageItems();
    }
  }, [token, currentFolderId, sidebarTab, sortBy, sortOrder, filterDateFrom, filterDateTo, filterMimeCategories, filterTag]);

  // Usage stats and profile are account-wide, not folder/sort/filter-scoped — only
  // fetch them once per session instead of on every navigation click. They're
  // refreshed again after mutations that actually change storage usage (upload,
  // delete, restore) via the fetchUsage() calls at those call sites.
  useEffect(() => {
    if (token) {
      fetchUsage();
      fetchProfile();
    }
  }, [token]);

  // Load event hierarchy when the Events tab is opened
  useEffect(() => {
    if (token && sidebarTab === 'events') {
      fetchEvents();
    }
  }, [token, sidebarTab]);

  // Load the user list when the Admin tab is opened (superadmin only)
  useEffect(() => {
    if (token && sidebarTab === 'admin' && userRole === 'superadmin') {
      fetchAdminUsers();
    }
  }, [token, sidebarTab, userRole]);

  // Stream uploads happening on another device (a scanned mobile-upload QR link) while
  // the Upload Queue tab is open, merging them into the same tracker list as this tab's
  // own uploads so progress/pause/cancel show up in one unified place. Backed by an SSE
  // connection (GET /upload/stream) rather than a fixed-interval poll — the server only
  // pushes a frame when an upload session actually changes, so an idle queue produces no
  // repeated requests.
  useEffect(() => {
    if (!token || sidebarTab !== 'uploads') return;

    let active = true;
    let abortController: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const applyRemoteSessions = (sessions: any[]) => {
      const remote = sessions.filter((s: any) => s.source === 'mobile');
      if (remote.length === 0) return;

      setUploadsList((prev) => {
        const next = [...prev];
        for (const s of remote) {
          const total = s.totalParts || 1;
          const progress = Math.min(100, Math.round((s.partsRequested / total) * 100));
          const status = mapRemoteStatus(s.status);
          const existingIdx = next.findIndex((up) => up.uploadId === s.uploadId && up.source === 'mobile');
          if (existingIdx >= 0) {
            next[existingIdx] = { ...next[existingIdx], status, progress, totalParts: total };
          } else {
            next.unshift({
              id: s.uploadId,
              name: s.name || 'Mobile upload',
              size: s.size || 0,
              progress,
              status,
              uploadId: s.uploadId,
              s3Key: s.s3Key,
              parentId: null,
              chunks: [],
              source: 'mobile',
              totalParts: total,
            });
          }
        }
        return next;
      });
    };

    const connect = async () => {
      while (active) {
        abortController = new AbortController();
        try {
          const res = await apiFetch(`${API_BASE}/api/storage/upload/stream`, {
            headers: getHeaders(),
            signal: abortController.signal,
          });
          if (!res.ok || !res.body) throw new Error(`Upload stream failed: ${res.status}`);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (active) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let sepIdx: number;
            while ((sepIdx = buffer.indexOf('\n\n')) >= 0) {
              const frame = buffer.slice(0, sepIdx);
              buffer = buffer.slice(sepIdx + 2);
              const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
              if (!dataLine) continue;
              try {
                const json = JSON.parse(dataLine.slice(6));
                if (json.success) applyRemoteSessions(json.data || []);
              } catch (err) {
                // Malformed frame — skip it, the next one will resync.
              }
            }
          }
        } catch (err) {
          // Network blip or server restart — reconnected below, silent since this is a background stream.
        }

        if (!active) break;
        await new Promise<void>((resolve) => {
          retryTimer = setTimeout(resolve, 3000);
        });
      }
    };

    connect();

    return () => {
      active = false;
      abortController?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [token, sidebarTab]);

  // Trigger auto-save for Note Editor
  useEffect(() => {
    if (editorNote) {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
      autoSaveTimer.current = setInterval(() => {
        saveNoteContent(true);
      }, 5000);
    }
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [editorNote, editorContent, editorTitle]);

  // Redirect unactivated users safely inside useEffect.
  // A hard navigation (not router.replace) is deliberate here: this is an auth-gate exit for
  // users who reached /storage without the unlock flow, and firing it this early in the mount
  // cycle can race the App Router's own initialization and throw "Router action dispatched
  // before initialization" — window.location sidesteps that internal router state entirely.
  useEffect(() => {
    if (isActivated === false) {
      window.location.href = '/';
    }
  }, [isActivated]);

  if (isActivated !== true || isExchangingOAuth) {
    return (
      <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono">
        <Loader2 className="animate-spin h-6 w-6 mr-2 text-blue-500" />
        {isExchangingOAuth ? 'Completing Google sign-in...' : 'Checking configuration...'}
      </div>
    );
  }

  // Render Login page if token is missing
  if (!token) {
    // Dynamic styling based on auth mode
    const modeGlow = {
      login: 'shadow-[0_0_50px_rgba(59,130,246,0.15)] border-blue-500/30 focus-within:border-blue-500/50',
      register: 'shadow-[0_0_50px_rgba(16,185,129,0.15)] border-emerald-500/30 focus-within:border-emerald-500/50',
      forgot: 'shadow-[0_0_50px_rgba(245,158,11,0.15)] border-amber-500/30 focus-within:border-amber-500/50',
      reset: 'shadow-[0_0_50px_rgba(139,92,246,0.15)] border-violet-500/30 focus-within:border-violet-500/50',
    }[authMode] || 'border-slate-200/80 dark:border-slate-800/80';

    const modeColor = {
      login: 'text-blue-500',
      register: 'text-emerald-500',
      forgot: 'text-amber-500',
      reset: 'text-violet-500',
    }[authMode] || 'text-blue-500';

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-[#060913] radial-gradient flex items-center justify-center p-4 sm:p-6 md:p-10 transition-colors duration-500 relative">
        {/* Floating Back to Home Link */}
        <div className="absolute top-6 left-6 z-[100]">
          <button
            onClick={() => {
              localStorage.clear();
              router.push('/');
            }}
            className="flex items-center gap-2 bg-white/80 dark:bg-[#0d1526]/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all font-mono text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shadow-lg backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="font-bold tracking-wider pointer-events-none pr-1">Exit Vault</span>
          </button>
        </div>
        <div className={cn("w-full max-w-4xl bg-white/70 dark:bg-slate-900/60 border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 min-h-[560px]", modeGlow)}>

          {/* Left panel: Vault cybernetic graphics */}
          <div className="hidden md:flex md:col-span-5 bg-gradient-to-b from-[#091024] to-[#040711] p-8 flex-col justify-between relative overflow-hidden border-r border-slate-800/40">
            <div className="absolute -left-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2">
              <div className="h-6.5 w-6.5 rounded-lg bg-blue-500/20 border border-blue-500/35 flex items-center justify-center text-blue-400">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="font-sans font-black text-[10px] tracking-widest text-slate-200 uppercase">Shield Storage Vault</span>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
              <div className="relative mb-6 flex items-center justify-center">
                {/* Cyber Security Scanner Matrix */}
                <div className="w-28 h-28 rounded-2xl border border-slate-800 flex items-center justify-center relative bg-slate-950/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
                  {/* Grid background visual */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-25" />

                  {/* Moving Laser Sweep Bar */}
                  <div className={cn(
                    "absolute left-0 right-0 h-0.5 transition-all duration-1000 shadow-md",
                    isLoggingIn
                      ? "bg-emerald-450 shadow-emerald-500/80 animate-[bounce_1.2s_infinite]"
                      : "bg-blue-550 shadow-blue-550/80 animate-[bounce_3s_infinite]"
                  )} style={{ top: '10%' }} />

                  {/* Status scanning particles */}
                  <div className="absolute inset-0 flex flex-col justify-between p-1.5 opacity-40 font-mono text-[6px] text-blue-400/60">
                    <div className="flex justify-between"><span>SYS.CHK</span><span>0xFC</span></div>
                    <div className="flex justify-between"><span>MEM.VAL</span><span>OK</span></div>
                  </div>

                  <div className="relative z-10 flex items-center justify-center">
                    <Shield className={cn("h-9 w-9 transition-all duration-500", isLoggingIn ? "text-emerald-400 scale-110 animate-pulse" : "text-blue-500")} />
                  </div>
                </div>
              </div>
              <h2 className="text-sm font-sans font-black text-white tracking-widest uppercase text-center mb-2">Secure Vault</h2>
              <p className="text-[10px] text-slate-400 text-center font-mono max-w-[210px] leading-relaxed">
                AES-GCM-256 client side validation with dynamic token authentication keys.
              </p>
            </div>

            <div className="relative z-10 font-mono text-[9px] text-slate-500 space-y-1.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 backdrop-blur-md">
              <div className="text-blue-400 font-bold uppercase tracking-wider mb-1 text-[8px] flex items-center">
                Diagnostic Core
              </div>
              <div className="flex justify-between"><span>ACCESS KEY:</span><span className="text-slate-350 font-bold">ENCRYPTED</span></div>
              <div className="flex justify-between"><span>ALGORITHM:</span><span className="text-slate-350 font-bold">AES-GCM-256</span></div>
              <div className="flex justify-between"><span>SYS HANDSHAKE:</span><span className="text-slate-350 font-bold">ACTIVE</span></div>
              <div className="flex justify-between"><span>VAULT LEVEL:</span><span className="text-slate-350 font-bold">RESTRICTED</span></div>
              {isLoggingIn && (
                <div className="text-emerald-400 font-bold animate-pulse mt-1 pt-1.5 border-t border-slate-800 text-[8px]">
                  * DECRYPTING VAULT CREDENTIALS...
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Forms */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="space-y-2 mb-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 md:hidden">
                <HardDrive className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Private Storage</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                {authMode === 'login' && 'Authenticate credentials to enter into the encrypted sandbox.'}
                {authMode === 'register' && 'Create a brand new zero-knowledge secure storage account.'}
                {authMode === 'forgot' && 'Provide your account email to generate a JWT reset token.'}
                {authMode === 'reset' && 'Enter reset token and specify a secure new password.'}
              </p>
            </div>

            {authMode === 'login' && (
              <>
              <form onSubmit={handleLogin} noValidate className="space-y-5 font-mono text-sm">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Email or Mobile Number</label>
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="user@space.io or +1234567890"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Password</label>
                    <span className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">No Paste Allowed</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      onPaste={handlePreventPaste}
                      className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-3.5 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none bg-transparent border-0 outline-none p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer bg-transparent border-0 outline-none"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setPassword(''); }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer bg-transparent border-0 outline-none animate-pulse"
                  >
                    Create Account
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-5 shadow-lg shadow-blue-650/10 dark:shadow-blue-900/20"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-widest"><span className="bg-white dark:bg-[#0d1526] px-3 text-slate-400 dark:text-slate-600">or</span></div>
              </div>
              <a
                href={`${API_BASE}/api/auth/google`}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold py-3 text-xs transition-all"
              >
                <GoogleIcon className="h-4 w-4" /> Continue with Google
              </a>
              </>
            )}

            {authMode === 'register' && (
              <>
              <form onSubmit={handleRegister} noValidate className="space-y-4 font-mono text-sm">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Mobile Number (Optional)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="+1234567890"
                    value={registerMobile}
                    onChange={(e) => setRegisterMobile(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="user@space.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Password</label>
                    <span className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">No Paste Allowed</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      onPaste={handlePreventPaste}
                      className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-3.5 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none bg-transparent border-0 outline-none p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Confirm Password</label>
                    <span className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">No Paste Allowed</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      onPaste={handlePreventPaste}
                      className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-3.5 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none bg-transparent border-0 outline-none p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-start text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer bg-transparent border-0 outline-none"
                  >
                    &larr; Back to Login
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-5 shadow-lg shadow-emerald-650/10 dark:shadow-emerald-900/20"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Registering Vault Peer...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-widest"><span className="bg-white dark:bg-[#0d1526] px-3 text-slate-400 dark:text-slate-600">or</span></div>
              </div>
              <a
                href={`${API_BASE}/api/auth/google`}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold py-3 text-xs transition-all"
              >
                <GoogleIcon className="h-4 w-4" /> Continue with Google
              </a>
              </>
            )}

            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} noValidate className="space-y-4 font-mono text-sm">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Account Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="user@space.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer bg-transparent border-0 outline-none"
                  >
                    &larr; Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer bg-transparent border-0 outline-none font-bold"
                  >
                    I have a token &rarr;
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-5 shadow-lg shadow-amber-650/10 dark:shadow-amber-900/20"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Generating Reset Token...
                    </>
                  ) : (
                    'Get Reset Token'
                  )}
                </button>
              </form>
            )}

            {authMode === 'reset' && (
              <form onSubmit={handleResetPassword} noValidate className="space-y-4 font-mono text-sm">
                {generatedToken && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300/40 dark:border-emerald-800/40 rounded-xl text-[10px] text-emerald-700 dark:text-emerald-400 select-all space-y-1 break-all font-mono">
                    <div className="font-bold font-sans">Verification Token Generated:</div>
                    <div className="font-mono text-[9px]">{generatedToken}</div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Account Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                    placeholder="user@space.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">Reset Token</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs font-mono"
                    placeholder="Paste JWT Reset Token here"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black">New Password</label>
                    <span className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">No Paste Allowed</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      onPaste={handlePreventPaste}
                      className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 pl-3.5 pr-10 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none bg-transparent border-0 outline-none p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-start text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setGeneratedToken(''); }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer bg-transparent border-0 outline-none"
                  >
                    &larr; Back to Login
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-5 shadow-lg shadow-violet-650/10 dark:shadow-violet-900/20"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Re-encrypting Vault Keys...
                    </>
                  ) : (
                    'Complete Password Reset'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Holographic Diagnostic Panel — shown at the top of every /storage view (files, notes, diagrams, events, admin, uploads).
  // `insetMargin` negates padding on <main> containers that pad their own content, so the bar still sits flush.
  const renderDiagnosticBar = (insetMargin = '') => (
    <div className={cn("bg-[#0c152d]/95 dark:bg-[#070e1f]/95 border-b border-blue-900/30 dark:border-blue-950/40 px-5 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-slate-350 dark:text-slate-400 relative backdrop-blur-md shrink-0", insetMargin)}>
      {/* Decorative glow gets its own clipped layer — the bar itself must stay
          overflow-visible so hover tooltips positioned below its buttons aren't cut off. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-12 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
      </div>
      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-400">Security Standard:</span>
          <span className="text-blue-400 font-bold">AES-GCM-256</span>
        </div>
        <div className="relative group/tooltip">
          <button
            onClick={generateMobileUploadLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg transition-all shadow-md shadow-indigo-950/50 hover:shadow-indigo-500/30 cursor-pointer text-[10px] font-bold"
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile Upload
          </button>
          <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
            <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/30 text-slate-100 text-[9px] font-semibold px-2.5 py-1.5 rounded-md shadow-xl shadow-indigo-950/50 backdrop-blur-md whitespace-nowrap">Scan QR to upload from mobile</div>
          </div>
        </div>
        <div className="relative group/tooltip">
          <button
            onClick={openManageLinksModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors border border-slate-700/50 cursor-pointer text-[10px] font-bold"
          >
            <Link2 className="h-3.5 w-3.5" /> Active Scans
          </button>
          <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
            <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Manage active mobile links</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 relative z-10">
        {/* Sync Pipeline - Clickable Refresh Button */}
        <button
          onClick={() => loadStorageItems()}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer border border-blue-200 dark:border-blue-800 shadow-sm"
        >
          <RotateCw className={cn("h-3.5 w-3.5", isLoadingItems ? "animate-spin text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-400")} />
          <span className="text-blue-700 dark:text-blue-300 transition-colors text-[10px] font-bold font-mono tracking-wide uppercase">Sync Pipeline</span>
        </button>

        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-450 px-2.5 py-0.5 rounded-full font-bold">
          <span>SSL v3</span>
        </div>
      </div>
    </div>
  );

  // Render Dashboard
  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#060a14] text-slate-800 dark:text-slate-200 flex flex-col font-mono text-xs">

      {/* Usage Modal */}
      {showUsageModal && usageData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setShowUsageModal(false); setHoveredUsageCategory(null); }}>
          <div className="bg-white dark:bg-[#0d1526] border border-slate-300/60 dark:border-slate-700/60 rounded-2xl w-[26rem] shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <HardDrive className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </span>
                  Storage Breakdown
                </h3>
                <button onClick={() => setShowUsageModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              {/* Headline figure */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatSize(usageData.used)}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-500 font-semibold ml-1.5">/ {formatSize(usageData.max)} used</span>
                </div>
                <span className="text-sm font-black" style={{ color: Number(usageData.percent) >= 90 ? '#ef4444' : Number(usageData.percent) >= 70 ? '#f59e0b' : '#3b82f6' }}>
                  {Number(usageData.percent).toFixed(1)}%
                </span>
              </div>

              {/* Segmented usage bar — hover a segment for detail, synced with the list below.
                  Fixed category order (never re-sorted by size) so each category keeps a stable
                  color and adjacent segments stay a colorblind-safe distance apart. */}
              <div className="flex w-full h-3.5 gap-[2px] rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 mb-5">
                {groupedUsageCategories.map(cat => {
                  const pctOfMax = (cat.bytes / usageData.max) * 100;
                  const pctOfUsed = usageData.used > 0 ? (cat.bytes / usageData.used) * 100 : 0;
                  const isHovered = hoveredUsageCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      className="relative h-full transition-all"
                      style={{ width: `${pctOfMax}%`, minWidth: pctOfMax > 0 ? '2px' : 0 }}
                      onMouseEnter={() => setHoveredUsageCategory(cat.key)}
                      onMouseLeave={() => setHoveredUsageCategory(null)}
                    >
                      <div
                        className="h-full w-full transition-all"
                        style={{ backgroundColor: cat.color, filter: isHovered ? 'brightness(1.15)' : undefined, transform: isHovered ? 'scaleY(1.15)' : undefined }}
                      />
                      {isHovered && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 animate-in fade-in zoom-in-95 duration-100">
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md whitespace-nowrap text-center">
                            <div>{cat.label}</div>
                            <div className="text-slate-300 font-normal">{formatSize(cat.bytes)} · {pctOfUsed.toFixed(1)}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Category list — biggest contributor first; synced with the bar above */}
              <div className="space-y-1 max-h-72 overflow-y-auto -mx-1 px-1">
                {[...groupedUsageCategories].sort((a, b) => b.bytes - a.bytes).map(cat => {
                const CategoryIcon = cat.icon;
                const pctOfUsed = usageData.used > 0 ? (cat.bytes / usageData.used) * 100 : 0;
                const isHovered = hoveredUsageCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setFilterMimeCategories(cat.sourceKeys); setShowUsageModal(false); setSidebarTab('files'); }}
                    onMouseEnter={() => setHoveredUsageCategory(cat.key)}
                    onMouseLeave={() => setHoveredUsageCategory(null)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors cursor-pointer text-left",
                      isHovered ? "bg-slate-200/60 dark:bg-slate-800/60" : "hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${cat.color}1a`, borderColor: `${cat.color}40`, color: cat.color }}
                    >
                      <CategoryIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">{cat.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 dark:text-slate-500">{formatSize(cat.bytes)}</span>
                          <span className="text-slate-600 dark:text-slate-400 font-bold w-10 text-right">{pctOfUsed.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctOfUsed}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[10px] text-slate-500 dark:text-slate-500">
                <span>{usageData.files} files · {usageData.folders} folders</span>
                <span>{formatSize(Math.max(0, usageData.max - usageData.used))} free</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white dark:bg-[#0d1526]/95 border border-slate-300/60 dark:border-slate-800/80 rounded-2xl p-6 w-96 shadow-2xl backdrop-blur-xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{confirmModal.title}</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">
              {confirmModal.description}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={cn(
                  "px-4 py-2 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-md",
                  confirmModal.danger
                    ? "bg-red-600 hover:bg-red-500 shadow-red-600/10 dark:shadow-red-900/20"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10 dark:shadow-blue-900/20"
                )}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && tagModalItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setShowTagModal(false); setTagModalItem(null); }}>
          <div className="bg-white dark:bg-[#0d1526] border border-slate-300/60 dark:border-slate-700/60 rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Manage Tags</h3>
              <button onClick={() => { setShowTagModal(false); setTagModalItem(null); }} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 truncate">{tagModalItem.name}</div>
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-8">
              {(tagModalItem.tags || []).map(t => (
                <span key={t} className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  #{t}
                  <button onClick={() => saveTagsForItem(tagModalItem, (tagModalItem.tags || []).filter(x => x !== t))} className="hover:text-red-700 dark:hover:text-red-300 cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Add tag (enter to add)" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                    if (newTag && !(tagModalItem.tags || []).includes(newTag)) {
                      setTagModalItem({ ...tagModalItem, tags: [...(tagModalItem.tags || []), newTag] });
                    }
                    setTagInput('');
                  }
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-xs"
              />
            </div>
            <button
              onClick={() => saveTagsForItem(tagModalItem, tagModalItem.tags || [])}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-bold cursor-pointer transition-colors"
            >Save Tags</button>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white dark:bg-[#0d1526] border border-slate-300/60 dark:border-slate-700/60 rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Move to Folder</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setMoveDestId(null); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs cursor-pointer transition-colors", moveDestId === null ? 'bg-blue-600/20 border border-blue-500/30 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400')}
              >
                <Folder className="h-3.5 w-3.5 shrink-0" /> Root
              </button>
              {allFolders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setMoveDestId(f.id)}
                  className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs cursor-pointer transition-colors", moveDestId === f.id ? 'bg-blue-600/20 border border-blue-500/30 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400')}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" /> {f.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => moveSelectedItems(moveDestId)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-bold cursor-pointer transition-colors"
            >Move Here</button>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal (Superadmin) */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmUser(null)}>
          <div className="bg-white dark:bg-[#0d1526] border border-red-800/40 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-bold text-sm">Delete User Permanently?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete <span className="text-slate-800 dark:text-slate-200 font-bold">{deleteConfirmUser.name || deleteConfirmUser.email}</span> ({deleteConfirmUser.email}),
              all {deleteConfirmUser.fileCount} of their files, {deleteConfirmUser.folderCount} folders, and every associated object in storage. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer text-xs font-bold"
              >Cancel</button>
              <button
                onClick={() => deleteUserAccount(deleteConfirmUser.id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors cursor-pointer text-xs"
              >Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowProfileModal(false)}>
          <div
            className="relative w-full max-w-sm rounded-2xl p-px bg-gradient-to-br from-blue-500/50 via-violet-500/25 to-transparent shadow-2xl shadow-blue-950/20 dark:shadow-blue-950/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative bg-white dark:bg-[#0d1526] rounded-[15px] max-h-[85vh] overflow-y-auto">
              {/* Ambient glow */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 dark:bg-violet-500/10 rounded-full blur-3xl" />
              </div>

              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">Profile Settings</h3>
                      <div className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold">Vault Identity</div>
                    </div>
                  </div>
                  <button onClick={() => setShowProfileModal(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors shrink-0"><X className="h-4 w-4" /></button>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/40 blur-md" />
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="relative h-20 w-20 rounded-full object-cover border-2 border-white dark:border-[#0d1526] shadow-lg" />
                    ) : (
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                        {(userName || userEmail).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAvatarEditor(true)}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white dark:border-[#0d1526] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60 shadow-lg"
                    >
                      {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button onClick={() => setShowAvatarEditor(true)} className="px-2.5 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 cursor-pointer font-bold transition-colors">Change Picture</button>
                    {avatarUrl && (
                      <button onClick={removeAvatar} className="px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer font-bold transition-colors">Remove</button>
                    )}
                  </div>
                </div>

                {/* Identity details */}
                <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 font-semibold min-w-0">
                      <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{userEmail}</span>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide shrink-0 border",
                      userRole === 'superadmin'
                        ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : "bg-slate-200/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {userRole === 'superadmin' ? <Crown className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                      {userRole === 'superadmin' ? 'Superadmin' : 'User'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-600 mb-1.5 block">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                      <input
                        type="text"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-600 mb-1.5 block">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                        <input
                          type="text"
                          placeholder="+1234567890"
                          value={profileMobileInput}
                          onChange={(e) => setProfileMobileInput(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all text-xs"
                        />
                      </div>
                      <button
                        onClick={saveProfileName}
                        disabled={isSavingName}
                        className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold cursor-pointer transition-all disabled:opacity-50 text-xs shrink-0 shadow-md shadow-blue-950/20"
                      >
                        {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password */}
                {userRole === 'superadmin' ? (
                  <div className="mb-4 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 space-y-2.5">
                    <div className="text-[10px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3" /> Change Password &middot; Email Verification Required
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-500">
                      For security, the Superadmin password can only be changed with a one-time code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{userEmail}</span>.
                    </div>

                    {!otpSentAt ? (
                      <button
                        onClick={sendSuperadminPasswordOtp}
                        disabled={isSendingOtp}
                        className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg py-2 font-bold cursor-pointer transition-all disabled:opacity-50 text-xs shadow-md shadow-amber-950/20"
                      >
                        {isSendingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                        Send Verification Code
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={profileOtp}
                          onChange={(e) => setProfileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800/60 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm font-mono tracking-[0.3em] text-center"
                        />
                        <div className="relative">
                          <input
                            type={showProfileNewPassword ? "text" : "password"}
                            placeholder="New password (min. 8 characters)"
                            value={profileNewPassword}
                            onChange={(e) => setProfileNewPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProfileNewPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 outline-none p-0.5 cursor-pointer"
                          >
                            {showProfileNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <PasswordStrengthBar password={profileNewPassword} />
                        <div className="relative">
                          <input
                            type={showProfileConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProfileConfirmPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 outline-none p-0.5 cursor-pointer"
                          >
                            {showProfileConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <button
                          onClick={changeSuperadminPasswordWithOtp}
                          disabled={isVerifyingOtp}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg py-2 font-bold cursor-pointer transition-all disabled:opacity-50 text-xs shadow-md shadow-amber-950/20"
                        >
                          {isVerifyingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'Verify & Update Password'}
                        </button>
                        <button
                          onClick={sendSuperadminPasswordOtp}
                          disabled={isSendingOtp || otpCooldownRemaining > 0}
                          className="w-full text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer font-bold text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSendingOtp ? 'Resending...' : otpCooldownRemaining > 0 ? `Resend code in ${otpCooldownRemaining}s` : 'Resend code'}
                        </button>
                      </>
                    )}
                    <div className="text-[9px] text-slate-400 dark:text-slate-600">Changing your password logs you out of all devices.</div>
                  </div>
                ) : (
                  <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><KeyRound className="h-3 w-3" /> Change Password</div>
                    <div className="relative">
                      <input
                        type={showProfileCurrentPassword ? "text" : "password"}
                        placeholder="Current password"
                        value={profileCurrentPassword}
                        onChange={(e) => setProfileCurrentPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfileCurrentPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 outline-none p-0.5 cursor-pointer"
                      >
                        {showProfileCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showProfileNewPassword ? "text" : "password"}
                        placeholder="New password (min. 8 characters)"
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfileNewPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 outline-none p-0.5 cursor-pointer"
                      >
                        {showProfileNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={profileNewPassword} />
                    <div className="relative">
                      <input
                        type={showProfileConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfileConfirmPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent border-0 outline-none p-0.5 cursor-pointer"
                      >
                        {showProfileConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <button
                      onClick={changeProfilePassword}
                      disabled={isChangingPassword}
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-lg py-2 font-bold cursor-pointer transition-all disabled:opacity-50 text-xs shadow-md shadow-blue-950/20"
                    >
                      {isChangingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'Update Password'}
                    </button>
                    <div className="text-[9px] text-slate-400 dark:text-slate-600">Changing your password logs you out of all devices.</div>
                  </div>
                )}

                {/* Danger Zone — self-service, reversible only. Permanent deletion stays a
                    superadmin-only action; the superadmin's own account can't deactivate itself
                    (also enforced server-side by a DB trigger), so this section is hidden for it. */}
                {userRole !== 'superadmin' && (
                  <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40">
                    <div className="text-[10px] uppercase tracking-widest font-black text-red-500/80 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Danger Zone
                    </div>
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="w-full border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100/60 dark:hover:bg-red-950/30 rounded-lg py-2 font-bold cursor-pointer transition-colors text-xs"
                    >Deactivate My Account</button>
                    <div className="text-[9px] text-slate-500 dark:text-slate-500 mt-2">Reversible — your files are kept. Contact an administrator to reactivate.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowDeactivateConfirm(false)}>
          <div className="bg-white dark:bg-[#0d1526] border border-red-800/40 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-bold text-sm">Deactivate Your Account?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              You&apos;ll be logged out of every device immediately. Your files and settings are kept safely — this
              is reversible, but only an administrator can reactivate your account. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer text-xs font-bold"
              >Cancel</button>
              <button
                onClick={deactivateOwnAccount}
                disabled={isDeactivating}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Editor Modal (crop an uploaded photo, or pick a generated character avatar) */}
      {showAvatarEditor && (
        <AvatarEditorModal
          onClose={() => setShowAvatarEditor(false)}
          onSave={saveEditedAvatar}
          isSaving={isUploadingAvatar}
        />
      )}

      {/* Sandboxed in-app File Viewer — image/video/audio/pdf/text preview, never
          executes uploaded file content (see FileViewerModal.tsx / getFilePreview) */}
      {previewItem && (
        <FileViewerModal
          item={previewItem}
          siblingFiles={items.filter((i) => i.type === 'file')}
          apiBase={API_BASE}
          getHeaders={getHeaders}
          onClose={() => setPreviewItem(null)}
          onNavigate={setPreviewItem}
        />
      )}

      {/* Top Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-[#1a2540] bg-white/80 dark:bg-[#08101f]/80 backdrop-blur-xl px-5 flex items-center justify-between shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await handleLogout();
              router.push('/');
            }}
            disabled={isLoggingOut}
            aria-label="Exit storage vault"
            title="Exit storage vault (invalidates session)"
            className="text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/60 cursor-pointer border-0 bg-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <div className="font-black text-slate-900 dark:text-slate-100 tracking-wider text-xs">SECURE SHIELD</div>
            <div className="text-[9px] text-slate-500 dark:text-slate-500 tracking-widest uppercase">Storage Vault</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Real Usage Bar — clickable */}
          {usageData && (
            <button onClick={() => setShowUsageModal(true)} className="hidden sm:flex flex-col items-end gap-1.5 cursor-pointer group">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Storage</span>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{formatSize(usageData.used)} / {formatSize(usageData.max)}</span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold group-hover:text-blue-700 dark:group-hover:text-blue-300">{Number(usageData.percent).toFixed(1)}%</span>
              </div>
              <div className="w-36 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex gap-px border border-slate-200 dark:border-slate-800">
                {groupedUsageCategories.map(cat => (
                  <div key={cat.key} style={{ width: `${(cat.bytes / usageData.max) * 100}%`, backgroundColor: cat.color }} className="h-full" />
                ))}
              </div>
            </button>
          )}

          {/* User + Logout */}
          <div className="flex items-center gap-4 border-l border-slate-200 dark:border-[#1a2540] pl-5">
            <div className="relative group/profile">
              <button
                onClick={openProfileModal}
                className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                    {(userName || userEmail).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-slate-700 dark:text-slate-300 font-bold hidden md:inline text-xs">{userName || userEmail}</span>
              </button>
              <div className="pointer-events-none absolute top-full right-0 mt-2 opacity-0 group-hover/profile:opacity-100 transition-all duration-200 scale-95 group-hover/profile:scale-100 z-50">
                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-150 text-[9px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md whitespace-nowrap">
                  Vault Profile & Settings
                </div>
              </div>
            </div>
            {/* Always-red logout button */}
            <div className="relative group/logout">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </button>
              <div className="pointer-events-none absolute top-full right-0 mt-2 opacity-0 group-hover/logout:opacity-100 transition-all duration-200 scale-95 group-hover/logout:scale-100 z-50">
                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-150 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-md whitespace-nowrap">
                  Logout Session
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <aside className="w-56 border-r border-slate-200 dark:border-[#1a2540] bg-slate-50/65 dark:bg-[#080f1e]/70 backdrop-blur-md shrink-0 flex flex-col justify-between p-3 overflow-y-auto">
          <div className="space-y-0.5">
            <div className="text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-black px-2 py-2">Workspace</div>

            {/* "All Files" is a split-action button: 70% opens the file list, the
                diagonally-cut 30% accent tab jumps straight to the upload picker —
                two affordances that read as one cohesive control. Tooltips live
                outside the clipped inner container (see hoveredSplitSegment) so
                the diagonal cut's overflow-hidden can't clip them. */}
            <div className="relative">
              <div
                className={cn(
                  "relative w-full flex items-stretch rounded-xl overflow-hidden transition-all",
                  sidebarTab === 'files'
                    ? "border border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                    : "border border-transparent"
                )}
              >
                <button
                  onClick={() => {
                    setItems([]);
                    setSidebarTab('files');
                    setEditorNote(null);
                    setSelectedItems(new Set());
                    setIsSelecting(false);
                  }}
                  onMouseEnter={() => setHoveredSplitSegment('view')}
                  onMouseLeave={() => setHoveredSplitSegment(null)}
                  style={{ flex: '0 0 70%' }}
                  className={cn(
                    "flex items-center gap-2.5 pl-3 pr-2 py-2.5 min-w-0 text-left transition-all cursor-pointer font-bold text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50",
                    sidebarTab === 'files'
                      ? "bg-gradient-to-r from-blue-600/20 to-violet-600/10 text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">All Files</span>
                </button>
                <label
                  onMouseEnter={() => setHoveredSplitSegment('upload')}
                  onMouseLeave={() => setHoveredSplitSegment(null)}
                  style={{ flex: '0 0 calc(30% + 16px)', marginLeft: '-16px', clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%)' }}
                  className="flex items-center justify-center pl-5 bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 active:from-blue-700 active:to-violet-700 text-white transition-all cursor-pointer focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-300"
                >
                  <Upload className="h-3.5 w-3.5 shrink-0" />
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div
                className={cn(
                  "pointer-events-none absolute top-full left-[32%] -translate-x-1/2 mt-2 transition-all duration-200 z-50",
                  hoveredSplitSegment === 'view' ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
              >
                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-blue-500/30 text-slate-100 text-[9px] font-semibold px-2.5 py-1.5 rounded-md shadow-xl shadow-blue-950/50 backdrop-blur-md whitespace-nowrap">View Files</div>
              </div>
              <div
                className={cn(
                  "pointer-events-none absolute top-full right-0 mt-2 transition-all duration-200 z-50",
                  hoveredSplitSegment === 'upload' ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
              >
                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/30 text-slate-100 text-[9px] font-semibold px-2.5 py-1.5 rounded-md shadow-xl shadow-indigo-950/50 backdrop-blur-md whitespace-nowrap">Upload File</div>
              </div>
            </div>

            {[
              { tab: 'events' as const, icon: Calendar, label: 'Events', badge: null },
              { tab: 'notes' as const, icon: FileText, label: 'Text Notes', badge: null },
              { tab: 'diagrams' as const, icon: Palette, label: 'Diagrams', badge: null },
              { tab: 'uploads' as const, icon: Upload, label: 'Upload Queue', badge: uploadsList.filter(u => u.status === 'uploading').length || null },
              { tab: 'trash' as const, icon: Trash2, label: 'Trash', badge: null },
            ].map(({ tab, icon: Icon, label, badge }) => (
              <button
                key={tab}
                onClick={() => {
                  setItems([]); // Clear list immediately to prevent visual tab flickering
                  setSidebarTab(tab);
                  if (tab === 'diagrams') {
                    setEditorDiagramId(null);
                    setIsDiagramEditing(true);
                    setDiagramName('');
                    if (excalidrawAPI) excalidrawAPI.resetScene();
                  }
                  setEditorNote(null);
                  setSelectedItems(new Set());
                  setIsSelecting(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer font-bold text-xs",
                  sidebarTab === tab
                    ? "bg-gradient-to-r from-blue-600/20 to-violet-600/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                    : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge ? <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-[9px] animate-pulse">{badge}</span> : null}
              </button>
            ))}

            {userRole === 'superadmin' && (
              <>
                <div className="text-[9px] text-amber-600/80 uppercase tracking-widest font-black px-2 pt-4 pb-1.5">Administration</div>
                <button
                  onClick={() => { setSidebarTab('admin'); setEditorNote(null); setSelectedItems(new Set()); setIsSelecting(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer font-bold text-xs",
                    sidebarTab === 'admin'
                      ? "bg-gradient-to-r from-amber-600/20 to-red-600/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
                      : "text-amber-700/80 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5"
                  )}
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">User Management</span>
                </button>
              </>
            )}

            {/* Category filters */}
            {usageData && (
              <>
                <div className="text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-black px-2 pt-4 pb-1.5">By Type</div>
                <button
                  onClick={() => { setFilterMimeCategories([]); setFilterTag(''); }}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer font-bold text-xs border",
                    filterMimeCategories.length === 0 && !filterTag
                      ? 'text-blue-700 dark:text-blue-300 bg-blue-500/15 border border-blue-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent')}
                >
                  <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Folder className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                  </div>
                  All Files
                </button>
                {usageData.categories.filter(c => c.bytes > 0).map(cat => {
                  const CategoryIcon = USAGE_CATEGORY_ICONS[cat.key] || FileIcon;
                  const pct = usageData.used > 0 ? (cat.bytes / usageData.used) * 100 : 0;
                  const isActive = filterMimeCategories.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      onClick={() => { setFilterMimeCategories([cat.key]); setFilterTag(''); setSidebarTab('files'); }}
                      className={cn("w-full flex flex-col gap-1.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer font-bold text-xs border",
                        isActive ? 'bg-slate-200/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700' : 'border-transparent hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-800')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: `${cat.color}1a`, borderColor: `${cat.color}40`, color: cat.color }}
                          >
                            <CategoryIcon className="h-3 w-3" />
                          </div>
                          <span className={isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}>{cat.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-semibold shrink-0">{formatSize(cat.bytes)}</span>
                      </div>
                      <div className="pl-[34px] w-full">
                        <div className="h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Storage mini stats */}
          <div className="space-y-2">
            <div className="bg-white/80 dark:bg-[#0d1526]/80 border border-slate-200 dark:border-[#1a2540] rounded-xl p-3 text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-500" /> Vault Active
              </div>
              {usageData ? (
                <>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Files</span><span className="text-slate-700 dark:text-slate-300 font-bold">{usageData.files}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Folders</span><span className="text-slate-700 dark:text-slate-300 font-bold">{usageData.folders}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Used</span><span className="text-slate-700 dark:text-slate-300 font-bold">{formatSize(usageData.used)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Remaining</span><span className="text-slate-700 dark:text-slate-300 font-bold">{formatSize(Math.max(0, usageData.max - usageData.used))}</span></div>
                </>
              ) : (
                <div className="text-slate-400 dark:text-slate-600">Loading stats...</div>
              )}
            </div>
          </div>
        </aside>

        {/* Note Editor Workspace overlay */}
        {editorNote ? (
          <main className="flex-1 flex flex-col bg-slate-50/60 dark:bg-black/45 backdrop-blur-md overflow-hidden relative">
            {renderDiagnosticBar()}
            <div className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-100/30 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <button
                  onClick={closeNoteEditor}
                  className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  className="bg-transparent text-slate-900 dark:text-slate-100 font-bold border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 focus:outline-none px-2 py-1 text-sm rounded transition-colors"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-[10px] text-slate-600 dark:text-slate-400">
                  Last Saved: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{editorVersionTime}</span>
                </div>
                <button
                  onClick={() => saveNoteContent(false)}
                  disabled={isSavingNote}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  {isSavingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button
                  onClick={closeNoteEditor}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* TipTap Document Toolbar */}
            <div className="mx-4 mt-3 px-3 py-1.5 border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-black/30 rounded-xl flex flex-wrap items-center gap-1.5 shrink-0 z-10 backdrop-blur-md">
              <div className="flex gap-1">
                {[
                  { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), isActive: editor?.isActive('bold'), label: 'Bold' },
                  { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), isActive: editor?.isActive('italic'), label: 'Italic' },
                  { icon: Code, action: () => editor?.chain().focus().toggleCodeBlock().run(), isActive: editor?.isActive('codeBlock'), label: 'Code Block' },
                ].map((btn, idx) => (
                  <div key={idx} className="relative group/tooltip">
                    <button
                      type="button" onClick={btn.action}
                      className={cn("p-1.5 rounded-lg transition-all cursor-pointer", btn.isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60')}
                    >
                      <btn.icon className="h-3.5 w-3.5" />
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">{btn.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="flex gap-1">
                {[
                  { icon: AlignLeft, action: () => editor?.chain().focus().setTextAlign('left').run(), isActive: editor?.isActive({ textAlign: 'left' }), label: 'Align Left' },
                  { icon: AlignCenter, action: () => editor?.chain().focus().setTextAlign('center').run(), isActive: editor?.isActive({ textAlign: 'center' }), label: 'Align Center' },
                  { icon: AlignRight, action: () => editor?.chain().focus().setTextAlign('right').run(), isActive: editor?.isActive({ textAlign: 'right' }), label: 'Align Right' },
                  { icon: AlignJustify, action: () => editor?.chain().focus().setTextAlign('justify').run(), isActive: editor?.isActive({ textAlign: 'justify' }), label: 'Justify' },
                ].map((btn, idx) => (
                  <div key={idx} className="relative group/tooltip">
                    <button
                      type="button" onClick={btn.action}
                      className={cn("p-1.5 rounded-lg transition-all cursor-pointer", btn.isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60')}
                    >
                      <btn.icon className="h-3.5 w-3.5" />
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">{btn.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="flex gap-1">
                {[
                  { icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor?.isActive('heading', { level: 1 }), label: 'H1' },
                  { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor?.isActive('heading', { level: 2 }), label: 'H2' },
                  { icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor?.isActive('heading', { level: 3 }), label: 'H3' },
                  { icon: Heading4, action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(), isActive: editor?.isActive('heading', { level: 4 }), label: 'H4' },
                  { icon: Heading5, action: () => editor?.chain().focus().toggleHeading({ level: 5 }).run(), isActive: editor?.isActive('heading', { level: 5 }), label: 'H5' },
                  { icon: Heading6, action: () => editor?.chain().focus().toggleHeading({ level: 6 }).run(), isActive: editor?.isActive('heading', { level: 6 }), label: 'H6' },
                  { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), isActive: editor?.isActive('bulletList'), label: 'Bullet List' },
                ].map((btn, idx) => (
                  <div key={idx} className="relative group/tooltip">
                    <button
                      type="button" onClick={btn.action}
                      className={cn("p-1.5 rounded-lg transition-all cursor-pointer", btn.isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60')}
                    >
                      <btn.icon className="h-3.5 w-3.5" />
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">{btn.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="flex items-center gap-2 relative group/tooltip">
                <input
                  type="color"
                  onInput={(e) => editor?.chain().focus().setColor(e.currentTarget.value).run()}
                  value={editor?.getAttributes('textStyle').color || '#000000'}
                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Text Color</div>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
              <div className="relative group/tooltip">
                <button
                  type="button"
                  onClick={() => editor?.commands.clearContent(true)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50/10 hover:text-red-600 transition-all cursor-pointer"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Clear Content</div>
                </div>
              </div>
            </div>

            {/* Note Editor Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 w-full bg-slate-100/30 dark:bg-black/25 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 text-slate-850 dark:text-white focus-within:border-blue-500/50 overflow-y-auto min-h-[300px] relative font-sans prose prose-slate dark:prose-invert max-w-none">
                <EditorContent editor={editor} />
              </div>
              <div className="h-8 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-500 px-1 pt-2">
                <div>Character count: <span className="text-slate-700 dark:text-slate-300 font-bold">{editorCharCount}</span></div>
                <div className="text-slate-400 dark:text-slate-600">Auto-saves every 5 seconds dynamically</div>
              </div>
            </div>
          </main>
        ) : sidebarTab === 'diagrams' ? (
          /* Whiteboard Diagram Workspace */
          <main className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-black/45 backdrop-blur-md p-5 relative">
            {renderDiagnosticBar('-mx-5 -mt-5 mb-4')}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditorDiagramId(null);
                    setSidebarTab('files');
                    if (excalidrawAPI) excalidrawAPI.resetScene();
                    setDiagramName('');
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Back to Files"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-indigo-500" /> Secure Diagrams
                  </h2>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">
                    Draw architecture diagrams or sketch notes directly in your secure vault.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1 py-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustDiagramUiScale(-0.05)}
                    disabled={diagramUiScale <= 0.5}
                    title="Shrink diagram toolbar & icons"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 w-9 text-center tabular-nums select-none">
                    {Math.round(diagramUiScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustDiagramUiScale(0.05)}
                    disabled={diagramUiScale >= 1}
                    title="Grow diagram toolbar & icons"
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Diagram Name..."
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  disabled={!isDiagramEditing}
                  className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                {!isDiagramEditing ? (
                  <button
                    onClick={() => setIsDiagramEditing(true)}
                    className="px-3 py-1.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={saveDiagramToVault}
                    disabled={!diagramName.trim()}
                    className="px-3 py-1.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-4 w-4" /> Save
                  </button>
                )}
              </div>
            </div>

            {/* Drawing Canvas Area */}
            <div className="flex-1 rounded-2xl border border-slate-300 dark:border-slate-800/80 overflow-hidden relative shadow-inner h-[calc(100vh-140px)] w-full">
              {/* Excalidraw's own toolbar/icons are sized for a full desktop app and
                  read as oversized inside this embedded panel — diagramUiScale (set via
                  the zoom controls above) shrinks the whole thing with CSS zoom rather
                  than transform, since transform would leave Excalidraw's internal
                  pointer math reading the pre-scale layout rect, misaligning clicks/draws
                  from what's visually shown. The width/height compensate so the zoomed-out
                  result still fills the frame instead of leaving dead space bottom-right. */}
              <div
                className="h-full w-full"
                style={{
                  zoom: diagramUiScale,
                  width: `${100 / diagramUiScale}%`,
                  height: `${100 / diagramUiScale}%`,
                }}
              >
                <Excalidraw
                  excalidrawAPI={(api) => setExcalidrawAPI(api)}
                  theme={isDarkMode ? 'dark' : 'light'}
                  viewModeEnabled={!isDiagramEditing}
                  UIOptions={{
                    canvasActions: {
                      toggleTheme: true,
                      export: { saveFileToDisk: true },
                    }
                  }}
                />
              </div>
            </div>
          </main>
        ) : sidebarTab === 'events' ? (
          /* Events tab: auto date-clustered upload hierarchy */
          <main className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-black/45 backdrop-blur-md p-4">
            {renderDiagnosticBar('-mx-4 -mt-4 mb-4')}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Events</h2>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Uploads auto-grouped by time proximity, browsable by year and month</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {isLoadingEvents ? (
                <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading events...
                </div>
              ) : eventsTree.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100/5 dark:bg-slate-900/5">
                  <Calendar className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                  <span>No events yet — upload some files to see them clustered here.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventsTree.map((yearNode) => (
                    <div key={yearNode.year} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100/5 dark:bg-slate-900/5">
                      <button
                        onClick={() => setExpandedYears(prev => {
                          const next = new Set(prev);
                          if (next.has(yearNode.year)) next.delete(yearNode.year); else next.add(yearNode.year);
                          return next;
                        })}
                        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{yearNode.year}</span>
                        <ChevronRight className={cn("h-4 w-4 text-slate-500 dark:text-slate-500 transition-transform", expandedYears.has(yearNode.year) && "rotate-90")} />
                      </button>

                      {expandedYears.has(yearNode.year) && (
                        <div className="pb-2">
                          {yearNode.months.map((monthNode) => {
                            const monthKey = `${yearNode.year}-${monthNode.month}`;
                            return (
                              <div key={monthKey} className="ml-3 border-l border-slate-200 dark:border-slate-800">
                                <button
                                  onClick={() => setExpandedMonths(prev => {
                                    const next = new Set(prev);
                                    if (next.has(monthKey)) next.delete(monthKey); else next.add(monthKey);
                                    return next;
                                  })}
                                  className="w-full flex items-center justify-between pl-4 pr-4 py-2 text-left cursor-pointer hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{monthNode.month}</span>
                                  <span className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-600">
                                    {monthNode.events.length} event{monthNode.events.length !== 1 ? 's' : ''}
                                    <ChevronRight className={cn("h-3 w-3 transition-transform", expandedMonths.has(monthKey) && "rotate-90")} />
                                  </span>
                                </button>

                                {expandedMonths.has(monthKey) && (
                                  <div className="ml-4 pb-1 space-y-1.5 pr-2">
                                    {monthNode.events.map((ev, idx) => {
                                      const startD = new Date(ev.start);
                                      const endD = new Date(ev.end);
                                      const sameDay = startD.toDateString() === endD.toDateString();
                                      return (
                                        <button
                                          key={`${monthKey}-${idx}`}
                                          onClick={() => openEvent(ev)}
                                          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-900/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left cursor-pointer group"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                              <Calendar className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                                {sameDay
                                                  ? startD.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                                                  : `${startD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                                              </div>
                                              <div className="text-[9px] text-slate-500 dark:text-slate-500 truncate">{ev.sampleName}{ev.count > 1 ? ` + ${ev.count - 1} more` : ''}</div>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{ev.count} file{ev.count !== 1 ? 's' : ''}</div>
                                            <div className="text-[9px] text-slate-400 dark:text-slate-600">{formatSize(ev.totalBytes)}</div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        ) : sidebarTab === 'admin' && userRole === 'superadmin' ? (
          /* Superadmin dashboard: user management — userRole is re-checked here (not just
             sidebarTab) as defense in depth: sidebarTab is plain UI state that survives a
             logout/re-login as a different user in the same tab, and without this check a
             regular user landing back on a stale sidebarTab==='admin' would render whatever
             admin data (other users' emails, quotas, etc.) was last fetched into memory. */
          <main className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-black/45 backdrop-blur-md p-4">
            {renderDiagnosticBar('-mx-4 -mt-4 mb-4')}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> User Management</h2>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">Superadmin only — view usage, activate/deactivate, adjust quotas, or remove users</div>
              </div>
              <button
                onClick={fetchAdminUsers}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg font-bold transition-all cursor-pointer text-xs"
              >
                <RotateCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingAdminUsers ? (
                <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading users...
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100/5 dark:bg-slate-900/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[9px] font-black bg-slate-100/15 dark:bg-slate-900/15">
                        <th className="py-2.5 px-4">User</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 w-[22%]">Storage Usage</th>
                        <th className="py-2.5 px-4">Files</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((u) => {
                        const isProtected = u.role === 'superadmin';
                        const barColor = u.percentUsed > 90 ? '#ef4444' : u.percentUsed > 70 ? '#f59e0b' : '#3b82f6';
                        return (
                          <tr key={u.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-100/10 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {u.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700" />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                    {(u.name || u.email).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{u.name || u.email}</div>
                                  <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-500">
                                    <span className="break-all">{u.email}</span>
                                    <CopyButton
                                      value={u.email}
                                      tooltip="Copy email"
                                      toastMessage={false}
                                      className="h-4 w-4 p-0 shrink-0"
                                      iconClassName="h-2.5 w-2.5"
                                    />
                                  </div>
                                  {u.mobileNumber && (
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-600">
                                      <Smartphone className="h-2.5 w-2.5 shrink-0" />
                                      <span className="break-all">{u.mobileNumber}</span>
                                      <CopyButton
                                        value={u.mobileNumber}
                                        tooltip="Copy mobile number"
                                        toastMessage={false}
                                        className="h-4 w-4 p-0 shrink-0"
                                        iconClassName="h-2.5 w-2.5"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border",
                                isProtected ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" : "bg-slate-200/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              )}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => !isProtected && setUserActiveStatus(u.id, !u.isActive)}
                                disabled={isProtected}
                                className={cn(
                                  "flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border transition-all uppercase tracking-wide",
                                  isProtected ? "bg-slate-200/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-90" :
                                    u.isActive ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500/25 cursor-pointer shadow-sm shadow-emerald-500/5" :
                                      "bg-red-500/15 border-red-500/40 text-red-650 dark:text-red-400 hover:bg-red-500/25 cursor-pointer shadow-sm shadow-red-500/5"
                                )}
                              >
                                {isProtected ? <Shield className="h-3 w-3 text-emerald-500" /> : <span className={cn("h-1.5 w-1.5 rounded-full", u.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />}
                                {isProtected ? 'Active' : (u.isActive ? 'Active' : 'Inactive')}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-500 mb-1">
                                <span>{formatSize(u.usedBytes)} / {formatSize(u.quotaBytes)}</span>
                                <span className="font-bold" style={{ color: barColor }}>{u.percentUsed.toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-100 dark:border-slate-900">
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, u.percentUsed)}%`, backgroundColor: barColor }} />
                              </div>
                              {quotaEditUserId === u.id ? (
                                <div className="flex items-center gap-1.5 mt-2 bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/30 rounded-lg px-2 py-1.5 shadow-sm">
                                  <input
                                    type="number" min="0" step="0.1" autoFocus
                                    value={quotaEditValue}
                                    onChange={(e) => setQuotaEditValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveUserQuota(u.id); if (e.key === 'Escape') setQuotaEditUserId(null); }}
                                    className="w-14 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/60"
                                  />
                                  <select
                                    value={quotaEditUnit}
                                    onChange={(e) => setQuotaEditUnit(e.target.value as typeof quotaEditUnit)}
                                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-1 py-1 text-[9px] font-bold text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-500/60 cursor-pointer"
                                  >
                                    <option value="B">B</option>
                                    <option value="KB">KB</option>
                                    <option value="MB">MB</option>
                                    <option value="GB">GB</option>
                                  </select>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      onClick={() => saveUserQuota(u.id)}
                                      title="Save"
                                      className="p-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                                    ><Check className="h-3 w-3" /></button>
                                    <button
                                      onClick={() => setQuotaEditUserId(null)}
                                      title="Cancel"
                                      className="p-1 rounded bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                                    ><X className="h-3 w-3" /></button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setQuotaEditUserId(u.id); setQuotaEditValue((u.quotaBytes / 1024 ** 3).toFixed(1)); setQuotaEditUnit('GB'); }}
                                  className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                                >
                                  <Pencil className="h-2.5 w-2.5" /> Adjust quota
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              <div>{u.fileCount} files</div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-600">{u.folderCount} folders</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isProtected ? (
                                <span className="text-[9px] text-slate-400 dark:text-slate-600 italic">Protected account</span>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <div className="relative group/tooltip">
                                    <button
                                      onClick={() => openAdminChangePasswordModal(u)}
                                      className="flex items-center gap-1 px-2 py-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 cursor-pointer text-[10px] font-bold"
                                    >
                                      <KeyRound className="h-3 w-3" /> Reset Pwd
                                    </button>
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 scale-95 group-hover/tooltip:scale-100 z-50">
                                      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Change Password</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setDeleteConfirmUser(u)}
                                    className="p-1.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        ) : sidebarTab === 'uploads' ? (
          /* Upload list management tab */
          <main className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-black/45 backdrop-blur-md p-4">
            {renderDiagnosticBar('-mx-4 -mt-4 mb-4')}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Upload Sessions</h2>
              <div className="text-[10px] text-slate-500 dark:text-slate-500">Track multi-chunk uploads to S3</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {uploadsList.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100/5 dark:bg-slate-900/5">
                  <Upload className="h-8 w-8 text-slate-400 dark:text-slate-600 animate-bounce" />
                  <span>No active S3 uploads queued.</span>
                </div>
              ) : (
                uploadsList.map((up) => {
                  const isMobile = up.source === 'mobile';
                  return (
                  <div
                    key={up.id}
                    className={cn(
                      "p-4 border rounded-xl space-y-3 relative overflow-hidden transition-colors",
                      isMobile
                        ? "border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.06] to-violet-500/[0.03] shadow-[0_0_16px_rgba(99,102,241,0.06)]"
                        : "border-slate-200/80 dark:border-slate-800/80 bg-slate-100/20 dark:bg-slate-900/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon className={cn("h-4 w-4 shrink-0", isMobile ? "text-indigo-500 dark:text-indigo-400" : "text-blue-600 dark:text-blue-400")} />
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{up.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 shrink-0">({formatSize(up.size)})</span>
                        {isMobile && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wide shrink-0">
                            <Smartphone className="h-2.5 w-2.5" /> Mobile
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            up.status === 'completed' && "bg-emerald-500/10 text-emerald-450",
                            up.status === 'uploading' && (isMobile ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 animate-pulse" : "bg-blue-500/10 text-blue-450 animate-pulse"),
                            up.status === 'paused' && "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                            up.status === 'failed' && "bg-red-500/10 text-red-450"
                          )}
                        >
                          {up.status}
                        </span>

                        <div className="flex gap-1 pl-2">
                          {up.status === 'uploading' && (
                            <div className="relative group/pause">
                              <button
                                onClick={() => isMobile ? pauseRemoteUpload(up.id) : pauseUpload(up.id)}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <Pause className="h-3 w-3" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/pause:opacity-100 transition-opacity duration-100 z-50">
                                <div className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl whitespace-nowrap">Pause upload</div>
                              </div>
                            </div>
                          )}
                          {up.status === 'paused' && (
                            <div className="relative group/resume">
                              <button
                                onClick={() => {
                                  if (isMobile) {
                                    resumeRemoteUpload(up.id);
                                  } else {
                                    toast.error('To resume, re-add the file to re-initiate chunk sequence.');
                                  }
                                }}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <Play className="h-3 w-3" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/resume:opacity-100 transition-opacity duration-100 z-50">
                                <div className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl whitespace-nowrap">Resume upload</div>
                              </div>
                            </div>
                          )}
                          {up.status !== 'completed' && up.status !== 'cancelled' && (
                            <div className="relative group/cancel">
                              <button
                                onClick={() => isMobile ? cancelRemoteUpload(up.id) : cancelUpload(up.id)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/cancel:opacity-100 transition-opacity duration-100 z-50">
                                <div className="bg-red-950 border border-red-800/60 text-red-300 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl whitespace-nowrap">Cancel upload</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", isMobile ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-blue-500")}
                          style={{ width: `${up.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-500">
                        <div>{isMobile ? `Parts: ${up.totalParts ?? '?'}` : `Chunks: ${up.chunks.length} parts`}</div>
                        <div>Progress: {up.progress}%</div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </main>
        ) : (
          /* Main Explorer layout */
          <main
            className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-black/45 backdrop-blur-md relative"
            onDragEnter={handlePageDragEnter}
            onDragOver={handlePageDragOver}
            onDragLeave={handlePageDragLeave}
            onDrop={(e) => handlePageDrop(e, currentFolderId)}
          >
            {isDraggingFileOverPage && (
              <div className="absolute inset-0 z-[150] flex items-center justify-center bg-indigo-900/40 dark:bg-black/60 backdrop-blur-md rounded-2xl pointer-events-none m-3 shadow-[inset_0_0_0_3px_rgba(99,102,241,0.5)] transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center gap-4 text-indigo-500 dark:text-indigo-400 bg-white/90 dark:bg-slate-900/90 p-10 rounded-[2rem] shadow-2xl border border-indigo-100 dark:border-indigo-500/30 scale-110">
                  <div className="p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <Upload className="h-12 w-12 animate-bounce text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-2xl tracking-tight text-slate-800 dark:text-slate-100">Drop files to upload</div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Uploading to <span className="text-indigo-600 dark:text-indigo-400">{currentFolderId ? 'this folder' : 'root'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {renderDiagnosticBar()}

            {/* Action Bar */}
            <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 px-5 flex items-center justify-between shrink-0 bg-slate-100/10 dark:bg-slate-900/10">

              {/* Left Actions */}
              <div className="flex items-center gap-3.5">
                {sidebarTab === 'files' ? (
                  <>
                    <button
                      onClick={() => setIsCreateFolderOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <FolderPlus className="h-4 w-4 text-blue-550 dark:text-blue-400" />
                      New Folder
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/10">
                      <Upload className="h-4 w-4" />
                      Upload File
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <button
                      onClick={() => { setIsSelecting(v => !v); if (isSelecting) setSelectedItems(new Set()); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                        isSelecting
                          ? "bg-blue-600/20 border-blue-500/40 text-blue-700 dark:text-blue-300"
                          : "bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      {isSelecting ? <CheckSquare className="h-4 w-4" /> : <SquareIcon className="h-4 w-4" />}
                      Select
                    </button>
                  </>
                ) : sidebarTab === 'notes' ? (
                  <button
                    onClick={triggerNewNote}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    New Text Note
                  </button>
                ) : (
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Trash Archive</div>
                )}
              </div>

              {/* Right Search / Filter Actions */}
              <div className="flex items-center gap-2">
                <div className="relative group/filter z-40">
                  <button className={cn(
                    "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-colors shadow-sm",
                    filterMimeCategories.length > 0 ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400" : "bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}>
                    <Filter className="h-3.5 w-3.5" />
                    <span className="capitalize">{filterMimeCategories.length === 0 ? 'All Files' : (filterMimeCategories.length === 1 ? filterMimeCategories[0] : `${filterMimeCategories.length} Types`)}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-1" />
                  </button>
                  <div className="pointer-events-none absolute top-full right-0 md:left-0 md:right-auto mt-2 w-60 bg-white/95 dark:bg-[#0d1526]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl opacity-0 group-hover/filter:opacity-100 group-hover/filter:pointer-events-auto transition-all transform origin-top-right md:origin-top-left -translate-y-2 group-hover/filter:translate-y-0 overflow-hidden z-50">
                    <div className="p-1.5 flex flex-col max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                      {[
                        { key: 'all', label: 'All Files', icon: FolderTree, color: '#64748b' },
                        { divider: true },
                        { key: 'images', label: 'Images', icon: ImageIcon, color: '#8b5cf6' },
                        { key: 'video', label: 'Videos', icon: Video, color: '#3b82f6' },
                        { key: 'audio', label: 'Audio', icon: Music, color: '#f59e0b' },
                        { key: 'archives', label: 'Archives', icon: Archive, color: '#ef4444' },
                        { key: 'diagrams', label: 'Diagrams', icon: Palette, color: '#ec4899' },
                        { key: 'pdf', label: 'PDF Documents', icon: FileText, color: '#dc2626' },
                        { key: 'word', label: 'Word Documents', icon: FileText, color: '#2563eb' },
                        { key: 'excel', label: 'Excel Spreadsheets', icon: Table, color: '#16a34a' },
                        { key: 'powerpoint', label: 'Presentations', icon: MonitorPlay, color: '#ea580c' },
                        { key: 'text', label: 'Text Notes', icon: Type, color: '#52525b' },
                        { key: 'code', label: 'Source Code', icon: FileCode2, color: '#14b8a6' },
                        { key: 'other', label: 'Other Formats', icon: FileIcon, color: '#64748b' },
                      ].map((item, idx) => {
                        if (item.divider) return <div key={`div-${idx}`} className="h-px bg-slate-200 dark:bg-slate-800/60 my-1.5 mx-2" />;
                        const cat = item.key as string;
                        const Icon = item.icon as React.ElementType;
                        const isActive = cat === 'all' ? filterMimeCategories.length === 0 : filterMimeCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleMimeCategory(cat)}
                            className={cn(
                              "text-left px-3 py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-between group/btn",
                              isActive ? "bg-slate-100 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-1.5 rounded-lg border", isActive ? "border-slate-300 dark:border-slate-700" : "border-transparent")}>
                                <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                              </div>
                              <span style={{ color: isActive ? item.color : undefined }} className="transition-colors">{item.label}</span>
                            </div>
                            {isActive ? (
                              <div className="h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 dark:text-slate-500" />
                  <input
                    type="text"
                    className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 w-48 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                    placeholder="Search folder..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Debounce search in a simple timeout
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadStorageItems();
                    }}
                  />
                </div>

                <div className="relative group/sort">
                  <button
                    onClick={() => {
                      const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                      setSortOrder(nextOrder);
                    }}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/sort:opacity-100 transition-opacity duration-150 z-50">
                    <div className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      Toggle sort order ({sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'})
                    </div>
                  </div>
                </div>

                <div className="flex border border-slate-100 dark:border-slate-900 rounded-lg overflow-hidden bg-slate-50/60 dark:bg-slate-950/60">
                  <div className="relative group/grid">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 cursor-pointer transition-colors",
                        viewMode === 'grid' ? "bg-slate-200 dark:bg-slate-800 text-blue-450" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/grid:opacity-100 transition-opacity duration-150 z-50">
                      <div className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">Grid view</div>
                    </div>
                  </div>
                  <div className="relative group/list">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 cursor-pointer transition-colors",
                        viewMode === 'list' ? "bg-slate-200 dark:bg-slate-800 text-blue-450" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/list:opacity-100 transition-opacity duration-150 z-50">
                      <div className="bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">List view</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Breadcrumbs (only for Files Tab) */}
            {sidebarTab === 'files' && (
              <div className="h-9 border-b border-slate-100 dark:border-slate-900 px-4 flex items-center gap-1 bg-slate-100/5 dark:bg-slate-900/5 text-[10px] shrink-0 text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => navigateBreadcrumb(-1)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold cursor-pointer"
                >
                  Root
                </button>
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
                    <button
                      onClick={() => navigateBreadcrumb(index)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold cursor-pointer max-w-[120px] truncate"
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Bulk selection action bar */}
            {selectedItems.size > 0 && (
              <div className="h-11 border-b border-blue-500/20 bg-blue-500/5 px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedItems.size} selected</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setMoveTargetItems(Array.from(selectedItems)); fetchAllFolders(); setShowMoveModal(true); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    <FolderTree className="h-3.5 w-3.5" /> Move
                  </button>
                  <button
                    onClick={handleTriggerBulkDelete}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {sidebarTab === 'trash' ? 'Delete permanently' : 'Move to trash'}
                  </button>
                  <button
                    onClick={() => { setSelectedItems(new Set()); setIsSelecting(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              </div>
            )}

            {/* Folder / Items Listing Container */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isLoadingItems ? (
                <div className="h-64 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
                  <Loader2 className="animate-spin h-5 w-5 mr-2 text-blue-500" />
                  Loading...
                </div>
              ) : items.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-gradient-to-b from-blue-500/[0.03] to-transparent hover:border-blue-400/60 dark:hover:border-blue-500/40 transition-colors">
                  <div className="p-4 bg-blue-500/10 rounded-full">
                    <Upload className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      {sidebarTab === 'trash' ? 'Trash is empty' : sidebarTab === 'files' ? 'Drag & drop files here' : 'No items found'}
                    </div>
                    {sidebarTab === 'files' && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">or click below to browse from your device</div>
                    )}
                  </div>
                  {sidebarTab === 'files' && (
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/10">
                      <Upload className="h-3.5 w-3.5" />
                      Browse Files
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid view display */
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable={sidebarTab !== 'trash'}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={item.type === 'folder' ? (e) => handleDragOverFolder(e, item.id) : undefined}
                      onDragLeave={item.type === 'folder' ? () => setDragOverFolderId(null) : undefined}
                      onDrop={item.type === 'folder' ? (e) => handleDropOnFolder(e, item.id) : undefined}
                      data-drop-folder-id={item.type === 'folder' ? item.id : undefined}
                      onTouchStart={(e) => handleItemTouchStart(e, item)}
                      onTouchMove={handleItemTouchMoveBeforeDrag}
                      onTouchEnd={cancelTouchLongPress}
                      className={cn(
                        "p-4 border border-l-2 bg-slate-100/10 dark:bg-slate-900/10 rounded-xl transition-all duration-300 flex flex-col justify-between group relative h-32 select-none",
                        (item.type === 'folder' || (item.type === 'file' && item.mime_type === 'text/plain' && sidebarTab !== 'trash')) ? 'cursor-pointer hover:bg-slate-100/10 dark:hover:bg-slate-900/10' : 'cursor-default',
                        dragOverFolderId === item.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10 scale-[1.03] shadow-lg shadow-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800/80 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] hover:bg-slate-50/40 dark:hover:bg-slate-900/50',
                        selectedItems.has(item.id) && 'border-blue-500/60 bg-blue-500/5',
                        draggedItemId === item.id && 'opacity-40 scale-95 rotate-1'
                      )}
                      style={{ borderLeftColor: item.type === 'folder' ? '#f59e0b' : getFileColor(item.mime_type) }}
                      onClick={() => {
                        if (consumeTouchDragClick()) return;
                        if (isSelecting) { toggleSelect(item.id); return; }
                        if (item.type === 'folder') {
                          navigateToFolder(item);
                        } else if (item.type === 'file' && item.mime_type === 'text/plain' && sidebarTab !== 'trash') {
                          openNoteEditor(item);
                        } else if (item.type === 'file' && item.mime_type === 'application/excalidraw' && sidebarTab !== 'trash') {
                          openDiagramEditor(item);
                        } else if (item.type === 'file' && sidebarTab !== 'trash') {
                          setPreviewItem(item);
                        }
                      }}
                    >
                      {/* Top Action Row */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          {isSelecting && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                              className="text-blue-600 dark:text-blue-400 cursor-pointer shrink-0"
                            >
                              {selectedItems.has(item.id) ? <CheckSquare className="h-4 w-4" /> : <SquareIcon className="h-4 w-4" />}
                            </button>
                          )}
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center border"
                            style={{ 
                              color: item.type === 'folder' ? '#f59e0b' : getFileColor(item.mime_type),
                              backgroundColor: item.type === 'folder' ? '#f59e0b1a' : `${getFileColor(item.mime_type)}1a`,
                              borderColor: item.type === 'folder' ? '#f59e0b33' : `${getFileColor(item.mime_type)}33`
                            }}
                          >
                            {item.type === 'folder' ? <Folder className="h-4.5 w-4.5" /> : <FileIcon className="h-4.5 w-4.5" />}
                          </div>
                          {!isSelecting && sidebarTab !== 'trash' && (
                            <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                          )}
                        </div>

                        {/* Interactive operations menu */}
                        {!isSelecting && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            {item.type === 'file' && item.mime_type === 'text/plain' && (
                              <div className="relative group/edit">
                                <button
                                  aria-label={`Edit note ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); openNoteEditor(item); }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                                >
                                  <FileText className="h-3 w-3" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/edit:opacity-100 transition-all duration-200 scale-95 group-hover/edit:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Edit note</div>
                                </div>
                              </div>
                            )}
                            {item.type === 'file' && (
                              <div className="relative group/dl">
                                <button
                                  aria-label={`Download ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); downloadFile(item); }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                                >
                                  <Upload className="h-3 w-3 rotate-180" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/dl:opacity-100 transition-all duration-200 scale-95 group-hover/dl:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Download</div>
                                </div>
                              </div>
                            )}
                            {item.type === 'file' && sidebarTab !== 'trash' && (
                              <div className="relative group/share">
                                <button
                                  aria-label={`Share ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); shareFile(item); }}
                                  disabled={shareLoadingId === item.id}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer disabled:opacity-50"
                                >
                                  {shareLoadingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/share:opacity-100 transition-all duration-200 scale-95 group-hover/share:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Share (10 min link)</div>
                                </div>
                              </div>
                            )}
                            {sidebarTab !== 'trash' && (
                              <div className="relative group/tag">
                                <button
                                  aria-label={`Tags for ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); setTagModalItem(item); setShowTagModal(true); }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                                >
                                  <Tag className="h-3 w-3" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/tag:opacity-100 transition-all duration-200 scale-95 group-hover/tag:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Tags</div>
                                </div>
                              </div>
                            )}
                            {sidebarTab === 'trash' && (
                              <div className="relative group/restore">
                                <button
                                  aria-label={`Restore ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); restoreItem(item); }}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/restore:opacity-100 transition-all duration-200 scale-95 group-hover/restore:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Restore item</div>
                                </div>
                              </div>
                            )}
                            <div className="relative group/rename">
                              <button
                                aria-label={`Rename ${item.name}`}
                                onClick={(e) => { e.stopPropagation(); setRenameItemId(item.id); setRenameItemName(item.name); }}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/rename:opacity-100 transition-all duration-200 scale-95 group-hover/rename:scale-100 z-50">
                                <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Rename</div>
                              </div>
                            </div>
                            <div className="relative group/del">
                              <button
                                aria-label={sidebarTab === 'trash' ? `Delete ${item.name} permanently` : `Move ${item.name} to trash`}
                                onClick={(e) => { e.stopPropagation(); handleTriggerDelete(item); }}
                                className="p-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/del:opacity-100 transition-all duration-200 scale-95 group-hover/del:scale-100 z-50">
                                <div className="bg-red-950 border border-red-800/60 text-red-300 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl whitespace-nowrap">{sidebarTab === 'trash' ? 'Delete permanently' : 'Move to trash'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Info Row */}
                      <div className="mt-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-500 mt-1 flex justify-between">
                          <span>{item.type === 'folder' ? 'Folder' : formatSize(item.size)}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[8px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-1.5 py-0.5">#{t}</span>
                            ))}
                            {item.tags.length > 3 && <span className="text-[8px] text-slate-400 dark:text-slate-600">+{item.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List view display */
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100/5 dark:bg-slate-900/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[9px] font-black bg-slate-100/15 dark:bg-slate-900/15">
                        {isSelecting && <th className="py-2.5 px-4 w-8"></th>}
                        {[
                          { key: 'name', label: 'Name', width: isSelecting ? '48%' : '52%' },
                          { key: 'size', label: 'Size', width: '14%' },
                          { key: 'created_at', label: 'Created At', width: '14%' },
                        ].map(col => (
                          <th
                            key={col.key}
                            style={{ width: col.width }}
                            className="py-2.5 px-4 cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            onClick={() => {
                              if (sortBy === col.key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              else { setSortBy(col.key); setSortOrder('asc'); }
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {sortBy === col.key && <ArrowUpDown className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />}
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-4 w-[20%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          draggable={sidebarTab !== 'trash'}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                          onDragOver={item.type === 'folder' ? (e) => handleDragOverFolder(e, item.id) : undefined}
                          onDragLeave={item.type === 'folder' ? () => setDragOverFolderId(null) : undefined}
                          onDrop={item.type === 'folder' ? (e) => handleDropOnFolder(e, item.id) : undefined}
                          data-drop-folder-id={item.type === 'folder' ? item.id : undefined}
                          onTouchStart={(e) => handleItemTouchStart(e, item)}
                          onTouchMove={handleItemTouchMoveBeforeDrag}
                          onTouchEnd={cancelTouchLongPress}
                          className={cn(
                            "border-b border-slate-100 dark:border-slate-900 hover:bg-slate-100/10 dark:hover:bg-slate-900/10 transition-all",
                            (item.type === 'folder' || (item.type === 'file' && item.mime_type === 'text/plain' && sidebarTab !== 'trash')) && "cursor-pointer",
                            dragOverFolderId === item.id && "bg-blue-500/10 ring-1 ring-inset ring-blue-500/50 shadow-inner",
                            selectedItems.has(item.id) && "bg-blue-500/5",
                            draggedItemId === item.id && "opacity-40"
                          )}
                          onClick={() => {
                            if (consumeTouchDragClick()) return;
                            if (isSelecting) { toggleSelect(item.id); return; }
                            if (item.type === 'folder') {
                              navigateToFolder(item);
                            } else if (item.type === 'file' && item.mime_type === 'text/plain' && sidebarTab !== 'trash') {
                              openNoteEditor(item);
                            } else if (item.type === 'file' && item.mime_type === 'application/excalidraw' && sidebarTab !== 'trash') {
                              openDiagramEditor(item);
                            } else if (item.type === 'file' && sidebarTab !== 'trash') {
                              setPreviewItem(item);
                            }
                          }}
                        >
                          {isSelecting && (
                            <td className="py-3 px-4">
                              <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="text-blue-600 dark:text-blue-400 cursor-pointer">
                                {selectedItems.has(item.id) ? <CheckSquare className="h-4 w-4" /> : <SquareIcon className="h-4 w-4" />}
                              </button>
                            </td>
                          )}
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              {item.type === 'folder' ? (
                                <Folder className="h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
                              ) : (
                                <FileIcon className="h-4 w-4 shrink-0" style={{ color: getFileColor(item.mime_type) }} />
                              )}
                              <span className="truncate max-w-sm">{item.name}</span>
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 pl-6">
                                {item.tags.map(t => (
                                  <span key={t} className="text-[8px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-1.5 py-0.5">#{t}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {item.type === 'folder' ? 'Folder' : formatSize(item.size)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2.5">
                              {item.type === 'file' && item.mime_type === 'text/plain' && (
                                <div className="relative group/edit">
                                  <button
                                    aria-label={`Edit note ${item.name}`}
                                    onClick={(e) => { e.stopPropagation(); openNoteEditor(item); }}
                                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-105 cursor-pointer"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/edit:opacity-100 transition-all duration-200 scale-95 group-hover/edit:scale-100 z-50">
                                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Edit note</div>
                                  </div>
                                </div>
                              )}
                              {item.type === 'file' && (
                                <div className="relative group/dl">
                                  <button
                                    aria-label={`Download ${item.name}`}
                                    onClick={(e) => { e.stopPropagation(); downloadFile(item); }}
                                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-105 cursor-pointer"
                                  >
                                    <Upload className="h-3.5 w-3.5 rotate-180" />
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/dl:opacity-100 transition-all duration-200 scale-95 group-hover/dl:scale-100 z-50">
                                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Download</div>
                                  </div>
                                </div>
                              )}
                              {item.type === 'file' && sidebarTab !== 'trash' && (
                                <div className="relative group/share">
                                  <button
                                    aria-label={`Share ${item.name}`}
                                    onClick={(e) => { e.stopPropagation(); shareFile(item); }}
                                    disabled={shareLoadingId === item.id}
                                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-105 cursor-pointer disabled:opacity-50"
                                  >
                                    {shareLoadingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/share:opacity-100 transition-all duration-200 scale-95 group-hover/share:scale-100 z-50">
                                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Share (10 min link)</div>
                                  </div>
                                </div>
                              )}
                              {sidebarTab !== 'trash' && (
                                <div className="relative group/tag">
                                  <button
                                    aria-label={`Tags for ${item.name}`}
                                    onClick={(e) => { e.stopPropagation(); setTagModalItem(item); setShowTagModal(true); }}
                                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-105 cursor-pointer"
                                  >
                                    <Tag className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tag:opacity-100 transition-all duration-200 scale-95 group-hover/tag:scale-100 z-50">
                                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Tags</div>
                                  </div>
                                </div>
                              )}
                              {sidebarTab === 'trash' && (
                                <div className="relative group/restore">
                                  <button
                                    aria-label={`Restore ${item.name}`}
                                    onClick={(e) => { e.stopPropagation(); restoreItem(item); }}
                                    className="p-1.5 rounded bg-slate-205 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-105 cursor-pointer"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/restore:opacity-100 transition-all duration-200 scale-95 group-hover/restore:scale-100 z-50">
                                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Restore item</div>
                                  </div>
                                </div>
                              )}
                              <div className="relative group/rename">
                                <button
                                  aria-label={`Rename ${item.name}`}
                                  onClick={(e) => { e.stopPropagation(); setRenameItemId(item.id); setRenameItemName(item.name); }}
                                  className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-650 dark:text-slate-400 hover:text-slate-905 dark:hover:text-slate-105 cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/rename:opacity-100 transition-all duration-200 scale-95 group-hover/rename:scale-100 z-50">
                                  <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-200/10 dark:border-slate-800/40 text-slate-200 dark:text-slate-100 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl backdrop-blur-md whitespace-nowrap">Rename</div>
                                </div>
                              </div>
                              <div className="relative group/del">
                                <button
                                  aria-label={sidebarTab === 'trash' ? `Delete ${item.name} permanently` : `Move ${item.name} to trash`}
                                  onClick={(e) => { e.stopPropagation(); handleTriggerDelete(item); }}
                                  className="p-1.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/25 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/del:opacity-100 transition-all duration-200 scale-95 group-hover/del:scale-100 z-50">
                                  <div className="bg-red-950 border border-red-800/60 text-red-300 text-[9px] font-semibold px-2 py-1 rounded-md shadow-xl whitespace-nowrap">{sidebarTab === 'trash' ? 'Delete permanently' : 'Move to trash'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Create New Folder</h3>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createFolder();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreateFolderOpen(false)}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Create New Note</h3>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
              placeholder="Note title (e.g. Meeting Notes)"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createNewNote();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={createNewNote}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameItemId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Rename Item</h3>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
              value={renameItemName}
              onChange={(e) => setRenameItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  renameItem();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameItemId(null)}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={renameItem}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Scan Modal */}
      {showMobileScanModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowMobileScanModal(false)}>
          <div
            className="relative w-full max-w-sm rounded-2xl p-px bg-gradient-to-br from-indigo-500/60 via-violet-500/30 to-transparent shadow-2xl shadow-indigo-950/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative bg-[#0b1120] rounded-[15px] p-8 flex flex-col items-center overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setShowMobileScanModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-10 flex flex-col items-center w-full">
                {connectedMobileDevice ? (
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/50">
                    <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 animate-ping" />
                    <Smartphone className="h-8 w-8 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-950/50">
                    <QrCode className="h-8 w-8 text-indigo-400" />
                  </div>
                )}

                <h3 className="text-xl font-black text-white mb-1.5 text-center flex items-center gap-1.5">
                  {connectedMobileDevice ? 'Device Connected' : 'Mobile Upload Scan'}
                  <Sparkles className={cn("h-4 w-4", connectedMobileDevice ? "text-emerald-400" : "text-indigo-400")} />
                </h3>
                <p className="text-slate-400 text-xs text-center mb-6 max-w-[16rem]">
                  {connectedMobileDevice
                    ? 'The connected device can now upload files directly into your vault.'
                    : 'Scan this QR code with your mobile device to securely upload files directly into your vault.'}
                </p>

                {connectedMobileDevice ? (
                  <div className="w-full flex flex-col items-center gap-3 mb-6 py-6 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
                    </div>
                    <span className="text-white font-bold text-sm text-center">{connectedMobileDevice.label}</span>
                    <span className="text-slate-500 text-[10px]">Waiting for a file to be selected...</span>
                  </div>
                ) : (
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
                    <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />
                    <div className="bg-white p-4 rounded-xl shadow-inner">
                      {generatedMobileToken && <QRCodeSVG value={`${window.location.origin}/m/${generatedMobileToken}`} size={180} />}
                    </div>
                  </div>
                )}

                <div className="w-full flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-2.5 mb-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <Clock className="h-3 w-3" /> Expires In
                  </div>
                  <span className="text-indigo-400 font-mono text-sm font-bold tabular-nums">{mobileLinkRemaining || '—'}</span>
                </div>

                <div className="w-full flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-800 rounded-lg pl-3.5 pr-1.5 py-1.5 mb-6">
                  <span className="text-slate-500 text-[10px] font-mono truncate">
                    {generatedMobileToken ? `${window.location.origin}/m/${generatedMobileToken}`.replace(/^https?:\/\//, '') : ''}
                  </span>
                  <CopyButton
                    value={generatedMobileToken ? `${window.location.origin}/m/${generatedMobileToken}` : ''}
                    tooltip="Copy link"
                    toastMessage="Link copied!"
                    className="shrink-0 text-slate-400 hover:text-indigo-400"
                  />
                </div>

                <button
                  onClick={() => setShowMobileScanModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer text-sm hover:scale-[1.01] active:scale-[0.99]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Active Scans Modal */}
      {showManageLinksModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowManageLinksModal(false)}>
          <div className="bg-[#0b1120] border border-slate-700 rounded-2xl p-6 w-[32rem] shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><Link2 className="h-5 w-5 text-indigo-400" /> Active Mobile Scans</h3>
              <button onClick={() => setShowManageLinksModal(false)} className="text-slate-500 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {activeMobileLinks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No active mobile upload links found.</div>
              ) : (
                activeMobileLinks.map(link => (
                  <div key={link.id} className={cn(
                    "border rounded-xl p-4 flex items-center justify-between gap-3 group transition-colors",
                    link.connected_at ? "bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  )}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "relative h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center",
                        link.connected_at ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/60 border-slate-700"
                      )}>
                        {link.connected_at && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                        <Smartphone className={cn("h-4 w-4", link.connected_at ? "text-emerald-400" : "text-slate-500")} />
                      </div>
                      <div className="min-w-0">
                        <div className={cn("text-xs font-bold truncate", link.connected_at ? "text-slate-100" : "text-slate-400")}>
                          {link.device_label || 'Not connected yet'}
                        </div>
                        <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
                          {link.last_seen_at && <span>Seen {formatTimeAgo(link.last_seen_at)}</span>}
                          {link.ip_address && <span>&middot; {link.ip_address}</span>}
                          <span>&middot; Expires {new Date(link.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeMobileLink(link.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-red-500/20 shrink-0"
                      title="Revoke Link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Change User Password Modal */}
      {showAdminChangePasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAdminChangePasswordModal(false)}>
          <div className="bg-white dark:bg-[#0d1526] border border-slate-300/60 dark:border-slate-700/60 rounded-2xl p-6 w-96 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Change User Password</h3>
              <button onClick={() => setShowAdminChangePasswordModal(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black mb-1.5 block">User Email</label>
                <input
                  type="text"
                  disabled
                  value={adminChangePasswordEmail}
                  className="w-full bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-500 cursor-not-allowed text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-800 dark:text-slate-200 uppercase tracking-widest font-black mb-1.5 block">New Password</label>
                <input
                  type="password"
                  placeholder="Strong password required"
                  value={adminChangePasswordNew}
                  onChange={(e) => setAdminChangePasswordNew(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-xs"
                />
                <PasswordStrengthBar password={adminChangePasswordNew} />
              </div>

              <button
                onClick={submitAdminChangePassword}
                disabled={isAdminChangingPassword || calculatePasswordStrength(adminChangePasswordNew) < 100}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 font-bold cursor-pointer transition-colors disabled:opacity-50 text-xs mt-2 flex items-center justify-center gap-2"
              >
                {isAdminChangingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
