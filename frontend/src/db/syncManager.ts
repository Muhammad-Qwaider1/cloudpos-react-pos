import { db, CachedProduct, OfflineInvoice } from './offlineDB';
import api from '../api/client';

// Cache products locally for offline use
export async function cacheProducts(products: CachedProduct[]) {
  await db.cachedProducts.bulkPut(products);
}

export async function getCachedProducts(): Promise<CachedProduct[]> {
  return db.cachedProducts.toArray();
}

// Queue an invoice for offline sync
export async function queueOfflineInvoice(invoice: Omit<OfflineInvoice, 'id' | 'synced'>) {
  return db.offlineInvoices.add({ ...invoice, synced: false } as OfflineInvoice);
}

export async function getPendingInvoices(): Promise<OfflineInvoice[]> {
  return db.offlineInvoices.where('synced').equals(0 as any).toArray();
}

// Sync all pending offline invoices
export async function syncOfflineInvoices(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingInvoices();
  let synced = 0;
  let failed = 0;

  for (const inv of pending) {
    if (!inv.id) continue;
    try {
      await api.post('/invoices', {
        items: inv.items,
        customer_name: inv.customer_name,
        discount_value: inv.discount_value,
        discount_type: inv.discount_type,
        payment_cash: inv.payment_cash,
        payment_card: inv.payment_card,
        change_given: inv.change_given,
      });
      await db.offlineInvoices.update(inv.id, { synced: true });
      synced++;
    } catch (err) {
      console.error('Failed to sync invoice:', inv.temp_id, err);
      failed++;
    }
  }

  return { synced, failed };
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Auto-sync when back online
window.addEventListener('online', () => {
  console.log('🌐 Back online — syncing offline invoices...');
  syncOfflineInvoices().then(({ synced, failed }) => {
    if (synced > 0) console.log(`✅ Synced ${synced} offline invoices`);
    if (failed > 0) console.warn(`⚠️ Failed to sync ${failed} invoices`);
  });
});