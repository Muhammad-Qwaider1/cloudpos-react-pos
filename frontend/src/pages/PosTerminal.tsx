import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "../store/authStore";
import api from "../api/client";
import { isOnline, queueOfflineInvoice, syncOfflineInvoices, getCachedProducts, cacheProducts } from '../db/syncManager';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, ScanLine, Tag, X, Wifi, WifiOff,
} from 'lucide-react';

const TAX_RATE = 0.15;

export default function PosTerminal() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [invDiscValue, setInvDiscValue] = useState(0);
  const [invDiscType, setInvDiscType] = useState('PERCENTAGE');
  const [paying, setPaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [showPayment, setShowPayment] = useState(false);
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      if (isOnline()) {
        const res = await api.get('/products?activeOnly=true');
        setProducts(res.data);
        cacheProducts(res.data);
      } else {
        const cached = await getCachedProducts();
        setProducts(cached);
      }
    } catch {
      const cached = await getCachedProducts();
      setProducts(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const updateOnline = () => setOnline(isOnline());
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q));
  }, [products, search]);

  const handleScan = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const exact = products.find((p) => p.barcode === search.trim());
    if (exact) {
      addToCart(exact);
      setSearch('');
    }
  };

  const addToCart = (product: any) => {
    if (product.stock_quantity <= 0) return;
    setCart((prev) => {
      const ex = prev.find((i) => i.product_id === product.id);
      if (ex)
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          unit_price: product.unit_price,
          quantity: 1,
          discount_value: 0,
          discount_type: 'PERCENTAGE',
          tax_exempt: product.tax_exempt,
          stock: product.stock_quantity,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev.map((i) =>
        i.product_id === id
          ? { ...i, quantity: Math.max(1, Math.min(i.stock, i.quantity + delta)) }
          : i,
      ),
    );

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.product_id !== id));
  const setItemDisc = (id: string, value: string) =>
    setCart((prev) => prev.map((i) => (i.product_id === id ? { ...i, discount_value: parseFloat(value) || 0 } : i)));

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    cart.forEach((item) => {
      const gross = item.unit_price * item.quantity;
      const itemDisc = item.discount_type === 'PERCENTAGE' ? (gross * item.discount_value) / 100 : item.discount_value;
      const net = Math.max(0, gross - itemDisc);
      subtotal += net;
      totalTax += item.tax_exempt ? 0 : net * TAX_RATE;
    });
    const invDisc = invDiscType === 'PERCENTAGE' ? (subtotal * invDiscValue) / 100 : invDiscValue;
    const total = Math.max(0, subtotal - invDisc + totalTax);
    return { subtotal, totalTax, invDisc, total };
  }, [cart, invDiscValue, invDiscType]);

  const cashNum = parseFloat(cash) || 0;
  const cardNum = parseFloat(card) || 0;
  const paid = cashNum + cardNum;
  const change = paid > totals.total ? paid - totals.total : 0;
  const canConfirm = paid >= totals.total - 0.001;

  const handleCheckout = async () => {
    setProcessing(true);
    const invoiceData = {
      items: cart.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        barcode: i.barcode,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_value: i.discount_value,
        discount_type: i.discount_type,
        tax_exempt: i.tax_exempt,
      })),
      customer_name: 'Walk-in Customer',
      discount_value: invDiscValue,
      discount_type: invDiscType,
      payment_cash: cashNum,
      payment_card: cardNum,
      change_given: change,
    };

    try {
      if (online) {
        const res = await api.post('/invoices', invoiceData);
        setLastReceipt({ ...res.data, cashier_name: user?.full_name });
      } else {
        // Queue offline
        await queueOfflineInvoice({
          temp_id: 'OFF-' + Date.now(),
          ...invoiceData,
          subtotal: totals.subtotal,
          tax_amount: totals.totalTax,
          total: totals.total,
          created_at: new Date().toISOString(),
        });
        alert('Invoice saved offline. Will sync when connection is restored.');
      }
      setCart([]);
      setInvDiscValue(0);
      setShowPayment(false);
      setCash('');
      setCard('');
      loadProducts();
    } catch (err) {
      alert('Failed to create invoice');
    } finally {
      setProcessing(false);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-full">
      {/* Products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleScan}
              placeholder={t('scanOrSearch')}
              className="w-full pl-10 pr-3 h-12 text-base rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${online ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {online ? 'Online' : 'Offline'}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((p) => {
              const out = p.stock_quantity <= 0;
              const low = !out && p.stock_quantity <= (p.min_stock_alert || 5);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={out}
                  className={`relative text-left rounded-xl border bg-card p-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${out ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/40'}`}
                >
                  <div className="aspect-square rounded-lg bg-muted mb-2 flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="font-medium text-sm leading-tight line-clamp-2 mb-1">{p.name}</p>
                  <p className="font-heading font-bold text-primary">{p.unit_price?.toFixed(2)}</p>
                  <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${out ? 'bg-destructive text-destructive-foreground' : low ? 'bg-amber-500 text-white' : 'bg-emerald-500/15 text-emerald-600'}`}>
                    {p.stock_quantity}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-12">{t('noData')}</div>
            )}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="w-[380px] shrink-0 border-l bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-heading font-semibold">{t('cart')}</h2>
            {cartCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                {cartCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('cartEmpty')}</p>
              <p className="text-xs">{t('cartEmptyHint')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="rounded-lg border p-2.5">
                <div className="flex justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{item.product_name}</p>
                  <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product_id, -1)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-accent">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, 1)} disabled={item.quantity >= item.stock} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-accent disabled:opacity-40">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-heading font-semibold text-sm">{(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    value={item.discount_value || ''}
                    onChange={(e) => setItemDisc(item.product_id, e.target.value)}
                    placeholder="Disc %"
                    className="w-full h-7 text-xs rounded border px-2 bg-background"
                    min="0"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={invDiscType}
              onChange={(e) => setInvDiscType(e.target.value)}
              className="h-9 text-xs rounded-lg border px-2 bg-background"
            >
              <option value="PERCENTAGE">Percent %</option>
              <option value="FIXED">Fixed</option>
            </select>
            <input
              type="number"
              value={invDiscValue || ''}
              onChange={(e) => setInvDiscValue(parseFloat(e.target.value) || 0)}
              placeholder="Invoice discount"
              className="flex-1 h-9 text-sm rounded-lg border px-3 bg-background"
            />
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>{t('subtotal')}</span><span>{totals.subtotal.toFixed(2)}</span></div>
            {totals.invDisc > 0 && <div className="flex justify-between text-muted-foreground"><span>{t('discount')}</span><span>-{totals.invDisc.toFixed(2)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>{t('vat')} ({(TAX_RATE * 100).toFixed(0)}%)</span><span>{totals.totalTax.toFixed(2)}</span></div>
            <div className="flex justify-between font-heading font-bold text-lg pt-1 border-t mt-1">
              <span>{t('total')}</span><span>{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => { setCash(String(totals.total)); setCard(''); setShowPayment(true); }}
            className="btn-touch w-full bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" /> {t('checkout')} · {totals.total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{t('payment')}</h3>
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalDue')}</p>
              <p className="text-3xl font-heading font-bold mt-1">{totals.total.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm font-medium">{t('cash')}</label>
                <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} className="w-full h-12 text-lg rounded-lg border px-3 bg-background" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium">{t('card')}</label>
                <input type="number" value={card} onChange={(e) => setCard(e.target.value)} className="w-full h-12 text-lg rounded-lg border px-3 bg-background" />
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('paid')}</span><span className="font-medium">{paid.toFixed(2)}</span></div>
              {change > 0 && <div className="flex justify-between text-emerald-600"><span>{t('change')}</span><span className="font-bold">{change.toFixed(2)}</span></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPayment(false)} className="flex-1 h-12 rounded-lg border font-medium hover:bg-accent">{t('cancel')}</button>
              <button onClick={handleCheckout} disabled={!canConfirm || processing} className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
                {processing ? t('processing') : t('confirmPrint')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-auto">
          <div className="print-area bg-white text-black shadow-2xl rounded-lg w-[80mm] p-5 font-mono text-[12px] leading-relaxed">
            <div className="text-center mb-3">
              <p className="font-bold text-base">CloudPOS Store</p>
              <p>123 Main Street, City</p>
              <p>Tel: +1 555 0100</p>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between"><span>Invoice</span><span>{lastReceipt.invoice_number}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{new Date(lastReceipt.created_at).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Cashier</span><span>{lastReceipt.cashier_name || 'Staff'}</span></div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            {lastReceipt.items?.map((it: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{it.product_name} ({it.quantity}x{it.unit_price.toFixed(2)})</span>
                <span>{(it.unit_price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between"><span>Subtotal</span><span>{lastReceipt.subtotal?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>VAT</span><span>{lastReceipt.tax_amount?.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>{lastReceipt.total?.toFixed(2)}</span></div>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="flex justify-between"><span>Cash</span><span>{lastReceipt.payment_cash?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Card</span><span>{lastReceipt.payment_card?.toFixed(2)}</span></div>
            {lastReceipt.change_given > 0 && <div className="flex justify-between"><span>Change</span><span>{lastReceipt.change_given?.toFixed(2)}</span></div>}
            <div className="text-center mt-4 text-[11px]"><p>Thank you for your purchase!</p></div>
          </div>
          <button onClick={() => { setLastReceipt(null); window.print(); }} className="no-print fixed top-4 right-4 bg-white text-black rounded-lg px-4 py-2 shadow-lg font-medium hover:bg-gray-100">
            {t('print')}
          </button>
          <button onClick={() => setLastReceipt(null)} className="no-print fixed top-4 right-24 bg-white text-black rounded-lg px-4 py-2 shadow-lg font-medium hover:bg-gray-100">
            {t('close')}
          </button>
        </div>
      )}
    </div>
  );
}