#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');
const sizes = [16, 48, 128];

fs.ensureDirSync(iconsDir);

async function generateIcon(size) {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  
  const margin = size * 0.15;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - margin;
  const stroke = size * 0.11;
  const red = "#FF0000";
  
  const fontSize = size * 0.35;
  
  // Arc from ~45° to ~315° (clockwise), leaving a gap for the arrow head
  const startDeg = 45;
  const endDeg = 315;
  
  const toRad = (d) => (d * Math.PI) / 180;
  const x = (deg) => cx + r * Math.cos(toRad(deg));
  const y = (deg) => cy + r * Math.sin(toRad(deg));
  
  const sx = x(startDeg);
  const sy = y(startDeg);
  const ex = x(endDeg);
  const ey = y(endDeg);
  
  // Tangent direction at end point for arrowhead
  // For a circle, tangent is perpendicular to radius; clockwise tangent at end is +90°
  const tx = -Math.sin(toRad(endDeg));
  const ty = Math.cos(toRad(endDeg));
  
  // Arrowhead geometry
  const headLen = size * 0.15;
  const headWidth = size * 0.18;
  const nx = -ty;  // normal to tangent
  const ny = tx;
  
  const tipX = ex + tx * headLen;
  const tipY = ey + ty * headLen;
  
  const leftX = ex + nx * (headWidth / 2);
  const leftY = ey + ny * (headWidth / 2);
  const rightX = ex - nx * (headWidth / 2);
  const rightY = ey - ny * (headWidth / 2);
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFFFFF" rx="${size * 0.2}"/>
      <path 
        d="M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" 
        fill="none" 
        stroke="${red}" 
        stroke-width="${stroke.toFixed(2)}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      />
      <polygon 
        points="${tipX.toFixed(2)},${tipY.toFixed(2)} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}" 
        fill="${red}"
      />
      <text 
        x="${cx}" 
        y="${cy + fontSize * 0.3}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="${red}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      ></text>
    </svg>
  `.trim();

  await sharp(Buffer.from(svg))
    .png()
    .toFile(iconPath);

  console.log(`✓ Generated icon${size}.png (${size}x${size})`);
}

async function generateIcons() {
  console.log('Generating icons...');
  
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);

