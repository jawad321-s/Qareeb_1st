// "Suggest a service": a customer or artisan asks for a service the app
// doesn't offer yet. Stored in `suggestions` for the admin dashboard →
// Suggestions. Demo mode keeps nothing.
import { addDoc, collection } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';

export const SUGGESTION_NAME_MIN = 2;
export const SUGGESTION_NAME_MAX = 60;
export const SUGGESTION_DETAILS_MAX = 500;

export async function submitSuggestion(input: { name: string; details: string }): Promise<void> {
  const db = getDb();
  const me = useAuth.getState().user;
  if (config.useMock || !db || !me) {
    await new Promise((r) => setTimeout(r, 500));
    return;
  }
  await addDoc(collection(db, 'suggestions'), {
    authorId: me.uid,
    authorName: me.fullName,
    authorRole: me.role,
    authorPhone: me.phone,
    name: input.name.trim().slice(0, SUGGESTION_NAME_MAX),
    details: input.details.trim().slice(0, SUGGESTION_DETAILS_MAX),
    status: 'new',
    createdAt: Date.now(),
  });
}
