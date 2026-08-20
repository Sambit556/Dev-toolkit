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
        content: `/**
 * DevKits Cloud IDE - TypeScript Project
 * Isolated Sandbox Powered by Upstash Box
 */

interface UserMetric {
  id: string;
  username: string;
  requestsHandled: number;
  avgLatencyMs: number;
  status: 'active' | 'idle' | 'rate_limited';
}

class TelemetryEngine {
  private metrics: Map<string, UserMetric> = new Map();

  public register(user: UserMetric): void {
    this.metrics.set(user.id, user);
    console.log(\`✅ Registered user telemetry: \${user.username} (ID: \${user.id})\`);
  }

  public getSummary(): { totalUsers: number; avgLatency: number; healthy: boolean } {
    let totalLatency = 0;
    for (const metric of this.metrics.values()) {
      totalLatency += metric.avgLatencyMs;
    }
    const count = this.metrics.size;
    return {
      totalUsers: count,
      avgLatency: count > 0 ? Number((totalLatency / count).toFixed(2)) : 0,
      healthy: count > 0,
    };
  }
}

// Sandbox execution test
const engine = new TelemetryEngine();
engine.register({ id: 'u_101', username: 'alex_dev', requestsHandled: 4200, avgLatencyMs: 14.8, status: 'active' });
engine.register({ id: 'u_102', username: 'sarah_ops', requestsHandled: 9120, avgLatencyMs: 11.2, status: 'active' });
engine.register({ id: 'u_103', username: 'bot_crawler', requestsHandled: 120, avgLatencyMs: 45.0, status: 'idle' });

const summary = engine.getSummary();
console.log('\\n📊 Engine Analytics Summary:');
console.table(summary);
console.log(\`\\n🚀 System Status: All \${summary.totalUsers} nodes running inside isolated sandbox!\`);
`,
      },
      {
        name: 'package.json',
        content: `{
  "name": "devkits-typescript-workspace",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "ts-node index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "zod": "^3.22.4"
  }
}`,
      },
      {
        name: 'README.md',
        content: `# TypeScript Cloud IDE Workspace
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
        content: `// DevKits Cloud IDE - JavaScript / Node.js Environment
// Isolated execution with real-time stdout/stderr

const crypto = require('crypto');

function generateSecureSession(username) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const token = crypto.createHash('sha256').update(sessionId + username).digest('hex');
  
  return {
    sessionId,
    username,
    token: token.substring(0, 32) + '...',
    issuedAt: new Date().toISOString(),
    expiresIn: 3600
  };
}

console.log('⚡ Initializing DevKits Execution Sandbox...');
const session = generateSecureSession('developer_one');
console.log('\\n🔐 Generated Isolated Session:');
console.log(JSON.stringify(session, null, 2));

const randomNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
console.log('\\n🎲 Computed random vector:', randomNumbers);
console.log('📈 Sum:', randomNumbers.reduce((a, b) => a + b, 0));
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
        content: `"""
DevKits Cloud IDE - Python 3 Sandbox
Isolated execution with real-time telemetry
"""
import math
import time

class DataProcessor:
    def __init__(self, name: str):
        self.name = name
        self.records = []

    def ingest(self, values: list[float]):
        self.records.extend(values)
        print(f"📥 Ingested {len(values)} records into {self.name}")

    def compute_stats(self):
        if not self.records:
            return None
        n = len(self.records)
        mean = sum(self.records) / n
        variance = sum((x - mean) ** 2 for x in self.records) / n
        std_dev = math.sqrt(variance)
        return {
            "count": n,
            "mean": round(mean, 2),
            "std_dev": round(std_dev, 2),
            "min": min(self.records),
            "max": max(self.records)
        }

if __name__ == "__main__":
    print("🐍 Python 3 Cloud Environment Ready.")
    processor = DataProcessor("Server-Metrics")
    processor.ingest([14.2, 18.9, 12.5, 34.1, 22.0, 19.8, 15.3])
    
    stats = processor.compute_stats()
    print("\\n📊 Statistical Analysis Results:")
    for k, v in stats.items():
        print(f"  • {k.capitalize()}: {v}")
    print("\\n✨ Execution completed successfully.")
`,
      },
      {
        name: 'requirements.txt',
        content: `numpy==1.26.4\npandas==2.2.1`,
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

import (
	"fmt"
	"time"
)

type WorkerResult struct {
	ID        int
	Processed int
	Duration  time.Duration
}

func main() {
	fmt.Println("🐹 DevKits Go Sandbox Initialized")
	fmt.Println("🚀 Spawning concurrent pipeline...")

	results := []WorkerResult{
		{ID: 1, Processed: 1540, Duration: 12 * time.Millisecond},
		{ID: 2, Processed: 2430, Duration: 18 * time.Millisecond},
		{ID: 3, Processed: 1890, Duration: 14 * time.Millisecond},
	}

	total := 0
	for _, r := range results {
		fmt.Printf("  • Worker %d processed %d items in %v\\n", r.ID, r.Processed, r.Duration)
		total += r.Processed
	}

	fmt.Printf("\\n📊 Total throughput: %d operations completed.\\n", total)
	fmt.Println("✅ Go Sandbox execution successful.")
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
        content: `// DevKits Cloud IDE - Rust Environment
// Compile & execute memory-safe code

#[derive(Debug)]
struct TaskMetric {
    id: u32,
    name: &'static str,
    latency_us: u64,
    passed: bool,
}

fn main() {
    println!("🦀 Rust Isolated Sandbox Online!");
    
    let metrics = vec![
        TaskMetric { id: 1, name: "FastPath-Parser", latency_us: 120, passed: true },
        TaskMetric { id: 2, name: "Crypto-Signer", latency_us: 840, passed: true },
        TaskMetric { id: 3, name: "Buffer-Pool", latency_us: 45, passed: true },
    ];

    println!("\\nTelemetry Output:");
    for m in &metrics {
        println!("  [{}] {} => {}μs (Status: {:?})", m.id, m.name, m.latency_us, m.passed);
    }

    let avg_latency: f64 = metrics.iter().map(|m| m.latency_us).sum::<u64>() as f64 / metrics.len() as f64;
    println!("\\n⚡ Average Execution Latency: {:.2}μs", avg_latency);
    println!("✨ Process finished with exit code 0");
}
`,
      },
      {
        name: 'Cargo.toml',
        content: `[package]
name = "devkits-rust-workspace"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
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
#include <string>

struct NodeMetric {
    std::string name;
    double loadAverage;
    int activeSockets;
};

int main() {
    std::cout << "⚙️ C++20 Cloud IDE Execution Sandbox" << std::endl;
    std::cout << "------------------------------------" << std::endl;

    std::vector<NodeMetric> cluster = {
        {"node-us-east", 0.42, 1280},
        {"node-eu-central", 0.68, 2450},
        {"node-ap-south", 0.31, 940}
    };

    int totalSockets = 0;
    for (const auto& node : cluster) {
        std::cout << "  • " << node.name << " | Load: " << node.loadAverage << " | Sockets: " << node.activeSockets << std::endl;
        totalSockets += node.activeSockets;
    }

    std::cout << "\\n📊 Total Active Cluster Sockets: " << totalSockets << std::endl;
    std::cout << "✅ C++ execution completed successfully." << std::endl;
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
        content: `import java.time.Instant;
import java.util.List;

public class Main {
    record ServiceStatus(String name, int port, boolean healthy) {}

    public static void main(String[] args) {
        System.out.println("☕ DevKits Java Cloud Sandbox (OpenJDK 21)");
        System.out.println("Timestamp: " + Instant.now());
        System.out.println("------------------------------------------");

        var services = List.of(
            new ServiceStatus("AuthService", 8081, true),
            new ServiceStatus("StorageVault", 8082, true),
            new ServiceStatus("SandboxRunner", 8083, true)
        );

        for (var s : services) {
            System.out.println("  • " + s.name() + " [Port " + s.port() + "] Status: " + (s.healthy() ? "HEALTHY" : "DOWN"));
        }

        System.out.println("\\n✅ All microservices verified in sandbox.");
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
        content: `-- DevKits Cloud IDE - SQL Workspace
-- Table definitions, indexes, and queries

CREATE TABLE IF NOT EXISTS developers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'engineer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  developer_id INT REFERENCES developers(id),
  title VARCHAR(200) NOT NULL,
  language VARCHAR(50) NOT NULL,
  stars INT DEFAULT 0
);

INSERT INTO developers (name, email, role) VALUES
  ('Dev Sarah', 'sarah@devkits.space', 'lead_architect'),
  ('Dev Alex', 'alex@devkits.space', 'systems_engineer');

INSERT INTO projects (developer_id, title, language, stars) VALUES
  (1, 'Cloud Sandbox Engine', 'Rust', 450),
  (2, 'High-Throughput API Gateway', 'Go', 320);

-- Query active projects with developer details
SELECT 
  p.id,
  p.title,
  p.language,
  p.stars,
  d.name AS author_name,
  d.role
FROM projects p
JOIN developers d ON p.developer_id = d.id
ORDER BY p.stars DESC;
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
# DevKits Cloud IDE - Shell Automation

set -euo pipefail

echo "🐚 Running Cloud Sandbox Deployment Script..."
echo "=============================================="

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "⏱  Execution Time: $TIMESTAMP"
echo "🖥  Current Working Dir: $(pwd)"

echo -e "\\n📦 Checking workspace artifacts:"
ls -la

echo -e "\\n🚀 Healthcheck verification:"
echo "  • Sandbox RAM: OK"
echo "  • CPU Limits: 2 vCPU allocated"
echo "  • Security Isolation: ENABLED"

echo -e "\\n✅ Deployment sequence completed successfully."
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
// DevKits Cloud IDE - PHP 8.3 Sandbox

class CloudResponse {
    public function __construct(
        public string $status,
        public array $data,
        public string $timestamp
    ) {}

    public function toJson(): string {
        return json_encode([
            'status' => $this->status,
            'data' => $this->data,
            'timestamp' => $this->timestamp,
        ], JSON_PRETTY_PRINT);
    }
}

echo "🐘 PHP 8.3 Isolated Runner\\n\\n";
$resp = new CloudResponse(
    'success',
    ['memory_limit' => '256M', 'version' => PHP_VERSION, 'opcache' => true],
    gmdate('Y-m-d H:i:s')
);

echo $resp->toJson() . "\\n";
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
        content: `# DevKits Cloud IDE - Ruby Sandbox
puts "💎 Ruby 3.3 Execution Sandbox"

payload = {
  service: "DevKits Cloud IDE",
  status: "healthy",
  latency_ms: 12.4,
  tags: ["fast", "isolated", "upstash_box"]
}

puts "Parsed Payload Structure:"
payload.each do |k, v|
  puts "  • #{k}: #{v}"
end

puts "\\n✅ Ruby code executed successfully."
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
];
