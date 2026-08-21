import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const store = globalThis.__DEVKITS_SHARED_WORKSPACES;
    const workspace = store?.get(id);

    if (!workspace) {
      return NextResponse.json({ error: 'Shared workspace not found or expired' }, { status: 404 });
    }

    if (workspace.expiresAt && Date.now() > workspace.expiresAt) {
      store.delete(id);
      return NextResponse.json({ error: 'This shared workspace link has expired' }, { status: 410 });
    }

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      files: workspace.files,
      language: workspace.language,
      activeFile: workspace.activeFile,
      isReadOnly: workspace.isReadOnly,
      createdAt: workspace.createdAt,
      expiresAt: workspace.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve workspace' }, { status: 500 });
  }
}
