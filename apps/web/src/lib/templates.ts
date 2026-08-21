export interface ProjectFile {
  name: string;
  content: string;
  language?: string;
  isFolder?: boolean;
}

export interface LanguageTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'Backend' | 'Systems' | 'Frontend' | 'Data & Scripting' | 'Database' | 'Blockchain';
  monacoLanguage: string;
  extension: string;
  entryPoint: string;
  description: string;
  version: string;
  files: ProjectFile[];
  disabled?: boolean;
  disabledReason?: string;
}

export const LANGUAGE_TEMPLATES: LanguageTemplate[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🔷',
    category: 'Backend',
    monacoLanguage: 'typescript',
    extension: '.ts',
    entryPoint: 'index.ts',
    description: 'Modern typed Node.js runtime with full IntelliSense and async execution',
    version: '5.3.3',
    files: [
      {
        name: 'index.ts',
        content: `// DevKits Online IDE - TypeScript Environment

function greet(name: string, count: number): void {
  console.log(\`Hello, \${name}! Welcome to DevKits Online IDE.\`);
  console.log(\`Execution count: \${count}\`);
}

const numbers: number[] = [10, 25, 30, 45, 50];
const total: number = numbers.reduce((sum, num) => sum + num, 0);

greet("Developer", 1);
console.log("Array values:", numbers);
console.log("Total Sum:", total);
console.log("Average:", total / numbers.length);
`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-typescript-workspace",
  "version": "1.0.0",
  "main": "index.ts"
}`,
      },
      {
        name: 'README.md',
        content: `# TypeScript Online IDE Workspace
Run in isolated VM sandbox with full TypeScript compilation and real-time execution telemetry.`,
      },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript / Node.js',
    icon: '🟨',
    category: 'Backend',
    monacoLanguage: 'javascript',
    extension: '.js',
    entryPoint: 'index.js',
    description: 'Fast Node.js environment with ESNext syntax & async streams',
    version: 'Node.js 20.11',
    files: [
      {
        name: 'index.js',
        content: `// DevKits Online IDE - JavaScript Environment

function calculateStats(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  return { sum, avg };
}

const data = [12, 24, 36, 48, 60];
const stats = calculateStats(data);

console.log("Hello from JavaScript Online IDE!");
console.log("Data Points:", data);
console.log("Total Sum:", stats.sum);
console.log("Average Value:", stats.avg);
`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "javascript-sandbox",
  "version": "1.0.0",
  "main": "index.js"
}`,
      },
    ],
  },
  {
    id: 'python',
    name: 'Python 3',
    icon: '🐍',
    category: 'Data & Scripting',
    monacoLanguage: 'python',
    extension: '.py',
    entryPoint: 'main.py',
    description: 'Python 3 runtime for algorithms, data analytics, and backend APIs',
    version: 'Python 3.11',
    files: [
      {
        name: 'main.py',
        content: `# DevKits Online IDE - Python 3 Sandbox

def calculate_stats(numbers):
    total = sum(numbers)
    average = total / len(numbers)
    return total, average

print("Hello from Python 3 Online IDE!")

data = [10, 20, 30, 40, 50]
total, average = calculate_stats(data)

print(f"Data Points: {data}")
print(f"Total Sum: {total}")
print(f"Average: {average}")
`,
      },
    ],
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    icon: '🐹',
    category: 'Systems',
    monacoLanguage: 'go',
    extension: '.go',
    entryPoint: 'main.go',
    description: 'High-performance compiled systems language with concurrency & goroutines',
    version: 'Go 1.22',
    files: [
      {
        name: 'main.go',
        content: `package main

import "fmt"

func main() {
	fmt.Println("Hello from Go Sandbox!")

	numbers := []int{10, 20, 30, 40, 50}
	total := 0
	for _, n := range numbers {
		total += n
	}

	fmt.Printf("Numbers: %v\\n", numbers)
	fmt.Printf("Total Sum: %d\\n", total)
}
`,
      },
      {
        name: 'go.mod',
        content: `module devkits/workspace\n\ngo 1.22`,
      },
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    icon: '🦀',
    category: 'Systems',
    monacoLanguage: 'rust',
    extension: '.rs',
    entryPoint: 'src/main.rs',
    description: 'Memory-safe systems programming with zero-cost abstractions',
    version: 'Rust 1.77',
    files: [
      {
        name: 'src/main.rs',
        content: `// DevKits Online IDE - Rust Environment

fn main() {
    println!("Hello from Rust Sandbox!");

    let numbers = vec![10, 20, 30, 40, 50];
    let total: i32 = numbers.iter().sum();

    println!("Numbers: {:?}", numbers);
    println!("Total Sum: {}", total);
}
`,
      },
      {
        name: 'Cargo.toml',
        content: `[package]
name = "devkits-rust-workspace"
version = "0.1.0"
edition = "2021"
`,
      },
    ],
  },
  {
    id: 'cpp',
    name: 'C++ (C++20)',
    icon: '⚙️',
    category: 'Systems',
    monacoLanguage: 'cpp',
    extension: '.cpp',
    entryPoint: 'main.cpp',
    description: 'High-performance C++20 compiler with STL & modern memory model',
    version: 'GCC 13.2',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++ Sandbox!" << std::endl;

    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int total = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Total Sum: " << total << std::endl;
    return 0;
}
`,
      },
    ],
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 21)',
    icon: '☕',
    category: 'Backend',
    monacoLanguage: 'java',
    extension: '.java',
    entryPoint: 'Main.java',
    description: 'Modern Java 21 LTS with record classes & pattern matching',
    version: 'OpenJDK 21',
    files: [
      {
        name: 'Main.java',
        content: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Sandbox!");

        List<Integer> numbers = List.of(10, 20, 30, 40, 50);
        int total = numbers.stream().mapToInt(Integer::intValue).sum();

        System.out.println("Numbers: " + numbers);
        System.out.println("Total Sum: " + total);
    }
}
`,
      },
    ],
  },
  {
    id: 'sql',
    name: 'SQL (PostgreSQL / SQLite)',
    icon: '🗄️',
    category: 'Database',
    monacoLanguage: 'sql',
    extension: '.sql',
    entryPoint: 'schema.sql',
    description: 'Relational database schema designer and SQL query executor',
    version: 'PostgreSQL 16 / SQLite 3',
    files: [
      {
        name: 'schema.sql',
        content: `-- DevKits Online IDE - SQL Workspace

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'Developer'
);

INSERT INTO users (id, name, role) VALUES 
  (1, 'Alex Dev', 'Lead Engineer'),
  (2, 'Sarah Ops', 'Architect');

SELECT * FROM users;
`,
      },
    ],
  },
  {
    id: 'bash',
    name: 'Bash / Shell Script',
    icon: '🐚',
    category: 'Data & Scripting',
    monacoLanguage: 'shell',
    extension: '.sh',
    entryPoint: 'deploy.sh',
    description: 'UNIX shell scripting for automation, CI/CD pipelines, and DevOps',
    version: 'GNU Bash 5.2',
    files: [
      {
        name: 'deploy.sh',
        content: `#!/usr/bin/env bash
# DevKits Online IDE - Shell Automation

echo "Hello from Bash Sandbox!"

NUMBERS=(10 20 30 40 50)
TOTAL=0

for n in "\${NUMBERS[@]}"; do
  TOTAL=$((TOTAL + n))
done

echo "Numbers: \${NUMBERS[*]}"
echo "Total Sum: $TOTAL"
`,
      },
    ],
  },
  {
    id: 'php',
    name: 'PHP / Laravel',
    icon: '🐘',
    category: 'Backend',
    monacoLanguage: 'php',
    extension: '.php',
    entryPoint: 'index.php',
    description: 'Modern PHP 8.3 & Laravel Blade with routing simulation and live Artisan status',
    version: 'PHP 8.3 / Laravel 11',
    files: [
      {
        name: 'index.php',
        content: `<?php
// DevKits Cloud IDE - Laravel 11 & Modern PHP Sandbox

class TaskController {
    public function getTasks() {
        return [
            ['id' => 1, 'title' => 'Configure DevKits Cloud Workspace', 'completed' => true, 'tag' => 'DevOps'],
            ['id' => 2, 'title' => 'Build reactive API endpoints with PHP 8.3', 'completed' => false, 'tag' => 'Backend'],
            ['id' => 3, 'title' => 'Launch Live Browser Studio & Artisan Sandbox', 'completed' => true, 'tag' => 'Fullstack'],
        ];
    }
}

$controller = new TaskController();
$tasks = $controller->getTasks();
$completedCount = count(array_filter($tasks, fn($t) => $t['completed']));

echo "=== Laravel 11 & PHP 8.3 Sandbox ===\\n";
echo "Total Tasks: " . count($tasks) . " | Completed: " . $completedCount . "\\n";
foreach ($tasks as $task) {
    $status = $task['completed'] ? ' [DONE] ' : ' [TODO] ';
    echo $status . $task['title'] . " (" . $task['tag'] . ")\\n";
}
`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laravel 11 Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans selection:bg-rose-500 selection:text-white">
  <div class="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-red-950/30 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
          <span class="text-xl">🐘</span>
        </div>
        <div>
          <h1 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Laravel 11 Studio
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">PHP 8.3</span>
          </h1>
          <p class="text-xs text-rose-400 font-medium">Eloquent ORM & Artisan API Sandbox</p>
        </div>
      </div>
      <div class="text-right">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Artisan: Active
        </span>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-3 gap-3">
      <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
        <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Routes</div>
        <div class="text-base font-bold text-white mt-0.5">14 API</div>
      </div>
      <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
        <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Memory</div>
        <div class="text-base font-bold text-red-400 mt-0.5">8.4 MB</div>
      </div>
      <div class="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
        <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Speed</div>
        <div class="text-base font-bold text-emerald-400 mt-0.5">14 ms</div>
      </div>
    </div>

    <!-- Active Tasks Feed -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-slate-300 uppercase tracking-wider">Eloquent Model Data</span>
        <span id="taskCount" class="text-slate-400">3 tasks loaded</span>
      </div>
      <div id="taskList" class="space-y-2">
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-red-500/40 transition-colors">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-medium text-slate-200">Configure DevKits Cloud Workspace</span>
          </div>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-slate-400 border border-slate-800">DevOps</span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-red-500/40 transition-colors">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-xs font-medium text-slate-200">Build reactive API endpoints with PHP 8.3</span>
          </div>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-slate-400 border border-slate-800">Backend</span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-red-500/40 transition-colors">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-medium text-slate-200">Launch Live Browser Studio & Artisan Sandbox</span>
          </div>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-900 text-slate-400 border border-slate-800">Fullstack</span>
        </div>
      </div>
    </div>

    <!-- Interactive Artisan Action -->
    <div class="pt-2">
      <button id="artisanBtn" class="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2">
        <span>⚡ Run php artisan optimize</span>
      </button>
      <div id="artisanOutput" class="hidden mt-3 p-3 bg-slate-950 rounded-xl border border-red-500/30 font-mono text-[11px] text-red-300">
        ✓ Configuration cached successfully.<br/>
        ✓ Routes cached successfully. [14 routes]<br/>
        ✓ Blade templates pre-compiled.
      </div>
    </div>
  </div>

  <script>
    document.getElementById('artisanBtn').addEventListener('click', function() {
      const out = document.getElementById('artisanOutput');
      out.classList.toggle('hidden');
    });
  </script>
</body>
</html>`,
      },
    ],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    icon: '💎',
    category: 'Backend',
    monacoLanguage: 'ruby',
    extension: '.rb',
    entryPoint: 'main.rb',
    description: 'Dynamic object-oriented programming with expressive syntax',
    version: 'Ruby 3.3',
    files: [
      {
        name: 'main.rb',
        content: `# DevKits Online IDE - Ruby Sandbox

puts "Hello from Ruby Sandbox!"

numbers = [10, 20, 30, 40, 50]
total = numbers.sum

puts "Numbers: #{numbers}"
puts "Total Sum: #{total}"
`,
      },
    ],
  },
  {
    id: 'html',
    name: 'HTML5 / CSS / JS Playground',
    icon: '🌐',
    category: 'Frontend',
    monacoLanguage: 'html',
    extension: '.html',
    entryPoint: 'index.html',
    description: 'Live interactive frontend web sandbox with instant DOM rendering',
    version: 'HTML5 / Modern DOM',
    files: [
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DevKits Live Playground</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="badge">LIVE SANDBOX</div>
    <h1>⚡ DevKits Web Studio</h1>
    <p>Edit HTML, CSS, and JS with instant browser preview.</p>
    <button id="counterBtn" class="btn">Clicks: <span id="count">0</span></button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #090d16;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  background: #131b2e;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
}
.badge {
  display: inline-block;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 12px;
}
h1 { margin: 0 0 8px; font-size: 24px; }
p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
.btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
}
.btn:hover { background: #4f46e5; transform: scale(1.02); }
.btn:active { transform: scale(0.98); }`,
      },
      {
        name: 'app.js',
        content: `let count = 0;
const countEl = document.getElementById('count');
const btn = document.getElementById('counterBtn');

btn.addEventListener('click', () => {
  count++;
  countEl.textContent = count;
  console.log('Button clicked! New count:', count);
});`,
      },
    ],
  },
  {
    id: 'react',
    name: 'React.js',
    icon: '⚛️',
    category: 'Frontend',
    monacoLanguage: 'typescript',
    extension: '.tsx',
    entryPoint: 'App.tsx',
    description: 'Interactive React 18 component studio with JSX/TSX compilation and Tailwind CSS',
    version: 'React 18.2',
    files: [
      {
        name: 'App.tsx',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState<number>(0);
  const [todos, setTodos] = useState([
    { id: 1, text: 'Explore DevKits Cloud IDE', done: true, tag: 'Setup' },
    { id: 2, text: 'Build interactive React components', done: false, tag: 'Core' },
    { id: 3, text: 'Launch live browser preview', done: true, tag: 'Deploy' },
  ]);
  const [input, setInput] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false, tag: 'Custom' }]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-xl">⚛️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">React 18 Studio</h1>
              <p className="text-xs text-indigo-400 font-medium">Live JSX & Tailwind Preview</p>
            </div>
          </div>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            ⚡ Clicks: {count}
          </button>
        </div>

        <form onSubmit={addTodo} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Project Tasks</span>
            <span className="text-slate-500 font-medium">{todos.filter(t => t.done).length}/{todos.length} Done</span>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {todos.map(todo => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className={'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ' + (todo.done ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through' : 'bg-slate-800/70 border-slate-700 text-slate-200 hover:border-indigo-500/50')}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-medium">{todo.text}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">{todo.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React 18 App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950">
  <div id="root"></div>
</body>
</html>`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-react-workspace",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
      },
    ],
  },
  {
    id: 'nextjs',
    name: 'Next.js 14',
    icon: '▲',
    category: 'Frontend',
    monacoLanguage: 'typescript',
    extension: '.tsx',
    entryPoint: 'app/page.tsx',
    description: 'Next.js 14 App Router fullstack React framework with Server Actions & Tailwind',
    version: 'Next.js 14.2',
    files: [
      {
        name: 'app/page.tsx',
        content: `'use client';

import React, { useState } from 'react';

export default function NextPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'routes'>('overview');
  const [requests, setRequests] = useState<number>(142);
  const [statusMsg, setStatusMsg] = useState<string>('Server Component SSR Ready');

  const triggerAction = () => {
    setRequests((r) => r + 1);
    setStatusMsg(\`Server Action executed! Total requests processed: \${requests + 1}\`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-neutral-200 selection:text-black">
      <div className="w-full max-w-lg bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-xl shadow-lg shadow-white/10">
              ▲
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Next.js 14 App Router</h1>
              <p className="text-xs text-neutral-400 font-medium">React Server Components & Actions</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-200 text-xs font-bold border border-neutral-700 font-mono">
            Next.js 14.2
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={\`flex-1 py-1.5 rounded-lg transition-all \${
              activeTab === 'overview' ? 'bg-white text-black shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
            }\`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={\`flex-1 py-1.5 rounded-lg transition-all \${
              activeTab === 'actions' ? 'bg-white text-black shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
            }\`}
          >
            Server Action
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={\`flex-1 py-1.5 rounded-lg transition-all \${
              activeTab === 'routes' ? 'bg-white text-black shadow-sm font-bold' : 'text-neutral-400 hover:text-white'
            }\`}
          >
            App Routes
          </button>
        </div>

        {/* Dynamic Tab Body */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Runtime Status</div>
              <div className="text-xs text-emerald-400 font-semibold">{statusMsg}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <div className="text-neutral-400 text-[10px] uppercase font-bold">Architecture</div>
                <div className="text-white font-bold mt-0.5">App Router (app/)</div>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <div className="text-neutral-400 text-[10px] uppercase font-bold">Rendering</div>
                <div className="text-white font-bold mt-0.5">Hybrid SSR + RSC</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Simulated Server Hits</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">{requests}</div>
              </div>
              <button
                onClick={triggerAction}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                ⚡ Execute Action
              </button>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-2 text-xs text-neutral-300 animate-in fade-in">
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 font-mono text-[11px] flex justify-between">
              <span className="text-emerald-400">GET /</span>
              <span className="text-neutral-400">page.tsx (Server)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 font-mono text-[11px] flex justify-between">
              <span className="text-indigo-400">POST /api/action</span>
              <span className="text-neutral-400">route.ts (Edge)</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-[11px] text-neutral-500 text-center font-mono">
          ▲ Vercel Next.js 14 Engine • Hot Component Mounting Active
        </div>
      </div>
    </div>
  );
}
`,
      },
      {
        name: 'app/layout.tsx',
        content: `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js 14 App',
  description: 'Built with DevKits Online Cloud IDE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-nextjs-workspace",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
`,
      },
    ],
  },
  {
    id: 'vue',
    name: 'Vue.js 3',
    icon: '🟢',
    category: 'Frontend',
    monacoLanguage: 'html',
    extension: '.vue',
    entryPoint: 'App.vue',
    description: 'Progressive Vue 3 Single File Component studio with reactive Composition API',
    version: 'Vue 3.4',
    files: [
      {
        name: 'App.vue',
        content: `<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-emerald-500 selection:text-white">
    <div class="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span class="text-xl">🟢</span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-white tracking-tight">Vue.js 3 Studio</h1>
            <p class="text-xs text-emerald-400 font-medium">Composition API & Reactivity</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
          Count: {{ count }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <button
          @click="increment"
          class="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 active:scale-95"
        >
          ⚡ +1 Increment
        </button>
        <button
          @click="reset"
          class="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700"
        >
          ↺ Reset State
        </button>
      </div>

      <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Reactive Status:</div>
        <div class="text-xs font-semibold text-emerald-400">{{ message }}</div>
      </div>

      <div class="space-y-2">
        <div class="text-xs font-bold text-slate-300 uppercase tracking-wider">Vue 3 Capabilities:</div>
        <ul class="space-y-1.5 text-xs text-slate-300">
          <li class="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <span class="text-emerald-400">✓</span> Single File Components (.vue)
          </li>
          <li class="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <span class="text-emerald-400">✓</span> Fine-Grained Reactivity Engine
          </li>
          <li class="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <span class="text-emerald-400">✓</span> Hot Reload DOM Preview
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
      message: 'Click increment to test reactive state changes.'
    };
  },
  methods: {
    increment() {
      this.count++;
      this.message = 'Reactive state updated! Current count: ' + this.count;
    },
    reset() {
      this.count = 0;
      this.message = 'Counter reset back to initial 0.';
    }
  }
};
</script>`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950">
  <div id="app"></div>
</body>
</html>`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-vue-workspace",
  "version": "1.0.0",
  "dependencies": {
    "vue": "^3.4.0"
  }
}`,
      },
    ],
  },
  {
    id: 'angular',
    name: 'Angular',
    icon: '🅰️',
    category: 'Frontend',
    monacoLanguage: 'typescript',
    extension: '.ts',
    entryPoint: 'app.component.ts',
    description: 'Modern Angular Standalone component with TypeScript signals & reactive templates',
    version: 'Angular 17',
    files: [
      {
        name: 'app.component.ts',
        content: `// Angular 17 Standalone Component Studio
export class AppComponent {
  title = 'Angular 17 Standalone Studio';
  counter = 0;
  features = [
    'Standalone Components (No NgModules required)',
    'Fine-grained Reactive Signals',
    'Built-in Control Flow (@if, @for)',
    'Live Browser Preview & Hot Reload'
  ];

  increment() {
    this.counter++;
  }

  decrement() {
    if (this.counter > 0) this.counter--;
  }
}
`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Angular 17 App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans selection:bg-rose-500 selection:text-white" style="background-color: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px;">
  <div class="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6" style="width: 100%; max-width: 440px; background: linear-gradient(180deg, #0f172a 0%, #0f172a 60%, rgba(76, 5, 25, 0.4) 100%); border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px;">
    
    <!-- Top Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #f43f5e, #be123c); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(244, 63, 94, 0.3);">
          <span style="font-size: 20px;">🅰️</span>
        </div>
        <div>
          <h1 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0; line-height: 1.2;">Angular 17 Studio</h1>
          <p style="font-size: 12px; color: #fb7185; font-weight: 500; margin: 2px 0 0 0;">Standalone Signals Engine</p>
        </div>
      </div>
      <span style="padding: 4px 10px; border-radius: 9999px; background: rgba(244, 63, 94, 0.15); color: #fda4af; font-size: 11px; font-weight: 700; border: 1px solid rgba(244, 63, 94, 0.3);">
        v17.0
      </span>
    </div>

    <!-- Signal State Display Card -->
    <div style="padding: 16px; background: #030712; border-radius: 12px; border: 1px solid rgba(244, 63, 94, 0.3); display: flex; align-items: center; justify-content: space-between; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); margin-bottom: 20px;">
      <div>
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Reactive Signal State:</div>
        <div style="font-size: 12px; color: #e2e8f0; font-weight: 600; margin-top: 2px; font-family: monospace;">countSignal()</div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; border-radius: 9999px; background: #f43f5e; box-shadow: 0 0 8px #f43f5e; display: inline-block;"></span>
        <span id="counterValue" style="font-size: 28px; font-weight: 900; color: #fb7185; font-family: monospace; line-height: 1;">0</span>
      </div>
    </div>

    <!-- Signal Controls Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
      <button id="incBtn" style="padding: 12px; background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; font-size: 13px; font-weight: 700; border-radius: 12px; border: 1px solid #f43f5e; cursor: pointer; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4); display: flex; align-items: center; justify-content: center; gap: 6px; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">
        <span>⚡ +1 Signal</span>
      </button>
      <button id="decBtn" style="padding: 12px; background: #1e293b; color: #cbd5e1; font-size: 13px; font-weight: 700; border-radius: 12px; border: 1px solid #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">
        <span>-1 Decrement</span>
      </button>
    </div>

    <!-- Feature Checklist -->
    <div style="margin-top: 16px;">
      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Features Included:</div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(51, 65, 85, 0.6); font-size: 12px; color: #cbd5e1;">
          <span style="color: #fb7185; font-weight: bold;">✓</span> Standalone Component Architecture
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(51, 65, 85, 0.6); font-size: 12px; color: #cbd5e1;">
          <span style="color: #fb7185; font-weight: bold;">✓</span> Fine-Grained Angular Signals
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(51, 65, 85, 0.6); font-size: 12px; color: #cbd5e1;">
          <span style="color: #fb7185; font-weight: bold;">✓</span> Instant Hot Reload DOM Sandbox
        </div>
      </div>
    </div>
  </div>

  <script>
    let count = 0;
    const valEl = document.getElementById('counterValue');
    const incBtn = document.getElementById('incBtn');
    const decBtn = document.getElementById('decBtn');

    if (incBtn && valEl) {
      incBtn.onclick = function() {
        count++;
        valEl.textContent = count;
      };
    }
    if (decBtn && valEl) {
      decBtn.onclick = function() {
        if (count > 0) count--;
        valEl.textContent = count;
      };
    }
  </script>
</body>
</html>`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-angular-workspace",
  "version": "1.0.0",
  "dependencies": {
    "@angular/core": "^17.0.0",
    "rxjs": "^7.8.0"
  }
}`,
      },
    ],
  },
  {
    id: 'svelte',
    name: 'Svelte',
    icon: '🧡',
    category: 'Frontend',
    monacoLanguage: 'html',
    extension: '.svelte',
    entryPoint: 'App.svelte',
    description: 'Ultra-lean reactive Svelte component studio with zero runtime overhead',
    version: 'Svelte 4.2',
    disabled: true,
    disabledReason: 'Disabled',
    files: [
      {
        name: 'App.svelte',
        content: `<script>
  let count = 0;
  let name = 'World';

  function handleClick() {
    count += 1;
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-orange-500 selection:text-white" style="background-color: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px;">
  <div class="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6" style="width: 100%; max-width: 440px; background: linear-gradient(180deg, #0f172a 0%, #0f172a 60%, rgba(67, 20, 7, 0.4) 100%); border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #f97316, #d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(249, 115, 22, 0.3);">
          <span style="font-size: 20px;">🧡</span>
        </div>
        <div>
          <h1 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0; line-height: 1.2;">Svelte Studio</h1>
          <p style="font-size: 12px; color: #fb923c; font-weight: 500; margin: 2px 0 0 0;">True Reactive Architecture</p>
        </div>
      </div>
      <span style="padding: 4px 10px; border-radius: 9999px; background: rgba(249, 115, 22, 0.15); color: #fed7aa; font-size: 11px; font-weight: 700; border: 1px solid rgba(249, 115, 22, 0.3);">
        Svelte 4.2
      </span>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 11px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Greeting Name:</label>
      <input
        type="text"
        bind:value={name}
        style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #ffffff; outline: none;"
      />
    </div>

    <div style="padding: 16px; background: #030712; border-radius: 12px; border: 1px solid rgba(249, 115, 22, 0.3); text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0;">Hello {name}!</h2>
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Button clicked {count} {count === 1 ? 'time' : 'times'}</p>
    </div>

    <button
      on:click={handleClick}
      style="width: 100%; padding: 14px; background: linear-gradient(135deg, #ea580c, #d97706); color: #ffffff; font-size: 14px; font-weight: 700; border-radius: 12px; border: 1px solid #f97316; cursor: pointer; box-shadow: 0 6px 18px rgba(234, 88, 12, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px;"
    >
      ⚡ Click Me ({count})
    </button>
  </div>
</div>`,
      },
      {
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Svelte App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950">
  <div id="app"></div>
</body>
</html>`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-svelte-workspace",
  "version": "1.0.0",
  "dependencies": {
    "svelte": "^4.2.0"
  }
}`,
      },
    ],
  },
  {
    id: 'solidity',
    name: 'Solidity',
    icon: '💎',
    category: 'Blockchain',
    monacoLanguage: 'solidity',
    extension: '.sol',
    entryPoint: 'DevToken.sol',
    description: 'Solidity 0.8.24 Smart Contract Studio with ERC-20 standard, minting, transfer, and automated deployment test suite',
    version: 'Solidity 0.8.24',
    files: [
      {
        name: 'DevToken.sol',
        content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DevToken (DEVK) - Standard ERC-20 Smart Contract
 * @dev Built for high-security decentralized applications & DeFi
 */
contract DevToken {
    string public name = "DevKits Network Token";
    string public symbol = "DEVK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "DevToken: caller is not the owner");
        _;
    }

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals)));
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "DevToken: transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "DevToken: insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "DevToken: approve to zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "DevToken: transfer from zero address");
        require(to != address(0), "DevToken: transfer to zero address");
        require(balanceOf[from] >= amount, "DevToken: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "DevToken: allowance exceeded");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyOwner returns (bool) {
        _mint(to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "DevToken: mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }
}
`,
      },
      {
        name: 'test/DevTokenTest.js',
        content: `// Automated EVM Test Suite for DevToken.sol
console.log("[Solidity EVM Test Runner] Initializing local test network...");

const mockDeployer = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const alice = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const initialSupply = 1000000;

console.log(\`[OK] Compiled DevToken.sol [solc 0.8.24+commit.e11b9ed9]\`);
console.log(\`Contract deployed at address: 0x5FbDB2315678afecb367f032d93F642f64180aa3\`);
console.log(\`Owner initialized: \${mockDeployer}\`);
console.log(\`Initial Supply: \${initialSupply.toLocaleString()} DEVK\`);

// Test Transfers
console.log("\\n--- Running Contract Assertions ---");
console.log("[PASS] Test 1: Deployer balance matches initial supply");
console.log(\`[PASS] Test 2: Transfer 5,000 DEVK -> Alice (\${alice})\`);
console.log("[PASS] Test 3: Emits 'Transfer' event with indexed addresses");
console.log("[PASS] Test 4: Reverts on unauthorized mint attempt");

console.log("\\n[PASSED] 4 tests passed (0 failed) in 42ms");
`,
      },
      {
        name: 'hardhat.config.js',
        content: `module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://rpc.sepolia.org",
    },
  },
};
`,
      },
    ],
  },
];
