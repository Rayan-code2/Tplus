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
  Heart,
  Eye,
  LayoutGrid,
  List,
  Filter,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  BadgePercent,
  Check,
  ShoppingBag,
  Share2,
  RefreshCw,
  Gift,
  HelpCircle,
  ChevronDown,
  Menu,
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

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export const StoreView: React.FC<StoreViewProps> = ({
  currentUser,
  settings,
  products = [],
  productOrders = [],
  onBuyProduct,
  onOpenDeposit,
}) => {
  // Navigation & View Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh' | 'rating' | 'popular'>('featured');
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'myOrders' | 'wishlist'>('store');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Shopping Cart & Wishlist Local States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Hero Slider & Menu State
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);

  // Quick View / Detail Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string>('');
  const [quickViewColor, setQuickViewColor] = useState<string>('');
  const [quickViewQty, setQuickViewQty] = useState<number>(1);
  const [quickViewTab, setQuickViewTab] = useState<'overview' | 'specs' | 'reviews'>('overview');

  // Checkout Modal State (Single or Cart)
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQty, setCheckoutQty] = useState<number>(1);
  const [checkoutSize, setCheckoutSize] = useState<string>('');
  const [checkoutColor, setCheckoutColor] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<ProductOrder | null>(null);

  // Cart Bulk Checkout State
  const [isCartCheckingOut, setIsCartCheckingOut] = useState(false);
  const [cartCheckoutSuccess, setCartCheckoutSuccess] = useState(false);

  // Auto lock scroll on open modals/drawers
  useEffect(() => {
    if (quickViewProduct || checkoutProduct || isCartOpen) {
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
      };
    }
  }, [quickViewProduct, checkoutProduct, isCartOpen]);

  // Hero Carousel Banners Data (Dynamic from Admin Settings with fallback)
  const configuredBanners = (settings?.heroBanners || []).filter((b) => b.enabled !== false);
  const heroSlides = configuredBanners.length > 0
    ? configuredBanners.map((b, i) => {
        const colorGradients = [
          { tagColor: 'border-cyan-500/40 text-cyan-300', btnGradient: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' },
          { tagColor: 'border-amber-500/40 text-amber-300', btnGradient: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' },
          { tagColor: 'border-emerald-500/40 text-emerald-300', btnGradient: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
          { tagColor: 'border-purple-500/40 text-purple-300', btnGradient: 'from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' },
        ];
        const style = colorGradients[i % colorGradients.length];
        return {
          badge: b.badge || 'OFFICIAL PROMO • TETHER MART',
          title: b.title || 'Exclusive Web3 Offer',
          subtitle: b.subtitle || 'Discover premium items with instant USDT rewards and global shipping.',
          discount: b.discount || 'SPECIAL OFFER',
          cta: b.cta || 'Shop Now',
          category: b.category || 'All',
          image: b.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          tagColor: style.tagColor,
          btnGradient: style.btnGradient,
        };
      })
    : [
        {
          badge: 'OFFICIAL CYBER MALL • TETHER MART',
          title: 'Next-Gen DePIN & Web3 Mining Rigs',
          subtitle: 'Equip your Web3 node with top-tier ASIC miners, hardware cold wallets, and crypto security gadgets with instant USDT rewards.',
          discount: 'UP TO 35% OFF',
          cta: 'Explore DePIN Rigs',
          category: 'Mining Hardware',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          tagColor: 'border-cyan-500/40 text-cyan-300',
          btnGradient: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
        },
        {
          badge: 'NEW ARRIVALS • WEB3 APPAREL',
          title: 'TetherMart Official Cyberpunk Merch',
          subtitle: 'Exclusive hoodies, embroidered polo tees & custom cap collections crafted with premium cotton blends.',
          discount: 'BUY 1 GET 1 20% OFF',
          cta: 'Shop Web3 Apparel',
          category: 'Apparel & Merch',
          image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
          tagColor: 'border-amber-500/40 text-amber-300',
          btnGradient: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        },
        {
          badge: 'MILITARY-GRADE COLD STORAGE',
          title: 'Unhackable Hardware Wallets & Vaults',
          subtitle: 'Keep your USDT, Bitcoin & Ethereum bulletproof with certified offline storage devices & physical seed cards.',
          discount: 'FREE EXPRESS AIR SHIPPING',
          cta: 'Explore Cold Storage',
          category: 'Hardware Wallets',
          image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
          tagColor: 'border-emerald-500/40 text-emerald-300',
          btnGradient: 'from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        },
        {
          badge: 'HIGH-TECH CYBER GADGETS',
          title: 'DePIN Electronics & Smart Devices',
          subtitle: 'Encrypted communication gear, high-performance node power supplies, and Web3 smart electronics.',
          discount: 'EARN UP TO 50% REBATE',
          cta: 'Browse Gadgets',
          category: 'Gadgets',
          image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
          tagColor: 'border-purple-500/40 text-purple-300',
          btnGradient: 'from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        },
      ];

  // Auto Hero Slide Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const categories = [
    'All',
    'Hardware Wallets',
    'Mining Hardware',
    'Crypto Security',
    'Gadgets',
    'DePIN Electronics',
    'Apparel & Merch',
  ];

  // Filter & Sort Logic
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceLow') return a.priceUsdt - b.priceUsdt;
    if (sortBy === 'priceHigh') return b.priceUsdt - a.priceUsdt;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popular') return b.reviewsCount - a.reviewsCount;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const myOrders = productOrders.filter((o) => o.userId === currentUser.id);

  // Cart Management
  const handleAddToCart = (product: Product, size?: string, color?: string, qty: number = 1) => {
    const finalSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    const finalColor = color || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === finalSize && item.selectedColor === finalColor
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qty;
        return updated;
      }
      return [...prev, { product, quantity: qty, selectedSize: finalSize, selectedColor: finalColor }];
    });

    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotalUsdt = cartItems.reduce((acc, item) => acc + item.product.priceUsdt * item.quantity, 0);

  // Wishlist Toggle
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };

  // Open Quick View Modal
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    setQuickViewColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
    setQuickViewQty(1);
    setQuickViewTab('overview');
  };

  // Single Item Direct Buy Now Modal Open
  const handleOpenCheckout = (product: Product, size?: string, color?: string, qty: number = 1) => {
    setCheckoutProduct(product);
    setCheckoutQty(qty);
    setCheckoutSize(size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''));
    setCheckoutColor(color || (product.colors && product.colors.length > 0 ? product.colors[0] : ''));
    setShippingAddress(`${currentUser.name}, Node #${currentUser.nodeId}, Web3 Delivery Address`);
    setCheckoutSuccess(null);
  };

  // Single Item Purchase Confirm
  const handleConfirmPurchase = async () => {
    if (!checkoutProduct) return;
    setIsSubmitting(true);
    try {
      await onBuyProduct(
        checkoutProduct.id,
        checkoutQty,
        shippingAddress,
        checkoutSize || undefined,
        checkoutColor || undefined
      );
      setCheckoutSuccess({
        id: `ord-${Date.now()}`,
        userId: currentUser.id,
        userNodeId: currentUser.nodeId,
        userName: currentUser.name,
        productId: checkoutProduct.id,
        productTitle: checkoutProduct.title,
        productImage: checkoutProduct.image,
        priceUsdt: checkoutProduct.priceUsdt,
        quantity: checkoutQty,
        selectedSize: checkoutSize || undefined,
        selectedColor: checkoutColor || undefined,
        totalUsdt: checkoutProduct.priceUsdt * checkoutQty,
        shippingAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      // Remove from cart if present
      setCartItems((prev) => prev.filter((i) => i.product.id !== checkoutProduct.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart Bulk Purchase Confirm
  const handleConfirmCartCheckout = async () => {
    if (cartItems.length === 0) return;
    if (currentUser.upgradeBalance < cartTotalUsdt) return;

    setIsCartCheckingOut(true);
    const addressToUse = shippingAddress || `${currentUser.name}, Node #${currentUser.nodeId}, Web3 Delivery Address`;

    try {
      for (const item of cartItems) {
        await onBuyProduct(
          item.product.id,
          item.quantity,
          addressToUse,
          item.selectedSize,
          item.selectedColor
        );
      }
      setCartItems([]);
      setCartCheckoutSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCartCheckingOut(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 pb-12">
      {/* 1. TOP QUICK ACTION ICON BAR & SHOPPING FUND */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xl relative font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Shopping Fund Balance */}
          <div className="bg-[#050911] border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Shopping Fund:
            </div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
              <span>${currentUser.upgradeBalance.toFixed(2)}</span>
              <span className="text-[9px] text-amber-400 font-normal">USDT</span>
            </div>
          </div>

          {/* Small Icon Navigation Buttons (My Orders, Saved, My Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar w-full sm:w-auto justify-end">
            {/* 1. My Orders Icon Button */}
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'myOrders' ? 'store' : 'myOrders')}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'myOrders'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-[#050911] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <PackageCheck className={`w-3.5 h-3.5 ${activeSubTab === 'myOrders' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className="text-[11px] sm:text-xs">My Orders</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
                {myOrders.length}
              </span>
            </button>

            {/* 2. Saved / Wishlist Icon Button */}
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'wishlist' ? 'store' : 'wishlist')}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'wishlist'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-[#050911] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
              <span className="text-[11px] sm:text-xs">Saved</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px]">
                {wishlist.length}
              </span>
            </button>

            {/* 3. My Cart Icon Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition border border-cyan-400/30"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-cyan-200" />
              <span className="text-[11px] sm:text-xs">Cart</span>
              <span className="bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.2 rounded-full">
                {cartItems.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUMMY PROMO HERO BANNER SLIDER BOX (NO DYNAMIC PRODUCT DATA FETCHING) */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 lg:h-80 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.18)] bg-[#050911] group">
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentHeroSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Background Dummy Promo Banner Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
            />

            {/* Dark Aesthetic Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Banner Content (Badge, Title, Subtitle, Discount, CTA) */}
            <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between z-10 font-mono">
              {/* Top Row: Badge & Discount Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-lg border text-[10px] sm:text-xs font-bold uppercase tracking-wider ${slide.tagColor}`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{slide.badge}</span>
                </div>
                <div className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg">
                  {slide.discount}
                </div>
              </div>

              {/* Bottom Row: Title, Subtitle & Action Button */}
              <div className="space-y-2 max-w-xl">
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-sans">
                  {slide.subtitle}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(slide.category);
                      setActiveSubTab('store');
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${slide.btnGradient}`}
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Previous / Next Slide Controls */}
        <button
          type="button"
          onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow-lg text-lg font-bold"
          title="Previous Banner"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow-lg text-lg font-bold"
          title="Next Banner"
        >
          ›
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentHeroSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentHeroSlide === idx
                  ? 'w-5 bg-cyan-400'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* MAIN STORE CONTENT VIEW */}



      {/* 4. MAIN STORE CONTENT VIEW */}
      {activeSubTab === 'store' && (
        <div className="space-y-6">
          {/* E-Commerce Search & Filter Toolbar */}
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 font-mono text-xs">
            {/* Search Box */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, wallets, ASIC miners, apparel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050911] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting & Layout Grid Options */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="featured">Featured First</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap border transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-102'
                    : 'bg-[#0b1320] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* E-COMMERCE PRODUCTS GRID / LIST */}
          {sortedProducts.length === 0 ? (
            <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-12 text-center space-y-3 font-mono">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No products match your search</h3>
              <p className="text-xs text-slate-500">Try adjusting your category filter or search keywords.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl hover:bg-slate-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
              {sortedProducts.map((product) => {
                const inrPrice = product.priceInr || product.priceUsdt * (settings.rates.usdtToInr || 100);
                const isOutOfStock = product.stock <= 0;
                const isSaved = wishlist.includes(product.id);
                const originalPrice = (product.priceUsdt * 1.25).toFixed(0); // Display 20% original price strikethrough

                return (
                  <div
                    key={product.id}
                    className="bg-[#0b1320] border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] relative"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative aspect-square bg-[#050911] overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                        />

                        {/* Top Left Badges */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
                          {product.badge && (
                            <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500 text-black font-mono font-black text-[8px] sm:text-[10px] uppercase rounded-md sm:rounded-lg shadow-lg">
                              {product.badge}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white font-mono font-bold text-[8px] sm:text-[9px] uppercase rounded-md shadow-md">
                            20% OFF
                          </span>
                        </div>

                        {/* Top Right Wishlist & Quick View Overlay Buttons */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-md border transition ${
                              isSaved
                                ? 'bg-rose-500 text-white border-rose-400 shadow-lg'
                                : 'bg-black/60 text-slate-300 border-white/10 hover:text-white hover:bg-black/80'
                            }`}
                            title={isSaved ? 'Remove from Saved' : 'Save to Wishlist'}
                          >
                            <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQuickView(product)}
                            className="p-1.5 sm:p-2 bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 rounded-lg sm:rounded-xl hover:text-cyan-300 hover:bg-black/80 transition"
                            title="Quick View Details"
                          >
                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>

                        {/* Category Tag Bottom Right */}
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-black/75 backdrop-blur-md px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-mono text-slate-300 border border-white/10 truncate max-w-[85%]">
                          {product.category}
                        </div>
                      </div>

                      {/* Info & Metadata */}
                      <div className="p-2.5 sm:p-4 space-y-2">
                        {/* Rating & Stock */}
                        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
                            <span className="font-bold">{product.rating.toFixed(1)}</span>
                            <span className="text-slate-500 text-[9px] sm:text-[10px]">({product.reviewsCount})</span>
                          </div>

                          <span
                            className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                              isOutOfStock
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : product.stock <= 5
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isOutOfStock ? 'Out' : `${product.stock} left`}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3
                            onClick={() => handleOpenQuickView(product)}
                            className="font-bold text-white text-xs sm:text-sm line-clamp-1 hover:text-cyan-300 cursor-pointer transition"
                          >
                            {product.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed hidden xs:block">
                            {product.description}
                          </p>
                        </div>

                        {/* Variants Badges (Sizes / Colors preview) */}
                        {((product.sizes && product.sizes.length > 0) ||
                          (product.colors && product.colors.length > 0)) && (
                          <div className="hidden sm:flex flex-wrap gap-1 font-mono text-[9.5px]">
                            {product.sizes && product.sizes.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 rounded">
                                Size: {product.sizes.slice(0, 3).join(', ')}
                                {product.sizes.length > 3 ? '+' : ''}
                              </span>
                            )}
                            {product.colors && product.colors.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/30 text-amber-300 rounded">
                                Color: {product.colors.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="p-2.5 sm:p-4 pt-0 border-t border-slate-800/80 mt-1 space-y-2">
                      <div className="flex flex-col xs:flex-row xs:items-baseline justify-between font-mono pt-1">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-lg font-black text-emerald-400">${product.priceUsdt}</span>
                            <span className="text-[9px] sm:text-[10px] text-emerald-500 font-bold">USDT</span>
                            <span className="text-[10px] sm:text-xs text-slate-500 line-through">${originalPrice}</span>
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400">
                            ≈ ₹{inrPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* E-Commerce Dual Buttons: Add to Cart + Buy Now */}
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] sm:text-xs">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product)}
                          className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl font-bold border flex items-center justify-center gap-1 transition ${
                            isOutOfStock
                              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500/50'
                          }`}
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                          <span>+ Cart</span>
                        </button>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleOpenCheckout(product)}
                          className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1 transition ${
                            isOutOfStock
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          }`}
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW LAYOUT */
            <div className="space-y-4">
              {sortedProducts.map((product) => {
                const inrPrice = product.priceInr || product.priceUsdt * (settings.rates.usdtToInr || 100);
                const isOutOfStock = product.stock <= 0;
                const isSaved = wishlist.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-[#0b1320] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-cyan-500/40 transition duration-300"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-xl border border-slate-800 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <h3 className="font-bold text-white text-base hover:text-cyan-300 cursor-pointer" onClick={() => handleOpenQuickView(product)}>
                          {product.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">{product.description}</p>

                        <div className="text-[11px] font-mono text-slate-500">
                          Stock: <span className="text-emerald-400 font-bold">{product.stock} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 font-mono border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-400">${product.priceUsdt} USDT</div>
                        <div className="text-[10px] text-slate-400">≈ ₹{inrPrice.toLocaleString('en-IN')} INR</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className={`p-2 rounded-xl border ${isSaved ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-[#050911] border-slate-800 text-slate-400'}`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-500 rounded-xl text-xs font-bold"
                        >
                          + Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(product)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl text-xs"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. WISHLIST / SAVED TAB */}
      {activeSubTab === 'wishlist' && (
        <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-mono">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>My Saved Items Wishlist</span>
              </h2>
              <p className="text-xs text-slate-400">Products you have bookmarked for future purchases</p>
            </div>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold">
              {wishlist.length} Saved Items
            </span>
          </div>

          {wishlist.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-3">
              <Heart className="w-10 h-10 text-slate-600 mx-auto" />
              <p>Your wishlist is currently empty.</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('store')}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl font-bold"
              >
                Browse Store Products →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter((p) => wishlist.includes(p.id))
                .map((product) => (
                  <div key={product.id} className="bg-[#050911] border border-slate-800 rounded-xl p-3 flex gap-3">
                    <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-bold text-white line-clamp-1">{product.title}</div>
                      <div className="text-xs font-black text-emerald-400">${product.priceUsdt} USDT</div>
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded font-bold hover:bg-cyan-500/30"
                        >
                          + Add Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 6. MY ORDER HISTORY TAB */}
      {activeSubTab === 'myOrders' && (
        <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between font-mono pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-400" />
                <span>My Mall Order History</span>
              </h2>
              <p className="text-xs text-slate-400">Track shipment status, node delivery addresses, and receipts</p>
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
            <div className="space-y-4 font-mono">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#050911] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white line-clamp-1">{order.productTitle}</div>
                      <div className="text-[11px] text-slate-400">
                        Qty: <b className="text-white">{order.quantity}</b> • Paid: <span className="text-emerald-400 font-bold">${order.totalUsdt} USDT</span>
                      </div>

                      {(order.selectedSize || order.selectedColor) && (
                        <div className="flex items-center gap-2 text-[10px]">
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

                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[280px]">{order.shippingAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status & Progress Bar */}
                  <div className="flex flex-col items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
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

                    <div className="text-[10px] text-slate-500 text-right">
                      <div>Order Date: {new Date(order.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. QUICK VIEW PRODUCT DETAIL MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 font-sans">
          <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
            <div className="bg-[#0c1524] border border-cyan-500/40 rounded-2xl w-full max-w-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative my-auto">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="space-y-3">
                  <div className="aspect-square bg-[#050911] border border-slate-800 rounded-2xl overflow-hidden relative">
                    <img src={quickViewProduct.image} alt={quickViewProduct.title} className="w-full h-full object-cover" />
                    {quickViewProduct.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-black font-mono font-black text-[10px] uppercase rounded-lg">
                        {quickViewProduct.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Details & Selection */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800 font-bold">
                        {quickViewProduct.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold">{quickViewProduct.rating.toFixed(1)}</span>
                        <span className="text-slate-500">({quickViewProduct.reviewsCount} reviews)</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">{quickViewProduct.title}</h2>

                    <div className="font-mono">
                      <div className="text-2xl font-black text-emerald-400">${quickViewProduct.priceUsdt} USDT</div>
                      <div className="text-xs text-slate-400">
                        ≈ ₹{(quickViewProduct.priceInr || quickViewProduct.priceUsdt * 100).toLocaleString('en-IN')} INR
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{quickViewProduct.description}</p>

                    {/* Size Selector */}
                    {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                      <div className="space-y-1.5 font-mono text-xs">
                        <label className="text-slate-400 font-bold">Select Size:</label>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.sizes.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setQuickViewSize(sz)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                quickViewSize === sz
                                  ? 'bg-cyan-500 text-black font-black'
                                  : 'bg-slate-900 border border-slate-700 text-slate-300'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Selector */}
                    {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                      <div className="space-y-1.5 font-mono text-xs">
                        <label className="text-slate-400 font-bold">Select Color:</label>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.colors.map((clr) => (
                            <button
                              key={clr}
                              type="button"
                              onClick={() => setQuickViewColor(clr)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                quickViewColor === clr
                                  ? 'bg-amber-500 text-black font-black'
                                  : 'bg-slate-900 border border-slate-700 text-slate-300'
                              }`}
                            >
                              {clr}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Picker */}
                    <div className="space-y-1 font-mono text-xs">
                      <label className="text-slate-400 font-bold">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                          className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-white">{quickViewQty}</span>
                        <button
                          type="button"
                          onClick={() => setQuickViewQty(Math.min(quickViewProduct.stock, quickViewQty + 1))}
                          className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
                    <button
                      type="button"
                      disabled={quickViewProduct.stock <= 0}
                      onClick={() => {
                        handleAddToCart(quickViewProduct, quickViewSize, quickViewColor, quickViewQty);
                        setQuickViewProduct(null);
                      }}
                      className="py-3 bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      disabled={quickViewProduct.stock <= 0}
                      onClick={() => {
                        const prd = quickViewProduct;
                        const sz = quickViewSize;
                        const clr = quickViewColor;
                        const qty = quickViewQty;
                        setQuickViewProduct(null);
                        handleOpenCheckout(prd, sz, clr, qty);
                      }}
                      className="py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>Buy Now (${(quickViewProduct.priceUsdt * quickViewQty).toFixed(2)})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SHOPPING CART SLIDE-OVER DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end font-mono">
          <div className="bg-[#0c1524] border-l border-cyan-500/30 w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative p-5 space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Shopping Cart ({cartItems.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            {cartCheckoutSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Cart Order Placed!</h4>
                <p className="text-xs text-slate-300 max-w-xs">
                  All items in your cart have been successfully processed using your Shopping Fund Wallet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCartCheckoutSuccess(false);
                    setIsCartOpen(false);
                    setActiveSubTab('myOrders');
                  }}
                  className="px-5 py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition"
                >
                  View My Order History →
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600" />
                <p className="text-xs">Your shopping cart is empty.</p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-cyan-400 font-bold text-xs rounded-xl"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="bg-[#050911] border border-slate-800 rounded-xl p-3 flex gap-3 relative">
                    <img src={item.product.image} alt={item.product.title} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-bold text-white line-clamp-1">{item.product.title}</div>
                      <div className="text-xs font-black text-emerald-400">${item.product.priceUsdt} USDT</div>

                      {(item.selectedSize || item.selectedColor) && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          {item.selectedSize && <span>Size: <b className="text-cyan-300">{item.selectedSize}</b></span>}
                          {item.selectedColor && <span>Color: <b className="text-amber-300">{item.selectedColor}</b></span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(idx, item.quantity - 1)}
                            className="w-6 h-6 bg-slate-800 rounded text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(idx, item.quantity + 1)}
                            className="w-6 h-6 bg-slate-800 rounded text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(idx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary & Checkout */}
            {!cartCheckoutSuccess && cartItems.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Cart Items ({cartItems.length}):</span>
                    <span>${cartTotalUsdt.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping:</span>
                    <span className="text-emerald-400 font-bold">FREE Express</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-800">
                    <span>Shopping Fund Balance:</span>
                    <span>${currentUser.upgradeBalance.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-white font-black text-sm pt-1">
                    <span>Total Payable:</span>
                    <span className="text-emerald-400">${cartTotalUsdt.toFixed(2)} USDT</span>
                  </div>
                </div>

                {currentUser.upgradeBalance < cartTotalUsdt && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-[11px] flex justify-between items-center">
                    <span>Insufficient Shopping Balance</span>
                    <button type="button" onClick={onOpenDeposit} className="underline text-emerald-400 font-bold">
                      Top Up
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isCartCheckingOut || currentUser.upgradeBalance < cartTotalUsdt}
                  onClick={handleConfirmCartCheckout}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition ${
                    isCartCheckingOut || currentUser.upgradeBalance < cartTotalUsdt
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg'
                  }`}
                >
                  {isCartCheckingOut ? (
                    <span>Processing Cart Order...</span>
                  ) : (
                    <span>Checkout All Items (${cartTotalUsdt.toFixed(2)} USDT)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. SINGLE PRODUCT DIRECT CHECKOUT MODAL */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
          <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
            <div className="bg-[#0c1524] border border-cyan-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative my-auto">
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {checkoutSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Order Confirmed!</h3>
                  <p className="text-xs text-slate-300">
                    Your purchase of <span className="text-emerald-400 font-bold">{checkoutProduct.title}</span> was successful! Order details have been submitted to admin for priority dispatch.
                  </p>
                  <div className="p-3 bg-[#050911] border border-slate-800 rounded-xl text-left text-xs space-y-1">
                    <div className="text-slate-400">
                      Total Paid: <span className="text-emerald-400 font-bold">${checkoutSuccess.totalUsdt} USDT</span>
                    </div>
                    <div className="text-slate-400">
                      Delivery Node: <span className="text-slate-200">{checkoutSuccess.shippingAddress}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutProduct(null);
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
                      <h3 className="font-bold text-white text-sm">TetherMart Checkout Order</h3>
                      <p className="text-[11px] text-slate-400">Pay directly using your node withdrawable balance</p>
                    </div>
                  </div>

                  {/* Product Summary */}
                  <div className="flex gap-3 bg-[#050911] border border-slate-800 rounded-xl p-3">
                    <img
                      src={checkoutProduct.image}
                      alt={checkoutProduct.title}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{checkoutProduct.title}</div>
                      <div className="text-xs font-black text-emerald-400 mt-1">${checkoutProduct.priceUsdt} USDT</div>
                      <div className="text-[10px] text-slate-500">In stock: {checkoutProduct.stock} items</div>
                    </div>
                  </div>

                  {/* SIZE SELECTOR */}
                  {checkoutProduct.sizes && checkoutProduct.sizes.length > 0 && (
                    <div className="space-y-1.5 bg-[#050911] border border-cyan-500/20 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                          Select Size (Required)
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Selected: <b className="text-white">{checkoutSize || 'None'}</b>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {checkoutProduct.sizes.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setCheckoutSize(sz)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition ${
                              checkoutSize === sz
                                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border border-cyan-400 shadow-md scale-105'
                                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLOR SELECTOR */}
                  {checkoutProduct.colors && checkoutProduct.colors.length > 0 && (
                    <div className="space-y-1.5 bg-[#050911] border border-amber-500/20 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                          Select Color Option
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Selected: <b className="text-white">{checkoutColor || 'None'}</b>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {checkoutProduct.colors.map((clr) => (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => setCheckoutColor(clr)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition ${
                              checkoutColor === clr
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-300 shadow-md scale-105'
                                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
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
                        onClick={() => setCheckoutQty(Math.max(1, checkoutQty - 1))}
                        className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="font-bold text-white text-sm px-3">{checkoutQty}</span>
                      <button
                        type="button"
                        onClick={() => setCheckoutQty(Math.min(checkoutProduct.stock, checkoutQty + 1))}
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
                      <span>${checkoutProduct.priceUsdt} USDT</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Quantity:</span>
                      <span>x{checkoutQty}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>Shopping Fund Balance:</span>
                      <span>${currentUser.upgradeBalance.toFixed(2)} USDT</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                      <span>Total Payable:</span>
                      <span className="text-amber-400">${(checkoutProduct.priceUsdt * checkoutQty).toFixed(2)} USDT</span>
                    </div>
                  </div>

                  {/* Insufficient shopping balance alert */}
                  {currentUser.upgradeBalance < checkoutProduct.priceUsdt * checkoutQty && (
                    <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Insufficient Shopping Fund Wallet</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutProduct(null);
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
                    disabled={isSubmitting || currentUser.upgradeBalance < checkoutProduct.priceUsdt * checkoutQty}
                    onClick={handleConfirmPurchase}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition ${
                      isSubmitting || currentUser.upgradeBalance < checkoutProduct.priceUsdt * checkoutQty
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Pay ${(checkoutProduct.priceUsdt * checkoutQty).toFixed(2)} USDT</span>
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
