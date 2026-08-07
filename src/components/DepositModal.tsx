import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, Copy, Check } from 'lucide-react';
import { SystemSettings } from '../types';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSubmitDeposit: (amount: number, network: string, txHash: string) => Promise<void>;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSubmitDeposit,
}) => {
  const [amount, setAmount] = useState('100');
  const network = 'BEP20';
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

  const address = settings.walletAddresses['BEP20'] || settings.walletAddresses.BEP20 || '0xBEP20AdminWalletAddress0000000000';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 10 || !txHash) return;

    setSubmitting(true);
    try {
      await onSubmitDeposit(parseFloat(amount), network, txHash);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
      <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
        <div className="bg-[#0b1424] border border-emerald-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
            <ArrowDownLeft className="w-4 h-4" />
            Instant Crypto Deposit (USDT)
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-300 font-bold uppercase">Network</label>
            <div className="w-full py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl font-bold text-emerald-300 flex items-center justify-between text-xs">
              <span>USDT - BEP20 (BNB Smart Chain)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-extrabold uppercase">BEP20</span>
            </div>
          </div>

          <div className="bg-[#050911] border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Admin Deposit Address ({network})</span>
              <span className="text-emerald-400">Official</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-[#0d1726] border border-slate-700 rounded-lg p-2 text-[11px] text-cyan-300">
              <span className="truncate">{address}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-emerald-400 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-[#0c1829] border border-[#0ef]/30 rounded-xl p-3 text-xs text-slate-300">
            <span className="text-[#0ef] font-bold block mb-0.5">ℹ️ Deposit Wallet Notice:</span>
            Approved deposits will be credited to your <strong className="text-[#0ef]">Deposit Wallet</strong>. Use this balance to activate Node Mining Packages.
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold">Deposit Amount ($ USDT)</label>
            <input
              type="number"
              min={10}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold">Transaction Hash / TXID</label>
            <input
              type="text"
              required
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold transition shadow-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Deposit Notification'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
};
