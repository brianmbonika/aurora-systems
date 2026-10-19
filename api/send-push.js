// Called by any signed-in staff member right after a change is logged to activity_log.
// Sends an OS-level push notification to every Admin/CEO device that has subscribed
// (see push_subscriptions collection). Needs VAPID_PRIVATE_KEY in Vercel env vars.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';

if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

const VAPID_PUBLIC_KEY = 'BE8CEVyjd_oV8IMCBZbyKPRR5ZzNA5PptJaJRtrG6zsqcKXVVzhLJD_4dR2Xab-v1ijNRb1PRekiTj5WjA0LKYQ';
webpush.setVapidDetails('mailto:mr.mbonika@gmail.com', VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'Not signed in' });
    await getAuth().verifyIdToken(token); // any signed-in staff member may trigger a notification

    const { title, body, url } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });

    const db = getFirestore();
    const users = await db.collection('users').where('role', 'in', ['Admin', 'CEO']).get();
    const subs = await db.collection('push_subscriptions')
      .where('__name__', 'in', users.docs.length ? users.docs.map((d) => d.ref) : ['_none_'])
      .get();

    const payload = JSON.stringify({ title, body, url });
    let sent = 0, gone = 0;
    await Promise.all(subs.docs.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.data().subscription, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { await doc.ref.delete(); gone++; } // stale subscription
      }
    }));
    return res.status(200).json({ sent, gone });
  } catch (e) {
    console.error('send-push failed:', e.code || e.message);
    return res.status(500).json({ error: 'Send failed' });
  }
}
