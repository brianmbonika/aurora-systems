// Public, unauthenticated: called from /join.html (QR code on the printed catalogue).
// Writes a new CRM customer using the Admin SDK, bypassing Firestore's staff-only rules,
// same pattern as send-push.js. A filled honeypot field is treated as a bot: accepted
// silently, never written.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

function isValidPhone(phone) {
  const digitCount = (phone.match(/\d/g) || []).length;
  return digitCount >= 7 && digitCount <= 15 && /^[+\s()0-9-]+$/.test(phone);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { name, phone, email, hp } = req.body || {};
    if (hp) return res.status(200).json({ ok: true }); // honeypot tripped: pretend success, skip the write

    const cleanName = String(name || '').trim().slice(0, 100);
    const cleanPhone = String(phone || '').trim().slice(0, 30);
    const cleanEmail = String(email || '').trim().slice(0, 100);
    if (!cleanName) return res.status(400).json({ error: 'Name is required.' });
    if (!isValidPhone(cleanPhone)) return res.status(400).json({ error: 'Enter a valid phone number.' });

    const db = getFirestore();
    const existing = await db.collection('customers').where('phone', '==', cleanPhone).limit(1).get();
    if (!existing.empty) return res.status(200).json({ ok: true }); // already in the CRM, don't duplicate

    const id = `cust-${crypto.randomUUID()}`;
    await db.collection('customers').doc(id).set({
      id, name: cleanName, phone: cleanPhone, email: cleanEmail,
      source: 'qr-catalogue', createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('add-lead failed:', e.code || e.message);
    return res.status(500).json({ error: 'Could not save. Please try again.' });
  }
}
