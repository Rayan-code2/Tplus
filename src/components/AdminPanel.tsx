import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Shield,
  Sliders,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  FileText,
  Save,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Edit2,
  DollarSign,
  TrendingUp,
  Database,
  Download,
  Upload,
  Key,
  Lock,
  Terminal,
  HardDrive,
  Copy,
  ShoppingBag,
  PackageCheck,
  Sparkles,
  Award,
  Crown,
  Trophy,
  Gift,
  Gem,
  Calendar,
  Printer,
  FileSpreadsheet,
  Filter,
  Disc,
  RotateCcw,
  AlertCircle,
  Dices,
  Bot,
  Shuffle,
  Plane,
  Image,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Ticket,
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  CheckSquare,
  Square,
  Globe,
  Power,
  Gamepad2,
} from 'lucide-react';
import { GAME_SUBDOMAIN_LIST, isGameEnabled, GameRouteKey } from '../utils/subdomainRouter';
import {
  User,
  SystemSettings,
  DepositRequest,
  WithdrawalRequest,
  BoostingEntry,
  Transaction,
  Product,
  ProductOrder,
  RankConfig,
  SpinReward,
  UpiPoolItem,
  PaymentGatewayConfig,
  AdminPermissions,
  DepositBonusTier,
  SignupBonusConfig,
  DepositBonusConfig,
} from '../types';

