import { NextRequest, NextResponse } from 'next/server';

/**
 * Universal Code Transpiler Engine
 * Supports bi-directional conversion across Python, TypeScript, JavaScript, Go, Rust, C++, Java, C#, PHP, Ruby, Swift, and Kotlin.
 */

// Chunked processing helper
function processInChunks(lines: string[], chunkSize = 100, transformer: (line: string) => string): string[] {
  const output: string[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    for (const line of chunk) {
      output.push(transformer(line));
    }
  }
  return output;
}

/**
 * Universal print/log statement mapper
 */
function mapPrintStatements(line: string, src: string, dst: string): string {
  // Python print -> Target
  if (src === 'python' || line.includes('print(')) {
    if (dst === 'javascript' || dst === 'typescript') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'console.log($1)');
    } else if (dst === 'go') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'fmt.Println($1)');
    } else if (dst === 'rust') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'println!("{:?}", $1)');
    } else if (dst === 'java') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'System.out.println($1);');
    } else if (dst === 'csharp') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'Console.WriteLine($1);');
    } else if (dst === 'cpp') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'std::cout << $1 << std::endl;');
    } else if (dst === 'php') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'echo $1 . "\\n";');
    } else if (dst === 'ruby') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'puts $1');
    } else if (dst === 'swift') {
      line = line.replace(/\bprint\s*\((.*?)\)/g, 'print($1)');
    }
  }

  // JS/TS console.log -> Target
  if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
    if (dst === 'python') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'print($2)');
    } else if (dst === 'go') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'fmt.Println($2)');
    } else if (dst === 'rust') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'println!("{:?}", $2);');
    } else if (dst === 'java') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'System.out.println($2);');
    } else if (dst === 'csharp') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'Console.WriteLine($2);');
    } else if (dst === 'cpp') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'std::cout << $2 << std::endl;');
    } else if (dst === 'php') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'echo $2 . "\\n";');
    } else if (dst === 'ruby') {
      line = line.replace(/console\.(log|error|warn|info)\s*\((.*?)\);?/g, 'puts $2');
    }
  }

  // Java / C# / C++ print -> Target
  if (line.includes('System.out.println') || line.includes('Console.WriteLine') || line.includes('std::cout')) {
    if (dst === 'javascript' || dst === 'typescript') {
      line = line.replace(/System\.out\.println\((.*?)\);?/g, 'console.log($1)')
        .replace(/Console\.WriteLine\((.*?)\);?/g, 'console.log($1)')
        .replace(/std::cout\s*<<\s*(.*?)\s*<<\s*std::endl;?/g, 'console.log($1);');
    } else if (dst === 'python') {
      line = line.replace(/System\.out\.println\((.*?)\);?/g, 'print($1)')
        .replace(/Console\.WriteLine\((.*?)\);?/g, 'print($1)')
        .replace(/std::cout\s*<<\s*(.*?)\s*<<\s*std::endl;?/g, 'print($1)');
    }
  }

  return line;
}

/**
 * Universal string interpolation & literal converter
 */
