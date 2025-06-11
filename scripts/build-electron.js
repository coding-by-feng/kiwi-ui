#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

// Get command line arguments
const args = process.argv.slice(2);
const platform = args[0]; // 'mac', 'win', 'all', or undefined for current platform

async function checkPrerequisites() {
    logStep('1', 'Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 16) {
        logError(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
        process.exit(1);
    }
    logSuccess(`Node.js version ${nodeVersion} is supported`);

    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
        logError('package.json not found. Please run this script from the project root.');
        process.exit(1);
    }
    logSuccess('package.json found');

    // Check if required Electron files exist
    const requiredFiles = [
        'public/electron.js',
        'public/preload.js'
    ];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            logError(`Required file ${file} not found`);
            process.exit(1);
        }
    }
    logSuccess('Required Electron files found');

    // Check if icons exist
    const iconFiles = ['public/icon.png'];
    const missingIcons = iconFiles.filter(file => !fs.existsSync(file));

    if (missingIcons.length > 0) {
        logWarning('Some icon files are missing:');
        missingIcons.forEach(file => logWarning(`  - ${file}`));
        logWarning('You can generate icons using: npm run generate-icons');
    } else {
        logSuccess('Icon files found');
    }
}

async function installDependencies() {
    logStep('2', 'Installing dependencies...');

    try {
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dependencies installed');
    } catch (error) {
        logError('Failed to install dependencies');
        process.exit(1);
    }
}

async function buildVueApp() {
    logStep('3', 'Building Vue application...');

    try {
        execSync('npm run build', { stdio: 'inherit' });
        logSuccess('Vue application built successfully');
    } catch (error) {
        logError('Failed to build Vue application');
        process.exit(1);
    }
}

async function buildElectronApp() {
    logStep('4', 'Building Electron application...');

    let buildCommand = 'npm run electron-pack';

    // Override build command based on platform
    if (platform === 'mac') {
        buildCommand = 'npm run dist-mac';
    } else if (platform === 'win') {
        buildCommand = 'npm run dist-win';
    } else if (platform === 'all') {
        buildCommand = 'npm run dist-all';
    }

    try {
        log(`Running: ${buildCommand}`, 'blue');
        execSync(buildCommand, { stdio: 'inherit' });
        logSuccess('Electron application built successfully');
    } catch (error) {
        logError('Failed to build Electron application');
        process.exit(1);
    }
}

async function showResults() {
    logStep('5', 'Build completed!');

    const distDir = 'dist_electron';
    if (fs.existsSync(distDir)) {
        log('\nBuild artifacts:', 'green');
        const files = fs.readdirSync(distDir);
        files.forEach(file => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024 / 1024).toFixed(2);
            log(`  ${file} (${size} MB)`, 'blue');
        });
    }

    log('\nNext steps:', 'yellow');
    log('  • Test the application on target platforms');
    log('  • Set up code signing for distribution');
    log('  • Configure auto-updater for production');
    log('  • Create installation guides for users\n');
}

async function main() {
    try {
        log('🚀 Building Kiwi Vocabulary Desktop App\n', 'magenta');

        if (platform) {
            log(`Building for platform: ${platform}\n`, 'blue');
        }

        await checkPrerequisites();
        await installDependencies();
        await buildVueApp();
        await buildElectronApp();
        await showResults();

        logSuccess('Build process completed successfully! 🎉');

    } catch (error) {
        logError(`Build failed: ${error.message}`);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logError(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

main();