    import Dexie, { Table } from 'dexie';

export interface OfflineInvoice {
  id?: number;
  temp_id: string;
  items: any[];
  customer_name: string;
  subtotal: number;
  discount_value: number;
  discount_type: string;
  tax_amount: number;
  total: number;
  payment_cash: number;
  payment_card: number;
  change_given: number;
  created_at: string;
  synced: boolean;
}

export interface CachedProduct {
  id: string;
  name: string;
  barcode: string | null;
  category: string | null;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  tax_exempt: boolean;
  unit: string;
  active: boolean;
  image_url: string | null;
}

class PosDatabase extends Dexie {
  offlineInvoices!: Table<OfflineInvoice, number>;
  cachedProducts!: Table<CachedProduct, string>;

  constructor() {
    super('cloudpos_db');
    this.version(1).stores({
      offlineInvoices: '++id, temp_id, synced, created_at',
      cachedProducts: 'id, name, barcode, category',
    });
  }
}

export const db = new PosDatabase();