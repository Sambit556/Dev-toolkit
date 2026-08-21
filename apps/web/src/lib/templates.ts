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
  category: 'Backend' | 'Systems' | 'Frontend' | 'Data & Scripting' | 'Database';
  monacoLanguage: string;
  extension: string;
  entryPoint: string;
  description: string;
  version: string;
  files: ProjectFile[];
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
    name: 'PHP',
    icon: '🐘',
    category: 'Backend',
    monacoLanguage: 'php',
    extension: '.php',
    entryPoint: 'index.php',
    description: 'Modern PHP 8.3 with typed properties and arrow functions',
    version: 'PHP 8.3',
    files: [
      {
        name: 'index.php',
        content: `<?php
// DevKits Online IDE - PHP Sandbox

echo "Hello from PHP Sandbox!\\n";

$numbers = [10, 20, 30, 40, 50];
$total = array_sum($numbers);

echo "Numbers: " . json_encode($numbers) . "\\n";
echo "Total Sum: " . $total . "\\n";
`,
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
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([
    { id: 1, text: 'Explore DevKits Cloud IDE', done: true },
    { id: 2, text: 'Build interactive React components', done: false },
    { id: 3, text: 'Launch live browser preview', done: true },
  ]);
  const [input, setInput] = useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-spin">⚛️</span>
            <div>
              <h1 className="text-lg font-bold text-white">React 18 Studio</h1>
              <p className="text-xs text-indigo-400 font-medium">Live JSX & Tailwind Preview</p>
            </div>
          </div>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
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
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Tasks</h2>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {todos.map(todo => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className={\`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer \${
                  todo.done
                    ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-indigo-500/50'
                }\`}
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => {}}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium">{todo.text}</span>
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
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🟢</span>
          <div>
            <h1 class="text-lg font-bold text-white">Vue.js 3 Studio</h1>
            <p class="text-xs text-emerald-400 font-medium">Composition API & Reactivity</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
          Count: {{ count }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          @click="increment"
          class="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
        >
          + Increment
        </button>
        <button
          @click="reset"
          class="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
        >
          ↺ Reset
        </button>
      </div>

      <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
        <div class="text-xs text-slate-400">Dynamic Status:</div>
        <div class="text-sm font-semibold text-emerald-400">{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
      message: 'Click the increment button to update reactive state!'
    };
  },
  methods: {
    increment() {
      this.count++;
      this.message = \`State updated! Current value: \${this.count}\`;
    },
    reset() {
      this.count = 0;
      this.message = 'Counter reset back to 0.';
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
        content: `// Angular Standalone Component Definition
export class AppComponent {
  title = 'Angular Standalone Studio';
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
  <title>Angular App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
    <div class="flex items-center gap-2.5">
      <span class="text-2xl">🅰️</span>
      <div>
        <h1 class="text-lg font-bold text-white">Angular 17 Studio</h1>
        <p class="text-xs text-rose-400 font-medium">Standalone Components & Signals</p>
      </div>
    </div>

    <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
      <span class="text-xs text-slate-400 font-medium">Signal Counter:</span>
      <span id="counterValue" class="text-lg font-bold text-rose-400">0</span>
    </div>

    <div class="flex gap-2">
      <button id="incBtn" class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
        + Increment
      </button>
      <button id="decBtn" class="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all">
        - Decrement
      </button>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Features Included:</h3>
      <ul class="space-y-1.5 text-xs text-slate-300">
        <li class="flex items-center gap-2">✓ Standalone Components without NgModules</li>
        <li class="flex items-center gap-2">✓ Modern TypeScript & Dependency Injection</li>
        <li class="flex items-center gap-2">✓ Instant Hot Browser Sandbox</li>
      </ul>
    </div>
  </div>

  <script>
    let count = 0;
    const valEl = document.getElementById('counterValue');
    document.getElementById('incBtn').onclick = () => { count++; valEl.textContent = count; };
    document.getElementById('decBtn').onclick = () => { if (count > 0) count--; valEl.textContent = count; };
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

<div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
    <div class="flex items-center gap-2.5">
      <span class="text-2xl">🧡</span>
      <div>
        <h1 class="text-lg font-bold text-white">Svelte Studio</h1>
        <p class="text-xs text-orange-400 font-medium">True Reactive Architecture</p>
      </div>
    </div>

    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-slate-400">Greeting Name:</label>
      <input
        type="text"
        bind:value={name}
        class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
      />
    </div>

    <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
      <h2 class="text-base font-bold text-white">Hello {name}!</h2>
      <p class="text-xs text-slate-400 mt-1">Button clicked {count} {count === 1 ? 'time' : 'times'}</p>
    </div>

    <button
      on:click={handleClick}
      class="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
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
];
