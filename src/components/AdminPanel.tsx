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
} from 'lucide-react';
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
} from '../types';

interface AdminPanelProps {
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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<
    'settings' | 'users' | 'deposits' | 'withdrawals' | 'boosting' | 'audit' | 'sqlite' | 'products' | 'ranks' | 'reports' | 'color_prediction' | 'dragon_tiger' | 'aviator_game'
  >('settings');

  const [colorStats, setColorStats] = useState<any>(null);
  const [aviatorStats, setAviatorStats] = useState<any>(null);
  const [dragonTigerStats, setDragonTigerStats] = useState<any>(null);

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

  const handleSetDragonTigerMode = async (mode: 'lowest_payout' | 'random' | 'manual') => {
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

  const handleSetColorPredictionMode = async (mode: 'lowest_payout' | 'random' | 'manual') => {
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
        head: [['Metric Category', 'Count / Total', 'Amount / Value ($)']],
        body: [
          ['New User Registrations (Joinings)', `${filteredJoinings.length} Users`, '-'],
          ['Package Activations & Upgrades', `${packageUpgrades.length} Packages`, `$${totalPackageRevenue.toFixed(2)}`],
          ['Approved Deposits', `${approvedDeposits.length} Approved`, `$${totalApprovedDepositsAmount.toFixed(2)}`],
          ['Withdrawal Requests (Total)', `${filteredWithdrawals.length} Requests`, `$${totalWithdrawalRequested.toFixed(2)}`],
          ['Approved Net Withdrawals Paid', `${approvedWithdrawals.length} Approved`, `$${totalNetApprovedWithdrawals.toFixed(2)}`],
          ['Pending Withdrawals', `${pendingWithdrawals.length} Pending`, '-'],
          ['Commissions Distributed (ROI/Sponsor/Level)', `${filteredTransactions.length} Payouts`, `$${(totalRoiPaid + totalSponsorPaid + totalLevelPaid).toFixed(2)}`],
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
        `$${item.packagePrice}`,
        formatYYYYMMDD(item.activatedAt),
      ]);

      if (pkgRows.length === 0) {
        pkgRows.push(['-', '-', 'No package upgrades in selected date range', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Node ID', 'User Name', 'Package Activated', 'Price ($)', 'Date']],
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
        `$${w.requestedAmount}`,
        `$${w.upgradeDeduction || 0}`,
        `$${w.netAmount || w.requestedAmount}`,
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

  const updateEditableSettings: typeof setEditableSettings = (value) => {
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

      const settingsToSave: SystemSettings = {
        ...editableSettings,
        spinWheelRewards: sanitizedRewards,
        levelIncomePercentages: sanitizedLevelIncome,
        packages: sanitizedPackages,
        spinWheelIntervalHours: typeof editableSettings.spinWheelIntervalHours === 'number'
          ? editableSettings.spinWheelIntervalHours
          : (parseInt(editableSettings.spinWheelIntervalHours as any) || 24),
        spinCreditsPerReset: typeof editableSettings.spinCreditsPerReset === 'number'
          ? editableSettings.spinCreditsPerReset
          : (parseInt(editableSettings.spinCreditsPerReset as any) || 1),
      };
      await onUpdateSettings(settingsToSave);
      setIsSettingsDirty(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDiscardSettings = () => {
    setIsSettingsDirty(false);
    setEditableSettings(settings);
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Super Admin Master Operations
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Platform Governance & Real-Time Engine Controls
            </h2>
          </div>

          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-3 py-1 rounded-full text-xs font-bold">
            Root Authority
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0b1424] border border-slate-800 p-2 rounded-2xl text-xs font-bold">
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
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'deposits'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          Deposits ({depositRequests.filter((d) => d.status === 'pending').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          Withdrawals ({withdrawalRequests.filter((w) => w.status === 'pending').length} Pending)
        </button>
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
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'products'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          TetherMart Products ({products.length})
        </button>
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
      </div>

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
                    price: 250,
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
                2-Package Plan Setup Guide ($10 Joining + $20 Upgrade):
              </span>
              <p className="text-[11px] text-slate-300">
                1. <strong>$10 Starter Package (Joining)</strong>: Price = <strong>$10</strong>, Daily ROI = <strong>1%</strong> (or 1.5%), Capping = <strong>200%</strong>. This package generates daily ROI yield, sponsor bonus, and level income.
                <br />
                2. <strong>$20 Upgrade Package (Booster/Qualifier)</strong>: Price = <strong>$20</strong>, Daily ROI = <strong>0%</strong>, Sponsor Bonus = <strong>0%</strong>, Capping = <strong>0%</strong>. Mark this package as <em>Upgrade Package</em>. It qualifies the account and unlocks payouts without generating direct sponsor bonus.
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
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Price ($ USDT)</label>
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
                    setEditableSettings({
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
                      setEditableSettings({
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
                      setEditableSettings({
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
                  Required Self Package ($)
                </label>
                <p className="text-[10px] text-slate-500">
                  Minimum package price Sponsor must hold to qualify
                </p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    value={editableSettings.specialSponsorBonus?.requiredSelfPackagePrice ?? 10}
                    onChange={(e) => {
                      const current = editableSettings.specialSponsorBonus || {
                        enabled: true,
                        targetLevel: 7,
                        matchingPercent: 100,
                        requiredSelfPackagePrice: 10,
                        requiredDirectsCount: 2,
                      };
                      setEditableSettings({
                        ...editableSettings,
                        specialSponsorBonus: {
                          ...current,
                          requiredSelfPackagePrice: parseFloat(e.target.value) || 0,
                        },
                      });
                    }}
                    className="w-full bg-[#0d1726] border border-cyan-500/40 rounded-lg p-2 text-cyan-300 font-extrabold"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-bold">$ USDT</span>
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
                      setEditableSettings({
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
          <div className="bg-[#0b1424] border border-purple-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Disc className="w-4 h-4 text-purple-400" />
                  Daily Lucky Spin Wheel Rewards & Probability Controller
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Customize wheel reward slices, dollar payouts, winning probability weights (%), and slice colors for members spinning the daily wheel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const default8: SpinReward[] = [
                      { id: 'sp-1', label: '$0.50 USDT', amount: 0.5, probability: 25, color: '#10b981' },
                      { id: 'sp-2', label: '$1.00 USDT', amount: 1.0, probability: 15, color: '#06b6d4' },
                      { id: 'sp-3', label: '$2.50 USDT', amount: 2.5, probability: 10, color: '#3b82f6' },
                      { id: 'sp-4', label: '$5.00 USDT', amount: 5.0, probability: 5, color: '#8b5cf6' },
                      { id: 'sp-5', label: '$10.00 USDT', amount: 10.0, probability: 2, color: '#ec4899' },
                      { id: 'sp-6', label: '$50.00 USDT', amount: 50.0, probability: 0.5, color: '#f59e0b' },
                      { id: 'sp-7', label: 'Try Again', amount: 0, probability: 8, color: '#374151' },
                      { id: 'sp-8', label: 'Extra Spin', amount: 0, probability: 5, color: '#6366f1' },
                    ];
                    setEditableSettings({ ...editableSettings, spinWheelRewards: default8 });
                    setIsSettingsDirty(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Reset Default 8 Slices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const currentRewards = editableSettings.spinWheelRewards || [];
                    const newReward: SpinReward = {
                      id: `sp-${Date.now()}`,
                      label: '$5.00 USDT',
                      amount: 5,
                      probability: 5,
                      color: '#10b981',
                    };
                    setEditableSettings({
                      ...editableSettings,
                      spinWheelRewards: [...currentRewards, newReward],
                    });
                    setIsSettingsDirty(true);
                  }}
                  className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Wheel Slice
                </button>
              </div>
            </div>

            {/* Spin Wheel Interval & Free Spin Credits Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#050911] border border-slate-800 rounded-2xl p-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Free Spin Cooldown Interval (Hours)
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
                  Time gap before a user gets free spin recharge (e.g. 24 = Once every 24 Hours).
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Free Spins Granted Per Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editableSettings.spinCreditsPerReset !== undefined ? editableSettings.spinCreditsPerReset : 1}
                    onChange={(e) => {
                      setEditableSettings({
                        ...editableSettings,
                        spinCreditsPerReset: parseInt(e.target.value) || 1,
                      });
                      setIsSettingsDirty(true);
                    }}
                    className="w-full bg-[#0d1726] border border-purple-500/30 rounded-xl px-3 py-2 text-purple-300 font-extrabold text-xs focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-xs text-slate-400 shrink-0">Spins</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Number of free spins automatically awarded every interval cycle.
                </span>
              </div>
            </div>

            {/* Total Probability Summary Bar */}
            {(() => {
              const list = editableSettings.spinWheelRewards || [];
              const totalProb = list.reduce((sum, r) => sum + (r.probability || 0), 0);
              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#050911] border border-slate-800 px-4 py-2.5 rounded-xl text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 font-bold">Total Wheel Slices:</span>
                    <span className="text-purple-400 font-extrabold">{list.length} Slices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Cumulative Probability Weight:</span>
                    <span
                      className={`font-mono font-extrabold px-2.5 py-0.5 rounded-md ${
                        Math.abs(totalProb - 100) < 0.1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {totalProb.toFixed(1)}% {Math.abs(totalProb - 100) < 0.1 ? '✓ Balanced' : '(Weighted Relative)'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Slice Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {(editableSettings.spinWheelRewards || []).map((reward, idx) => (
                <div
                  key={reward.id || idx}
                  className="bg-[#050911] border border-slate-800 hover:border-purple-500/40 rounded-xl p-3.5 space-y-3 relative group transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-white/20 shrink-0 shadow-sm"
                        style={{ backgroundColor: reward.color || '#10b981' }}
                      />
                      <span className="text-[11px] font-extrabold text-purple-300 uppercase">
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
                      className="text-slate-600 hover:text-red-400 transition"
                      title="Delete Slice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-[11px]">
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
                        className="w-full bg-[#0d1726] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-purple-400"
                        placeholder="e.g. $5.00 USDT or Try Again"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[9px] text-emerald-400 uppercase font-bold block mb-1 truncate" title="Prize Amount ($ USDT)">
                          Amount ($)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={reward.amount === undefined || reward.amount === null ? '' : reward.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], amount: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-emerald-500/30 rounded-lg px-1.5 py-1.5 text-emerald-300 font-extrabold focus:outline-none focus:border-emerald-400 text-xs"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-amber-400 uppercase font-bold block mb-1 truncate" title="Chance / Weight (%)">
                          Chance (%)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={reward.probability === undefined || reward.probability === null ? '' : reward.probability}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], probability: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-amber-500/30 rounded-lg px-1.5 py-1.5 text-amber-300 font-extrabold focus:outline-none focus:border-amber-400 text-xs"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-cyan-400 uppercase font-bold block mb-1 truncate" title="Min Level / Rank Required (0 = All Levels)">
                          Min Lvl
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={reward.minLevel === undefined || reward.minLevel === null ? '' : reward.minLevel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], minLevel: val as any };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                            setIsSettingsDirty(true);
                          }}
                          className="w-full bg-[#0d1726] border border-cyan-500/30 rounded-lg px-1.5 py-1.5 text-cyan-300 font-extrabold focus:outline-none focus:border-cyan-400 text-xs"
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
                          }}
                          className="w-8 h-8 rounded-lg border border-slate-700 bg-[#0d1726] cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={reward.color || '#10b981'}
                          onChange={(e) => {
                            const updated = [...(editableSettings.spinWheelRewards || [])];
                            updated[idx] = { ...updated[idx], color: e.target.value };
                            setEditableSettings({ ...editableSettings, spinWheelRewards: updated });
                          }}
                          className="w-full bg-[#0d1726] border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 font-mono uppercase text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                value={editableSettings.tickerText}
                onChange={(e) =>
                  setEditableSettings({ ...editableSettings, tickerText: e.target.value })
                }
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2.5 text-cyan-300 focus:outline-none text-xs"
              />
            </div>

            {/* Protocol Fees & Exchange Rate */}
            <div className="space-y-3 bg-[#0b1424] p-5 rounded-2xl border border-slate-800">
              <div className="text-amber-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Financial Rules & Reinvestment Protocol
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Withdrawal Upgrade Deduction (%):</span>
                  <input
                    type="number"
                    value={editableSettings.upgradeFundDeductionPercent}
                    onChange={(e) =>
                      setEditableSettings({
                        ...editableSettings,
                        upgradeFundDeductionPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-amber-400 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Withdrawal Fee (%):</span>
                  <input
                    type="number"
                    value={editableSettings.withdrawalFeePercent}
                    onChange={(e) =>
                      setEditableSettings({
                        ...editableSettings,
                        withdrawalFeePercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">USDT to INR Rate:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editableSettings.rates.usdtToInr}
                    onChange={(e) =>
                      setEditableSettings({
                        ...editableSettings,
                        rates: {
                          ...editableSettings.rates,
                          usdtToInr: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Admin Wallet Addresses */}
            <div className="space-y-3 bg-[#0b1424] p-5 rounded-2xl border border-slate-800">
              <div className="text-amber-400 font-bold uppercase text-[10px]">
                Admin Official Deposit Wallet Addresses
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400">BEP20 Address:</span>
                  <input
                    type="text"
                    value={editableSettings.walletAddresses.BEP20}
                    onChange={(e) =>
                      setEditableSettings({
                        ...editableSettings,
                        walletAddresses: {
                          ...editableSettings.walletAddresses,
                          BEP20: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 text-[11px] font-mono mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">TRC20 Address:</span>
                  <input
                    type="text"
                    value={editableSettings.walletAddresses.TRC20}
                    onChange={(e) =>
                      setEditableSettings({
                        ...editableSettings,
                        walletAddresses: {
                          ...editableSettings.walletAddresses,
                          TRC20: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#050911] border border-slate-700 rounded-lg p-2 text-cyan-300 text-[11px] font-mono mt-1"
                  />
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
                      <td className="p-3 font-bold text-[#0ef]">${(u.depositBalance || 0).toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-400">${u.balance.toFixed(2)}</td>
                      <td className="p-3 font-bold text-cyan-400">${u.upgradeBalance.toFixed(2)}</td>
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
                          onClick={() => openEditUserModal(u)}
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

                    {/* Wallet Address */}
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        USDT Wallet Address
                      </label>
                      <input
                        type="text"
                        value={editWallet}
                        onChange={(e) => setEditWallet(e.target.value)}
                        placeholder="0x..."
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
                            {pkg.name} (${pkg.price} USDT)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Deposit Wallet Balance ($) */}
                    <div>
                      <label className="text-xs text-[#0ef] font-bold block mb-1">
                        Deposit Wallet Balance ($ USDT) [Package Fund]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editDepositBalNum}
                        onChange={(e) => setEditDepositBalNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#050911] border border-[#0ef]/40 rounded-xl px-3 py-2 text-[#0ef] font-bold text-xs focus:outline-none focus:border-[#0ef]"
                      />
                    </div>

                    {/* Withdrawable Balance ($) */}
                    <div>
                      <label className="text-xs text-emerald-400 font-bold block mb-1">
                        Withdrawable Balance ($ USDT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editBalNum}
                        onChange={(e) => setEditBalNum(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Upgrade Balance ($) */}
                    <div>
                      <label className="text-xs text-cyan-400 font-bold block mb-1">
                        Upgrade Fund Balance ($ USDT)
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
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            Pending Deposit Verification Queue
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Network</th>
                  <th className="p-3">TXID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {depositRequests.map((dep) => (
                  <tr key={dep.id}>
                    <td className="p-3 font-bold text-white">#{dep.userNodeId} ({dep.userName})</td>
                    <td className="p-3 font-bold text-emerald-400">${dep.amount} USDT</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PENDING WITHDRAWALS APPROVAL */}
      {activeTab === 'withdrawals' && (
        <div className="bg-[#0b1424] border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            Pending Withdrawal Queue
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Req ($)</th>
                  <th className="p-3">20% Reinvest</th>
                  <th className="p-3">Net ($)</th>
                  <th className="p-3">Target Address</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {withdrawalRequests.map((wd) => (
                  <tr key={wd.id}>
                    <td className="p-3 font-bold text-white">#{wd.userNodeId} ({wd.userName})</td>
                    <td className="p-3 font-bold">${wd.requestedAmount}</td>
                    <td className="p-3 text-amber-400">${wd.upgradeDeduction.toFixed(2)}</td>
                    <td className="p-3 font-bold text-emerald-400">${wd.netAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 bg-[#050911] border border-slate-800 px-2.5 py-1.5 rounded-lg max-w-[260px]">
                        <span className="text-cyan-300 font-mono text-[11px] truncate flex-1" title={wd.targetAddress}>
                          {wd.targetAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`wd-${wd.id}`, wd.targetAddress)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1.5 text-[10px] font-bold shrink-0 transition"
                          title="Click to Copy User Wallet Address"
                        >
                          {copiedId === `wd-${wd.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      {wd.status === 'pending' && (
                        <>
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
                Force Winner Payout ($50)
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
                  <th className="p-3">Amount ($)</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 font-bold text-cyan-300">#{tx.userNodeId}</td>
                    <td className="p-3 font-bold capitalize">{tx.type}</td>
                    <td className="p-3 font-bold text-emerald-400">${tx.amount.toFixed(2)}</td>
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
          {/* Header Bar with Add Product Action */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>TetherMart Product & Rate Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                List new items, set rates in USDT, adjust available stock, or manage customer orders.
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
                  <label className="text-slate-400 font-bold block mb-1">Price (USDT $)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="100"
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
                    <th className="p-3">Rate (USDT)</th>
                    <th className="p-3">Rate (INR)</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Badge</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {products.map((prod) => {
                    const inrVal = prod.priceInr || prod.priceUsdt * (settings.rates.usdtToInr || 90);

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
                          ${prod.priceUsdt} USDT
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
                      <label className="text-slate-300 font-bold block mb-1">Price (USDT $)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-amber-500 text-sm"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        ≈ ₹{(Number(editPrice || 0) * (settings.rates.usdtToInr || 90)).toLocaleString('en-IN')} INR
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
                        Mark as "TetherMart Choice / Featured Product"
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
                        <td className="p-3 font-bold text-emerald-400">{ord.quantity}x (${ord.totalUsdt} USDT)</td>
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
                  setNewRankBonusUsdt('100');
                  setNewRankMinSelfPkg('50');
                  setNewRankReqDirects('5');
                  setNewRankReqSamePkg('5');
                  setNewRankUpToLevel('3');
                  setNewRankReqVolume('1000');
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
                    placeholder="e.g. iPhone 15 Pro, Dubai Trip"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-emerald-400 font-bold block mb-1">Reward USDT Bonus ($)</label>
                  <input
                    type="number"
                    value={newRankBonusUsdt}
                    onChange={(e) => setNewRankBonusUsdt(e.target.value)}
                    placeholder="100"
                    className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-cyan-300 font-bold block mb-1">Self Active Package ($)</label>
                  <input
                    type="number"
                    value={newRankMinSelfPkg}
                    onChange={(e) => setNewRankMinSelfPkg(e.target.value)}
                    placeholder="50"
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
                  <label className="text-slate-300 font-bold block mb-1">Team Volume Req. ($)</label>
                  <input
                    type="number"
                    value={newRankReqVolume}
                    onChange={(e) => setNewRankReqVolume(e.target.value)}
                    placeholder="1000"
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
                      rewardTitle: newRankRewardTitle.trim() || `$${newRankBonusUsdt} Cash Reward`,
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
                    <label className="text-emerald-400 font-bold block mb-1">Reward USDT Bonus ($)</label>
                    <input
                      type="number"
                      value={editRankBonusUsdtVal}
                      onChange={(e) => setEditRankBonusUsdtVal(e.target.value)}
                      className="w-full bg-[#050911] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-cyan-300 font-bold block mb-1">Self Active Package ($)</label>
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
                    <label className="text-slate-300 font-bold block mb-1">Team Volume Req. ($)</label>
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
                              rewardTitle: editRankRewardTitleVal.trim() || `$${editRankBonusUsdtVal} Cash Reward`,
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
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Cash USDT</div>
                          <div className="text-sm font-extrabold text-emerald-400">${rank.bonusUsdt}</div>
                        </div>
                      </div>

                      {/* Conditions Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-[#070e1b] border border-slate-800/80 p-2.5 rounded-xl space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase block">Self Package</span>
                          <span className="font-extrabold text-cyan-300">${rank.minSelfPackagePrice || 0}+</span>
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
                          <span className="font-bold text-amber-300">${rank.requiredVolume.toLocaleString()}</span>
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
              <div className="text-2xl font-extrabold text-emerald-400">${totalPackageRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">{packageUpgrades.length} packages activated</div>
            </div>

            {/* Stat 3: Withdrawals */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Withdrawals</span>
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-300">${totalNetApprovedWithdrawals.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">{approvedWithdrawals.length} Approved ({pendingWithdrawals.length} Pending)</div>
            </div>

            {/* Stat 4: Approved Deposits */}
            <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Deposits</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300">${totalApprovedDepositsAmount.toLocaleString()}</div>
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
                          <td className="p-3 text-emerald-400 font-extrabold">${item.packagePrice}</td>
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
                          <td className="p-3 text-white font-bold">${w.requestedAmount}</td>
                          <td className="p-3 text-slate-400">${w.upgradeDeduction || 0}</td>
                          <td className="p-3 text-cyan-300 font-extrabold">${w.netAmount || w.requestedAmount}</td>
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
                      <th className="p-3">Network</th>
                      <th className="p-3">Tx Hash</th>
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
                          <td className="p-3 text-emerald-400 font-extrabold">${d.amount}</td>
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
              <div className="text-2xl font-black text-cyan-300">${colorStats?.totalStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">{colorStats?.betsCount || 0} active bets placed</div>
            </div>

            <div className="bg-[#070d18] border border-emerald-500/30 p-4 rounded-xl space-y-1">
              <div className="text-emerald-400 font-bold font-sans">Green Stakes (2x)</div>
              <div className="text-xl font-bold text-white">${colorStats?.greenStakes?.toFixed(2) || '0.00'}</div>
            </div>

            <div className="bg-[#070d18] border border-rose-500/30 p-4 rounded-xl space-y-1">
              <div className="text-rose-400 font-bold font-sans">Red Stakes (2x)</div>
              <div className="text-xl font-bold text-white">${colorStats?.redStakes?.toFixed(2) || '0.00'}</div>
            </div>

            <div className="bg-[#070d18] border border-purple-500/30 p-4 rounded-xl space-y-1">
              <div className="text-purple-400 font-bold font-sans">Violet Stakes (4.5x)</div>
              <div className="text-xl font-bold text-white">${colorStats?.violetStakes?.toFixed(2) || '0.00'}</div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Automatic Lowest Payout */}
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
                    Automatic Mode (Lowest Bet Wins)
                  </div>
                  {colorStats?.adminMode === 'lowest_payout' && (
                    <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs font-sans leading-relaxed text-slate-300">
                  System checks all active bets at round expiry and automatically selects the number (0-9) that results in the <b>LOWEST total payout</b> (Max System Profit).
                </p>
              </button>

              {/* Option 2: Standard Random */}
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
                  Standard 100% random mathematical draw between numbers 0 and 9 regardless of bet amounts.
                </p>
              </button>

              {/* Option 3: Manual Override */}
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
                    Manual Forced Result Mode
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
              <div className="bg-[#0b1426] border border-emerald-500/30 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    #{colorStats.projectedLowestNumber}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-300">
                      Auto-System Predicted Winner for Live Round: Number #{colorStats.projectedLowestNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Estimated System Payout Liability: <span className="text-white font-bold">${colorStats.projectedLowestPayout?.toFixed(2)}</span>
                      {' '}(Retains ${((colorStats.totalStakes || 0) - (colorStats.projectedLowestPayout || 0)).toFixed(2)} system profit)
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {colorStats.adminMode === 'lowest_payout' ? (
                    <span className="text-emerald-400 font-bold">🤖 Auto Mode will declare #{colorStats.projectedLowestNumber} when round ends</span>
                  ) : (
                    <span className="text-amber-400">Switch to Automatic Mode above to enable this auto-profit selection</span>
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
                Set house profit risk algorithms or manually force Dragon (2X), Tiger (2X), or Tie (8X) as the next winning outcome.
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
              <div className="text-2xl font-black text-amber-400">${dragonTigerStats?.totalStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">{dragonTigerStats?.recentBetsCount || 0} bets placed</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">🐉 Dragon Stakes</div>
              <div className="text-2xl font-black text-rose-400">${dragonTigerStats?.dragonStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">2.0X Payout Rate</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">🐅 Tiger Stakes</div>
              <div className="text-2xl font-black text-amber-400">${dragonTigerStats?.tigerStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">2.0X Payout Rate</div>
            </div>
            <div className="bg-[#070d18] border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400">👔 Tie Stakes</div>
              <div className="text-2xl font-black text-emerald-400">${dragonTigerStats?.tieStakes?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-slate-500">8.0X Mega Payout</div>
            </div>
          </div>

          {/* Risk Mode Selector */}
          <div className="bg-[#070d18] border border-amber-500/30 p-5 rounded-2xl space-y-4">
            <div className="text-sm font-bold text-amber-300">Select Platform Risk Algorithm</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('lowest_payout')}
                className={`p-4 rounded-xl text-left border transition ${
                  dragonTigerStats?.adminMode === 'lowest_payout'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Automatic House Profit (Lowest Payout)
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Engine automatically calculates bets and picks the winning side that minimizes house payout loss.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('random')}
                className={`p-4 rounded-xl text-left border transition ${
                  dragonTigerStats?.adminMode === 'random'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Standard Fair RNG (50/50 Random)
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  100% unbiased random cards distribution (45% Dragon, 45% Tiger, 10% Tie).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSetDragonTigerMode('manual')}
                className={`p-4 rounded-xl text-left border transition ${
                  dragonTigerStats?.adminMode === 'manual'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Manual Forced Winner Mode
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Admin forces a specific winner (Dragon, Tiger, or Tie) for the next card deal.
                </p>
              </button>
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
                onClick={() => handleForceDragonTigerResult(null)}
                className="py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <span>🔄 Reset / Clear Force</span>
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
              <div className="text-2xl font-black text-rose-400">${aviatorStats?.totalStakes?.toFixed(2) || '0.00'}</div>
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

      {/* Delete User Confirmation Modal */}
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
                <span className="text-emerald-400 font-bold">${deletingUserModal.balance || 0}</span>
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
