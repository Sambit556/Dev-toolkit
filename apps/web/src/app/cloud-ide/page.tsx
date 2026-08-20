import { Metadata } from 'next';
import { CloudIdeApp } from '../../components/cloud-ide/CloudIdeApp';

export const metadata: Metadata = {
  title: 'Cloud IDE & Isolated Code Execution Sandbox | DevKits',
  description:
    'Production-grade cloud IDE with isolated execution sandbox powered by Upstash Box. Support for 15+ languages, VS Code-grade Monaco editor, AI coding assistant, smart error diagnostics, code converter, config studio, and debugger.',
  keywords: [
    'cloud ide',
    'online code editor',
    'upstash box sandbox',
    'isolated code execution',
    'monaco editor',
    'typescript sandbox',
    'python sandbox',
    'golang ide',
    'rust ide',
    'ai coding assistant',
    'code converter studio',
    'config editor',
    'kubernetes yaml editor',
    'debugger online',
  ],
  openGraph: {
    title: 'Cloud IDE & Code Workspace - DevKits',
    description: 'Production-grade Cloud IDE with Upstash Box isolated sandbox execution and AI coding tools.',
    type: 'website',
  },
};

export default function CloudIdePage() {
  return <CloudIdeApp />;
}
