// Admin-only: sets a random one-time password for another user and forces a change at next login.
// Needs the FIREBASE_SERVICE_ACCOUNT env var (service-account JSON) in Vercel.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { randomInt } from 'node:crypto';

if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // no look-alikes (0/O, 1/l/I)
const makePassword = () => Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'Not signed in' });
    const caller = await getAuth().verifyIdToken(token);
    const db = getFirestore();

    const callerDoc = await db.doc(`users/${caller.uid}`).get();
    if (String(callerDoc.data()?.role || '').toLowerCase() !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { uid } = req.body || {};
    if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'uid required' });
    if (uid === caller.uid) return res.status(400).json({ error: 'Change your own password in Settings' });

    const target = await getAuth().getUser(uid);
    const password = makePassword();
    await getAuth().updateUser(uid, { password });
    await getAuth().revokeRefreshTokens(uid); // end any session still signed in with the old password
    await db.doc(`users/${uid}`).set({ mustChangePassword: true }, { merge: true });
    // the password itself is never logged or stored
    await db.collection('activity_log').add({
      by: caller.email, role: 'Admin', at: new Date().toISOString(),
      action: 'reset', entity: 'User', target: target.email, detail: 'password reset (one-time password issued)'
    });
    return res.status(200).json({ password, email: target.email });
  } catch (e) {
    console.error('reset-password failed:', e.code || e.message);
    return res.status(500).json({ error: 'Reset failed' });
  }
}
