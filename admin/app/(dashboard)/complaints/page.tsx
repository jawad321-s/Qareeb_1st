import { Card, StatusPill, Button } from '@/components/ui/primitives';
import { COMPLAINTS } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';

export default function ComplaintsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Complaints</h1>
        <p className="text-sm text-muted">Disputes and reports submitted by users.</p>
      </div>

      <div className="space-y-3">
        {COMPLAINTS.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{c.reason}</p>
                <StatusPill status={c.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {c.reporter} reported {c.target} · {timeAgo(c.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">View</Button>
              <Button size="sm" disabled={c.status === 'resolved'}>
                {c.status === 'resolved' ? 'Resolved' : 'Resolve'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
