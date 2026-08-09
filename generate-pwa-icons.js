import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = './public/icons';

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...\n');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#16a34a');
  gradient.addColorStop(1, '#15803d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Shield icon
  ctx.fillStyle = 'white';
  ctx.beginPath();
  const centerX = size / 2;
  const centerY = size / 2;
  const shieldSize = size * 0.6;
  
  // Draw shield shape
  ctx.moveTo(centerX, centerY - shieldSize/2);
  ctx.lineTo(centerX + shieldSize/2, centerY - shieldSize/4);
  ctx.lineTo(centerX + shieldSize/2, centerY + shieldSize/4);
  ctx.lineTo(centerX, centerY + shieldSize/2);
  ctx.lineTo(centerX - shieldSize/2, centerY + shieldSize/4);
  ctx.lineTo(centerX - shieldSize/2, centerY - shieldSize/4);
  ctx.closePath();
  ctx.fill();

  // Add text "BORS"
  ctx.fillStyle = '#16a34a';
  ctx.font = `bold ${size * 0.15}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BORS', centerX, centerY);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Generated: ${filename}`);
});

console.log('\n🎉 All PWA icons generated successfully!');
console.log(`📁 Icons saved to: ${iconsDir}`);
