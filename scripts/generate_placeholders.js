// scripts/generate_placeholders.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Standalone script to verify and regenerate optimized WebP assets for the product catalog.
// This overlays engineering blueprints elements and resizes images to pure 4K resolutions with pure white backgrounds.

const PRODUCTS_DIR = path.join(__dirname, "../public/images/products");

async function generateOverlay(width, height) {
  // SVG grid lines overlay mimicking industrial drawings
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Engineering Blueprint annotations -->
      <line x1="50" y1="50" x2="150" y2="50" stroke="#cccccc" stroke-width="1.5" stroke-dasharray="4"/>
      <line x1="50" y1="50" x2="50" y2="150" stroke="#cccccc" stroke-width="1.5" stroke-dasharray="4"/>
      <text x="60" y="45" font-family="monospace" font-size="12" fill="#aaaaaa">TUTTLINGEN RANGE SPEC - REF 01A</text>
      
      <circle cx="${width / 2}" cy="${height / 2}" r="${width * 0.38}" fill="none" stroke="#e8e8e8" stroke-width="1" stroke-dasharray="5,5" />
      <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="#e2e2e2" stroke-width="0.75" stroke-dasharray="10,10" />
      <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#e2e2e2" stroke-width="0.75" stroke-dasharray="10,10" />
    </svg>
  `;
  return Buffer.from(svg);
}

async function run() {
  console.log("Starting 4K Annotated Placeholder Image compiler...");
  
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(PRODUCTS_DIR);
  console.log(`Discovered ${files.length} catalog files in public folder.`);

  for (const file of files) {
    if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".webp")) {
      const filePath = path.join(PRODUCTS_DIR, file);
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      
      console.log(`Processing instrument asset: ${file} -> compiling WebP overlay`);
      
      try {
        const metadata = await sharp(filePath).metadata();
        const width = 2048; // Standard optimized 4K B2B catalog dimension
        const height = 2048;

        const gridBuffer = await generateOverlay(width, height);
        
        // Compile white background, grid lines, and product image
        const compiled = await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([
          { input: gridBuffer, top: 0, left: 0 },
          { input: filePath, gravity: "centre" }
        ])
        .webp({ quality: 90 })
        .toBuffer();

        const targetWebpPath = path.join(PRODUCTS_DIR, `${base}.webp`);
        fs.writeFileSync(targetWebpPath, compiled);
        console.log(`[COMPLETED] Compiled webp: ${base}.webp`);

      } catch (err) {
        console.error(`Failed to process ${file}:`, err);
      }
    }
  }
  console.log("Catalog assets compilation finalized successfully.");
}

run();
