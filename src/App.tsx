import React, { useState, useEffect } from 'react';
import {
  User,
  SystemSettings,
  DepositRequest,
  WithdrawalRequest,
  BoostingEntry,
  Transaction,
  SpinReward,
  Product,
  ProductOrder,
} from './types';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { MatrixTreeView } from './components/MatrixTreeView';
import { FinanceView } from './components/FinanceView';
import { GamificationView } from './components/GamificationView';
import { RankRewardsView } from './components/RankRewardsView';
import { StoreView } from './components/StoreView';
import { LuckyDrawView } from './components/LuckyDrawView';
import { ColorPredictionView } from './components/ColorPredictionView';
import { DragonTigerView } from './components/DragonTigerView';
import { AviatorView } from './components/AviatorView';
import { CricketFantasyView } from './components/CricketFantasyView';
import { Slot777View } from './components/Slot777View';
import { RummyView } from './components/RummyView';
import { ChickenRoadView } from './components/ChickenRoadView';
import { ReferralAgencyView } from './components/ReferralAgencyView';
import { AdminPanel } from './components/AdminPanel';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { DailyTournamentModal } from './components/DailyTournamentModal';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/AuthView';
import { PaymentGatewayView } from './components/PaymentGatewayView';
import { VipPrivilegeView } from './components/VipPrivilegeView';
import { AdminPortalLogin } from './components/AdminPortalLogin';
import { AlertCircle, CheckCircle2, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';
import { detectRouteFromLocation, navigateToAppTab, isGameEnabled, isGameRouteTab, GAME_SUBDOMAIN_LIST, resolveMainLobbyUrl } from './utils/subdomainRouter';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [boostingQueue, setBoostingQueue] = useState<BoostingEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);

  const initialRoute = detectRouteFromLocation();
  const [activeTab, setActiveTab] = useState<string>(initialRoute.isAdminSubdomain ? 'admin' : (initialRoute.activeTab === 'admin' ? 'dashboard' : initialRoute.activeTab) || 'dashboard');
  const [isAdminView, setIsAdminView] = useState<boolean>(initialRoute.isAdminSubdomain);
  const [isAdminPortalAuthed, setIsAdminPortalAuthed] = useState<boolean>(false);
  const [isAuthPage, setIsAuthPage] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);
  const [gatewayAmount, setGatewayAmount] = useState<number>(500);

  // Toast Banner State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch Full App State from Backend Server
  const getStoredUserId = () => localStorage.getItem('tp_user_id') || '';

  const fetchState = async () => {
    try {
      const storedId = getStoredUserId();
      const res = await fetch('/api/state?admin=true', {
        headers: {
          'x-user-id': storedId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const routeNow = detectRouteFromLocation();

        if (routeNow.isAdminSubdomain) {
          const verifiedAdminId = sessionStorage.getItem('sportx_admin_verified');
          const matchedAdmin = (data.users || []).find(
            (u: any) =>
              u.id === verifiedAdminId &&
              (u.isAdmin || u.isSuperAdmin || u.isSubAdmin || u.nodeId === 'NX-ROOT01')
          );
          if (matchedAdmin) {
            setCurrentUser(matchedAdmin);
            localStorage.setItem('tp_user_id', matchedAdmin.id);
            setIsAdminPortalAuthed(true);
            setIsAuthPage(false);
          } else {
            setIsAdminPortalAuthed(false);
          }
        } else if (storedId && data.currentUser) {
          setCurrentUser(data.currentUser);
          setIsAuthPage(false);
        } else if (!storedId) {
          const demoUser =
            (data.users || []).find((u: any) => u.nodeId === 'NX-8821' || u.id === 'usr-demo') ||
            data.users?.[0];
          if (demoUser) {
            setCurrentUser(demoUser);
            localStorage.setItem('tp_user_id', demoUser.id);
            setIsAuthPage(false);
          } else {
            setCurrentUser(null);
          }
        }
        setUsers(data.users || []);
        setSettings(data.settings || null);
        setTransactions(data.transactions || []);
        setDepositRequests(data.depositRequests || []);
        setWithdrawalRequests(data.withdrawalRequests || []);
        setBoostingQueue(data.boostingQueue || []);
        setProducts(data.products || []);
        setProductOrders(data.productOrders || []);
        setLoadError(null);
      } else {
        setLoadError(`Server status: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching state:', err);
      setLoadError(err?.message || 'Connection error');
    } finally {
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000); // Auto-sync state every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Keep active view synced with browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = detectRouteFromLocation();
      setActiveTab(nextRoute.isAdminSubdomain ? 'admin' : (nextRoute.activeTab === 'admin' ? 'dashboard' : nextRoute.activeTab) || 'dashboard');
      setIsAdminView(nextRoute.isAdminSubdomain);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateTab = (targetTab: string) => {
    navigateToAppTab(targetTab, settings, currentUser, setActiveTab, setIsAdminView);
  };

  // Handlers
  const handleSwitchUser = async (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (u) {
      try {
        localStorage.setItem('tp_user_id', u.id);
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': u.id },
          body: JSON.stringify({ nodeId: u.nodeId }),
        });
        await fetchState();
        showToast(`Switched active node to #${u.nodeId} (${u.name})`);
      } catch (err) {
        showToast('Failed to switch user', 'error');
      }
    }
  };

  const handleBuyPackage = async (pkgId: string) => {
    try {
      const res = await fetch('/api/packages/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to activate package', 'error');
        return;
      }
      await fetchState();
      showToast(`Successfully activated ${data.package.name} package!`);
    } catch (err) {
      showToast('Network error activating package', 'error');
    }
  };

  const handleClaimRoi = async () => {
    try {
      const res = await fetch('/api/roi/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to claim ROI', 'error');
        return;
      }
      await fetchState();
      showToast(`Claimed ₹${Number(data.claimedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR Node Mining Yield!`);
    } catch (err) {
      showToast('Network error claiming ROI', 'error');
    }
  };

  const handleDepositSubmit = async (amount: number, network: string, txHash: string) => {
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, network, txHash }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit deposit', 'error');
        return;
      }
      await fetchState();
      showToast('Deposit notification submitted! Pending admin confirmation.');
    } catch (err) {
      showToast('Network error submitting deposit', 'error');
    }
  };

  const handleWithdrawSubmit = async (amount: number, targetAddress: string, network: string, walletType: 'mlm' | 'winning' = 'mlm') => {
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, targetAddress, network, walletType }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit withdrawal', 'error');
        return;
      }
      await fetchState();
      showToast(`Withdrawal request for ₹${Number(amount).toLocaleString('en-IN')} INR submitted!`);
    } catch (err) {
      showToast('Network error submitting withdrawal', 'error');
    }
  };

  const handleConvertWinnings = async (amount: number) => {
    try {
      const res = await fetch('/api/wallet/convert-winnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to convert winnings', 'error');
        return;
      }
      await fetchState();
      showToast(data.message || `Transferred ₹${Number(amount).toLocaleString('en-IN')} INR to Deposit Wallet!`);
    } catch (err) {
      showToast('Network error converting winnings', 'error');
    }
  };

  const handleSpinWheel = async (): Promise<SpinReward | null> => {
    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to spin wheel', 'error');
        return null;
      }
      await fetchState();
      return data.winningReward;
    } catch (err) {
      showToast('Network error during spin', 'error');
      return null;
    }
  };

  const handleBuySpinTicket = async (qty: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/spin/buy-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to buy spin tickets', 'error');
        return false;
      }
      showToast(data.message || 'Spin tickets purchased successfully!', 'success');
      await fetchState();
      return true;
    } catch (err) {
      showToast('Network error purchasing spin tickets', 'error');
      return false;
    }
  };

  const handleDailyCheckin = async () => {
    try {
      const res = await fetch('/api/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to claim daily check-in', 'error');
        return;
      }
      showToast(data.message || '🎉 Claimed 1 Free Lucky Spin Ticket!', 'success');
      await fetchState();
    } catch (err) {
      showToast('Network error claiming daily check-in', 'error');
    }
  };

  const handleClaimRankBonus = async (rankId: string) => {
    try {
      const res = await fetch('/api/rank/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to claim rank bonus', 'error');
        return;
      }
      await fetchState();
      showToast(`Claimed ₹${Number(data.rank?.bonusUsdt || 0).toLocaleString('en-IN')} INR Leadership Bonus!`);
    } catch (err) {
      showToast('Network error claiming rank bonus', 'error');
    }
  };

  const handleSimulateBoosting = async () => {
    try {
      const res = await fetch('/api/boosting/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to process boosting cycle', 'error');
        return;
      }
      await fetchState();
      showToast(`FIFO Cycle Completed! Paid ₹${Number(settings?.boostingPool.rewardAmount || 0).toLocaleString('en-IN')} INR to #${data.winner.nodeId}`);
    } catch (err) {
      showToast('Network error running boosting cycle', 'error');
    }
  };

  // Admin Handlers
  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id || localStorage.getItem('tp_user_id') || '',
  });

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      await fetchState();
      showToast('System Settings updated & permanently saved to database!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  };

  const handleUpdateUserBalance = async (userId: string, balance: number, upgradeBalance: number, depositBalance?: number) => {
    try {
      const res = await fetch('/api/admin/users/update-balance', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ userId, balance, upgradeBalance, depositBalance }),
      });
      if (res.ok) {
        await fetchState();
        showToast('User balance overridden successfully');
      }
    } catch (err) {
      showToast('Failed to update user balance', 'error');
    }
  };

  const handleToggleUserPackage = async (userId: string, packageId: string | null) => {
    try {
      const res = await fetch('/api/admin/users/toggle-package', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ userId, packageId }),
      });
      if (res.ok) {
        await fetchState();
        showToast('User package updated');
      }
    } catch (err) {
      showToast('Failed to update user package', 'error');
    }
  };

  const handleDepositAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const res = await fetch('/api/admin/deposit/action', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ requestId, action, adminNotes: notes }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchState();
        showToast(`Deposit request ${action}d!`);
      } else {
        showToast(data.error || 'Failed to update deposit request', 'error');
      }
    } catch (err) {
      showToast('Failed to update deposit request', 'error');
    }
  };

  const handleWithdrawAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const res = await fetch('/api/admin/withdraw/action', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ requestId, action, adminNotes: notes }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchState();
        showToast(`Withdrawal request ${action}d!`);
      } else {
        showToast(data.error || 'Failed to update withdrawal request', 'error');
      }
    } catch (err) {
      showToast('Failed to update withdrawal request', 'error');
    }
  };

  const handleForceBoostingWinner = async () => {
    await handleSimulateBoosting();
  };

  const handleSyncBoostingQueue = async () => {
    try {
      const res = await fetch('/api/admin/boosting/sync', { method: 'POST' });
      if (res.ok) {
        await fetchState();
        showToast('Boosting Queue synchronized!');
      }
    } catch (err) {
      showToast('Failed to sync queue', 'error');
    }
  };

  const handleDeleteBoostingEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/boosting/entry/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchState();
        showToast('Queue entry removed');
      }
    } catch (err) {
      showToast('Failed to delete queue entry', 'error');
    }
  };

  // Product Store Handlers
  const handleBuyProduct = async (
    productId: string,
    quantity: number,
    shippingAddress: string,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    try {
      const res = await fetch('/api/products/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, shippingAddress, selectedSize, selectedColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to buy product');
      await fetchState();
      showToast('Product purchased successfully!');
    } catch (err: any) {
      showToast(err.message || 'Product purchase failed', 'error');
      throw err;
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      await fetchState();
      showToast('New product listed successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to add product', 'error');
    }
  };

  const handleUpdateProduct = async (id: string, productData: any) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');
      await fetchState();
      showToast('Product rate & details updated!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      await fetchState();
      showToast('Product removed from store');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');
      await fetchState();
      showToast(`Order status set to ${status}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const res = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update admin role');
      await fetchState();
      showToast(isAdmin ? 'Admin privileges granted to node!' : 'Admin privileges revoked!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin role', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete user');
      await fetchState();
      showToast(data.message || 'User deleted successfully!');
    } catch (err: any) {
      showToast('Error deleting user: ' + err.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('tp_user_id');
      sessionStorage.removeItem('sportx_admin_verified');
      setIsAdminPortalAuthed(false);
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setIsAuthPage(true);
      showToast('Logged out of Node Session', 'success');
    } catch (err) {
      localStorage.removeItem('tp_user_id');
      sessionStorage.removeItem('sportx_admin_verified');
      setIsAdminPortalAuthed(false);
      setIsAuthPage(true);
    }
  };

  // Check Subdomain / Route Context
  const currentRouteInfo = detectRouteFromLocation();
  const isGatewaySubdomainOrPath = currentRouteInfo.isGatewaySubdomain;

  // STRICTLY ISOLATED PASSWORD-PROTECTED ADMIN SUBDOMAIN (admin.sportx.tech or ?portal=admin)
  if (currentRouteInfo.isAdminSubdomain) {
    const hasAdminPriv = Boolean(
      currentUser &&
        (currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.isSubAdmin || currentUser.nodeId === 'NX-ROOT01')
    );

    if (!isAdminPortalAuthed || !hasAdminPriv) {
      return (
        <AdminPortalLogin
          onSuccess={(adminUser) => {
            setCurrentUser(adminUser);
            setIsAdminPortalAuthed(true);
            setIsAuthPage(false);
            fetchState();
          }}
          onBackToMainSite={() => {
            const lobby = resolveMainLobbyUrl(settings, null);
            if (lobby) {
              window.location.href = lobby;
            } else {
              window.location.href = '/';
            }
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#060a14] text-slate-100 font-sans">
        {toast && (
          <div className="fixed top-20 right-6 z-50 animate-bounce">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-mono text-xs font-bold border backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                  : 'bg-red-950/90 border-red-500/60 text-red-300'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-40 bg-[#090e1a]/95 backdrop-blur-md border-b border-amber-500/25 px-4 sm:px-6 h-14 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm sm:text-base tracking-tight text-white">
              SportX <span className="text-amber-400">Admin Sovereign</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
              #{currentUser?.nodeId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const lobby = resolveMainLobbyUrl(settings, null);
                if (lobby) {
                  window.location.href = lobby;
                } else {
                  window.location.href = '/';
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Player Site</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-bold text-rose-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock & Logout</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-3 sm:p-6">
          <AdminPanel
            key="view-admin-subdomain"
            currentUser={currentUser!}
            settings={settings!}
            users={users}
            depositRequests={depositRequests}
            withdrawalRequests={withdrawalRequests}
            boostingQueue={boostingQueue}
            transactions={transactions}
            products={products}
            productOrders={productOrders}
            onUpdateSettings={handleUpdateSettings}
            onUpdateUserBalance={handleUpdateUserBalance}
            onToggleUserPackage={handleToggleUserPackage}
            onDepositAction={handleDepositAction}
            onWithdrawAction={handleWithdrawAction}
            onForceBoostingWinner={handleForceBoostingWinner}
            onSyncBoostingQueue={handleSyncBoostingQueue}
            onDeleteBoostingEntry={handleDeleteBoostingEntry}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
            onRefreshState={fetchState}
          />
        </main>
      </div>
    );
  }

  if (activeTab === 'payment_gateway' || isGatewaySubdomainOrPath) {
    return (
      <PaymentGatewayView
        initialAmount={gatewayAmount}
        user={currentUser}
        settings={settings}
        onBack={() => {
          if (isGatewaySubdomainOrPath && !window.location.search.includes('inapp=true')) {
            handleNavigateTab('dashboard');
          } else {
            handleNavigateTab('dashboard');
          }
        }}
        onSuccess={() => {
          showToast('Deposit 12-Digit UTR submitted successfully! Verifying deposit...', 'success');
          setTimeout(() => {
            handleNavigateTab('dashboard');
          }, 2000);
        }}
      />
    );
  }

  // Dedicated Auth Page View (First time visit or when logged out / auth selected)
  if (isAuthPage || !currentUser) {
    if (!hasLoadedOnce && !settings) {
      return (
        <div className="min-h-screen bg-[#080d14] text-white font-mono flex items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-cyan-400">
              Connecting to SportX Gaming Protocol...
            </span>
          </div>
        </div>
      );
    }

    if (loadError && !settings) {
      return (
        <div className="min-h-screen bg-[#080d14] text-white font-mono flex items-center justify-center p-4">
          <div className="bg-[#0e1726] border border-cyan-500/30 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-400 font-bold">!</div>
            <h2 className="text-base font-bold text-slate-100">Protocol Connecting...</h2>
            <p className="text-xs text-slate-400">{loadError}</p>
            <button
              onClick={() => { setLoadError(null); fetchState(); }}
              className="px-5 py-2.5 bg-cyan-500 text-black font-bold rounded-xl text-xs hover:bg-cyan-400 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return (
      <AuthView
        users={users}
        settings={settings}
        onLoginSuccess={() => {
          setIsAuthPage(false);
          fetchState();
        }}
        showToast={showToast}
        onContinueAsGuest={currentUser ? () => setIsAuthPage(false) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl font-mono text-xs font-bold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-red-950/90 border-red-500/60 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Bar - Shown on non-dashboard tabs */}
      {activeTab !== 'dashboard' && (
        <HeaderBar
          user={currentUser}
          users={users}
          settings={settings}
          isAdminView={isAdminView}
          setIsAdminView={setIsAdminView}
          onSwitchUser={handleSwitchUser}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onOpenAuthModal={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onSelectTab={(tab) => {
            handleNavigateTab(tab);
          }}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        />
      )}

      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            handleNavigateTab(tab);
          }}
          user={currentUser}
          settings={settings}
          isAdminView={isAdminView}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className={`flex-1 ${activeTab === 'cricket' ? 'p-0 bg-[#f8fafc]' : activeTab === 'chickenroad' ? 'p-0 sm:p-2' : 'p-3 sm:p-6 lg:p-8'} pb-16 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden`}>
          {isGameRouteTab(activeTab) && !isGameEnabled(activeTab, settings) ? (
            <div
              key="view-game-disabled"
              className="max-w-md mx-auto mt-10 bg-[#0b1424] border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl">
                {GAME_SUBDOMAIN_LIST.find((g) => g.tab === activeTab)?.icon || '🛠️'}
              </div>
              <h2 className="text-lg font-black text-white">
                {GAME_SUBDOMAIN_LIST.find((g) => g.tab === activeTab)?.label || 'Game'} is Temporarily Paused
              </h2>
              <p className="text-xs text-slate-400">
                Admin has currently turned this game OFF. Other active games and your unified Main Wallet remain 100% available.
              </p>
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs shadow-lg hover:brightness-110 transition"
              >
                🏠 Back to Front Page
              </button>
            </div>
          ) : activeTab === 'luckydraw' ? (
            <LuckyDrawView
              key="view-luckydraw"
              currentUser={currentUser}
              users={users}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onRefreshState={fetchState}
              onBack={() => handleNavigateTab('dashboard')}
              showToast={showToast}
            />
          ) : activeTab === 'colorprediction' ? (
            <ColorPredictionView
              key="view-colorprediction"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'dragontiger' ? (
            <DragonTigerView
              key="view-dragontiger"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          ) : activeTab === 'cricket' ? (
            <CricketFantasyView
              key="view-cricket"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'aviator' ? (
            <AviatorView
              key="view-aviator"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'slot777' ? (
            <Slot777View
              key="view-slot777"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'rummy' ? (
            <RummyView
              key="view-rummy"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'chickenroad' ? (
            <ChickenRoadView
              key="view-chickenroad"
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
            />
          ) : activeTab === 'agency' || activeTab === 'matrix' || activeTab === 'rankrewards' ? (
            <ReferralAgencyView key="view-agency" user={currentUser} />
          ) : activeTab === 'store' ? (
            <DashboardView
              key="view-store"
              user={currentUser}
              settings={settings}
              transactions={transactions}
              onSelectTab={handleNavigateTab}
              onOpenTournament={() => setIsTournamentOpen(true)}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onRefreshUser={fetchState}
            />
          ) : activeTab === 'vip' ? (
            <VipPrivilegeView
              key="view-vip"
              user={currentUser}
              settings={settings}
              onBack={() => handleNavigateTab('dashboard')}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onSelectTab={handleNavigateTab}
            />
          ) : activeTab === 'finance' ? (
            <FinanceView
              key="view-finance"
              user={currentUser}
              settings={settings}
              depositRequests={depositRequests}
              withdrawalRequests={withdrawalRequests}
              transactions={transactions}
              onDepositSubmit={handleDepositSubmit}
              onWithdrawSubmit={handleWithdrawSubmit}
              onNavigateToPackages={() => handleNavigateTab('dashboard')}
              onSelectTab={handleNavigateTab}
              onRefreshUser={fetchState}
            />
          ) : activeTab === 'spinwheel' || activeTab === 'rewards' ? (
            <GamificationView
              key="view-gamification"
              user={currentUser}
              settings={settings}
              onSpinWheel={handleSpinWheel}
              onBuySpinTicket={handleBuySpinTicket}
              onDailyCheckin={handleDailyCheckin}
              onOpenTournament={() => setIsTournamentOpen(true)}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onBack={() => handleNavigateTab('dashboard')}
              onRefreshUser={fetchState}
            />
          ) : (
            <DashboardView
              key="view-dashboard"
              user={currentUser}
              settings={settings}
              transactions={transactions}
              onBuyPackage={handleBuyPackage}
              onClaimRoi={handleClaimRoi}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onDailyCheckin={handleDailyCheckin}
              onOpenTournament={() => setIsTournamentOpen(true)}
              onOpenAuthModal={() => setIsAuthOpen(true)}
              onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              onRefreshUser={fetchState}
              onSelectTab={handleNavigateTab}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden in Cricket to avoid overlapping Save Team bar) */}
      {activeTab !== 'cricket' && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          setIsAdminView={setIsAdminView}
          user={currentUser}
          settings={settings}
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
        />
      )}

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        settings={settings}
        onSubmitDeposit={handleDepositSubmit}
        user={currentUser}
        depositRequests={depositRequests}
        onRefreshUser={fetchState}
        onOpenGateway={(amt) => {
          setGatewayAmount(amt);
          handleNavigateTab('payment_gateway');
        }}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        user={currentUser}
        settings={settings}
        transactions={transactions}
        withdrawalRequests={withdrawalRequests}
        onSubmitWithdraw={handleWithdrawSubmit}
        onNavigateToPackages={() => {
          setIsWithdrawOpen(false);
          handleNavigateTab('dashboard');
        }}
        onRefreshUser={fetchState}
      />

      <DailyTournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSelectGame={(gameTab) => {
          setIsTournamentOpen(false);
          handleNavigateTab(gameTab);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        users={users}
        onLoginSuccess={fetchState}
        showToast={showToast}
      />
    </div>
  );
}
