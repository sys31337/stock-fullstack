import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { useToast } from '@web/shared/components/ui/use-toast';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import { useGetAllCategories } from '@web/shared/hooks/useCategories';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useCreateBill } from '@web/shared/hooks/useBill';
import { useGetSettings } from '@web/shared/hooks/useSettings';
import {
  useGetOpenPOSSession,
  useOpenPOSSession,
  useClosePOSSession,
} from '@web/shared/hooks/usePOSSession';
import { useLogout, useIsPOSUser } from '@web/shared/hooks/useAuthentication';
import authService from '@web/shared/services/auth';
import { money, randomId } from '@web/shared/functions/words';
import { defaultId } from '@web/config';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  LogOut,
  Printer,
  UserPlus,
  LayoutGrid,
  Calendar,
  Truck,
  Calculator,
  ChefHat,
  Receipt,
} from 'lucide-react';
import { cn } from '@web/shared/utils/cn';
import { CartItem, IPosSession } from '@web/shared/types/pos';
import { IProduct } from '@web/shared/types/product';
import { ICustomer } from '@web/shared/types/customer';
import CustomerModal from '@web/shared/components/Customer';

interface PosCategory {
  _id: string;
  name: string;
  count?: number;
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#111315',
  surface: '#1A1D1F',
  surfaceHover: '#222629',
  card: '#2D2D2D',
  cardHover: '#353535',
  border: '#2D2D2D',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  primary: '#FFFFFF',
  primaryText: '#111315',
  accent: '#3B82F6',
};

const PASTELS = [
  { bg: 'rgba(251, 191, 36, 0.12)', text: '#FBBF24' },   // amber
  { bg: 'rgba(96, 165, 250, 0.12)', text: '#60A5FA' },   // blue
  { bg: 'rgba(167, 139, 250, 0.12)', text: '#A78BFA' },  // violet
  { bg: 'rgba(244, 114, 182, 0.12)', text: '#F472B6' },  // pink
  { bg: 'rgba(52, 211, 153, 0.12)', text: '#34D399' },   // emerald
  { bg: 'rgba(251, 146, 60, 0.12)', text: '#FB923C' },   // orange
  { bg: 'rgba(103, 232, 249, 0.12)', text: '#67E8F9' },  // cyan
  { bg: 'rgba(192, 132, 252, 0.12)', text: '#C084FC' },  // purple
];

const FALLBACK_CATEGORIES: PosCategory[] = [
  { _id: 'breakfast', name: 'Breakfast', count: 12 },
  { _id: 'soups', name: 'Soups', count: 8 },
  { _id: 'pasta', name: 'Pasta', count: 15 },
  { _id: 'sushi', name: 'Sushi', count: 22 },
  { _id: 'main', name: 'Main Course', count: 18 },
  { _id: 'desserts', name: 'Desserts', count: 10 },
  { _id: 'drinks', name: 'Drinks', count: 14 },
  { _id: 'alcohol', name: 'Alcohol', count: 9 },
];

const SIDEBAR_ITEMS = [
  { id: 'table', label: 'Table Services', icon: LayoutGrid },
  { id: 'reservations', label: 'Reservations', icon: Calendar },
  { id: 'menu', label: 'Menu', icon: ChefHat, active: true },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'accounting', label: 'Accounting', icon: Calculator },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const categoryStyle = (index: number) => PASTELS[index % PASTELS.length];

