import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { usePromotions } from '@/hooks/usePromotions';
import { useShift } from '@/hooks/useShift';
import { useTransactions } from '@/hooks/useTransactions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ShiftStatusBar } from '@/components/pos/ShiftStatusBar';
import { ProductFilters } from '@/components/pos/ProductFilters';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { ReceiptDialog } from '@/components/pos/ReceiptDialog';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { TransactionHistoryDialog } from '@/components/pos/TransactionHistoryDialog';
import { useNotifications } from '@/components/NotificationDropdown';
import { calculateTotal } from '@/utils/calculations';
import { formatCurrency } from '@/utils/currency';

export default function POS() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  
  // Products
  const {
    filteredProducts,
    loading,
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  } = useProducts();

  // Cart
  const {
    cart,
    subtotal,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
  } = useCart(filteredProducts);

  // Promotions
  const {
    appliedPromotions,
    discountTotal,
    clearPromotions,
  } = usePromotions(cart);

  // Shift
  const {
    activeShift,
    checkInLoading,
    checkOutLoading,
    checkOutResult,
    checkIn,
    checkOut,
    loadActiveShift,
    getShiftTimeRemaining,
    currentTime,
  } = useShift(user?._id);

  // Transactions
  const {
    processing,
    completedTransaction,
    createTransaction,
    clearCompletedTransaction,
  } = useTransactions();

  // Payment state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>();
  const [change, setChange] = useState<number>();

  // Notifications
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  // Calculations
  const total = useMemo(() => calculateTotal(subtotal, discountTotal), [subtotal, discountTotal]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProducts.forEach(product => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [filteredProducts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to clear cart
      if (e.key === 'Escape' && cart.length > 0) {
        // Clear cart logic handled in Cart component
      }
      // Enter to checkout (when cart has items and shift is active)
      if (e.key === 'Enter' && cart.length > 0 && activeShift && !paymentDialogOpen && !receiptDialogOpen) {
        e.preventDefault();
        setPaymentDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, activeShift, paymentDialogOpen, receiptDialogOpen]);

  // Handlers
  const handleCheckOut = async () => {
    const result = await checkOut();
    if (result) {
      setCheckOutDialogOpen(true);
    }
  };

  // Handle opening payment dialog
  const handleOpenPaymentDialog = () => {
    setPaymentDialogOpen(true);
  };

  // Handle Cash payment confirmation
  const handlePaymentConfirm = async (
    method: 'CASH',
    cash?: number,
    changeAmount?: number
  ) => {
    setPaymentMethod(method);
    setCashReceived(cash);
    setChange(changeAmount);

    const transaction = await createTransaction(
      cart,
      method,
      cash,
      changeAmount,
      activeShift
    );

    if (transaction) {
      // Add notification for successful payment
      addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: `Transaction ${transaction.transactionNumber} completed. Total: ${formatCurrency(transaction.total)}`,
      });

      clearCart();
      clearPromotions();
      setPaymentDialogOpen(false);
      setCashReceived(undefined);
      setChange(undefined);
      setReceiptDialogOpen(true);
      await loadActiveShift();
    }
  };

  const handleReceiptClose = () => {
    setReceiptDialogOpen(false);
    clearCompletedTransaction();
  };

  const handleLogout = async () => {
    // Clear cart and promotions before logout
    clearCart();
    clearPromotions();
    await logout();
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ShiftStatusBar
        user={user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        } : null}
        activeShift={activeShift}
        isOnline={isOnline}
        currentTime={currentTime}
        shiftTimeRemaining={getShiftTimeRemaining}
        checkInLoading={checkInLoading}
        checkOutLoading={checkOutLoading}
        onCheckIn={checkIn}
        onCheckOut={handleCheckOut}
        onHistoryClick={() => setHistoryDialogOpen(true)}
        onShiftsClick={() => navigate('/shifts')}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationAsRead={markAsRead}
        onMarkAllNotificationsAsRead={markAllAsRead}
        onClearAllNotifications={clearAll}
      />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1fr] lg:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 overflow-hidden">
        <div className="md:col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
          <ProductFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            categoryCounts={categoryCounts}
            totalProducts={filteredProducts.length}
          />
          <div className="flex-1 overflow-y-auto">
            <ProductGrid
              products={filteredProducts}
              loading={loading}
              cart={cart}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        <Cart
          cart={cart}
          subtotal={subtotal}
          total={total}
          appliedPromotions={appliedPromotions}
          discountTotal={discountTotal}
          activeShift={activeShift}
          onUpdateQty={updateCartItemQty}
          onRemove={removeFromCart}
          onClear={() => {
            clearCart();
            clearPromotions();
          }}
          onCheckout={handleOpenPaymentDialog}
        />
      </div>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={total}
        onConfirm={handlePaymentConfirm}
        processing={processing}
      />

      <ReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={handleReceiptClose}
        transaction={completedTransaction}
        userName={user?.name}
        subtotal={subtotal}
        discountTotal={discountTotal}
        total={total}
        paymentMethod={paymentMethod}
        cashReceived={cashReceived}
        change={change}
      />

      <CheckoutDialog
        open={checkOutDialogOpen}
        onOpenChange={setCheckOutDialogOpen}
        checkOutResult={checkOutResult}
      />

      <TransactionHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        activeShift={activeShift}
        userId={user?._id}
      />
    </div>
  );
}
