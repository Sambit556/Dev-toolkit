import type { Metadata } from 'next';
import { Database, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Separator } from '@/components/ui/separator';

const SqlFormatterTool = dynamic(
  () => import('@/components/sql-formatter/SqlFormatterTool').then((m) => m.SqlFormatterTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 bg-muted/20 border border-dashed rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'SQL Formatter — Beautify & Minify Queries Online',
  description:
    'Format, beautify, and minify SQL queries for MySQL, PostgreSQL, SQLite, SQL Server, Oracle, BigQuery, and more — entirely client-side.',
  alternates: { canonical: '/sql-formatter' },
};

export default function SqlFormatterPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">SQL Formatter & Query Beautifier</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Beautify or minify SQL queries across common dialects — MySQL, PostgreSQL, SQLite, T-SQL, PL/SQL, BigQuery, and more.
        </p>
      </div>

      <Separator className="mb-6" />

      <SqlFormatterTool />
    </div>
  );
}
