#!/usr/bin/env node

/**
 * Pre-build script to download latest external resources and optimize images
 * This script runs before the Vue build process
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const EXTERNAL_ASSETS_DIR = path.join(__dirname, '../public/assets/external');
const PUBLIC_DIR = path.join(__dirname, '../public');

const RESOURCES = {
  youtubeApi: {
    url: 'https://www.youtube.com/iframe_api',
    filename: 'youtube-iframe-api.js',
    description: 'YouTube iframe API'
  }
};

// Utility functions
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const downloadFile = (url, filepath) => {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);

    const file = fs.createWriteStream(filepath);
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        console.log(`✅ Downloaded: ${path.basename(filepath)} (${(stats.size / 1024).toFixed(2)}KB)`);
        resolve(filepath);
      });

      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(filepath);
        reject(err);
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.abort();
      reject(new Error('Request timeout'));
    });
  });
};

const optimizeImage = (inputPath, outputPath = null) => {
  if (!outputPath) outputPath = inputPath;

  const originalSize = fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0;
  if (originalSize === 0) {
    console.log(`⚠️  Image not found: ${inputPath}`);
    return false;
  }

  console.log(`🖼️  Optimizing image: ${path.basename(inputPath)} (${(originalSize / 1024).toFixed(2)}KB)`);

  try {
    // Check if imagemin is available, if not use built-in optimization
    let optimized = false;

    // Try sharp first (best quality)
    try {
      execSync('npm list sharp --depth=0', { stdio: 'ignore' });
      const sharp = require('sharp');

      if (inputPath.endsWith('.png')) {
        sharp(inputPath)
          .png({ quality: 80, compressionLevel: 8 })
          .toFile(outputPath + '.tmp')
          .then(() => {
            fs.renameSync(outputPath + '.tmp', outputPath);
            optimized = true;
          });
      } else if (inputPath.endsWith('.jpg') || inputPath.endsWith('.jpeg')) {
        sharp(inputPath)
          .jpeg({ quality: 85, progressive: true })
          .toFile(outputPath + '.tmp')
          .then(() => {
            fs.renameSync(outputPath + '.tmp', outputPath);
            optimized = true;
          });
      }
    } catch (e) {
      // Sharp not available, try imagemin
      try {
        execSync('npm list imagemin --depth=0', { stdio: 'ignore' });
        // Use imagemin if available
        const command = `npx imagemin ${inputPath} --out-dir=${path.dirname(outputPath)} --plugin.pngquant --plugin.mozjpeg`;
        execSync(command, { stdio: 'ignore' });
        optimized = true;
      } catch (e2) {
        // Fallback: just copy the file
        if (inputPath !== outputPath) {
          fs.copyFileSync(inputPath, outputPath);
        }
        console.log(`ℹ️  No optimization tools available, using original image`);
      }
    }

    const newSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - newSize) / originalSize * 100);

    if (savings > 0) {
      console.log(`✅ Optimized: ${path.basename(outputPath)} - saved ${savings.toFixed(1)}% (${((originalSize - newSize) / 1024).toFixed(2)}KB)`);
    } else {
      console.log(`✅ Processed: ${path.basename(outputPath)} (${(newSize / 1024).toFixed(2)}KB)`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
};

const checkResourceFreshness = (filepath, maxAge = 24 * 60 * 60 * 1000) => {
  if (!fs.existsSync(filepath)) return false;

  const stats = fs.statSync(filepath);
  const now = new Date();
  const age = now - stats.mtime;

  return age < maxAge;
};

// Main execution
async function main() {
  console.log('🚀 Starting pre-build resource optimization...\n');

  // Ensure directories exist
  ensureDir(EXTERNAL_ASSETS_DIR);

  // Download external resources
  console.log('📦 Downloading external resources...');

  for (const [key, resource] of Object.entries(RESOURCES)) {
    const filepath = path.join(EXTERNAL_ASSETS_DIR, resource.filename);

    // Check if resource is fresh (less than 24 hours old)
    if (checkResourceFreshness(filepath)) {
      console.log(`✅ Using cached: ${resource.description} (fresh)`);
      continue;
    }

    try {
      await downloadFile(resource.url, filepath);

      // Add timestamp comment to JS files
      if (resource.filename.endsWith('.js')) {
        const content = fs.readFileSync(filepath, 'utf8');
        const timestampComment = `/* Downloaded on ${new Date().toISOString()} from ${resource.url} */\n`;
        fs.writeFileSync(filepath, timestampComment + content);
      }
    } catch (error) {
      console.error(`❌ Failed to download ${resource.description}:`, error.message);

      // Check if old version exists
      if (fs.existsSync(filepath)) {
        console.log(`ℹ️  Using existing cached version: ${resource.filename}`);
      } else {
        console.error(`💥 No fallback available for: ${resource.filename}`);
        process.exit(1);
      }
    }
  }

  // Optimize images
  console.log('\n🖼️  Optimizing images...');

  const imagesToOptimize = [
    { input: path.join(PUBLIC_DIR, 'wechat.png'), output: path.join(PUBLIC_DIR, 'wechat.png') },
    { input: path.join(PUBLIC_DIR, 'icon.png'), output: path.join(PUBLIC_DIR, 'icon.png') },
    { input: path.join(PUBLIC_DIR, 'favicon.ico'), output: path.join(PUBLIC_DIR, 'favicon.ico') }
  ];

  for (const image of imagesToOptimize) {
    optimizeImage(image.input, image.output);
  }

  // Optimize external images
  const externalImages = fs.readdirSync(EXTERNAL_ASSETS_DIR)
    .filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file))
    .map(file => path.join(EXTERNAL_ASSETS_DIR, file));

  for (const imagePath of externalImages) {
    optimizeImage(imagePath);
  }

  console.log('\n✨ Pre-build optimization completed!');
  console.log('📊 Summary:');
  console.log(`   - External resources: ${Object.keys(RESOURCES).length}`);
  console.log(`   - Images optimized: ${imagesToOptimize.length + externalImages.length}`);
  console.log('');
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { downloadFile, optimizeImage, checkResourceFreshness };
