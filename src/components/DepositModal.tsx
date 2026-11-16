import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  X,
  Copy,
  Check,
  RotateCw,
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowDownLeft,
  QrCode,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { SystemSettings, User, DepositRequest } from '../types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSubmitDeposit: (amount: number, network: string, txHash: string) => Promise<void>;
  user?: User | null;
  depositRequests?: DepositRequest[];
  onRefreshUser?: () => Promise<void>;
  onOpenGateway?: (amount: number) => void;
}

// Custom crisp SVG icons matching reference image
const UpiLogo = () => (
  <svg viewBox="0 0 100 40" className="w-12 h-5">
    <path d="M12 8 L24 8 L20 28 L8 28 Z" fill="#00b074" />
    <path d="M26 8 L32 8 L26 28 L20 28 Z" fill="#f37021" />
    <path d="M38 8 L44 8 L40 28 L34 28 Z" fill="#00b074" />
    <text x="48" y="24" fontSize="18" fontWeight="900" fill="currentColor" fontFamily="sans-serif">
      UPI
    </text>
  </svg>
);

const QrMiniIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7">
    <rect x="4" y="4" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <rect x="7" y="7" width="6" height="6" fill="currentColor" />
    <rect x="24" y="4" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <rect x="27" y="7" width="6" height="6" fill="currentColor" />
    <rect x="4" y="24" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <rect x="7" y="27" width="6" height="6" fill="currentColor" />
    <rect x="20" y="20" width="4" height="4" fill="currentColor" />
    <rect x="28" y="20" width="4" height="4" fill="currentColor" />
    <rect x="20" y="28" width="4" height="4" fill="currentColor" />
    <rect x="28" y="28" width="8" height="8" rx="1" fill="currentColor" />
  </svg>
);

const PaytmLogo = () => (
  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
    <span className="text-[9px] font-black tracking-tighter text-[#002e6e] leading-none">
      Pay<span className="text-[#00baf2]">tm</span>
    </span>
  </div>
);

const UsdtLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#26a17b] flex items-center justify-center text-white font-black text-sm shadow-sm">
    ₮
  </div>
);

const WalletArLogo = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white font-black text-sm shadow-sm border border-cyan-300/40">
    <span className="italic font-serif font-black">R</span>
  </div>
);

const ArPayLogo = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <div className="w-7 h-7 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-7 h-7 fill-amber-400">
        <path d="M 20 4 L 36 34 L 28 34 L 20 18 L 12 34 L 4 34 Z" />
      </svg>
    </div>
    {/* +2% red gift badge */}
    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-black rounded-md shadow-sm border border-red-300/40">
      +2%
    </span>
  </div>
);

