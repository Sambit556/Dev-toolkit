import jsyaml from 'js-yaml';
import { marked } from 'marked';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export function csvToJson(csv: string): string {
  const lines = csv.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return '[]';
  const header = lines[0];
  let delimiter = ',';
  if (header.includes('\t')) delimiter = '\t';
  else if (header.includes(';')) delimiter = ';';
  const keys = header.split(delimiter).map((k) => k.replace(/^["']|["']$/g, '').trim());

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
    const obj: Record<string, string> = {};
    keys.forEach((key, idx) => { obj[key] = parts[idx] || ''; });
    data.push(obj);
  }
  return JSON.stringify(data, null, 2);
}

export function jsonToCsvRows(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  const dataArr = Array.isArray(parsed) ? parsed : [parsed];
  if (dataArr.length === 0) return '';
  const keys = Object.keys(dataArr[0]);
  const headerLine = keys.join(',');
  const contentLines = dataArr.map((obj: Record<string, unknown>) =>
    keys.map((k) => {
      const val = obj[k] !== undefined ? String(obj[k]) : '';
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','),
  );
  return [headerLine, ...contentLines].join('\n');
}

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true });

export function xmlToJson(xml: string): string {
  const obj = xmlParser.parse(xml);
  return JSON.stringify(obj, null, 2);
}

export function jsonToXml(jsonStr: string, rootName = 'root'): string {
  const parsed = JSON.parse(jsonStr);
  const wrapped = Object.keys(parsed).length === 1 ? parsed : { [rootName]: parsed };
  return xmlBuilder.build(wrapped);
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

export function yamlToJson(yaml: string, indent = 2): string {
  const parsed = jsyaml.load(yaml);
  return JSON.stringify(parsed, null, indent);
}

export function jsonToYaml(jsonStr: string, indent = 2, sortKeys = false): string {
  const parsed = JSON.parse(jsonStr);
  return jsyaml.dump(parsed, { indent, sortKeys, noRefs: true });
}

// --- JSON <-> INI (simple flat/nested section format) ---

export function jsonToIni(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  const lines: string[] = [];
  const topLevelScalars: string[] = [];

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`[${key}]`);
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`${k}=${v}`);
      }
      lines.push('');
    } else {
      topLevelScalars.push(`${key}=${value}`);
    }
  }
  return [...topLevelScalars, '', ...lines].join('\n').trim() + '\n';
}

export function iniToJson(ini: string): string {
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> | null = null;

  ini.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) return;
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = {};
      result[sectionMatch[1]] = currentSection;
      return;
    }
    const kv = line.match(/^([^=]+)=(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      const value = kv[2].trim();
      (currentSection ?? result)[key] = value;
    }
  });
  return JSON.stringify(result, null, 2);
}