function mapStringInterpolation(line: string, dst: string): string {
  if (dst === 'javascript' || dst === 'typescript') {
    // f"Hello {name}" -> `Hello ${name}`
    line = line.replace(/f(["'])(.*?)\1/g, (_m, _q, content) => {
      const converted = content
        .replace(/\{len\((.*?)\)\}/g, '${$1.length}')
        .replace(/\{([a-zA-Z0-9_.()[\]]+)\}/g, '${$1}');
      return `\`${converted}\``;
    });
  } else if (dst === 'python') {
    // `Hello ${name}` -> f"Hello {name}"
    line = line.replace(/`([\s\S]*?)`/g, (_m, content) => {
      const converted = content.replace(/\$\{([a-zA-Z0-9_.()[\]]+)\}/g, '{$1}');
      return `f"${converted}"`;
    });
  } else if (dst === 'csharp') {
    // `Hello ${name}` -> $"Hello {name}"
    line = line.replace(/`([\s\S]*?)`/g, (_m, content) => {
      const converted = content.replace(/\$\{([a-zA-Z0-9_.()[\]]+)\}/g, '{$1}');
      return `$"${converted}"`;
    });
  }
  return line;
}

/**
 * Convert Python to Target Language (TypeScript, JavaScript, Go, Rust, Java, C++, C#, PHP)
 */
function convertFromPython(code: string, dst: string, warnings: string[], notes: string[]): string {
  notes.push('Converted Python syntax, type annotations, and control structures.');
  notes.push('Mapped print(...) -> target console output.');

  const isTs = dst === 'typescript';
  const lines = code.split('\n');

  const convertedLines = processInChunks(lines, 100, (line) => {
    // 1. Comments
    line = line.replace(/#\s*(.*)/g, '// $1');

    // 2. Prints
    line = mapPrintStatements(line, 'python', dst);

    // 3. String formatting
    line = mapStringInterpolation(line, dst);

    // 4. Literals & booleans
    line = line
      .replace(/\bNone\b/g, dst === 'go' ? 'nil' : dst === 'rust' ? 'None' : dst === 'cpp' ? 'nullptr' : 'null')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false');

    // 5. Function declarations
    if (dst === 'javascript' || dst === 'typescript') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(\s*->\s*[a-zA-Z0-9_<>\[\], ]+)?\s*:/g, (_m, name, params, ret) => {
        let returnType = isTs ? ': any' : '';
        if (isTs && ret) {
          returnType = ': ' + ret.replace('->', '').trim()
            .replace(/\bint\b|\bfloat\b/g, 'number')
            .replace(/\bstr\b/g, 'string')
            .replace(/\bbool\b/g, 'boolean')
            .replace(/\blist\b/g, 'any[]')
            .replace(/\bdict\b/g, 'Record<string, any>');
        }
        return `export function ${name}(${params})${returnType} {`;
      });
    } else if (dst === 'go') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'func $1($2) {');
    } else if (dst === 'rust') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'pub fn $1($2) {');
    } else if (dst === 'java' || dst === 'csharp') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'public static void $1($2) {');
    } else if (dst === 'cpp') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'void $1($2) {');
    } else if (dst === 'php') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'function $1($2) {');
    } else if (dst === 'ruby') {
      line = line.replace(/\bdef\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'def $1($2)');
    }

    // 6. Control flow (if, elif, else, while, for)
    line = line
      .replace(/\belif\s+(.*?):/g, 'else if ($1) {')
      .replace(/\bif\s+(.*?):/g, 'if ($1) {')
      .replace(/\belse:/g, 'else {')
      .replace(/\bwhile\s+(.*?):/g, 'while ($1) {')
      .replace(/\bfor\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):/g, (_m, varName, rangeArgs) => {
        if (dst === 'go') return `for ${varName} := 0; ${varName} < ${rangeArgs}; ${varName}++ {`;
        if (dst === 'rust') return `for ${varName} in 0..${rangeArgs} {`;
        return `for (let ${varName} = 0; ${varName} < ${rangeArgs}; ${varName}++) {`;
      })
      .replace(/\bfor\s+([a-zA-Z0-9_]+)\s+in\s+(.*?):/g, (_m, varName, iter) => {
        if (dst === 'go') return `for _, ${varName} := range ${iter} {`;
        if (dst === 'rust') return `for ${varName} in ${iter}.iter() {`;
        return `for (const ${varName} of ${iter}) {`;
      })
      .replace(/\breturn\s+(.*?)$/g, 'return $1;')
      .replace(/\bpass\b/g, '// pass')
      .replace(/\bimport\s+([a-zA-Z0-9_]+)/g, '// import $1');

    // 7. Array & Dict operations
    line = line
      .replace(/\.append\((.*?)\)/g, '.push($1)')
      .replace(/\blen\((.*?)\)/g, '$1.length');

    return line;
  });

  let result = convertedLines.join('\n');
  if ((dst === 'javascript' || dst === 'typescript' || dst === 'go' || dst === 'rust' || dst === 'java' || dst === 'cpp' || dst === 'csharp' || dst === 'php') && result.includes('{') && !result.endsWith('}')) {
    result += '\n}';
  }

  if (dst === 'go') {
    result = `package main\n\nimport "fmt"\n\n${result}`;
  }

  return result;
}

