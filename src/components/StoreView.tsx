import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  PackageCheck,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  SlidersHorizontal,
  ChevronRight,
  Truck,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import { Product, ProductOrder, User, SystemSettings } from '../types';

interface StoreViewProps {
  currentUser: User;
  settings: SystemSettings;
  products: Product[];
  productOrders: ProductOrder[];
  onBuyProduct: (
    productId: string,
    quantity: number,
    address: string,
    selectedSize?: string,
    selectedColor?: string
  ) => Promise<void>;
  onOpenDeposit: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  currentUser,
  settings,
  products = [],
  productOrders = [],
  onBuyProduct,
  onOpenDeposit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh' | 'rating'>('featured');
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'myOrders'>('store');

  // Checkout modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<ProductOrder | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [selectedProduct]);

  const categories = ['All', 'Hardware Wallets', 'Mining Hardware', 'Crypto Security', 'Gadgets', 'DePIN Electronics', 'Apparel & Merch'];

  // Filter & Sort
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceLow') return a.priceUsdt - b.priceUsdt;
    if (sortBy === 'priceHigh') return b.priceUsdt - a.priceUsdt;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const myOrders = productOrders.filter((o) => o.userId === currentUser.id);

  const handleOpenCheckout = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
    setShippingAddress(`${currentUser.name}, Node #${currentUser.nodeId}, Web3 Delivery Address`);
    setCheckoutSuccess(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await onBuyProduct(
        selectedProduct.id,
        quantity,
        shippingAddress,
        selectedSize || undefined,
        selectedColor || undefined
      );
      setCheckoutSuccess({
        id: `ord-temp`,
        userId: currentUser.id,
        userNodeId: currentUser.nodeId,
        userName: currentUser.name,
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productImage: selectedProduct.image,
        priceUsdt: selectedProduct.priceUsdt,
        quantity,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
        totalUsdt: selectedProduct.priceUsdt * quantity,
        shippingAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner - Amazon Cyber Mall Header */}
      <div className="bg-gradient-to-r from-[#0c192d] via-[#10203b] to-[#081222] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AMAZON CYBER MALL • WEB3 MARKETPLACE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              TetherPlus Official Mall
            </h1>
            <p className="text-slate-300 text-xs max-w-xl">
              Buy hardware wallets, mining rigs, gadgets & official apparel directly using your Upgrade / Marketing Fund Wallet. (Main Wallet is reserved exclusively for withdrawals).
            </p>
          </div>

          {/* User Available Balance Pill */}
          <div className="bg-[#050911]/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-3 font-mono">
            <div className="space-y-1">
              <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <span>Upgrade Fund Wallet (Mall & Marketing):</span>
                <span className="text-white text-xs font-black">${currentUser.upgradeBalance.toFixed(2)} USDT</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>Main Wallet (For Withdrawals Only):</span>
                <span className="text-emerald-300 font-bold">${currentUser.balance.toFixed(2)} USDT</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
            >
              + Deposit
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Browse Store vs My Orders */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('store')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeSubTab === 'store'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Browse Products ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('myOrders')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeSubTab === 'myOrders'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>My Orders ({myOrders.length})</span>
          </button>
        </div>
      </div>

      {/* STORE VIEW TAB */}
      {activeSubTab === 'store' && (
        <div className="space-y-6">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, wallets, GPUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050911] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="featured">Featured First</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap border transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-[#0b1320] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          {sortedProducts.length === 0 ? (
            <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-12 text-center space-y-3 font-mono">
              <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No products found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search terms or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => {
                const inrPrice = product.priceInr || product.priceUsdt * (settings.rates.usdtToInr || 90);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="bg-[#0b1320] border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
                  >
                    <div>
                      {/* Image Container with Badge */}
                      <div className="relative aspect-video bg-[#050911] overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.badge && (
                            <span className="px-2.5 py-1 bg-amber-500/90 text-black font-mono font-black text-[10px] uppercase rounded-full shadow-lg">
                              {product.badge}
                            </span>
                          )}
                          {product.featured && (
                            <span className="px-2.5 py-1 bg-cyan-500/90 text-black font-mono font-black text-[10px] uppercase rounded-full shadow-lg">
                              Amazon Choice
                            </span>
                          )}
                        </div>

                        {/* Category Label */}
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[10px] font-mono text-slate-300">
                          {product.category}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-5 space-y-3">
                        {/* Rating & Stock */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="font-bold">{product.rating.toFixed(1)}</span>
                            <span className="text-slate-500 text-[10px]">({product.reviewsCount})</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOutOfStock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition">
                            {product.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {product.description}
                          </p>

                          {/* Sizes / Colors Pills Preview (Only shown if product has sizes/colors) */}
                          {((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                              {product.sizes && product.sizes.length > 0 && (
                                <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-md">
                                  <span className="font-bold text-slate-400">Sizes:</span>
                                  <span>{product.sizes.join(', ')}</span>
                                </div>
                              )}
                              {product.colors && product.colors.length > 0 && (
                                <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">
                                  <span className="font-bold text-slate-400">Colors:</span>
                                  <span>{product.colors.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Button Footer */}
                    <div className="p-5 pt-0 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-emerald-400 font-mono">
                          ${product.priceUsdt} <span className="text-xs font-bold text-emerald-500">USDT</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ≈ ₹{inrPrice.toLocaleString('en-IN')} INR
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleOpenCheckout(product)}
                        className={`px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition ${
                          isOutOfStock
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY ORDERS SUB-TAB */}
      {activeSubTab === 'myOrders' && (
        <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between font-mono pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">My Mall Order History</h2>
              <p className="text-xs text-slate-400">Track shipping, delivery status, and invoice receipt</p>
            </div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold">
              {myOrders.length} Total Orders
            </span>
          </div>

          {myOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-2">
              <PackageCheck className="w-8 h-8 mx-auto text-slate-600" />
              <p>You have not placed any orders yet.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('store')}
                className="mt-2 text-cyan-400 font-bold hover:underline"
              >
                Browse Store Products →
              </button>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#050911] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="w-14 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{order.productTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Qty: {order.quantity} • Total: <span className="text-emerald-400 font-bold">${order.totalUsdt} USDT</span>
                      </div>
                      {(order.selectedSize || order.selectedColor) && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          {order.selectedSize && (
                            <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded">
                              Size: <b>{order.selectedSize}</b>
                            </span>
                          )}
                          {order.selectedColor && (
                            <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500/40 text-amber-300 rounded">
                              Color: <b>{order.selectedColor}</b>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[250px]">{order.shippingAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <div className="text-[10px] text-slate-500">
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : order.status === 'shipped'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : order.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
          <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
            <div className="bg-[#0c1524] border border-cyan-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_40px_rgba(6,182,212,0.2)] relative my-auto">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Order Confirmed!</h3>
                <p className="text-xs text-slate-300">
                  Your purchase of <span className="text-emerald-400 font-bold">{selectedProduct.title}</span> was successful! Order details have been submitted to admin for priority shipping.
                </p>
                <div className="p-3 bg-[#050911] border border-slate-800 rounded-xl text-left text-xs space-y-1">
                  <div className="text-slate-400">Total Deducted: <span className="text-emerald-400 font-bold">${checkoutSuccess.totalUsdt} USDT</span></div>
                  <div className="text-slate-400">Shipping Address: <span className="text-slate-200">{checkoutSuccess.shippingAddress}</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setActiveSubTab('myOrders');
                  }}
                  className="w-full py-2.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl hover:bg-cyan-400 transition"
                >
                  View My Orders →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Amazon Checkout Order</h3>
                    <p className="text-[11px] text-slate-400">Pay directly using your node withdrawable balance</p>
                  </div>
                </div>

                {/* Product Summary */}
                <div className="flex gap-3 bg-[#050911] border border-slate-800 rounded-xl p-3">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white line-clamp-1">{selectedProduct.title}</div>
                    <div className="text-xs font-black text-emerald-400 mt-1">${selectedProduct.priceUsdt} USDT</div>
                    <div className="text-[10px] text-slate-500">In stock: {selectedProduct.stock} items</div>
                  </div>
                </div>

                {/* SIZE SELECTOR (Only shown if product has size options like Shirts/Apparel) */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-1.5 bg-[#050911] border border-cyan-500/20 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                        Select Size (Required)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Selected: <b className="text-white">{selectedSize || 'None'}</b>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedProduct.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition ${
                            selectedSize === sz
                              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-105'
                              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* COLOR SELECTOR (Only shown if product has color options) */}
                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="space-y-1.5 bg-[#050911] border border-amber-500/20 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                        Select Color Option
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Selected: <b className="text-white">{selectedColor || 'None'}</b>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedProduct.colors.map((clr) => (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => setSelectedColor(clr)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition ${
                            selectedColor === clr
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-105'
                              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {clr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity input */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="font-bold text-white text-sm px-3">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                      className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shipping address input */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-bold">Shipping Address</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter full shipping address & pin code..."
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="bg-[#050911]/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Price:</span>
                    <span>${selectedProduct.priceUsdt} USDT</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Quantity:</span>
                    <span>x{quantity}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Upgrade Fund Balance:</span>
                    <span>${currentUser.upgradeBalance.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Main Wallet (Withdrawal Only):</span>
                    <span>${currentUser.balance.toFixed(2)} USDT</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                    <span>Total Payable:</span>
                    <span className="text-amber-400">${(selectedProduct.priceUsdt * quantity).toFixed(2)} USDT</span>
                  </div>
                </div>

                {/* Insufficient upgrade balance alert */}
                {currentUser.upgradeBalance < selectedProduct.priceUsdt * quantity && (
                  <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Insufficient Upgrade Fund Wallet</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          onOpenDeposit();
                        }}
                        className="font-bold underline text-emerald-400 text-[11px]"
                      >
                        Deposit / Top Up
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Mall orders are paid via Upgrade / Marketing Fund. Main Wallet (${currentUser.balance.toFixed(2)} USDT) is reserved for withdrawals.
                    </p>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  type="button"
                  disabled={isSubmitting || currentUser.upgradeBalance < selectedProduct.priceUsdt * quantity}
                  onClick={handleConfirmPurchase}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition ${
                    isSubmitting || currentUser.upgradeBalance < selectedProduct.priceUsdt * quantity
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Pay ${(selectedProduct.priceUsdt * quantity).toFixed(2)} USDT</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
