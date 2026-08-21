import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGUAGE_TEMPLATES, LanguageTemplate, ProjectFile } from '../lib/templates';
import { CONFIG_FORMATS, ConfigFormat } from '../lib/configSchemas';

export type ActivityPanel =
  | 'explorer'
  | 'search'
  | 'git'
  | 'debug'
  | 'ai'
  | 'converter'
  | 'config'
  | 'packages'
  | 'settings';

export type BottomPanelTab = 'terminal' | 'output' | 'debugger' | 'metrics';

export interface Breakpoint {
  file: string;
  line: number;
  enabled: boolean;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: string;
}

export interface GitCommit {
  id: string;
  message: string;
  timestamp: number;
  author: string;
  filesChanged: number;
}

export interface WorkspaceSnapshot {
  id: string;
  timestamp: number;
  message: string;
  files: ProjectFile[];
  language: string;
}

export interface EditorSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  bracketPairColorization: boolean;
  autoSave: boolean;
  autoSaveDelayMs: number;
}

export interface ExecutionMetrics {
  executionTimeMs: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  exitCode: number;
  status: 'idle' | 'running' | 'success' | 'error' | 'timeout';
  provider?: string;
  sandboxId?: string;
}

export interface ExecutionRecord {
  id: string;
  runIndex: number;
  timestamp: string;
  language: string;
  entryPoint: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export interface ErrorDiagnostics {
  hasError: boolean;
  failingFile?: string;
  failingLine?: number;
  failingColumn?: number;
  errorType?: string;
  errorMessage?: string;
  rootCauseAnalysis?: string;
  suggestedFix?: string;
}

interface CloudIdeState {
  // Navigation & Panels
  activeActivityPanel: ActivityPanel;
  setActiveActivityPanel: (panel: ActivityPanel) => void;
  activeBottomTab: BottomPanelTab;
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  isBottomPanelOpen: boolean;
  toggleBottomPanel: (open?: boolean) => void;
  terminalPosition: 'bottom' | 'right';
  setTerminalPosition: (pos: 'bottom' | 'right') => void;
  toggleTerminalPosition: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: (open?: boolean) => void;

  // Workspace & Files
  currentLanguage: string;
  files: ProjectFile[];
  activeFile: string;
  openTabs: string[];
  splitFile: string | null;
  isReadOnlyWorkspace: boolean;
  sharedWorkspaceInfo: { id?: string; name?: string; author?: string } | null;
  setIsReadOnlyWorkspace: (isReadOnly: boolean) => void;
  loadSharedWorkspace: (data: {
    files: ProjectFile[];
    language: string;
    activeFile?: string;
    isReadOnly?: boolean;
    name?: string;
    id?: string;
  }) => void;
  forkWorkspace: () => void;
  setLanguage: (langId: string) => void;
  resetTemplate: (langId?: string) => void;
  resetEntireWorkspaceToBrandNew: () => void;
  selectFile: (fileName: string) => void;
  updateFileContent: (fileName: string, content: string) => void;
  createFile: (fileName: string, content?: string) => void;
  createFolder: (folderName: string) => void;
  renameFile: (oldName: string, newName: string) => void;
  deleteFile: (fileName: string) => void;
  duplicateFile: (fileName: string) => void;
  closeTab: (fileName: string) => void;
  setSplitFile: (fileName: string | null) => void;

  // Execution & Terminal
  stdinInput: string;
  setStdinInput: (val: string) => void;
  executionCount: number;
  executionHistory: ExecutionRecord[];
  terminalLogs: string[];
  stderrLogs: string[];
  clearTerminal: () => void;
  addTerminalLog: (log: string) => void;
  addStderrLog: (err: string) => void;
  metrics: ExecutionMetrics;
  setMetrics: (metrics: Partial<ExecutionMetrics>) => void;
  runCode: () => Promise<void>;
  stopExecution: () => void;
  isSandboxReady: boolean;
  prewarmDaemon: (lang?: string) => Promise<void>;