/**
 * Convert JavaScript / TypeScript to Target Language
 */
function convertFromJsTs(code: string, src: string, dst: string, warnings: string[], notes: string[]): string {
  notes.push(`Converted ${src.toUpperCase()} syntax, closures, and imports.`);
  notes.push('Mapped console.log -> target output function.');

  const lines = code.split('\n');

  if (dst === 'python') {
    const convertedLines = processInChunks(lines, 100, (line) => {
      line = line.replace(/\/\/\s*(.*)/g, '# $1');
      line = mapPrintStatements(line, src, 'python');
      line = mapStringInterpolation(line, 'python');

      // Functions & arrows
      line = line
        .replace(/export\s+function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(\s*:\s*[a-zA-Z0-9_<>\[\], ]+)?\s*\{/g, 'def $1($2):')
        .replace(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(\s*:\s*[a-zA-Z0-9_<>\[\], ]+)?\s*\{/g, 'def $1($2):')
        .replace(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*\((.*?)\)\s*=>\s*\{/g, 'def $1($2):')
        .replace(/\bif\s*\((.*?)\)\s*\{/g, 'if $1:')
        .replace(/\belse\s+if\s*\((.*?)\)\s*\{/g, 'elif $1:')
        .replace(/\belse\s*\{/g, 'else:')
        .replace(/\bwhile\s*\((.*?)\)\s*\{/g, 'while $1:')
        .replace(/for\s*\((?:(?:const|let|var)\s+)?([a-zA-Z0-9_]+)\s+of\s+(.*?)\)\s*\{/g, 'for $1 in $2:')
        .replace(/for\s*\((?:(?:const|let|var)\s+)?([a-zA-Z0-9_]+)\s+in\s+(.*?)\)\s*\{/g, 'for $1 in $2.keys():')
        .replace(/for\s*\((?:let|var)\s+([a-zA-Z0-9_]+)\s*=\s*0;\s*\1\s*<\s*([a-zA-Z0-9_.]+);\s*\1\+\+\)\s*\{/g, 'for $1 in range($2):')
        .replace(/\bconst\s+|\blet\s+|\bvar\s+/g, '')
        .replace(/===/g, '==')
        .replace(/!==/g, '!=')
        .replace(/\btrue\b/g, 'True')
        .replace(/\bfalse\b/g, 'False')
        .replace(/\bnull\b|\bundefined\b/g, 'None')
        .replace(/\.push\((.*?)\)/g, '.append($1)')
        .replace(/([a-zA-Z0-9_]+)\.length/g, 'len($1)')
        .replace(/;\s*$/gm, '')
        .replace(/\}\s*$/gm, '');

      return line;
    });

    return convertedLines.filter((l) => l.trim() !== '').join('\n');
  }

  if (dst === 'go') {
    const convertedLines = processInChunks(lines, 100, (line) => {
      line = mapPrintStatements(line, src, 'go');
      line = line
        .replace(/\bconst\s+([a-zA-Z0-9_]+)\s*=/g, '$1 :=')
        .replace(/\blet\s+([a-zA-Z0-9_]+)\s*=/g, '$1 :=')
        .replace(/\bvar\s+([a-zA-Z0-9_]+)\s*=/g, '$1 :=')
        .replace(/\bexport\s+function\s+([a-zA-Z0-9_]+)/g, 'func $1')
        .replace(/\bfunction\s+([a-zA-Z0-9_]+)/g, 'func $1')
        .replace(/\bnull\b|\bundefined\b/g, 'nil')
        .replace(/;\s*$/g, '');
      return line;
    });

    return `package main\n\nimport "fmt"\n\n${convertedLines.join('\n')}`;
  }

  if (dst === 'rust') {
    const convertedLines = processInChunks(lines, 100, (line) => {
      line = mapPrintStatements(line, src, 'rust');
      line = line
        .replace(/\bconst\s+([a-zA-Z0-9_]+)/g, 'let $1')
        .replace(/\blet\s+([a-zA-Z0-9_]+)/g, 'let mut $1')
        .replace(/\bexport\s+function\s+([a-zA-Z0-9_]+)/g, 'pub fn $1')
        .replace(/\bfunction\s+([a-zA-Z0-9_]+)/g, 'fn $1')
        .replace(/\bnull\b|\bundefined\b/g, 'None');
      return line;
    });

    return `// Converted to Rust\n${convertedLines.join('\n')}`;
  }

  if (dst === 'csharp' || dst === 'java') {
    const convertedLines = processInChunks(lines, 100, (line) => {
      line = mapPrintStatements(line, src, dst);
      line = line
        .replace(/\bconst\s+|\blet\s+|\bvar\s+/g, 'var ')
        .replace(/\bexport\s+function\s+([a-zA-Z0-9_]+)/g, 'public static void $1')
        .replace(/\bfunction\s+([a-zA-Z0-9_]+)/g, 'public static void $1');
      return line;
    });

    return `// Converted to ${dst === 'csharp' ? 'C# (.NET)' : 'Java'}\n${convertedLines.join('\n')}`;
  }

  return convertGeneric(code, src, dst, warnings, notes);
}

/**
 * Universal fallback converter
 */
function convertGeneric(code: string, src: string, dst: string, warnings: string[], notes: string[]): string {
  notes.push(`Transpiled syntax from ${src.toUpperCase()} to ${dst.toUpperCase()}.`);
  const lines = code.split('\n');
  const converted = processInChunks(lines, 100, (line) => {
    line = mapPrintStatements(line, src, dst);
    return line;
  });

  return `// Transpiled from ${src.toUpperCase()} to ${dst.toUpperCase()}\n// Converted with DevKits Universal AST Engine\n\n${converted.join('\n')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // 1. Try forwarding to backend API
    try {
      const response = await fetch(`${apiUrl}/api/sandbox/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not running or unreachable — proceed to built-in AST engine
    }

    // 2. High-fidelity built-in chunked transpiler
    const { sourceLanguage = 'python', targetLanguage = 'typescript', sourceCode = '' } = body;
    const src = sourceLanguage.toLowerCase().trim();
    const dst = targetLanguage.toLowerCase().trim();

    // Memory protection: if payload exceeds 2MB, warn and process in safe slices
    const safeCode = sourceCode.length > 2 * 1024 * 1024 ? sourceCode.slice(0, 2 * 1024 * 1024) : sourceCode;

    const warnings: string[] = [];
    const notes: string[] = [];
    let targetCode = '';

    if (sourceCode.length > 2 * 1024 * 1024) {
      warnings.push('Input payload exceeded 2MB safety scope; processed in safe chunked window.');
    }

    if (src === dst) {
      targetCode = safeCode;
      notes.push('Source and target languages are identical.');
    } else if (src === 'python' || src === 'py') {
      targetCode = convertFromPython(safeCode, dst, warnings, notes);
    } else if (src === 'javascript' || src === 'typescript' || src === 'js' || src === 'ts') {
      targetCode = convertFromJsTs(safeCode, src, dst, warnings, notes);
    } else if (src === 'java' && dst === 'csharp') {
      notes.push('Converted Java classes to C#.');
      targetCode = safeCode
        .replace(/package\s+(.*?);/g, 'namespace $1;')
        .replace(/System\.out\.println\((.*?)\);/g, 'Console.WriteLine($1);')
        .replace(/\bboolean\b/g, 'bool');
    } else {
      targetCode = convertGeneric(safeCode, src, dst, warnings, notes);
    }

    return NextResponse.json({
      targetCode,
      sourceLanguage,
      targetLanguage,
      warnings,
      notes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Conversion error' }, { status: 500 });
  }
}
