import { Metadata } from 'next';
import { CloudIdeApp } from '../../components/cloud-ide/CloudIdeApp';

export const metadata: Metadata = {
  title: 'Code Studio & Isolated Code Execution Sandbox | DevKits',
  description:
    'Production-grade Code Studio with isolated execution sandbox. Support for 15+ languages, VS Code-grade Monaco editor, AI coding assistant, smart error diagnostics, code converter, config studio, and debugger.',
  keywords: [
    'code studio',
    'ide',
    'code editor',
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
    title: 'Code Studio & Multi-Language Sandbox - DevKits',
    description: 'Production-grade Code Studio with isolated sandbox execution and Gemini AI coding assistant.',
    type: 'website',
  },
};

export default function CodeStudioPage() {
  return <CloudIdeApp />;
}
