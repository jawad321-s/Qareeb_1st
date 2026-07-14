import { Card, Button, Badge } from '@/components/ui/primitives';

const ROLES = [
  { role: 'Super admin', members: 2, perms: 'Full access' },
  { role: 'Operations', members: 5, perms: 'Requests, complaints, verifications' },
  { role: 'Support', members: 8, perms: 'Users, complaints (read)' },
  { role: 'Finance', members: 3, perms: 'Revenue, subscriptions, payouts' },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">Platform configuration and team access.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Platform</h2>
        <div className="space-y-4">
          {[
            { label: 'Platform name', value: 'Qareeb' },
            { label: 'Support email', value: 'support@qareeb.app' },
            { label: 'Default currency', value: 'ILS (₪)' },
            { label: 'Commission rate', value: '12%' },
          ].map((f) => (
            <div key={f.label} className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm text-muted">{f.label}</label>
              <input defaultValue={f.value} className="col-span-2 h-10 rounded-xl border border-base bg-transparent px-3 text-sm outline-none focus:border-brand-500" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Save changes</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Roles & permissions</h2>
        <div className="space-y-3">
          {ROLES.map((r) => (
            <div key={r.role} className="flex items-center justify-between rounded-xl border border-base p-4">
              <div>
                <p className="font-medium">{r.role}</p>
                <p className="text-xs text-muted">{r.perms}</p>
              </div>
              <Badge tone="brand">{r.members} members</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