const EmvChip = () => (
  <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-[#a7f3d0] via-[#5eead4] to-[#2dd4bf] border border-[#14b8a6]/70 p-0.5 flex flex-col justify-between shadow-sm">
    <div className="flex justify-between items-center h-full w-full">
      <div className="w-2.5 h-full border-r border-[#0f766e]/40 flex flex-col justify-around">
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
      </div>
      <div className="w-2 h-2 rounded-full border border-[#0f766e]/50" />
      <div className="w-2.5 h-full border-l border-[#0f766e]/40 flex flex-col justify-around">
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
      </div>
    </div>
  </div>
);

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSubmitDeposit,
  user,
  depositRequests = [],
  onRefreshUser,
  onOpenGateway,
}) => {
  // Navigation / sub-views
  const [currentView, setCurrentView] = useState<'main' | 'qrPayment' | 'history'>('main');

  // Selected payment method & channel (100% Pure INR)
  const [selectedMethod, setSelectedMethod] = useState<'upiQr' | 'innateUpi' | 'expertUpi' | 'paytm' | 'wallet' | 'arPay'>('upiQr');
  const [selectedChannel, setSelectedChannel] = useState<'Phonepe_QR' | 'Paytm_QR' | 'GPay_QR' | 'Bhim_UPI'>('Phonepe_QR');

  // Amount
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');

  // Dynamic Rotating UPI State
  const [activeUpi, setActiveUpi] = useState<{
    upiId: string;
    payeeName: string;
    provider?: string;
    sessionTxnId?: string;
    activePoolCount?: number;
  }>({
    upiId: settings?.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
    payeeName: settings?.paymentGateway?.defaultPayeeName || 'SportX Gaming Official',
    provider: 'Axis Bank',
    sessionTxnId: `ORD-${Date.now()}`,
    activePoolCount: 1,
  });
  const [loadingUpi, setLoadingUpi] = useState<boolean>(false);

  // Payment processing state
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(settings?.paymentGateway?.qrTimerSeconds || 599); // 10 minutes

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentView('main');
      setUtrNumber('');
      setSubmitting(false);
      setCountdownSeconds(settings?.paymentGateway?.qrTimerSeconds || 599);
    }
  }, [isOpen]);

  // QR countdown ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentView === 'qrPayment' && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentView, countdownSeconds]);

  if (!isOpen) return null;

  // Real user balance natively in INR
  const totalBalance = (user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0);
  const inrBalance = totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Fetch dynamic rotating UPI from gateway pool
  const fetchRotatingUpi = async () => {
    setLoadingUpi(true);
    try {
      const res = await fetch('/api/payment/active-upi');
      if (res.ok) {
        const data = await res.json();
        if (data.upiId) {
          setActiveUpi({
            upiId: data.upiId,
            payeeName: data.payeeName || 'SportX Gaming Official',
            provider: data.provider || 'UPI Bank',
            sessionTxnId: data.sessionTxnId || `ORD-${Date.now()}`,
            activePoolCount: data.activePoolCount || 1,
          });
          if (data.qrTimerSeconds) {
            setCountdownSeconds(data.qrTimerSeconds);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch rotating UPI:', err);
    } finally {
      setLoadingUpi(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshUser) {
        await onRefreshUser();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 1800);
  };

  const handleSelectAmount = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedAmount(parsed);
    }
  };

  const handleProceedToPayment = () => {
    setCurrentView('qrPayment');
    setCountdownSeconds(settings?.paymentGateway?.qrTimerSeconds || 599);
    fetchRotatingUpi();
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) return;

    setSubmitting(true);
    try {
      // Submit pure 1:1 INR deposit amount directly to system ledger
      const methodLabel = `${selectedMethod.toUpperCase()} (${selectedChannel}) [${activeUpi.upiId}]`;

      await onSubmitDeposit(selectedAmount, methodLabel, utrNumber.trim());
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [200, 500, 1000, 2000, 5000, 10000, 50000];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center font-sans animate-fade-in p-0 sm:p-4">
      {/* Centered Toast: "Copy successful" */}
      {showCopyToast && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4">
          <div className="bg-[#050914]/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-7 py-5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col items-center gap-2 text-white animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="text-xs font-bold text-center leading-tight">
              Copy<br />successful
            </div>
          </div>
        </div>
      )}

      {/* Centered Success Toast */}
      {successToast && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center p-4">
          <div className="bg-[#041a15]/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl px-8 py-6 shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex flex-col items-center gap-2 text-white animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-sm font-black text-center text-emerald-300">
              Deposit Submitted!
            </div>
            <div className="text-xs text-slate-300 text-center max-w-xs">
              Your deposit request for ₹{selectedAmount.toLocaleString('en-IN')} has been submitted for instant verification.
            </div>
          </div>
        </div>
      )}

      {/* Main Container - Smartphone frame style matching reference */}
      <div className="w-full max-w-md bg-[#050a18] border border-blue-900/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* 1. TOP HEADER (Back button, Deposit title, Deposit history link) */}
        <header className="flex items-center justify-between px-4 py-3.5 border-b border-blue-950/60 bg-[#060e22] shrink-0">
          <button
            onClick={() => {
              if (currentView !== 'main') {
                setCurrentView('main');
              } else {
                onClose();
              }
            }}
            className="p-1 -ml-1 text-slate-300 hover:text-white transition active:scale-90"
            title="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
            {currentView === 'history' ? 'Deposit History' : currentView === 'qrPayment' ? 'Complete Deposit' : 'Deposit'}
          </h2>

          {currentView === 'main' ? (
            <button
              onClick={() => setCurrentView('history')}
              className="text-xs font-semibold text-[#8ea2cb] hover:text-cyan-300 transition"
            >
              Deposit history
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* 2. SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {/* VIEW A: MAIN DEPOSIT SELECTION (Matches Reference Image Exactly) */}
          {currentView === 'main' && (
            <>
              {/* ATM DEBIT CARD STYLE BALANCE CARD */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#2dd4bf] via-[#14b8a6] to-[#06b6d4] shadow-[0_8px_25px_rgba(20,184,166,0.3)] text-[#06332c]">
                {/* Subtle curved background overlay */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
                    <path d="M 0 100 Q 150 40 400 120 L 400 200 L 0 200 Z" fill="#ffffff" />
                  </svg>
                </div>

                {/* Card Top: Balance header */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💼</span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#06332c] tracking-wide">
                      Balance
                    </span>
                  </div>
                </div>

                {/* Card Amount & Refresh button */}
                <div className="relative z-10 flex items-center gap-3 my-2 sm:my-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#042823] tracking-tight">
                    ₹{inrBalance}
                  </span>
                  <button
                    onClick={handleRefresh}
                    className="p-1 text-[#064e43] hover:text-[#042823] transition-colors active:scale-90"
                    title="Refresh Balance"
                  >
                    <RotateCw className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin text-[#042823]' : ''}`} />
                  </button>
                </div>

                {/* Card Bottom: EMV Smart Chip & Card Mask */}
                <div className="relative z-10 flex items-center justify-between pt-1">
                  <EmvChip />
                  <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-[#064e43]">
                    ****  ****
                  </span>
                </div>
              </div>

              {/* 7 PAYMENT METHOD CHANNELS GRID */}
              <div className="space-y-2">
                {/* Row 1: 4 methods */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Method 1: UPI-QR (Active/Default) */}
                  <button
                    onClick={() => {
                      setSelectedMethod('upiQr');
                      setSelectedChannel('Phonepe_QR');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'upiQr'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <div className="flex flex-col items-center">
                        <UpiLogo />
                        <QrMiniIcon />
                      </div>
                    </div>
                    <span className="text-[11px] font-black leading-tight mt-1">UPI-QR</span>
                  </button>

                  {/* Method 2: Innate UPI-QR */}
                  <button
                    onClick={() => {
                      setSelectedMethod('innateUpi');
                      setSelectedChannel('Paytm_QR');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'innateUpi'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <div className="flex flex-col items-center opacity-85">
                        <UpiLogo />
                        <QrMiniIcon />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold leading-tight mt-1 text-center">Innate UPI-QR</span>
                  </button>

                  {/* Method 3: Expert UPI-QR */}
                  <button
                    onClick={() => {
                      setSelectedMethod('expertUpi');
                      setSelectedChannel('GPay_QR');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'expertUpi'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <div className="flex flex-col items-center opacity-85">
                        <UpiLogo />
                        <QrMiniIcon />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold leading-tight mt-1 text-center">Expert UPI-QR</span>
                  </button>

                  {/* Method 4: PAYTM */}
                  <button
                    onClick={() => {
                      setSelectedMethod('paytm');
                      setSelectedChannel('Paytm_QR');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'paytm'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <PaytmLogo />
                    </div>
                    <span className="text-[11px] font-black leading-tight mt-1">PAYTM</span>
                  </button>
                </div>

                {/* Row 2: 3 methods */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Method 5: Wallet */}
                  <button
                    onClick={() => {
                      setSelectedMethod('wallet');
                      setSelectedChannel('Bhim_UPI');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'wallet'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <WalletArLogo />
                    </div>
                    <span className="text-[11px] font-black leading-tight mt-1">UPI Wallet</span>
                  </button>

                  {/* Method 6: ARPay */}
                  <button
                    onClick={() => {
                      setSelectedMethod('arPay');
                      setSelectedChannel('Phonepe_QR');
                    }}
                    className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                      selectedMethod === 'arPay'
                        ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                        : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1">
                      <ArPayLogo />
                    </div>
                    <span className="text-[11px] font-black leading-tight mt-1">ARPay</span>
                  </button>
                </div>
              </div>

              {/* SELECT CHANNEL SECTION */}
              <div className="bg-[#071533] border border-blue-900/40 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-black text-white">Select channel</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Primary Channel Pill */}
                  <button
                    onClick={() => setSelectedChannel('Phonepe_QR')}
                    className={`w-full p-2.5 rounded-xl text-left transition-all ${
                      selectedChannel === 'Phonepe_QR'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow-md'
                        : 'bg-[#0b1b42] border border-blue-900/40 text-slate-200 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="font-black text-xs sm:text-sm leading-tight">
                      Phonepe_QR
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${selectedChannel === 'Phonepe_QR' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                      Limit: ₹100 - ₹50,000
                    </div>
                  </button>

                  {/* Secondary Channel Option */}
                  <button
                    onClick={() => setSelectedChannel('Paytm_QR')}
                    className={`w-full p-2.5 rounded-xl text-left transition-all ${
                      selectedChannel === 'Paytm_QR'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow-md'
                        : 'bg-[#0b1b42] border border-blue-900/40 text-slate-200 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="font-black text-xs sm:text-sm leading-tight">
                      Paytm_QR
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${selectedChannel === 'Paytm_QR' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                      Limit: ₹100 - ₹1,00,000
                    </div>
                  </button>
                </div>
              </div>

              {/* QUICK AMOUNT SELECTION GRID */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Deposit Amount</span>
                  <span className="text-cyan-400 font-mono">Min: ₹200 • Max: ₹50,000</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.slice(0, 4).map((amt) => {
                    const isSelected = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-[#2dd4bf] text-[#042823] shadow-md shadow-teal-500/20 scale-102'
                            : 'bg-[#071638] border border-blue-900/40 text-slate-200 hover:border-cyan-500/30'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.slice(4).map((amt) => {
                    const isSelected = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-[#2dd4bf] text-[#042823] shadow-md shadow-teal-500/20 scale-102'
                            : 'bg-[#071638] border border-blue-900/40 text-slate-200 hover:border-cyan-500/30'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input Field */}
                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={100}
                    max={100000}
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter custom deposit amount"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#071533] border border-blue-900/50 text-white font-bold text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                {/* Active Deposit Bonus Tier Banner */}
                {(() => {
                  const bonusCfg = settings?.depositBonus;
                  if (!bonusCfg?.enabled) return null;
                  const eligible =
                    bonusCfg.applyTo !== 'first_deposit_only' || !user?.hasFirstDepositApproved;
                  if (!eligible) return null;
                  const activeTiers = (bonusCfg.tiers || [])
                    .filter((t) => t.enabled !== false && Number(t.bonusValue) > 0)
                    .sort((a, b) => Number(a.minAmount) - Number(b.minAmount));
                  if (activeTiers.length === 0) return null;

                  const matched = [...activeTiers]
                    .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))
                    .find((t) => selectedAmount >= Number(t.minAmount));
                  const bonusInr = matched
                    ? matched.bonusType === 'fixed'
                      ? Number(matched.bonusValue)
                      : (selectedAmount * Number(matched.bonusValue)) / 100
                    : 0;

                  return (
                    <div className="mt-2.5 bg-[#071f1d] border border-emerald-500/35 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-300">
                          🎁 Deposit Bonus Offers
                        </span>
                        {bonusInr > 0 ? (
                          <span className="font-black text-amber-300">
                            +₹{bonusInr.toFixed(0)} Extra Bonus!
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Min ₹{activeTiers[0].minAmount.toLocaleString('en-IN')} for bonus
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeTiers.map((t) => {
                          const isHit = matched?.id === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectAmount(Math.max(Number(t.minAmount) || 1000, 100))}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                                isHit
                                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                                  : 'bg-[#051211] text-slate-300 border-slate-700 hover:border-emerald-500/40'
                              }`}
                            >
                              ≥ ₹{Number(t.minAmount).toLocaleString('en-IN')}:{' '}
                              <span className="text-amber-300">
                                +{t.bonusType === 'fixed' ? `₹${t.bonusValue}` : `${t.bonusValue}%`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* VIEW B: QR PAYMENT CHECKOUT GATEWAY */}
          {currentView === 'qrPayment' && (
            <div className="space-y-4">
              {/* Payment Timer & Rotating Pool Header */}
              <div className="bg-[#0c1b3f] border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Payment Window Expires In:</span>
                </div>
                <span className="font-mono text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  {formatTimer(countdownSeconds)}
                </span>
              </div>

              {/* Dedicated Payment Gateway Banner */}
              {onOpenGateway && (
                <div className="bg-gradient-to-r from-blue-950 to-[#072445] border border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>⚡ Open Dedicated Gateway</span>
                      <span className="text-[9px] bg-cyan-400 text-black px-1.5 py-0.2 rounded font-black">PRO</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Clean full-screen checkout for subdomains & mobile
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGateway(selectedAmount);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-900 font-black text-xs transition flex items-center gap-1 shrink-0"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* QR Code Presentation Box */}
              <div className="bg-[#071533] border border-blue-900/50 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Dynamic Rotating UPI</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchRotatingUpi}
                    disabled={loadingUpi}
                    className="px-2 py-1 rounded-lg bg-[#0e214d] hover:bg-cyan-500/20 text-cyan-300 font-bold text-[11px] transition flex items-center gap-1 border border-cyan-500/30 active:scale-95 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${loadingUpi ? 'animate-spin' : ''}`} />
                    <span>Switch UPI</span>
                  </button>
                </div>

                {/* High contrast QR code container */}
                <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center relative border-4 border-[#2dd4bf]">
                  {loadingUpi ? (
                    <div className="flex flex-col items-center gap-2 text-slate-800">
                      <RotateCw className="w-6 h-6 animate-spin text-cyan-600" />
                      <span className="text-xs font-bold">Getting Fresh UPI...</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=${activeUpi.upiId}&pn=${encodeURIComponent(
                            activeUpi.payeeName
                          )}&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(
                            `Order ${activeUpi.sessionTxnId || 'SportX'}`
                          )}`
                        )}`}
                        alt="UPI Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center p-1 border border-slate-200">
                          <span className="text-[10px] font-black text-[#002e6e]">UPI</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-xl font-black text-white">
                  ₹{selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>

                {/* Rotating Allocated UPI ID with Copy Button */}
                <div className="bg-[#0b1b42] border border-blue-900/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <span>Allocated UPI ID:</span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">
                        {activeUpi.provider || 'Bank'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-cyan-300 truncate">{activeUpi.upiId}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Payee: <span className="text-white font-semibold">{activeUpi.payeeName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeUpi.upiId)}
                    className="px-3 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-cyan-300 active:scale-95 text-[#042823] font-black text-xs transition flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>

                {/* 1-Tap App Shortcuts on Mobile */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <a
                    href={`phonepe://pay?pa=${encodeURIComponent(activeUpi.upiId)}&pn=${encodeURIComponent(
                      activeUpi.payeeName
                    )}&am=${selectedAmount}&cu=INR`}
                    className="py-1.5 px-1 rounded-lg bg-[#0a1838] border border-blue-800/40 text-[10px] font-bold text-slate-200 hover:text-white text-center transition"
                  >
                    PhonePe
                  </a>
                  <a
                    href={`tez://upi/pay?pa=${encodeURIComponent(activeUpi.upiId)}&pn=${encodeURIComponent(
                      activeUpi.payeeName
                    )}&am=${selectedAmount}&cu=INR`}
                    className="py-1.5 px-1 rounded-lg bg-[#0a1838] border border-blue-800/40 text-[10px] font-bold text-slate-200 hover:text-white text-center transition"
                  >
                    GPay
                  </a>
                  <a
                    href={`paytmmp://pay?pa=${encodeURIComponent(activeUpi.upiId)}&pn=${encodeURIComponent(
                      activeUpi.payeeName
                    )}&am=${selectedAmount}&cu=INR`}
                    className="py-1.5 px-1 rounded-lg bg-[#0a1838] border border-blue-800/40 text-[10px] font-bold text-slate-200 hover:text-white text-center transition"
                  >
                    Paytm
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(activeUpi.upiId)}&pn=${encodeURIComponent(
                      activeUpi.payeeName
                    )}&am=${selectedAmount}&cu=INR`}
                    className="py-1.5 px-1 rounded-lg bg-[#0a1838] border border-blue-800/40 text-[10px] font-bold text-slate-200 hover:text-white text-center transition"
                  >
                    BHIM
                  </a>
                </div>
              </div>

              {/* 12-Digit UTR Input Form */}
              <form onSubmit={handleSubmitDeposit} className="space-y-3 bg-[#071533] border border-blue-900/50 rounded-2xl p-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-200 flex items-center justify-between">
                    <span>Enter 12-digit UTR / Ref No.</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Mandatory for auto-approval</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 410293847592 or TXID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
                    Find this 12-digit number in your PhonePe / GPay / Paytm payment receipt under "UPI Ref No" or "UTR".
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || utrNumber.trim().length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 active:scale-95 disabled:opacity-50 text-[#052723] font-black text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit 12-Digit UTR</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW C: DEPOSIT HISTORY */}
          {currentView === 'history' && (
            <div className="space-y-3">
              {depositRequests && depositRequests.length > 0 ? (
                depositRequests.map((dep, idx) => (
                  <div
                    key={dep.id || idx}
                    className="bg-[#071533] border border-blue-900/40 rounded-2xl p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                          ↓
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">
                            ₹{Number(dep.inrAmount || dep.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            100% Pure INR • {dep.network || 'UPI-QR'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          dep.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : dep.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-blue-950/60 font-mono">
                      <span>UTR: {dep.txHash ? `${dep.txHash.slice(0, 10)}...` : 'Pending'}</span>
                      <span>{new Date(dep.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 border border-blue-800/40 flex items-center justify-center mx-auto text-slate-500">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">No deposit records yet</p>
                  <p className="text-[11px] text-slate-500">Your deposit history will appear here once submitted.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. BOTTOM FLOATING ACTION BAR (Exact Match to Reference Image) */}
        {currentView === 'main' && (
          <div className="p-3.5 sm:p-4 bg-[#060e22] border-t border-blue-950/80 flex items-center justify-between shrink-0">
            {/* Left: Recharge Method text */}
            <div className="flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 font-medium">Recharge Method:</span>
              <span className="text-sm font-black text-white tracking-wide">
                {selectedMethod === 'paytm'
                  ? 'PAYTM'
                  : selectedMethod === 'wallet'
                  ? 'UPI Wallet'
                  : selectedMethod === 'arPay'
                  ? 'ARPay'
                  : 'UPI-QR'}
              </span>
            </div>

            {/* Right: Big Teal CTA Button */}
            <button
              onClick={handleProceedToPayment}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 active:scale-95 text-[#052723] font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-teal-500/25 transition-all"
            >
              Deposit ₹{selectedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
