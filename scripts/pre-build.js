#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 Starting pre-build optimization...');

// Ensure external assets directory exists
const externalDir = path.join(__dirname, '..', 'public', 'assets', 'external');
if (!fs.existsSync(externalDir)) {
    fs.mkdirSync(externalDir, { recursive: true });
    console.log('✅ Created external assets directory');
}

// Download latest YouTube iframe API
function downloadYouTubeAPI() {
    return new Promise((resolve, reject) => {
        console.log('📥 Downloading latest YouTube iframe API...');
        const apiUrl = 'https://www.youtube.com/iframe_api';
        const apiPath = path.join(externalDir, 'youtube-iframe-api.js');

        const file = fs.createWriteStream(apiPath);

        https.get(apiUrl, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('✅ YouTube iframe API downloaded successfully');
                    resolve();
                });
            } else {
                console.log('⚠️ Using cached YouTube API (download failed)');
                resolve();
            }
        }).on('error', (err) => {
            fs.unlink(apiPath, () => {}); // Delete incomplete file
            console.log('⚠️ Using cached YouTube API (network error)');
            resolve(); // Don't fail build for API download
        });
    });
}

// Optimize webchat.png using basic Node.js (no sharp dependency)
function optimizeWebchatImage() {
    return new Promise((resolve) => {
        console.log('🖼️ Checking webchat.png...');
        const imagePath = path.join(__dirname, '..', 'public', 'wechat.png');

        if (!fs.existsSync(imagePath)) {
            console.log('⚠️ wechat.png not found, skipping optimization');
            resolve();
            return;
        }

        const stats = fs.statSync(imagePath);
        console.log(`📊 Current wechat.png size: ${Math.round(stats.size / 1024)}KB`);

        // If file is larger than 100KB, warn user
        if (stats.size > 100 * 1024) {
            console.log('⚠️ wechat.png is large (>100KB). Consider optimizing manually.');
        } else {
            console.log('✅ wechat.png size is acceptable');
        }

        resolve();
    });
}

// Fix fonts directory structure (run after build)
function fixFontsDirectoryStructure() {
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) return;

    const fontsPath = path.join(distPath, 'fonts');
    const nestedFontsPath = path.join(fontsPath, 'fonts');

    if (fs.existsSync(nestedFontsPath)) {
        console.log('🔧 Fixing nested fonts directory...');

        try {
            const files = fs.readdirSync(nestedFontsPath);

            // Move files from nested directory
            files.forEach(file => {
                const srcPath = path.join(nestedFontsPath, file);
                const destPath = path.join(fontsPath, file);

                if (!fs.existsSync(destPath)) {
                    fs.renameSync(srcPath, destPath);
                }
            });

            // Remove empty nested directory
            fs.rmdirSync(nestedFontsPath);
            console.log('✅ Fixed fonts directory structure');
        } catch (error) {
            console.warn('⚠️ Could not fix fonts directory:', error.message);
        }
    }
}

// Main execution
async function main() {
    try {
        await Promise.all([
            downloadYouTubeAPI(),
            optimizeWebchatImage()
        ]);

        // Set up post-build font fix
        if (process.env.NODE_ENV === 'production') {
            // Schedule font directory fix for after build
            process.on('exit', fixFontsDirectoryStructure);
        }

        console.log('🎉 Pre-build optimization completed successfully!');
    } catch (error) {
        console.error('❌ Pre-build optimization failed:', error.message);
        // Don't fail the build for optimization issues
        process.exit(0);
    }
}

main();