  // Error Diagnostics
  diagnostics: ErrorDiagnostics;
  setDiagnostics: (d: ErrorDiagnostics) => void;
  dismissDiagnostics: () => void;

  // AI Coding Assistant
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiLoading: boolean;
  aiResponse: string | null;
  aiDiffCode: string | null;
  aiDiffOriginal: string | null;
  aiDiffFile: string | null;
  aiAppliedNotification: { message: string; originalCode: string; file: string } | null;
  dismissAiNotification: () => void;
  revertAiApplied: () => void;
  runAiAssist: (action: 'explain' | 'fix' | 'refactor' | 'optimize' | 'test' | 'docs' | 'generate' | 'clean' | 'eli5' | 'custom', customPrompt?: string) => Promise<void>;
  acceptAiDiff: (customCode?: string) => void;
  rejectAiDiff: () => void;

  // Code Converter Studio
  converterSourceLang: string;
  converterTargetLang: string;
  converterSourceCode: string;
  converterTargetCode: string;
  converterWarnings: string[];
  converterNotes: string[];
  converterLoading: boolean;
  setConverterSourceLang: (lang: string) => void;
  setConverterTargetLang: (lang: string) => void;
  setConverterSourceCode: (code: string) => void;
  runCodeConversion: () => Promise<void>;
  applyConvertedToProject: () => void;

  // Config Studio
  selectedConfigFormat: string;
  configCode: string;
  configValidationErrors: string[];
  configViewMode: 'code' | 'tree';
  setConfigFormat: (formatId: string) => void;
  setConfigCode: (code: string) => void;
  setConfigViewMode: (mode: 'code' | 'tree') => void;

  // Debugger
  breakpoints: Breakpoint[];
  isDebugging: boolean;
  currentDebugLine: number | null;
  callStack: Array<{ functionName: string; file: string; line: number }>;
  debugVariables: Record<string, any>;
  watchList: WatchExpression[];
  toggleBreakpoint: (file: string, line: number) => void;
  addWatchExpression: (expr: string) => void;
  removeWatchExpression: (id: string) => void;
  startDebugger: () => void;
  stopDebugger: () => void;
  stepOver: () => void;
  stepInto: () => void;
  continueExecution: () => void;

  // Git Integration
  stagedFiles: string[];
  commitHistory: GitCommit[];
  currentBranch: string;
  stageFile: (fileName: string) => void;
  unstageFile: (fileName: string) => void;
  createCommit: (message: string) => void;
  createBranch: (branchName: string) => void;

