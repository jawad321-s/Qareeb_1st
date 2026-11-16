// Complaints, stored in `complaints` for the admin dashboard → Complaints.
// Two kinds share the collection:
//   - about a person: a customer complains about an artisan (or the other way
//     round), usually about a job they had together;
//   - a general problem (Profile → Report a problem): no person attached.
// The reporter's identity stays with the admins: the other side is never told.
// Demo mode keeps nothing.
import { addDoc, collection } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import type { UserRole } from '@/types';

/** Who a complaint is about: decides which reasons are offered. */
export type ComplaintKind = 'artisan' | 'customer' | 'general';

/** Reason codes per kind; labels are `report.r.<kind>.<code>`, the admin maps the same codes. */
export const COMPLAINT_REASONS: Record<ComplaintKind, readonly string[]> = {
  artisan: ['no_show', 'overcharged', 'poor_quality', 'unprofessional', 'safety', 'other'],
  customer: ['no_show', 'refused_pay', 'abusive', 'false_info', 'safety', 'other'],
  general: ['app_issue', 'account', 'payment', 'other'],
};

export const complaintReasonKey = (kind: ComplaintKind, code: string) => `report.r.${kind}.${code}`;

export const DETAILS_MAX = 1000;

export interface ComplaintInput {
  reason: string;
  details: string;
  /** The person the complaint is about. */
  target?: { id: string; name: string; role: Extract<UserRole, 'artisan' | 'customer'> };
  /** The job it is about, when there is one. */
  request?: { id: string; title: string };
}

export async function submitComplaint(input: ComplaintInput): Promise<void> {
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
    targetId: input.target?.id ?? null,
    targetName: input.target?.name ?? null,
    targetRole: input.target?.role ?? null,
    requestId: input.request?.id ?? null,
    requestTitle: input.request?.title ?? null,
    reason: input.reason,
    details: input.details.trim().slice(0, DETAILS_MAX),
    status: 'open',
    createdAt: Date.now(),
  });
}
