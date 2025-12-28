#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const browser = process.argv[2]; // 'chrome' or 'firefox'

if (!browser || !['chrome', 'firefox'].includes(browser)) {
  console.error('Usage: node build.js <chrome|firefox>');
  process.exit(1);
}

const distDir = path.join(__dirname, '..', 'dist', browser);
const srcDir = path.join(__dirname, '..', 'src');
const iconsDir = path.join(__dirname, '..', 'icons');

// Generate icons if they don't exist
const requiredIcons = ['icon16.png', 'icon48.png', 'icon128.png'];
const missingIcons = requiredIcons.filter(icon => !fs.existsSync(path.join(iconsDir, icon)));

if (missingIcons.length > 0) {
  console.log('Generating missing icons...');
  try {
    execSync('node scripts/generate-icons.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Could not generate icons. Make sure sharp is installed: npm install');
  }
}

// Clean and create dist directory
fs.emptyDirSync(distDir);

// Copy manifest
const manifestFile = browser === 'chrome' ? 'manifest.chrome.json' : 'manifest.firefox.json';
fs.copyFileSync(
  path.join(__dirname, '..', manifestFile),
  path.join(distDir, 'manifest.json')
);

// Copy content script
fs.copyFileSync(
  path.join(__dirname, '..', 'content.js'),
  path.join(distDir, 'content.js')
);

// Copy icons
if (fs.existsSync(iconsDir)) {
  fs.copySync(iconsDir, path.join(distDir, 'icons'));
} else {
  console.warn('Warning: icons directory not found. Icons will be missing in the extension.');
}

console.log(`✓ Built ${browser} extension in ${distDir}`);