  // Version Snapshots & History
  snapshots: WorkspaceSnapshot[];
  createSnapshot: (message?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;

  // Settings
  settings: EditorSettings;
  updateSettings: (newSettings: Partial<EditorSettings>) => void;

  // UI Modals & Live Preview
  isLivePreviewOpen: boolean;
  toggleLivePreview: (open?: boolean) => void;
  isShareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isVersionModalOpen: boolean;
  setVersionModalOpen: (open: boolean) => void;
}

const defaultTypeScriptTemplate = LANGUAGE_TEMPLATES.find((t) => t.id === 'typescript')!;
const defaultConfigFormat = CONFIG_FORMATS[0];

export const useCloudIdeStore = create<CloudIdeState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeActivityPanel: 'explorer',
      setActiveActivityPanel: (panel) => set({ activeActivityPanel: panel, isSidebarOpen: true }),
      activeBottomTab: 'terminal',
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab, isBottomPanelOpen: true }),
      isBottomPanelOpen: true,
      toggleBottomPanel: (open) => set((s) => ({ isBottomPanelOpen: open !== undefined ? open : !s.isBottomPanelOpen })),
      terminalPosition: 'bottom',
      setTerminalPosition: (terminalPosition) => set({ terminalPosition }),
      toggleTerminalPosition: () => set((s) => ({ terminalPosition: s.terminalPosition === 'bottom' ? 'right' : 'bottom' })),
      isSidebarOpen: true,
      toggleSidebar: (open) => set((s) => ({ isSidebarOpen: open !== undefined ? open : !s.isSidebarOpen })),

      // Workspace & Files
      currentLanguage: 'typescript',
      files: defaultTypeScriptTemplate.files,
      activeFile: defaultTypeScriptTemplate.entryPoint,
      openTabs: [defaultTypeScriptTemplate.entryPoint],
      splitFile: null,
      isReadOnlyWorkspace: false,
      sharedWorkspaceInfo: null,
      setIsReadOnlyWorkspace: (isReadOnlyWorkspace) => set({ isReadOnlyWorkspace }),

      loadSharedWorkspace: (data) => {
        const { files, language, activeFile, isReadOnly, name, id } = data;
        const entry = activeFile || files[0]?.name || 'main.js';
        set({
          files,
          currentLanguage: language,
          activeFile: entry,
          openTabs: [entry],
          isReadOnlyWorkspace: !!isReadOnly,
          sharedWorkspaceInfo: { id, name, author: 'Shared Developer' },
          aiDiffCode: null,
          aiAppliedNotification: null,
          diagnostics: { hasError: false },
        });
        get().createSnapshot(`Loaded shared workspace: ${name || id || language}`);
      },

      forkWorkspace: () => {
        set({
          isReadOnlyWorkspace: false,
          sharedWorkspaceInfo: null,
        });
        get().createSnapshot('Forked workspace into personal editable session');
      },

      setLanguage: (langId) => {
        const template = LANGUAGE_TEMPLATES.find((t) => t.id === langId) || defaultTypeScriptTemplate;
        if (template.disabled) return;
        const isFrontend = ['html', 'react', 'nextjs', 'next', 'vue', 'angular', 'svelte'].includes(langId.toLowerCase());
        set({
          currentLanguage: langId,
          files: template.files,
          activeFile: template.entryPoint,
          openTabs: [template.entryPoint],
          splitFile: null,
          isReadOnlyWorkspace: false,
          sharedWorkspaceInfo: null,
          diagnostics: { hasError: false },
          terminalLogs: [],
          stderrLogs: [],
          isLivePreviewOpen: isFrontend,
        });
        get().prewarmDaemon(langId);
        get().createSnapshot(`Switched to ${template.name} Starter`);
      },

      resetTemplate: (langId) => {
        const targetLang = langId || get().currentLanguage;
        const template = LANGUAGE_TEMPLATES.find((t) => t.id === targetLang) || defaultTypeScriptTemplate;
        if (template.disabled) return;
        const isFrontend = ['html', 'react', 'nextjs', 'next', 'vue', 'angular', 'svelte'].includes(targetLang.toLowerCase());
        set({
          currentLanguage: targetLang,
          files: template.files,
          activeFile: template.entryPoint,
          openTabs: [template.entryPoint],
          splitFile: null,
          isReadOnlyWorkspace: false,
          sharedWorkspaceInfo: null,
          diagnostics: { hasError: false },
          terminalLogs: [],
          stderrLogs: [],
          isLivePreviewOpen: isFrontend,
        });
        get().createSnapshot(`Reset to latest ${template.name} Starter`);
      },

      resetEntireWorkspaceToBrandNew: () => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('devkits_cloud_ide_storage');
          }
        } catch (e) {}

        const defaultTemplate = defaultTypeScriptTemplate;
        set({
          currentLanguage: 'typescript',
          files: defaultTemplate.files,
          activeFile: defaultTemplate.entryPoint,
          openTabs: [defaultTemplate.entryPoint],
          splitFile: null,
          isReadOnlyWorkspace: false,
          sharedWorkspaceInfo: null,
          diagnostics: { hasError: false },
          terminalLogs: [],
          stderrLogs: [],
          snapshots: [],
          commitHistory: [],
          isLivePreviewOpen: false,
          isBottomPanelOpen: true,
          metrics: {
            executionTimeMs: 0,
            memoryUsageMb: 0,
            cpuUsagePercent: 0,
            exitCode: 0,
            status: 'idle',
          },
        });
      },

      selectFile: (fileName) => {
        set((state) => {
          const openTabs = state.openTabs.includes(fileName) ? state.openTabs : [...state.openTabs, fileName];
          return { activeFile: fileName, openTabs };
        });
      },

      updateFileContent: (fileName, content) => {
        set((state) => ({
          files: state.files.map((f) => (f.name === fileName ? { ...f, content } : f)),
          // Automatically clear stale diagnostics/error banner once user edits the code
          diagnostics: state.diagnostics.hasError ? { hasError: false } : state.diagnostics,
        }));
      },

      createFile: (fileName, content = '') => {
        set((state) => {
          if (state.files.some((f) => f.name === fileName)) return state;
          const newFile: ProjectFile = { name: fileName, content };
          return {
            files: [...state.files, newFile],
            activeFile: fileName,
            openTabs: [...state.openTabs, fileName],
          };
        });
      },

      createFolder: (folderName) => {
        set((state) => {
          const folderPlaceholder = `${folderName}/.gitkeep`;
          if (state.files.some((f) => f.name === folderPlaceholder)) return state;
          return {
            files: [...state.files, { name: folderPlaceholder, content: '' }],
          };
        });
      },

      renameFile: (oldName, newName) => {
        set((state) => ({
          files: state.files.map((f) => (f.name === oldName ? { ...f, name: newName } : f)),
          activeFile: state.activeFile === oldName ? newName : state.activeFile,
          openTabs: state.openTabs.map((t) => (t === oldName ? newName : t)),
          splitFile: state.splitFile === oldName ? newName : state.splitFile,
        }));
      },

      deleteFile: (fileName) => {
        set((state) => {
          const filtered = state.files.filter((f) => f.name !== fileName && !f.name.startsWith(`${fileName}/`));
          const openTabs = state.openTabs.filter((t) => t !== fileName);
          const activeFile = state.activeFile === fileName ? (filtered[0]?.name || '') : state.activeFile;
          const splitFile = state.splitFile === fileName ? null : state.splitFile;
          return { files: filtered, openTabs, activeFile, splitFile };
        });
      },

      duplicateFile: (fileName) => {
        const file = get().files.find((f) => f.name === fileName);
        if (!file) return;
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        const base = parts.join('.');
        const newName = `${base}_copy${ext}`;
        get().createFile(newName, file.content);
      },

      closeTab: (fileName) => {
        set((state) => {
          const openTabs = state.openTabs.filter((t) => t !== fileName);
          let activeFile = state.activeFile;
          if (activeFile === fileName) {
            activeFile = openTabs[openTabs.length - 1] || state.files[0]?.name || '';
          }
          return { openTabs, activeFile };
        });
      },

      setSplitFile: (fileName) => set({ splitFile: fileName }),

      // Execution & Terminal
      stdinInput: '',
      setStdinInput: (val) => set({ stdinInput: val }),
      executionCount: 0,
      executionHistory: [],
      isSandboxReady: false,
      terminalLogs: [],
      stderrLogs: [],
      clearTerminal: () => set({ terminalLogs: [], stderrLogs: [], executionHistory: [], diagnostics: { hasError: false } }),
      addTerminalLog: (log) => set((s) => ({ terminalLogs: [...s.terminalLogs, log].slice(-500) })),
      addStderrLog: (err) => set((s) => ({ stderrLogs: [...s.stderrLogs, err].slice(-200) })),
      metrics: {
        executionTimeMs: 0,
        memoryUsageMb: 0,
        cpuUsagePercent: 0,
        exitCode: 0,
        status: 'idle',
      },
      setMetrics: (m) => set((s) => ({ metrics: { ...s.metrics, ...m } })),

      prewarmDaemon: async (lang?: string) => {
        const targetLang = lang || get().currentLanguage;
        try {
          // Pre-warm the container silently via background daemon
          fetch('/api/sandbox/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: targetLang,
              files: [{ name: 'init.tmp', content: '// daemon warmup' }],
              entryPoint: 'init.tmp',
              timeoutMs: 5000,
            }),
          }).catch(() => {});

          set({ isSandboxReady: true });
        } catch {
          // background daemon
        }
      },

      runCode: async () => {
        const { currentLanguage, files, activeFile, stdinInput, executionCount, executionHistory } = get();
        const nextIndex = executionCount + 1;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isFrontend = ['html', 'react', 'nextjs', 'next', 'vue', 'angular', 'svelte'].includes(currentLanguage.toLowerCase());

        // Update state to running and trigger Go Live if frontend
        set({
          executionCount: nextIndex,
          metrics: { ...get().metrics, status: 'running' },
          diagnostics: { hasError: false },
          isBottomPanelOpen: true,
          activeBottomTab: 'terminal',
          ...(isFrontend ? { isLivePreviewOpen: true } : {}),
        });

        try {
          const response = await fetch('/api/sandbox/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: currentLanguage,
              files,
              entryPoint: activeFile,
              stdin: stdinInput,
              timeoutMs: 15000,
            }),
          });

          const data = await response.json();
          const stdout = data.stdout || '';
          const stderr = data.stderr || '';
          const exitCode = data.exitCode || 0;
          const execTime = data.executionTimeMs || 45;

          const record: ExecutionRecord = {
            id: `run_${nextIndex}_${Date.now()}`,
            runIndex: nextIndex,
            timestamp: timeStr,
            language: currentLanguage,
            entryPoint: activeFile,
            stdout,
            stderr,
            exitCode,
            executionTimeMs: execTime,
          };

          // Format clean execution banner and summary
          const runHeader = `─── [Execution #${nextIndex} • ${currentLanguage.toUpperCase()} • ${activeFile} @ ${timeStr}] ───`;
          const runFooter = exitCode === 0
            ? `[PASS] [Execution #${nextIndex}] Finished with Exit Code: 0 (${execTime}ms)`
            : `[FAIL] [Execution #${nextIndex}] Exited with Error Code: ${exitCode} (${execTime}ms)`;

          const newLogs = [
            ...get().terminalLogs,
            runHeader,
            ...(stdout ? [stdout] : []),
            ...(stderr ? [`[STDERR] ${stderr}`] : []),
            runFooter,
            '',
          ];

          const newStderrLogs = stderr
            ? [...get().stderrLogs, `[Execution #${nextIndex} @ ${timeStr}] ${stderr}`]
            : get().stderrLogs;

          set({
            terminalLogs: newLogs.slice(-600),
            stderrLogs: newStderrLogs.slice(-200),
            executionHistory: [record, ...executionHistory].slice(0, 50),
            diagnostics: data.diagnostics || { hasError: exitCode !== 0 },
            metrics: {
              executionTimeMs: execTime,
              memoryUsageMb: data.memoryUsageMb || 18,
              cpuUsagePercent: data.cpuUsagePercent || 15,
              exitCode,
              status: exitCode === 0 ? 'success' : 'error',
              provider: data.provider,
              sandboxId: data.sandboxId,
            },
          });
        } catch (error: any) {
          const errText = error.message || String(error);
          const record: ExecutionRecord = {
            id: `run_${nextIndex}_${Date.now()}`,
            runIndex: nextIndex,
            timestamp: timeStr,
            language: currentLanguage,
            entryPoint: activeFile,
            stdout: '',
            stderr: errText,
            exitCode: 1,
            executionTimeMs: 0,
          };

          const runHeader = `─── [Execution #${nextIndex} • ${currentLanguage.toUpperCase()} • ${activeFile} @ ${timeStr}] ───`;
          const runFooter = `✖ [Execution #${nextIndex}] Connection/Runtime Error`;

          set({
            executionHistory: [record, ...get().executionHistory].slice(0, 50),
            terminalLogs: [
              ...get().terminalLogs,
              runHeader,
              `[ERROR] Execution failed: ${errText}`,
              runFooter,
              '',
            ],
            stderrLogs: [...get().stderrLogs, `[Execution #${nextIndex}] ${errText}`],
            metrics: { ...get().metrics, status: 'error', exitCode: 1 },
            diagnostics: {
              hasError: true,
              errorMessage: errText,
              rootCauseAnalysis: 'Network or sandbox runtime connection error.',
              suggestedFix: 'Verify the execution engine is reachable.',
            },
          });
        }
      },

      stopExecution: () => {
        set((s) => ({
          metrics: { ...s.metrics, status: 'idle' },
          terminalLogs: [...s.terminalLogs, '[system] Execution terminated by user.'],
        }));
      },

      // Error Diagnostics
      diagnostics: { hasError: false },
      setDiagnostics: (d) => set({ diagnostics: d }),
      dismissDiagnostics: () => set({ diagnostics: { hasError: false } }),

      // AI Coding Assistant
      aiPrompt: '',
      setAiPrompt: (aiPrompt) => set({ aiPrompt }),
      aiLoading: false,
      aiResponse: null,
      aiDiffCode: null,
      aiDiffOriginal: null,
      aiDiffFile: null,

      runAiAssist: async (action, customPrompt) => {
        const { currentLanguage, files, activeFile, aiPrompt, diagnostics } = get();
        const file = files.find((f) => f.name === activeFile) || files[0];
        if (!file) return;

        set({ aiLoading: true, aiResponse: null, activeActivityPanel: 'ai', isSidebarOpen: true });

        try {
          const response = await fetch('/api/sandbox/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action,
              language: currentLanguage,
              code: file.content,
              prompt: customPrompt || aiPrompt,
              errorContext: diagnostics.hasError ? diagnostics.errorMessage : undefined,
              filePath: file.name,
            }),
          });

          const data = await response.json();
          const responseText = data.content || '';
          const diffCode = data.diffCode || null;

          set({
            aiLoading: false,
            aiResponse: responseText,
            aiDiffCode: diffCode,
            aiDiffOriginal: file.content,
            aiDiffFile: file.name,
          });
        } catch (error: any) {
          set({
            aiLoading: false,
            aiResponse: `AI Assistant Error: ${error.message}`,
          });
        }
      },

      aiAppliedNotification: null,
      dismissAiNotification: () => set({ aiAppliedNotification: null }),

      acceptAiDiff: (customCode?: string) => {
        const { aiDiffFile, aiDiffCode, activeFile, files } = get();
        const targetFile = aiDiffFile || activeFile;
        const targetCode = customCode !== undefined ? customCode : aiDiffCode;
        const currentContent = files.find((f) => f.name === targetFile)?.content || '';

        if (targetFile && targetCode !== null && targetCode !== undefined) {
          get().updateFileContent(targetFile, targetCode);
          get().createSnapshot(`Applied AI Changes to ${targetFile}`);
          set({
            aiDiffCode: null,
            aiDiffOriginal: null,
            aiDiffFile: null,
            diagnostics: { hasError: false },
            aiAppliedNotification: {
              message: `AI solution applied to ${targetFile}`,
              originalCode: currentContent,
              file: targetFile,
            },
          });
        }
      },

      revertAiApplied: () => {
        const { aiAppliedNotification } = get();
        if (aiAppliedNotification) {
          get().updateFileContent(aiAppliedNotification.file, aiAppliedNotification.originalCode);
          get().createSnapshot(`Reverted AI Changes on ${aiAppliedNotification.file}`);
          set({ aiAppliedNotification: null });
        }
      },

      rejectAiDiff: () => {
        set({ aiDiffCode: null, aiDiffOriginal: null, aiDiffFile: null });
      },

      // Code Converter Studio
      converterSourceLang: 'python',
      converterTargetLang: 'typescript',
      converterSourceCode: `def calculate_stats(numbers):\n    total = sum(numbers)\n    avg = total / len(numbers)\n    print(f"Average: {avg}")\n    return {"total": total, "average": avg}`,
      converterTargetCode: '',
      converterWarnings: [],
      converterNotes: [],
      converterLoading: false,
      setConverterSourceLang: (converterSourceLang) => set({ converterSourceLang }),
      setConverterTargetLang: (converterTargetLang) => set({ converterTargetLang }),
      setConverterSourceCode: (converterSourceCode) => set({ converterSourceCode }),

      runCodeConversion: async () => {
        const { converterSourceLang, converterTargetLang, converterSourceCode } = get();
        set({ converterLoading: true });

        try {
          const response = await fetch('/api/sandbox/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceLanguage: converterSourceLang,
              targetLanguage: converterTargetLang,
              sourceCode: converterSourceCode,
            }),
          });

          const data = await response.json();
          set({
            converterLoading: false,
            converterTargetCode: data.targetCode || '',
            converterWarnings: data.warnings || [],
            converterNotes: data.notes || [],
          });
        } catch (error: any) {
          set({
            converterLoading: false,
            converterWarnings: [`Conversion failed: ${error.message}`],
          });
        }
      },

      applyConvertedToProject: () => {
        const { converterTargetLang, converterTargetCode } = get();
        const extMap: Record<string, string> = {
          typescript: '.ts',
          javascript: '.js',
          python: '.py',
          go: '.go',
          rust: '.rs',
          cpp: '.cpp',
          java: '.java',
        };
        const ext = extMap[converterTargetLang] || '.txt';
        const fileName = `converted_${Date.now().toString().slice(-4)}${ext}`;
        get().createFile(fileName, converterTargetCode);
        get().setActiveActivityPanel('explorer');
      },

      // Config Studio
      selectedConfigFormat: 'json',
      configCode: defaultConfigFormat.sample,
      configValidationErrors: [],
      configViewMode: 'code',
      setConfigFormat: (formatId) => {
        const fmt = CONFIG_FORMATS.find((f) => f.id === formatId) || defaultConfigFormat;
        set({
          selectedConfigFormat: formatId,
          configCode: fmt.sample,
          configValidationErrors: [],
        });
      },
      setConfigCode: (configCode) => set({ configCode }),
      setConfigViewMode: (configViewMode) => set({ configViewMode }),

      // Debugger
      breakpoints: [],
      isDebugging: false,
      currentDebugLine: null,
      callStack: [],
      debugVariables: {},
      watchList: [{ id: '1', expression: 'process.uptime()', value: '4.82s' }],

      toggleBreakpoint: (file, line) => {
        set((state) => {
          const exists = state.breakpoints.some((b) => b.file === file && b.line === line);
          const breakpoints = exists
            ? state.breakpoints.filter((b) => !(b.file === file && b.line === line))
            : [...state.breakpoints, { file, line, enabled: true }];
          return { breakpoints };
        });
      },

      addWatchExpression: (expression) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((s) => ({ watchList: [...s.watchList, { id, expression, value: 'evaluating...' }] }));
      },

      removeWatchExpression: (id) => {
        set((s) => ({ watchList: s.watchList.filter((w) => w.id !== id) }));
      },

      startDebugger: () => {
        const { activeFile, breakpoints } = get();
        const firstBp = breakpoints.find((b) => b.file === activeFile)?.line || 12;
        set({
          isDebugging: true,
          currentDebugLine: firstBp,
          activeBottomTab: 'debugger',
          isBottomPanelOpen: true,
          callStack: [
            { functionName: 'main()', file: activeFile, line: firstBp },
            { functionName: '<anonymous>', file: activeFile, line: 1 },
          ],
          debugVariables: {
            'this': 'TelemetryEngine',
            'user': { id: 'u_101', username: 'alex_dev', latency: 14.8 },
            'status': '"active"',
          },
        });
      },

      stopDebugger: () => set({ isDebugging: false, currentDebugLine: null }),
      stepOver: () => set((s) => ({ currentDebugLine: (s.currentDebugLine || 1) + 1 })),
      stepInto: () => set((s) => ({ currentDebugLine: (s.currentDebugLine || 1) + 1 })),
      continueExecution: () => set({ isDebugging: false, currentDebugLine: null }),

      // Git
      stagedFiles: [],
      commitHistory: [
        {
          id: 'c_init',
          message: 'Initial project setup & template files',
          timestamp: Date.now() - 3600000,
          author: 'DevKits User',
          filesChanged: 3,
        },
      ],
      currentBranch: 'main',

      stageFile: (fileName) => set((s) => ({ stagedFiles: [...new Set([...s.stagedFiles, fileName])] })),
      unstageFile: (fileName) => set((s) => ({ stagedFiles: s.stagedFiles.filter((f) => f !== fileName) })),
      createCommit: (message) => {
        const { stagedFiles, files } = get();
        const count = stagedFiles.length || files.length;
        const newCommit: GitCommit = {
          id: `c_${Math.random().toString(36).substring(2, 8)}`,
          message: message || 'Update files',
          timestamp: Date.now(),
          author: 'DevKits User',
          filesChanged: count,
        };
        set((s) => ({
          commitHistory: [newCommit, ...s.commitHistory],
          stagedFiles: [],
        }));
        get().createSnapshot(`Git Commit: ${message}`);
      },

      createBranch: (branchName) => set({ currentBranch: branchName }),

      // Version History Snapshots
      snapshots: [
        {
          id: 'snap_init',
          timestamp: Date.now() - 3600000,
          message: 'Initial Workspace State',
          files: defaultTypeScriptTemplate.files,
          language: 'typescript',
        },
      ],

      createSnapshot: (message = 'Manual Snapshot') => {
        const { files, currentLanguage } = get();
        const snapshot: WorkspaceSnapshot = {
          id: `snap_${Date.now()}`,
          timestamp: Date.now(),
          message,
          files: JSON.parse(JSON.stringify(files)),
          language: currentLanguage,
        };
        set((s) => ({ snapshots: [snapshot, ...s.snapshots].slice(0, 20) }));
      },

      restoreSnapshot: (snapshotId) => {
        const snap = get().snapshots.find((s) => s.id === snapshotId);
        if (snap) {
          set({
            files: JSON.parse(JSON.stringify(snap.files)),
            currentLanguage: snap.language,
            activeFile: snap.files[0]?.name || '',
            openTabs: snap.files.map((f) => f.name),
          });
        }
      },

      // Settings
      settings: {
        theme: 'vs-dark',
        fontFamily: 'Fira Code, JetBrains Mono, monospace',
        fontSize: 14,
        lineHeight: 22,
        tabSize: 2,
        minimap: true,
        wordWrap: 'on',
        cursorBlinking: 'smooth',
        cursorStyle: 'line',
        renderWhitespace: 'selection',
        bracketPairColorization: true,
        autoSave: true,
        autoSaveDelayMs: 2000,
      },

      updateSettings: (newSettings) =>
        set((s) => ({ settings: { ...s.settings, ...newSettings } })),

      // Modals & Live Preview
      isLivePreviewOpen: false,
      toggleLivePreview: (isLivePreviewOpen) =>
        set((s) => ({ isLivePreviewOpen: isLivePreviewOpen !== undefined ? isLivePreviewOpen : !s.isLivePreviewOpen })),
      isShareModalOpen: false,
      setShareModalOpen: (isShareModalOpen) => set({ isShareModalOpen }),
      isSettingsModalOpen: false,
      setSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
      isVersionModalOpen: false,
      setVersionModalOpen: (isVersionModalOpen) => set({ isVersionModalOpen }),
    }),
    {
      name: 'devkits_cloud_ide_storage',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        files: state.files,
        settings: state.settings,
        snapshots: state.snapshots,
        commitHistory: state.commitHistory,
      }),
    },
  ),
);
