import { Card, Badge } from '@/components/ui/primitives';
import { formatMoney } from '@/lib/utils';

const PLANS = [
  { name: 'Starter', price: 0, subscribers: 812, tone: 'neutral' as const },
  { name: 'Pro', price: 4900, subscribers: 356, tone: 'brand' as const },
  { name: 'Elite', price: 9900, subscribers: 72, tone: 'warning' as const },
];

const MRR = PLANS.reduce((s, p) => s + p.price * p.subscribers, 0);

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted">Artisan plan distribution and recurring revenue.</p>
      </div>

      <Card className="p-5">
        <p className="text-sm text-muted">Monthly recurring revenue</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(MRR)}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{p.name}</p>
              <Badge tone={p.tone}>{p.subscribers} subs</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {p.price === 0 ? 'Free' : formatMoney(p.price)}
              {p.price > 0 && <span className="text-sm font-normal text-muted"> / mo</span>}
            </p>
            <p className="mt-1 text-sm text-muted">{formatMoney(p.price * p.subscribers)} / month</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
