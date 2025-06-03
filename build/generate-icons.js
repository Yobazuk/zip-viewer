const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

// Ensure build directory exists
if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
}

// Generate app icon
const appIconSvg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#4a9eff"/>
    <path d="M78 64C78 57.3726 83.3726 52 90 52H166C172.627 52 178 57.3726 178 64V192C178 198.627 172.627 204 166 204H90C83.3726 204 78 198.627 78 192V64Z" fill="white"/>
    <rect x="98" y="72" width="60" height="12" rx="2" fill="#4a9eff"/>
    <rect x="98" y="96" width="60" height="12" rx="2" fill="#4a9eff"/>
    <rect x="98" y="120" width="60" height="12" rx="2" fill="#4a9eff"/>
    <path d="M98 146C98 144.895 98.8954 144 100 144H156C157.105 144 158 144.895 158 146V170C158 171.105 157.105 172 156 172H100C98.8954 172 98 171.105 98 170V146Z" fill="#4a9eff"/>
</svg>`;

// Generate file icon
const fileIconSvg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 32C48 25.3726 53.3726 20 60 20H156L208 72V224C208 230.627 202.627 236 196 236H60C53.3726 236 48 230.627 48 224V32Z" fill="#4a9eff"/>
    <path d="M156 20L208 72H156V20Z" fill="white" fill-opacity="0.4"/>
    <rect x="76" y="100" width="104" height="12" rx="2" fill="white"/>
    <rect x="76" y="124" width="104" height="12" rx="2" fill="white"/>
    <rect x="76" y="148" width="104" height="12" rx="2" fill="white"/>
</svg>`;

// Save SVGs
fs.writeFileSync('build/app-icon.svg', appIconSvg);
fs.writeFileSync('build/file-icon.svg', fileIconSvg);

// Convert to ICO
async function generateIco(svgPath, outputPath, sizes = [16, 24, 32, 48, 64, 128, 256]) {
    const pngBuffers = await Promise.all(
        sizes.map(size => 
            sharp(svgPath)
                .resize(size, size)
                .png()
                .toBuffer()
        )
    );

    // Convert PNGs to ICO
    const icoBuffer = await pngToIco(pngBuffers);
    fs.writeFileSync(outputPath, icoBuffer);
}

// Generate icons
async function main() {
    try {
        await generateIco('build/app-icon.svg', 'build/icon.ico');
        await generateIco('build/file-icon.svg', 'build/file-icon.ico');
        console.log('Icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

main(); 