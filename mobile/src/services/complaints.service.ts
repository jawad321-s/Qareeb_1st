// "Report a problem" (Profile → Report): stored in `complaints` for the admin
// dashboard → Complaints. Demo mode keeps nothing.
import { addDoc, collection } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';

export async function submitComplaint(input: { reason: string; details: string }): Promise<void> {
  const db = getDb();
  const me = useAuth.getState().user;
  if (config.useMock || !db || !me) {
    await new Promise((r) => setTimeout(r, 500));
    return;
  }
  await addDoc(collection(db, 'complaints'), {
    reporterId: me.uid,
    reporterName: me.fullName,
    reporterRole: me.role,
    reporterPhone: me.phone,
    reason: input.reason,
    details: input.details.trim(),
    status: 'open',
    createdAt: Date.now(),
  });
}
