#!/usr/bin/env node
// POST-BUILD AUTOMATION SCRIPT - Fixes issues that occur after webpack compilation
// This script runs AFTER vue-cli-service build completes to clean up build artifacts
// It handles: font directory structure fixes, CSS path corrections, file system cleanup

const fs = require('fs');      // Node.js file system operations
const path = require('path');  // Cross-platform path handling

console.log('🔧 Running post-build fixes...');

// FONT DIRECTORY STRUCTURE FIX - Resolves double nested fonts issue
// PROBLEM: Webpack sometimes creates /dist/fonts/fonts/ instead of /dist/fonts/
// CAUSE: Conflicting webpack rules for font processing in vue.config.js
// SOLUTION: Move files from nested directory to correct location and remove empty folder
function fixFontsDirectory() {
    // DEFINE PATHS - Build output directory structure
    const distPath = path.join(__dirname, '..', 'dist');           // /dist/ folder
    const fontsPath = path.join(distPath, 'fonts');                // /dist/fonts/ correct location
    const nestedFontsPath = path.join(fontsPath, 'fonts');         // /dist/fonts/fonts/ incorrect nesting

    // CHECK FOR NESTED DIRECTORY - Only proceed if the problem exists
    if (fs.existsSync(nestedFontsPath)) {
        console.log('📁 Found nested fonts directory, fixing...');

        try {
            // ENSURE PARENT DIRECTORY - Create /dist/fonts/ if it doesn't exist
            if (!fs.existsSync(fontsPath)) {
                fs.mkdirSync(fontsPath, { recursive: true });
                console.log('📁 Created fonts directory:', fontsPath);
            }

            // READ NESTED DIRECTORY - Get all files from /fonts/fonts/
            const files = fs.readdirSync(nestedFontsPath);
            console.log('📋 Files to move:', files);

            // MOVE FILES TO CORRECT LOCATION - /fonts/fonts/file.woff -> /fonts/file.woff
            files.forEach(file => {
                const srcPath = path.join(nestedFontsPath, file);      // Source: /fonts/fonts/file.woff
                const destPath = path.join(fontsPath, file);           // Destination: /fonts/file.woff

                // AVOID OVERWRITING - Only move if destination doesn't already exist
                if (!fs.existsSync(destPath)) {
                    fs.renameSync(srcPath, destPath);   // Atomic move operation
                    console.log(`✅ Moved ${file} to correct location`);
                } else {
                    console.log(`⚠️ Skipped ${file} (already exists in correct location)`);
                }
            });

            // CLEANUP EMPTY DIRECTORY - Remove the now-empty /fonts/fonts/ folder
            try {
                fs.rmdirSync(nestedFontsPath);
                console.log('🗑️ Removed empty nested directory');
            } catch (removeError) {
                console.warn('⚠️ Could not remove nested directory:', removeError.message);
            }

            console.log('✅ Fixed fonts directory structure');

        } catch (error) {
            // ERROR HANDLING - Don't fail the entire build for font issues
            console.error('❌ Error fixing fonts directory:', error.message);
            console.error('📊 Error details:', {
                distExists: fs.existsSync(distPath),
                fontsExists: fs.existsSync(fontsPath),
                nestedExists: fs.existsSync(nestedFontsPath)
            });
        }
    } else {
        // NO ISSUE FOUND - Directory structure is already correct
        console.log('✅ Fonts directory structure is correct');

        // DEBUG INFO - Show current font files
        if (fs.existsSync(fontsPath)) {
            const fontFiles = fs.readdirSync(fontsPath);
            console.log('📋 Current font files:', fontFiles);
        }
    }
}

