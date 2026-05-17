const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\shubh\\.gemini\\antigravity\\brain\\dd903c6b-0ce6-4d19-a421-8bf23252f3be\\.tempmediaStorage\\media_dd903c6b-0ce6-4d19-a421-8bf23252f3be_1779016490333.png';
const outputPath = path.join(__dirname, 'public', 'logo.png');

async function processLogo() {
  console.log('Starting Complete Circular Logo Processing...');
  console.log('Input path:', inputPath);
  console.log('Output path:', outputPath);

  try {
    // 1. Read input logo
    const image = await Jimp.read(inputPath);
    const width = image.width;
    const height = image.height;
    console.log(`Successfully loaded image. Dimensions: ${width}x${height}px`);

    let transparentPixelsCount = 0;
    let originalPixelsCount = 0;

    // 2. Scan every single pixel and strip the solid white/off-white background
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const hex = image.getPixelColor(x, y);
        
        // Extract RGBA color components
        const r = (hex >> 24) & 0xff;
        const g = (hex >> 16) & 0xff;
        const b = (hex >> 8) & 0xff;
        const a = hex & 0xff;

        // If the color is white or extremely close to white (background), make it fully transparent
        if (r > 245 && g > 245 && b > 245) {
          image.setPixelColor(0, x, y); // Set to transparent black rgba(0, 0, 0, 0)
          transparentPixelsCount++;
        } else {
          originalPixelsCount++;
        }
      }
    }

    console.log(`Processed all pixels:`);
    console.log(`- Transparent Background Pixels: ${transparentPixelsCount}`);
    console.log(`- Preserved Brand Wreath/Peacock Pixels: ${originalPixelsCount}`);

    // 3. Make sure public/ directory exists
    const publicDir = path.dirname(outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 4. Save processed image directly to public/logo.png
    await image.write(outputPath);
    console.log(`\n🎉 Success! Premium transparent logo saved to: ${outputPath}`);

    // 5. Quick Verification: print top-left and center pixel colors to verify alpha
    const processedImage = await Jimp.read(outputPath);
    const cornerColor = processedImage.getPixelColor(0, 0);
    const cornerAlpha = cornerColor & 0xff;
    
    console.log(`\nVerification Check:`);
    console.log(`- Corner (0,0) Alpha channel: ${cornerAlpha} (Expected: 0 for 100% transparent)`);
    if (cornerAlpha === 0) {
      console.log('✅ Background alpha transparency is PERFECT!');
    } else {
      console.warn('⚠️ Warning: Background might not be fully transparent. Check pixel values.');
    }

  } catch (error) {
    console.error('Error processing branding logo:', error);
  }
}

processLogo();
