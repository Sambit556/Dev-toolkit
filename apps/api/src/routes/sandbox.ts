import { Router, Request, Response } from 'express';
import { SandboxService } from '../services/sandbox.service';
import { AiCodeService } from '../services/aiCode.service';
import { logger } from '../utils/logger';

const router = Router();

// In-memory shared workspaces store (fallback if redis not available)
const sharedWorkspaces = new Map<
  string,
  {
    id: string;
    name: string;
    files: Array<{ name: string; content: string }>;
    language: string;
    isReadOnly: boolean;
    expiresAt?: number;
    passwordHash?: string;
    createdAt: number;
    author?: string;
  }
>();

/**
 * @openapi
 * /api/sandbox/execute:
 *   post:
 *     summary: Execute code in an isolated multi-language sandbox
 *     tags: [Sandbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               language:
 *                 type: string
 *                 example: javascript
 *                 description: Language runtime (javascript, typescript, python, go, rust, cpp, java, php, ruby, bash, sql)
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: main.js
 *                     content:
 *                       type: string
 *                       example: console.log("Hello, World!");
 *               entryPoint:
 *                 type: string
 *                 example: main.js
 *               stdin:
 *                 type: string
 *                 description: Interactive standard input stream to feed
 *               timeoutMs:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Execution result with stdout, stderr, exitCode, and performance metrics
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { language, files, entryPoint, stdin, env, timeoutMs, memoryLimitMb } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required and must not be empty' });
    }

    const result = await SandboxService.executeCode({
      language: language || 'javascript',
      files,
      entryPoint,
      stdin,
      env,
      timeoutMs,
      memoryLimitMb,
    });

    return res.json(result);
  } catch (error: any) {
    logger.error(`[SandboxRoute] Execute error: ${error.message}`);
    return res.status(500).json({
      error: 'Execution failed',
      details: error.message,
      status: 'error',
    });
  }
});

/**
 * @openapi
 * /api/sandbox/ai:
 *   post:
 *     summary: Gemini 3.7 Flash AI Code Assistant (Explain, Fix, Clean, Refactor, Optimize, Test, Docs)
 *     tags: [Sandbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - code
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [explain, fix, clean, eli5, refactor, optimize, test, docs, generate, custom]
 *                 example: fix
 *               language:
 *                 type: string
 *                 example: java
 *               code:
 *                 type: string
 *                 example: 'System.out.println("Hello");'
 *               errorContext:
 *                 type: string
 *                 description: Compiler diagnostic error message
 *               prompt:
 *                 type: string
 *                 description: Custom user instruction
 *     responses:
 *       200:
 *         description: AI structured response with 4-point diagnostic and diffCode
 */
router.post('/ai', async (req: Request, res: Response) => {
  try {
    const { action, language, code, prompt, errorContext, filePath } = req.body;

    if (!action || !code) {
      return res.status(400).json({ error: 'action and code are required' });
    }

    const result = await AiCodeService.processAssist({
      action,
      language: language || 'typescript',
      code,
      prompt,
      errorContext,
      filePath,
    });

    return res.json(result);
  } catch (error: any) {
    logger.error(`[SandboxRoute] AI assist error: ${error.message}`);
    return res.status(500).json({ error: 'AI assist failed', details: error.message });
  }
});

/**
 * @openapi
 * /api/sandbox/convert:
 *   post:
 *     summary: Code Converter Studio (Universal Source -> Target Language Transpiler)
 *     tags: [Sandbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceLanguage
 *               - targetLanguage
 *               - sourceCode
 *             properties:
 *               sourceLanguage:
 *                 type: string
 *                 example: python
 *               targetLanguage:
 *                 type: string
 *                 example: javascript
 *               sourceCode:
 *                 type: string
 *                 example: 'print("Hello from Python")'
 *     responses:
 *       200:
 *         description: Converted source code
 */
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { sourceLanguage, targetLanguage, sourceCode, preserveComments, strictTypes } = req.body;

    if (!sourceLanguage || !targetLanguage || !sourceCode) {
      return res.status(400).json({ error: 'sourceLanguage, targetLanguage, and sourceCode are required' });
    }

    const result = AiCodeService.convertCode({
      sourceLanguage,
      targetLanguage,
      sourceCode,
      preserveComments,
      strictTypes,
    });

    return res.json(result);
  } catch (error: any) {
    logger.error(`[SandboxRoute] Convert error: ${error.message}`);
    return res.status(500).json({ error: 'Code conversion failed', details: error.message });
  }
});

/**
 * @openapi
 * /api/sandbox/share:
 *   post:
 *     summary: Create a shareable Code Studio workspace link
 *     tags: [Sandbox]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               name:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *               language:
 *                 type: string
 *               isReadOnly:
 *                 type: boolean
 *               expiresInHours:
 *                 type: number
 *     responses:
 *       201:
 *         description: Generated share ID and URL
 */
router.post('/share', async (req: Request, res: Response) => {
  try {
    const { name, files, language, isReadOnly, expiresInHours, password } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required' });
    }

    const shareId = `share_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = expiresInHours ? Date.now() + expiresInHours * 3600 * 1000 : undefined;

    sharedWorkspaces.set(shareId, {
      id: shareId,
      name: name || 'Untitled Workspace',
      files,
      language: language || 'javascript',
      isReadOnly: !!isReadOnly,
      expiresAt,
      passwordHash: password || undefined,
      createdAt: Date.now(),
    });

    return res.status(201).json({
      shareId,
      url: `/code-studio?shareId=${shareId}`,
      expiresAt,
      isReadOnly: !!isReadOnly,
      hasPassword: !!password,
    });
  } catch (error: any) {
    logger.error(`[SandboxRoute] Share create error: ${error.message}`);
    return res.status(500).json({ error: 'Share creation failed' });
  }
});

/**
 * @openapi
 * /api/sandbox/share/:id:
 *   get:
 *     summary: Retrieve a shared workspace
 *     tags: [Sandbox]
 */
router.get('/share/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workspace = sharedWorkspaces.get(id);

    if (!workspace) {
      return res.status(404).json({ error: 'Shared workspace not found or expired' });
    }

    if (workspace.expiresAt && Date.now() > workspace.expiresAt) {
      sharedWorkspaces.delete(id);
      return res.status(410).json({ error: 'This shared workspace link has expired' });
    }

    return res.json({
      id: workspace.id,
      name: workspace.name,
      files: workspace.files,
      language: workspace.language,
      isReadOnly: workspace.isReadOnly,
      createdAt: workspace.createdAt,
      expiresAt: workspace.expiresAt,
    });
  } catch (error: any) {
    logger.error(`[SandboxRoute] Share fetch error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve workspace' });
  }
});

/**
 * @openapi
 * /api/sandbox/metrics:
 *   get:
 *     summary: Get sandbox engine metrics & status
 *     tags: [Sandbox]
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    engine: 'Upstash Box + Multi-language Isolated VM',
    supportedLanguages: [
      'javascript',
      'typescript',
      'python',
      'go',
      'rust',
      'cpp',
      'java',
      'php',
      'ruby',
      'csharp',
      'kotlin',
      'swift',
      'bash',
      'sql',
      'lua',
      'r',
    ],
    resourceLimits: {
      maxExecutionTimeoutMs: 30000,
      memoryLimitMb: 256,
      maxFilesPerProject: 50,
      maxFileSizeBytes: 5242880,
    },
    activeSessionsCount: sharedWorkspaces.size,
    timestamp: new Date().toISOString(),
  });
});

export default router;
