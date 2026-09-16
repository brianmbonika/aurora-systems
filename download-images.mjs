/**
 * download-images.mjs
 * Downloads all product images from products-database.json to public/images/products/
 * and updates the JSON file with local relative paths.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.join(__dirname, 'src/data/products-database.json');
const OUTPUT_DIR = path.join(__dirname, 'public/images/products');

// Create output directory if it doesn't exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sanitizeFilename(url) {
  // Extract filename from URL, strip query params
  const urlObj = new URL(url);
  let filename = path.basename(urlObj.pathname);
  // Remove unsafe characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Ensure it has an extension
  if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    filename += '.jpg';
  }
  return filename;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    const request = protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; image-downloader/1.0)' },
      timeout: 15000
    }, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const products = db.products;
  
  console.log(`\n📦 Downloading images for ${products.length} products...\n`);
  
  const results = { success: [], failed: [] };
  // Track used filenames to avoid collisions
  const usedFilenames = new Map();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const url = product.imageUrl;
    
    if (!url || url.startsWith('/images/')) {
      console.log(`  ⏭️  [${i+1}/${products.length}] Already local: ${product.name}`);
      continue;
    }
    
    let filename = sanitizeFilename(url);
    
    // Handle filename collisions — append index if same filename used by different products
    if (usedFilenames.has(filename) && usedFilenames.get(filename) !== url) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      filename = `${base}_${i}${ext}`;
    }
    usedFilenames.set(filename, url);
    
    const destPath = path.join(OUTPUT_DIR, filename);
    const localUrl = `/images/products/${filename}`;
    
    // Skip download if file already exists and is not empty
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      console.log(`  ✅ [${i+1}/${products.length}] Cached: ${filename}`);
      product.imageUrl = localUrl;
      results.success.push(product.name);
      continue;
    }
    
    try {
      process.stdout.write(`  ⬇️  [${i+1}/${products.length}] ${product.name.slice(0, 50)}...`);
      await downloadFile(url, destPath);
      const sizeKb = Math.round(fs.statSync(destPath).size / 1024);
      console.log(` ✅ ${filename} (${sizeKb}KB)`);
      product.imageUrl = localUrl;
      results.success.push(product.name);
    } catch (err) {
      console.log(` ❌ FAILED: ${err.message}`);
      results.failed.push({ name: product.name, url, error: err.message });
      // Keep original URL as fallback for failed downloads
    }
    
    // Small delay to be polite to the CDN
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Save updated database
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n✅ Updated: src/data/products-database.json`);
  
  console.log(`\n📊 Results:`);
  console.log(`  ✅ Downloaded: ${results.success.length}`);
  console.log(`  ❌ Failed:     ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log(`\n⚠️  Failed downloads:`);
    results.failed.forEach(f => console.log(`     - ${f.name}: ${f.error}`));
  }
  
  console.log(`\n🎉 Done! Images saved to: public/images/products/`);
}

main().catch(console.error);
