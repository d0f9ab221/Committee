import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandling';
import { VisitorSummary, VisitorEvent } from '../types/committee';

const SESSION_KEY = 'committee_app_visit_session_id';

function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Server/Unknown';
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/android/i.test(ua)) device = 'Android Mobile';
  else if (/iphone|ipad|ipod/i.test(ua)) device = 'iOS Device';
  else if (/mobile/i.test(ua)) device = 'Mobile Browser';
  return `${device} (${navigator.language || 'en'})`;
}

export async function recordVisitSession(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Only track authenticated users

  const existingSession = sessionStorage.getItem(`${SESSION_KEY}_${user.uid}`);
  if (existingSession) {
    return; // Already recorded in this active session
  }

  const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const recordVisitFn = httpsCallable(functions, 'recordVisit');
    await recordVisitFn({
      sessionId: newSessionId,
      deviceInfo: getDeviceInfo()
    });
    sessionStorage.setItem(`${SESSION_KEY}_${user.uid}`, newSessionId);
  } catch (fnError) {
    // Fallback to client-side Firestore recording
    try {
      const nowIso = new Date().toISOString();
      const userEmail = user.email || 'Anonymous/Unverified';

      // 1. Log visit event
      const eventCol = collection(db, 'visitorEvents');
      await addDoc(eventCol, {
        uid: user.uid,
        email: userEmail,
        timestamp: serverTimestamp(),
        sessionId: newSessionId,
        deviceInfo: getDeviceInfo()
      });

      // 2. Update or Create Visitor Stats Summary
      const statDocRef = doc(db, 'visitorStats', user.uid);
      const statSnap = await getDoc(statDocRef);

      if (statSnap.exists()) {
        const data = statSnap.data();
        const currentTotal = data.totalVisits || 1;
        await setDoc(
          statDocRef,
          {
            email: userEmail,
            lastVisit: nowIso,
            totalVisits: currentTotal + 1,
            recentDevice: getDeviceInfo()
          },
          { merge: true }
        );
      } else {
        await setDoc(statDocRef, {
          uid: user.uid,
          email: userEmail,
          firstVisit: nowIso,
          lastVisit: nowIso,
          totalVisits: 1,
          recentDevice: getDeviceInfo()
        });
      }

      sessionStorage.setItem(`${SESSION_KEY}_${user.uid}`, newSessionId);
    } catch (dbError) {
      console.warn('Visitor tracking client fallback notice:', dbError);
    }
  }
}

// Admin Real-time Analytics Subscriptions
export function subscribeVisitorStats(
  onUpdate: (stats: VisitorSummary[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'visitorStats';
  const statsCol = collection(db, path);
  return onSnapshot(
    statsCol,
    (snapshot) => {
      const list: VisitorSummary[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || 'Unknown',
          firstVisit: data.firstVisit || '',
          lastVisit: data.lastVisit || '',
          totalVisits: data.totalVisits || 0,
          recentDevice: data.recentDevice || ''
        };
      });
      list.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('VisitorStats permission check:', error);
      onError?.(error as Error);
    }
  );
}

export function subscribeVisitorEvents(
  onUpdate: (events: VisitorEvent[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'visitorEvents';
  const eventsCol = collection(db, path);
  return onSnapshot(
    eventsCol,
    (snapshot) => {
      const list: VisitorEvent[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          eventId: data.eventId || d.id,
          uid: data.uid || '',
          email: data.email || '',
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : (data.timestamp || new Date().toISOString()),
          sessionId: data.sessionId || '',
          deviceInfo: data.deviceInfo || ''
        };
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list);
    },
    (error) => {
      console.warn('VisitorEvents permission check:', error);
      onError?.(error as Error);
    }
  );
}
