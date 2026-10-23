import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const ADMIN_EMAIL = 'kfmughal79@gmail.com';

/**
 * Trusted Callable Function: Record Visit Event & Update Stats
 */
export const recordVisit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to record a visit.');
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email || 'Unverified';
  const sessionId = data.sessionId || `sess_${Date.now()}`;
  const deviceInfo = data.deviceInfo || 'Browser';
  const nowIso = new Date().toISOString();

  const statRef = db.collection('visitorStats').doc(uid);
  const eventRef = db.collection('visitorEvents').doc();

  try {
    await db.runTransaction(async (transaction) => {
      const statDoc = await transaction.get(statRef);

      if (statDoc.exists) {
        const currentData = statDoc.data();
        const newTotal = (currentData?.totalVisits || 1) + 1;
        transaction.update(statRef, {
          email,
          lastVisit: nowIso,
          totalVisits: newTotal,
          recentDevice: deviceInfo
        });
      } else {
        transaction.set(statRef, {
          uid,
          email,
          firstVisit: nowIso,
          lastVisit: nowIso,
          totalVisits: 1,
          recentDevice: deviceInfo
        });
      }

      transaction.set(eventRef, {
        eventId: eventRef.id,
        uid,
        email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        sessionId,
        deviceInfo
      });
    });

    return { success: true, uid, sessionId };
  } catch (error: any) {
    console.error('Error in recordVisit transaction:', error);
    throw new functions.https.HttpsError('internal', 'Failed to record visitor stats atomically.');
  }
});

/**
 * Trusted Callable Function: Get Visitor Analytics (Admin Only)
 */
export const getVisitorAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const callerEmail = context.auth.token.email || '';
  const emailVerified = context.auth.token.email_verified === true;

  if (callerEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || !emailVerified) {
    throw new functions.https.HttpsError('permission-denied', 'Only verified administrator kfmughal79@gmail.com can access analytics.');
  }

  const statsSnap = await db.collection('visitorStats').get();
  const eventsSnap = await db.collection('visitorEvents').orderBy('timestamp', 'desc').limit(100).get();

  const stats = statsSnap.docs.map(doc => doc.data());
  const events = eventsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    totalUniqueVisitors: stats.length,
    stats,
    recentEvents: events
  };
});