interface AdminPanelProps {
  currentUser?: User | null;
  settings: SystemSettings;
  users: User[];
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawalRequest[];
  boostingQueue: BoostingEntry[];
  transactions: Transaction[];
  products?: Product[];
  productOrders?: ProductOrder[];
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
  onUpdateUserBalance: (userId: string, balance: number, upgradeBalance: number, depositBalance?: number) => Promise<void>;
  onToggleUserPackage: (userId: string, packageId: string | null) => Promise<void>;
  onDepositAction: (requestId: string, action: 'approve' | 'reject', notes?: string) => Promise<void>;
  onWithdrawAction: (requestId: string, action: 'approve' | 'reject', notes?: string) => Promise<void>;
  onForceBoostingWinner: () => Promise<void>;
  onSyncBoostingQueue: () => Promise<void>;
  onDeleteBoostingEntry: (id: string) => Promise<void>;
  onAddProduct?: (productData: any) => Promise<void>;
  onUpdateProduct?: (id: string, productData: any) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateOrderStatus?: (orderId: string, status: string) => Promise<void>;
  onToggleAdmin?: (userId: string, isAdmin: boolean) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onSwitchUser?: (userId: string) => Promise<void>;
  onRefreshState?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  settings,
  users,
  depositRequests,
  withdrawalRequests,
  boostingQueue,
  transactions,
  products = [],
  productOrders = [],
  onUpdateSettings,
  onUpdateUserBalance,
  onToggleUserPackage,
  onDepositAction,
  onWithdrawAction,
  onForceBoostingWinner,
  onSyncBoostingQueue,
  onDeleteBoostingEntry,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onToggleAdmin,
  onDeleteUser,
  onSwitchUser,
  onRefreshState,
}) => {
  const [activeTab, setActiveTab] = useState<
    'settings' | 'game_controls' | 'bonuses' | 'users' | 'deposits' | 'withdrawals' | 'boosting' | 'audit' | 'sqlite' | 'products' | 'ranks' | 'reports' | 'color_prediction' | 'dragon_tiger' | 'aviator_game' | 'tournament' | 'lottery_draw' | 'upi_gateway' | 'subadmins'
  >('settings');

  // Sub-Admins RBAC & Permissions State
  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.id === 'usr-root' || currentUser?.nodeId === 'NX-ROOT01';
  const perms = currentUser?.adminPermissions || {};

  const canAccess = (tab: string): boolean => {
    if (isSuperAdmin) return true;
    switch (tab) {
      case 'settings': return Boolean(perms.canManageSettings);
      case 'game_controls': return Boolean(perms.canManageSettings);
      case 'bonuses': return Boolean(perms.canManageSettings);
      case 'users': return Boolean(perms.canManageUsers);
      case 'deposits': return Boolean(perms.canManageDeposits);
      case 'withdrawals': return Boolean(perms.canManageWithdrawals);
      case 'boosting': return Boolean(perms.canManageBoosting);
      case 'audit': return Boolean(perms.canViewAudit);
      case 'sqlite': return Boolean(perms.canManageSqlite);
      case 'products': return Boolean(perms.canManageProducts);
      case 'ranks': return Boolean(perms.canManageRanks);
      case 'reports': return Boolean(perms.canViewReports);
      case 'color_prediction': return Boolean(perms.canManageColorPrediction);
      case 'dragon_tiger': return Boolean(perms.canManageDragonTiger);
      case 'aviator_game': return Boolean(perms.canManageAviator);
      case 'tournament': return Boolean(perms.canManageTournament);
      case 'lottery_draw': return Boolean(perms.canManageLottery);
      case 'upi_gateway': return Boolean(perms.canManageUpiGateway);
      case 'subadmins': return isSuperAdmin || Boolean(perms.canManageSubAdmins);
      default: return false;
    }
  };

  // Auto-switch to authorized tab if current activeTab is unauthorized
  useEffect(() => {
    if (!canAccess(activeTab)) {
      const order = [
        'deposits', 'withdrawals', 'color_prediction', 'dragon_tiger', 'aviator_game',
        'tournament', 'lottery_draw', 'upi_gateway', 'users', 'reports', 'settings',
        'game_controls', 'bonuses', 'audit', 'sqlite', 'boosting', 'products', 'ranks', 'subadmins'
      ];
      const firstAllowed = order.find((t) => canAccess(t));
      if (firstAllowed) {
        setActiveTab(firstAllowed as any);
      }
    }
  }, [currentUser]);

  // Sub-Admin State
  const [subadminsList, setSubadminsList] = useState<User[]>([]);
  const [loadingSubadmins, setLoadingSubadmins] = useState(false);
  const [subadminMsg, setSubadminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Sub-Admin Form State
  const [subFormName, setSubFormName] = useState('');
  const [subFormNodeId, setSubFormNodeId] = useState('');
  const [subFormEmail, setSubFormEmail] = useState('');
  const [subFormPassword, setSubFormPassword] = useState('');
  const [subFormRoleName, setSubFormRoleName] = useState('Deposit Approval Desk');
  const [subFormPreset, setSubFormPreset] = useState<'custom' | 'deposit_only' | 'withdraw_only' | 'game_master' | 'gateway_manager' | 'support_staff' | 'auditor'>('deposit_only');
  const [subFormPermissions, setSubFormPermissions] = useState<AdminPermissions>({
    canManageDeposits: true,
    canManageWithdrawals: false,
    canManageUsers: false,
    canManageColorPrediction: false,
    canManageDragonTiger: false,
    canManageAviator: false,
    canManageTournament: false,
    canManageLottery: false,
    canManageUpiGateway: false,
    canManageSettings: false,
    canViewReports: false,
    canViewAudit: false,
    canManageProducts: false,
    canManageBoosting: false,
    canManageSqlite: false,
    canManageRanks: false,
  });

  // Edit Sub-Admin State
  const [editingSubadmin, setEditingSubadmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermissions>({});
  const [editRoleName, setEditRoleName] = useState('');
  const [editPasswordReset, setEditPasswordReset] = useState('');
  const [isSavingSubadmin, setIsSavingSubadmin] = useState(false);

  const applyPreset = (preset: 'custom' | 'deposit_only' | 'withdraw_only' | 'game_master' | 'gateway_manager' | 'support_staff' | 'auditor') => {
    setSubFormPreset(preset);
    if (preset === 'deposit_only') {
      setSubFormRoleName('Deposit Approval Desk');
      setSubFormPermissions({ canManageDeposits: true });
    } else if (preset === 'withdraw_only') {
      setSubFormRoleName('Withdrawal Officer');
      setSubFormPermissions({ canManageWithdrawals: true });
    } else if (preset === 'game_master') {
      setSubFormRoleName('Game Master (Win/Loss Controller)');
      setSubFormPermissions({
        canManageColorPrediction: true,
        canManageDragonTiger: true,
        canManageAviator: true,
        canManageLottery: true,
      });
    } else if (preset === 'gateway_manager') {
      setSubFormRoleName('Payment Gateway & UPI Desk');
      setSubFormPermissions({
        canManageUpiGateway: true,
        canManageDeposits: true,
      });
    } else if (preset === 'support_staff') {
      setSubFormRoleName('User Support Executive');
      setSubFormPermissions({
        canManageUsers: true,
        canViewAudit: true,
      });
    } else if (preset === 'auditor') {
      setSubFormRoleName('Finance & Compliance Auditor');
      setSubFormPermissions({
        canViewReports: true,
        canViewAudit: true,
      });
    }
  };

  const fetchSubadmins = async () => {
    setLoadingSubadmins(true);
    try {
      const res = await fetch('/api/admin/subadmins', {
        headers: { 'x-user-id': currentUser?.id || 'usr-root' },
      });
      if (res.ok) {
        const data = await res.json();
        setSubadminsList(data.subadmins || []);
      }
    } catch (err) {
      console.error('Failed to fetch subadmins:', err);
    } finally {
      setLoadingSubadmins(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subadmins' && (isSuperAdmin || perms.canManageSubAdmins)) {
      fetchSubadmins();
    }
  }, [activeTab]);

  const handleCreateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFormName.trim() || !subFormNodeId.trim() || !subFormPassword.trim()) {
      setSubadminMsg({ text: 'Please fill Name, Node/User ID and Password', type: 'error' });
      return;
    }
    setIsSavingSubadmin(true);
    setSubadminMsg(null);
    try {
      const res = await fetch('/api/admin/subadmins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-root',
        },
        body: JSON.stringify({
          name: subFormName,
          nodeId: subFormNodeId,
          email: subFormEmail || `${subFormNodeId.toLowerCase()}@sportx.game`,
          password: subFormPassword,
          adminRoleName: subFormRoleName,
          adminPermissions: subFormPermissions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubadminMsg({ text: data.message, type: 'success' });
        setSubFormName('');
        setSubFormNodeId('');
        setSubFormEmail('');
        setSubFormPassword('');
        await fetchSubadmins();
      } else {
        setSubadminMsg({ text: data.error || 'Failed to create Sub-Admin', type: 'error' });
      }
    } catch (err: any) {
      setSubadminMsg({ text: err?.message || 'Network error', type: 'error' });
    } finally {
      setIsSavingSubadmin(false);
    }
  };

  const handleToggleSubadminStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/subadmins/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-root',
        },
      });
      if (res.ok) {
        await fetchSubadmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubadmin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Sub-Admin "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/subadmins/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || 'usr-root' },
      });
      if (res.ok) {
        await fetchSubadmins();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubadminPermissions = async () => {
    if (!editingSubadmin) return;
    setIsSavingSubadmin(true);
    try {
      const res = await fetch(`/api/admin/subadmins/${editingSubadmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-root',
        },
        body: JSON.stringify({
          adminRoleName: editRoleName,
          adminPermissions: editPermissions,
        }),
      });
      if (editPasswordReset.trim()) {
        await fetch(`/api/admin/subadmins/${editingSubadmin.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id || 'usr-root',
          },
          body: JSON.stringify({ password: editPasswordReset.trim() }),
        });
      }
      if (res.ok) {
        setEditingSubadmin(null);
        setEditPasswordReset('');
        await fetchSubadmins();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSubadmin(false);
    }
  };

  // UPI Gateway & Rotation Pool Admin State
  const [upiBulkText, setUpiBulkText] = useState('');
  const [upiDefaultName, setUpiDefaultName] = useState('SportX Gaming Official');
  const [upiDailyLimit, setUpiDailyLimit] = useState<number>(100000);
  const [upiReplaceAll, setUpiReplaceAll] = useState(false);
  const [upiBulkLoading, setUpiBulkLoading] = useState(false);
  const [upiBulkMsg, setUpiBulkMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [upiSearchQuery, setUpiSearchQuery] = useState('');
  const [testRotatingUpiResult, setTestRotatingUpiResult] = useState<any>(null);
  const [testingUpi, setTestingUpi] = useState(false);
  const [gatewaySubdomain, setGatewaySubdomain] = useState(settings?.paymentGateway?.subdomainUrl || '');
  const [gatewayRotationStrategy, setGatewayRotationStrategy] = useState<'roundRobin' | 'random' | 'leastUsed'>(
    settings?.paymentGateway?.rotationStrategy || 'roundRobin'
  );
  const [gatewayTimerSeconds, setGatewayTimerSeconds] = useState<number>(
    settings?.paymentGateway?.qrTimerSeconds || 600
  );
  const [singleUpiId, setSingleUpiId] = useState('');
  const [singleUpiName, setSingleUpiName] = useState('');
  const [isAddingSingle, setIsAddingSingle] = useState(false);

  // Sync settings when props update
  useEffect(() => {
    if (settings?.paymentGateway) {
      setGatewayRotationStrategy(settings.paymentGateway.rotationStrategy || 'roundRobin');
      setGatewaySubdomain(settings.paymentGateway.subdomainUrl || '');
      setGatewayTimerSeconds(settings.paymentGateway.qrTimerSeconds || 600);
    }
  }, [settings?.paymentGateway]);

  // Lucky Draw / Lottery Admin State
  const [luckyDrawData, setLuckyDrawData] = useState<any>(null);
  const [loadingLuckyDraw, setLoadingLuckyDraw] = useState(false);
  const [savingLuckyDraw, setSavingLuckyDraw] = useState(false);
  const [luckyDrawMsg, setLuckyDrawMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [ldTicketPrice, setLdTicketPrice] = useState<number | ''>(100);
  const [ldPrize1, setLdPrize1] = useState<number | ''>(25000);
  const [ldPrize2, setLdPrize2] = useState<number | ''>(10000);
  const [ldPrize3, setLdPrize3] = useState<number | ''>(5000);
  const [ldPrize4, setLdPrize4] = useState<number | ''>(2500);
  const [ldPrize5, setLdPrize5] = useState<number | ''>(1500);
  const [ldPrizeGuaranteed, setLdPrizeGuaranteed] = useState<number | ''>(500);
  const [ldForcedPrizes, setLdForcedPrizes] = useState<{ [key: string]: { userId: string; ticketNumber: string } }>({
    '1': { userId: '', ticketNumber: '' },
    '2': { userId: '', ticketNumber: '' },
    '3': { userId: '', ticketNumber: '' },
    '4': { userId: '', ticketNumber: '' },
    '5': { userId: '', ticketNumber: '' },
  });

  const fetchAdminLuckyDraw = async () => {
    setLoadingLuckyDraw(true);
    try {
      const res = await fetch('/api/luckydraw');
      if (res.ok) {
        const data = await res.json();
        const ld = data.luckyDraw;
        setLuckyDrawData(ld);
        if (ld) {
          setLdTicketPrice(ld.ticketPrice !== undefined ? ld.ticketPrice : 100);
          setLdPrize1(ld.prizeAmount !== undefined ? ld.prizeAmount : 25000);
          setLdPrize2(ld.secondPrizeAmount !== undefined ? ld.secondPrizeAmount : 10000);
          setLdPrize3(ld.thirdPrizeAmount !== undefined ? ld.thirdPrizeAmount : 5000);
          setLdPrize4(ld.fourthPrizeAmount !== undefined ? ld.fourthPrizeAmount : 2500);
          setLdPrize5(ld.fifthPrizeAmount !== undefined ? ld.fifthPrizeAmount : 1500);
          setLdPrizeGuaranteed(ld.guaranteedPrizeAmount !== undefined ? ld.guaranteedPrizeAmount : 500);
          if (ld.forcedPrizes) {
            setLdForcedPrizes({
              '1': { userId: ld.forcedPrizes['1']?.userId || '', ticketNumber: ld.forcedPrizes['1']?.ticketNumber || '' },
              '2': { userId: ld.forcedPrizes['2']?.userId || '', ticketNumber: ld.forcedPrizes['2']?.ticketNumber || '' },
              '3': { userId: ld.forcedPrizes['3']?.userId || '', ticketNumber: ld.forcedPrizes['3']?.ticketNumber || '' },
              '4': { userId: ld.forcedPrizes['4']?.userId || '', ticketNumber: ld.forcedPrizes['4']?.ticketNumber || '' },
              '5': { userId: ld.forcedPrizes['5']?.userId || '', ticketNumber: ld.forcedPrizes['5']?.ticketNumber || '' },
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch lucky draw in admin:', err);
    } finally {
      setLoadingLuckyDraw(false);
    }
  };

  useEffect(() => {
    fetchAdminLuckyDraw();
  }, []);

  const handleSaveLuckyDrawConfig = async (override?: any) => {
    setSavingLuckyDraw(true);
    setLuckyDrawMsg(null);
    try {
      const payload = {
        ticketPrice: override?.ticketPrice !== undefined ? override.ticketPrice : (ldTicketPrice === '' ? 100 : Number(ldTicketPrice)),
        prizeAmount: override?.prizeAmount !== undefined ? override.prizeAmount : (ldPrize1 === '' ? 25000 : Number(ldPrize1)),
        secondPrizeAmount: override?.secondPrizeAmount !== undefined ? override.secondPrizeAmount : (ldPrize2 === '' ? 10000 : Number(ldPrize2)),
        thirdPrizeAmount: override?.thirdPrizeAmount !== undefined ? override.thirdPrizeAmount : (ldPrize3 === '' ? 5000 : Number(ldPrize3)),
        fourthPrizeAmount: override?.fourthPrizeAmount !== undefined ? override.fourthPrizeAmount : (ldPrize4 === '' ? 2500 : Number(ldPrize4)),
        fifthPrizeAmount: override?.fifthPrizeAmount !== undefined ? override.fifthPrizeAmount : (ldPrize5 === '' ? 1500 : Number(ldPrize5)),
        guaranteedPrizeAmount: override?.guaranteedPrizeAmount !== undefined ? override.guaranteedPrizeAmount : (ldPrizeGuaranteed === '' ? 500 : Number(ldPrizeGuaranteed)),
        forcedPrizes: override?.forcedPrizes !== undefined ? override.forcedPrizes : ldForcedPrizes,
        ...override,
      };

      const res = await fetch('/api/luckydraw/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLuckyDrawMsg({ text: '✅ Lucky Draw Prize Amounts and Winners saved successfully!', type: 'success' });
        const ld = data.luckyDraw;
        setLuckyDrawData(ld);
        if (ld) {
          setLdTicketPrice(ld.ticketPrice !== undefined ? ld.ticketPrice : 100);
          setLdPrize1(ld.prizeAmount !== undefined ? ld.prizeAmount : 25000);
          setLdPrize2(ld.secondPrizeAmount !== undefined ? ld.secondPrizeAmount : 10000);
          setLdPrize3(ld.thirdPrizeAmount !== undefined ? ld.thirdPrizeAmount : 5000);
          setLdPrize4(ld.fourthPrizeAmount !== undefined ? ld.fourthPrizeAmount : 2500);
          setLdPrize5(ld.fifthPrizeAmount !== undefined ? ld.fifthPrizeAmount : 1500);
          setLdPrizeGuaranteed(ld.guaranteedPrizeAmount !== undefined ? ld.guaranteedPrizeAmount : 500);
          if (ld.forcedPrizes) {
            setLdForcedPrizes({
              '1': { userId: ld.forcedPrizes['1']?.userId || '', ticketNumber: ld.forcedPrizes['1']?.ticketNumber || '' },
              '2': { userId: ld.forcedPrizes['2']?.userId || '', ticketNumber: ld.forcedPrizes['2']?.ticketNumber || '' },
              '3': { userId: ld.forcedPrizes['3']?.userId || '', ticketNumber: ld.forcedPrizes['3']?.ticketNumber || '' },
              '4': { userId: ld.forcedPrizes['4']?.userId || '', ticketNumber: ld.forcedPrizes['4']?.ticketNumber || '' },
              '5': { userId: ld.forcedPrizes['5']?.userId || '', ticketNumber: ld.forcedPrizes['5']?.ticketNumber || '' },
            });
          }
        }
        if (data.settings) {
          setEditableSettings((prev: any) => ({
            ...prev,
            luckyDraw: data.settings.luckyDraw,
          }));
          if (onUpdateSettings) {
            onUpdateSettings(data.settings);
          }
        }
        setIsSettingsDirty(false);
        setTimeout(() => setLuckyDrawMsg(null), 4000);
      } else {
        setLuckyDrawMsg({ text: `❌ Failed: ${data.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (err: any) {
      setLuckyDrawMsg({ text: `Network error: ${err.message}`, type: 'error' });
    } finally {
      setSavingLuckyDraw(false);
    }
  };

  const [colorStats, setColorStats] = useState<any>(null);
  const [aviatorStats, setAviatorStats] = useState<any>(null);
  const [dragonTigerStats, setDragonTigerStats] = useState<any>(null);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [loadingTournament, setLoadingTournament] = useState(false);
  const [distributingTournament, setDistributingTournament] = useState(false);
  const [tournamentDistributeResult, setTournamentDistributeResult] = useState<any>(null);

  // Web3 SafePal Hot Wallet State
  const [web3Status, setWeb3Status] = useState<any>(null);
  const [loadingWeb3Status, setLoadingWeb3Status] = useState(false);
  const [dispatchingWdId, setDispatchingWdId] = useState<string | null>(null);
  const [verifyingDepId, setVerifyingDepId] = useState<string | null>(null);

  const fetchWeb3Status = async () => {
    setLoadingWeb3Status(true);
    try {
      const res = await fetch('/api/web3/status');
      if (res.ok) {
        const data = await res.json();
        setWeb3Status(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Web3 status:', err);
    } finally {
      setLoadingWeb3Status(false);
    }
  };

  const handleAutoDispatchWithdrawal = async (requestId: string) => {
    if (!confirm('Execute instant automated payout dispatch now?')) return;
    setDispatchingWdId(requestId);
    try {
      const res = await fetch('/api/admin/withdraw/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`🚀 Blockchain Payout Successful!\nTxHash: ${data.txHash}\nView on BscScan: ${data.bscscanUrl}`);
        window.location.reload();
      } else {
        alert(`⚠️ Payout Error: ${data.error || 'Failed to dispatch transaction'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setDispatchingWdId(null);
    }
  };

  const handleAutoVerifyDeposit = async (requestId: string, txHash: string) => {
    setVerifyingDepId(requestId);
    try {
      const res = await fetch('/api/web3/verify-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, txHash }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        alert(`🎉 Deposit Auto-Verified!\nAmount: Rs. ${data.blockchainData?.amount || ''} INR\nSender: ${data.blockchainData?.from || ''}`);
        window.location.reload();
      } else {
        alert(`⚠️ Verification note: ${data.error || 'Not confirmed yet on blockchain'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setVerifyingDepId(null);
    }
  };

  useEffect(() => {
    fetchWeb3Status();
  }, []);

  const fetchAdminTournament = async () => {
    setLoadingTournament(true);
    try {
      const res = await fetch('/api/tournament/daily');
      if (res.ok) {
        const data = await res.json();
        setTournamentData(data.tournament);
      }
    } catch (err) {
      console.error('Failed to fetch tournament details', err);
    } finally {
      setLoadingTournament(false);
    }
  };

  const handleDistributeTournamentRewards = async () => {
    if (!confirm("Are you sure you want to distribute today's Top Bettor Tournament prize pool to qualifying champions now? Rewards will be directly credited to their Game Winning Balances.")) {
      return;
    }
    setDistributingTournament(true);
    try {
      const res = await fetch('/api/admin/tournament/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setTournamentDistributeResult(data);
        alert(data.message || 'Prizes distributed successfully!');
        fetchAdminTournament();
      } else {
        alert(data.error || 'Failed to distribute prizes');
      }
    } catch (err) {
      alert('Error distributing tournament rewards');
    } finally {
      setDistributingTournament(false);
    }
  };

  const fetchDragonTigerStats = async () => {
    try {
      const res = await fetch('/api/admin/dragon-tiger/stats');
      if (res.ok) {
        const data = await res.json();
        setDragonTigerStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dragon tiger stats:', err);
    }
  };

  const handleSetDragonTigerMode = async (mode: 'lowest_payout' | 'smart_retention_60_40' | 'random' | 'manual') => {
    try {
      const res = await fetch('/api/admin/dragon-tiger/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchDragonTigerStats();
      }
    } catch (err) {
      alert('Error setting dragon tiger mode');
    }
  };

  const handleForceDragonTigerResult = async (winner: 'dragon' | 'tiger' | 'tie' | null) => {
    try {
      const res = await fetch('/api/admin/dragon-tiger/force-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchDragonTigerStats();
      }
    } catch (err) {
      alert('Error setting force result');
    }
  };

  const fetchAviatorStats = async () => {
    try {
      const res = await fetch('/api/admin/aviator/stats');
      if (res.ok) {
        const data = await res.json();
        setAviatorStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch aviator stats:', err);
    }
  };

  const handleSetAviatorMode = async (mode: 'lowest_payout' | 'random' | 'manual') => {
    try {
      const res = await fetch('/api/admin/aviator/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchAviatorStats();
      }
    } catch (err) {
      alert('Error setting aviator mode');
    }
  };

  const handleForceAviatorCrash = async (multiplier: string | null) => {
    try {
      const res = await fetch('/api/admin/aviator/force-crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchAviatorStats();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error setting force crash');
    }
  };

  const fetchColorStats = async () => {
    try {
      const res = await fetch('/api/admin/color-prediction/stats');
      if (res.ok) {
        const data = await res.json();
        setColorStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch color stats:', err);
    }
  };

  const handleForceColorResult = async (num: string | null) => {
    try {
      const res = await fetch('/api/admin/color-prediction/force-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchColorStats();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error setting force result');
    }
  };

  const handleSetColorPredictionMode = async (mode: 'lowest_payout' | 'smart_retention_60_40' | 'random' | 'manual') => {
    try {
      const res = await fetch('/api/admin/color-prediction/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchColorStats();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error setting mode');
    }
  };

  // UPI Gateway & Rotation Pool Handlers
  const handleBulkImportUpi = async (customText?: string) => {
    const textToImport = customText !== undefined ? customText : upiBulkText;
    if (!textToImport.trim()) {
      setUpiBulkMsg({ text: 'Please enter at least one UPI ID in the box.', type: 'error' });
      return;
    }
    setUpiBulkLoading(true);
    setUpiBulkMsg(null);
    try {
      const res = await fetch('/api/admin/upi-pool/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkText: textToImport,
          defaultName: upiDefaultName,
          dailyLimit: upiDailyLimit,
          replaceAll: upiReplaceAll,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpiBulkMsg({
          text: `🎉 ${data.message} Total in pool: ${data.totalCount}`,
          type: 'success',
        });
        if (!customText) setUpiBulkText('');
        // Trigger settings refresh from parent
        await onUpdateSettings({
          ...settings,
          paymentGateway: {
            ...(settings.paymentGateway || ({} as any)),
            enabled: true,
            rotationStrategy: gatewayRotationStrategy,
            defaultUpiId: settings.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
            defaultPayeeName: upiDefaultName,
            subdomainUrl: gatewaySubdomain,
            qrTimerSeconds: gatewayTimerSeconds,
            autoRotateOnRefresh: true,
            upiPool: data.pool,
          },
        });
      } else {
        setUpiBulkMsg({ text: data.error || 'Failed to bulk import UPI IDs', type: 'error' });
      }
    } catch (err: any) {
      setUpiBulkMsg({ text: err?.message || 'Network error importing UPIs', type: 'error' });
    } finally {
      setUpiBulkLoading(false);
    }
  };

  const handleToggleUpi = async (id: string) => {
    try {
      const res = await fetch('/api/admin/upi-pool/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await onUpdateSettings({
          ...settings,
          paymentGateway: {
            ...(settings.paymentGateway || ({} as any)),
            enabled: true,
            rotationStrategy: gatewayRotationStrategy,
            defaultUpiId: settings.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
            defaultPayeeName: settings.paymentGateway?.defaultPayeeName || 'SportX Gaming Official',
            subdomainUrl: gatewaySubdomain,
            qrTimerSeconds: gatewayTimerSeconds,
            autoRotateOnRefresh: true,
            upiPool: data.pool,
          },
        });
      }
    } catch (err) {
      alert('Error toggling UPI status');
    }
  };

  const handleDeleteUpi = async (id: string, upiId: string) => {
    if (!confirm(`Are you sure you want to delete ${upiId} from the active rotation pool?`)) return;
    try {
      const res = await fetch(`/api/admin/upi-pool/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await onUpdateSettings({
          ...settings,
          paymentGateway: {
            ...(settings.paymentGateway || ({} as any)),
            enabled: true,
            rotationStrategy: gatewayRotationStrategy,
            defaultUpiId: settings.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
            defaultPayeeName: settings.paymentGateway?.defaultPayeeName || 'SportX Gaming Official',
            subdomainUrl: gatewaySubdomain,
            qrTimerSeconds: gatewayTimerSeconds,
            autoRotateOnRefresh: true,
            upiPool: data.pool,
          },
        });
      }
    } catch (err) {
      alert('Error deleting UPI ID');
    }
  };

  const handleResetUpiCounts = async () => {
    if (!confirm('Are you sure you want to reset all usage counters and collected amounts back to 0?')) return;
    try {
      const res = await fetch('/api/admin/upi-pool/reset-counts', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        await onUpdateSettings({
          ...settings,
          paymentGateway: {
            ...(settings.paymentGateway || ({} as any)),
            enabled: true,
            rotationStrategy: gatewayRotationStrategy,
            defaultUpiId: settings.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
            defaultPayeeName: settings.paymentGateway?.defaultPayeeName || 'SportX Gaming Official',
            subdomainUrl: gatewaySubdomain,
            qrTimerSeconds: gatewayTimerSeconds,
            autoRotateOnRefresh: true,
            upiPool: data.pool,
          },
        });
      }
    } catch (err) {
      alert('Error resetting counts');
    }
  };

  const handleSaveGatewayConfig = async () => {
    try {
      await onUpdateSettings({
        ...settings,
        paymentGateway: {
          ...(settings.paymentGateway || ({} as any)),
          enabled: true,
          rotationStrategy: gatewayRotationStrategy,
          subdomainUrl: gatewaySubdomain.trim(),
          qrTimerSeconds: Number(gatewayTimerSeconds) || 600,
          defaultUpiId: settings.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
          defaultPayeeName: upiDefaultName,
          autoRotateOnRefresh: true,
          upiPool: settings.paymentGateway?.upiPool || [],
        },
      });
      alert('✅ Payment Gateway & Rotation Config saved successfully!');
    } catch (err) {
      alert('Error saving gateway configuration');
    }
  };

  const handleTestRotatingUpi = async () => {
    setTestingUpi(true);
    try {
      const res = await fetch('/api/payment/active-upi');
      if (res.ok) {
        const data = await res.json();
        setTestRotatingUpiResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingUpi(false);
    }
  };

  const handleAddSingleUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUpiId.trim() || !singleUpiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    await handleBulkImportUpi(`${singleUpiId.trim()}, ${singleUpiName.trim() || upiDefaultName}`);
    setSingleUpiId('');
    setSingleUpiName('');
    setIsAddingSingle(false);
  };

  // Date-Wise Report State & Helpers
  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getThirtyDaysAgoString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [reportStartDate, setReportStartDate] = useState(getThirtyDaysAgoString());
  const [reportEndDate, setReportEndDate] = useState(getTodayString());
  const [reportDetailTab, setReportDetailTab] = useState<'joinings' | 'packages' | 'withdrawals' | 'deposits'>('joinings');

  const formatYYYYMMDD = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  const isDateInRange = (dateStr?: string | null, startStr?: string, endStr?: string) => {
    if (!dateStr) return false;
    const d = formatYYYYMMDD(dateStr);
    if (!d) return false;
    if (startStr && d < startStr) return false;
    if (endStr && d > endStr) return false;
    return true;
  };

  const applyReportPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'allTime') => {
    const today = new Date();
    const todayStr = formatYYYYMMDD(today.toISOString());

    if (preset === 'today') {
      setReportStartDate(todayStr);
      setReportEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatYYYYMMDD(y.toISOString());
      setReportStartDate(yStr);
      setReportEndDate(yStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setReportStartDate(formatYYYYMMDD(d.toISOString()));
      setReportEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setReportStartDate(formatYYYYMMDD(d.toISOString()));
      setReportEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      setReportStartDate(firstDay);
      setReportEndDate(todayStr);
    } else if (preset === 'allTime') {
      setReportStartDate('2020-01-01');
      setReportEndDate(todayStr);
    }
  };

  // Report calculations
  const filteredJoinings = users.filter((u) => isDateInRange(u.registeredAt, reportStartDate, reportEndDate));

  const filteredPackageUsers = users.filter(
    (u) => u.activePackageId && isDateInRange(u.packageActivatedAt || u.registeredAt, reportStartDate, reportEndDate)
  );

  const packageUpgrades = filteredPackageUsers.map((u) => {
    const pkg = settings.packages.find((p) => p.id === u.activePackageId);
    return {
      user: u,
      packageName: pkg?.name || u.activePackageId || 'Active Package',
      packagePrice: pkg?.price || 0,
      activatedAt: u.packageActivatedAt || u.registeredAt,
    };
  });

  const totalPackageRevenue = packageUpgrades.reduce((sum, item) => sum + item.packagePrice, 0);

  const filteredWithdrawals = withdrawalRequests.filter((w) =>
    isDateInRange(w.createdAt, reportStartDate, reportEndDate)
  );

  const totalWithdrawalRequested = filteredWithdrawals.reduce((sum, w) => sum + (w.requestedAmount || 0), 0);
  const approvedWithdrawals = filteredWithdrawals.filter((w) => w.status === 'approved');
  const totalNetApprovedWithdrawals = approvedWithdrawals.reduce(
    (sum, w) => sum + (w.netAmount || w.requestedAmount || 0),
    0
  );
  const pendingWithdrawals = filteredWithdrawals.filter((w) => w.status === 'pending');

  const filteredDeposits = depositRequests.filter((d) => isDateInRange(d.createdAt, reportStartDate, reportEndDate));
  const approvedDeposits = filteredDeposits.filter((d) => d.status === 'approved');
  const totalApprovedDepositsAmount = approvedDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

  const filteredTransactions = transactions.filter((t) => isDateInRange(t.createdAt, reportStartDate, reportEndDate));
  const totalRoiPaid = filteredTransactions
    .filter((t) => t.type === 'roi' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSponsorPaid = filteredTransactions
    .filter((t) => t.type === 'sponsor_bonus' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalLevelPaid = filteredTransactions
    .filter((t) => t.type === 'level_income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const generatePdfReport = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      doc.setFillColor(11, 20, 36);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 38, 210, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NEXUS MATRIX SYSTEM', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text('OFFICIAL DATE-WISE PERFORMANCE & GOVERNANCE REPORT', 14, 22);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, 14, 29);
      doc.text(`Generated On: ${new Date().toLocaleString()} (Admin Root)`, 14, 34);

      let currentY = 46;

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Business Summary', 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Metric Category', 'Count / Total', 'Amount / Value (INR)']],
        body: [
          ['New User Registrations (Joinings)', `${filteredJoinings.length} Users`, '-'],
          ['Package Activations & Upgrades', `${packageUpgrades.length} Packages`, `INR ${totalPackageRevenue.toFixed(2)}`],
          ['Approved Deposits', `${approvedDeposits.length} Approved`, `INR ${totalApprovedDepositsAmount.toFixed(2)}`],
          ['Withdrawal Requests (Total)', `${filteredWithdrawals.length} Requests`, `INR ${totalWithdrawalRequested.toFixed(2)}`],
          ['Approved Net Withdrawals Paid', `${approvedWithdrawals.length} Approved`, `INR ${totalNetApprovedWithdrawals.toFixed(2)}`],
          ['Pending Withdrawals', `${pendingWithdrawals.length} Pending`, '-'],
          ['Commissions Distributed (ROI/Sponsor/Level)', `${filteredTransactions.length} Payouts`, `INR ${(totalRoiPaid + totalSponsorPaid + totalLevelPaid).toFixed(2)}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`2. New User Registrations (${filteredJoinings.length})`, 14, currentY);
      currentY += 4;

      const joiningsRows = filteredJoinings.map((u, index) => [
        index + 1,
        u.nodeId,
        u.name,
        u.email,
        u.sponsorId || 'ROOT',
        u.registeredAt ? formatYYYYMMDD(u.registeredAt) : '-',
      ]);

      if (joiningsRows.length === 0) {
        joiningsRows.push(['-', '-', 'No new joinings in selected date range', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Node ID', 'Full Name', 'Email', 'Sponsor', 'Joined Date']],
        body: joiningsRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`3. Package Upgrades & Activations (${packageUpgrades.length})`, 14, currentY);
      currentY += 4;

      const pkgRows = packageUpgrades.map((item, index) => [
        index + 1,
        item.user.nodeId,
        item.user.name,
        item.packageName,
        `INR ${item.packagePrice}`,
        formatYYYYMMDD(item.activatedAt),
      ]);

      if (pkgRows.length === 0) {
        pkgRows.push(['-', '-', 'No package upgrades in selected date range', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Node ID', 'User Name', 'Package Activated', 'Price (INR)', 'Date']],
        body: pkgRows,
        theme: 'striped',
        headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`4. Withdrawal Requests Breakdown (${filteredWithdrawals.length})`, 14, currentY);
      currentY += 4;

      const wdRows = filteredWithdrawals.map((w, index) => [
        index + 1,
        w.userNodeId,
        w.userName,
        `INR ${w.requestedAmount}`,
        `INR ${w.upgradeDeduction || 0}`,
        `INR ${w.netAmount || w.requestedAmount}`,
        w.status.toUpperCase(),
        formatYYYYMMDD(w.createdAt),
      ]);

      if (wdRows.length === 0) {
        wdRows.push(['-', '-', 'No withdrawals in selected date range', '-', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Node ID', 'User Name', 'Requested', 'Upgrade 20%', 'Net Paid', 'Status', 'Date']],
        body: wdRows,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Nexus Matrix Official Statement | Page ${i} of ${pageCount} | Period: ${reportStartDate} to ${reportEndDate}`,
          105,
          290,
          { align: 'center' }
        );
      }

      doc.save(`Nexus_Report_${reportStartDate}_to_${reportEndDate}.pdf`);
    } catch (err: any) {
      alert('Error generating PDF report: ' + err.message);
    }
  };

  // Rank Reward Management Form State
  const [isCreatingRank, setIsCreatingRank] = useState(false);
  const [newRankName, setNewRankName] = useState('');
  const [newRankRewardTitle, setNewRankRewardTitle] = useState('');
  const [newRankBonusUsdt, setNewRankBonusUsdt] = useState('100');
  const [newRankMinSelfPkg, setNewRankMinSelfPkg] = useState('50');
  const [newRankReqDirects, setNewRankReqDirects] = useState('5');
  const [newRankReqSamePkg, setNewRankReqSamePkg] = useState('5');
  const [newRankUpToLevel, setNewRankUpToLevel] = useState('3');
  const [newRankReqVolume, setNewRankReqVolume] = useState('1000');
  const [newRankIcon, setNewRankIcon] = useState('Award');
  const [newRankColor, setNewRankColor] = useState('#f59e0b');

  // Rank Reward Editing State
  const [editingRankItem, setEditingRankItem] = useState<RankConfig | null>(null);
  const [editRankNameVal, setEditRankNameVal] = useState('');
  const [editRankRewardTitleVal, setEditRankRewardTitleVal] = useState('');
  const [editRankBonusUsdtVal, setEditRankBonusUsdtVal] = useState('0');
  const [editRankMinSelfPkgVal, setEditRankMinSelfPkgVal] = useState('0');
  const [editRankReqDirectsVal, setEditRankReqDirectsVal] = useState('0');
  const [editRankReqSamePkgVal, setEditRankReqSamePkgVal] = useState('0');
  const [editRankUpToLevelVal, setEditRankUpToLevelVal] = useState('0');
  const [editRankReqVolumeVal, setEditRankReqVolumeVal] = useState('0');
  const [editRankIconVal, setEditRankIconVal] = useState('Award');
  const [editRankColorVal, setEditRankColorVal] = useState('#f59e0b');

  // Product Management Form State
  const [isCreatingProd, setIsCreatingProd] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('100');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdBadge, setNewProdBadge] = useState('New');
  const [newProdSizes, setNewProdSizes] = useState('');
  const [newProdColors, setNewProdColors] = useState('');

  // Product Editing State
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('0');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editStock, setEditStock] = useState('0');
  const [editBadge, setEditBadge] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editSizes, setEditSizes] = useState('');
  const [editColors, setEditColors] = useState('');

  useEffect(() => {
    if (editingProd) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [editingProd]);

  // SQLite Engine Status & Query State
  const [sqliteInfo, setSqliteInfo] = useState<any>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [runningSql, setRunningSql] = useState(false);

  // Copy tracking state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchSqliteStatus = async () => {
    try {
      const res = await fetch('/api/admin/sqlite-status');
      const data = await res.json();
      if (data.success) {
        setSqliteInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch sqlite status:', e);
    }
  };

  const handleDownloadSqlite = async () => {
    try {
      const res = await fetch('/api/admin/sqlite-download');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.sqlite';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      alert('Failed to download SQLite file: ' + e.message);
    }
  };

  const handleDownloadJson = async () => {
    try {
      const res = await fetch('/api/admin/json-download');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      alert('Failed to download JSON file: ' + e.message);
    }
  };

  const handleExportUsersCsv = async () => {
    try {
      const res = await fetch('/api/admin/users/export-csv');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL ? window.URL.createObjectURL(blob) : (window as any).webkitURL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_full_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      alert('Failed to export Users CSV: ' + e.message);
    }
  };

  const handleUploadUsersCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await fetch('/api/admin/users/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'CSV import failed');
      alert(data.message || 'Users updated successfully from CSV!');
      window.location.reload();
    } catch (err: any) {
      alert('Error updating Users CSV: ' + err.message);
    }
  };

  const handleChangeUserPassword = async (userId: string, currentPass?: string) => {
    const newPass = prompt(`Change Password for User (Current: "${currentPass || 'None'}"):\nEnter new password:`, currentPass || '');
    if (!newPass || !newPass.trim()) return;
    try {
      const res = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPass.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to change password');
      alert(data.message || 'Password changed successfully!');
      window.location.reload();
    } catch (err: any) {
      alert('Error updating password: ' + err.message);
    }
  };

  // Master Admin Password Change State
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminPassSaving, setAdminPassSaving] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateAdminMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.trim().length < 4) {
      setAdminPassMsg({ text: 'Password must be at least 4 characters long', type: 'error' });
      return;
    }
    setAdminPassSaving(true);
    setAdminPassMsg(null);
    try {
      const rootUser = users.find((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin) || users[0];
      const res = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rootUser?.id || 'usr-root',
          newPassword: adminNewPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to change admin password');
      if (rootUser) {
        rootUser.password = adminNewPassword.trim();
      }
      setAdminPassMsg({
        text: `Admin Master Password updated successfully to "${adminNewPassword.trim()}"! This password is now permanently saved.`,
        type: 'success',
      });
      setAdminNewPassword('');
      setTimeout(() => {
        setAdminPassMsg(null);
      }, 5000);
    } catch (err: any) {
      setAdminPassMsg({ text: err.message || 'Failed to update admin password', type: 'error' });
    } finally {
      setAdminPassSaving(false);
    }
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/admin/json-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Restore failed');
      alert('Database restored successfully! Reloading...');
      window.location.reload();
    } catch (err: any) {
      alert('Error restoring database: ' + err.message);
    }
  };

  useEffect(() => {
    fetchSqliteStatus();
  }, []);

  const handleRunSqlQuery = async () => {
    setRunningSql(true);
    setSqlError(null);
    try {
      const res = await fetch('/api/admin/sqlite-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });
      const data = await res.json();
      if (data.error) {
        setSqlError(data.error);
        setSqlResult(null);
      } else {
        setSqlResult(data.result);
        fetchSqliteStatus();
      }
    } catch (err: any) {
      setSqlError(err.message || 'Execution error');
    } finally {
      setRunningSql(false);
    }
  };

  // Settings Editable Copy State
  const [editableSettings, setEditableSettings] = useState<SystemSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);

  useEffect(() => {
    if (!isSettingsDirty) {
      setEditableSettings(settings);
    }
  }, [settings, isSettingsDirty]);

  const updateEditableSettings = (
    value: SystemSettings | ((prev: SystemSettings) => SystemSettings)
  ) => {
    setIsSettingsDirty(true);
    setEditableSettings(value);
  };

  // User Balance Edit Modal / Inline
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBal, setEditBal] = useState<number>(0);
  const [editUpgBal, setEditUpgBal] = useState<number>(0);

  // Full User Profile Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editNodeId, setEditNodeId] = useState('');
  const [editWallet, setEditWallet] = useState('');
  const [editSponsorId, setEditSponsorId] = useState('');
  const [editBalNum, setEditBalNum] = useState<number>(0);
  const [editDepositBalNum, setEditDepositBalNum] = useState<number>(0);
  const [editUpgBalNum, setEditUpgBalNum] = useState<number>(0);
  const [editPkgId, setEditPkgId] = useState<string>('none');
  const [editRank, setEditRank] = useState<string>('None');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editIsAdmin, setEditIsAdmin] = useState<boolean>(false);
  const [savingUser, setSavingUser] = useState<boolean>(false);

  useEffect(() => {
    if (editingUser) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [editingUser]);

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditPassword(u.password || '');
    setEditNodeId(u.nodeId || '');
    setEditWallet(u.walletAddress || '');
    setEditSponsorId(u.sponsorId || '');
    setEditBalNum(u.balance || 0);
    setEditDepositBalNum(u.depositBalance || 0);
    setEditUpgBalNum(u.upgradeBalance || 0);
    setEditPkgId(u.activePackageId || 'none');
    setEditRank(u.rank || 'None');
    setEditStatus(u.status || 'active');
    setEditIsAdmin(!!(u.isAdmin || u.nodeId === 'NX-ROOT01'));
  };

  const handleSaveFullUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const res = await fetch('/api/admin/users/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editName,
          email: editEmail,
          password: editPassword,
          nodeId: editNodeId,
          walletAddress: editWallet,
          sponsorId: editSponsorId,
          balance: parseFloat(editBalNum as any) || 0,
          depositBalance: parseFloat(editDepositBalNum as any) || 0,
          upgradeBalance: parseFloat(editUpgBalNum as any) || 0,
          activePackageId: editPkgId === 'none' ? null : editPkgId,
          rank: editRank,
          status: editStatus,
          isAdmin: editIsAdmin,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to update user profile');

      alert(data.message || 'User profile updated successfully!');
      setEditingUser(null);
      window.location.reload();
    } catch (err: any) {
      alert('Error updating user profile: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  // User Deletion Modal State
  const [deletingUserModal, setDeletingUserModal] = useState<User | null>(null);
  const [isDeletingUserLoading, setIsDeletingUserLoading] = useState(false);

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser.nodeId === 'NX-ROOT01' || targetUser.id === 'usr-root') {
      alert('Cannot delete ROOT system user!');
      return;
    }
    setDeletingUserModal(targetUser);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUserModal) return;
    if (deletingUserModal.nodeId === 'NX-ROOT01' || deletingUserModal.id === 'usr-root') {
      alert('Cannot delete ROOT system user!');
      setDeletingUserModal(null);
      return;
    }
    setIsDeletingUserLoading(true);
    try {
      if (onDeleteUser) {
        await onDeleteUser(deletingUserModal.id);
      } else {
        const res = await fetch('/api/admin/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: deletingUserModal.id }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to delete user');
      }
      if (editingUser?.id === deletingUserModal.id) {
        setEditingUser(null);
      }
      setDeletingUserModal(null);
    } catch (err: any) {
      alert('Error deleting user: ' + err.message);
    } finally {
      setIsDeletingUserLoading(false);
    }
  };

  // Search User State
  const [userSearch, setUserSearch] = useState('');

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const sanitizedRewards = (editableSettings.spinWheelRewards || []).map((r) => ({
        ...r,
        amount: typeof r.amount === 'number' ? r.amount : (parseFloat(r.amount as any) || 0),
        probability: typeof r.probability === 'number' ? r.probability : (parseFloat(r.probability as any) || 0),
        minLevel: typeof r.minLevel === 'number' ? r.minLevel : (parseInt(r.minLevel as any) || 0),
      }));
      const sanitizedLevelIncome = (editableSettings.levelIncomePercentages || []).map((l, i) => ({
        level: l.level || i + 1,
        percent: typeof l.percent === 'number' ? l.percent : (parseFloat(l.percent as any) || 0),
      }));
      const sanitizedPackages = (editableSettings.packages || []).map((p) => ({
        ...p,
        price: typeof p.price === 'number' ? p.price : (parseFloat(p.price as any) || 0),
        dailyRoiPercent: typeof p.dailyRoiPercent === 'number' ? p.dailyRoiPercent : (parseFloat(p.dailyRoiPercent as any) || 0),
        sponsorBonusPercent: typeof p.sponsorBonusPercent === 'number' ? p.sponsorBonusPercent : (parseFloat(p.sponsorBonusPercent as any) || 0),
        totalRoiReturnPercent: typeof p.totalRoiReturnPercent === 'number' ? p.totalRoiReturnPercent : (parseFloat(p.totalRoiReturnPercent as any) || 0),
        durationDays: typeof p.durationDays === 'number' ? p.durationDays : (parseInt(p.durationDays as any) || 100),
        maxMatrixLevels: typeof p.maxMatrixLevels === 'number' ? p.maxMatrixLevels : (parseInt(p.maxMatrixLevels as any) || 15),
      }));

      const sanitizedTournament = editableSettings.dailyTournament ? {
        enabled: editableSettings.dailyTournament.enabled !== false,
        basePot: typeof editableSettings.dailyTournament.basePot === 'number' ? editableSettings.dailyTournament.basePot : (parseFloat(editableSettings.dailyTournament.basePot as any) || 250),
        turnoverContributionPercent: typeof editableSettings.dailyTournament.turnoverContributionPercent === 'number' ? editableSettings.dailyTournament.turnoverContributionPercent : (parseFloat(editableSettings.dailyTournament.turnoverContributionPercent as any) || 5),
        minWagerToQualify: typeof editableSettings.dailyTournament.minWagerToQualify === 'number' ? editableSettings.dailyTournament.minWagerToQualify : (parseFloat(editableSettings.dailyTournament.minWagerToQualify as any) || 10),
        title: editableSettings.dailyTournament.title || 'Daily Top Bettor Championship 🏆',
        prizeDistribution: (editableSettings.dailyTournament.prizeDistribution || []).map((p, idx) => ({
          rank: p.rank || idx + 1,
          percent: typeof p.percent === 'number' ? p.percent : (parseFloat(p.percent as any) || 0),
        })),
      } : undefined;

      const settingsToSave: any = {
        ...editableSettings,
        minDepositAmount: typeof editableSettings.minDepositAmount === 'number'
          ? editableSettings.minDepositAmount
          : (parseFloat(editableSettings.minDepositAmount as any) || 10),
        minWithdrawalAmount: typeof editableSettings.minWithdrawalAmount === 'number'
          ? editableSettings.minWithdrawalAmount
          : (parseFloat(editableSettings.minWithdrawalAmount as any) || 10),
        withdrawalFeePercent: typeof editableSettings.withdrawalFeePercent === 'number'
          ? editableSettings.withdrawalFeePercent
          : (parseFloat(editableSettings.withdrawalFeePercent as any) || 0),
        upgradeFundDeductionPercent: typeof editableSettings.upgradeFundDeductionPercent === 'number'
          ? editableSettings.upgradeFundDeductionPercent
          : (parseFloat(editableSettings.upgradeFundDeductionPercent as any) || 0),
        winningWithdrawalFeePercent: typeof editableSettings.winningWithdrawalFeePercent === 'number'
          ? editableSettings.winningWithdrawalFeePercent
          : (parseFloat(editableSettings.winningWithdrawalFeePercent as any) || 10),
        winningWithdrawalMinAmount: typeof editableSettings.winningWithdrawalMinAmount === 'number'
          ? editableSettings.winningWithdrawalMinAmount
          : (parseFloat(editableSettings.winningWithdrawalMinAmount as any) || 5),
        spinWheelRewards: sanitizedRewards,
        levelIncomePercentages: sanitizedLevelIncome,
        packages: sanitizedPackages,
        dailyTournament: sanitizedTournament,
        spinWheelIntervalHours: typeof editableSettings.spinWheelIntervalHours === 'number'
          ? editableSettings.spinWheelIntervalHours
          : (parseInt(editableSettings.spinWheelIntervalHours as any) || 24),
        spinCreditsPerReset: typeof editableSettings.spinCreditsPerReset === 'number'
          ? editableSettings.spinCreditsPerReset
          : (parseInt(editableSettings.spinCreditsPerReset as any) || 1),
        luckyDraw: {
          ticketPrice: ldTicketPrice === '' ? 5 : Number(ldTicketPrice),
          prizeAmount: ldPrize1 === '' ? 250 : Number(ldPrize1),
          secondPrizeAmount: ldPrize2 === '' ? 100 : Number(ldPrize2),
          thirdPrizeAmount: ldPrize3 === '' ? 50 : Number(ldPrize3),
          fourthPrizeAmount: ldPrize4 === '' ? 25 : Number(ldPrize4),
          fifthPrizeAmount: ldPrize5 === '' ? 15 : Number(ldPrize5),
          guaranteedPrizeAmount: ldPrizeGuaranteed === '' ? 5 : Number(ldPrizeGuaranteed),
          forcedPrizes: ldForcedPrizes,
        },
      };
      await onUpdateSettings(settingsToSave);

      // Also ensure direct sync to lucky draw endpoint
      try {
        await handleSaveLuckyDrawConfig();
      } catch (_) {}

      setIsSettingsDirty(false);
      alert('✅ System & Tournament Settings Saved Successfully!');
    } catch (err: any) {
      alert('❌ Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDiscardSettings = () => {
    setIsSettingsDirty(false);
    setEditableSettings(settings);
  };

  // Instant Per-Game ON/OFF Toggle State & Handlers
  const [togglingGameKey, setTogglingGameKey] = useState<string | null>(null);
  const [gameToggleMsg, setGameToggleMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleToggleGameVisibility = async (gameKey: GameRouteKey, nextEnabled: boolean) => {
    setTogglingGameKey(gameKey);
    setGameToggleMsg(null);
    try {
      const res = await fetch('/api/admin/games/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-root',
        },
        body: JSON.stringify({ gameKey, enabled: nextEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update game status');
      }
      setEditableSettings((prev) => ({
        ...prev,
        enabledGames: data.enabledGames || {
          ...(prev.enabledGames || {}),
          [gameKey]: nextEnabled,
        },
      }));
      if (onRefreshState) {
        await onRefreshState();
      }
      const meta = GAME_SUBDOMAIN_LIST.find((g) => g.tab === gameKey);
      setGameToggleMsg({
        text: `${meta?.label || gameKey} turned ${nextEnabled ? 'ON (Visible on Front Page)' : 'OFF (Hidden & Remaining Cards Auto-Sequenced)'}`,
        type: 'success',
      });
    } catch (err: any) {
      setGameToggleMsg({ text: err.message || 'Toggle failed', type: 'error' });
    } finally {
      setTogglingGameKey(null);
    }
  };

  const handleToggleAllGames = async (allEnabled: boolean) => {
    setTogglingGameKey('__ALL__');
    setGameToggleMsg(null);
    try {
      const res = await fetch('/api/admin/games/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-root',
        },
        body: JSON.stringify({ allEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle all games');
      }
      setEditableSettings((prev) => ({
        ...prev,
        enabledGames: data.enabledGames,
      }));
      if (onRefreshState) {
        await onRefreshState();
      }
      setGameToggleMsg({
        text: allEnabled
          ? 'All 9 games turned ON and visible on Front Page!'
          : 'All 9 games turned OFF (Front Page games hidden)!',
        type: 'success',
      });
    } catch (err: any) {
      setGameToggleMsg({ text: err.message || 'Bulk toggle failed', type: 'error' });
    } finally {
      setTogglingGameKey(null);
    }
  };

  const renderGameVisibilityPanel = () => {
    const activeMap = editableSettings.enabledGames || settings.enabledGames;
    const frontPageOrder: Array<{ key: GameRouteKey; cardName: string; affects: string }> = [
      { key: 'colorprediction', cardName: 'WIN GO (Color Guess)', affects: 'Front Card + Sidebar + Daily Tournament' },
      { key: 'aviator', cardName: 'AVIATOR (100X Jet)', affects: 'Category Button + Front Card + Sidebar + Tournament' },
      { key: 'luckydraw', cardName: 'LOTTERY (Lucky Draw)', affects: 'Lottery Category Button + Front Card + Sidebar' },
      { key: 'dragontiger', cardName: 'DRAGON vs TIGER', affects: 'Casino Category Button + Front Card + Sidebar' },
      { key: 'cricket', cardName: 'CRICKET Fantasy 11', affects: 'Hero Cricket Banner + Sports Button + Card + Sidebar' },
      { key: 'spinwheel', cardName: 'WHEEL of Fortune', affects: 'Top Wheel Banner + Card + Sidebar' },
      { key: 'slot777', cardName: '777 VEGAS SLOTS', affects: 'Hot Slots & 777 Category Buttons + Card + Sidebar' },
      { key: 'rummy', cardName: 'INDIAN RUMMY', affects: 'Rummy Category Button + Front Card + Sidebar' },
      { key: 'chickenroad', cardName: 'CHICKEN ROAD', affects: 'Chicken Road Button + Front Card + Sidebar' },
    ];

    const enabledList = frontPageOrder.filter((item) =>
      activeMap ? activeMap[item.key] !== false : isGameEnabled(item.key, settings)
    );

    return (
      <div className="bg-[#0b1424] border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_25px_rgba(16,185,129,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              Game ON / OFF Manager (Front Page Visibility & Auto-Sequence)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kisi bhi game ko OFF karne par uska Card, Banner, Category Button aur Sidebar link Front Page se gayab ho jayega aur baaki saare cards bina blank space ke sequence mein set ho jayenge.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={togglingGameKey === '__ALL__'}
              onClick={() => handleToggleAllGames(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition disabled:opacity-50"
            >
              Turn All 9 ON
            </button>
            <button
              type="button"
              disabled={togglingGameKey === '__ALL__'}
              onClick={() => handleToggleAllGames(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition disabled:opacity-50"
            >
              Turn All OFF
            </button>
          </div>
        </div>

        {gameToggleMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              gameToggleMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {gameToggleMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{gameToggleMsg.text}</span>
          </div>
        )}

        {/* Live Front Page Sequence Preview */}
        <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-cyan-300 uppercase">
              Active Front Page Sequence ({enabledList.length}/9 Visible)
            </span>
            <span className="text-[10px] text-slate-400">Zero blank card spaces guaranteed</span>
          </div>
          {enabledList.length === 0 ? (
            <div className="text-xs text-rose-300 font-bold">
              All games are OFF — Maintenance notice displayed on Front Page.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {enabledList.map((item, idx) => {
                const meta = GAME_SUBDOMAIN_LIST.find((g) => g.tab === item.key);
                return (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[11px] font-bold"
                  >
                    <span className="text-amber-300">#{idx + 1}</span>
                    <span>{meta?.icon}</span>
                    <span>{item.cardName.split(' ')[0]}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {frontPageOrder.map((item) => {
            const meta = GAME_SUBDOMAIN_LIST.find((g) => g.tab === item.key);
            const isOn = activeMap ? activeMap[item.key] !== false : isGameEnabled(item.key, settings);
            const busy = togglingGameKey === item.key || togglingGameKey === '__ALL__';

            return (
              <div
                key={item.key}
                className={`rounded-xl p-3.5 border transition flex flex-col justify-between gap-3 ${
                  isOn
                    ? 'bg-[#071411] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                    : 'bg-[#12090d] border-rose-500/30 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                      <span className="text-base">{meta?.icon || '🎮'}</span>
                      <span>{item.cardName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.affects}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 border ${
                      isOn
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isOn ? '● LIVE ON' : '○ OFF'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleGameVisibility(item.key, !isOn)}
                  className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isOn
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>
                    {busy
                      ? 'Updating...'
                      : isOn
                      ? 'Turn OFF (Hide from Front Page)'
                      : 'Turn ON (Show on Front Page)'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBonusSettingsPanel = () => {
    const signupCfg: SignupBonusConfig = editableSettings.signupBonus || {
      enabled: true,
      amountInr: 50,
      creditWallet: 'depositBalance',
      freeSpins: 1,
    };
    const depositCfg: DepositBonusConfig = editableSettings.depositBonus || {
      enabled: true,
      applyTo: 'all_deposits',
      creditWallet: 'depositBalance',
      tiers: [
        { id: 'db-1000', label: 'Greater than ₹1,000', minAmount: 1000, bonusType: 'percent', bonusValue: 5, enabled: true },
        { id: 'db-2000', label: 'Greater than ₹2,000', minAmount: 2000, bonusType: 'percent', bonusValue: 10, enabled: true },
        { id: 'db-5000', label: 'Greater than ₹5,000', minAmount: 5000, bonusType: 'percent', bonusValue: 15, enabled: true },
        { id: 'db-10000', label: 'Greater than ₹10,000', minAmount: 10000, bonusType: 'percent', bonusValue: 20, enabled: true },
      ],
    };

    const updateSignup = (patch: Partial<SignupBonusConfig>) => {
      updateEditableSettings({
        ...editableSettings,
        signupBonus: { ...signupCfg, ...patch },
      });
    };

    const updateDeposit = (patch: Partial<DepositBonusConfig>) => {
      updateEditableSettings({
        ...editableSettings,
        depositBonus: { ...depositCfg, ...patch },
      });
    };

    const addDepositTier = (presetMin?: number, presetVal?: number) => {
      const nextMin = presetMin ?? (depositCfg.tiers.length > 0 ? Math.max(...depositCfg.tiers.map((t) => Number(t.minAmount) || 0)) + 1000 : 1000);
      const newTier: DepositBonusTier = {
        id: `db-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: `Greater than ₹${nextMin.toLocaleString('en-IN')}`,
        minAmount: nextMin,
        bonusType: 'percent',
        bonusValue: presetVal ?? 10,
        enabled: true,
      };
      updateDeposit({ tiers: [...(depositCfg.tiers || []), newTier].sort((a, b) => a.minAmount - b.minAmount) });
    };

    const updateTierField = (id: string, patch: Partial<DepositBonusTier>) => {
      const next = (depositCfg.tiers || []).map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        if (patch.minAmount !== undefined && (!t.label || t.label.startsWith('Greater than'))) {
          merged.label = `Greater than ₹${(Number(patch.minAmount) || 0).toLocaleString('en-IN')}`;
        }
        return merged;
      });
      updateDeposit({ tiers: next });
    };

    const removeTier = (id: string) => {
      updateDeposit({ tiers: (depositCfg.tiers || []).filter((t) => t.id !== id) });
    };

    const simulateDepositBonus = (amtInr: number) => {
      if (!depositCfg.enabled) return { bonusInr: 0, label: 'Bonus OFF' };
      const sorted = [...(depositCfg.tiers || [])]
        .filter((t) => t.enabled !== false && Number(t.bonusValue) > 0)
        .sort((a, b) => Number(b.minAmount) - Number(a.minAmount));
      const matched = sorted.find((t) => amtInr >= Number(t.minAmount));
      if (!matched) return { bonusInr: 0, label: 'No Slab Match' };
      const bonusInr =
        matched.bonusType === 'fixed'
          ? Number(matched.bonusValue) || 0
          : (amtInr * (Number(matched.bonusValue) || 0)) / 100;
      return {
        bonusInr,
        label: matched.bonusType === 'fixed' ? `Flat ₹${matched.bonusValue}` : `${matched.bonusValue}%`,
      };
    };

    return (
      <div className="space-y-6">
        {/* Top Action & Save Header */}
        <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.12)]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              Signup Bonus &amp; Range-Wise Deposit Bonus Engine
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Naye users ke liye Signup Bonus aur Deposit amount slabs (Greater than ₹1,000, ₹2,000, ₹5,000...) yahan se set karein.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isSettingsDirty && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Unsaved Changes
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Bonus Settings'}</span>
            </button>
          </div>
        </div>

        {/* CARD 1: SIGNUP BONUS SETTINGS */}
        <div className="bg-[#0b1424] border border-cyan-500/35 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                1. Welcome Signup Bonus (On New User Registration)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Jab koi naya user Sign Up karega to uske wallet me turant ye bonus credit ho jayega.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSignup({ enabled: !signupCfg.enabled })}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-2 shrink-0 ${
                signupCfg.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{signupCfg.enabled ? '● SIGNUP BONUS ON' : '○ SIGNUP BONUS OFF'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#050911] border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="text-[11px] font-bold text-cyan-400 uppercase block">
                Signup Bonus Amount (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={signupCfg.amountInr ?? 50}
                onChange={(e) => updateSignup({ amountInr: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full bg-[#0d1726] border border-cyan-500/30 rounded-lg px-3 py-2 text-emerald-300 font-extrabold text-sm focus:outline-none focus:border-cyan-400"
              />
              <div className="text-[10px] text-slate-400">
                Ledger Credit: <strong className="text-cyan-300">₹{(signupCfg.amountInr || 0).toLocaleString('en-IN')} INR</strong> (Direct Balance Credit)
              </div>
            </div>

            <div className="bg-[#050911] border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="text-[11px] font-bold text-purple-400 uppercase block">
                Free Welcome Spins on Signup
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={signupCfg.freeSpins ?? 1}
                onChange={(e) => updateSignup({ freeSpins: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-[#0d1726] border border-purple-500/30 rounded-lg px-3 py-2 text-purple-300 font-extrabold text-sm focus:outline-none focus:border-purple-400"
              />
              <div className="text-[10px] text-slate-400">
                Spin credits given immediately at registration (0 = No free spin)
              </div>
            </div>

            <div className="bg-[#050911] border border-slate-800 rounded-xl p-4 space-y-2">
              <label className="text-[11px] font-bold text-amber-400 uppercase block">
                Credit To Wallet
              </label>
              <select
                value={signupCfg.creditWallet || 'depositBalance'}
                onChange={(e) => updateSignup({ creditWallet: e.target.value as any })}
                className="w-full bg-[#0d1726] border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200 font-bold text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="depositBalance">Deposit / Gaming Wallet (Recommended - Play Only)</option>
                <option value="winningBalance">Winning Wallet (Withdrawable)</option>
                <option value="balance">Main Agency Wallet</option>
              </select>
              <div className="text-[10px] text-slate-400">
                Deposit Wallet keeps house safe: users must play &amp; win before withdrawing.
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: RANGE-WISE DEPOSIT BONUS SETTINGS */}
        <div className="bg-[#0b1424] border border-emerald-500/35 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                2. Deposit Bonus Range Rules (Greater Than ₹1000, ₹2000, etc.)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Har deposit range ke liye alag bonus (% ya Fixed ₹) set karein. Sabse bada matching slab automatically apply hoga jab deposit approve hoga.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateDeposit({ enabled: !depositCfg.enabled })}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-2 shrink-0 ${
                depositCfg.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{depositCfg.enabled ? '● DEPOSIT BONUS ON' : '○ DEPOSIT BONUS OFF'}</span>
            </button>
          </div>

          {/* Global Deposit Bonus Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Apply Bonus Rule On</label>
              <select
                value={depositCfg.applyTo || 'all_deposits'}
                onChange={(e) => updateDeposit({ applyTo: e.target.value as any })}
                className="w-full bg-[#0d1726] border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-300 font-bold text-xs focus:outline-none"
              >
                <option value="all_deposits">Every Qualifying Deposit (Har Deposit Par)</option>
                <option value="first_deposit_only">First Approved Deposit Only (Sirf Pehli Baar)</option>
              </select>
            </div>

            <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Bonus Credit Wallet</label>
              <select
                value={depositCfg.creditWallet || 'depositBalance'}
                onChange={(e) => updateDeposit({ creditWallet: e.target.value as any })}
                className="w-full bg-[#0d1726] border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200 font-bold text-xs focus:outline-none"
              >
                <option value="depositBalance">Deposit / Gaming Wallet (Recommended)</option>
                <option value="winningBalance">Winning Wallet (Withdrawable)</option>
                <option value="balance">Main Agency Wallet</option>
              </select>
            </div>
          </div>

          {/* Add Range Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs font-bold text-slate-300">
              Configured Range Slabs ({depositCfg.tiers?.length || 0})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => addDepositTier()}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Range Slab</span>
              </button>
            </div>
          </div>

          {/* Range Slabs Table */}
          <div className="space-y-2.5">
            {(depositCfg.tiers || []).length === 0 ? (
              <div className="bg-[#050911] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
                Abhi koi deposit range slab nahi hai. &quot;Add New Range Slab&quot; par click karke ₹1,000, ₹2,000 jaise range add karein.
              </div>
            ) : (
              [...(depositCfg.tiers || [])]
                .sort((a, b) => Number(a.minAmount) - Number(b.minAmount))
                .map((tier) => {
                  const previewDeposit = Math.max(Number(tier.minAmount) || 1000, 1000);
                  const previewBonus =
                    tier.bonusType === 'fixed'
                      ? Number(tier.bonusValue) || 0
                      : (previewDeposit * (Number(tier.bonusValue) || 0)) / 100;

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border transition grid grid-cols-1 md:grid-cols-12 gap-3 items-center ${
                        tier.enabled !== false
                          ? 'bg-[#071411] border-emerald-500/35'
                          : 'bg-[#120b10] border-slate-800 opacity-70'
                      }`}
                    >
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-emerald-400 block">
                          Greater Than / ≥ Deposit (₹ INR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={tier.minAmount}
                          onChange={(e) =>
                            updateTierField(tier.id, { minAmount: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full bg-[#050911] border border-emerald-500/30 rounded-lg px-3 py-1.5 text-white font-extrabold text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Display Title
                        </label>
                        <input
                          type="text"
                          value={tier.label || ''}
                          placeholder={`Greater than ₹${tier.minAmount}`}
                          onChange={(e) => updateTierField(tier.id, { label: e.target.value })}
                          className="w-full bg-[#050911] border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-200 font-bold text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Bonus Type
                        </label>
                        <select
                          value={tier.bonusType || 'percent'}
                          onChange={(e) => updateTierField(tier.id, { bonusType: e.target.value as 'percent' | 'fixed' })}
                          className="w-full bg-[#050911] border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-bold text-xs focus:outline-none"
                        >
                          <option value="percent">% Percentage</option>
                          <option value="fixed">Flat ₹ Amount</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-amber-400 block">
                          {tier.bonusType === 'fixed' ? 'Bonus (₹ INR)' : 'Bonus (%)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={tier.bonusValue}
                          onChange={(e) =>
                            updateTierField(tier.id, { bonusValue: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full bg-[#050911] border border-amber-500/30 rounded-lg px-3 py-1.5 text-amber-300 font-extrabold text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-end gap-2 pt-3 md:pt-4">
                        <button
                          type="button"
                          onClick={() => updateTierField(tier.id, { enabled: tier.enabled === false })}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold border transition ${
                            tier.enabled !== false
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tier.enabled !== false ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTier(tier.id)}
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                          title="Delete Slab"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="md:col-span-12 text-[10px] text-slate-400 flex flex-wrap items-center justify-between border-t border-slate-800/70 pt-2">
                        <span>
                          Rule: Deposit <strong className="text-white">≥ ₹{Number(tier.minAmount).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-emerald-300 font-bold">
                          Example: ₹{previewDeposit.toLocaleString('en-IN')} deposit par +₹{previewBonus.toFixed(0)} bonus milega
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Live Bonus Simulator */}
          <div className="bg-[#050911] border border-cyan-500/25 rounded-xl p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Live Deposit Bonus Calculator Preview
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[500, 1000, 2000, 5000, 10000].map((amt) => {
                const sim = simulateDepositBonus(amt);
                return (
                  <div key={amt} className="bg-[#0b1424] border border-slate-800 rounded-lg p-2.5 space-y-0.5">
                    <div className="text-[10px] text-slate-400">Deposit ₹{amt.toLocaleString('en-IN')}</div>
                    <div className={`font-extrabold ${sim.bonusInr > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      +₹{sim.bonusInr.toFixed(0)} Bonus
                    </div>
                    <div className="text-[9px] text-cyan-300">{sim.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nodeId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-[#1a1309] via-[#120e06] to-[#0c1320] border border-amber-500/50 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.15)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${isSuperAdmin ? 'text-amber-400' : 'text-purple-400'}`} />
              <span className={`text-xs uppercase tracking-widest font-bold ${isSuperAdmin ? 'text-amber-400' : 'text-purple-400'}`}>
                {isSuperAdmin ? '👑 Super Admin Master Authority' : `🛡️ Sub-Admin Console: ${currentUser?.adminRoleName || 'Limited Operator'}`}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {isSuperAdmin
                ? 'Platform Sovereign Governance & Sub-Admin Control'
                : `Active Operator: ${currentUser?.name} (${currentUser?.nodeId})`}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isSuperAdmin ? (
                <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
                  Full Sovereign Access to All Games, Finances, Users & Roles
                </span>
              ) : (
                <>
                  <span className="text-[11px] text-slate-400 font-mono">Granted Powers:</span>
                  {perms.canManageDeposits && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Deposits Only
                    </span>
                  )}
                  {perms.canManageWithdrawals && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Withdrawals Only
                    </span>
                  )}
                  {perms.canManageColorPrediction && (
                    <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Win Go (Color) Control
                    </span>
                  )}
                  {perms.canManageDragonTiger && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Dragon vs Tiger Control
                    </span>
                  )}
                  {perms.canManageAviator && (
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Aviator Crash Control
                    </span>
                  )}
                  {perms.canManageLottery && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Lottery & Lucky Draw
                    </span>
                  )}
                  {perms.canManageUpiGateway && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ UPI Gateway Pool
                    </span>
                  )}
                  {perms.canManageUsers && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ User Balances
                    </span>
                  )}
                  {perms.canViewReports && (
                    <span className="text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/40 px-2 py-0.5 rounded-full font-bold">
                      ✓ Financial Reports
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isSuperAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/50'
            }`}>
              {isSuperAdmin ? 'Root Master: NX-ROOT01' : `Sub-Admin Node: ${currentUser?.nodeId}`}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0b1424] border border-slate-800 p-2 rounded-2xl text-xs font-bold">
        {canAccess('subadmins') && (
          <button
            onClick={() => {
              setActiveTab('subadmins');
              fetchSubadmins();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'subadmins'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>👥 Sub-Admins & Roles ({subadminsList.length})</span>
          </button>
        )}

        {canAccess('deposits') && (
          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'deposits'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            Deposits ({depositRequests.filter((d) => d.status === 'pending').length} Pending)
          </button>
        )}

        {canAccess('withdrawals') && (
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'withdrawals'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            Withdrawals ({withdrawalRequests.filter((w) => w.status === 'pending').length} Pending)
          </button>
        )}

        {canAccess('color_prediction') && (
          <button
            onClick={() => {
              setActiveTab('color_prediction');
              fetchColorStats();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'color_prediction'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4 text-cyan-400" />
            Color Prediction Control
          </button>
        )}

        {canAccess('dragon_tiger') && (
          <button
            onClick={() => {
              setActiveTab('dragon_tiger');
              fetchDragonTigerStats();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'dragon_tiger'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Dragon vs Tiger Control
          </button>
        )}

        {canAccess('aviator_game') && (
          <button
            onClick={() => {
              setActiveTab('aviator_game');
              fetchAviatorStats();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'aviator_game'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-red-400" />
            Aviator Game Control
          </button>
        )}

        {canAccess('tournament') && (
          <button
            onClick={() => {
              setActiveTab('tournament');
              fetchAdminTournament();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'tournament'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            Top Bettor Tournament
          </button>
        )}

        {canAccess('lottery_draw') && (
          <button
            onClick={() => {
              setActiveTab('lottery_draw');
              fetchAdminLuckyDraw();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'lottery_draw'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            Lottery & Lucky Draw
          </button>
        )}

        {canAccess('upi_gateway') && (
          <button
            onClick={() => setActiveTab('upi_gateway')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'upi_gateway'
                ? 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>⚡ UPI Gateway (100+ Pool)</span>
          </button>
        )}

        {canAccess('users') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'users'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            User Manager ({users.length})
          </button>
        )}

        {canAccess('game_controls') && (
          <button
            onClick={() => setActiveTab('game_controls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'game_controls'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4 text-emerald-400" />
            <span>🎮 Game ON/OFF</span>
          </button>
        )}

        {canAccess('bonuses') && (
          <button
            onClick={() => setActiveTab('bonuses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'bonuses'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>🎁 Signup &amp; Deposit Bonus</span>
          </button>
        )}

        {canAccess('settings') && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            System Config
          </button>
        )}

        {canAccess('reports') && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'reports'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Date-Wise Report (PDF)
          </button>
        )}

        {canAccess('audit') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            Audit & Logs
          </button>
        )}

        {canAccess('sqlite') && (
          <button
            onClick={() => {
              setActiveTab('sqlite');
              fetchSqliteStatus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'sqlite'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            SQLite DB Manager {sqliteInfo?.fileSizeKb ? `(${sqliteInfo.fileSizeKb} KB)` : ''}
          </button>
        )}

        {canAccess('boosting') && (
          <button
            onClick={() => setActiveTab('boosting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'boosting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Boosting Queue ({boostingQueue.length})
          </button>
        )}

        {canAccess('products') && (
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'products'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            SportX Mart Products ({products.length})
          </button>
        )}

        {canAccess('ranks') && (
          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'ranks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Rank & Rewards ({settings.ranks?.length || 0})
          </button>
        )}
      </div>

      {/* TAB 0: GAME VISIBILITY ON / OFF MANAGER */}
      {activeTab === 'game_controls' && (
        <div className="space-y-6">
          {renderGameVisibilityPanel()}
        </div>
      )}

      {/* TAB 0B: SIGNUP & DEPOSIT BONUS ENGINE */}
      {activeTab === 'bonuses' && (
        <div className="space-y-6">
          {renderBonusSettingsPanel()}
        </div>
      )}

      {/* TAB 1: SYSTEM SETTINGS CONFIG */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Top Save Bar */}
          <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Global Protocol & System Engine Controls
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure Daily ROI rates, Max Capping %, Team Level Commissions, and Wallet Rules in real-time.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isSettingsDirty && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Unsaved Changes
                </span>
              )}
              {isSettingsDirty && (
                <button
                  type="button"
                  onClick={handleDiscardSettings}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2 shrink-0"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Saving All Changes...' : 'Save All Settings'}
              </button>
            </div>
          </div>

          {/* SECTION 0: MASTER ADMIN SECURITY & PERMANENT PASSWORD CONTROLS */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Master Admin Password & Security Settings
                </h4>
                <p className="text-[11px] text-slate-400">
                  Set and update the Master Administrator password. Once changed, this new password is permanently saved to the database and will NOT revert to any default password.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Current Master Password:</span>
                <span className="font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                  {users.find((u) => u.id === 'usr-root' || u.nodeId === 'NX-ROOT01' || u.isAdmin)?.password || '123456'}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateAdminMasterPassword} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Set New Master Admin Password</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Enter new master password (min 4 characters)"
                      className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={adminPassSaving || !adminNewPassword.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {adminPassSaving ? 'Updating Password...' : 'Save New Master Password'}
                  </button>
                </div>
              </div>

              {adminPassMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  adminPassMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {adminPassMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{adminPassMsg.text}</span>
                </div>
              )}
            </form>
          </div>

          {/* SECTION 0.25: GAME VISIBILITY (ON/OFF) & AUTO-SEQUENCE */}
          {renderGameVisibilityPanel()}

          {/* SECTION 0.5: PER-GAME SUBDOMAIN ROUTING & SHARED MAIN WALLET CONFIG */}
          <div className="bg-[#0b1424] border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Per-Game Subdomain Routing & Shared Main Wallet SSO
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Har game ko alag subdomain par chalayein (jaise aviator.yourdomain.com, wingo.yourdomain.com). Sabhi subdomains par Front Page, Login Session aur Main Wallet Deduction 100% shared rahega.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-cyan-300 cursor-pointer shrink-0 bg-[#050911] border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={editableSettings.gameSubdomains?.enabled !== false}
                  onChange={(e) => {
                    updateEditableSettings({
                      ...editableSettings,
                      gameSubdomains: {
                        enabled: e.target.checked,
                        rootDomain: editableSettings.gameSubdomains?.rootDomain || '',
                        mainAppUrl: editableSettings.gameSubdomains?.mainAppUrl || '',
                        apiBaseUrl: editableSettings.gameSubdomains?.apiBaseUrl || '',
                        autoSubdomainOnCustomDomain: editableSettings.gameSubdomains?.autoSubdomainOnCustomDomain !== false,
                        urls: editableSettings.gameSubdomains?.urls || {},
                      },
                    });
                  }}
                  className="accent-cyan-400 w-4 h-4"
                />
                <span>Subdomains Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Root Domain (e.g. sportx.game)
                </label>
                <input
                  type="text"
                  value={editableSettings.gameSubdomains?.rootDomain || ''}
                  onChange={(e) =>
                    updateEditableSettings({
                      ...editableSettings,
                      gameSubdomains: {
                        enabled: editableSettings.gameSubdomains?.enabled !== false,
                        rootDomain: e.target.value,
                        mainAppUrl: editableSettings.gameSubdomains?.mainAppUrl || '',
                        apiBaseUrl: editableSettings.gameSubdomains?.apiBaseUrl || '',
                        autoSubdomainOnCustomDomain: editableSettings.gameSubdomains?.autoSubdomainOnCustomDomain !== false,
                        urls: editableSettings.gameSubdomains?.urls || {},
                      },
                    })
                  }
                  placeholder="yourdomain.com"
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Shared Front Page URL
                </label>
                <input
                  type="text"
                  value={editableSettings.gameSubdomains?.mainAppUrl || ''}
                  onChange={(e) =>
                    updateEditableSettings({
                      ...editableSettings,
                      gameSubdomains: {
                        enabled: editableSettings.gameSubdomains?.enabled !== false,
                        rootDomain: editableSettings.gameSubdomains?.rootDomain || '',
                        mainAppUrl: e.target.value,
                        apiBaseUrl: editableSettings.gameSubdomains?.apiBaseUrl || '',
                        autoSubdomainOnCustomDomain: editableSettings.gameSubdomains?.autoSubdomainOnCustomDomain !== false,
                        urls: editableSettings.gameSubdomains?.urls || {},
                      },
                    })
                  }
                  placeholder="https://yourdomain.com"
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Shared Wallet API URL (Optional)
                </label>
                <input
                  type="text"
                  value={editableSettings.gameSubdomains?.apiBaseUrl || ''}
                  onChange={(e) =>
                    updateEditableSettings({
                      ...editableSettings,
                      gameSubdomains: {
                        enabled: editableSettings.gameSubdomains?.enabled !== false,
                        rootDomain: editableSettings.gameSubdomains?.rootDomain || '',
                        mainAppUrl: editableSettings.gameSubdomains?.mainAppUrl || '',
                        apiBaseUrl: e.target.value,
                        autoSubdomainOnCustomDomain: editableSettings.gameSubdomains?.autoSubdomainOnCustomDomain !== false,
                        urls: editableSettings.gameSubdomains?.urls || {},
                      },
                    })
                  }
                  placeholder="https://yourdomain.com (leave blank if same backend)"
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editableSettings.gameSubdomains?.autoSubdomainOnCustomDomain !== false}
                  onChange={(e) =>
                    updateEditableSettings({
                      ...editableSettings,
                      gameSubdomains: {
                        enabled: editableSettings.gameSubdomains?.enabled !== false,
                        rootDomain: editableSettings.gameSubdomains?.rootDomain || '',
                        mainAppUrl: editableSettings.gameSubdomains?.mainAppUrl || '',
                        apiBaseUrl: editableSettings.gameSubdomains?.apiBaseUrl || '',
                        autoSubdomainOnCustomDomain: e.target.checked,
                        urls: editableSettings.gameSubdomains?.urls || {},
                      },
                    })
                  }
                  className="accent-cyan-400"
                />
                <span>Auto-detect custom domain subdomains automatically</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const cleanRoot = (
                    (editableSettings.gameSubdomains?.rootDomain || '').trim() ||
                    (typeof window !== 'undefined' ? window.location.hostname : '')
                  )
                    .replace(/^https?:\/\//i, '')
                    .replace(/\/.*$/, '');
                  if (!cleanRoot) return;
                  const autoUrls: Record<string, string> = {};
                  GAME_SUBDOMAIN_LIST.forEach((g) => {
                    autoUrls[g.tab] = `https://${g.prefix}.${cleanRoot}`;
                  });
                  const payUrl = `https://pay.${cleanRoot}`;
                  setGatewaySubdomain(payUrl);
                  updateEditableSettings({
                    ...editableSettings,
                    paymentGateway: editableSettings.paymentGateway
                      ? { ...editableSettings.paymentGateway, subdomainUrl: payUrl }
                      : undefined,
                    gameSubdomains: {
                      enabled: true,
                      rootDomain: cleanRoot,
                      mainAppUrl: editableSettings.gameSubdomains?.mainAppUrl?.trim() || `https://${cleanRoot}`,
                      apiBaseUrl: editableSettings.gameSubdomains?.apiBaseUrl?.trim() || `https://${cleanRoot}`,
                      autoSubdomainOnCustomDomain: true,
                      urls: autoUrls as any,
                    },
                  });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                1-Click Auto-Fill All 9 Game Subdomains + Pay
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {GAME_SUBDOMAIN_LIST.map((game) => (
                <div key={game.tab} className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span>{game.icon}</span>
                      <span>{game.label}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {game.prefix}.*
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editableSettings.gameSubdomains?.urls?.[game.tab] || ''}
                    onChange={(e) => {
                      const prev = editableSettings.gameSubdomains || {
                        enabled: true,
                        rootDomain: '',
                        urls: {},
                      };
                      updateEditableSettings({
                        ...editableSettings,
                        gameSubdomains: {
                          ...prev,
                          urls: {
                            ...(prev.urls || {}),
                            [game.tab]: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder={`https://${game.prefix}.${editableSettings.gameSubdomains?.rootDomain || 'yourdomain.com'}`}
                    className="w-full bg-[#09111e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1: DAILY ROI & PACKAGE CAPPING MANAGER */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Daily ROI Yield & Package Capping Configuration
                </h4>
                <p className="text-[11px] text-slate-400">
                  Set daily mining ROI %, total capping return %, duration, and max matrix levels per package tier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newPkg = {
                    id: `pkg-${Date.now()}`,
                    name: 'Custom Node',
                    price: 1000,
                    dailyRoiPercent: 2.0,
                    durationDays: 100,
                    maxMatrixLevels: 5,
                    totalRoiReturnPercent: 200,
                    sponsorBonusPercent: 10,
                    badgeColor: '#06b6d4',
                    tierRank: editableSettings.packages.length + 1,
                  };
                  setEditableSettings({
                    ...editableSettings,
                    packages: [...editableSettings.packages, newPkg],
                  });
                  setIsSettingsDirty(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Package
              </button>
            </div>

            {/* Quick Helper Plan Guidance Box */}
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 space-y-1">
              <span className="font-extrabold text-amber-300 flex items-center gap-1.5 uppercase text-[11px]">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2-Package Plan Setup Guide (₹1,000 Joining + ₹2,000 Upgrade):
              </span>
              <p className="text-[11px] text-slate-300">
                1. <strong>₹1,000 Starter Package (Joining)</strong>: Price = <strong>₹1,000</strong>, Daily ROI = <strong>1%</strong> (or 1.5%), Capping = <strong>200%</strong>. This package generates daily ROI yield, sponsor bonus, and level income.
                <br />
                2. <strong>₹2,000 Upgrade Package (Booster/Qualifier)</strong>: Price = <strong>₹2,000</strong>, Daily ROI = <strong>0%</strong>, Sponsor Bonus = <strong>0%</strong>, Capping = <strong>0%</strong>. Mark this package as <em>Upgrade Package</em>. It qualifies the account and unlocks payouts without generating direct sponsor bonus.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 text-xs">
              {editableSettings.packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="bg-[#050911] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 relative group"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="font-extrabold text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: pkg.badgeColor }}
                      />
                      Tier #{idx + 1}: {pkg.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditableSettings({
                          ...editableSettings,
                          packages: editableSettings.packages.filter((p) => p.id !== pkg.id),
                        });
                        setIsSettingsDirty(true);
                      }}
                      className="text-slate-500 hover:text-red-400 transition"
                      title="Delete Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Package Name</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => {
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-1.5 text-white mt-1 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Price (₹ INR)</label>
                      <input
                        type="number"
                        step="any"
                        value={pkg.price === undefined || pkg.price === null ? '' : pkg.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], price: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-1.5 text-emerald-400 mt-1 font-bold"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-emerald-400 uppercase font-extrabold">Daily ROI (%)</label>
                      <input
                        type="number"
                        step="any"
                        value={pkg.dailyRoiPercent === undefined || pkg.dailyRoiPercent === null ? '' : pkg.dailyRoiPercent}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], dailyRoiPercent: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-emerald-500/50 rounded-lg p-1.5 text-emerald-300 mt-1 font-extrabold"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-cyan-400 uppercase font-extrabold flex items-center gap-1">
                        Sponsor Income (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={pkg.sponsorBonusPercent === undefined || pkg.sponsorBonusPercent === null ? '' : pkg.sponsorBonusPercent}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], sponsorBonusPercent: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-cyan-500/50 rounded-lg p-1.5 text-cyan-300 mt-1 font-extrabold"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-400 uppercase font-extrabold">Max Capping / Return (%)</label>
                      <input
                        type="number"
                        step="any"
                        value={pkg.totalRoiReturnPercent === undefined || pkg.totalRoiReturnPercent === null ? '' : pkg.totalRoiReturnPercent}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], totalRoiReturnPercent: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-amber-500/50 rounded-lg p-1.5 text-amber-300 mt-1 font-extrabold"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Duration (Days)</label>
                      <input
                        type="number"
                        step="1"
                        value={pkg.durationDays === undefined || pkg.durationDays === null ? '' : pkg.durationDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], durationDays: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-1.5 text-cyan-300 mt-1 font-bold"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Max Matrix Levels</label>
                      <input
                        type="number"
                        step="1"
                        value={pkg.maxMatrixLevels === undefined || pkg.maxMatrixLevels === null ? '' : pkg.maxMatrixLevels}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...editableSettings.packages];
                          updated[idx] = { ...updated[idx], maxMatrixLevels: val as any };
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-1.5 text-purple-300 mt-1 font-bold"
                        placeholder="15"
                      />
                    </div>

                    <div className="col-span-2 bg-[#09101d] border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-300 font-bold">Upgrade/Qualifier Package (0% Daily ROI)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!(pkg.isUpgradePackage || pkg.price === 20 || pkg.dailyRoiPercent === 0)}
                        onChange={(e) => {
                          const updated = [...editableSettings.packages];
                          updated[idx].isUpgradePackage = e.target.checked;
                          if (e.target.checked) {
                            updated[idx].dailyRoiPercent = 0;
                            updated[idx].totalRoiReturnPercent = 0;
                            updated[idx].sponsorBonusPercent = 0;
                          }
                          setEditableSettings({ ...editableSettings, packages: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: TEAM LEVEL COMMISSION % MATRIX MANAGER */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Team Level Commission (%) Distribution Hierarchy
                </h4>
                <p className="text-[11px] text-slate-400">
                  Set team level income percentages for upline referrals when a downline node activates or upgrades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextLevelNum = (editableSettings.levelIncomePercentages || []).length + 1;
                  setEditableSettings({
                    ...editableSettings,
                    levelIncomePercentages: [
                      ...(editableSettings.levelIncomePercentages || []),
                      { level: nextLevelNum, percent: 1 },
                    ],
                  });
                  setIsSettingsDirty(true);
                }}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Team Level
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 text-xs">
              {(editableSettings.levelIncomePercentages || []).map((lvl, idx) => (
                <div
                  key={lvl.level}
                  className="bg-[#050911] border border-slate-800 rounded-xl p-3 text-center space-y-2 relative group"
                >
                  <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold uppercase">
                    <span>Lvl {lvl.level}</span>
                    {(editableSettings.levelIncomePercentages || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = (editableSettings.levelIncomePercentages || []).filter(
                            (_, i) => i !== idx
                          );
                          // re-index levels
                          const reindexed = filtered.map((item, i) => ({
                            ...item,
                            level: i + 1,
                          }));
                          setEditableSettings({
                            ...editableSettings,
                            levelIncomePercentages: reindexed,
                          });
                          setIsSettingsDirty(true);
                        }}
                        className="text-slate-600 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={lvl.percent === undefined || lvl.percent === null ? '' : lvl.percent}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = [...(editableSettings.levelIncomePercentages || [])];
                        updated[idx] = { ...updated[idx], percent: val as any };
                        setEditableSettings({
                          ...editableSettings,
                          levelIncomePercentages: updated,
                        });
                        setIsSettingsDirty(true);
                      }}
                      className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-1.5 text-center text-cyan-300 font-extrabold text-sm focus:outline-none focus:border-amber-400"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-slate-500 absolute right-2 top-2">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2.5: SPECIAL SPONSOR LEVEL MATCHING BONUS CONFIG (DYNAMIC RULE ENGINE) */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  Special Direct Sponsor Level Matching Bonus (Dynamic Rule Engine)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct Sponsor gets 100% (or custom %) matching bonus when their referred member earns Level Income from a target level (e.g. Level 7).
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#050911] border border-amber-500/30 px-3 py-1.5 rounded-xl">
                <span className="text-[11px] font-bold text-slate-300 uppercase">Enable Bonus Protocol</span>
                <input
                  type="checkbox"
                  checked={editableSettings.specialSponsorBonus?.enabled ?? true}
                  onChange={(e) => {
                    const current = editableSettings.specialSponsorBonus || {
                      enabled: true,
                      targetLevel: 7,
                      matchingPercent: 100,
                      requiredSelfPackagePrice: 10,
                      requiredDirectsCount: 2,
                    };
                    updateEditableSettings({
                      ...editableSettings,
                      specialSponsorBonus: { ...current, enabled: e.target.checked },
                    });
                  }}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1">
                <label className="text-[10px] text-amber-400 font-extrabold uppercase">
                  Target Level (e.g., Level 7)
                </label>
                <p className="text-[10px] text-slate-500">
                  Level in direct referral's team that triggers 100% bonus to Sponsor
                </p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={editableSettings.specialSponsorBonus?.targetLevel ?? 7}
                    onChange={(e) => {
                      const current = editableSettings.specialSponsorBonus || {
                        enabled: true,
                        targetLevel: 7,
                        matchingPercent: 100,
                        requiredSelfPackagePrice: 10,
                        requiredDirectsCount: 2,
                      };
                      updateEditableSettings({
                        ...editableSettings,
                        specialSponsorBonus: {
                          ...current,
                          targetLevel: parseInt(e.target.value) || 1,
                        },
                      });
                    }}
                    className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-extrabold"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">Level</span>
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1">
                <label className="text-[10px] text-emerald-400 font-extrabold uppercase">
                  Matching Percentage (%)
                </label>
                <p className="text-[10px] text-slate-500">
                  Percentage of referral's Level income credited to Sponsor (Default: 100%)
                </p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="500"
                    value={editableSettings.specialSponsorBonus?.matchingPercent ?? 100}
                    onChange={(e) => {
                      const current = editableSettings.specialSponsorBonus || {
                        enabled: true,
                        targetLevel: 7,
                        matchingPercent: 100,
                        requiredSelfPackagePrice: 10,
                        requiredDirectsCount: 2,
                      };
                      updateEditableSettings({
                        ...editableSettings,
                        specialSponsorBonus: {
                          ...current,
                          matchingPercent: parseFloat(e.target.value) || 0,
                        },
                      });
                    }}
                    className="w-full bg-[#0d1726] border border-emerald-500/40 rounded-lg p-2 text-emerald-300 font-extrabold"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1">
                <label className="text-[10px] text-cyan-400 font-extrabold uppercase">
                  Required Self Package (₹ INR)
                </label>
                <p className="text-[10px] text-slate-500">
                  Minimum package price Sponsor must hold to qualify
                </p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    value={editableSettings.specialSponsorBonus?.requiredSelfPackagePrice ?? 1000}
                    onChange={(e) => {
                      const current = editableSettings.specialSponsorBonus || {
                        enabled: true,
                        targetLevel: 7,
                        matchingPercent: 100,
                        requiredSelfPackagePrice: 1000,
                        requiredDirectsCount: 2,
                      };
                      updateEditableSettings({
                        ...editableSettings,
                        specialSponsorBonus: {
                          ...current,
                          requiredSelfPackagePrice: parseFloat(e.target.value) || 0,
                        },
                      });
                    }}
                    className="w-full bg-[#0d1726] border border-cyan-500/40 rounded-lg p-2 text-cyan-300 font-extrabold"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">₹ INR</span>
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-1">
                <label className="text-[10px] text-purple-400 font-extrabold uppercase">
                  Required Total Directs
                </label>
                <p className="text-[10px] text-slate-500">
                  Minimum total direct referrals Sponsor must have
                </p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    value={editableSettings.specialSponsorBonus?.requiredDirectsCount ?? 2}
                    onChange={(e) => {
                      const current = editableSettings.specialSponsorBonus || {
                        enabled: true,
                        targetLevel: 7,
                        matchingPercent: 100,
                        requiredSelfPackagePrice: 10,
                        requiredDirectsCount: 2,
                      };
                      updateEditableSettings({
                        ...editableSettings,
                        specialSponsorBonus: {
                          ...current,
                          requiredDirectsCount: parseInt(e.target.value) || 0,
                        },
                      });
                    }}
                    className="w-full bg-[#0d1726] border border-purple-500/40 rounded-lg p-2 text-purple-300 font-extrabold"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">Directs</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2.7: DAILY SPIN WHEEL REWARDS & PROBABILITY CONFIGURATION */}
          <div className="bg-[#0b1424] border border-purple-500/40 rounded-2xl p-6 space-y-5 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Disc className="w-5 h-5 text-purple-400 animate-spin-slow" />
                  Daily Lucky Spin Wheel Rewards & Probability Controller
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Customize wheel reward slices, INR payouts, winning probability weights (%), and slice colors for members spinning the wheel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const preset55: SpinReward[] = [
                      { id: 'sp-1', label: 'Try Again', amount: 0, probability: 45, color: '#374151', minLevel: 0 },
                      { id: 'sp-2', label: '₹10 INR', amount: 10, probability: 25, color: '#06b6d4', minLevel: 0 },
                      { id: 'sp-3', label: '₹25 INR', amount: 25, probability: 15, color: '#10b981', minLevel: 0 },
                      { id: 'sp-4', label: '₹50 INR', amount: 50, probability: 10, color: '#8b5cf6', minLevel: 0 },
                      { id: 'sp-5', label: '₹100 INR', amount: 100, probability: 3, color: '#f59e0b', minLevel: 0 },
                      { id: 'sp-6', label: '₹250 INR', amount: 250, probability: 1.5, color: '#ec4899', minLevel: 0 },
                      { id: 'sp-7', label: '₹500 BIG', amount: 500, probability: 0.4, color: '#ef4444', minLevel: 0 },
                      { id: 'sp-8', label: '₹2,500 MEGA 🎉', amount: 2500, probability: 0.1, color: '#eab308', minLevel: 0 },
                    ];
                    setEditableSettings({
                      ...editableSettings,
                      spinWheelRewards: preset55,
                      spinTicketPrice: 50,
                      spinHouseProfitPercent: 55.0,
                    });
                    setIsSettingsDirty(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Apply 55% Profit (₹50 Spin) Preset
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const currentRewards = editableSettings.spinWheelRewards || [];
                    const newReward: SpinReward = {
                      id: `sp-${Date.now()}`,
                      label: '₹25 INR',
                      amount: 25,
                      probability: 5,
                      color: '#10b981',
                      minLevel: 0,
                    };
                    setEditableSettings({
                      ...editableSettings,
                      spinWheelRewards: [...currentRewards, newReward],
                    });
                    setIsSettingsDirty(true);
                  }}
                  className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slice
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingSettings ? 'Saving...' : '💾 Save Spin Settings'}
                </button>
              </div>
            </div>

            {/* Spin Wheel Interval, Free Spin Credits, Spin Cost & House Profit Config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#050911] border border-slate-800 rounded-2xl p-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Free Spin Cooldown (Hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editableSettings.spinWheelIntervalHours !== undefined ? editableSettings.spinWheelIntervalHours : 24}
                    onChange={(e) => {
                      setEditableSettings({
                        ...editableSettings,
                        spinWheelIntervalHours: parseInt(e.target.value) || 24,
                      });
                      setIsSettingsDirty(true);
                    }}
                    className="w-full bg-[#0d1726] border border-purple-500/30 rounded-xl px-3 py-2 text-purple-300 font-extrabold text-xs focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-xs text-slate-400 shrink-0">Hours</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Time gap before free spin recharge.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Free Spins on Registration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editableSettings.spinCreditsPerReset !== undefined ? editableSettings.spinCreditsPerReset : 1}
                    onChange={(e) => {
                      setEditableSettings({
                        ...editableSettings,
                        spinCreditsPerReset: parseInt(e.target.value) || 0,
                      });
                      setIsSettingsDirty(true);
                    }}
                    className="w-full bg-[#0d1726] border border-purple-500/30 rounded-xl px-3 py-2 text-purple-300 font-extrabold text-xs focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-xs text-slate-400 shrink-0">Spins</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Welcome bonus spins granted upon registration.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-400 uppercase block mb-1">
                  Every Spin Cost (₹ INR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editableSettings.spinTicketPrice !== undefined ? String(editableSettings.spinTicketPrice) : '50'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableSettings({
                        ...editableSettings,
                        spinTicketPrice: val as any,
                      });
                      setIsSettingsDirty(true);
                    }}
                    className="w-full bg-[#0d1726] border border-amber-500/30 rounded-xl px-3 py-2 text-amber-300 font-extrabold text-xs focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-400 shrink-0">INR</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cost per extra spin ticket (e.g. ₹50 INR).
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-rose-400 uppercase block mb-1">
                  Target House Profit Margin (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editableSettings.spinHouseProfitPercent !== undefined ? String(editableSettings.spinHouseProfitPercent) : '55.0'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableSettings({
                        ...editableSettings,
                        spinHouseProfitPercent: val as any,
                      });
                      setIsSettingsDirty(true);
                    }}
                    className="w-full bg-[#0d1726] border border-rose-500/30 rounded-xl px-3 py-2 text-rose-300 font-extrabold text-xs focus:outline-none focus:border-rose-400"
                  />
                  <span className="text-xs text-slate-400 shrink-0">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Target system retained profit margin (e.g. 55% House Profit).
                </span>
              </div>
            </div>

            {/* Total Probability & Live Math Calculation Summary Bar */}
            {(() => {
              const list = editableSettings.spinWheelRewards || [];
              const totalProb = list.reduce((sum, r) => sum + (parseFloat(r.probability as any) || 0), 0);
              const spinPrice = parseFloat(editableSettings.spinTicketPrice as any) || 1.0;
              const expectedPayout = list.reduce((sum, r) => {
                const amt = parseFloat(r.amount as any) || 0;
                const prob = parseFloat(r.probability as any) || 0;
                return sum + (amt * prob) / 100;
              }, 0);
              const actualProfitPercent = spinPrice > 0 ? ((spinPrice - expectedPayout) / spinPrice) * 100 : 0;

              return (
                <div className="bg-[#050911] border border-purple-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-300 font-bold">Wheel Slices:</span>
                      <span className="text-purple-400 font-extrabold">{list.length} Slices</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Total Probability:</span>
                        <span
                          className={`font-mono font-extrabold px-2.5 py-0.5 rounded-md ${
                            Math.abs(totalProb - 100) < 0.1
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {totalProb.toFixed(1)}% {Math.abs(totalProb - 100) < 0.1 ? '✓ Balanced (100%)' : '⚠️ Must sum to 100%'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md text-cyan-300">
                        <span>Avg Payout per Spin:</span>
                        <span className="font-mono font-extrabold text-white">₹{expectedPayout.toFixed(2)} INR</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-emerald-300">
                        <span>Admin House Profit:</span>
                        <span className="font-mono font-black text-emerald-400">+{actualProfitPercent.toFixed(1)}%</span>
                      </div>

                      {Math.abs(totalProb - 100) >= 0.1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const current = [...(editableSettings.spinWheelRewards || [])];
                            if (current.length === 0) return;
                            const otherSum = current.slice(1).reduce((s, r) => s + (parseFloat(r.probability as any) || 0), 0);
                            const remaining = Math.max(0, 100 - otherSum);
                            current[0] = { ...current[0], probability: Math.round(remaining * 10) / 10 };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: current });
                            setIsSettingsDirty(true);
                          }}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition"
                        >
                          ⚡ Auto-Balance Slice #1 to 100%
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Slice Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              {(editableSettings.spinWheelRewards || []).map((reward, idx) => (
                <div
                  key={reward.id || idx}
                  className="bg-[#050911] border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 space-y-3 relative group transition shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full inline-block border border-white/30 shrink-0 shadow-sm"
                        style={{ backgroundColor: reward.color || '#10b981' }}
                      />
                      <span className="text-xs font-black text-purple-300 uppercase tracking-wide">
                        Slice #{idx + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = (editableSettings.spinWheelRewards || []).filter((_, i) => i !== idx);
                        setEditableSettings({
                          ...editableSettings,
                          spinWheelRewards: updated,
                        });
                        setIsSettingsDirty(true);
                      }}
                      className="text-slate-500 hover:text-red-400 transition p-1"
                      title="Delete Slice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Reward Label
                      </label>
                      <input
                        type="text"
                        value={reward.label ?? ''}
                        onChange={(e) => {
                          const updated = [...(editableSettings.spinWheelRewards || [])];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                          setIsSettingsDirty(true);
                        }}
                        className="w-full bg-[#0d1726] border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none"
                        placeholder="e.g. ₹25 INR or Try Again"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-emerald-400 uppercase font-bold block mb-1 truncate" title="Prize Amount (₹ INR)">
                          Amount (₹)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reward.amount !== undefined && reward.amount !== null ? String(reward.amount) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], amount: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-2.5 py-2 text-emerald-300 font-black text-xs focus:outline-none text-center"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-400 uppercase font-bold block mb-1 truncate" title="Chance / Weight (%)">
                          Chance (%)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reward.probability !== undefined && reward.probability !== null ? String(reward.probability) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], probability: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-amber-500/40 focus:border-amber-400 rounded-xl px-2.5 py-2 text-amber-300 font-black text-xs focus:outline-none text-center"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-cyan-400 uppercase font-bold block mb-1 truncate" title="Min Level / Rank Required (0 = All Levels)">
                          Min Lvl
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={reward.minLevel !== undefined && reward.minLevel !== null ? String(reward.minLevel) : '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], minLevel: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-cyan-300 font-black text-xs focus:outline-none text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Slice Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={reward.color || '#10b981'}
                          onChange={(e) => {
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], color: e.target.value };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-9 h-9 rounded-xl border border-slate-700 bg-[#0d1726] cursor-pointer p-0.5 shrink-0"
                        />
                        <input
                          type="text"
                          value={reward.color || '#10b981'}
                          onChange={(e) => {
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], color: e.target.value };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono uppercase text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Direct Save Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">
                Ensure probability total is 100.0% before saving.
              </span>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl text-xs font-black transition flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Saving All Settings...' : '💾 Save Spin Wheel Settings'}
              </button>
            </div>
          </div>

          {/* SECTION 2.8: TETHER MART STORE HERO BANNER SLIDER MANAGER */}
          <div className="bg-[#0b1424] border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  SportX Mart Store Hero Banner Slider Manager
                </h4>
                <p className="text-[11px] text-slate-400">
                  Manage custom promotional hero banner slides displayed at the top of SportX Mart Store.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const defaultBanners = [
                      {
                        id: `hb-1-${Date.now()}`,
                        badge: 'OFFICIAL CYBER MALL • SPORTX MART',
                        title: 'Next-Gen DePIN & Web3 Mining Rigs',
                        subtitle: 'Equip your Web3 node with top-tier ASIC miners, hardware cold wallets, and crypto security gadgets.',
                        discount: 'UP TO 35% OFF',
                        cta: 'Explore DePIN Rigs',
                        category: 'Mining Hardware',
                        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-2-${Date.now()}`,
                        badge: 'NEW ARRIVALS • WEB3 APPAREL',
                        title: 'SportX Mart Official Merch',
                        subtitle: 'Exclusive hoodies, embroidered polo tees & custom cap collections crafted with premium cotton blends.',
                        discount: 'BUY 1 GET 1 20% OFF',
                        cta: 'Shop Web3 Apparel',
                        category: 'Apparel & Merch',
                        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-3-${Date.now()}`,
                        badge: 'MILITARY-GRADE COLD STORAGE',
                        title: 'Unhackable Hardware Wallets & Vaults',
                        subtitle: 'Keep your INR gaming rewards, VIP passes & digital gear protected with certified hardware devices.',
                        discount: 'FREE EXPRESS AIR SHIPPING',
                        cta: 'Explore Cold Storage',
                        category: 'Hardware Wallets',
                        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-4-${Date.now()}`,
                        badge: 'HIGH-TECH CYBER GADGETS',
                        title: 'DePIN Electronics & Smart Devices',
                        subtitle: 'Encrypted communication gear, high-performance node power supplies, and Web3 smart electronics.',
                        discount: 'EARN UP TO 50% REBATE',
                        cta: 'Browse Gadgets',
                        category: 'Gadgets',
                        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                    ];
                    updateEditableSettings({ ...editableSettings, heroBanners: defaultBanners });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newBanner = {
                      id: `hb-${Date.now()}`,
                      badge: 'SPECIAL PROMO • SPORTX MART',
                      title: 'New Store Banner Headline',
                      subtitle: 'Add banner description and promotion details here.',
                      discount: 'EXCLUSIVE OFFER',
                      cta: 'Shop Now',
                      category: 'All',
                      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                      enabled: true,
                    };
                    updateEditableSettings({
                      ...editableSettings,
                      heroBanners: [...(editableSettings.heroBanners || []), newBanner],
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Banner
                </button>
              </div>
            </div>

            {/* RECOMMENDED IMAGE RESOLUTION GUIDANCE BOX */}
            <div className="bg-[#050911] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/40 shrink-0 mt-0.5">
                  <Image className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-300 uppercase tracking-wider text-[11px]">
                      Recommended Image Specification:
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold">
                      1200 × 400 px (3:1 Aspect Ratio)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    HD Desktop/Mobile banner fit ke liye ideal resolution <strong className="text-slate-200">1200 × 400 pixels</strong> (ya 1920 × 640 px) hai. Direct image URLs (Unsplash, Imgur, Cloudinary, WebP, JPG, PNG) support hote hain.
                  </p>
                </div>
              </div>
            </div>

            {/* SLIDES EDITABLE CARDS GRID */}
            <div className="space-y-4">
              {(editableSettings.heroBanners || []).length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  No hero banners configured. Click "Reset Defaults" or "Add New Banner" to get started.
                </div>
              )}
              {(editableSettings.heroBanners || []).map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  className={`bg-[#050911] border rounded-xl p-4 space-y-3 transition-all ${
                    banner.enabled !== false ? 'border-slate-800 hover:border-cyan-500/40' : 'border-slate-800/60 opacity-60'
                  }`}
                >
                  {/* Slide Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-200 text-xs truncate max-w-[200px] sm:max-w-xs">
                        {banner.title || 'Untitled Banner'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {banner.category || 'All'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={banner.enabled !== false}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                        <span>{banner.enabled !== false ? 'Active' : 'Disabled'}</span>
                      </label>

                      {/* Delete Slide */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editableSettings.heroBanners || []).filter((_, i) => i !== idx);
                          updateEditableSettings({ ...editableSettings, heroBanners: updated });
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                        title="Delete Banner Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Banner Content Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    {/* Image Preview & URL (4 cols) */}
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Banner Image URL</span>
                        <span className="text-slate-500 font-mono text-[9px]">1200×400 px</span>
                      </label>
                      <input
                        type="text"
                        value={banner.image || ''}
                        onChange={(e) => {
                          const updated = [...(editableSettings.heroBanners || [])];
                          updated[idx] = { ...updated[idx], image: e.target.value };
                          updateEditableSettings({ ...editableSettings, heroBanners: updated });
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                      />
                      {/* Image Thumbnail Preview */}
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group">
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt="Banner Preview"
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                            <Image className="w-6 h-6" />
                            <span className="text-[10px]">No image URL set</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-slate-300 font-mono p-2 text-center pointer-events-none">
                          Image Preview
                        </div>
                      </div>
                    </div>

                    {/* Banner Text Details (8 cols) */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                          Top Badge Header Text
                        </label>
                        <input
                          type="text"
                          value={banner.badge || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], badge: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. OFFICIAL CYBER MALL • SPORTX MART"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-slate-200 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Discount / Tagline Pill Text
                        </label>
                        <input
                          type="text"
                          value={banner.discount || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], discount: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. UP TO 35% OFF"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                          Main Headline Title
                        </label>
                        <input
                          type="text"
                          value={banner.title || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Next-Gen DePIN & Web3 Mining Rigs"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-extrabold mt-1 text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Subtitle / Description
                        </label>
                        <input
                          type="text"
                          value={banner.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Equip your Web3 node with top-tier ASIC miners..."
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-slate-300 mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                          CTA Button Label
                        </label>
                        <input
                          type="text"
                          value={banner.cta || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], cta: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Explore DePIN Rigs"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-purple-300 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                          Target Store Category
                        </label>
                        <select
                          value={banner.category || 'All'}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], category: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1 text-[11px]"
                        >
                          <option value="All">All Categories</option>
                          <option value="Hardware Wallets">Hardware Wallets</option>
                          <option value="Mining Hardware">Mining Hardware</option>
                          <option value="Crypto Security">Crypto Security</option>
                          <option value="Gadgets">Gadgets</option>
                          <option value="DePIN Electronics">DePIN Electronics</option>
                          <option value="Apparel & Merch">Apparel & Merch</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2.9: ⚡ 5-TIER MEGA LUCKY DRAW LOTTERY & TICKET PRICE CONFIGURATION */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_25px_rgba(245,158,11,0.1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-400" />
                  <span>SECTION 2.9: ⚡ 5-TIER LUCKY DRAW LOTTERY & PRIZE CONFIGURATION</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure coupon ticket entry cost, 1st to 5th grand prize payouts, and 45x guaranteed series reward pool (₹ INR).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveLuckyDrawConfig()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Lucky Draw Prices</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#070e1d] border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-slate-300 block">🎟️ Coupon Ticket Price (₹):</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={ldTicketPrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdTicketPrice(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-slate-700 rounded-lg px-3 py-2 text-white font-black text-sm focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Price in ₹ INR per 6-digit coupon</span>
              </div>

              <div className="bg-[#070e1d] border border-amber-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-amber-400 block">🥇 1st Grand Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrize1}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrize1(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-amber-500/60 rounded-lg px-3 py-2 text-amber-300 font-black text-sm focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Grand 1st Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-purple-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-purple-400 block">🥈 2nd Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrize2}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrize2(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-purple-500/60 rounded-lg px-3 py-2 text-purple-300 font-black text-sm focus:border-purple-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">2nd Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-cyan-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-cyan-400 block">🥉 3rd Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrize3}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrize3(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-cyan-500/60 rounded-lg px-3 py-2 text-cyan-300 font-black text-sm focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">3rd Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-emerald-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-emerald-400 block">⭐ 4th Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrize4}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrize4(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-emerald-500/60 rounded-lg px-3 py-2 text-emerald-300 font-black text-sm focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">4th Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-rose-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-rose-400 block">🎖️ 5th Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrize5}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrize5(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-rose-500/60 rounded-lg px-3 py-2 text-rose-300 font-black text-sm focus:border-rose-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">5th Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-yellow-500/40 rounded-xl p-3.5 space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-yellow-400 block">🎁 Guaranteed Prize Pool (₹ INR per Winner):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ldPrizeGuaranteed}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLdPrizeGuaranteed(val);
                    setIsSettingsDirty(true);
                  }}
                  className="w-full bg-[#02050e] border border-yellow-500/60 rounded-lg px-3 py-2 text-yellow-300 font-black text-sm focus:border-yellow-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Payout to 45 Winners across matching 5-digit series (Total Guaranteed Pool: 45 × ₹{ldPrizeGuaranteed || 0} = ₹{(45 * (Number(ldPrizeGuaranteed) || 0)).toLocaleString('en-IN')} INR)</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: SYSTEM PROTOCOL, WALLETS & DEDUCTION RULES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Top Ticker Text */}
            <div className="space-y-1.5 col-span-2 bg-[#0b1424] border border-slate-800 rounded-2xl p-5">
              <label className="text-slate-300 font-bold uppercase">
                Dynamic Top Bar Marquee Header Announcement
              </label>
              <input
                type="text"
                value={editableSettings.tickerText || ''}
                onChange={(e) =>
                  updateEditableSettings({ ...editableSettings, tickerText: e.target.value })
                }
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2.5 text-cyan-300 focus:outline-none text-xs"
              />
            </div>

            {/* Protocol Fees & Exchange Rate */}
            <div className="space-y-3 bg-[#0b1424] p-5 rounded-2xl border border-slate-800">
              <div className="text-amber-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Financial Rules, Dynamic Limits & Reinvestment Protocol
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Min Deposit Amount (₹ INR):</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editableSettings.minDepositAmount ?? 100}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        minDepositAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Min MLM Withdrawal (₹ INR):</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editableSettings.minWithdrawalAmount ?? 200}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        minWithdrawalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Min Winning Withdrawal (₹ INR):</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editableSettings.winningWithdrawalMinAmount ?? 100}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        winningWithdrawalMinAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-amber-300 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">MLM Withdrawal Fee (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editableSettings.withdrawalFeePercent ?? 10}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        withdrawalFeePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Winning Wallet Fee (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editableSettings.winningWithdrawalFeePercent ?? 10}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        winningWithdrawalFeePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-amber-400 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Auto Instant Payout Limit (₹ INR):</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editableSettings.autoPayoutThresholdUSDT ?? 2000}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        autoPayoutThresholdUSDT: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-emerald-500/50 rounded-lg p-2 text-emerald-300 font-bold mt-1"
                    placeholder="2000 (≤₹2,000 Auto, >₹2,000 Admin Manual Approval)"
                  />
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    ≤ ₹{editableSettings.autoPayoutThresholdUSDT ?? 2000} instant auto payout, &gt; ₹{editableSettings.autoPayoutThresholdUSDT ?? 2000} requires manual Admin Approval.
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Withdrawal Upgrade Deduction (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editableSettings.upgradeFundDeductionPercent ?? 30}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        upgradeFundDeductionPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-amber-400 font-bold mt-1"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-slate-400">Platform Currency Mode (Native ₹ INR = 1):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editableSettings.rates?.usdtToInr ?? 1}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        rates: {
                          ...(editableSettings.rates || { usdtToInr: 1, inrToUsdt: 1 }),
                          usdtToInr: parseFloat(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Admin Gateway Reference Addresses */}
            <div className="space-y-3 bg-[#0b1424] p-5 rounded-2xl border border-slate-800">
              <div className="text-amber-400 font-bold uppercase text-[10px]">
                Legacy Gateway / Backup Wallet Addresses (UPI is Primary in Settings)
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400">Primary Reference ID / Legacy BEP20:</span>
                  <input
                    type="text"
                    value={editableSettings.walletAddresses?.BEP20 ?? ''}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        walletAddresses: {
                          ...(editableSettings.walletAddresses || { BEP20: '', TRC20: '', ERC20: '' }),
                          BEP20: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 text-[11px] font-mono mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Secondary Reference ID / Legacy TRC20:</span>
                  <input
                    type="text"
                    value={editableSettings.walletAddresses?.TRC20 ?? ''}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        walletAddresses: {
                          ...(editableSettings.walletAddresses || { BEP20: '', TRC20: '', ERC20: '' }),
                          TRC20: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 text-[11px] font-mono mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Daily Top Bettor Tournament Configuration */}
            <div className="space-y-4 bg-[#0b1424] p-5 rounded-2xl border border-amber-500/30 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div className="text-amber-400 font-bold uppercase text-xs">
                    Daily Top Bettor Tournament & Prize Pot Engine
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateEditableSettings({
                        ...editableSettings,
                        dailyTournament: {
                          ...(editableSettings.dailyTournament || {
                            enabled: true,
                            basePot: 250,
                            turnoverContributionPercent: 5,
                            minWagerToQualify: 10,
                            title: 'Daily Top Bettor Championship 🏆',
                            prizeDistribution: [],
                          }),
                          enabled: !(editableSettings.dailyTournament?.enabled ?? true),
                        },
                      })
                    }
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      (editableSettings.dailyTournament?.enabled ?? true)
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-500/20 border-red-500/50 text-red-400'
                    }`}
                  >
                    {(editableSettings.dailyTournament?.enabled ?? true) ? '● ACTIVE (ENABLED)' : '○ PAUSED'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 text-xs font-bold">Guaranteed Base Pot (₹ INR):</span>
                  <input
                    type="number"
                    step="1"
                    value={editableSettings.dailyTournament?.basePot ?? 25000}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        dailyTournament: {
                          ...(editableSettings.dailyTournament || {
                            enabled: true,
                            basePot: 25000,
                            turnoverContributionPercent: 5,
                            minWagerToQualify: 500,
                            title: 'Daily Top Bettor Championship 🏆',
                            prizeDistribution: [],
                          }),
                          basePot: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1 text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Starting prize pool guaranteed by Admin every day.</p>
                </div>

                <div>
                  <span className="text-slate-400 text-xs font-bold">Turnover Contribution (%):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={editableSettings.dailyTournament?.turnoverContributionPercent ?? 5}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        dailyTournament: {
                          ...(editableSettings.dailyTournament || {
                            enabled: true,
                            basePot: 25000,
                            turnoverContributionPercent: 5,
                            minWagerToQualify: 500,
                            title: 'Daily Top Bettor Championship 🏆',
                            prizeDistribution: [],
                          }),
                          turnoverContributionPercent: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1 text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">% of all platform bet turnover automatically added to pot.</p>
                </div>

                <div>
                  <span className="text-slate-400 text-xs font-bold">Min Daily Wager to Qualify (₹ INR):</span>
                  <input
                    type="number"
                    step="1"
                    value={editableSettings.dailyTournament?.minWagerToQualify ?? 500}
                    onChange={(e) =>
                      updateEditableSettings({
                        ...editableSettings,
                        dailyTournament: {
                          ...(editableSettings.dailyTournament || {
                            enabled: true,
                            basePot: 25000,
                            turnoverContributionPercent: 5,
                            minWagerToQualify: 500,
                            title: 'Daily Top Bettor Championship 🏆',
                            prizeDistribution: [],
                          }),
                          minWagerToQualify: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-amber-300 font-bold mt-1 text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 24h turnover needed to receive leaderboard rewards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGER */}
      {activeTab === 'users' && (
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Node Management ({users.length} Users)
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportUsersCsv}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <Download className="w-3.5 h-3.5" />
                Export Users Excel (.csv)
              </button>

              <label className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload & Update Users CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleUploadUsersCsv}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                placeholder="Filter by Node ID / Name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-[#050911] border border-slate-700 rounded-xl px-4 py-2 text-xs text-cyan-300 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Node ID</th>
                  <th className="p-3">Name / Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Deposit Wallet</th>
                  <th className="p-3">Withdrawable Bal</th>
                  <th className="p-3">Upgrade Fund Bal</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((u) => {
                  const isUserAdmin = u.isAdmin || u.nodeId === 'NX-ROOT01';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-cyan-300">#{u.nodeId}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Shield className="w-3 h-3 text-amber-400" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            MEMBER
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-[#0ef]">₹{(u.depositBalance || 0).toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-400">₹{u.balance.toFixed(2)}</td>
                      <td className="p-3 font-bold text-cyan-400">₹{u.upgradeBalance.toFixed(2)}</td>
                      <td className="p-3 text-slate-300">
                        {settings.packages.find((p) => p.id === u.activePackageId)?.name || 'None'}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px]">
                          {u.password || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditUserModal(u)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                          title="Edit Full Profile (Name, Password, Email, Balances, etc.)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChangeUserPassword(u.id, u.password)}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition"
                          title="Change User Password"
                        >
                          <Key className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Change Pass</span>
                        </button>

                        {u.nodeId !== 'NX-ROOT01' && onToggleAdmin && (
                          <button
                            type="button"
                            onClick={() => onToggleAdmin(u.id, !u.isAdmin)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                              u.isAdmin
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                          </button>
                        )}

                        {u.nodeId !== 'NX-ROOT01' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 text-[11px] font-bold flex items-center gap-1 transition"
                            title="Delete User permanently from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Comprehensive Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono overflow-y-auto">
              <div className="bg-[#0b1320] border border-amber-500/50 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.25)] relative my-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold text-white">
                      Edit User Profile <span className="text-cyan-300">#{editingUser.nodeId}</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="text-slate-400 hover:text-white font-bold text-lg px-2"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveFullUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs focus:outline-none focus:border-amber-500 font-sans"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs focus:outline-none focus:border-amber-500 font-sans"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-xs text-amber-300 font-bold flex items-center gap-1 mb-1">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Account Password *</span>
                      </label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-[#050911] border border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 font-bold"
                        required
                      />
                    </div>

                    {/* Node ID */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Node ID (System ID)
                      </label>
                      <input
                        type="text"
                        value={editNodeId}
                        onChange={(e) => setEditNodeId(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* Wallet / UPI Address */}
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        UPI ID / Bank Payout Details
                      </label>
                      <input
                        type="text"
                        value={editWallet}
                        onChange={(e) => setEditWallet(e.target.value)}
                        placeholder="user@upi or Bank Account..."
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Sponsor ID */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Sponsor ID (Referrer)
                      </label>
                      <input
                        type="text"
                        value={editSponsorId}
                        onChange={(e) => setEditSponsorId(e.target.value)}
                        placeholder="Sponsor Node ID"
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Active Package */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Active Investment Package
                      </label>
                      <select
                        value={editPkgId}
                        onChange={(e) => setEditPkgId(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 text-xs focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="none">None (No Active Package)</option>
                        {settings.packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} (₹{pkg.price} INR)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Deposit Wallet Balance (₹) */}
                    <div>
                      <label className="text-xs text-[#0ef] font-bold block mb-1">
                        Deposit Wallet Balance (₹ INR) [Package Fund]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDepositBalNum}
                        onChange={(e) => setEditDepositBalNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#050911] border border-[#0ef]/40 rounded-xl px-3 py-2 text-[#0ef] font-bold text-xs focus:outline-none focus:border-[#0ef]"
                      />
                    </div>

                    {/* Withdrawable Balance (₹) */}
                    <div>
                      <label className="text-xs text-emerald-400 font-bold block mb-1">
                        Withdrawable Balance (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editBalNum}
                        onChange={(e) => setEditBalNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Upgrade Balance (₹) */}
                    <div>
                      <label className="text-xs text-cyan-400 font-bold block mb-1">
                        Upgrade Fund Balance (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUpgBalNum}
                        onChange={(e) => setEditUpgBalNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Rank Tier */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Rank Tier
                      </label>
                      <select
                        value={editRank}
                        onChange={(e) => setEditRank(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="None">None (Unranked)</option>
                        <option value="Bronze">Bronze</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                        <option value="Diamond">Diamond</option>
                        <option value="Crown">Crown</option>
                      </select>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Account Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                      </select>
                    </div>

                    {/* Is Admin Checkbox */}
                    <div className="sm:col-span-2 bg-[#050911] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Administrator Privileges</div>
                          <div className="text-[10px] text-slate-400">Grant full master control to this node user</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editIsAdmin}
                        onChange={(e) => setEditIsAdmin(e.target.checked)}
                        className="w-5 h-5 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-800">
                    <div>
                      {editingUser.nodeId !== 'NX-ROOT01' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(editingUser)}
                          className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete User</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingUser}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingUser ? 'Saving Changes...' : 'Save Complete Profile'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING DEPOSITS APPROVAL */}
      {activeTab === 'deposits' && (
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Pending Deposit Verification Queue
            </h3>
            <button
              type="button"
              onClick={fetchWeb3Status}
              disabled={loadingWeb3Status}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeb3Status ? 'animate-spin' : ''}`} />
              Refresh Hot Wallet
            </button>
          </div>

          {/* Settlement Gateway Live Status Card */}
          <div className="bg-[#050911] border border-cyan-500/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">🛡️ Gateway Receiver Reference</div>
              <div className="font-mono text-cyan-300 truncate" title={web3Status?.address || 'UPI / Bank Gateway Active'}>
                {web3Status?.address || 'UPI / Bank Gateway Active'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">⚡ Settlement Node Status</div>
              <div className="font-bold font-mono flex items-center gap-2">
                <span className={web3Status?.isGasReady ? 'text-emerald-400' : 'text-amber-400'}>
                  {web3Status?.bnbBalance !== undefined ? `${web3Status.bnbBalance} Units` : 'Checking...'}
                </span>
                {!web3Status?.isGasReady && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Manual Approval Active
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">💵 Gateway Reserve Balance</div>
              <div className="font-bold font-mono text-emerald-400">
                {web3Status?.usdtBalance !== undefined ? `₹${(Number(web3Status.usdtBalance) || 0).toLocaleString('en-IN')} INR` : 'Checking...'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount (₹ INR)</th>
                  <th className="p-3">Rail / Method</th>
                  <th className="p-3">UTR / Ref ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {depositRequests.map((dep) => {
                  const usdtToInrRate = Number(settings.rates?.usdtToInr) || 1;
                  const depInr = dep.inrAmount || Math.round(dep.amount * usdtToInrRate);
                  const depBonusCfg = settings.depositBonus;
                  const depUser = users.find((u) => u.id === dep.userId);
                  const eligibleForBonus =
                    depBonusCfg?.enabled &&
                    (depBonusCfg.applyTo !== 'first_deposit_only' || !depUser?.hasFirstDepositApproved);
                  const matchedBonusTier = eligibleForBonus
                    ? [...(depBonusCfg?.tiers || [])]
                        .filter((t) => t.enabled !== false && Number(t.bonusValue) > 0)
                        .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))
                        .find((t) => depInr >= Number(t.minAmount))
                    : undefined;
                  const estBonusInr = dep.bonusInr
                    ? dep.bonusInr
                    : matchedBonusTier
                    ? matchedBonusTier.bonusType === 'fixed'
                      ? Number(matchedBonusTier.bonusValue)
                      : (depInr * Number(matchedBonusTier.bonusValue)) / 100
                    : 0;

                  return (
                  <tr key={dep.id}>
                    <td className="p-3 font-bold text-white">#{dep.userNodeId} ({dep.userName})</td>
                    <td className="p-3 font-bold text-emerald-400">
                      <div>₹{depInr.toLocaleString('en-IN')} INR</div>
                      {estBonusInr > 0 && (
                        <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                          {dep.status === 'approved' ? '🎁 Bonus Credited:' : '🎁 Auto Bonus:'} +₹{estBonusInr.toFixed(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{dep.network}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 bg-[#050911] border border-slate-800 px-2.5 py-1.5 rounded-lg max-w-[220px]">
                        <span className="text-cyan-300 font-mono text-[11px] truncate flex-1" title={dep.txHash}>
                          {dep.txHash}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`dep-${dep.id}`, dep.txHash)}
                          className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded flex items-center gap-1 text-[10px] font-bold shrink-0 transition"
                          title="Copy Transaction Hash"
                        >
                          {copiedId === `dep-${dep.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-cyan-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-bold capitalize">{dep.status}</td>
                    <td className="p-3 flex items-center gap-2">
                      {dep.status === 'pending' && (
                        <>
                          {dep.network === 'BEP20' && dep.txHash?.startsWith('0x') && (
                            <button
                              type="button"
                              onClick={() => handleAutoVerifyDeposit(dep.id, dep.txHash)}
                              disabled={verifyingDepId === dep.id}
                              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded font-bold text-[10px] flex items-center gap-1 transition"
                              title="Auto-Verify On Binance Smart Chain"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              {verifyingDepId === dep.id ? 'Scanning...' : '⚡ Auto-Verify'}
                            </button>
                          )}
                          <button
                            onClick={() => onDepositAction(dep.id, 'approve')}
                            className="px-3 py-1 bg-emerald-500 text-black font-bold rounded text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDepositAction(dep.id, 'reject')}
                            className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PENDING WITHDRAWALS APPROVAL */}
      {activeTab === 'withdrawals' && (
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              Pending Withdrawal Queue (Hot Wallet Enabled)
            </h3>
            <button
              type="button"
              onClick={fetchWeb3Status}
              disabled={loadingWeb3Status}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeb3Status ? 'animate-spin' : ''}`} />
              Refresh Hot Wallet
            </button>
          </div>

          {/* Payout Gateway Live Status Card */}
          <div className="bg-[#050911] border border-amber-500/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">🛡️ Payout Gateway Reference</div>
              <div className="font-mono text-amber-300 truncate" title={web3Status?.address || 'UPI / Bank Payout Mode'}>
                {web3Status?.address || 'UPI / Bank Payout Mode'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">⚡ Auto-Dispatch Status</div>
              <div className="font-bold font-mono flex items-center gap-2">
                <span className={web3Status?.isGasReady ? 'text-emerald-400' : 'text-amber-400'}>
                  {web3Status?.bnbBalance !== undefined ? `${web3Status.bnbBalance} Units` : 'Checking...'}
                </span>
                {!web3Status?.isGasReady && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Manual UPI/Bank Approval Ready
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">💵 Gateway Reserve Balance</div>
              <div className="font-bold font-mono text-emerald-400">
                {web3Status?.usdtBalance !== undefined ? `₹${(Number(web3Status.usdtBalance) || 0).toLocaleString('en-IN')} INR` : 'Checking...'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Req (₹)</th>
                  <th className="p-3">20% Reinvest</th>
                  <th className="p-3">Net (₹)</th>
                  <th className="p-3">Target UPI / Bank</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {withdrawalRequests.map((wd) => (
                  <tr key={wd.id}>
                    <td className="p-3 font-bold text-white">#{wd.userNodeId} ({wd.userName})</td>
                    <td className="p-3 font-bold">₹{wd.requestedAmount}</td>
                    <td className="p-3 text-amber-400">₹{wd.upgradeDeduction.toFixed(2)}</td>
                    <td className="p-3 font-bold text-emerald-400">₹{wd.netAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 bg-[#050911] border border-slate-800 px-2.5 py-1.5 rounded-lg max-w-[260px]">
                        <span className="text-cyan-300 font-mono text-[11px] truncate flex-1" title={wd.targetAddress}>
                          {wd.targetAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`wd-${wd.id}`, wd.targetAddress)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1.5 text-[10px] font-bold shrink-0 transition"
                          title="Click to Copy UPI / Bank Payout Details"
                        >
                          {copiedId === `wd-${wd.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copy Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      {wd.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAutoDispatchWithdrawal(wd.id)}
                            disabled={dispatchingWdId === wd.id}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold rounded text-[10px] flex items-center gap-1 shadow-md shadow-amber-500/20 transition"
                            title="Instant Automated Payout Dispatch"
                          >
                            <Zap className={`w-3 h-3 ${dispatchingWdId === wd.id ? 'animate-spin' : ''}`} />
                            {dispatchingWdId === wd.id ? 'Sending...' : '⚡ Auto-Dispatch'}
                          </button>
                          <button
                            onClick={() => onWithdrawAction(wd.id, 'approve')}
                            className="px-3 py-1 bg-emerald-500 text-black font-bold rounded text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onWithdrawAction(wd.id, 'reject')}
                            className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[10px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {wd.status === 'approved' && (
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {wd.status === 'rejected' && (
                        <span className="text-red-400 font-bold text-[11px]">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BOOSTING QUEUE MANAGER */}
      {activeTab === 'boosting' && (
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Global Boosting Queue Management
            </h3>
            <div className="flex gap-2">
              <button
                onClick={onForceBoostingWinner}
                className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl shadow"
              >
                Force Winner Payout (₹{(settings.boostingPool?.rewardAmount || 5000).toLocaleString('en-IN')})
              </button>
              <button
                onClick={onSyncBoostingQueue}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-xl"
              >
                Sync & Rebuild Queue
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Pos #</th>
                  <th className="p-3">Node ID</th>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Rebirths</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {boostingQueue.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-bold">#{b.position}</td>
                    <td className="p-3 font-bold text-cyan-300">#{b.nodeId}</td>
                    <td className="p-3 text-white">{b.userName}</td>
                    <td className="p-3 text-amber-300">{b.rebirthCount} Rebirths</td>
                    <td className="p-3">
                      <button
                        onClick={() => onDeleteBoostingEntry(b.id)}
                        className="text-red-400 hover:text-red-300 text-[10px]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            System Transaction History Audit
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Node ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount (₹)</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 font-bold text-cyan-300">#{tx.userNodeId}</td>
                    <td className="p-3 font-bold capitalize">{tx.type}</td>
                    <td className="p-3 font-bold text-emerald-400">₹{tx.amount.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">{tx.notes || '-'}</td>
                    <td className="p-3 text-slate-500 text-[10px]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB 7: SQLITE ENGINE & DATABASE MANAGER */}
      {activeTab === 'sqlite' && (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="bg-[#0b1424] border border-emerald-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                    SQLite High-Performance Database Engine
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Single-file relational database persisted on disk. Zero extra RAM overhead, instant response times, and simple local file backups on VPS.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchSqliteStatus}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={handleExportUsersCsv}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  Export Users Excel (.csv)
                </button>

                <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Upload className="w-4 h-4" />
                  <span>Upload Users CSV (.csv)</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadUsersCsv}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadSqlite}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  Download SQLite (.sqlite)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  Download JSON (.json)
                </button>

                <label className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Upload className="w-4 h-4" />
                  <span>Upload Full DB (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* File & Storage Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-cyan-400" /> Storage File Path
                </div>
                <div className="text-cyan-300 font-mono font-bold text-[11px] truncate" title={sqliteInfo?.filePath}>
                  {sqliteInfo?.filePath || '/data/database.sqlite'}
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Database File Size</div>
                <div className="text-emerald-400 font-extrabold text-sm">
                  {sqliteInfo?.fileSizeKb ? `${sqliteInfo.fileSizeKb} KB (${sqliteInfo.fileSizeMb} MB)` : 'Loading...'}
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Registered Users</div>
                <div className="text-amber-400 font-extrabold text-sm">
                  {sqliteInfo?.tableCounts?.users ?? users.length} Users
                </div>
              </div>

              <div className="bg-[#050911] border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Recorded Transactions</div>
                <div className="text-purple-400 font-extrabold text-sm">
                  {sqliteInfo?.tableCounts?.transactions ?? transactions.length} Records
                </div>
              </div>
            </div>
          </div>

          {/* SQLite Tables Overview Cards */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              SQLite Relational Tables Schema & Live Row Counts
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {[
                { name: 'users', count: sqliteInfo?.tableCounts?.users ?? users.length, color: 'text-amber-400' },
                { name: 'transactions', count: sqliteInfo?.tableCounts?.transactions ?? transactions.length, color: 'text-purple-400' },
                { name: 'deposit_requests', count: sqliteInfo?.tableCounts?.depositRequests ?? depositRequests.length, color: 'text-emerald-400' },
                { name: 'withdrawal_requests', count: sqliteInfo?.tableCounts?.withdrawalRequests ?? withdrawalRequests.length, color: 'text-cyan-400' },
                { name: 'boosting_queue', count: sqliteInfo?.tableCounts?.boostingQueue ?? boostingQueue.length, color: 'text-pink-400' },
                { name: 'settings', count: 1, color: 'text-slate-300' },
              ].map((tbl) => (
                <button
                  key={tbl.name}
                  type="button"
                  onClick={() => {
                    setSqlQuery(`SELECT * FROM ${tbl.name} LIMIT 20;`);
                  }}
                  className="bg-[#050911] hover:bg-[#0d1726] border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-left transition group"
                >
                  <div className="text-[10px] text-slate-500 font-bold uppercase truncate">{tbl.name}</div>
                  <div className={`text-base font-extrabold mt-0.5 ${tbl.color}`}>{tbl.count} Rows</div>
                  <div className="text-[9px] text-slate-600 group-hover:text-cyan-400 mt-1 font-bold">
                    Click to Query &rarr;
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SQL Query Console & Command Runner */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Interactive SQL Query Console
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Supports SELECT, UPDATE, INSERT, DELETE
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                placeholder="Enter SQL statement e.g. SELECT * FROM users;"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl p-3 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSqlQuery('SELECT id, nodeId, name, balance, rank FROM users;')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-mono"
                  >
                    Quick: Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlQuery('SELECT id, userNodeId, type, amount, createdAt FROM transactions ORDER BY createdAt DESC LIMIT 10;')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-mono"
                  >
                    Quick: Transactions
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlQuery('SELECT * FROM deposit_requests WHERE status = "pending";')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg font-mono"
                  >
                    Quick: Pending Deposits
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRunSqlQuery}
                  disabled={runningSql}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {runningSql ? 'Executing Query...' : 'Execute SQL Query'}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {sqlError && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs font-mono">
                <strong>SQL Error:</strong> {sqlError}
              </div>
            )}

            {/* Query Results Display Table */}
            {sqlResult && sqlResult.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] text-emerald-400 font-bold uppercase">Query Result Output</div>
                <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono bg-[#050911]">
                    <thead className="bg-[#0d1726] text-slate-300 uppercase text-[10px]">
                      <tr>
                        {sqlResult[0].columns.map((col: string) => (
                          <th key={col} className="p-2.5 border-b border-slate-800">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {sqlResult[0].values.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-900/50">
                          {row.map((val: any, cIdx: number) => (
                            <td key={cIdx} className="p-2.5 max-w-xs truncate text-[11px]">
                              {val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: AMAZON MALL PRODUCTS & RATES MANAGER */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* TETHER MART STORE HERO BANNER SLIDER MANAGER */}
          <div className="bg-[#0b1424] border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Image className="w-5 h-5 text-cyan-400" />
                  <span>SportX Mart Store Hero Banner Slider Manager</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage promo banner slides & custom image URLs displayed at the top of SportX Mart Store.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateSettings({
                      ...editableSettings,
                    });
                    alert('Hero Banner Slider Settings saved successfully!');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Hero Banners</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultBanners = [
                      {
                        id: `hb-1-${Date.now()}`,
                        badge: 'OFFICIAL CYBER MALL • SPORTX MART',
                        title: 'Next-Gen DePIN & Web3 Mining Rigs',
                        subtitle: 'Equip your Web3 node with top-tier ASIC miners, hardware cold wallets, and crypto security gadgets.',
                        discount: 'UP TO 35% OFF',
                        cta: 'Explore DePIN Rigs',
                        category: 'Mining Hardware',
                        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-2-${Date.now()}`,
                        badge: 'NEW ARRIVALS • WEB3 APPAREL',
                        title: 'SportX Mart Official Merch',
                        subtitle: 'Exclusive hoodies, embroidered polo tees & custom cap collections crafted with premium cotton blends.',
                        discount: 'BUY 1 GET 1 20% OFF',
                        cta: 'Shop Web3 Apparel',
                        category: 'Apparel & Merch',
                        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-3-${Date.now()}`,
                        badge: 'MILITARY-GRADE COLD STORAGE',
                        title: 'Unhackable Hardware Wallets & Vaults',
                        subtitle: 'Keep your INR gaming rewards, VIP passes & digital gear protected with certified hardware devices.',
                        discount: 'FREE EXPRESS AIR SHIPPING',
                        cta: 'Explore Cold Storage',
                        category: 'Hardware Wallets',
                        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                      {
                        id: `hb-4-${Date.now()}`,
                        badge: 'HIGH-TECH CYBER GADGETS',
                        title: 'DePIN Electronics & Smart Devices',
                        subtitle: 'Encrypted communication gear, high-performance node power supplies, and Web3 smart electronics.',
                        discount: 'EARN UP TO 50% REBATE',
                        cta: 'Browse Gadgets',
                        category: 'Gadgets',
                        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
                        enabled: true,
                      },
                    ];
                    updateEditableSettings({ ...editableSettings, heroBanners: defaultBanners });
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newBanner = {
                      id: `hb-${Date.now()}`,
                      badge: 'SPECIAL PROMO • SPORTX MART',
                      title: 'New Store Banner Headline',
                      subtitle: 'Add banner description and promotion details here.',
                      discount: 'EXCLUSIVE OFFER',
                      cta: 'Shop Now',
                      category: 'All',
                      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                      enabled: true,
                    };
                    updateEditableSettings({
                      ...editableSettings,
                      heroBanners: [...(editableSettings.heroBanners || []), newBanner],
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Banner</span>
                </button>
              </div>
            </div>

            {/* RECOMMENDED IMAGE RESOLUTION GUIDANCE BOX */}
            <div className="bg-[#050911] border border-cyan-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/40 shrink-0 mt-0.5">
                  <Image className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-300 uppercase tracking-wider text-[11px]">
                      Recommended Image Specification:
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold">
                      1200 × 400 px (3:1 Aspect Ratio)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    HD Desktop & Mobile banner fit ke liye ideal resolution <strong className="text-slate-200">1200 × 400 pixels</strong> (ya 1920 × 640 px) hai. Direct image URLs (Unsplash, Imgur, Cloudinary, WebP, JPG, PNG) support hote hain.
                  </p>
                </div>
              </div>
            </div>

            {/* SLIDES EDITABLE CARDS GRID */}
            <div className="space-y-4">
              {(editableSettings.heroBanners || []).length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  No hero banners configured. Click "Reset Defaults" or "Add New Banner" to get started.
                </div>
              )}
              {(editableSettings.heroBanners || []).map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  className={`bg-[#050911] border rounded-xl p-4 space-y-3 transition-all ${
                    banner.enabled !== false ? 'border-slate-800 hover:border-cyan-500/40' : 'border-slate-800/60 opacity-60'
                  }`}
                >
                  {/* Slide Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-200 text-xs truncate max-w-[200px] sm:max-w-xs">
                        {banner.title || 'Untitled Banner'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {banner.category || 'All'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={banner.enabled !== false}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], enabled: e.target.checked };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                        <span>{banner.enabled !== false ? 'Active' : 'Disabled'}</span>
                      </label>

                      {/* Delete Slide */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editableSettings.heroBanners || []).filter((_, i) => i !== idx);
                          updateEditableSettings({ ...editableSettings, heroBanners: updated });
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                        title="Delete Banner Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Banner Content Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    {/* Image Preview & URL (4 cols) */}
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Banner Image URL</span>
                        <span className="text-slate-500 font-mono text-[9px]">1200×400 px</span>
                      </label>
                      <input
                        type="text"
                        value={banner.image || ''}
                        onChange={(e) => {
                          const updated = [...(editableSettings.heroBanners || [])];
                          updated[idx] = { ...updated[idx], image: e.target.value };
                          updateEditableSettings({ ...editableSettings, heroBanners: updated });
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                      />
                      {/* Image Thumbnail Preview */}
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group">
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt="Banner Preview"
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                            <Image className="w-6 h-6" />
                            <span className="text-[10px]">No image URL set</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-slate-300 font-mono p-2 text-center pointer-events-none">
                          Image Preview
                        </div>
                      </div>
                    </div>

                    {/* Banner Text Details (8 cols) */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                          Top Badge Header Text
                        </label>
                        <input
                          type="text"
                          value={banner.badge || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], badge: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. OFFICIAL CYBER MALL • SPORTX MART"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-slate-200 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Discount / Tagline Pill Text
                        </label>
                        <input
                          type="text"
                          value={banner.discount || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], discount: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. UP TO 35% OFF"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                          Main Headline Title
                        </label>
                        <input
                          type="text"
                          value={banner.title || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Next-Gen DePIN & Web3 Mining Rigs"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-extrabold mt-1 text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Subtitle / Description
                        </label>
                        <input
                          type="text"
                          value={banner.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Equip your Web3 node with top-tier ASIC miners..."
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-slate-300 mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                          CTA Button Label
                        </label>
                        <input
                          type="text"
                          value={banner.cta || ''}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], cta: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          placeholder="e.g. Explore DePIN Rigs"
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-purple-300 font-bold mt-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                          Target Store Category
                        </label>
                        <select
                          value={banner.category || 'All'}
                          onChange={(e) => {
                            const updated = [...(editableSettings.heroBanners || [])];
                            updated[idx] = { ...updated[idx], category: e.target.value };
                            updateEditableSettings({ ...editableSettings, heroBanners: updated });
                          }}
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1 text-[11px]"
                        >
                          <option value="All">All Categories</option>
                          <option value="Hardware Wallets">Hardware Wallets</option>
                          <option value="Mining Hardware">Mining Hardware</option>
                          <option value="Crypto Security">Crypto Security</option>
                          <option value="Gadgets">Gadgets</option>
                          <option value="DePIN Electronics">DePIN Electronics</option>
                          <option value="Apparel & Merch">Apparel & Merch</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Header Bar with Add Product Action */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>SportX Mart Product & Rate Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                List new items, set rates in ₹ INR, adjust available stock, or manage customer orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingProd(!isCreatingProd)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingProd ? 'Close Form' : '+ Add New Product'}</span>
            </button>
          </div>

          {/* Add New Product Form */}
          {isCreatingProd && (
            <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <h4 className="text-sm font-bold text-amber-300 border-b border-slate-800 pb-2">
                Create & List New Product
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    placeholder="e.g. Ledger Hardware Wallet"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hardware Wallets">Hardware Wallets</option>
                    <option value="Mining Hardware">Mining Hardware</option>
                    <option value="Crypto Security">Crypto Security</option>
                    <option value="Gadgets">Gadgets</option>
                    <option value="DePIN Electronics">DePIN Electronics</option>
                    <option value="Apparel & Merch">Apparel & Merch</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    placeholder="e.g. Best Seller, Hot Deal"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 bg-[#050911]/80 border border-slate-800 p-3 rounded-2xl">
                  <label className="text-amber-400 font-bold block mb-2 text-xs">Product Photo (Direct Mobile/PC File Upload OR URL)</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-white transition flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 text-amber-400" />
                        Upload Direct Photo from Phone / PC
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) setNewProdImage(evt.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newProdImage && (
                        <button
                          type="button"
                          onClick={() => setNewProdImage('')}
                          className="px-3 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 text-center font-bold font-mono">OR ENTER IMAGE URL MANUALLY</div>

                    <input
                      type="text"
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="https://... (Or paste link)"
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />

                    {newProdImage && (
                      <div className="mt-1 flex items-center gap-3 bg-[#0a0f1d] p-2 rounded-xl border border-slate-800">
                        <img src={newProdImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-amber-400 block">✓ Image Ready to Save!</span>
                          <span className="text-[11px] text-slate-400">Direct photo loaded successfully. Click 'Create Product' to publish.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-cyan-400 font-bold block mb-1">
                    Sizes (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newProdSizes}
                    onChange={(e) => setNewProdSizes(e.target.value)}
                    placeholder="e.g. S, M, L, XL (Leave blank for Watch)"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-amber-400 font-bold block mb-1">
                    Colors (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newProdColors}
                    onChange={(e) => setNewProdColors(e.target.value)}
                    placeholder="e.g. Black, White, Gold (Optional)"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 text-xs">Product Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Enter detailed product specifications..."
                  className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProd(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onAddProduct) {
                      await onAddProduct({
                        title: newProdTitle || 'New Web3 Gadget',
                        description: newProdDesc || 'High performance crypto gadget',
                        priceUsdt: Number(newProdPrice) || 100,
                        category: newProdCategory,
                        image: newProdImage,
                        stock: Number(newProdStock) || 50,
                        badge: newProdBadge || 'New',
                        featured: true,
                        sizes: newProdSizes ? newProdSizes.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
                        colors: newProdColors ? newProdColors.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
                      });
                      setIsCreatingProd(false);
                      setNewProdTitle('');
                      setNewProdDesc('');
                      setNewProdSizes('');
                      setNewProdColors('');
                    }
                  }}
                  className="px-5 py-2 bg-emerald-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  List Product Now
                </button>
              </div>
            </div>
          )}

          {/* Listed Products Table */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Currently Listed Mall Products ({products.length})
            </h4>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs bg-[#050911]">
                <thead className="bg-[#0d1726] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Rate (₹ INR)</th>
                    <th className="p-3">Display Value</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Badge</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {products.map((prod) => {
                    const inrVal = prod.priceInr || prod.priceUsdt * (settings.rates.usdtToInr || 1);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{prod.title}</span>
                                {prod.featured && (
                                  <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[9px]">
                                    Featured
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">{prod.description}</div>
                              {((prod.sizes && prod.sizes.length > 0) || (prod.colors && prod.colors.length > 0)) && (
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-mono">
                                  {prod.sizes && prod.sizes.length > 0 && (
                                    <span className="text-cyan-400 font-bold">Sizes: {prod.sizes.join(', ')}</span>
                                  )}
                                  {prod.colors && prod.colors.length > 0 && (
                                    <span className="text-amber-400 font-bold">Colors: {prod.colors.join(', ')}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-cyan-300">{prod.category}</td>

                        <td className="p-3 font-bold text-emerald-400">
                          ₹{prod.priceUsdt.toLocaleString('en-IN')} INR
                        </td>

                        <td className="p-3 text-slate-400 font-mono">
                          ₹{inrVal.toLocaleString('en-IN')}
                        </td>

                        <td className="p-3 font-bold">
                          <span className={prod.stock > 0 ? 'text-slate-200' : 'text-red-400'}>
                            {prod.stock} units
                          </span>
                        </td>

                        <td className="p-3">
                          {prod.badge && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                              {prod.badge}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProd(prod);
                                setEditTitle(prod.title);
                                setEditDesc(prod.description);
                                setEditPrice(String(prod.priceUsdt));
                                setEditCategory(prod.category);
                                setEditImage(prod.image);
                                setEditStock(String(prod.stock));
                                setEditBadge(prod.badge || '');
                                setEditFeatured(Boolean(prod.featured));
                                setEditSizes(prod.sizes ? prod.sizes.join(', ') : '');
                                setEditColors(prod.colors ? prod.colors.join(', ') : '');
                              }}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl flex items-center gap-1 text-xs transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Full
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (onDeleteProduct && confirm(`Delete product "${prod.title}"?`)) {
                                  await onDeleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FULL EDIT PRODUCT MODAL */}
            {editingProd && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
                <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
                  <div className="bg-[#0c1524] border border-amber-500/40 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_40px_rgba(245,158,11,0.2)] relative my-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Product Details ({editingProd.id})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProd(null)}
                      className="text-slate-400 hover:text-white font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-slate-300 font-bold block mb-1">Product Title / Brand Name</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-sans text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Price (₹ INR)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-amber-500 text-sm"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Display: ₹{Number(editPrice || 0).toLocaleString('en-IN')} INR
                      </span>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                      >
                        <option value="Hardware Wallets">Hardware Wallets</option>
                        <option value="Mining Hardware">Mining Hardware</option>
                        <option value="Crypto Security">Crypto Security</option>
                        <option value="Gadgets">Gadgets</option>
                        <option value="DePIN Electronics">DePIN Electronics</option>
                        <option value="Apparel & Merch">Apparel & Merch</option>
                        <option value="Electronics">Electronics</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={editBadge}
                        onChange={(e) => setEditBadge(e.target.value)}
                        placeholder="e.g. Best Seller, Hot Deal"
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-cyan-300 font-bold block mb-1">
                        Sizes (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={editSizes}
                        onChange={(e) => setEditSizes(e.target.value)}
                        placeholder="e.g. S, M, L, XL (Leave blank for Watch)"
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-amber-300 font-bold block mb-1">
                        Colors (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={editColors}
                        onChange={(e) => setEditColors(e.target.value)}
                        placeholder="e.g. Black, White, Gold (Optional)"
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 bg-[#050911] border border-slate-700/80 p-3 rounded-2xl">
                      <label className="text-amber-300 font-bold block mb-2 text-xs">Product Image (Upload New Direct Photo OR Edit URL)</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 text-center text-xs font-semibold text-white transition flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4 text-amber-400" />
                            Upload New Photo from Device
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    if (evt.target?.result) setEditImage(evt.target.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {editImage && (
                            <button
                              type="button"
                              onClick={() => setEditImage('')}
                              className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/30 transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Photo
                            </button>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 text-center font-bold font-mono">OR EDIT URL MANUALLY</div>

                        <input
                          type="text"
                          value={editImage}
                          onChange={(e) => setEditImage(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-amber-500 text-xs font-mono"
                        />

                        {editImage ? (
                          <div className="mt-1 flex items-center gap-3 bg-[#0a0f1d] p-2 rounded-xl border border-slate-800">
                            <img src={editImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block">✓ Current Photo Active</span>
                              <span className="text-[11px] text-slate-400">Click "Delete Photo" to remove, or upload a new photo from your device.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-xs text-red-400 font-semibold">
                            ⚠️ Photo removed. Upload a new photo above or type a URL.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-slate-300 font-bold block mb-1">Product Description</label>
                      <textarea
                        rows={3}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="editFeatured"
                        checked={editFeatured}
                        onChange={(e) => setEditFeatured(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="editFeatured" className="text-xs text-slate-200 font-bold cursor-pointer">
                        Mark as "SportX Mart Choice / Featured Product"
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingProd(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (onUpdateProduct && editingProd) {
                          await onUpdateProduct(editingProd.id, {
                            title: editTitle,
                            description: editDesc,
                            priceUsdt: Number(editPrice),
                            category: editCategory,
                            image: editImage,
                            stock: Number(editStock),
                            badge: editBadge,
                            featured: editFeatured,
                            sizes: editSizes ? editSizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
                            colors: editColors ? editColors.split(',').map((c) => c.trim()).filter(Boolean) : [],
                          });
                        }
                        setEditingProd(null);
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                      Save All Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Customer Orders List */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Customer Store Orders ({productOrders.length})</span>
            </h4>

            {productOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No store orders received yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs bg-[#050911]">
                  <thead className="bg-[#0d1726] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Buyer Node</th>
                      <th className="p-3">Item Purchased</th>
                      <th className="p-3">Qty / Total</th>
                      <th className="p-3">Shipping Address</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {productOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-slate-400">{ord.id}</td>
                        <td className="p-3 font-bold text-white">#{ord.userNodeId} ({ord.userName})</td>
                        <td className="p-3 text-cyan-300 font-bold">
                          <div>{ord.productTitle}</div>
                          {(ord.selectedSize || ord.selectedColor) && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                              {ord.selectedSize && (
                                <span className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.2 rounded">
                                  Size: {ord.selectedSize}
                                </span>
                              )}
                              {ord.selectedColor && (
                                <span className="bg-amber-950/80 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded">
                                  Color: {ord.selectedColor}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{ord.quantity}x (₹{ord.totalUsdt} INR)</td>
                        <td className="p-3 text-slate-400 max-w-[180px] truncate" title={ord.shippingAddress}>
                          {ord.shippingAddress}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ord.status === 'shipped'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={ord.status}
                            onChange={(e) => {
                              if (onUpdateOrderStatus) {
                                onUpdateOrderStatus(ord.id, e.target.value);
                              }
                            }}
                            className="bg-[#0c1524] border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 9: RANK REWARDS MANAGEMENT */}
      {activeTab === 'ranks' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0d1728] via-[#111f38] to-[#0d1728] border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Rank Reward & Qualification Rules Manager
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Configure custom leadership rank titles, reward prizes/cash, self active package requirements, direct sponsor thresholds, same package team counts, and level depth limits.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewRankName('');
                  setNewRankRewardTitle('');
                  setNewRankBonusUsdt('2500');
                  setNewRankMinSelfPkg('1000');
                  setNewRankReqDirects('5');
                  setNewRankReqSamePkg('5');
                  setNewRankUpToLevel('3');
                  setNewRankReqVolume('50000');
                  setNewRankIcon('Award');
                  setNewRankColor('#f59e0b');
                  setIsCreatingRank(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 transition shrink-0"
              >
                <Plus className="w-4 h-4 text-black" />
                Add New Rank Reward
              </button>
            </div>
          </div>

          {/* CREATE RANK MODAL */}
          {isCreatingRank && (
            <div className="bg-[#0b1424] border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Configure New Rank Reward Rule
                </h4>
                <button
                  onClick={() => setIsCreatingRank(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <label className="text-amber-300 font-bold block mb-1">Rank Title / Name *</label>
                  <input
                    type="text"
                    value={newRankName}
                    onChange={(e) => setNewRankName(e.target.value)}
                    placeholder="e.g. Executive, Diamond, Crown"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-emerald-300 font-bold block mb-1">Reward Prize / Title</label>
                  <input
                    type="text"
                    value={newRankRewardTitle}
                    onChange={(e) => setNewRankRewardTitle(e.target.value)}
                    placeholder="e.g. iPhone 16 Pro, Dubai Trip"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-emerald-400 font-bold block mb-1">Reward Cash Bonus (₹ INR)</label>
                  <input
                    type="number"
                    value={newRankBonusUsdt}
                    onChange={(e) => setNewRankBonusUsdt(e.target.value)}
                    placeholder="2500"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-cyan-300 font-bold block mb-1">Self Active Package (₹ INR)</label>
                  <input
                    type="number"
                    value={newRankMinSelfPkg}
                    onChange={(e) => setNewRankMinSelfPkg(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-indigo-300 font-bold block mb-1">Total Direct Sponsors Req.</label>
                  <input
                    type="number"
                    value={newRankReqDirects}
                    onChange={(e) => setNewRankReqDirects(e.target.value)}
                    placeholder="5"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-purple-300 font-bold block mb-1">Same Package Team Count</label>
                  <input
                    type="number"
                    value={newRankReqSamePkg}
                    onChange={(e) => setNewRankReqSamePkg(e.target.value)}
                    placeholder="5"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-pink-300 font-bold block mb-1">Up to Level Limit Depth</label>
                  <input
                    type="number"
                    value={newRankUpToLevel}
                    onChange={(e) => setNewRankUpToLevel(e.target.value)}
                    placeholder="3 (0 for Unlimited)"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Team Volume Req. (₹ INR)</label>
                  <input
                    type="number"
                    value={newRankReqVolume}
                    onChange={(e) => setNewRankReqVolume(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Badge Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newRankColor}
                      onChange={(e) => setNewRankColor(e.target.value)}
                      className="w-9 h-9 rounded bg-[#050911] cursor-pointer border border-slate-700"
                    />
                    <input
                      type="text"
                      value={newRankColor}
                      onChange={(e) => setNewRankColor(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Rank Icon</label>
                  <select
                    value={newRankIcon}
                    onChange={(e) => setNewRankIcon(e.target.value)}
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Award">Award</option>
                    <option value="Crown">Crown</option>
                    <option value="Trophy">Trophy</option>
                    <option value="Gift">Gift</option>
                    <option value="Shield">Shield</option>
                    <option value="Gem">Gem</option>
                    <option value="Zap">Zap</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsCreatingRank(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newRankName.trim()) {
                      alert('Please enter a Rank Title');
                      return;
                    }
                    const newRank: RankConfig = {
                      id: `rnk-${Date.now()}`,
                      name: newRankName.trim(),
                      rewardTitle: newRankRewardTitle.trim() || `₹${newRankBonusUsdt} Cash Reward`,
                      bonusUsdt: Number(newRankBonusUsdt) || 0,
                      minSelfPackagePrice: Number(newRankMinSelfPkg) || 0,
                      requiredDirects: Number(newRankReqDirects) || 0,
                      requiredSamePackageCount: Number(newRankReqSamePkg) || 0,
                      upToLevel: Number(newRankUpToLevel) || 0,
                      requiredVolume: Number(newRankReqVolume) || 0,
                      icon: newRankIcon || 'Award',
                      color: newRankColor || '#f59e0b',
                    };

                    const updatedRanks = [...(settings.ranks || []), newRank];
                    await onUpdateSettings({ ...settings, ranks: updatedRanks });
                    setIsCreatingRank(false);
                  }}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  Save Rank Reward
                </button>
              </div>
            </div>
          )}

          {/* EDIT RANK MODAL */}
          {editingRankItem && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0b1424] border border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    Edit Rank Reward Criteria: {editingRankItem.name}
                  </h4>
                  <button
                    onClick={() => setEditingRankItem(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-amber-300 font-bold block mb-1">Rank Title / Name *</label>
                    <input
                      type="text"
                      value={editRankNameVal}
                      onChange={(e) => setEditRankNameVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-emerald-300 font-bold block mb-1">Reward Title / Prize</label>
                    <input
                      type="text"
                      value={editRankRewardTitleVal}
                      onChange={(e) => setEditRankRewardTitleVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-emerald-400 font-bold block mb-1">Reward Cash Bonus (₹ INR)</label>
                    <input
                      type="number"
                      value={editRankBonusUsdtVal}
                      onChange={(e) => setEditRankBonusUsdtVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 font-bold block mb-1">Self Active Package (₹ INR)</label>
                    <input
                      type="number"
                      value={editRankMinSelfPkgVal}
                      onChange={(e) => setEditRankMinSelfPkgVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-indigo-300 font-bold block mb-1">Total Direct Sponsors Req.</label>
                    <input
                      type="number"
                      value={editRankReqDirectsVal}
                      onChange={(e) => setEditRankReqDirectsVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-purple-300 font-bold block mb-1">Same Package Team Count</label>
                    <input
                      type="number"
                      value={editRankReqSamePkgVal}
                      onChange={(e) => setEditRankReqSamePkgVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-pink-300 font-bold block mb-1">Up to Level Limit Depth</label>
                    <input
                      type="number"
                      value={editRankUpToLevelVal}
                      onChange={(e) => setEditRankUpToLevelVal(e.target.value)}
                      placeholder="0 for Unlimited"
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Team Volume Req. (₹ INR)</label>
                    <input
                      type="number"
                      value={editRankReqVolumeVal}
                      onChange={(e) => setEditRankReqVolumeVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Badge Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editRankColorVal}
                        onChange={(e) => setEditRankColorVal(e.target.value)}
                        className="w-9 h-9 rounded bg-[#050911] cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={editRankColorVal}
                        onChange={(e) => setEditRankColorVal(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Rank Icon</label>
                    <select
                      value={editRankIconVal}
                      onChange={(e) => setEditRankIconVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Award">Award</option>
                      <option value="Crown">Crown</option>
                      <option value="Trophy">Trophy</option>
                      <option value="Gift">Gift</option>
                      <option value="Shield">Shield</option>
                      <option value="Gem">Gem</option>
                      <option value="Zap">Zap</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setEditingRankItem(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editRankNameVal.trim()) return;
                      const updatedRanks = (settings.ranks || []).map((r) =>
                        r.id === editingRankItem.id
                          ? {
                              ...r,
                              name: editRankNameVal.trim(),
                              rewardTitle: editRankRewardTitleVal.trim() || `₹${editRankBonusUsdtVal} Cash Reward`,
                              bonusUsdt: Number(editRankBonusUsdtVal) || 0,
                              minSelfPackagePrice: Number(editRankMinSelfPkgVal) || 0,
                              requiredDirects: Number(editRankReqDirectsVal) || 0,
                              requiredSamePackageCount: Number(editRankReqSamePkgVal) || 0,
                              upToLevel: Number(editRankUpToLevelVal) || 0,
                              requiredVolume: Number(editRankReqVolumeVal) || 0,
                              icon: editRankIconVal,
                              color: editRankColorVal,
                            }
                          : r
                      );
                      await onUpdateSettings({ ...settings, ranks: updatedRanks });
                      setEditingRankItem(null);
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  >
                    Update Criteria
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DISPLAY ALL CONFIGURED RANKS */}
          <div className="space-y-4 font-mono">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Active Rank Reward Criteria List ({settings.ranks?.length || 0})</span>
            </h4>

            {(!settings.ranks || settings.ranks.length === 0) ? (
              <div className="bg-[#050911] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No Rank Rewards configured yet. Click "Add New Rank Reward" above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.ranks.map((rank) => (
                  <div
                    key={rank.id}
                    className="bg-[#0b1424] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5" style={{ color: rank.color || '#f59e0b' }} />
                          <span className="text-sm font-extrabold text-white uppercase">{rank.name}</span>
                        </div>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                          style={{
                            backgroundColor: `${rank.color || '#f59e0b'}15`,
                            color: rank.color || '#f59e0b',
                            borderColor: `${rank.color || '#f59e0b'}40`,
                          }}
                        >
                          {rank.name} Rank
                        </span>
                      </div>

                      {/* Reward Title & Cash */}
                      <div className="bg-[#050911] border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Reward Prize / Title</div>
                          <div className="text-xs font-extrabold text-emerald-300">{rank.rewardTitle || 'Cash Reward'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Cash INR</div>
                          <div className="text-sm font-extrabold text-emerald-400">₹{rank.bonusUsdt}</div>
                        </div>
                      </div>

                      {/* Conditions Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-[#070e1b] border border-slate-800/80 p-2.5 rounded-xl space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase block">Self Package</span>
                          <span className="font-extrabold text-cyan-300">₹{rank.minSelfPackagePrice || 0}+</span>
                        </div>

                        <div className="bg-[#070e1b] border border-slate-800/80 p-2.5 rounded-xl space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase block">Direct Sponsors</span>
                          <span className="font-extrabold text-indigo-300">{rank.requiredDirects || 0} Directs</span>
                        </div>

                        <div className="bg-[#070e1b] border border-slate-800/80 p-2.5 rounded-xl space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase block">Same Pkg Team</span>
                          <span className="font-extrabold text-purple-300">{rank.requiredSamePackageCount || 0} Users</span>
                        </div>

                        <div className="bg-[#070e1b] border border-slate-800/80 p-2.5 rounded-xl space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase block">Up to Level</span>
                          <span className="font-extrabold text-pink-300">
                            {rank.upToLevel && rank.upToLevel > 0 ? `Level ${rank.upToLevel}` : 'Unlimited'}
                          </span>
                        </div>
                      </div>

                      {rank.requiredVolume && rank.requiredVolume > 0 ? (
                        <div className="text-[10px] text-slate-400 flex justify-between bg-[#070e1b] px-3 py-1.5 rounded-lg border border-slate-800">
                          <span>Team Volume Required:</span>
                          <span className="font-bold text-amber-300">₹{rank.requiredVolume.toLocaleString('en-IN')}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setEditingRankItem(rank);
                          setEditRankNameVal(rank.name);
                          setEditRankRewardTitleVal(rank.rewardTitle || '');
                          setEditRankBonusUsdtVal(String(rank.bonusUsdt || 0));
                          setEditRankMinSelfPkgVal(String(rank.minSelfPackagePrice || 0));
                          setEditRankReqDirectsVal(String(rank.requiredDirects || 0));
                          setEditRankReqSamePkgVal(String(rank.requiredSamePackageCount || 0));
                          setEditRankUpToLevelVal(String(rank.upToLevel || 0));
                          setEditRankReqVolumeVal(String(rank.requiredVolume || 0));
                          setEditRankIconVal(rank.icon || 'Award');
                          setEditRankColorVal(rank.color || '#f59e0b');
                        }}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Criteria
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete rank reward "${rank.name}"?`)) {
                            const updatedRanks = (settings.ranks || []).filter((r) => r.id !== rank.id);
                            await onUpdateSettings({ ...settings, ranks: updatedRanks });
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 10: DATE-WISE REPORTS & PDF EXPORT */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Top Banner with Download Button */}
          <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Date-Wise Performance & Operations Report
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Filter system joinings, package upgrades, and withdrawal statements date-wise and download an official PDF report.
              </p>
            </div>
            <button
              onClick={generatePdfReport}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Statement</span>
            </button>
          </div>

          {/* Date Filter & Presets Card */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Select Custom Date Range:</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Range: <strong className="text-white">{reportStartDate}</strong> to <strong className="text-white">{reportEndDate}</strong></span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyReportPreset('today')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyReportPreset('yesterday')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => applyReportPreset('7days')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyReportPreset('30days')}
                className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-lg transition"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => applyReportPreset('thisMonth')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyReportPreset('allTime')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition"
              >
                All Time
              </button>
            </div>

            {/* Date Pickers Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Date (Start)</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs font-mono focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Date (End)</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 text-xs font-mono focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={generatePdfReport}
                  className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Joinings */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">New User Joinings</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{filteredJoinings.length}</div>
              <div className="text-[10px] text-slate-400">Users registered in selected range</div>
            </div>

            {/* Stat 2: Package Upgrades */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Package Upgrades</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">₹{totalPackageRevenue.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400">{packageUpgrades.length} packages activated</div>
            </div>

            {/* Stat 3: Withdrawals */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Withdrawals</span>
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-300">₹{totalNetApprovedWithdrawals.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400">{approvedWithdrawals.length} Approved ({pendingWithdrawals.length} Pending)</div>
            </div>

            {/* Stat 4: Approved Deposits */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Deposits</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300">₹{totalApprovedDepositsAmount.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400">{approvedDeposits.length} deposits approved</div>
            </div>
          </div>

          {/* Detailed Data Section with Sub-Tabs */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportDetailTab('joinings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reportDetailTab === 'joinings'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New Joinings ({filteredJoinings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportDetailTab('packages')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reportDetailTab === 'packages'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Package Upgrades ({packageUpgrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportDetailTab('withdrawals')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reportDetailTab === 'withdrawals'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Withdrawals ({filteredWithdrawals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportDetailTab('deposits')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    reportDetailTab === 'deposits'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Deposits ({filteredDeposits.length})
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                Detailed Log Breakdown for <span className="text-amber-400 font-mono font-bold">{reportStartDate}</span> to <span className="text-amber-400 font-mono font-bold">{reportEndDate}</span>
              </div>
            </div>

            {/* Table 1: Joinings */}
            {reportDetailTab === 'joinings' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider bg-[#050911]">
                      <th className="p-3">#</th>
                      <th className="p-3">Node ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Sponsor ID</th>
                      <th className="p-3">Active Package</th>
                      <th className="p-3">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredJoinings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                          No users joined in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      filteredJoinings.map((u, idx) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-amber-400 font-bold">{u.nodeId}</td>
                          <td className="p-3 font-sans font-bold text-white">{u.name}</td>
                          <td className="p-3 text-slate-400">{u.email}</td>
                          <td className="p-3 text-cyan-300">{u.sponsorId || 'ROOT'}</td>
                          <td className="p-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {u.activePackageId || 'Free Node'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{formatYYYYMMDD(u.registeredAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table 2: Package Upgrades */}
            {reportDetailTab === 'packages' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider bg-[#050911]">
                      <th className="p-3">#</th>
                      <th className="p-3">Node ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Package Name</th>
                      <th className="p-3">Package Value</th>
                      <th className="p-3">Activation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {packageUpgrades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                          No package upgrades found in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      packageUpgrades.map((item, idx) => (
                        <tr key={item.user.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-amber-400 font-bold">{item.user.nodeId}</td>
                          <td className="p-3 font-sans font-bold text-white">{item.user.name}</td>
                          <td className="p-3 font-sans">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {item.packageName}
                            </span>
                          </td>
                          <td className="p-3 text-emerald-400 font-extrabold">₹{item.packagePrice}</td>
                          <td className="p-3 text-slate-400">{formatYYYYMMDD(item.activatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table 3: Withdrawals */}
            {reportDetailTab === 'withdrawals' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider bg-[#050911]">
                      <th className="p-3">#</th>
                      <th className="p-3">Node ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Requested</th>
                      <th className="p-3">Upgrade (20%)</th>
                      <th className="p-3">Net Payout</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                          No withdrawal requests found in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map((w, idx) => (
                        <tr key={w.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-amber-400 font-bold">{w.userNodeId}</td>
                          <td className="p-3 font-sans font-bold text-white">{w.userName}</td>
                          <td className="p-3 text-white font-bold">₹{w.requestedAmount}</td>
                          <td className="p-3 text-slate-400">₹{w.upgradeDeduction || 0}</td>
                          <td className="p-3 text-cyan-300 font-extrabold">₹{w.netAmount || w.requestedAmount}</td>
                          <td className="p-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                w.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : w.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{formatYYYYMMDD(w.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table 4: Deposits */}
            {reportDetailTab === 'deposits' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider bg-[#050911]">
                      <th className="p-3">#</th>
                      <th className="p-3">Node ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">UTR / Ref ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                          No deposit requests found in the selected date range.
                        </td>
                      </tr>
                    ) : (
                      filteredDeposits.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 text-amber-400 font-bold">{d.userNodeId}</td>
                          <td className="p-3 font-sans font-bold text-white">{d.userName}</td>
                          <td className="p-3 text-emerald-400 font-extrabold">₹{d.amount}</td>
                          <td className="p-3 text-cyan-300">{d.network}</td>
                          <td className="p-3 text-slate-400 truncate max-w-[120px]">{d.txHash || '-'}</td>
                          <td className="p-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                d.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : d.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{formatYYYYMMDD(d.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 11: COLOR PREDICTION CONTROL */}
      {activeTab === 'color_prediction' && (
        <div className="bg-[#0b1424] border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Dices className="w-5 h-5 text-cyan-400" />
                Color Prediction Live Control & Risk Manager
              </h3>
              <p className="text-xs text-slate-400">
                Monitor current live period bets and force the outcome number (0-9) for the next round.
              </p>
            </div>
            <button
              onClick={fetchColorStats}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Live Stakes
            </button>
          </div>

          {/* Live Stakes Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#070d18] border border-cyan-500/30 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 font-sans">Total Live Stakes</div>
              <div className="text-2xl font-black text-cyan-300">₹{colorStats?.totalStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">{colorStats?.betsCount || 0} active bets placed</div>
            </div>

            <div className="bg-[#070d18] border border-emerald-500/30 p-4 rounded-xl space-y-1">
              <div className="text-emerald-400 font-bold font-sans">Green Stakes (2x)</div>
              <div className="text-xl font-bold text-white">₹{colorStats?.greenStakes?.toFixed(2) || '0.00'}</div>
            </div>

            <div className="bg-[#070d18] border border-rose-500/30 p-4 rounded-xl space-y-1">
              <div className="text-rose-400 font-bold font-sans">Red Stakes (2x)</div>
              <div className="text-xl font-bold text-white">₹{colorStats?.redStakes?.toFixed(2) || '0.00'}</div>
            </div>

            <div className="bg-[#070d18] border border-purple-500/30 p-4 rounded-xl space-y-1">
              <div className="text-purple-400 font-bold font-sans">Violet Stakes (4.5x)</div>
              <div className="text-xl font-bold text-white">₹{colorStats?.violetStakes?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Mode Switcher Cards: Automatic Lowest Payout vs Manual vs Random */}
          <div className="bg-[#070d18] border border-cyan-500/30 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Color Prediction Risk & Winner Mode Control
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Choose how winning numbers (0-9) are selected when each 1-minute period ends.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                Active Mode: {colorStats?.adminMode || 'LOWEST_PAYOUT'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Smart 60:40 Retention Mode */}
              <button
                type="button"
                onClick={() => handleSetColorPredictionMode('smart_retention_60_40')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  colorStats?.adminMode === 'smart_retention_60_40'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Smart 60:40 Retention Mode
                  </div>
                  {colorStats?.adminMode === 'smart_retention_60_40' && (
                    <span className="text-[10px] bg-purple-500 text-white font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  <b>60% House Profit / 40% User Win Balance</b> + First 3 Bet <b>50% Loss Refund Shield</b> for maximum player trust and retention!
                </p>
              </button>

              {/* Option 2: Automatic Lowest Payout */}
              <button
                type="button"
                onClick={() => handleSetColorPredictionMode('lowest_payout')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  colorStats?.adminMode === 'lowest_payout'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Max Profit Mode (Lowest Bet)
                  </div>
                  {colorStats?.adminMode === 'lowest_payout' && (
                    <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  System automatically selects the number (0-9) that gives <b>LOWEST total payout</b> (100% Max House Margin).
                </p>
              </button>

              {/* Option 3: Standard Random */}
              <button
                type="button"
                onClick={() => handleSetColorPredictionMode('random')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  colorStats?.adminMode === 'random' && colorStats?.forcedNextNumber === null
                    ? 'bg-blue-500/10 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-blue-400 flex items-center gap-1.5">
                    <Shuffle className="w-4 h-4" />
                    Standard Random Mode
                  </div>
                  {colorStats?.adminMode === 'random' && colorStats?.forcedNextNumber === null && (
                    <span className="text-[10px] bg-blue-500 text-white font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Standard 100% random mathematical draw between numbers 0 and 9 regardless of stakes.
                </p>
              </button>

              {/* Option 4: Manual Override */}
              <button
                type="button"
                onClick={() => handleSetColorPredictionMode('manual')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  colorStats?.adminMode === 'manual' || colorStats?.forcedNextNumber !== null
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Manual Forced Mode
                  </div>
                  {(colorStats?.adminMode === 'manual' || colorStats?.forcedNextNumber !== null) && (
                    <span className="text-[10px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Admin manually picks a specific number (0-9) to force win for the next round.
                </p>
              </button>
            </div>

            {/* Live Projected Auto Outcome Box */}
            {colorStats?.numberPayoutProjections && (
              <div className={`p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border ${
                colorStats.adminMode === 'smart_retention_60_40'
                  ? 'bg-[#130d24] border-purple-500/40 text-purple-200'
                  : 'bg-[#0b1426] border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border ${
                    colorStats.adminMode === 'smart_retention_60_40'
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  }`}>
                    #{colorStats.adminMode === 'smart_retention_60_40' ? (colorStats.projected6040Number ?? colorStats.projectedLowestNumber) : colorStats.projectedLowestNumber}
                  </div>
                  <div>
                    <div className={`font-bold ${colorStats.adminMode === 'smart_retention_60_40' ? 'text-purple-300' : 'text-emerald-300'}`}>
                      {colorStats.adminMode === 'smart_retention_60_40'
                        ? `60:40 Retention Engine: Targeted Payout Candidate Number #${colorStats.projected6040Number ?? colorStats.projectedLowestNumber}`
                        : `Auto Max Profit Predicted Winner: Number #${colorStats.projectedLowestNumber}`}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Estimated Round Payout: <span className="text-white font-bold">₹{(colorStats.adminMode === 'smart_retention_60_40' ? (colorStats.projected6040Payout ?? colorStats.projectedLowestPayout) : colorStats.projectedLowestPayout)?.toFixed(2)}</span>
                      {' '}(Total Pool: ₹{(colorStats.totalStakes || 0).toFixed(2)})
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {colorStats.adminMode === 'smart_retention_60_40' ? (
                    <span className="text-purple-300 font-bold">🛡️ 60:40 Mode Active + 50% First 3 Loss Shield Enabled</span>
                  ) : colorStats.adminMode === 'lowest_payout' ? (
                    <span className="text-emerald-400 font-bold">🤖 Auto Mode will declare #{colorStats.projectedLowestNumber} when round ends</span>
                  ) : (
                    <span className="text-amber-400">Select Smart 60:40 or Automatic Mode above</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Force Outcome Controller */}
          <div className="bg-[#070d18] border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Force Next Round Winning Number (Manual Override)
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Select any number (0 to 9) to force as the winning result for the next period. Click Clear Override to return to Automatic Mode.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleForceColorResult(String(n))}
                  className={`w-11 h-11 rounded-xl font-black text-sm border transition ${
                    colorStats?.forcedNextNumber === n
                      ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  handleForceColorResult(null);
                  handleSetColorPredictionMode('lowest_payout');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30"
              >
                Reset to Automatic Mode
              </button>
            </div>

            {colorStats?.forcedNextNumber !== null && colorStats?.forcedNextNumber !== undefined && (
              <div className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Next round result is currently FORCED to number #{colorStats.forcedNextNumber}!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: DRAGON VS TIGER RISK & RESULT CONTROL */}
      {activeTab === 'dragon_tiger' && (
        <div className="space-y-6 font-mono">
          <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Dragon vs Tiger Risk & Result Control Engine
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure 60:40 Smart Retention, Automatic House Profit, Fair Random RNG, or manually force Dragon (2X), Tiger (2X), or Tie (8X).
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDragonTigerStats}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Stats
            </button>
          </div>

          {/* Stats Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Total Recent Bets Volume</div>
              <div className="text-2xl font-black text-amber-400">₹{dragonTigerStats?.totalStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">{dragonTigerStats?.recentBetsCount || 0} bets placed</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">🐉 Dragon Stakes (2.0X)</div>
              <div className="text-2xl font-black text-rose-400">₹{dragonTigerStats?.dragonStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">Liability: ₹{(dragonTigerStats?.dragonPayout || (dragonTigerStats?.dragonStakes || 0) * 2).toFixed(2)}</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">🐅 Tiger Stakes (2.0X)</div>
              <div className="text-2xl font-black text-amber-400">₹{dragonTigerStats?.tigerStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">Liability: ₹{(dragonTigerStats?.tigerPayout || (dragonTigerStats?.tigerStakes || 0) * 2).toFixed(2)}</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">👔 Tie Stakes (8.0X)</div>
              <div className="text-2xl font-black text-emerald-400">₹{dragonTigerStats?.tieStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">Liability: ₹{(dragonTigerStats?.tiePayout || (dragonTigerStats?.tieStakes || 0) * 8).toFixed(2)}</div>
            </div>
          </div>

          {/* Risk Mode Selector */}
          <div className="bg-[#070d18] border border-amber-500/30 p-5 rounded-2xl space-y-4">
            <div className="text-sm font-bold text-amber-300">Select Platform Risk Algorithm</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Option 1: Smart 60:40 Retention Mode */}
              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('smart_retention_60_40')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  dragonTigerStats?.adminMode === 'smart_retention_60_40' && dragonTigerStats?.forcedWinner === null
                    ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Smart 60:40 Retention
                  </div>
                  {dragonTigerStats?.adminMode === 'smart_retention_60_40' && dragonTigerStats?.forcedWinner === null && (
                    <span className="text-[10px] bg-purple-500 text-white font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Target 60% platform house profit + 40% user win cycle + 50% First 3 losses shield. Maximum player retention.
                </p>
              </button>

              {/* Option 2: Lowest Payout Mode */}
              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('lowest_payout')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  dragonTigerStats?.adminMode === 'lowest_payout' && dragonTigerStats?.forcedWinner === null
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" />
                    Automatic House Profit
                  </div>
                  {dragonTigerStats?.adminMode === 'lowest_payout' && dragonTigerStats?.forcedWinner === null && (
                    <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Engine calculates stakes and picks the winning side that minimizes house payout liability.
                </p>
              </button>

              {/* Option 3: Fair Random Mode */}
              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('random')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  dragonTigerStats?.adminMode === 'random' && dragonTigerStats?.forcedWinner === null
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-blue-400 flex items-center gap-1.5">
                    <Shuffle className="w-4 h-4" />
                    Standard Random Mode
                  </div>
                  {dragonTigerStats?.adminMode === 'random' && dragonTigerStats?.forcedWinner === null && (
                    <span className="text-[10px] bg-blue-500 text-white font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Standard 100% random cards distribution (45% Dragon, 45% Tiger, 10% Tie).
                </p>
              </button>

              {/* Option 4: Manual Override */}
              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('manual')}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                  dragonTigerStats?.adminMode === 'manual' || dragonTigerStats?.forcedWinner !== null
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Manual Forced Mode
                  </div>
                  {(dragonTigerStats?.adminMode === 'manual' || dragonTigerStats?.forcedWinner !== null) && (
                    <span className="text-[10px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  Admin manually picks Dragon, Tiger, or Tie to force win for the next round.
                </p>
              </button>
            </div>

            {/* Live Projected Auto Outcome Box */}
            <div className={`p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border ${
              dragonTigerStats?.adminMode === 'smart_retention_60_40'
                ? 'bg-[#130d24] border-purple-500/40 text-purple-200'
                : 'bg-[#0b1426] border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border text-sm uppercase ${
                  dragonTigerStats?.adminMode === 'smart_retention_60_40'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                  {dragonTigerStats?.adminMode === 'smart_retention_60_40'
                    ? (dragonTigerStats?.projected6040Winner === 'dragon' ? '🐉' : dragonTigerStats?.projected6040Winner === 'tiger' ? '🐅' : '👔')
                    : (dragonTigerStats?.projectedLowestWinner === 'dragon' ? '🐉' : dragonTigerStats?.projectedLowestWinner === 'tiger' ? '🐅' : '👔')}
                </div>
                <div>
                  <div className={`font-bold ${dragonTigerStats?.adminMode === 'smart_retention_60_40' ? 'text-purple-300' : 'text-emerald-300'}`}>
                    {dragonTigerStats?.adminMode === 'smart_retention_60_40'
                      ? `60:40 Retention Engine: Targeted Winner [${(dragonTigerStats?.projected6040Winner || 'DRAGON').toUpperCase()}]`
                      : `Auto Max Profit Predicted Winner: [${(dragonTigerStats?.projectedLowestWinner || 'DRAGON').toUpperCase()}]`}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Estimated Round Payout Liability: <span className="text-white font-bold">₹{(dragonTigerStats?.adminMode === 'smart_retention_60_40' ? (dragonTigerStats?.projected6040Payout ?? 0) : (dragonTigerStats?.projectedLowestPayout ?? 0)).toFixed(2)}</span>
                    {' '}(Total Pool: ₹{(dragonTigerStats?.totalStakes || 0).toFixed(2)})
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {dragonTigerStats?.adminMode === 'smart_retention_60_40' ? (
                  <span className="text-purple-300 font-bold">🛡️ 60:40 Mode Active + 50% First 3 Loss Shield Enabled</span>
                ) : dragonTigerStats?.adminMode === 'lowest_payout' ? (
                  <span className="text-emerald-400 font-bold">🤖 Auto Mode will declare [{(dragonTigerStats?.projectedLowestWinner || 'DRAGON').toUpperCase()}]</span>
                ) : (
                  <span className="text-amber-400">Select Smart 60:40 or Automatic Mode above</span>
                )}
              </div>
            </div>
          </div>

          {/* Forced Winner Buttons */}
          <div className="bg-[#070d18] border border-amber-500/30 p-5 rounded-2xl space-y-4">
            <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Force Next Round Winner (1-Click Override)
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Click any button below to instantly dictate which outcome wins in the upcoming deal round:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleForceDragonTigerResult('dragon')}
                className={`py-3.5 px-4 rounded-xl font-black text-sm border-2 transition flex items-center justify-center gap-2 ${
                  dragonTigerStats?.forcedWinner === 'dragon'
                    ? 'bg-rose-600 text-white border-white shadow-[0_0_20px_rgba(244,63,94,0.8)]'
                    : 'bg-rose-950/40 text-rose-300 border-rose-600/50 hover:bg-rose-600 hover:text-white'
                }`}
              >
                <span>🐉 Force Dragon Win (2X)</span>
              </button>

              <button
                type="button"
                onClick={() => handleForceDragonTigerResult('tiger')}
                className={`py-3.5 px-4 rounded-xl font-black text-sm border-2 transition flex items-center justify-center gap-2 ${
                  dragonTigerStats?.forcedWinner === 'tiger'
                    ? 'bg-amber-500 text-black border-white shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                    : 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-500 hover:text-black'
                }`}
              >
                <span>🐅 Force Tiger Win (2X)</span>
              </button>

              <button
                type="button"
                onClick={() => handleForceDragonTigerResult('tie')}
                className={`py-3.5 px-4 rounded-xl font-black text-sm border-2 transition flex items-center justify-center gap-2 ${
                  dragonTigerStats?.forcedWinner === 'tie'
                    ? 'bg-emerald-600 text-white border-white shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <span>👔 Force Tie Win (8X)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleForceDragonTigerResult(null);
                  handleSetDragonTigerMode('smart_retention_60_40');
                }}
                className="py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <span>🔄 Reset to 60:40 Mode</span>
              </button>
            </div>

            {dragonTigerStats?.forcedWinner && (
              <div className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Next round outcome is currently FORCED to: [{dragonTigerStats.forcedWinner.toUpperCase()}]!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: AVIATOR CRASH CONTROL */}
      {activeTab === 'aviator_game' && (
        <div className="space-y-6 font-mono">
          <div className="bg-[#0b1424] border border-rose-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
                <Plane className="w-5 h-5 text-rose-400" />
                Aviator Crash Risk & Target Multiplier Control
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure risk management, forced crash points, and view live active bets for Aviator.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAviatorStats}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Total Stakes in Round</div>
              <div className="text-2xl font-black text-rose-400">₹{aviatorStats?.totalStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">{aviatorStats?.activeBetsCount || 0} active bets</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Current Multiplier</div>
              <div className="text-2xl font-black text-amber-400">{aviatorStats?.currentMultiplier?.toFixed(2) || '1.00'}x</div>
              <div className="text-[10px] text-slate-500">Status: {aviatorStats?.status?.toUpperCase()}</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">Target Crash Point</div>
              <div className="text-2xl font-black text-cyan-400">{aviatorStats?.targetCrashMultiplier?.toFixed(2) || '1.00'}x</div>
              <div className="text-[10px] text-slate-500">Mode: {aviatorStats?.adminMode?.toUpperCase()}</div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-[#070d18] border border-rose-500/30 p-5 rounded-2xl space-y-4">
            <div className="text-sm font-bold text-rose-300">Choose Risk Control Mode</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSetAviatorMode('lowest_payout')}
                className={`p-4 rounded-xl text-left border transition ${
                  aviatorStats?.adminMode === 'lowest_payout'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-emerald-400">Automatic (Lowest Payout)</div>
                <p className="text-xs text-slate-300 mt-1">Crashes early when high stakes are placed to protect platform liquidity.</p>
              </button>

              <button
                type="button"
                onClick={() => handleSetAviatorMode('random')}
                className={`p-4 rounded-xl text-left border transition ${
                  aviatorStats?.adminMode === 'random'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-blue-400">Standard Random</div>
                <p className="text-xs text-slate-300 mt-1">Standard random crash distribution (1.01x to 25x+).</p>
              </button>

              <button
                type="button"
                onClick={() => handleSetAviatorMode('manual')}
                className={`p-4 rounded-xl text-left border transition ${
                  aviatorStats?.adminMode === 'manual'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-amber-400">Manual Forced Crash</div>
                <p className="text-xs text-slate-300 mt-1">Admin manually specifies exact multiplier before crash.</p>
              </button>
            </div>
          </div>

          {/* Forced Crash Input */}
          <div className="bg-[#070d18] border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="text-sm font-bold text-amber-300">Force Next Round Crash Multiplier</div>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="number"
                step="0.1"
                min="1.0"
                placeholder="e.g. 1.20 or 5.50"
                id="aviator-force-input"
                className="w-full bg-[#0d1626] border border-slate-700 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('aviator-force-input') as HTMLInputElement;
                  if (el) handleForceAviatorCrash(el.value);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0 hover:bg-amber-400"
              >
                Force Crash
              </button>
              <button
                type="button"
                onClick={() => handleForceAviatorCrash(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs shrink-0"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DAILY TOP BETTOR TOURNAMENT CONTROL */}
      {activeTab === 'tournament' && (
        <div className="space-y-6">
          {/* Tournament Header Bar */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
                <h2 className="text-xl font-black text-white tracking-wide">
                  {editableSettings.dailyTournament?.title || 'Daily Top Bettor Championship 🏆'}
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Configure prize pot size, turnover contribution %, qualification rules, and distribute daily rewards to champions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchAdminTournament}
                disabled={loadingTournament}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTournament ? 'animate-spin text-amber-400' : ''}`} />
                <span>{loadingTournament ? 'Refreshing...' : 'Refresh Stats'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>

              <button
                type="button"
                onClick={handleDistributeTournamentRewards}
                disabled={distributingTournament}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black text-xs font-black transition flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{distributingTournament ? 'Distributing...' : '⚡ Distribute Rewards Now'}</span>
              </button>
            </div>
          </div>

          {/* Live Pot & Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#070e1b] border border-amber-500/40 p-5 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Total Prize Pool</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-300 mt-2">
                ₹{(tournamentData?.totalPot ?? editableSettings.dailyTournament?.basePot ?? 25000).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Guaranteed: ₹{(editableSettings.dailyTournament?.basePot ?? 25000).toLocaleString('en-IN')} + Dynamic Turnover
              </div>
            </div>

            <div className="bg-[#070e1b] border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Today's Bet Turnover</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-300 mt-2">
                ₹{tournamentData?.totalWagerVolume?.toFixed(2) || '0.00'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                +{editableSettings.dailyTournament?.turnoverContributionPercent ?? 5}% added to pot (₹{((tournamentData?.totalWagerVolume || 0) * ((editableSettings.dailyTournament?.turnoverContributionPercent ?? 5) / 100)).toFixed(2)})
              </div>
            </div>

            <div className="bg-[#070e1b] border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Active Bettors</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-300 mt-2">
                {tournamentData?.participantCount || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {tournamentData?.totalBetsPlaced || 0} total bets placed today
              </div>
            </div>

            <div className="bg-[#070e1b] border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">Min Wager Req.</span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-300 mt-2">
                ₹{(editableSettings.dailyTournament?.minWagerToQualify ?? 500).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Turnover threshold to unlock rank prize
              </div>
            </div>
          </div>

          {/* Distribution Success Banner */}
          {tournamentDistributeResult && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{tournamentDistributeResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTournamentDistributeResult(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Dismiss
                </button>
              </div>
              {tournamentDistributeResult.winners && tournamentDistributeResult.winners.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
                  {tournamentDistributeResult.winners.map((w: any) => (
                    <div key={w.userId} className="bg-[#070e1b] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-400">#{w.rank}</span> <span className="text-white font-medium">{w.name}</span> <span className="text-[10px] text-slate-400 font-mono">({w.nodeId})</span>
                      </div>
                      <span className="font-bold text-emerald-400">+₹{w.prizeAmount.toFixed(2)} INR</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Tournament Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Tournament Parameters & Prize Distribution (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Parameters Card */}
              <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Tournament Engine Parameters
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsDirty(true);
                      updateEditableSettings({
                        ...editableSettings,
                        dailyTournament: {
                          ...(editableSettings.dailyTournament || {
                            enabled: true,
                            basePot: 250,
                            turnoverContributionPercent: 5,
                            minWagerToQualify: 10,
                            title: 'Daily Top Bettor Championship 🏆',
                            prizeDistribution: [],
                          }),
                          enabled: !(editableSettings.dailyTournament?.enabled ?? true),
                        },
                      });
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      (editableSettings.dailyTournament?.enabled ?? true)
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-500/20 border-red-500/50 text-red-400'
                    }`}
                  >
                    {(editableSettings.dailyTournament?.enabled ?? true) ? '● Active (Enabled)' : '○ Paused'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Tournament Title:</label>
                    <input
                      type="text"
                      value={editableSettings.dailyTournament?.title ?? 'Daily Top Bettor Championship 🏆'}
                      onChange={(e) => {
                        setIsSettingsDirty(true);
                        updateEditableSettings({
                          ...editableSettings,
                          dailyTournament: {
                            ...(editableSettings.dailyTournament || {
                              enabled: true,
                              basePot: 250,
                              turnoverContributionPercent: 5,
                              minWagerToQualify: 10,
                              title: 'Daily Top Bettor Championship 🏆',
                              prizeDistribution: [],
                            }),
                            title: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-[#070e1b] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">Guaranteed Base Pot (₹):</label>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={editableSettings.dailyTournament?.basePot ?? 25000}
                        onChange={(e) => {
                          setIsSettingsDirty(true);
                          updateEditableSettings({
                            ...editableSettings,
                            dailyTournament: {
                              ...(editableSettings.dailyTournament || {
                                enabled: true,
                                basePot: 25000,
                                turnoverContributionPercent: 5,
                                minWagerToQualify: 500,
                                title: 'Daily Top Bettor Championship 🏆',
                                prizeDistribution: [],
                              }),
                              basePot: parseFloat(e.target.value) || 0,
                            },
                          });
                        }}
                        className="w-full bg-[#070e1b] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">Turnover Contribution (%):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="50"
                        value={editableSettings.dailyTournament?.turnoverContributionPercent ?? 5}
                        onChange={(e) => {
                          setIsSettingsDirty(true);
                          updateEditableSettings({
                            ...editableSettings,
                            dailyTournament: {
                              ...(editableSettings.dailyTournament || {
                                enabled: true,
                                basePot: 25000,
                                turnoverContributionPercent: 5,
                                minWagerToQualify: 500,
                                title: 'Daily Top Bettor Championship 🏆',
                                prizeDistribution: [],
                              }),
                              turnoverContributionPercent: parseFloat(e.target.value) || 0,
                            },
                          });
                        }}
                        className="w-full bg-[#070e1b] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold text-sm focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">Min Daily Wager to Qualify (₹ INR):</label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={editableSettings.dailyTournament?.minWagerToQualify ?? 500}
                      onChange={(e) => {
                        setIsSettingsDirty(true);
                        updateEditableSettings({
                          ...editableSettings,
                          dailyTournament: {
                            ...(editableSettings.dailyTournament || {
                              enabled: true,
                              basePot: 25000,
                              turnoverContributionPercent: 5,
                              minWagerToQualify: 500,
                              title: 'Daily Top Bettor Championship 🏆',
                              prizeDistribution: [],
                            }),
                            minWagerToQualify: parseFloat(e.target.value) || 0,
                          },
                        });
                      }}
                      className="w-full bg-[#070e1b] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold text-sm focus:border-amber-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Users with less than this turnover will not receive prize distribution.</p>
                  </div>
                </div>
              </div>

              {/* Prize Tiers Configuration Card */}
              <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-400" />
                      Rank-Wise Prize Distribution
                    </h3>
                    <span className="text-[10px] text-slate-400">Configure percentage share of total pot for each rank</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsDirty(true);
                        const defaultDistribution = [
                          { rank: 1, percent: 40 },
                          { rank: 2, percent: 25 },
                          { rank: 3, percent: 15 },
                          { rank: 4, percent: 6 },
                          { rank: 5, percent: 6 },
                          { rank: 6, percent: 2 },
                          { rank: 7, percent: 2 },
                          { rank: 8, percent: 2 },
                          { rank: 9, percent: 1 },
                          { rank: 10, percent: 1 },
                        ];
                        updateEditableSettings({
                          ...editableSettings,
                          dailyTournament: {
                            ...(editableSettings.dailyTournament || {
                              enabled: true,
                              basePot: 250,
                              turnoverContributionPercent: 5,
                              minWagerToQualify: 10,
                              title: 'Daily Top Bettor Championship 🏆',
                            }),
                            prizeDistribution: defaultDistribution,
                          },
                        });
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                    >
                      Top 10 Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsDirty(true);
                        const top3Distribution = [
                          { rank: 1, percent: 50 },
                          { rank: 2, percent: 30 },
                          { rank: 3, percent: 20 },
                        ];
                        updateEditableSettings({
                          ...editableSettings,
                          dailyTournament: {
                            ...(editableSettings.dailyTournament || {
                              enabled: true,
                              basePot: 250,
                              turnoverContributionPercent: 5,
                              minWagerToQualify: 10,
                              title: 'Daily Top Bettor Championship 🏆',
                            }),
                            prizeDistribution: top3Distribution,
                          },
                        });
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                    >
                      Top 3 Only
                    </button>
                  </div>
                </div>

                {/* Table of Ranks */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {(editableSettings.dailyTournament?.prizeDistribution && editableSettings.dailyTournament.prizeDistribution.length > 0
                    ? editableSettings.dailyTournament.prizeDistribution
                    : [
                        { rank: 1, percent: 40 },
                        { rank: 2, percent: 25 },
                        { rank: 3, percent: 15 },
                        { rank: 4, percent: 6 },
                        { rank: 5, percent: 6 },
                        { rank: 6, percent: 2 },
                        { rank: 7, percent: 2 },
                        { rank: 8, percent: 2 },
                        { rank: 9, percent: 1 },
                        { rank: 10, percent: 1 },
                      ]
                  ).map((tier, idx) => {
                    const currentPot = tournamentData?.totalPot || editableSettings.dailyTournament?.basePot || 25000;
                    const estimatedPrize = (currentPot * (tier.percent / 100)).toFixed(2);
                    return (
                      <div key={tier.rank} className="flex items-center justify-between bg-[#070e1b] border border-slate-800 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            tier.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                            tier.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                            tier.rank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            #{tier.rank}
                          </span>
                          <span className="font-medium text-slate-300">
                            {tier.rank === 1 ? '1st Champion' : tier.rank === 2 ? '2nd Runner Up' : tier.rank === 3 ? '3rd Place' : `Rank ${tier.rank}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={tier.percent}
                              onChange={(e) => {
                                setIsSettingsDirty(true);
                                const newPercent = parseFloat(e.target.value) || 0;
                                const currentList = editableSettings.dailyTournament?.prizeDistribution && editableSettings.dailyTournament.prizeDistribution.length > 0
                                  ? [...editableSettings.dailyTournament.prizeDistribution]
                                  : [
                                      { rank: 1, percent: 40 },
                                      { rank: 2, percent: 25 },
                                      { rank: 3, percent: 15 },
                                      { rank: 4, percent: 6 },
                                      { rank: 5, percent: 6 },
                                      { rank: 6, percent: 2 },
                                      { rank: 7, percent: 2 },
                                      { rank: 8, percent: 2 },
                                      { rank: 9, percent: 1 },
                                      { rank: 10, percent: 1 },
                                    ];
                                currentList[idx] = { rank: tier.rank, percent: newPercent };
                                updateEditableSettings({
                                  ...editableSettings,
                                  dailyTournament: {
                                    ...(editableSettings.dailyTournament || {
                                      enabled: true,
                                      basePot: 250,
                                      turnoverContributionPercent: 5,
                                      minWagerToQualify: 10,
                                      title: 'Daily Top Bettor Championship 🏆',
                                    }),
                                    prizeDistribution: currentList,
                                  },
                                });
                              }}
                              className="w-16 bg-[#050911] border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-300"
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>

                          <div className="w-24 text-right">
                            <span className="text-emerald-400 font-bold font-mono">~₹{estimatedPrize}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Percentage:</span>
                  <span className={`font-bold font-mono ${
                    ((editableSettings.dailyTournament?.prizeDistribution || []).reduce((sum, t) => sum + t.percent, 0) || 100) === 100
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}>
                    {((editableSettings.dailyTournament?.prizeDistribution || []).reduce((sum, t) => sum + t.percent, 0) || 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Live Leaderboard (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Tournament Leaderboard (Today)</h3>
                      <p className="text-[10px] text-slate-400">Real-time wagering rankings calculated across Color Prediction, Dragon Tiger & Aviator</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    ● Live Tracking
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 pl-2">Rank</th>
                        <th className="pb-2">User / Node ID</th>
                        <th className="pb-2 text-right">Wager Volume</th>
                        <th className="pb-2 text-center">Bets</th>
                        <th className="pb-2 text-right">Projected Prize</th>
                        <th className="pb-2 text-center pr-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {tournamentData?.leaderboard && tournamentData.leaderboard.length > 0 ? (
                        tournamentData.leaderboard.map((item: any) => (
                          <tr key={item.userId} className="hover:bg-slate-800/30 transition">
                            <td className="py-2.5 pl-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs ${
                                item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                                item.rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                                item.rank === 3 ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40' :
                                'text-slate-400'
                              }`}>
                                #{item.rank}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <div className="font-bold text-white">{item.userName}</div>
                              <div className="text-[10px] text-amber-400/80">{item.userNodeId}</div>
                            </td>
                            <td className="py-2.5 text-right font-bold text-cyan-300">
                              ₹{item.totalWagered.toFixed(2)}
                            </td>
                            <td className="py-2.5 text-center text-slate-400">
                              {item.betsCount}
                            </td>
                            <td className="py-2.5 text-right">
                              {item.projectedPrize > 0 ? (
                                <span className="font-bold text-emerald-400">+₹{item.projectedPrize.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-400">₹0.00</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center pr-2">
                              {item.qualified ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Qualified
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30" title={`Requires ₹${editableSettings.dailyTournament?.minWagerToQualify || 500} minimum turnover`}>
                                  Below Min (₹)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                            No bets recorded for today yet. Users placing bets on Color Prediction, Dragon Tiger, or Aviator will automatically appear here!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOTTERY & LUCKY DRAW ADMIN CONTROL */}
      {activeTab === 'lottery_draw' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ticket className="w-6 h-6 text-amber-400 animate-pulse" />
                <h2 className="text-xl font-black text-white tracking-wide">
                  Lottery & Lucky Draw Prize Manager 🎟️
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Set and update prize pool amounts for all 5 tiers (1st to 5th) and guaranteed prizes, configure coupon ticket price, and set forced winners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchAdminLuckyDraw}
                disabled={loadingLuckyDraw}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLuckyDraw ? 'animate-spin text-amber-400' : ''}`} />
                <span>{loadingLuckyDraw ? 'Refreshing...' : 'Refresh Status'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveLuckyDrawConfig()}
                disabled={savingLuckyDraw}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingLuckyDraw ? 'Saving...' : 'Save Prize Amounts & Winners'}</span>
              </button>
            </div>
          </div>

          {luckyDrawMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${
                luckyDrawMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              }`}
            >
              {luckyDrawMsg.text}
            </div>
          )}

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#070e1d] border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">TICKET PRICE</span>
              <span className="text-lg font-black text-white">₹{ldTicketPrice || 100}</span>
            </div>
            <div className="bg-[#070e1d] border border-amber-500/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-amber-400 font-bold block">🥇 1st PRIZE</span>
              <span className="text-lg font-black text-amber-300">₹{ldPrize1 || 25000}</span>
            </div>
            <div className="bg-[#070e1d] border border-purple-500/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-purple-400 font-bold block">🥈 2nd PRIZE</span>
              <span className="text-lg font-black text-purple-300">₹{ldPrize2 || 10000}</span>
            </div>
            <div className="bg-[#070e1d] border border-cyan-500/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-cyan-400 font-bold block">🥉 3rd PRIZE</span>
              <span className="text-lg font-black text-cyan-300">₹{ldPrize3 || 5000}</span>
            </div>
            <div className="bg-[#070e1d] border border-emerald-500/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-emerald-400 font-bold block">⭐ 4th PRIZE</span>
              <span className="text-lg font-black text-emerald-300">₹{ldPrize4 || 2500}</span>
            </div>
            <div className="bg-[#070e1d] border border-rose-500/30 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-rose-400 font-bold block">🎖️ 5th PRIZE</span>
              <span className="text-lg font-black text-rose-300">₹{ldPrize5 || 1500}</span>
            </div>
          </div>

          {/* Prize Pool Amounts Configuration Form */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Prize Amounts Configuration (₹ INR)</span>
                </h3>
                <span className="text-xs text-slate-400">Values update instantly and persist permanently</span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveLuckyDrawConfig()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Prize Amounts</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#070e1d] border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-slate-300 block">🎟️ Coupon Ticket Price (₹):</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ldTicketPrice}
                  onChange={(e) => {
                    setLdTicketPrice(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 100 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ ticketPrice: val });
                  }}
                  className="w-full bg-[#02050e] border border-slate-700 rounded-lg px-3 py-2 text-white font-black text-sm focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Price per 6-digit coupon entry</span>
              </div>

              <div className="bg-[#070e1d] border border-amber-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-amber-400 block">🥇 1st Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrize1}
                  onChange={(e) => {
                    setLdPrize1(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 25000 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ prizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-amber-500/60 rounded-lg px-3 py-2 text-amber-300 font-black text-sm focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Grand 1st Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-purple-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-purple-400 block">🥈 2nd Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrize2}
                  onChange={(e) => {
                    setLdPrize2(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 10000 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ secondPrizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-purple-500/60 rounded-lg px-3 py-2 text-purple-300 font-black text-sm focus:border-purple-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">2nd Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-cyan-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-cyan-400 block">🥉 3rd Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrize3}
                  onChange={(e) => {
                    setLdPrize3(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 5000 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ thirdPrizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-cyan-500/60 rounded-lg px-3 py-2 text-cyan-300 font-black text-sm focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">3rd Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-emerald-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-emerald-400 block">⭐ 4th Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrize4}
                  onChange={(e) => {
                    setLdPrize4(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 2500 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ fourthPrizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-emerald-500/60 rounded-lg px-3 py-2 text-emerald-300 font-black text-sm focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">4th Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-rose-500/40 rounded-xl p-3.5 space-y-1">
                <label className="text-xs font-bold text-rose-400 block">🎖️ 5th Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrize5}
                  onChange={(e) => {
                    setLdPrize5(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 1500 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ fifthPrizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-rose-500/60 rounded-lg px-3 py-2 text-rose-300 font-black text-sm focus:border-rose-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">5th Prize Winner payout</span>
              </div>

              <div className="bg-[#070e1d] border border-yellow-500/40 rounded-xl p-3.5 space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-yellow-400 block">🎁 Guaranteed Prize Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={ldPrizeGuaranteed}
                  onChange={(e) => {
                    setLdPrizeGuaranteed(e.target.value === '' ? '' : Number(e.target.value));
                    setIsSettingsDirty(true);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 500 : Number(e.target.value);
                    handleSaveLuckyDrawConfig({ guaranteedPrizeAmount: val });
                  }}
                  className="w-full bg-[#02050e] border border-yellow-500/60 rounded-lg px-3 py-2 text-yellow-300 font-black text-sm focus:border-yellow-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block">45x Matching series winner payout</span>
              </div>
            </div>
          </div>

          {/* Forced Winner Selection (1st to 5th Prizes) */}
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Forced Winner Controller (1st to 5th Prize Tiers)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select any registered member for each prize slot. If they don't have a ticket, one is automatically created when triggered.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleared = {
                      '1': { userId: '', ticketNumber: '' },
                      '2': { userId: '', ticketNumber: '' },
                      '3': { userId: '', ticketNumber: '' },
                      '4': { userId: '', ticketNumber: '' },
                      '5': { userId: '', ticketNumber: '' },
                    };
                    setLdForcedPrizes(cleared);
                    handleSaveLuckyDrawConfig({ forcedPrizes: cleared });
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All Forced Winners</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {([1, 2, 3, 4, 5] as const).map((step) => {
                const stKey = String(step) as '1' | '2' | '3' | '4' | '5';
                const prizeTitles = ['1st Prize (🥇)', '2nd Prize (🥈)', '3rd Prize (🥉)', '4th Prize (⭐)', '5th Prize (🎖️)'];
                const prizeAmounts = [ldPrize1 || 25000, ldPrize2 || 10000, ldPrize3 || 5000, ldPrize4 || 2500, ldPrize5 || 1500];
                const currentForced = ldForcedPrizes[stKey] || { userId: '', ticketNumber: '' };
                const chosenUser = users.find((u) => u.id === currentForced.userId);

                return (
                  <div
                    key={step}
                    className={`rounded-2xl p-4 space-y-3 border transition-all ${
                      currentForced.userId || currentForced.ticketNumber
                        ? 'bg-gradient-to-b from-[#0f172a] to-[#080d1a] border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-[#060a15] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-black text-amber-300">{prizeTitles[step - 1]}</span>
                      <span className="text-xs font-bold text-emerald-400">₹{prizeAmounts[step - 1]}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">Select Member:</label>
                      <select
                        value={currentForced.userId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = {
                            ...ldForcedPrizes,
                            [stKey]: { ...currentForced, userId: val },
                          };
                          setLdForcedPrizes(updated);
                          handleSaveLuckyDrawConfig({ forcedPrizes: updated });
                        }}
                        className="w-full p-2 bg-[#02050e] border border-slate-700 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="">-- Random Fair Draw --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.nodeId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {chosenUser && (
                      <div className="text-[10px] text-slate-400 bg-[#02050e] border border-slate-800 rounded-xl p-2 space-y-0.5">
                        <div className="font-bold text-amber-300">Selected: {chosenUser.name}</div>
                        <div className="text-cyan-300">Node: {chosenUser.nodeId}</div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">Custom 6-Digit Coupon (Optional):</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Random / Auto"
                        value={currentForced.ticketNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const updated = {
                            ...ldForcedPrizes,
                            [stKey]: { ...currentForced, ticketNumber: val },
                          };
                          setLdForcedPrizes(updated);
                        }}
                        onBlur={() => handleSaveLuckyDrawConfig()}
                        className="w-full p-2 bg-[#02050e] border border-slate-800 rounded-xl text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono tracking-widest font-bold text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: UPI PAYMENT GATEWAY & 100+ ROTATION POOL */}
      {activeTab === 'upi_gateway' && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  UPI Payment Gateway & 100+ Dynamic Rotation Pool
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Har deposit me user ko alag-alag rotating UPI ID show hogi. Ek baar me 100+ UPI IDs paste karke pool me add karein aur subdomain ya direct gateway se seamless deposits accept karein.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestRotatingUpi}
                disabled={testingUpi}
                className="px-3.5 py-2 rounded-xl bg-[#0e224b] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingUpi ? 'animate-spin' : ''}`} />
                <span>Test Next UPI</span>
              </button>
              <button
                type="button"
                onClick={handleSaveGatewayConfig}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 text-xs font-black transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Gateway Config</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          {(() => {
            const pool = settings?.paymentGateway?.upiPool || [];
            const activeCount = pool.filter((u) => u.isActive !== false).length;
            const totalHits = pool.reduce((acc, curr) => acc + (curr.usedCount || 0), 0);
            const totalCollected = pool.reduce((acc, curr) => acc + (curr.totalCollected || 0), 0);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#091326] border border-blue-900/50 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total UPIs in Pool</div>
                  <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                    <span>{pool.length}</span>
                    <span className="text-xs text-cyan-400 font-semibold font-mono">/ 100+ Max</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Multi-Bank Pool Capacity</div>
                </div>

                <div className="bg-[#091326] border border-emerald-500/30 rounded-2xl p-4">
                  <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Active In Rotation</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-1.5">
                    <span>{activeCount}</span>
                    <span className="text-xs text-slate-400 font-mono">({Math.round((activeCount / (pool.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Ready to serve users</div>
                </div>

                <div className="bg-[#091326] border border-amber-500/30 rounded-2xl p-4">
                  <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Rotation Strategy</div>
                  <div className="text-base font-black text-amber-300 mt-1 capitalize truncate">
                    {gatewayRotationStrategy === 'roundRobin'
                      ? 'Round-Robin (Cycle)'
                      : gatewayRotationStrategy === 'leastUsed'
                      ? 'Least-Used First'
                      : 'Random Rotation'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Automatic bank balancing</div>
                </div>

                <div className="bg-[#091326] border border-cyan-500/30 rounded-2xl p-4">
                  <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">Total Collected (₹)</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono">
                    ₹{totalCollected.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{totalHits} deposits processed</div>
                </div>
              </div>
            );
          })()}

          {/* Test Next UPI Result Banner */}
          {testRotatingUpiResult && (
            <div className="bg-[#071638] border border-cyan-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black">
                  🎯
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <span>NEXT SERVED UPI IN ROTATION:</span>
                    <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {testRotatingUpiResult.upiId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Payee: <strong className="text-white">{testRotatingUpiResult.payeeName}</strong> • Provider: <strong className="text-emerald-400">{testRotatingUpiResult.provider}</strong> • Active Pool: {testRotatingUpiResult.activePoolCount}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestRotatingUpiResult(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-[#0a1838]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TWO-COLUMN GRID: BULK IMPORT & GATEWAY CONFIG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: BULK IMPORT 100+ UPI IDs */}
            <div className="lg:col-span-7 bg-[#091326] border border-blue-900/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Bulk Paste 100+ UPI IDs (One-Click Import)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ek baar me 100 tak alag-alag UPI IDs paste karein. Har line me ek UPI ID dalein.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded-lg border border-cyan-500/30 font-bold">
                  Bulk 100+
                </span>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span>Paste UPI List:</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {upiBulkText.split(/[\r\n]+/).filter((x) => x.trim().length > 3).length} UPI lines detected
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder={`merchant1@okaxis, SportX Pay 1\nmerchant2@paytm, SportX Gaming\nspeedpay99@ybl\nnexusgaming@icici, Nexus Pay\nuser100@okhdfcbank\n...paste up to 100+ UPI IDs here`}
                  value={upiBulkText}
                  onChange={(e) => setUpiBulkText(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[#050a18] border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition placeholder:text-slate-600 leading-relaxed"
                />
                <div className="text-[10px] text-slate-400 leading-normal flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">💡 Format:</span>
                  <span><code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300">upi@bank</code> or <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300">upi@bank, Payee Name</code> (Newline or comma separated)</span>
                </div>
              </div>

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Default Payee Name:
                  </label>
                  <input
                    type="text"
                    value={upiDefaultName}
                    onChange={(e) => setUpiDefaultName(e.target.value)}
                    placeholder="e.g. SportX Gaming Official"
                    className="w-full px-3 py-2 rounded-xl bg-[#050a18] border border-blue-900/50 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Daily Limit per UPI (₹):
                  </label>
                  <input
                    type="number"
                    value={upiDailyLimit}
                    onChange={(e) => setUpiDailyLimit(Number(e.target.value) || 100000)}
                    placeholder="100000"
                    className="w-full px-3 py-2 rounded-xl bg-[#050a18] border border-blue-900/50 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Append vs Replace Radio */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-300 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!upiReplaceAll}
                    onChange={() => setUpiReplaceAll(false)}
                    className="text-cyan-500 focus:ring-0"
                  />
                  <span>Append to existing pool</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-amber-300">
                  <input
                    type="radio"
                    name="importMode"
                    checked={upiReplaceAll}
                    onChange={() => setUpiReplaceAll(true)}
                    className="text-amber-500 focus:ring-0"
                  />
                  <span>Replace entire pool</span>
                </label>
              </div>

              {/* Feedback Message */}
              {upiBulkMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    upiBulkMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {upiBulkMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{upiBulkMsg.text}</span>
                </div>
              )}

              {/* Submit Bulk Button */}
              <button
                type="button"
                onClick={() => handleBulkImportUpi()}
                disabled={upiBulkLoading || !upiBulkText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-105 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
              >
                {upiBulkLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing UPI Pool...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>⚡ Bulk Import 100+ UPI IDs Now</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT: GATEWAY CONFIG & SUBDOMAIN SETUP */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#091326] border border-blue-900/50 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="border-b border-blue-900/40 pb-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Rotation Engine & Subdomain Setup</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure rotation logic and optional external subdomain.
                  </p>
                </div>

                {/* Rotation Strategy Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-200">
                    UPI Rotation Mode:
                  </label>
                  <select
                    value={gatewayRotationStrategy}
                    onChange={(e: any) => setGatewayRotationStrategy(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/30 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="roundRobin">Round-Robin (Har baar agla UPI ID - 1 by 1 Cycle)</option>
                    <option value="leastUsed">Least-Used First (Sabse kam use hui UPI pehle - Load Balancing)</option>
                    <option value="random">Random Rotation (Poore pool se random selection)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {gatewayRotationStrategy === 'roundRobin' && 'Har naya user agle number ki UPI dekhega. 100 UPIs ho toh 1 se 100 tak line se cycle chalega.'}
                    {gatewayRotationStrategy === 'leastUsed' && 'Jis UPI pe sabse kam payments hui hain usse pehle pick karega taaki sabhi UPI barabar use ho.'}
                    {gatewayRotationStrategy === 'random' && 'Har deposit request pe pool se randomly koi bhi active UPI assign hogi.'}
                  </p>
                </div>

                {/* Subdomain Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-200 flex items-center justify-between">
                    <span>Subdomain / Gateway URL:</span>
                    <span className="text-[10px] text-cyan-400 font-mono">pay.yourdomain.com</span>
                  </label>
                  <input
                    type="text"
                    value={gatewaySubdomain}
                    onChange={(e) => setGatewaySubdomain(e.target.value)}
                    placeholder="https://pay.sportx.game"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050a18] border border-blue-900/50 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Hostinger ya VPS me <code className="text-cyan-300">pay.yourdomain.com</code> create karke is URL pe map kar sakte hain. Standalone gateway checkout user ko separate page me open hoga.
                  </p>
                </div>

                {/* QR Timer Seconds */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-200">
                    Payment Expiry Countdown (Seconds):
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={3600}
                    value={gatewayTimerSeconds}
                    onChange={(e) => setGatewayTimerSeconds(Number(e.target.value) || 600)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050a18] border border-blue-900/50 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400">Default: 600 seconds (10 minutes) for user to complete payment.</p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveGatewayConfig}
                  className="w-full py-2.5 rounded-xl bg-[#0e2450] hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Gateway Settings</span>
                </button>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#091326] border border-blue-900/50 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-black text-slate-200 uppercase tracking-wide">
                  Quick Pool Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingSingle(true)}
                    className="p-2.5 rounded-xl bg-[#0e214d] hover:bg-blue-900/40 border border-blue-800/40 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Single UPI</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetUpiCounts}
                    className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Counts</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add Single UPI Modal / Inline Form */}
          {isAddingSingle && (
            <div className="bg-[#081532] border border-cyan-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Add Single UPI ID to Rotation Pool</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingSingle(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSingleUpi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    UPI ID (VPA):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. speedpay@okaxis"
                    value={singleUpiId}
                    onChange={(e) => setSingleUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Payee / Account Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SpeedPay Enterprise"
                    value={singleUpiName}
                    onChange={(e) => setSingleUpiName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050a18] border border-blue-900/50 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-black text-xs hover:brightness-105 active:scale-95 transition"
                >
                  Save to Pool
                </button>
              </form>
            </div>
          )}

          {/* ACTIVE UPI POOL TABLE */}
          <div className="bg-[#091326] border border-blue-900/50 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Active UPI Rotation Pool Table</span>
                  <span className="text-[10px] bg-blue-900/60 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-blue-800">
                    {(settings?.paymentGateway?.upiPool || []).length} Total
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click the toggle to activate or pause any UPI ID instantly without deleting it.
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter UPI or Bank..."
                  value={upiSearchQuery}
                  onChange={(e) => setUpiSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#050a18] border border-blue-900/50 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table */}
            {(() => {
              const fullPool = settings?.paymentGateway?.upiPool || [];
              const filtered = fullPool.filter((item) => {
                if (!upiSearchQuery.trim()) return true;
                const q = upiSearchQuery.toLowerCase();
                return (
                  item.upiId.toLowerCase().includes(q) ||
                  (item.name || '').toLowerCase().includes(q) ||
                  (item.provider || '').toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No UPI IDs found matching your search.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-blue-900/40 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">UPI ID (VPA)</th>
                        <th className="py-2.5 px-3">Payee Name</th>
                        <th className="py-2.5 px-3">Bank / Provider</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Times Shown</th>
                        <th className="py-2.5 px-3 text-right">Collected (₹)</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-900/20 font-mono text-[11px]">
                      {filtered.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className={`hover:bg-[#0c1a3b]/50 transition ${
                            !item.isActive ? 'opacity-40 bg-black/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-cyan-300 flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]">{item.upiId}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator?.clipboard?.writeText(item.upiId);
                                alert(`Copied ${item.upiId}`);
                              }}
                              className="text-slate-500 hover:text-white"
                              title="Copy UPI"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="py-3 px-3 font-sans font-semibold text-white truncate max-w-[150px]">
                            {item.name || 'Merchant'}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-full bg-blue-900/40 text-slate-300 text-[10px] border border-blue-800/40">
                              {item.provider || 'UPI'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUpi(item.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition ${
                                item.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-200">
                            {item.usedCount || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ₹{(item.totalCollected || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteUpi(item.id, item.upiId)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition ml-auto"
                              title="Delete from pool"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB: SUB-ADMINS & ROLES RBAC MANAGEMENT */}
      {activeTab === 'subadmins' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#0b1424] border border-purple-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                    Sovereign Sub-Admin & Role-Based Access Control (RBAC)
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Sub-Admin Account Generator & Granular Power Isolation
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  Super Admin yaha se kisi bhi staff ya operator ke liye custom User ID & Password bana sakta hai aur unhe strictly limited power assign kar sakta hai. 
                  (Jaise: Sirf deposit approve karna, sirf withdrawal check karna, ya sirf Aviator / Color game ka outcome decide karna).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-[#060b17] border border-purple-500/30 rounded-xl px-4 py-2 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Sub-Admins</div>
                  <div className="text-xl font-black text-purple-300 font-mono">{subadminsList.length}</div>
                </div>
                <div className="bg-[#060b17] border border-emerald-500/30 rounded-xl px-4 py-2 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Active Staff</div>
                  <div className="text-xl font-black text-emerald-300 font-mono">
                    {subadminsList.filter((s) => s.status === 'active').length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchSubadmins}
                  disabled={loadingSubadmins}
                  className="p-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl transition flex items-center justify-center"
                  title="Refresh Sub-Admin list"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSubadmins ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Create Sub-Admin Card */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Create New Sub-Admin Account</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Enter login credentials and select authority presets or customize permission checkboxes.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                ⚡ Quick Power Preset (Role Templates):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('deposit_only')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'deposit_only'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>💰 Deposit Approver Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('withdraw_only')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'withdraw_only'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>💸 Withdrawal Officer Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('game_master')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'game_master'
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>🎮 Game Master (Win/Loss Controller)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('gateway_manager')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'gateway_manager'
                      ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Payment & UPI Gateway Desk</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('support_staff')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'support_staff'
                      ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>👤 User Support & Balances</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('auditor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'auditor'
                      ? 'bg-slate-400 text-slate-950 shadow-[0_0_12px_rgba(148,163,184,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>📊 Financial Reports & Audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubFormPreset('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    subFormPreset === 'custom'
                      ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>⚙️ Custom Selection</span>
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateSubadmin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Staff Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={subFormName}
                    onChange={(e) => setSubFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060b17] border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">User ID / Login ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUB-DEP01"
                    value={subFormNodeId}
                    onChange={(e) => setSubFormNodeId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060b17] border border-slate-700 text-amber-300 text-xs font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@sportx.game"
                    value={subFormEmail}
                    onChange={(e) => setSubFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060b17] border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Login Password</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pass@12345"
                    value={subFormPassword}
                    onChange={(e) => setSubFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060b17] border border-slate-700 text-emerald-400 text-xs font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Role Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit Approval Desk / Game Outcome Controller"
                  value={subFormRoleName}
                  onChange={(e) => setSubFormRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060b17] border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Assign Specific Powers & Module Access (Checkboxes):</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Checked items will be visible in this Sub-Admin's dashboard.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Deposits */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageDeposits
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageDeposits)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageDeposits: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                        <span>Deposit Approvals (जमा स्वीकृति)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        UPI & Bank INR deposit request approve/reject karne aur deposit balance credit karne ka access.
                      </p>
                    </div>
                  </label>

                  {/* Withdrawals */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageWithdrawals
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageWithdrawals)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageWithdrawals: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                        <span>Withdrawal Approvals (निकासी स्वीकृति)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Withdrawal requests check karna, reject par balance refund karna aur Hot Wallet blockchain dispatch.
                      </p>
                    </div>
                  </label>

                  {/* Color Prediction Outcome */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageColorPrediction
                      ? 'bg-green-950/30 border-green-500/50 text-green-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageColorPrediction)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageColorPrediction: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-green-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Dices className="w-4 h-4 text-green-400" />
                        <span>Color Prediction Rigging (Win Go कंट्रोल)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Agla result kya aayega (Red/Green/Violet, 0-9), manual vs lowest payout switch karna.
                      </p>
                    </div>
                  </label>

                  {/* Dragon vs Tiger Outcome */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageDragonTiger
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageDragonTiger)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageDragonTiger: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Dragon vs Tiger Outcome (विनर कंट्रोल)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dragon, Tiger ya Tie me se agla winner kaun hoga manually set karna.
                      </p>
                    </div>
                  </label>

                  {/* Aviator Crash Control */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageAviator
                      ? 'bg-red-950/30 border-red-500/50 text-red-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageAviator)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageAviator: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-red-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-red-400" />
                        <span>Aviator Crash Control (क्रैश मल्टीप्लायर)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Plane kitne multiplier par blast hoga (e.g. 1.20x par harana ya 50x par jitana).
                      </p>
                    </div>
                  </label>

                  {/* Lottery & Lucky Draw */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageLottery
                      ? 'bg-yellow-950/30 border-yellow-500/50 text-yellow-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageLottery)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageLottery: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-yellow-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Ticket className="w-4 h-4 text-yellow-400" />
                        <span>Lottery & Lucky Draw (लॉटरी विनर)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Daily prize draw ka winning ticket number force karna aur prizes set karna.
                      </p>
                    </div>
                  </label>

                  {/* UPI Gateway Pool */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageUpiGateway
                      ? 'bg-blue-950/30 border-blue-500/50 text-blue-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageUpiGateway)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageUpiGateway: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-blue-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-cyan-400" />
                        <span>UPI Gateway & 100+ Pool (पेमेंट गेटवे)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Rotating UPI addresses pool manage karna, bulk upload aur active/pause toggle karna.
                      </p>
                    </div>
                  </label>

                  {/* User Balances */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageUsers
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageUsers)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageUsers: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>User Manager & Balances (यूजर बैलेंस)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        User directory dekhna, withdrawable & deposit balance manually add/deduct karna.
                      </p>
                    </div>
                  </label>

                  {/* Tournament */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageTournament
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageTournament)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageTournament: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>Top Bettor Tournament (टूर्नामेंट)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Daily turnover leaderboard, prize pool aur top rankers manage karna.
                      </p>
                    </div>
                  </label>

                  {/* Date-wise Reports */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canViewReports
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canViewReports)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canViewReports: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>Financial Reports & PDF (रिपोर्ट्स)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Date-wise turnover, deposits aur payouts ki summary report PDF export karna.
                      </p>
                    </div>
                  </label>

                  {/* Audit Logs */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canViewAudit
                      ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canViewAudit)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canViewAudit: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-slate-400 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Audit Trail & Activity Logs (लॉग्स)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Platform transactions history aur admin action records dekhna.
                      </p>
                    </div>
                  </label>

                  {/* System Settings */}
                  <label className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    subFormPermissions.canManageSettings
                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                      : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(subFormPermissions.canManageSettings)}
                      onChange={(e) => {
                        setSubFormPreset('custom');
                        setSubFormPermissions({ ...subFormPermissions, canManageSettings: e.target.checked });
                      }}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>System Config (सिस्टम सेटिंग्स)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Global exchange rate, minimum deposit & contact support links badalna.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {subadminMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${
                  subadminMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-300'
                }`}>
                  {subadminMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingSubadmin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSavingSubadmin ? 'Creating Sub-Admin Account...' : 'Create & Activate Sub-Admin'}</span>
              </button>
            </form>
          </div>

          {/* Sub-Admins Directory Table */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span>Existing Sub-Admins Directory</span>
                  <span className="text-xs bg-purple-900/60 text-purple-300 font-mono px-2.5 py-0.5 rounded-full border border-purple-700">
                    {subadminsList.length} Accounts
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage active powers, reset credentials, pause accounts, or test login directly.
                </p>
              </div>
            </div>

            {subadminsList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Abhi tak koi Sub-Admin nahi banaya gaya hai. Upar diye gaye form se naya Sub-Admin create karein.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold bg-[#070e1b]">
                      <th className="py-3 px-3">Sub-Admin Info</th>
                      <th className="py-3 px-3">User ID / Login</th>
                      <th className="py-3 px-3">Role Title</th>
                      <th className="py-3 px-3">Assigned Powers</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {subadminsList.map((sub) => {
                      const p = sub.adminPermissions || {};
                      const powerList: string[] = [];
                      if (p.canManageDeposits) powerList.push('Deposits');
                      if (p.canManageWithdrawals) powerList.push('Withdrawals');
                      if (p.canManageColorPrediction) powerList.push('Win Go (Color)');
                      if (p.canManageDragonTiger) powerList.push('Dragon/Tiger');
                      if (p.canManageAviator) powerList.push('Aviator Crash');
                      if (p.canManageLottery) powerList.push('Lottery');
                      if (p.canManageUpiGateway) powerList.push('UPI Gateway');
                      if (p.canManageUsers) powerList.push('User Balance');
                      if (p.canViewReports) powerList.push('PDF Reports');
                      if (p.canManageSettings) powerList.push('Settings');
                      if (p.canManageTournament) powerList.push('Tournament');

                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-xs font-mono">
                                {sub.name.charAt(0)}
                              </span>
                              <div>
                                <div>{sub.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{sub.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-amber-300">
                            {sub.nodeId}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-900/40 text-purple-300 border border-purple-700/50">
                              {sub.adminRoleName || 'Operator'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {powerList.length === 0 ? (
                                <span className="text-[10px] text-slate-500 italic">No powers assigned</span>
                              ) : (
                                powerList.map((pw, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded font-mono border border-slate-700"
                                  >
                                    {pw}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSubadminStatus(sub.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                sub.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                              }`}
                            >
                              {sub.status === 'active' ? '● Active' : '● Suspended'}
                            </button>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {onSwitchUser && (
                                <button
                                  type="button"
                                  onClick={() => onSwitchUser(sub.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold transition flex items-center gap-1"
                                  title="Test Sub-Admin isolation by logging into their limited view"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Test View</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubadmin(sub);
                                  setEditRoleName(sub.adminRoleName || '');
                                  setEditPermissions(sub.adminPermissions || {});
                                  setEditPasswordReset('');
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                                title="Edit Role & Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSubadmin(sub.id, sub.name)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                                title="Delete Sub-Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT SUB-ADMIN MODAL */}
      {editingSubadmin && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-purple-500/40 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Sub-Admin: {editingSubadmin.name} ({editingSubadmin.nodeId})
                  </h3>
                  <p className="text-xs text-slate-400">Update role permissions, title or reset login password.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubadmin(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Role Designation</label>
                  <input
                    type="text"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Reset Password (Leave blank to keep current)</label>
                  <input
                    type="text"
                    placeholder="Enter new password"
                    value={editPasswordReset}
                    onChange={(e) => setEditPasswordReset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#060b17] border border-slate-700 text-emerald-400 text-xs font-mono font-bold focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Granular Authority Toggles:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'canManageDeposits', label: '💰 Deposit Approvals', desc: 'Approve/reject UPI & Bank INR deposit receipts' },
                    { key: 'canManageWithdrawals', label: '💸 Withdrawal Approvals', desc: 'Approve/reject & Hot Wallet dispatch' },
                    { key: 'canManageColorPrediction', label: '🎮 Win Go (Color Game)', desc: 'Force next color & number, risk mode' },
                    { key: 'canManageDragonTiger', label: '⚡ Dragon vs Tiger', desc: 'Force next round winner (Dragon/Tiger/Tie)' },
                    { key: 'canManageAviator', label: '🚀 Aviator Crash Game', desc: 'Force crash multiplier, early crash' },
                    { key: 'canManageLottery', label: '🎟️ Lottery & Lucky Draw', desc: 'Forced winning tickets, prize pools' },
                    { key: 'canManageUpiGateway', label: '⚡ UPI Gateway Pool', desc: 'Manage 100+ rotating UPI pool IDs' },
                    { key: 'canManageUsers', label: '👤 User Balances', desc: 'Edit wallet balances & user directory' },
                    { key: 'canManageTournament', label: '🏆 Bettor Tournament', desc: 'Leaderboard & tournament prizes' },
                    { key: 'canViewReports', label: '📊 Financial Reports', desc: 'Date-wise turnover report & PDF' },
                    { key: 'canViewAudit', label: '📋 Audit Logs', desc: 'View system audit trails' },
                    { key: 'canManageSettings', label: '⚙️ System Config', desc: 'Global settings & rates' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                        (editPermissions as any)[item.key]
                          ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                          : 'bg-[#060b17] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean((editPermissions as any)[item.key])}
                        onChange={(e) =>
                          setEditPermissions({
                            ...editPermissions,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="mt-0.5 rounded text-purple-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-white text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSubadmin(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateSubadminPermissions}
                disabled={isSavingSubadmin}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl transition shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSubadmin ? 'Saving Changes...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingUserModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-red-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete User Permanently</h3>
                <p className="text-xs text-red-400 font-medium">This action cannot be undone!</p>
              </div>
            </div>

            <div className="bg-[#070e1b] border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">User Name:</span>
                <span className="font-bold text-white">{deletingUserModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Node ID:</span>
                <span className="font-mono text-amber-400 font-bold">{deletingUserModal.nodeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-300">{deletingUserModal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sponsor ID:</span>
                <span className="text-slate-300">{deletingUserModal.sponsorId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Balance:</span>
                <span className="text-emerald-400 font-bold">₹{deletingUserModal.balance || 0}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove <span className="text-white font-bold">{deletingUserModal.name}</span> from the matrix and user database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserModal(null)}
                disabled={isDeletingUserLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={isDeletingUserLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingUserLoading ? 'Deleting User...' : 'Yes, Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
