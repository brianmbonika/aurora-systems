#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'aurora-system-b3203' });
const db = getFirestore(app);

async function removeDuplicates() {
  console.log('🔍 Fetching all products from Firestore...');

  const snap = await db.collection('products').get();
  const allProducts = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
  console.log(`  Found ${allProducts.length} total product documents.`);

  // Group by name (case-insensitive)
  const groups = {};
  for (const p of allProducts) {
    const key = (p.name || '').trim().toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  // Find groups with more than 1 entry (duplicates)
  const duplicateGroups = Object.entries(groups).filter(([, g]) => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicates found! Database is clean.');
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${duplicateGroups.length} duplicate product name(s):`);

  // Fetch all transactions to know which product IDs have history
  const txSnap = await db.collection('transactions').get();
  const txCounts = {};
  txSnap.docs.forEach(d => {
    const pid = d.data().productId;
    if (pid) txCounts[pid] = (txCounts[pid] || 0) + 1;
  });

  const batch = db.batch();
  let deleteCount = 0;

  for (const [name, group] of duplicateGroups) {
    // Sort: keep the one with most transactions, then oldest id as tiebreaker
    group.sort((a, b) => (txCounts[b.id] || 0) - (txCounts[a.id] || 0));
    const [keep, ...remove] = group;

    console.log(`\n  📦 "${keep.name}" (${group.length} copies)`);
    console.log(`     ✅ Keeping:  id=${keep.id}  (${txCounts[keep.id] || 0} transactions)`);
    for (const dup of remove) {
      console.log(`     🗑️  Deleting: id=${dup.id}  (${txCounts[dup.id] || 0} transactions)`);
      batch.delete(db.collection('products').doc(dup.docId));
      deleteCount++;
    }
  }

  if (deleteCount === 0) {
    console.log('\n✅ Nothing to delete.');
    process.exit(0);
  }

  console.log(`\n🚀 Deleting ${deleteCount} duplicate product(s)...`);
  await batch.commit();
  console.log(`✅ Done! Removed ${deleteCount} duplicate(s). Your product catalog is now clean.`);
  process.exit(0);
}

removeDuplicates().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
