#!/usr/bin/env node

import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize with default credentials (uses Firebase CLI auth)
const app = admin.initializeApp({
  projectId: 'aurora-system-b3203'
});

const db = app.firestore();

// Helper functions
function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

function generateSKU(name) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `AS-AS-${cleanName}`;
}

async function seedProducts() {
  try {
    // Read products database
    const dbPath = path.join(__dirname, 'src/data/products-database.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const products = data.products || [];

    console.log(`🌱 Seeding ${products.length} products to Firestore...`);

    // Batch write (max 500 per batch)
    const batch = db.batch();
    let count = 0;

    for (const product of products) {
      const productId = `prod-${uuid()}`;
      const productData = {
        id: productId,
        name: product.name,
        sku: generateSKU(product.name),
        type: 'Full Bottle',
        category: product.gender || 'Unisex',
        costPrice: 78000,
        wholesalePrice: 120000,
        sellingPrice: 150000,
        minStockThreshold: 10,
        createdAt: new Date().toISOString(),
        notes: product.notes || ''
      };

      batch.set(db.collection('products').doc(productId), productData);
      count++;

      // Commit every 500 docs (Firestore batch limit)
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  ✓ Committed ${count} products`);
      }
    }

    // Commit remaining
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`✅ Successfully seeded ${count} products to Firestore!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    process.exit(1);
  }
}

seedProducts();
