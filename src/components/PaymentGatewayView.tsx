import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  RotateCw,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  CreditCard,
  Lock,
  Building2,
} from 'lucide-react';
import { SystemSettings, User, BankAccountConfig } from '../types';

interface PaymentGatewayViewProps {
  initialAmount?: number;
  user?: User | null;
  settings?: SystemSettings | null;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const PaymentGatewayView: React.FC<PaymentGatewayViewProps> = ({
  initialAmount = 500,
  user,
  settings,
  onBack,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [activeUpi, setActiveUpi] = useState<{
    upiId: string;
    payeeName: string;
    provider?: string;
    sessionTxnId: string;
    activePoolCount?: number;
    rotationStrategy?: string;
  }>({
    upiId: settings?.paymentGateway?.defaultUpiId || 'sportxpay@okaxis',
    payeeName: settings?.paymentGateway?.defaultPayeeName || 'SportX Gaming Official',
    provider: 'Axis Bank',
    sessionTxnId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    activePoolCount: 1,
  });

  const [loadingUpi, setLoadingUpi] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    settings?.paymentGateway?.qrTimerSeconds || 600
  );
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'bank'>('upi');
  const [liveBankAccount, setLiveBankAccount] = useState<BankAccountConfig | null>(
    settings?.paymentGateway?.bankAccount || null
  );

  // Fetch rotating UPI on mount or refresh
  const fetchRotatingUpi = async () => {
    setLoadingUpi(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/payment/active-upi');
      if (res.ok) {
        const data = await res.json();
        if (data.upiId) {
          setActiveUpi({
            upiId: data.upiId,
            payeeName: data.payeeName || 'SportX Gaming Official',
            provider: data.provider || 'UPI Payment',
            sessionTxnId: data.sessionTxnId || `ORD-${Date.now().toString(36).toUpperCase()}`,
            activePoolCount: data.activePoolCount,
            rotationStrategy: data.rotationStrategy,
          });
          if (data.qrTimerSeconds) {
            setCountdownSeconds(data.qrTimerSeconds);
          }
          if (data.bankAccount) {
            setLiveBankAccount(data.bankAccount);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch rotating UPI:', err);
    } finally {
      setLoadingUpi(false);
    }
  };

  useEffect(() => {
    fetchRotatingUpi();
  }, []);

  // 10-minute timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(
    activeUpi.upiId
  )}&pn=${encodeURIComponent(activeUpi.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
    `Order ${activeUpi.sessionTxnId}`
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=1&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const activeBank = liveBankAccount || settings?.paymentGateway?.bankAccount;
  const hasBankTransfer = Boolean(activeBank?.enabled && activeBank?.accountNumber?.trim());

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (cleanUtr.length < 6) {
      setErrorMessage('Please enter a valid 12-digit UTR or Transaction Reference number');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || localStorage.getItem('tp_user_id') || '',
        },
        body: JSON.stringify({
          amount,
          inrAmount: amount,
          network:
            paymentMode === 'bank' && hasBankTransfer && activeBank
              ? `Bank Transfer (${activeBank.bankName}) [${activeBank.accountNumber}]`
              : `UPI Gateway [${activeUpi.upiId}]`,
          txHash: cleanUtr,
          upiId: paymentMode === 'upi' ? activeUpi.upiId : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        if (onSuccess) {
          setTimeout(onSuccess, 2500);
        }
      } else {
        setErrorMessage(data.error || 'Failed to submit deposit. Please check UTR and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error submitting UTR');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [200, 500, 1000, 2000, 5000, 10000];

  return (
    <div className="min-h-screen bg-[#060b17] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Gateway Navbar */}
      <header className="bg-[#0b152d]/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-lg bg-[#0e1f42] hover:bg-cyan-500/20 border border-blue-900/40 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-black font-black text-sm shadow-md shadow-cyan-500/30">
                ⚡
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wide flex items-center gap-1.5 text-white">
                  <span>PAYMENT GATEWAY</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    LIVE
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono">
                  Order ID: <span className="text-cyan-300 font-bold">{activeUpi.sessionTxnId}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#07132b] px-3 py-1.5 rounded-xl border border-blue-900/50">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-semibold">256-Bit SSL Encrypted</span>
            <span className="sm:hidden font-semibold">Secure</span>
          </div>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Summary & Amount Selection */}
        <div className="md:col-span-5 space-y-4">
          {/* Amount Card */}
          <div className="bg-[#0b1633] border border-blue-900/50 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Payable Amount</span>
              <span className="text-emerald-400 font-bold">Zero Fee Deposit</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                ₹{amount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                100% Pure INR Instant Gateway
              </span>
            </div>

            {/* Quick Amount Pills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400">Change Amount</div>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all ${
                      amount === amt
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052723] shadow-md'
                        : 'bg-[#081229] border border-blue-900/40 text-slate-300 hover:border-cyan-500/30'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Deposit Bonus Preview */}
            {(() => {
              const bonusCfg = settings?.depositBonus;
              if (!bonusCfg?.enabled) return null;
              if (bonusCfg.applyTo === 'first_deposit_only' && user?.hasFirstDepositApproved) return null;
              const activeTiers = (bonusCfg.tiers || [])
                .filter((t) => t.enabled !== false && Number(t.bonusValue) > 0)
                .sort((a, b) => Number(a.minAmount) - Number(b.minAmount));
              if (activeTiers.length === 0) return null;

              const matched = [...activeTiers]
                .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))
                .find((t) => amount >= Number(t.minAmount));
              const bonusInr = matched
                ? matched.bonusType === 'fixed'
                  ? Number(matched.bonusValue)
                  : (amount * Number(matched.bonusValue)) / 100
                : 0;

              return (
                <div className="bg-[#07211d] border border-emerald-500/35 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">🎁 Deposit Bonus</span>
                    <span className="font-black text-amber-300">
                      {bonusInr > 0 ? `+₹${bonusInr.toFixed(0)} Extra!` : `From ₹${activeTiers[0].minAmount}+`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTiers.map((t) => (
                      <span
                        key={t.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          matched?.id === t.id
                            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                            : 'bg-[#081229] text-slate-400 border-slate-700'
                        }`}
                      >
                        ≥₹{t.minAmount}: +{t.bonusType === 'fixed' ? `₹${t.bonusValue}` : `${t.bonusValue}%`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Expiry Countdown Box */}
            <div className="bg-[#081229] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Expires in:</span>
              </div>
              <div className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                {formatTimer(countdownSeconds)}
              </div>
            </div>
          </div>

          {/* Dynamic Rotation Badge & Switch UPI Card */}
          <div className="bg-[#0b1633] border border-cyan-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wide">
                  Dynamic UPI Rotation Pool
                </span>
              </div>
              <button
                onClick={fetchRotatingUpi}
                disabled={loadingUpi}
                className="px-2.5 py-1 rounded-lg bg-[#0e214d] hover:bg-cyan-500/20 text-cyan-300 font-bold text-[11px] transition flex items-center gap-1 border border-cyan-500/30 active:scale-95 disabled:opacity-50"
                title="Get another UPI ID from pool"
              >
                <RotateCw className={`w-3 h-3 ${loadingUpi ? 'animate-spin' : ''}`} />
                <span>Switch UPI</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every deposit request automatically receives a fresh UPI ID from our active rotating pool for maximum payment success and privacy.
            </p>

            <div className="bg-[#071026] rounded-xl p-2.5 border border-blue-900/40 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="text-slate-400">Pool Provider:</span>
              <span className="text-cyan-400 font-bold">{activeUpi.provider || 'UPI Bank'}</span>
            </div>
          </div>

          {/* Step-by-Step Payment Instructions */}
          <div className="bg-[#07132e] border border-blue-900/40 rounded-2xl p-4 text-xs space-y-2.5 text-slate-300">
            <h3 className="font-black text-white flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <span>Quick Payment Guide</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
              <li>Scan the QR code or tap any UPI app below.</li>
              <li>Make the exact payment of <strong className="text-white">₹{amount}</strong>.</li>
              <li>Copy the <strong className="text-cyan-300">12-digit UTR / Ref No.</strong> from payment receipt.</li>
              <li>Paste the UTR number in the box and tap <strong className="text-emerald-400">Submit UTR</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: QR Code, Direct UPI Apps & 12-Digit UTR Form */}
        <div className="md:col-span-7 space-y-4">
          {/* Payment Success View */}
          {isSuccess ? (
            <div className="bg-[#0b1633] border border-emerald-500/50 rounded-2xl p-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-white">Payment UTR Submitted!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                Thank you! Your 12-digit UTR has been recorded for UPI <span className="font-mono text-cyan-300">{activeUpi.upiId}</span>. Your wallet balance will be credited as soon as verified.
              </p>
              <div className="pt-2">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] font-black text-xs hover:brightness-105 active:scale-95 transition"
                  >
                    Back to Games
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {hasBankTransfer && (
                <div className="grid grid-cols-2 gap-2 bg-[#0b1633] border border-blue-900/60 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      paymentMode === 'upi'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI / QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('bank')}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      paymentMode === 'bank'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bank Account (IMPS/NEFT)</span>
                  </button>
                </div>
              )}

              {paymentMode === 'bank' && hasBankTransfer && activeBank ? (
                <div className="bg-[#0b1633] border border-cyan-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
                    <div className="flex items-center gap-2 text-sm font-black text-cyan-300">
                      <Building2 className="w-4 h-4" />
                      <span>Direct Bank Account Deposit</span>
                    </div>
                    <span className="text-xs font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { key: 'bankName', label: 'Bank Name', value: activeBank.bankName },
                      { key: 'holder', label: 'Account Holder Name', value: activeBank.accountHolderName },
                      { key: 'accNo', label: 'Account Number', value: activeBank.accountNumber, mono: true },
                      { key: 'ifsc', label: 'IFSC Code', value: activeBank.ifscCode, mono: true },
                      ...(activeBank.branchName ? [{ key: 'branch', label: 'Branch', value: activeBank.branchName }] : []),
                    ].map((row) => (
                      <div
                        key={row.key}
                        className="bg-[#071126] border border-blue-900/60 rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{row.label}</div>
                          <div className={`font-bold text-white truncate mt-0.5 ${row.mono ? 'font-mono text-cyan-300 text-sm' : ''}`}>
                            {row.value}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(row.value, row.key)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] font-black text-xs flex items-center gap-1 shrink-0"
                        >
                          {copiedKey === row.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === row.key ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
              /* QR Code Presentation Box */
              <div className="bg-[#0b1633] border border-blue-900/60 rounded-2xl p-5 text-center space-y-4 shadow-xl">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Scan & Pay with Any UPI App</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PhonePe • Google Pay • Paytm • BHIM • Cred
                  </div>
                </div>

                {/* QR Code with custom glow */}
                <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-2xl flex items-center justify-center relative border-4 border-cyan-400/80 group">
                  {loadingUpi ? (
                    <div className="flex flex-col items-center gap-2 text-slate-700">
                      <RotateCw className="w-6 h-6 animate-spin text-cyan-600" />
                      <span className="text-xs font-bold">Loading UPI...</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={qrImageUrl}
                        alt="Payment QR Code"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-1 border border-slate-200">
                          <span className="text-[11px] font-black text-[#002e6e]">UPI</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Allocated Rotating UPI VPA Box */}
                <div className="bg-[#071126] border border-blue-900/60 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <span>Allocated UPI ID (VPA):</span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <div className="font-mono font-black text-sm text-cyan-300 truncate mt-0.5">
                      {activeUpi.upiId}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Payee: <strong className="text-white">{activeUpi.payeeName}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(activeUpi.upiId, 'upiId')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 active:scale-95 text-[#052822] font-black text-xs transition flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {copiedKey === 'upiId' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy VPA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct 1-Tap UPI Mobile App Buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 text-left">
                    Or Tap to Open UPI App Directly on Mobile:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href={upiPayUrl}
                      className="py-2.5 px-2 rounded-xl bg-[#0e214d] hover:bg-[#132d66] border border-blue-800/40 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      <span>PhonePe</span>
                    </a>
                    <a
                      href={upiPayUrl}
                      className="py-2.5 px-2 rounded-xl bg-[#0e214d] hover:bg-[#132d66] border border-blue-800/40 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      <span>GPay</span>
                    </a>
                    <a
                      href={upiPayUrl}
                      className="py-2.5 px-2 rounded-xl bg-[#0e214d] hover:bg-[#132d66] border border-blue-800/40 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      <span>Paytm</span>
                    </a>
                    <a
                      href={upiPayUrl}
                      className="py-2.5 px-2 rounded-xl bg-[#0e214d] hover:bg-[#132d66] border border-blue-800/40 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Other UPI</span>
                    </a>
                  </div>
                </div>
              </div>
              )}

              {/* 12-Digit UTR Submission Form */}
              <div className="bg-[#0b1633] border border-blue-900/60 rounded-2xl p-5 shadow-xl space-y-3">
                <form onSubmit={handleSubmitUtr} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Enter 12-Digit UTR / Transaction Ref No.</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">Mandatory</span>
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. 410293847592 or UPI Ref Number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      maxLength={32}
                      className="w-full px-4 py-3 rounded-xl bg-[#071126] border border-cyan-500/40 text-white font-mono text-sm sm:text-base focus:outline-none focus:border-cyan-400 transition tracking-wider"
                    />

                    <p className="text-[11px] text-slate-400 leading-tight">
                      Open your UPI app payment receipt and find the 12-digit number listed under <span className="text-cyan-300 font-bold">UPI Ref No</span> or <span className="text-cyan-300 font-bold">UTR</span>.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || utrNumber.trim().length < 6}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 active:scale-95 disabled:opacity-50 text-[#052822] font-black text-sm shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Verifying 12-Digit UTR...</span>
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
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 px-4 py-3 text-center text-[11px] text-slate-500">
        Secure Payment Gateway & Rotating UPI Pool • Automated Order Verification
      </footer>
    </div>
  );
};
