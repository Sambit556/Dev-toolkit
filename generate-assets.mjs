import fs from 'fs';
import path from 'path';

async function generateAssets() {
  try {
    const sharp = (await import('sharp')).default;
    const publicDir = path.resolve('apps/web/public');

    // 1. Generate icon-192.png
    const svg192 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="192" height="192" rx="42" fill="url(#brand-grad)"/>
      <text x="96" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="78" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-2">DK</text>
    </svg>`;
    await sharp(Buffer.from(svg192)).png().toFile(path.join(publicDir, 'icon-192.png'));
    console.log('Created icon-192.png');

    // 2. Generate icon-512.png
    const svg512 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#brand-grad)"/>
      <text x="256" y="332" font-family="system-ui, -apple-system, sans-serif" font-size="208" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-6">DK</text>
    </svg>`;
    await sharp(Buffer.from(svg512)).png().toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Created icon-512.png');

    // 3. Generate og-image.png (1200 x 630)
    const svgOg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#060913" />
        </linearGradient>
        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="100%" stop-color="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg-grad)"/>
      
      <!-- Ambient glow circles -->
      <circle cx="200" cy="150" r="180" fill="#3b82f6" opacity="0.12" filter="blur(60px)"/>
      <circle cx="1000" cy="480" r="220" fill="#8b5cf6" opacity="0.12" filter="blur(70px)"/>

      <!-- Logo Icon -->
      <rect x="100" y="100" width="96" height="96" rx="24" fill="url(#brand-grad)"/>
      <text x="148" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="white" text-anchor="middle">DK</text>
      
      <!-- Brand Name -->
      <text x="216" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="white">DevKits</text>
      <text x="390" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#64748b">.space</text>

      <!-- Main Headline -->
      <text x="100" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="white">Developer Utility Suite &amp;</text>
      <text x="100" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="url(#text-grad)">Online IDE Sandbox</text>

      <!-- Subtitle -->
      <text x="100" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" fill="#94a3b8">Fast, privacy-first developer tools &amp; isolated multi-language code runner.</text>
      <text x="100" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#64748b">JSON • JWT • Epoch • UUID • Online IDE • AST Transpiler • AI Code Assistant</text>

      <!-- Badge row -->
      <rect x="100" y="520" width="160" height="36" rx="18" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" stroke-width="1"/>
      <text x="180" y="543" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#60a5fa" text-anchor="middle">⚡ OFFLINE FIRST</text>

      <rect x="280" y="520" width="160" height="36" rx="18" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" stroke-width="1"/>
      <text x="360" y="543" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#a78bfa" text-anchor="middle">🔒 PRIVACY FOCUSED</text>

      <rect x="460" y="520" width="180" height="36" rx="18" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1"/>
      <text x="550" y="543" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#34d399" text-anchor="middle">🚀 CLOUD SANDBOX</text>
    </svg>`;
    await sharp(Buffer.from(svgOg)).png().toFile(path.join(publicDir, 'og-image.png'));
    console.log('Created og-image.png');

    console.log('All public assets successfully generated!');
  } catch (err) {
    console.error('Asset generation error:', err);
  }
}

generateAssets();
