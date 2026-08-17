import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import { useToast } from '@web/shared/components/ui/use-toast';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import { useGetAllCustomers } from '@web/shared/hooks/useCustomers';
import { useCreateBill } from '@web/shared/hooks/useBill';
import { useGetSettings } from '@web/shared/hooks/useSettings';
import { useGetOpenPOSSession, useOpenPOSSession, useClosePOSSession } from '@web/shared/hooks/usePOSSession';
import { useLogout, useIsPOSUser } from '@web/shared/hooks/useAuthentication';
import authService from '@web/shared/services/auth';
import { money, randomId } from '@web/shared/functions/words';
import { defaultId } from '@web/config';
import { Combobox } from '@web/shared/components/ui/combobox';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
  LogOut, Printer, UserPlus
} from 'lucide-react';
import { cn } from '@web/shared/utils/cn';
import { CartItem, IPosSession } from '@web/shared/types/pos';
import { IProduct } from '@web/shared/types/product';
import { ICustomer } from '@web/shared/types/customer';
import CustomerModal from '@web/shared/components/Customer';

const POS: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const isPOSUser = useIsPOSUser();

  if (!isPOSUser) {
    return <Navigate to="/" replace />;
  }

  const { data: products, isLoading: productsLoading } = useGetAllProducts();
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
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 30);
    return products.filter((p: IProduct) =>
      p.productName.toLowerCase().includes(term) ||
      p.barCode.toLowerCase().includes(term)
    );
  }, [products, search]);

  const customerOptions = useMemo(() => {
    const opts = (customers || []).map((c: ICustomer) => ({ value: c._id, label: c.fullname }));
    return [{ value: defaultId, label: t('walkInCustomer') }, ...opts];
  }, [customers]);

  const totals = useMemo(() => {
    const totalHT = cart.reduce((sum, item) => sum + item.totalHT, 0);
    const totalTTC = cart.reduce((sum, item) => sum + item.totalTTC, 0);
    return { totalHT, totalTTC };
  }, [cart]);

  const change = useMemo(() => {
    const total = totals.totalTTC;
    const rec = Number(received || 0);
    if (!rec || rec < total) return 0;
    return rec - total;
  }, [received, totals.totalTTC]);

  const isPaidEnough = useMemo(() => {
    if (isCredit) return true;
    return Number(received || 0) >= totals.totalTTC;
  }, [isCredit, received, totals.totalTTC]);

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
    setCart((prev) => prev.map((item) => {
      if (item.cartId !== cartId) return item;
      const newQty = Math.max(1, item.quantity + delta);
      const totalHT = newQty * item.unitPrice;
      const totalTTC = totalHT * (1 + (item.tva || 0) / 100);
      return { ...item, quantity: newQty, totalHT, totalTTC };
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
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

    const totalTTC = totals.totalTTC;
    const paid = isCredit ? Number(received || 0) : totalTTC;
    const debts = totalTTC - paid;

    const payload: any = {
      type: 'POS',
      billDate: new Date().toISOString(),
      products: billProducts,
      orderTotalHT: totals.totalHT,
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
      setCart([]);
      setReceived('');
      setIsCredit(false);
      // Optionally print ticket here
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
      toast({ title: t('error'), description: error?.response?.data?.message || error.message, variant: 'destructive' });
    }
  };

  const handleCloseSession = async () => {
    try {
      await closeSession({ actualCash: Number(closeActualCash || 0) });
      setShowCloseModal(false);
      toast({ title: t('sessionClosed') });
    } catch (error: any) {
      toast({ title: t('error'), description: error?.response?.data?.message || error.message, variant: 'destructive' });
    }
  };

  if (!session) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">{t('posTerminal')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t('noOpenPosSession')}</p>
            <Button onClick={handleOpenSession} disabled={openingSession} className="w-full">
              {t('openSession')}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">{t('posTerminal')}</h1>
          <span className="text-xs text-muted-foreground">
            {t('sessionOpenedAt')}: {new Date(session.openingDate).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCloseModal(true)}>
            {t('closeSession')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" />
            {t('logout')}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: products */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <div className="p-3 border-b flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchProducts')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative w-48">
              <BarcodeIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                placeholder={t('barcode')}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcode}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">{t('noProducts')}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredProducts.map((product: IProduct) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'text-left p-3 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all',
                      Number(product.quantity || 0) <= 0 && 'opacity-60'
                    )}
                  >
                    <p className="font-medium truncate">{product.productName}</p>
                    <p className="text-xs text-muted-foreground truncate">{product.barCode}</p>
                    <p className="text-sm font-bold mt-1">{money(product.sellPrice_1 || 0)} DZD</p>
                    <p className="text-xs text-muted-foreground">{t('stock')}: {product.quantity || 0}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: cart & payment */}
        <div className="w-[420px] flex flex-col bg-card border-l shrink-0">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {t('cart')}
              </span>
              <span className="text-sm text-muted-foreground">{cart.length} {t('items')}</span>
            </div>
            <div className="flex gap-2">
              <Combobox
                options={customerOptions}
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                placeholder={t('selectCustomer')}
                className="flex-1"
              />
              <CustomerModal
                type="Client"
                trigger={(
                  <Button variant="outline" size="icon">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">{t('emptyCart')}</div>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} className="flex items-center gap-3 p-2 rounded-lg border bg-background">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{money(item.unitPrice)} DZD</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.cartId, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.cartId, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-bold">{money(item.totalTTC)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.cartId)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('totalHT')}</span>
              <span>{money(totals.totalHT)} DZD</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t('totalTTC')}</span>
              <span>{money(totals.totalTTC)} DZD</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="w-4 h-4 mr-2" />
                {t('cash')}
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {t('card')}
              </Button>
            </div>

            {allowPosCredit && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pos-credit"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="pos-credit" className="text-sm">{t('sellOnCredit')}</label>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder={t('receivedAmount')}
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-muted rounded-md text-sm min-w-[80px] justify-center">
                {t('change')}: {money(change)}
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg"
              onClick={handlePay}
              disabled={cart.length === 0 || creatingBill || !isPaidEnough}
            >
              <Printer className="w-5 h-5 mr-2" />
              {creatingBill ? t('processing') : t('payAndPrint')}
            </Button>
          </div>
        </div>
      </div>

      {/* Close session modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>{t('closeSession')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={t('actualCash')}
                type="number"
                value={closeActualCash}
                onChange={(e) => setCloseActualCash(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCloseModal(false)}>
                  {t('cancel')}
                </Button>
                <Button className="flex-1" onClick={handleCloseSession} disabled={closingSession}>
                  {t('confirm')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

const BarcodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7V5h2v2H3zm4 0V5h2v2H7zm4 0V5h2v2h-2zm4 0V5h2v2h-2zm4 0V5h2v2h-2zM3 11V9h2v2H3zm14 0V9h2v2h-2zM3 15v-2h2v2H3zm4 0v-2h2v2H7zm10 0v-2h2v2h-2zM3 19v-2h2v2H3zm8 0v-2h2v2h-2z" />
  </svg>
);

export default POS;
