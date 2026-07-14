import { Plus } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/primitives';

const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', color: '#3B82F6', services: 2, active: true },
  { id: 'electrical', name: 'Electrical', color: '#F59E0B', services: 2, active: true },
  { id: 'carpentry', name: 'Carpentry', color: '#B45309', services: 2, active: true },
  { id: 'ac', name: 'Air Conditioning', color: '#06B6D4', services: 2, active: true },
  { id: 'painting', name: 'Painting', color: '#EC4899', services: 2, active: true },
  { id: 'cleaning', name: 'Cleaning', color: '#10B981', services: 2, active: true },
  { id: 'maintenance', name: 'Maintenance', color: '#6366F1', services: 2, active: true },
  { id: 'repair', name: 'Home Repair', color: '#8B5CF6', services: 2, active: true },
  { id: 'appliance', name: 'Appliance Repair', color: '#0EA5E9', services: 2, active: true },
  { id: 'gardening', name: 'Gardening', color: '#22C55E', services: 2, active: true },
  { id: 'satellite', name: 'Satellite', color: '#64748B', services: 2, active: false },
  { id: 'moving', name: 'Moving', color: '#EF4444', services: 2, active: true },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted">{CATEGORIES.length} service categories in the catalog.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 rounded-xl" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }} />
              <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Hidden'}</Badge>
            </div>
            <p className="mt-4 font-semibold">{c.name}</p>
            <p className="text-sm text-muted">{c.services} services</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
