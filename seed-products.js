import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./src/firebase-key.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aurora-system-b3203'
});

const db = admin.firestore();

// Helper to generate unique ID
function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

// Helper to generate SKU
function generateSKU(name) {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `AS-AS-${cleanName}`;
}

async function seedProducts() {
  try {
    // Read products database
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.join(__dirname, 'src/data/products-database.json');

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const products = data.products || [];

    console.log(`🌱 Seeding ${products.length} products to Firestore...`);

    let count = 0;
    for (const product of products) {
      const productId = `prod-${uuid()}`;
      const productData = {
        id: productId,
        name: product.name,
        sku: generateSKU(product.name),
        type: 'Full Bottle', // Default type
        category: product.gender || 'Unisex',
        costPrice: 78000, // Default cost (can be customized)
        wholesalePrice: 120000, // Wholesale markup
        sellingPrice: 150000, // Retail price
        minStockThreshold: 10,
        createdAt: new Date().toISOString(),
        notes: product.notes || ''
      };

      await db.collection('products').doc(productId).set(productData);
      count++;

      if (count % 10 === 0) {
        console.log(`  ✓ Seeded ${count}/${products.length} products...`);
      }
    }

    console.log(`✅ Successfully seeded ${count} products to Firestore!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
