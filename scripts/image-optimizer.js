#!/usr/bin/env node

/**
 * Image optimization utilities
 * Provides fallback optimization methods when advanced tools aren't available
 */

const fs = require('fs');
const path = require('path');

/**
 * Basic PNG optimization using built-in Node.js capabilities
 */
function optimizePngBasic(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);

  // Simple PNG optimization by removing metadata chunks
  // This is a basic implementation - for better results use sharp/imagemin

  let optimized = Buffer.from(data);

  // PNG signature check
  if (optimized.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Not a valid PNG file');
  }

  // Remove common metadata chunks that can be safely removed
  const chunksToRemove = ['tEXt', 'zTXt', 'iTXt', 'tIME', 'pHYs'];

  let result = optimized.subarray(0, 8); // Keep PNG signature
  let pos = 8;

  while (pos < optimized.length - 8) {
    const length = optimized.readUInt32BE(pos);
    const type = optimized.subarray(pos + 4, pos + 8).toString('ascii');
    const chunkEnd = pos + 12 + length;

    if (chunkEnd > optimized.length) break;

    // Keep essential chunks, remove metadata
    if (!chunksToRemove.includes(type)) {
      result = Buffer.concat([result, optimized.subarray(pos, chunkEnd)]);
    }

    pos = chunkEnd;
  }

  fs.writeFileSync(outputPath, result);

  const originalSize = data.length;
  const newSize = result.length;
  const savings = ((originalSize - newSize) / originalSize * 100);

  return {
    originalSize,
    newSize,
    savings: Math.max(0, savings)
  };
}

/**
 * Try multiple optimization strategies
 */
function optimizeImageFallback(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();

  try {
    if (ext === '.png') {
      return optimizePngBasic(inputPath, outputPath);
    } else {
      // For other formats, just copy
      if (inputPath !== outputPath) {
        fs.copyFileSync(inputPath, outputPath);
      }
      const size = fs.statSync(outputPath).size;
      return {
        originalSize: size,
        newSize: size,
        savings: 0
      };
    }
  } catch (error) {
    console.warn(`Basic optimization failed: ${error.message}`);
    // Fallback to copy
    if (inputPath !== outputPath) {
      fs.copyFileSync(inputPath, outputPath);
    }
    const size = fs.statSync(outputPath).size;
    return {
      originalSize: size,
      newSize: size,
      savings: 0
    };
  }
}

/**
 * Install optimization dependencies if needed
 */
function checkAndInstallOptimizers() {
  const { execSync } = require('child_process');

  console.log('🔍 Checking for image optimization tools...');

  const tools = [
    { name: 'sharp', install: 'npm install --save-dev sharp' },
    { name: 'imagemin', install: 'npm install --save-dev imagemin imagemin-pngquant imagemin-mozjpeg' }
  ];

  let hasOptimizer = false;

  for (const tool of tools) {
    try {
      execSync(`npm list ${tool.name} --depth=0`, { stdio: 'ignore' });
      console.log(`✅ Found: ${tool.name}`);
      hasOptimizer = true;
      break;
    } catch (e) {
      console.log(`❌ Missing: ${tool.name}`);
    }
  }

  if (!hasOptimizer) {
    console.log('\n📦 Installing sharp for better image optimization...');
    try {
      execSync('npm install --save-dev sharp', { stdio: 'inherit' });
      console.log('✅ Sharp installed successfully!');
      return true;
    } catch (error) {
      console.warn('⚠️  Failed to install sharp, will use basic optimization');
      return false;
    }
  }

  return hasOptimizer;
}

module.exports = {
  optimizePngBasic,
  optimizeImageFallback,
  checkAndInstallOptimizers
};
