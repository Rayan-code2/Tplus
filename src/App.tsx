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
import { ReferralAgencyView } from './components/ReferralAgencyView';
import { LiveWinnerTicker } from './components/LiveWinnerTicker';
import { AdminPanel } from './components/AdminPanel';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { DailyTournamentModal } from './components/DailyTournamentModal';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/AuthView';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAuthPage, setIsAuthPage] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState(false);

  // Toast Banner State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
        if (storedId && data.currentUser) {
          setCurrentUser(data.currentUser);
        } else {
          setCurrentUser(null);
        }
        setUsers(data.users || []);
        setSettings(data.settings || null);
        setTransactions(data.transactions || []);
        setDepositRequests(data.depositRequests || []);
        setWithdrawalRequests(data.withdrawalRequests || []);
        setBoostingQueue(data.boostingQueue || []);
        setProducts(data.products || []);
        setProductOrders(data.productOrders || []);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000); // Auto-sync state every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
      showToast(`Claimed $${data.claimedAmount.toFixed(2)} USDT Node Mining Yield!`);
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
      showToast(`Withdrawal request for $${amount} USDT submitted!`);
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
      showToast(data.message || `Transferred $${amount} USDT to Deposit Wallet!`);
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
      showToast(`Claimed $${data.rank.bonusUsdt} USDT Leadership Bonus!`);
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
      showToast(`FIFO Cycle Completed! Paid $${settings?.boostingPool.rewardAmount} USDT to #${data.winner.nodeId}`);
    } catch (err) {
      showToast('Network error running boosting cycle', 'error');
    }
  };

  // Admin Handlers
  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminNotes: notes }),
      });
      if (res.ok) {
        await fetchState();
        showToast(`Deposit request ${action}d!`);
      }
    } catch (err) {
      showToast('Failed to update deposit request', 'error');
    }
  };

  const handleWithdrawAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const res = await fetch('/api/admin/withdraw/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminNotes: notes }),
      });
      if (res.ok) {
        await fetchState();
        showToast(`Withdrawal request ${action}d!`);
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
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setIsAuthPage(true);
      showToast('Logged out of Node Session', 'success');
    } catch (err) {
      localStorage.removeItem('tp_user_id');
      setIsAuthPage(true);
    }
  };

  // Dedicated Auth Page View (First time visit or when logged out / auth selected)
  if (isAuthPage || !currentUser) {
    if (!settings) {
      return (
        <div className="min-h-screen bg-[#080d14] text-white font-mono flex items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-cyan-400">
              Connecting to TetherPlus Web3 Protocol...
            </span>
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

      {/* Header Bar */}
      <HeaderBar
        user={currentUser}
        users={users}
        settings={settings}
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
        onSwitchUser={handleSwitchUser}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        onOpenAuthModal={() => setIsAuthPage(true)}
        onLogout={handleLogout}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsAdminView(false);
        }}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Live Casino Winner Ticker Marquee */}
      <LiveWinnerTicker />

      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'admin') {
              setIsAdminView(true);
            } else {
              setIsAdminView(false);
            }
          }}
          user={currentUser}
          isAdminView={isAdminView}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          onOpenTournament={() => setIsTournamentOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {(isAdminView || activeTab === 'admin') && (currentUser?.isAdmin || currentUser?.nodeId === 'NX-ROOT01') ? (
            <AdminPanel
              settings={settings}
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
            />
          ) : activeTab === 'luckydraw' ? (
            <LuckyDrawView
              currentUser={currentUser}
              users={users}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onRefreshState={fetchState}
            />
          ) : activeTab === 'colorprediction' ? (
            <ColorPredictionView
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          ) : activeTab === 'dragontiger' ? (
            <DragonTigerView
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          ) : activeTab === 'aviator' ? (
            <AviatorView
              user={currentUser}
              onRefreshUser={fetchState}
              showToast={showToast}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          ) : activeTab === 'agency' ? (
            <ReferralAgencyView user={currentUser} />
          ) : activeTab === 'store' ? (
            <StoreView
              currentUser={currentUser}
              settings={settings}
              products={products}
              productOrders={productOrders}
              onBuyProduct={handleBuyProduct}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          ) : activeTab === 'matrix' ? (
            <MatrixTreeView
              currentUser={currentUser}
              users={users}
              settings={settings}
            />
          ) : activeTab === 'finance' ? (
            <FinanceView
              user={currentUser}
              settings={settings}
              depositRequests={depositRequests}
              withdrawalRequests={withdrawalRequests}
              transactions={transactions}
              onDepositSubmit={handleDepositSubmit}
              onWithdrawSubmit={handleWithdrawSubmit}
              onConvertWinnings={handleConvertWinnings}
              onNavigateToPackages={() => {
                setActiveTab('dashboard');
                setIsAdminView(false);
              }}
            />
          ) : activeTab === 'spinwheel' || activeTab === 'rewards' ? (
            <GamificationView
              user={currentUser}
              settings={settings}
              onSpinWheel={handleSpinWheel}
              onBuySpinTicket={handleBuySpinTicket}
              onDailyCheckin={handleDailyCheckin}
              onOpenTournament={() => setIsTournamentOpen(true)}
            />
          ) : activeTab === 'rankrewards' ? (
            <RankRewardsView
              user={currentUser}
              settings={settings}
              onClaimRankBonus={handleClaimRankBonus}
            />
          ) : (
            <DashboardView
              user={currentUser}
              settings={settings}
              transactions={transactions}
              onBuyPackage={handleBuyPackage}
              onClaimRoi={handleClaimRoi}
              onOpenDeposit={() => setIsDepositOpen(true)}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onDailyCheckin={handleDailyCheckin}
              onOpenTournament={() => setIsTournamentOpen(true)}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setIsAdminView(false);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAdminView={setIsAdminView}
        user={currentUser}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        settings={settings}
        onSubmitDeposit={handleDepositSubmit}
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
          setActiveTab('dashboard');
          setIsAdminView(false);
        }}
      />

      <DailyTournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
        currentUser={currentUser}
        onSelectGame={(gameTab) => {
          setIsTournamentOpen(false);
          setActiveTab(gameTab);
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