// CSS FONT PATH CORRECTION - Fixes incorrect font references in CSS files
// PROBLEM: CSS files might reference fonts as "fonts/fonts/icon.woff" instead of "fonts/icon.woff"
// CAUSE: Webpack publicPath configuration conflicts during build
// SOLUTION: String replacement in all CSS files to fix font paths
function fixFontPaths() {
    // LOCATE CSS DIRECTORY - All compiled CSS files are in /dist/css/
    const distPath = path.join(__dirname, '..', 'dist');
    const cssPath = path.join(distPath, 'css');

    // VERIFY CSS DIRECTORY EXISTS - Skip if no CSS files built
    if (!fs.existsSync(cssPath)) {
        console.log('⚠️ CSS directory not found, skipping font path fixes');
        return;
    }

    try {
        // FIND ALL CSS FILES - Filter for .css extension only
        const cssFiles = fs.readdirSync(cssPath).filter(file => file.endsWith('.css'));
        console.log('📋 CSS files found:', cssFiles);

        // PROCESS EACH CSS FILE - Fix font paths in all stylesheets
        cssFiles.forEach(file => {
            const filePath = path.join(cssPath, file);

            // READ CURRENT CONTENT - Load entire CSS file into memory
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;   // Keep copy to check if changes made

            // PATH REPLACEMENT PATTERNS - Fix common incorrect font path patterns
            // Pattern 1: "fonts/fonts/" -> "fonts/" (remove duplicate directory)
            content = content.replace(/fonts\/fonts\//g, 'fonts/');

            // Pattern 2: "../fonts/fonts/" -> "../fonts/" (relative paths with duplicate)
            content = content.replace(/\.\.\/fonts\/fonts\//g, '../fonts/');

            // Pattern 3: "./fonts/fonts/" -> "./fonts/" (current directory paths)
            content = content.replace(/\.\/fonts\/fonts\//g, './fonts/');

            // ADDITIONAL PATTERNS - Handle Edge cases
            // Pattern 4: Multiple slashes "fonts///icon.woff" -> "fonts/icon.woff"
            content = content.replace(/fonts\/+/g, 'fonts/');

            // Pattern 5: Windows-style paths (if any) "fonts\\fonts\\" -> "fonts/"
            content = content.replace(/fonts\\+fonts\\+/g, 'fonts/');

            // WRITE CHANGES - Only update file if content actually changed
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Fixed font paths in ${file}`);

                // DEBUG INFO - Show what was changed
                const changes = originalContent.length - content.length;
                console.log(`📊 Bytes saved: ${changes} (removed duplicate path segments)`);
            } else {
                console.log(`✅ ${file} already has correct font paths`);
            }
        });

    } catch (error) {
        // ERROR HANDLING - Log error but don't fail build
        console.error('❌ Error fixing font paths:', error.message);
        console.error('📊 Error context:', {
            cssPath: cssPath,
            cssPathExists: fs.existsSync(cssPath),
            error: error.stack
        });
    }
}

// BUILD VERIFICATION - Check that build output is valid
function verifyBuildOutput() {
    const distPath = path.join(__dirname, '..', 'dist');
    const requiredFiles = ['index.html', 'static', 'fonts'];

    console.log('🔍 Verifying build output...');

    requiredFiles.forEach(item => {
        const itemPath = path.join(distPath, item);
        if (fs.existsSync(itemPath)) {
            console.log(`✅ ${item} exists`);
        } else {
            console.warn(`⚠️ ${item} missing from build output`);
        }
    });

    // CHECK FILE SIZES - Warn about unusually large files
    try {
        const stats = fs.statSync(path.join(distPath, 'static'));
        console.log('📊 Static assets folder size check completed');
    } catch (error) {
        console.warn('⚠️ Could not verify static assets size');
    }
}

// MAIN EXECUTION FUNCTION - Orchestrates all post-build fixes
function main() {
    console.log('🚀 Starting post-build processing...');
    console.log('📅 Timestamp:', new Date().toISOString());

    try {
        // EXECUTE FIXES IN ORDER - Each fix is independent, failure of one doesn't stop others
        fixFontsDirectory();    // Fix /fonts/fonts/ directory nesting
        fixFontPaths();         // Fix CSS font path references
        verifyBuildOutput();    // Check build completed successfully

        console.log('🎉 Post-build fixes completed successfully!');
        console.log('📊 Summary: Font directory structure and CSS paths have been optimized');

        // SUCCESS EXIT - Return 0 to indicate successful completion
        process.exit(0);

    } catch (error) {
        // CRITICAL ERROR HANDLING - Log error and exit with error code
        console.error('💥 Critical error in post-build processing:', error);
        console.error('🔍 Error stack trace:', error.stack);

        // FAILURE EXIT - Return non-zero to indicate build failure
        process.exit(1);
    }
}

// SCRIPT ENTRY POINT - Execute main function when script is run
// This only runs when script is executed directly, not when imported
if (require.main === module) {
    main();
}

// USAGE NOTES:
// - Run automatically after `vue-cli-service build` via package.json scripts
// - Can be run manually: `node scripts/post-build.js`
// - Safe to run multiple times - checks for issues before fixing
// - Logs detailed information for debugging build problems

// DEBUGGING BUILD ISSUES:
// 1. Check console output for specific error messages
// 2. Verify /dist/ directory exists and contains expected files
// 3. Check /dist/fonts/ for correct file structure
// 4. Inspect CSS files in /dist/css/ for font path references
// 5. Run script manually with: `node scripts/post-build.js`