const categoryCount = (categoryId: string, products: IProduct[]) =>
  products.filter((p) => {
    const cat = p.category as any;
    return cat?._id === categoryId || cat === categoryId;
  }).length;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const POS: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const isPOSUser = useIsPOSUser();

  if (!isPOSUser) {
    return <Navigate to="/" replace />;
  }

  const { data: products, isLoading: productsLoading } = useGetAllProducts();
  const { data: categoriesData } = useGetAllCategories();
  const { data: customers } = useGetAllCustomers();
  const { data: settings } = useGetSettings();
  const { data: sessionData } = useGetOpenPOSSession();
  const { mutateAsync: openSession, isLoading: openingSession } = useOpenPOSSession();
  const { mutateAsync: closeSession, isLoading: closingSession } = useClosePOSSession();
  const { mutateAsync: createBill, isLoading: creatingBill } = useCreateBill();
  const { mutateAsync: logout } = useLogout();

  const tvaEnabled = settings?.tvaEnabled ?? true;
  const defaultTva = settings?.tva ?? 19;
  const allowPosCredit = settings?.allowPosCredit ?? false;

  const session: IPosSession | null = sessionData?.session || null;

  const categories = useMemo<PosCategory[]>(() => {
    const existing = (categoriesData || []) as any[];
    if (existing.length > 0) {
      return existing.map((c) => ({ _id: c._id || c.id, name: c.name, count: c.products?.length || c.count }));
    }
    return FALLBACK_CATEGORIES;
  }, [categoriesData]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(defaultId);
  const [received, setReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isCredit, setIsCredit] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeActualCash, setCloseActualCash] = useState('');

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = products as IProduct[];
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.productName.toLowerCase().includes(term) ||
          p.barCode.toLowerCase().includes(term)
      );
    }
    if (activeCategory !== 'all') {
      list = list.filter((p) => {
        const cat = p.category as any;
        return cat?._id === activeCategory || cat === activeCategory;
      });
    }
    return list;
  }, [products, search, activeCategory]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalHT, 0);
    const tax = cart.reduce((sum, item) => sum + (item.totalTTC - item.totalHT), 0);
    const total = cart.reduce((sum, item) => sum + item.totalTTC, 0);
    return { subtotal, tax, total };
  }, [cart]);

  const change = useMemo(() => {
    const rec = Number(received || 0);
    if (!rec || rec < totals.total) return 0;
    return rec - totals.total;
  }, [received, totals.total]);

  const isPaidEnough = useMemo(() => {
    if (isCredit) return true;
    return Number(received || 0) >= totals.total;
  }, [isCredit, received, totals.total]);

  const addToCart = (product: IProduct, qty = 1) => {
    const unitPrice = Number(product.sellPrice_1 || product.buyPrice || 0);
    const tva = tvaEnabled ? Number(product.tva ?? defaultTva) : 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => {
          if (item.id !== product.id) return item;
          const newQty = item.quantity + qty;
          const totalHT = newQty * unitPrice;
          const totalTTC = totalHT * (1 + tva / 100);
          return { ...item, quantity: newQty, totalHT, totalTTC };
        });
      }
      const totalHT = qty * unitPrice;
      const totalTTC = totalHT * (1 + tva / 100);
      return [
        ...prev,
        {
          ...product,
          cartId: randomId(),
          quantity: qty,
          unitPrice,
          totalHT,
          totalTTC,
        } as CartItem,
      ];
    });
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId !== cartId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          const totalHT = newQty * item.unitPrice;
          const totalTTC = totalHT * (1 + (item.tva || 0) / 100);
          return { ...item, quantity: newQty, totalHT, totalTTC };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setReceived('');
    setIsCredit(false);
  };

  const handleBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const code = barcode.trim();
    if (!code) return;
    const product = (products || []).find((p: IProduct) => p.barCode === code);
    if (product) {
      addToCart(product);
      setBarcode('');
    } else {
      toast({ title: t('productNotFound'), variant: 'destructive' });
    }
  };

  const handlePay = async () => {
    if (cart.length === 0) {
      toast({ title: t('cartIsEmpty'), variant: 'destructive' });
      return;
    }
    if (!isPaidEnough) {
      toast({ title: t('insufficientPayment'), variant: 'destructive' });
      return;
    }

    const billProducts = cart.map((item) => ({
      id: item.id,
      barCode: item.barCode,
      productName: item.productName,
      quantity: item.quantity,
      stack: 1,
      buyPrice: Number(item.buyPrice || 0),
      sellPrice_1: item.unitPrice,
      sellPrice_2: Number(item.sellPrice_2 || 0),
      sellPrice_3: Number(item.sellPrice_3 || 0),
      totalHT: item.totalHT,
      totalTTC: item.totalTTC,
      tva: Number(item.tva || defaultTva),
    }));

    const totalTTC = totals.total;
    const paid = isCredit ? Number(received || 0) : totalTTC;
    const debts = totalTTC - paid;

    const payload: any = {
      type: 'DELIVERY',
      source: 'POS',
      billDate: new Date().toISOString(),
      products: billProducts,
      orderTotalHT: totals.subtotal,
      orderTotalTTC: totalTTC,
      orderPaid: paid,
      orderDebts: debts,
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'Card',
      pricingCategory: 1,
      description: `POS sale ${session ? `session ${session._id}` : ''}`,
      warehouse: session?.warehouse ? (session.warehouse as any)._id || session.warehouse : undefined,
    };
    if (selectedCustomer !== defaultId) {
      payload.customer = selectedCustomer;
    }

    try {
      await createBill(payload);
      toast({ title: t('saleCompleted') });
      clearCart();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    const userInfo = authService.loadUserInfo();
    await logout(userInfo?.token).catch(() => {});
    authService.resetUserInfo();
    navigate('/connexion');
  };

  const handleOpenSession = async () => {
    try {
      await openSession({ openingCash: 0 });
      toast({ title: t('sessionOpened') });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCloseSession = async () => {
    try {
      await closeSession({ actualCash: Number(closeActualCash || 0) });
      setShowCloseModal(false);
      toast({ title: t('sessionClosed') });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error?.response?.data?.message || error.message,
        variant: 'destructive',
      });
    }
  };

  // -------------------------------------------------------------------------
  // No session screen
  // -------------------------------------------------------------------------
  if (!session) {
    return (
      <div
        className="w-screen h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: COLORS.bg, fontFamily: 'Inter, sans-serif' }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-8 text-center"
          style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: COLORS.card }}>
            <Receipt className="w-8 h-8" style={{ color: COLORS.text }} />
          </div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: COLORS.text }}>
            {t('posTerminal')}
          </h1>
          <p className="mb-8" style={{ color: COLORS.textMuted }}>
            {t('noOpenPosSession')}
          </p>
          <button
            onClick={handleOpenSession}
            className="w-full h-12 rounded-xl font-medium transition-transform active:scale-[0.98]"
            style={{ backgroundColor: COLORS.text, color: COLORS.primaryText }}
          >
            {openingSession ? t('loading') : t('openSession')}
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-12 mt-3 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.surfaceHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main POS layout
  // -------------------------------------------------------------------------
  return (
    <div
      className="w-screen h-screen flex overflow-hidden"
      style={{ backgroundColor: COLORS.bg, fontFamily: 'Inter, sans-serif' }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Left Sidebar */}
      <aside
        className="w-[220px] shrink-0 flex flex-col justify-between py-6 px-4"
        style={{ backgroundColor: COLORS.bg, borderRight: `1px solid ${COLORS.border}` }}
      >
        <div>
          <div className="flex items-center gap-3 px-2 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.text }}
            >
              <ChefHat className="w-6 h-6" style={{ color: COLORS.primaryText }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: COLORS.text }}>SoluStock</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>POS Terminal</p>
            </div>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                    item.active ? '' : ''
                  )}
                  style={{
                    backgroundColor: item.active ? COLORS.card : 'transparent',
                    color: item.active ? COLORS.text : COLORS.textMuted,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ color: COLORS.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.surfaceHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
          <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-xl" style={{ backgroundColor: COLORS.surface }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: COLORS.card, color: COLORS.text }}>
              POS
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>Cashier</p>
              <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>POS Operator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: COLORS.bg }}>
        {/* Top bar */}
        <header className="h-20 shrink-0 flex items-center justify-between px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: COLORS.textMuted }} />
            <input
              type="text"
              placeholder={t('searchProducts')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-2xl pl-12 pr-4 text-sm outline-none transition-colors"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.textMuted }} />
              <input
                ref={barcodeRef}
                type="text"
                placeholder={t('barcode')}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcode}
                className="h-12 w-44 rounded-2xl pl-10 pr-3 text-sm outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
              />
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="h-12 px-5 rounded-2xl text-sm font-medium transition-colors"
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              {t('closeSession')}
            </button>
          </div>
        </header>

        {/* Categories */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setActiveCategory('all')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeCategory === 'all' ? COLORS.text : COLORS.surface,
                color: activeCategory === 'all' ? COLORS.primaryText : COLORS.textMuted,
              }}
            >
              All
            </button>
            {categories.map((cat, idx) => {
              const count = categoryCount(cat._id, (products || []) as IProduct[]);
              const style = categoryStyle(idx);
              const isActive = activeCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    backgroundColor: isActive ? COLORS.card : COLORS.surface,
                    borderColor: isActive ? COLORS.border : 'transparent',
                    color: isActive ? COLORS.text : COLORS.textMuted,
                  }}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: style.bg }}>
                    <ChefHat className="w-4 h-4" style={{ color: style.text }} />
                  </span>
                  <span>{cat.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: COLORS.bg, color: COLORS.textMuted }}>
                    {count || cat.count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {productsLoading ? (
            <div className="flex items-center justify-center h-full" style={{ color: COLORS.textMuted }}>
              {t('loading')}...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ color: COLORS.textMuted }}>
              {t('noProducts')}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product: IProduct, idx: number) => {
                const inCart = cart.find((item) => item.id === product.id);
                const style = categoryStyle(idx);
                return (
                  <div
                    key={product.id}
                    className="group relative rounded-2xl p-4 transition-all cursor-pointer border"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: inCart ? style.text : COLORS.border,
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: style.bg }}
                      >
                        <ChefHat className="w-5 h-5" style={{ color: style.text }} />
                      </div>
                      {inCart && (
                        <span
                          className="min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold flex items-center justify-center"
                          style={{ backgroundColor: style.text, color: COLORS.bg }}
                        >
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium mb-1 line-clamp-2" style={{ color: COLORS.text }}>
                      {product.productName}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                      {t('stock')}: {product.quantity || 0}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold" style={{ color: COLORS.text }}>
                        {money(product.sellPrice_1 || 0)}
                      </span>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(inCart.cartId, -1); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: COLORS.card }}
                          >
                            <Minus className="w-3 h-3" style={{ color: COLORS.text }} />
                          </button>
                          <span className="text-sm font-medium w-4 text-center" style={{ color: COLORS.text }}>{inCart.quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(inCart.cartId, 1); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: COLORS.card }}
                          >
                            <Plus className="w-3 h-3" style={{ color: COLORS.text }} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ backgroundColor: COLORS.card }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.cardHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.card)}
                        >
                          <Plus className="w-4 h-4" style={{ color: COLORS.text }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Right Order Panel */}
      <aside
        className="w-[400px] shrink-0 flex flex-col"
        style={{ backgroundColor: COLORS.surface, borderLeft: `1px solid ${COLORS.border}` }}
      >
        {/* Panel header */}
        <div className="p-6 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: COLORS.textMuted }}>
                Current Order
              </p>
              <h2 className="text-xl font-semibold" style={{ color: COLORS.text }}>
                Table #01
              </h2>
            </div>
            <button
              className="h-9 px-4 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: COLORS.card, color: COLORS.text }}
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex-1 h-10 rounded-xl px-3 text-sm outline-none cursor-pointer"
              style={{ backgroundColor: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            >
              <option value={defaultId}>{t('walkInCustomer')}</option>
              {(customers || []).map((c: ICustomer) => (
                <option key={c._id} value={c._id}>{c.fullname}</option>
              ))}
            </select>
            <CustomerModal
              type="Client"
              trigger={(
                <button
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: COLORS.card }}
                >
                  <UserPlus className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                </button>
              )}
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center" style={{ color: COLORS.textMuted }}>
              <Receipt className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{t('emptyCart')}</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={item.cartId}
                className="flex items-center gap-4 p-3 rounded-2xl"
                style={{ backgroundColor: COLORS.bg }}
              >
                <span className="text-sm font-medium w-5" style={{ color: COLORS.textMuted }}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: COLORS.text }}>{item.productName}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {money(item.unitPrice)} DZD x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.cartId, -1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <Minus className="w-3 h-3" style={{ color: COLORS.text }} />
                  </button>
                  <span className="w-5 text-center text-sm font-medium" style={{ color: COLORS.text }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.cartId, 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS.surface }}
                  >
                    <Plus className="w-3 h-3" style={{ color: COLORS.text }} />
                  </button>
                </div>
                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{money(item.totalTTC)}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: COLORS.surface }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.surface)}
                >
                  <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & checkout */}
        <div className="p-6 border-t" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
          {/* Payment method */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors border"
              style={{
                backgroundColor: paymentMethod === 'cash' ? COLORS.text : COLORS.surface,
                color: paymentMethod === 'cash' ? COLORS.primaryText : COLORS.textMuted,
                borderColor: paymentMethod === 'cash' ? COLORS.text : COLORS.border,
              }}
            >
              <Banknote className="w-4 h-4" />
              {t('cash')}
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors border"
              style={{
                backgroundColor: paymentMethod === 'card' ? COLORS.text : COLORS.surface,
                color: paymentMethod === 'card' ? COLORS.primaryText : COLORS.textMuted,
                borderColor: paymentMethod === 'card' ? COLORS.text : COLORS.border,
              }}
            >
              <CreditCard className="w-4 h-4" />
              {t('card')}
            </button>
          </div>

          {allowPosCredit && (
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isCredit}
                onChange={(e) => setIsCredit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-500"
              />
              <span className="text-sm" style={{ color: COLORS.textMuted }}>{t('sellOnCredit')}</span>
            </label>
          )}

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMuted }}>
              <span>Subtotal</span>
              <span style={{ color: COLORS.text }}>{money(totals.subtotal)} DZD</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: COLORS.textMuted }}>
              <span>Tax</span>
              <span style={{ color: COLORS.text }}>{money(totals.tax)} DZD</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-3 border-t" style={{ borderColor: COLORS.border, color: COLORS.text }}>
              <span>Total</span>
              <span>{money(totals.total)} DZD</span>
            </div>
          </div>

          {!isCredit && (
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                placeholder={t('receivedAmount')}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="flex-1 h-12 rounded-xl px-4 text-sm outline-none"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
              />
              <div
                className="h-12 px-4 rounded-xl flex items-center justify-center text-sm font-medium min-w-[90px]"
                style={{ backgroundColor: COLORS.surface, color: COLORS.text }}
              >
                {t('change')}: {money(change)}
              </div>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={cart.length === 0 || creatingBill || !isPaidEnough}
            className="w-full h-14 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.text, color: COLORS.primaryText }}
          >
            <Printer className="w-5 h-5" />
            {creatingBill ? t('processing') : t('payAndPrint')}
          </button>
        </div>
      </aside>

      {/* Close session modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text }}>{t('closeSession')}</h3>
            <input
              type="number"
              placeholder={t('actualCash')}
              value={closeActualCash}
              onChange={(e) => setCloseActualCash(e.target.value)}
              className="w-full h-12 rounded-xl px-4 mb-4 text-sm outline-none"
              style={{ backgroundColor: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 h-12 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: COLORS.bg, color: COLORS.textMuted }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCloseSession}
                disabled={closingSession}
                className="flex-1 h-12 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.text, color: COLORS.primaryText }}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BarcodeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7V5h2v2H3zm4 0V5h2v2H7zm4 0V5h2v2h-2zm4 0V5h2v2h-2zm4 0V5h2v2h-2zM3 11V9h2v2H3zm14 0V9h2v2h-2zM3 15v-2h2v2H3zm4 0v-2h2v2H7zm10 0v-2h2v2h-2zM3 19v-2h2v2H3zm8 0v-2h2v2h-2z" />
  </svg>
);

export default POS;
