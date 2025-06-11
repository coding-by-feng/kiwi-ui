const sharp = require('sharp');
const ico = require('sharp-ico');
const path = require('path');
const fs = require('fs');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Base icon path (you need to provide a high-resolution PNG, preferably 1024x1024)
const baseIconPath = path.join(iconsDir, 'icon-base.png');

// Check if base icon exists
if (!fs.existsSync(baseIconPath)) {
    console.error('Please create a base icon file at:', baseIconPath);
    console.error('The file should be a high-resolution PNG (1024x1024 recommended)');
    process.exit(1);
}

async function generateIcons() {
    try {
        // Generate PNG icon (512x512)
        await sharp(baseIconPath)
            .resize(512, 512)
            .png()
            .toFile(path.join(iconsDir, 'icon.png'));

        console.log('✓ Generated icon.png');

        // Generate ICO for Windows (multiple sizes in one file)
        const icoSizes = [16, 32, 48, 256];
        const icoBuffers = [];

        for (const size of icoSizes) {
            const buffer = await sharp(baseIconPath)
                .resize(size, size)
                .png()
                .toBuffer();
            icoBuffers.push(buffer);
        }

        // Create ICO file
        const icoBuffer = ico.encode(icoBuffers);
        fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

        console.log('✓ Generated icon.ico');

        // For ICNS (macOS), we need to use a different approach
        // This creates the individual PNG files that can be converted to ICNS
        const icnsSizes = [16, 32, 64, 128, 256, 512, 1024];
        const icnsDir = path.join(iconsDir, 'icns-temp');

        if (!fs.existsSync(icnsDir)) {
            fs.mkdirSync(icnsDir);
        }

        for (const size of icnsSizes) {
            await sharp(baseIconPath)
                .resize(size, size)
                .png()
                .toFile(path.join(icnsDir, `icon_${size}x${size}.png`));
        }

        console.log('✓ Generated PNG files for ICNS conversion');
        console.log('  To create icon.icns on macOS, run:');
        console.log(`  iconutil -c icns ${icnsDir} -o ${path.join(iconsDir, 'icon.icns')}`);
        console.log('  Or use an online converter like CloudConvert');

        // Alternative: Generate a simple PNG for macOS if iconutil is not available
        await sharp(baseIconPath)
            .resize(512, 512)
            .png()
            .toFile(path.join(iconsDir, 'icon.icns.png'));

        console.log('✓ Generated icon.icns.png (rename to icon.icns if needed)');

    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

// Install required dependencies if not present
const requiredPackages = ['sharp', 'sharp-ico'];
const missingPackages = [];

for (const pkg of requiredPackages) {
    try {
        require.resolve(pkg);
    } catch {
        missingPackages.push(pkg);
    }
}

if (missingPackages.length > 0) {
    console.log('Installing required packages:', missingPackages.join(', '));
    const { execSync } = require('child_process');
    execSync(`npm install ${missingPackages.join(' ')}`, { stdio: 'inherit' });
}

generateIcons();