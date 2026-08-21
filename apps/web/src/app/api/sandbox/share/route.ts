import { NextRequest, NextResponse } from 'next/server';

// In-memory global store for shared workspaces in Next.js runtime
declare global {
  // eslint-disable-next-line no-var
  var __DEVKITS_SHARED_WORKSPACES: Map<
    string,
    {
      id: string;
      name: string;
      files: Array<{ name: string; content: string }>;
      language: string;
      activeFile?: string;
      isReadOnly: boolean;
      expiresAt?: number;
      passwordHash?: string;
      createdAt: number;
      author?: string;
    }
  >;
}

if (!globalThis.__DEVKITS_SHARED_WORKSPACES) {
  globalThis.__DEVKITS_SHARED_WORKSPACES = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, files, language, activeFile, isReadOnly, expiresInHours, password } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'files array is required' }, { status: 400 });
    }

    const shareId = `share_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = expiresInHours ? Date.now() + expiresInHours * 3600 * 1000 : undefined;

    const workspaceData = {
      id: shareId,
      name: name || `${(language || 'code').toUpperCase()} Workspace`,
      files,
      language: language || 'javascript',
      activeFile: activeFile || files[0]?.name,
      isReadOnly: !!isReadOnly,
      expiresAt,
      passwordHash: password || undefined,
      createdAt: Date.now(),
      author: 'Developer',
    };

    globalThis.__DEVKITS_SHARED_WORKSPACES.set(shareId, workspaceData);

    // Also generate a self-contained snapshot base64 token for zero-dependency link sharing
    const snapshotPayload = {
      f: files.map((file) => ({ n: file.name, c: file.content })),
      l: language || 'javascript',
      a: activeFile || files[0]?.name,
      r: !!isReadOnly ? 1 : 0,
      t: Date.now(),
    };
    const snapshotBase64 = Buffer.from(JSON.stringify(snapshotPayload)).toString('base64url');

    return NextResponse.json(
      {
        shareId,
        url: `/code-studio?shareId=${shareId}`,
        snapshotUrl: `/code-studio?snapshot=${snapshotBase64}`,
        expiresAt,
        isReadOnly: !!isReadOnly,
        hasPassword: !!password,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Share creation failed' }, { status: 500 });
  }
}
