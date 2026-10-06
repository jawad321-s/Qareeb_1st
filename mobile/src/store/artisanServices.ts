import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import { api } from '@/services/api';
import type { Service } from '@/types';

const STORE_KEY = 'qareeb.artisan.services.v2';

/** serviceId → whether the artisan currently offers it. A service that is in
 *  the map is on the artisan's list; the flag pauses it without removing it. */
type Offered = Record<string, boolean>;

interface ArtisanServicesState {
  /** Keyed by artisan uid so demo accounts keep separate lists. */
  byUser: Record<string, Offered>;
  seed: (uid: string, offered: Offered) => void;
  setActive: (uid: string, serviceId: string, active: boolean, catalog: Service[]) => void;
  add: (uid: string, serviceIds: string[], catalog: Service[]) => void;
  remove: (uid: string, serviceId: string, catalog: Service[]) => void;
}

/** Firebase mode: keep the artisan profile in step (what they offer and in
 *  which categories). The mock keeps the list on the device only. */
function sync(uid: string, offered: Offered, catalog: Service[]) {
  const serviceIds = Object.keys(offered).filter((id) => offered[id]);
  const categoryIds = [...new Set(serviceIds.map((id) => catalog.find((s) => s.id === id)?.categoryId).filter(Boolean))] as string[];
  api.updateArtisanServices(uid, serviceIds, categoryIds).catch(() => {});
}

export const useArtisanServices = create<ArtisanServicesState>((set, get) => {
  const save = (uid: string, offered: Offered) => {
    const byUser = { ...get().byUser, [uid]: offered };
    kv.set(STORE_KEY, byUser);
    set({ byUser });
  };
  return {
    byUser: kv.get<Record<string, Offered>>(STORE_KEY) ?? {},
    seed: (uid, offered) => {
      if (!get().byUser[uid]) save(uid, offered);
    },
    setActive: (uid, serviceId, active, catalog) => {
      const next = { ...get().byUser[uid], [serviceId]: active };
      save(uid, next);
      sync(uid, next, catalog);
    },
    add: (uid, serviceIds, catalog) => {
      const next = { ...get().byUser[uid] };
      for (const id of serviceIds) next[id] = true;
      save(uid, next);
      sync(uid, next, catalog);
    },
    remove: (uid, serviceId, catalog) => {
      const { [serviceId]: _gone, ...next } = get().byUser[uid] ?? {};
      save(uid, next);
      sync(uid, next, catalog);
    },
  };
});
