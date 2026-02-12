#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icons/icon-192x192.svg');
  
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    const outputPath = path.join(__dirname, `../public/icons/icon-${size}x${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('Icon generation complete!');
}

// Check if sharp is installed
try {
  require('sharp');
  generateIcons();
} catch (error) {
  console.log('Installing sharp for image processing...');
  const { execSync } = require('child_process');
  execSync('bun add sharp', { stdio: 'inherit' });
  generateIcons();
}