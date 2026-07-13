'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Copy, Download, HelpCircle, FileSpreadsheet, Code2, Eye, FileText, Bold, Italic, Link2, List, Heading2, Code, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import jsyaml from 'js-yaml';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';

export function ConvertersTool() {
  const [activeTab, setActiveTab] = useState('csv-json');

  // --- CSV / JSON STATES ---
  const [csvDirection, setCsvDirection] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [csvInput, setCsvInput] = useState<string>(
    'id,name,role,email\n1,John Doe,Developer,john@example.com\n2,Jane Smith,Manager,jane@example.com'
  );
  const [csvOutput, setCsvOutput] = useState<string>('');
  const [csvTableData, setCsvTableData] = useState<any[]>([]);
  const [csvKeys, setCsvKeys] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // --- XML / JSON STATES ---
  const [xmlDirection, setXmlDirection] = useState<'xml2json' | 'json2xml'>('xml2json');
  const [xmlInput, setXmlInput] = useState<string>(
    '<user id="1">\n  <name>John Doe</name>\n  <role>Developer</role>\n  <email>john@example.com</email>\n</user>'
  );
  const [xmlOutput, setXmlOutput] = useState<string>('');
  const [xmlError, setXmlError] = useState<string | null>(null);

  // --- MARKDOWN / HTML STATES ---
  const [mdDirection, setMdDirection] = useState<'md2html' | 'html2md'>('md2html');
  const [mdInput, setMdInput] = useState<string>(
    '# Hello World\n\nThis is a standard **markdown** text.\n\n- Point one\n- Point two\n\n```javascript\nconsole.log("Syntax highlighting is cool!");\n```'
  );
  const [mdOutput, setMdOutput] = useState<string>('');
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const mdTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- YAML / JSON STATES ---
  const [yamlDirection, setYamlDirection] = useState<'json2yaml' | 'yaml2json'>('json2yaml');
  const [yamlInput, setYamlInput] = useState<string>(
    JSON.stringify(
      {
        name: 'DevToolkit',
        version: '1.0.0',
        active: true,
        features: ['JWT', 'UUID', 'Cron', 'YAML/JSON', 'Unit Converter'],
        author: {
          name: 'Antigravity',
          role: 'AI Companion',
        },
      },
      null,
      2
    )
  );
  const [yamlOutput, setYamlOutput] = useState<string>('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [yamlIndentSize, setYamlIndentSize] = useState<string>('2');
  const [yamlSortKeys, setYamlSortKeys] = useState<boolean>(false);

  // 1. Process CSV ↔ JSON
  const handleCsvConversion = () => {
    if (!csvInput.trim()) {
      setCsvOutput('');
      setCsvTableData([]);
      setCsvKeys([]);
      setCsvError(null);
      return;
    }

    try {
      if (csvDirection === 'csv2json') {
        const lines = csvInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) {
          setCsvOutput('');
          setCsvTableData([]);
          setCsvKeys([]);
          return;
        }

        // Delimiter auto-detect
        const header = lines[0];
        let delimiter = ',';
        if (header.includes('\t')) delimiter = '\t';
        else if (header.includes(';')) delimiter = ';';

        const keys = header.split(delimiter).map((k) => k.replace(/^["']|["']$/g, '').trim());
        setCsvKeys(keys);

        const data: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
          const obj: any = {};
          keys.forEach((key, idx) => {
            obj[key] = parts[idx] || '';
          });
          data.push(obj);
        }

        setCsvTableData(data);
        setCsvOutput(JSON.stringify(data, null, 2));
        setCsvError(null);
      } else {
        // JSON to CSV
        const parsed = JSON.parse(csvInput);
        const dataArr = Array.isArray(parsed) ? parsed : [parsed];
        if (dataArr.length === 0) {
          setCsvOutput('');
          return;
        }

        const keys = Object.keys(dataArr[0]);
        setCsvKeys(keys);
        setCsvTableData(dataArr);

        const headerLine = keys.join(',');
        const contentLines = dataArr.map((obj) =>
          keys.map((k) => {
            const val = obj[k] !== undefined ? String(obj[k]) : '';
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        );

        setCsvOutput([headerLine, ...contentLines].join('\n'));
        setCsvError(null);
      }
    } catch (e: any) {
      setCsvError(e.message || 'Error parsing CSV/JSON data');
      setCsvOutput('');
      setCsvTableData([]);
      setCsvKeys([]);
    }
  };

  useEffect(() => {
    handleCsvConversion();
  }, [csvInput, csvDirection]);

  // 2. Process XML ↔ JSON
  const handleXmlConversion = () => {
    if (!xmlInput.trim()) {
      setXmlOutput('');
      setXmlError(null);
      return;
    }

    try {
      if (xmlDirection === 'xml2json') {
        const domParser = new DOMParser();
        const xmlDoc = domParser.parseFromString(xmlInput, 'text/xml');
        
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
          throw new Error(parseError[0].textContent || 'XML parsing error');
        }

        const parseNode = (node: Node): any => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue?.trim();
          }

          const obj: any = {};

          if (node instanceof Element && node.attributes.length > 0) {
            obj['@attributes'] = {};
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              obj['@attributes'][attr.name] = attr.value;
            }
          }

          if (node.childNodes.length > 0) {
            let text = '';
            const children: Record<string, any[]> = {};

            node.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                text += child.nodeValue?.trim() || '';
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const name = child.nodeName;
                if (!children[name]) children[name] = [];
                children[name].push(parseNode(child));
              }
            });

            const keys = Object.keys(children);
            if (keys.length === 0) {
              return text || null;
            }

            keys.forEach((key) => {
              const arr = children[key];
              obj[key] = arr.length === 1 ? arr[0] : arr;
            });
          }

          return obj;
        };

        const json = parseNode(xmlDoc.documentElement);
        setXmlOutput(JSON.stringify(json, null, 2));
        setXmlError(null);
      } else {
        // JSON to XML (Simple)
        const parsed = JSON.parse(xmlInput);
        
        const buildXml = (obj: any, rootName = 'root'): string => {
          let xml = '';
          
          if (typeof obj !== 'object' || obj === null) {
            return `<${rootName}>${obj}</${rootName}>`;
          }

          const keys = Object.keys(obj);
          let attrs = '';
          if (obj['@attributes']) {
            attrs = Object.entries(obj['@attributes'])
              .map(([k, v]) => ` ${k}="${v}"`)
              .join('');
          }

          xml += `<${rootName}${attrs}>`;

          keys.forEach((key) => {
            if (key === '@attributes') return;
            const val = obj[key];
            if (Array.isArray(val)) {
              val.forEach((item) => {
                xml += buildXml(item, key);
              });
            } else {
              xml += buildXml(val, key);
            }
          });

          xml += `</${rootName}>`;
          return xml;
        };

        const rootKey = Object.keys(parsed).length === 1 ? Object.keys(parsed)[0] : 'root';
        const rawXml = Object.keys(parsed).length === 1 ? buildXml(parsed[rootKey], rootKey) : buildXml(parsed);
        
        // Simple XML formatting / indentation
        let formatted = '';
        let indent = 0;
        rawXml.split(/(?=<)/g).forEach((node) => {
          if (node.startsWith('</')) {
            indent -= 2;
          }
          formatted += ' '.repeat(Math.max(0, indent)) + node + '\n';
          if (node.startsWith('<') && !node.startsWith('</') && !node.endsWith('/>') && !node.includes('</')) {
            indent += 2;
          }
        });

        setXmlOutput(formatted.trim());
        setXmlError(null);
      }
    } catch (e: any) {
      setXmlError(e.message || 'Error occurred parsing XML/JSON');
      setXmlOutput('');
    }
  };

  useEffect(() => {
    handleXmlConversion();
  }, [xmlInput, xmlDirection]);

  // 3. Process Markdown ↔ HTML
  const handleMdConversion = () => {
    if (!mdInput.trim()) {
      setMdOutput('');
      setHtmlPreview('');
      return;
    }

    try {
      if (mdDirection === 'md2html') {
        const html = marked.parse(mdInput) as string;
        setMdOutput(html);
        setHtmlPreview(DOMPurify.sanitize(html));
      } else {
        // Simple regex-based HTML to MD fallback
        let md = mdInput
          .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
          .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
          .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
          .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
          .replace(/<b>(.*?)<\/b>/g, '**$1**')
          .replace(/<em>(.*?)<\/em>/g, '*$1*')
          .replace(/<i>(.*?)<\/i>/g, '*$1*')
          .replace(/<ul>([\s\S]*?)<\/ul>/g, '$1')
          .replace(/<li>(.*?)<\/li>/g, '- $1')
          .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```')
          .replace(/<code.*?>([\s\S]*?)<\/code>/g, '`$1`')
          .replace(/<br\s*\/?>/g, '\n');
        
        // Strip other HTML tags
        md = md.replace(/<[^>]*>/g, '');
        setMdOutput(md.trim());
        setHtmlPreview(DOMPurify.sanitize(mdInput));
      }
    } catch (e: any) {
      setMdOutput(`// MD conversion error: ${e.message}`);
    }
  };

  useEffect(() => {
    handleMdConversion();
  }, [mdInput, mdDirection]);

  // 4. Process YAML ↔ JSON
  const handleYamlConversion = () => {
    if (!yamlInput.trim()) {
      setYamlOutput('');
      setYamlError(null);
      return;
    }

    try {
      if (yamlDirection === 'json2yaml') {
        const parsed = JSON.parse(yamlInput);
        const yaml = jsyaml.dump(parsed, {
          indent: Number(yamlIndentSize),
          sortKeys: yamlSortKeys,
          noRefs: true,
        });
        setYamlOutput(yaml);
        setYamlError(null);
      } else {
        const parsed = jsyaml.load(yamlInput);
        if (typeof parsed !== 'object' && parsed !== null) {
          throw new Error('YAML did not parse into an object');
        }
        const json = JSON.stringify(parsed, null, Number(yamlIndentSize));
        setYamlOutput(json);
        setYamlError(null);
      }
    } catch (e: any) {
      setYamlError(e.message || 'Error occurred during parsing');
      setYamlOutput('');
    }
  };

  useEffect(() => {
    handleYamlConversion();
  }, [yamlInput, yamlDirection, yamlIndentSize, yamlSortKeys]);

  const insertMdWrap = (prefix: string, suffix: string = prefix, placeholder = 'text') => {
    const ta = mdTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = mdInput.slice(start, end) || placeholder;
    const newValue = mdInput.slice(0, start) + prefix + selected + suffix + mdInput.slice(end);
    setMdInput(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + prefix.length + selected.length + suffix.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertMdLinePrefix = (prefix: string) => {
    const ta = mdTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = mdInput.lastIndexOf('\n', start - 1) + 1;
    const newValue = mdInput.slice(0, lineStart) + prefix + mdInput.slice(lineStart);
    setMdInput(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + prefix.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully!');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['csv-json', 'xml-json', 'yaml-json', 'md-html'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-4 text-xs h-auto py-1">
        <TabsTrigger value="csv-json" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          CSV ↔ JSON
        </TabsTrigger>
        <TabsTrigger value="xml-json" className="gap-2">
          <Code2 className="h-4 w-4" />
          XML ↔ JSON
        </TabsTrigger>
        <TabsTrigger value="yaml-json" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          YAML ↔ JSON
        </TabsTrigger>
        <TabsTrigger value="md-html" className="gap-2">
          <Eye className="h-4 w-4" />
          Markdown ↔ HTML
        </TabsTrigger>
      </TabsList>

      {/* --- CSV ↔ JSON TAB --- */}
      <TabsContent value="csv-json" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCsvDirection(csvDirection === 'csv2json' ? 'json2csv' : 'csv2json')}
                    className="h-8 text-xs gap-1"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {csvDirection === 'csv2json' ? 'CSV ➔ JSON' : 'JSON ➔ CSV'}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="csv-in-box">Input Data</Label>
                <Textarea
                  id="csv-in-box"
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="font-mono text-xs h-60 resize-y"
                  placeholder={csvDirection === 'csv2json' ? 'id,name,role...' : '[{"id": 1, "name": "John"}...]'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4 justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-bold">Converted Output</span>
                  {csvOutput && (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleCopyText(csvOutput, 'Output')} className="h-7 text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(
                            csvOutput,
                            csvDirection === 'csv2json' ? 'converted.json' : 'converted.csv',
                            csvDirection === 'csv2json' ? 'application/json' : 'text/csv'
                          )
                        }
                        className="h-7 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <CodeEditor
                    language={csvDirection === 'csv2json' ? 'json' : 'plaintext'}
                    value={csvOutput}
                    readOnly
                    height="240px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live parsed data preview table */}
        {csvTableData.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">CSV Table Grid Preview</h4>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <table className="w-full text-xs font-mono border-collapse text-left">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      {csvKeys.map((k) => (
                        <th key={k} className="p-2.5 border-r font-semibold text-muted-foreground last:border-0">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvTableData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/10 last:border-0">
                        {csvKeys.map((k) => (
                          <td key={k} className="p-2.5 border-r font-mono text-xs max-w-xs truncate last:border-0">{row[k]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* --- XML ↔ JSON TAB --- */}
      <TabsContent value="xml-json" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setXmlDirection(xmlDirection === 'xml2json' ? 'json2xml' : 'xml2json')}
                  className="h-8 text-xs gap-1"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {xmlDirection === 'xml2json' ? 'XML ➔ JSON' : 'JSON ➔ XML'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="xml-in-box">Input Data</Label>
                <Textarea
                  id="xml-in-box"
                  value={xmlInput}
                  onChange={(e) => setXmlInput(e.target.value)}
                  className="font-mono text-xs h-60 resize-y"
                  placeholder={xmlDirection === 'xml2json' ? '<root><tag>value</tag></root>' : '{"tag": "value"}'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4 justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-bold">Converted Output</span>
                  {xmlOutput && (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleCopyText(xmlOutput, 'Output')} className="h-7 text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(
                            xmlOutput,
                            xmlDirection === 'xml2json' ? 'converted.json' : 'converted.xml',
                            xmlDirection === 'xml2json' ? 'application/json' : 'text/xml'
                          )
                        }
                        className="h-7 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <CodeEditor
                    language={xmlDirection === 'xml2json' ? 'json' : 'xml'}
                    value={xmlOutput}
                    readOnly
                    height="240px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- MARKDOWN ↔ HTML TAB --- */}
      <TabsContent value="md-html" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMdDirection(mdDirection === 'md2html' ? 'html2md' : 'md2html')}
                  className="h-8 text-xs gap-1"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {mdDirection === 'md2html' ? 'Markdown ➔ HTML' : 'HTML ➔ Markdown'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="md-in-box">Input Text</Label>
                  {mdDirection === 'md2html' && (
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Bold" onClick={() => insertMdWrap('**', '**', 'bold text')}>
                        <Bold className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Italic" onClick={() => insertMdWrap('*', '*', 'italic text')}>
                        <Italic className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Heading" onClick={() => insertMdLinePrefix('## ')}>
                        <Heading2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Link" onClick={() => insertMdWrap('[', '](https://)', 'link text')}>
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Inline code" onClick={() => insertMdWrap('`', '`', 'code')}>
                        <Code className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Bullet list" onClick={() => insertMdLinePrefix('- ')}>
                        <List className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Blockquote" onClick={() => insertMdLinePrefix('> ')}>
                        <Quote className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <Textarea
                  id="md-in-box"
                  ref={mdTextareaRef}
                  value={mdInput}
                  onChange={(e) => setMdInput(e.target.value)}
                  className="font-mono text-xs h-80 resize-y"
                  placeholder={mdDirection === 'md2html' ? '# Header...' : '<h1>Header</h1>...'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4 justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-bold">Converted Code Output</span>
                  <Button variant="outline" size="sm" onClick={() => handleCopyText(mdOutput, 'Output')} className="h-7 text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Code
                  </Button>
                </div>

                <div className="flex-1">
                  <CodeEditor
                    language={mdDirection === 'md2html' ? 'xml' : 'markdown'}
                    value={mdOutput}
                    readOnly
                    height="200px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Markdown rendered HTML live preview */}
        {htmlPreview && (
          <Card>
            <div className="p-2 border-b bg-muted/40 text-[10px] text-muted-foreground font-mono flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" />
              LIVE PARSED PREVIEW
            </div>
            <CardContent className="p-6 prose dark:prose-invert max-w-none max-h-80 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* --- YAML ↔ JSON TAB --- */}
      <TabsContent value="yaml-json" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Panel */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setYamlDirection(yamlDirection === 'json2yaml' ? 'yaml2json' : 'json2yaml')}
                  className="h-8 text-xs gap-1"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {yamlDirection === 'json2yaml' ? 'JSON ➔ YAML' : 'YAML ➔ JSON'}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="yaml-input-box">Input Text</Label>
                  <CodeEditor
                    language={yamlDirection === 'json2yaml' ? 'json' : 'yaml'}
                    value={yamlInput}
                    onChange={setYamlInput}
                    height="320px"
                    className="border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t">
                  <div className="space-y-1">
                    <Label htmlFor="yaml-indent">Indent size</Label>
                    <Select value={yamlIndentSize} onValueChange={setYamlIndentSize}>
                      <SelectTrigger id="yaml-indent" className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 spaces</SelectItem>
                        <SelectItem value="4">4 spaces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {yamlDirection === 'json2yaml' && (
                    <div className="flex items-center justify-between text-xs pt-5">
                      <Label htmlFor="yaml-sort-keys" className="cursor-pointer">Sort object keys</Label>
                      <Switch
                        id="yaml-sort-keys"
                        checked={yamlSortKeys}
                        onCheckedChange={setYamlSortKeys}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col h-full min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4 justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-bold">Converted Code Output</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => handleCopyText(yamlOutput, 'Output')} className="h-7 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(
                        yamlOutput, 
                        yamlDirection === 'json2yaml' ? 'converted.yaml' : 'converted.json', 
                        yamlDirection === 'json2yaml' ? 'text/yaml' : 'application/json'
                      )}
                      className="h-7 text-xs"
                      disabled={!yamlOutput}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <CodeEditor
                    language={yamlDirection === 'json2yaml' ? 'yaml' : 'json'}
                    value={yamlOutput}
                    readOnly
                    height="320px"
                  />
                </div>

                {yamlError && (
                  <div className="p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-[10px] font-mono leading-normal mt-2">
                    {yamlError}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
